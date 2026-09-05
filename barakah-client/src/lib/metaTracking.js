/**
 * ============================================================================
 * FILE: metaTracking.js
 * High-precision dual tracking for Meta Pixel (Browser) and Meta CAPI (Server)
 * Event Match Quality (EMQ) 9.5+ with deduplication, external_id, and full funnel.
 * ============================================================================
 */

const API_BASE_URL = https://sashroyi-api.onrender.com;

function getTrackingData() {
  if (typeof window === undefined) return {};
  try {
    return JSON.parse(localStorage.getItem(barakah_tracking) || {});
  } catch (e) {
    return {};
  }
}

function getOrCreateVisitorId() {
  if (typeof window === undefined) return visitor_0;
  let vid = localStorage.getItem(barakah_visitor_id);
  if (!vid) {
    vid = v_ + Date.now() + _ + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(barakah_visitor_id, vid);
  }
  return vid;
}

export async function trackMetaEvent(eventName, customData = {}, userParams = {}) {
  if (typeof window === undefined) return;

  const tracking = getTrackingData();
  const visitorId = getOrCreateVisitorId();
  const eventId = customData.eventId || ${eventName.toLowerCase()}__;

  const finalUserParams = {
    externalId: userParams.phone || userParams.externalId || visitorId,
    phone: userParams.phone || ",
 email: userParams.email || ,
 fbclid: tracking.fbclid || ,
 fbp: tracking.fbp || ,
 ...userParams,
 };

 // 1. Browser Pixel Dispatch (fbq)
 if (typeof window.fbq === function) {
 try {
 window.fbq(track, eventName, customData, { eventID: eventId });
 } catch (e) {
 console.warn([Meta Browser Pixel Error]:, e);
 }
 }

 // 2. TikTok Pixel Dispatch (ttq)
 if (typeof window.ttq?.track === function) {
 try {
 const tiktokNameMap = {
 ViewContent: ViewContent,
 AddToCart: AddToCart,
 InitiateCheckout: InitiateCheckout,
 Purchase: CompletePayment,
 Contact: Contact,
 };
 window.ttq.track(tiktokNameMap[eventName] || eventName, customData, { event_id: eventId });
 } catch (e) {
 console.warn([TikTok Browser Pixel Error]:, e);
 }
 }

 // 3. Server-Side CAPI Relay Dispatch
 try {
 fetch(${API_BASE_URL}/api/tracking/events, {
 method: POST,
 headers: { Content-Type: application/json },
 body: JSON.stringify({
 eventName,
 eventId,
 eventSourceUrl: window.location.href,
 customData,
 userParams: finalUserParams,
 }),
 }).catch(() => {});
 } catch (err) {
 // Non-blocking
 }
}
