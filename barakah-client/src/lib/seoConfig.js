function isLocalUrl(url) {
  return /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(String(url || ""));
}

export function isTopSkbazarHost(host) {
  if (!host) return false;
  const h = String(host).toLowerCase();
  return h.includes("top.skbazarbd.com") || h.includes("skbazar");
}

export function getSiteUrl(explicitHost) {
  let host = explicitHost;
  if (!host && typeof window !== "undefined") {
    host = window.location.hostname || window.location.host;
  }
  if (isTopSkbazarHost(host)) {
    return "https://top.skbazarbd.com";
  }
  const envUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  if (envUrl && (process.env.NODE_ENV !== "production" || !isLocalUrl(envUrl))) {
    return envUrl;
  }
  return "https://sashroyi.shop";
}

export function getApiUrl(explicitHost) {
  let host = explicitHost;
  if (!host && typeof window !== "undefined") {
    host = window.location.hostname || window.location.host;
  }
  if (isTopSkbazarHost(host)) {
    return "https://topskbazar-api.onrender.com";
  }
  const envUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
  if (envUrl && (process.env.NODE_ENV !== "production" || !isLocalUrl(envUrl))) {
    return envUrl;
  }
  return "https://sashroyi-api.onrender.com";
}
