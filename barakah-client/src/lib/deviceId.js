export const getOrCreateDeviceId = () => {
  if (typeof window === "undefined") return "";

  const KEY = "sashroyi_device_id";
  let deviceId = null;

  try {
    deviceId = localStorage.getItem(KEY);
  } catch (e) {
    // ignore
  }

  if (!deviceId) {
    // Try to get from cookie
    try {
      const match = document.cookie.match(new RegExp("(^| )" + KEY + "=([^;]+)"));
      if (match && match[2]) {
        deviceId = match[2];
      }
    } catch (e) {
      // ignore
    }
  }

  if (!deviceId) {
    // Generate new unique device id
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      deviceId = crypto.randomUUID();
    } else {
      deviceId = "dev_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
    }
  }

  // Ensure stored in both localStorage and cookie (valid for 5 years)
  try {
    localStorage.setItem(KEY, deviceId);
    document.cookie = `${KEY}=${deviceId}; path=/; max-age=157680000; SameSite=Lax`;
  } catch (e) {
    // ignore
  }

  return deviceId;
};
