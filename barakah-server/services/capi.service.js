/**
 * ============================================================================
 * FILE: capi.service.js
 * VERSION: v1.0.0
 * ----------------------------------------------------------------------------
 * USER REQUIREMENT:
 * Server-side tracking (CAPI) for Facebook (Meta) and TikTok with live hosting,
 * test event code support, event deduplication, and secure token dispatch.
 *
 * IMPLEMENTATION DETAILS:
 * - SHA-256 hashing for customer phone and email adhering to Meta/TikTok standards.
 * - Handles client IP, user-agent, fbclid, ttclid, fbp, fbc cookies.
 * - Deduplication via unique event_id matching client-side order ID.
 * - Non-blocking async execution ensuring zero delay to checkout flow.
 * - Backward compatibility: Silent failover on invalid tokens without crashing.
 * ============================================================================
 */

const crypto = require("crypto");

const BD_LOCATIONS = [
  { keywords: ["chittagong", "chattogram", "চট্টগ্রাম"], city: "chattogram", zip: "4000" },
  { keywords: ["sylhet", "সিলেট"], city: "sylhet", zip: "3100" },
  { keywords: ["rajshahi", "রাজশাহী"], city: "rajshahi", zip: "6000" },
  { keywords: ["khulna", "খুলনা"], city: "khulna", zip: "9000" },
  { keywords: ["barisal", "barishal", "বরিশাল"], city: "barisal", zip: "8200" },
  { keywords: ["rangpur", "রংপুর"], city: "rangpur", zip: "5400" },
  { keywords: ["mymensingh", "ময়মনসিংহ", "ময়মনসিংহ"], city: "mymensingh", zip: "2200" },
  { keywords: ["gazipur", "গাজীপুর", "tongi", "টঙ্গী"], city: "gazipur", zip: "1700" },
  { keywords: ["narayanganj", "নারায়ণগঞ্জ", "নারায়ণগঞ্জ"], city: "narayanganj", zip: "1400" },
  { keywords: ["cumilla", "comilla", "কুমিল্লা"], city: "cumilla", zip: "3500" },
  { keywords: ["bogura", "bogra", "বগুড়া", "বগুড়া"], city: "bogura", zip: "5800" },
  { keywords: ["jessore", "jashore", "যশোর"], city: "jessore", zip: "7400" },
  { keywords: ["cox", "কক্সবাজার"], city: "coxs bazar", zip: "4700" },
  { keywords: ["savar", "সাভার", "ashulia", "আশুলিয়া", "আশুলিয়া"], city: "savar", zip: "1340" },
  { keywords: ["tangail", "টাঙ্গাইল"], city: "tangail", zip: "1900" },
  { keywords: ["narsingdi", "নরসিংদী"], city: "narsingdi", zip: "1600" },
  { keywords: ["brahmanbaria", "ব্রাহ্মণবাড়িয়া", "ব্রাহ্মণবাড়িয়া"], city: "brahmanbaria", zip: "3400" },
  { keywords: ["feni", "ফেনী"], city: "feni", zip: "3900" },
  { keywords: ["noakhali", "নোয়াখালী", "নোয়াখালী"], city: "noakhali", zip: "3800" },
  { keywords: ["pabna", "পাবনা"], city: "pabna", zip: "6600" },
  { keywords: ["dinajpur", "দিনাজপুর"], city: "dinajpur", zip: "5200" },
  { keywords: ["kushtia", "কুষ্টিয়া", "কুষ্টিয়া"], city: "kushtia", zip: "7000" },
  { keywords: ["faridpur", "ফরিদপুর"], city: "faridpur", zip: "7800" },
  { keywords: ["sirajganj", "সিরাজগঞ্জ"], city: "sirajganj", zip: "6700" },
  { keywords: ["chandpur", "চাঁদপুর"], city: "chandpur", zip: "3600" },
  { keywords: ["jamalpur", "জামালপুর"], city: "jamalpur", zip: "2000" },
  { keywords: ["dhaka", "ঢাকা", "mirpur", "মিরপুর", "uttara", "উত্তরা", "dhanmondi", "ধানমন্ডি", "gulshan", "গুলশান", "banani", "বনানী", "mohammadpur", "মোহাম্মদপুর", "badda", "বাড্ডা", "motijheel", "মতিঝিল"], city: "dhaka", zip: "1200" },
];

function hashData(value) {
  if (!value) return null;
  const cleaned = String(value).trim().toLowerCase();
  return crypto.createHash("sha256").update(cleaned).digest("hex");
}

function normalizePhoneDigits(phone) {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("01") && digits.length === 11) {
    digits = "88" + digits;
  }
  return digits;
}

function resolveLocation(address) {
  if (!address) return { city: "dhaka", zip: "1200" };
  const lower = String(address).toLowerCase();
  const matched = BD_LOCATIONS.find((loc) =>
    loc.keywords.some((kw) => lower.includes(kw))
  );
  return matched ? { city: matched.city, zip: matched.zip } : { city: "dhaka", zip: "1200" };
}

function resolveClientIp(rawIp) {
  if (!rawIp) return "127.0.0.1";
  return String(rawIp).split(",")[0].trim() || "127.0.0.1";
}

async function sendMetaCapiPurchase({ order, metaConfig, clientIp, userAgent }) {
  try {
    if (!metaConfig || !metaConfig.isEnabled || !metaConfig.isCapiEnabled) {
      return { skipped: true, reason: "Meta CAPI is not enabled" };
    }

    const { pixelId, capiAccessToken, testEventCode } = metaConfig;

    if (!pixelId || !capiAccessToken) {
      return { skipped: true, reason: "Missing Pixel ID or CAPI Access Token" };
    }

    const eventId = String(order._id || order.orderId || `order_${Date.now()}`);
    const eventTime = Math.floor(Date.now() / 1000);

    const nameParts = (order.customerName || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const normalizedPhone = normalizePhoneDigits(order.phone);
    const externalId = normalizedPhone ? hashData(normalizedPhone) : null;

    const userData = {
      client_ip_address: resolveClientIp(clientIp),
      client_user_agent: userAgent || "Mozilla/5.0",
      country: [hashData("bd")],
    };

    if (externalId) userData.external_id = [externalId];
    if (normalizedPhone) userData.ph = [hashData(normalizedPhone)];
    if (order.email) userData.em = [hashData(order.email)];
    if (firstName) userData.fn = [hashData(firstName)];
    if (lastName) userData.ln = [hashData(lastName)];

    const { city, zip } = resolveLocation(order.address);
    const cityHash = hashData(city);
    userData.ct = [cityHash];
    userData.st = [cityHash];
    userData.zp = [hashData(zip)];

    const resolvedFbc = order.fbc || (order.fbclid ? `fb.1.${Date.now()}.${order.fbclid}` : "");
    if (resolvedFbc && String(resolvedFbc).startsWith("fb.")) userData.fbc = String(resolvedFbc);
    if (order.fbp && String(order.fbp).startsWith("fb.")) userData.fbp = String(order.fbp);

    const contents = (order.items || []).map((item) => ({
      id: String(
        item.selectedVariationId
          ? `${item.productId || item._id}_${item.selectedVariationId}`
          : (item.productId || item._id || "")
      ),
      title: item.variationTitle ? `${item.name} (${item.variationTitle})` : (item.name || ""),
      quantity: Number(item.quantity || 1),
      item_price: Number(item.price || 0),
    }));

    const eventData = {
      event_name: "Purchase",
      event_time: eventTime,
      event_id: eventId,
      action_source: "website",
      event_source_url: order.eventSourceUrl || "https://sashroyi.shop/checkout",
      user_data: userData,
      custom_data: {
        currency: "BDT",
        value: Number(order.total || 0),
        content_type: "product",
        contents: contents,
        order_id: eventId,
        num_items: (order.items || []).reduce((acc, i) => acc + (Number(i.quantity) || 1), 0),
      },
    };

    const payload = { data: [eventData] };
    if (testEventCode && testEventCode.trim() !== "") {
      payload.test_event_code = testEventCode.trim();
    }

    const url = `https://graph.facebook.com/v19.0/${pixelId.trim()}/events?access_token=${capiAccessToken.trim()}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log("[META CAPI RESPONSE]:", JSON.stringify(result));
    return result;
  } catch (error) {
    console.error("[META CAPI ERROR]:", error.message);
    return { error: error.message };
  }
}

async function sendMetaCapiGenericEvent({ eventName, eventId, eventSourceUrl, customData, userParams = {}, metaConfig, clientIp, userAgent }) {
  try {
    if (!metaConfig || !metaConfig.isEnabled || !metaConfig.isCapiEnabled) {
      return { skipped: true, reason: "Meta CAPI is not enabled" };
    }

    const { pixelId, capiAccessToken, testEventCode } = metaConfig;
    if (!pixelId || !capiAccessToken) {
      return { skipped: true, reason: "Missing Pixel ID or CAPI Access Token" };
    }

    const finalEventId = String(eventId || `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
    const eventTime = Math.floor(Date.now() / 1000);

    const userData = {
      client_ip_address: resolveClientIp(clientIp),
      client_user_agent: userAgent || "Mozilla/5.0",
      country: [hashData("bd")],
    };

    const normalizedPhone = normalizePhoneDigits(userParams.phone);
    if (normalizedPhone) {
      userData.ph = [hashData(normalizedPhone)];
      userData.external_id = [hashData(normalizedPhone)];
    } else if (userParams.externalId) {
      userData.external_id = [hashData(String(userParams.externalId))];
    }

    if (userParams.email) userData.em = [hashData(userParams.email)];
    const { city, zip } = resolveLocation(userParams.address || userParams.city);
    const cityHash = hashData(city);
    userData.ct = [cityHash];
    userData.st = [cityHash];
    userData.zp = [hashData(zip)];

    if (userParams.fbc && String(userParams.fbc).startsWith("fb.")) userData.fbc = String(userParams.fbc);
    if (userParams.fbp && String(userParams.fbp).startsWith("fb.")) userData.fbp = String(userParams.fbp);

    const eventData = {
      event_name: eventName,
      event_time: eventTime,
      event_id: finalEventId,
      action_source: "website",
      event_source_url: eventSourceUrl || "https://sashroyi.shop",
      user_data: userData,
      custom_data: customData || {},
    };

    const payload = { data: [eventData] };
    if (testEventCode && testEventCode.trim() !== "") {
      payload.test_event_code = testEventCode.trim();
    }

    const url = `https://graph.facebook.com/v19.0/${pixelId.trim()}/events?access_token=${capiAccessToken.trim()}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (error) {
    console.error(`[META CAPI ${eventName} ERROR]:`, error.message);
    return { error: error.message };
  }
}

async function sendTikTokEventsApiPurchase({ order, tiktokConfig, clientIp, userAgent }) {
  try {
    if (!tiktokConfig || !tiktokConfig.isEnabled || !tiktokConfig.isCapiEnabled) {
      return { skipped: true, reason: "TikTok Events API is not enabled" };
    }

    const { pixelId, accessToken, testEventCode } = tiktokConfig;

    if (!pixelId || !accessToken) {
      return { skipped: true, reason: "Missing TikTok Pixel ID or Access Token" };
    }

    const eventId = String(order._id || order.orderId || `order_${Date.now()}`);
    const eventTime = new Date().toISOString();

    const userObj = {
      ip: clientIp || "127.0.0.1",
      user_agent: userAgent || "Mozilla/5.0",
    };

    if (order.phone) {
      let digits = String(order.phone).replace(/\D/g, "");
      if (digits.startsWith("01") && digits.length === 11) digits = "88" + digits;
      userObj.phone_number = hashData(digits);
      userObj.external_id = hashData(digits);
    }
    if (order.email) userObj.email = hashData(order.email);
    if (order.ttclid) userObj.ttclid = order.ttclid;

    const contents = (order.items || []).map((item) => ({
      content_id: String(item.productId || item._id || ""),
      content_type: "product",
      content_name: item.name || "",
      quantity: Number(item.quantity || 1),
      price: Number(item.price || 0),
    }));

    const eventData = {
      event: "CompletePayment",
      event_id: eventId,
      timestamp: eventTime,
      user: userObj,
      properties: {
        currency: "BDT",
        value: Number(order.total || 0),
        contents: contents,
      },
    };

    const payload = {
      pixel_code: pixelId.trim(),
      event: eventData.event,
      event_id: eventData.event_id,
      timestamp: eventData.timestamp,
      user: eventData.user,
      properties: eventData.properties,
    };

    if (testEventCode && testEventCode.trim() !== "") {
      payload.test_event_code = testEventCode.trim();
    }

    const url = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": accessToken.trim(),
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log("[TIKTOK EVENTS API RESPONSE]:", JSON.stringify(result));
    return result;
  } catch (error) {
    console.error("[TIKTOK EVENTS API ERROR]:", error.message);
    return { error: error.message };
  }
}

module.exports = {
  sendMetaCapiPurchase,
  sendMetaCapiGenericEvent,
  sendTikTokEventsApiPurchase,
};
