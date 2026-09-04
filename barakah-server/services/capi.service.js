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

    const userData = {
      client_ip_address: clientIp || "127.0.0.1",
      client_user_agent: userAgent || "Mozilla/5.0",
    };

    if (order.phone) userData.ph = [formatPhone(order.phone)];
    if (order.email) userData.em = [hashData(order.email)];
    if (order.customerName) userData.fn = [hashData(order.customerName.split(" ")[0])];
    if (order.fbclid) userData.fbc = `fb.1.${Date.now()}.${order.fbclid}`;
    if (order.fbp) userData.fbp = order.fbp;

    const contents = (order.items || []).map((item) => ({
      id: String(item.productId || item._id || ""),
      quantity: Number(item.quantity || 1),
      item_price: Number(item.price || 0),
    }));

    const eventData = {
      event_name: "Purchase",
      event_time: eventTime,
      event_id: eventId,
      action_source: "website",
      event_source_url: "https://ghor.niorashopping.com/checkout",
      user_data: userData,
      custom_data: {
        currency: "BDT",
        value: Number(order.total || 0),
        content_type: "product",
        contents: contents,
        order_id: eventId,
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
  sendTikTokEventsApiPurchase,
};
