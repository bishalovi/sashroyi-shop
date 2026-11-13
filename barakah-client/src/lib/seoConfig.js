function isLocalUrl(url) {
  return /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(String(url || ""));
}

export function getSiteUrl() {
  const envUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  if (envUrl && (process.env.NODE_ENV !== "production" || !isLocalUrl(envUrl))) {
    return envUrl;
  }
  return "https://top.skbazarbd.com";
}

export function getApiUrl() {
  const envUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
  if (envUrl && (process.env.NODE_ENV !== "production" || !isLocalUrl(envUrl))) {
    return envUrl;
  }
  return "https://sashroyi-api.onrender.com";
}
