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

function hashData(value) {
  if (!value) return null;
  const cleaned = String(value).trim().toLowerCase();
  return crypto.createHash("sha256").update(cleaned).digest("hex");
}

function formatPhone(phone) {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("01") && digits.length === 11) {
    digits = "88" + digits;
  }
  return hashData(digits);
}

function formatCity(address) {
  if (!address) return null;
  const lower = String(address).toLowerCase();
  if (lower.includes("dhaka") || lower.includes("ঢাকা")) return hashData("dhaka");
  if (lower.includes("chittagong") || lower.includes("chattogram") || lower.includes("চট্টগ্রাম")) return hashData("chattogram");
  if (lower.includes("sylhet") || lower.includes("সিলেট")) return hashData("sylhet");
  if (lower.includes("rajshahi") || lower.includes("রাজশাহী")) return hashData("rajshahi");
  if (lower.includes("khulna") || lower.includes("খুলনা")) return hashData("khulna");
  if (lower.includes("barisal") || lower.includes("বরিশাল")) return hashData("barisal");
  if (lower.includes("rangpur") || lower.includes("রংপুর")) return hashData("rangpur");
  if (lower.includes("mymensingh") || lower.includes("ময়মনসিংহ")) return hashData("mymensingh");
  if (lower.includes("narayanganj") || lower.includes("নারায়ণগঞ্জ")) return hashData("narayanganj");
  if (lower.includes("gazipur") || lower.includes("গাজীপুর")) return hashData("gazipur");
  if (lower.includes("cumilla") || lower.includes("কুমিল্লা")) return hashData("cumilla");
  return null;
}

function formatZip(address) {
  if (!address) return hashData("1200");
  const lower = String(address).toLowerCase();
  if (lower.includes("chittagong") || lower.includes("chattogram") || lower.includes("চট্টগ্রাম")) return hashData("4000");
  if (lower.includes("sylhet") || lower.includes("সিলেট")) return hashData("3100");
  if (lower.includes("rajshahi") || lower.includes("রাজশাহী")) return hashData("6000");
  if (lower.includes("khulna") || lower.includes("খুলনা")) return hashData("9000");
  if (lower.includes("barisal") || lower.includes("বরিশাল")) return hashData("8200");
  if (lower.includes("rangpur") || lower.includes("রংপুর")) return hashData("5400");
  if (lower.includes("mymensingh") || lower.includes("ময়মনসিংহ")) return hashData("2200");
  if (lower.includes("gazipur") || lower.includes("গাজীপুর")) return hashData("1700");
  if (lower.includes("narayanganj") || lower.includes("নারায়ণগঞ্জ")) return hashData("1400");
  if (lower.includes("cumilla") || lower.includes("comilla") || lower.includes("কুমিল্লা")) return hashData("3500");
  if (lower.includes("bogura") || lower.includes("bogra") || lower.includes("বগুড়া")) return hashData("5800");
  if (lower.includes("jessore") || lower.includes("যশোর")) return hashData("7400");
  if (lower.includes("cox") || lower.includes("কক্সবাজার")) return hashData("4700");
  return hashData("1200");
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

    const externalId = order.phone ? hashData(String(order.phone).replace(/\D/g, "")) : null;

    const userData = {
      client_ip_address: clientIp || "127.0.0.1",
      client_user_agent: userAgent || "Mozilla/5.0",
      country: [hashData("bd")],
    };

    if (externalId) userData.external_id = [externalId];
    if (order.phone) userData.ph = [formatPhone(order.phone)];
    if (order.email) {
      userData.em = [hashData(order.email)];
    } else if (order.phone) {
      userData.em = [hashData(String(order.phone).replace(/\D/g, "") + "@sashroyi.shop")];
    }
    if (firstName) userData.fn = [hashData(firstName)];
    if (lastName) userData.ln = [hashData(lastName)];
    const cityHash = formatCity(order.address);
    if (cityHash) {
      userData.ct = [cityHash];
      userData.st = [cityHash];
    }
    userData.zp = [formatZip(order.address)];
    if (order.fbclid) userData.fbc = `fb.1.${Date.now()}.${order.fbclid}`;
    if (order.fbp) userData.fbp = order.fbp;

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
      client_ip_address: clientIp || "127.0.0.1",
      client_user_agent: userAgent || "Mozilla/5.0",
      country: [hashData("bd")],
    };

    if (userParams.phone) {
      userData.ph = [formatPhone(userParams.phone)];
      userData.external_id = [hashData(String(userParams.phone).replace(/\D/g, ""))];
    } else if (userParams.externalId) {
      userData.external_id = [hashData(String(userParams.externalId))];
    }

    if (userParams.email) userData.em = [hashData(userParams.email)];
    if (userParams.fbc) userData.fbc = userParams.fbc;
    if (userParams.fbp) userData.fbp = userParams.fbp;

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
