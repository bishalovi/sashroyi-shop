/**
 * Optimizes Cloudinary and Google Drive image URLs at the CDN level
 * so browsers receive properly sized WebP/AVIF images (~15-30 KB)
 * instead of multi-megabyte originals.
 */
export function getOptimizedImageUrl(url, width = 480) {
  if (!url || typeof url !== "string") return url;
  const trimmed = url.trim();

  // Cloudinary: inject f_auto,q_auto:good,w_<width>,c_limit after /upload/
  if (trimmed.includes("res.cloudinary.com") && trimmed.includes("/image/upload/")) {
    // Avoid double-injecting if already transformed
    if (trimmed.includes("/image/upload/f_auto")) return trimmed;
    return trimmed.replace(
      "/image/upload/",
      `/image/upload/f_auto,q_auto:good,w_${width},c_limit/`
    );
  }

  // Google Drive lh3 CDN: append =w<width> if no size suffix exists
  if (trimmed.includes("lh3.googleusercontent.com/d/") && !trimmed.includes("=")) {
    return `${trimmed}=w${width}`;
  }

  return trimmed;
}
