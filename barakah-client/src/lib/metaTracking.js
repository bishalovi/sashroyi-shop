/**
 * ============================================================================
 * FILE: metaTracking.js
 * High-precision dual tracking for Meta Pixel (Browser) and Meta CAPI (Server)
 * Ensures 100% _fbp coverage, persistent _fbc, customer profile reuse,
 * Browser Advanced Matching, and clean event_id deduplication.
 * ============================================================================
 */

const DEFAULT_PIXEL_ID = "3090216584507410";
const COOKIE_MAX_AGE_90D = 90 * 24 * 60 * 60;

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

function resolveLocation(address) {
  if (!address) return { city: "dhaka", zip: "1200" };
  const lower = String(address).toLowerCase();
  const matched = BD_LOCATIONS.find((loc) =>
    loc.keywords.some((kw) => lower.includes(kw))
  );
  return matched ? { city: matched.city, zip: matched.zip } : { city: "dhaka", zip: "1200" };
}

function getCookie(name) {
  if (typeof document === "undefined") return "";
  try {
    const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[1]) : "";
  } catch {
    return "";
  }
}

function setCookie(name, value, maxAgeSeconds = COOKIE_MAX_AGE_90D) {
  if (typeof document === "undefined" || !value) return;
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  } catch {
    // Non-blocking
  }
}

function getTrackingData() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("barakah_tracking") || "{}");
  } catch {
    return {};
  }
}

function normalizePhoneForMeta(phone) {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("01") && digits.length === 11) {
    digits = "88" + digits;
  }
  return digits;
}

/**
 * Ensures _fbp exists synchronously before both Browser Pixel and Server CAPI fire,
 * preventing 40-60% missing fbp on first pageview / early events.
 */
export function getOrCreateFbp() {
  if (typeof window === "undefined") return "";
  try {
    let fbp = getCookie("_fbp") || localStorage.getItem("barakah_fbp") || "";
    if (!fbp || !fbp.startsWith("fb.")) {
      const random10Digits = Math.floor(1000000000 + Math.random() * 9000000000);
      fbp = `fb.1.${Date.now()}.${random10Digits}`;
    }
    setCookie("_fbp", fbp);
    localStorage.setItem("barakah_fbp", fbp);
    return fbp;
  } catch {
    return "";
  }
}

/**
 * Resolves a stable _fbc Click ID from cookie, tracking storage, or URL fbclid.
 */
export function getResolvedFbc() {
  if (typeof window === "undefined") return "";
  try {
    const cookieFbc = getCookie("_fbc");
    if (cookieFbc && cookieFbc.startsWith("fb.")) return cookieFbc;

    const tracking = getTrackingData();
    if (tracking.fbc && tracking.fbc.startsWith("fb.")) {
      setCookie("_fbc", tracking.fbc);
      return tracking.fbc;
    }

    if (tracking.fbclid) {
      const createdAt = tracking.updated_at || Date.now();
      const fbc = `fb.1.${createdAt}.${tracking.fbclid}`;
      setCookie("_fbc", fbc);
      localStorage.setItem(
        "barakah_tracking",
        JSON.stringify({ ...tracking, fbc })
      );
      return fbc;
    }
    return "";
  } catch {
    return "";
  }
}

function getOrCreateVisitorId() {
  if (typeof window === "undefined") return "visitor_0";
  try {
    let vid = localStorage.getItem("barakah_visitor_id") || getCookie("barakah_visitor_id");
    if (!vid) {
      vid = "v_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
    }
    localStorage.setItem("barakah_visitor_id", vid);
    setCookie("barakah_visitor_id", vid, 365 * 24 * 60 * 60);
    return vid;
  } catch {
    return "visitor_0";
  }
}

/**
 * Persists known customer profile (phone, name, email, address) so returning visitors
 * and post-checkout events benefit from stronger Meta matching.
 */
export function saveCustomerProfile(profile = {}) {
  if (typeof window === "undefined") return;
  try {
    const existing = JSON.parse(localStorage.getItem("barakah_customer_profile") || "{}");
    const updated = {
      name: (profile.name || existing.name || "").trim(),
      phone: (profile.phone || existing.phone || "").trim(),
      email: (profile.email || existing.email || "").trim(),
      address: (profile.address || existing.address || "").trim(),
    };
    if (updated.name || updated.phone || updated.email || updated.address) {
      localStorage.setItem("barakah_customer_profile", JSON.stringify(updated));
    }
  } catch {
    // Non-blocking
  }
}

function getSavedCustomerProfile() {
  if (typeof window === "undefined") return {};
  try {
    const savedProfile = JSON.parse(localStorage.getItem("barakah_customer_profile") || "{}");
    const authUser = JSON.parse(localStorage.getItem("barakahUser") || "{}");
    return {
      name: savedProfile.name || authUser.name || "",
      phone: savedProfile.phone || authUser.phone || "",
      email: savedProfile.email || authUser.email || "",
      address: savedProfile.address || authUser.address || "",
    };
  } catch {
    return {};
  }
}

export function getTrackingContext() {
  if (typeof window === "undefined") return {};
  const tracking = getTrackingData();
  return {
    fbp: getOrCreateFbp(),
    fbc: getResolvedFbc(),
    fbclid: tracking.fbclid || "",
    visitorId: getOrCreateVisitorId(),
  };
}

function buildBrowserAdvancedMatching(userParams) {
  const am = { country: "bd" };
  const cleanPhone = normalizePhoneForMeta(userParams.phone);
  if (cleanPhone) {
    am.ph = cleanPhone;
    am.external_id = cleanPhone;
  } else if (userParams.externalId) {
    am.external_id = String(userParams.externalId);
  }
  if (userParams.email) {
    am.em = String(userParams.email).trim().toLowerCase();
  }
  if (userParams.name) {
    const parts = String(userParams.name).trim().toLowerCase().split(/\s+/);
    if (parts[0]) am.fn = parts[0];
    if (parts.length > 1) am.ln = parts.slice(1).join(" ");
  }

  // City, State, and ZIP for 100% Browser Match Quality
  const loc = resolveLocation(userParams.address || userParams.city);
  if (loc.city) {
    am.ct = loc.city.replace(/[^a-z]/g, "");
    am.st = loc.city.replace(/[^a-z]/g, "");
  }
  if (loc.zip) {
    am.zp = String(loc.zip).trim();
  }

  return am;
}

function getActiveTestEventCode(userParams) {
  if (userParams.testEventCode) return String(userParams.testEventCode).trim();
  if (typeof window === "undefined") return "";
  try {
    return (
      window.__metaTestEventCode ||
      sessionStorage.getItem("meta_test_event_code") ||
      ""
    ).trim();
  } catch {
    return window.__metaTestEventCode || "";
  }
}

function dispatchToBrowserPixel(eventName, customData, eventId, userParams) {
  const pixelId = (typeof window !== "undefined" && window.__metaPixelId) || DEFAULT_PIXEL_ID;
  const am = buildBrowserAdvancedMatching(userParams);
  const amSignature = JSON.stringify(am);

  const runFbq = () => {
    if (typeof window.fbq !== "function") return false;
    try {
      if (window.__metaLastAmSig !== amSignature) {
        window.fbq("init", pixelId, am);
        window.__metaLastAmSig = amSignature;
      }
      window.fbq("track", eventName, customData, { eventID: eventId });
    } catch (e) {
      console.warn("[Meta Browser Pixel Error]:", e);
    }
    return true;
  };

  if (!runFbq()) {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (runFbq() || attempts >= 25) {
        clearInterval(timer);
      }
    }, 100);
  }
}

export async function trackMetaEvent(eventName, customData = {}, userParams = {}) {
  if (typeof window === "undefined") return;

  if (userParams.phone || userParams.name || userParams.email || userParams.address) {
    saveCustomerProfile(userParams);
  }

  const tracking = getTrackingData();
  const savedProfile = getSavedCustomerProfile();
  const visitorId = getOrCreateVisitorId();
  const eventId = customData.eventId || `${eventName.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const fbp = getOrCreateFbp();
  const fbc = getResolvedFbc();

  const resolvedPhone = userParams.phone || savedProfile.phone || "";
  const resolvedName = userParams.name || savedProfile.name || "";
  const resolvedEmail = userParams.email || savedProfile.email || "";
  const resolvedAddress = userParams.address || savedProfile.address || "";

  const finalUserParams = {
    ...userParams,
    externalId: resolvedPhone || userParams.externalId || visitorId,
    phone: resolvedPhone,
    name: resolvedName,
    email: resolvedEmail,
    address: resolvedAddress,
    fbclid: tracking.fbclid || "",
    fbp,
    fbc,
    testEventCode: getActiveTestEventCode(userParams),
  };

  // 1. Browser Pixel Dispatch (fbq) with Manual Advanced Matching
  dispatchToBrowserPixel(eventName, customData, eventId, finalUserParams);

  // 2. TikTok Pixel Dispatch (ttq)
  if (typeof window.ttq?.track === "function") {
    try {
      const tiktokNameMap = {
        ViewContent: "ViewContent",
        AddToCart: "AddToCart",
        InitiateCheckout: "InitiateCheckout",
        Purchase: "CompletePayment",
        Contact: "Contact",
      };
      window.ttq.track(tiktokNameMap[eventName] || eventName, customData, { event_id: eventId });
    } catch (e) {
      console.warn("[TikTok Browser Pixel Error]:", e);
    }
  }

  // 3. Server-Side CAPI Relay Dispatch (Next.js Serverless Route)
  try {
    fetch("/api/tracking/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventId,
        eventSourceUrl: window.location.href,
        customData,
        userParams: finalUserParams,
      }),
    }).catch(() => {});
  } catch {
    // Non-blocking
  }
}
