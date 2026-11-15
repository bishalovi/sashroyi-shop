export function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    const host = (window.location.hostname || window.location.host || "").toLowerCase();
    if (host.includes("top.skbazarbd.com") || host.includes("skbazar")) {
      return "https://topskbazar-api.onrender.com";
    }
    if (host.includes("sashroyi")) {
      return "https://sashroyi-api.onrender.com";
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "https://sashroyi-api.onrender.com";
}

export function getSiteBaseUrl() {
  if (typeof window !== "undefined") {
    const host = (window.location.hostname || window.location.host || "").toLowerCase();
    if (host.includes("top.skbazarbd.com") || host.includes("skbazar")) {
      return "https://top.skbazarbd.com";
    }
    if (host.includes("sashroyi")) {
      return "https://sashroyi.shop";
    }
  }
  return process.env.NEXT_PUBLIC_SITE_URL || "https://sashroyi.shop";
}
