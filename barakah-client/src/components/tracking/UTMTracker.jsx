"use client";

import { useEffect } from "react";

export default function UTMTracker() {
  useEffect(() => {
    const fbclid = params.get("fbclid");
    const ttclid = params.get("ttclid");
    const gclid = params.get("gclid");

    if (fbclid && typeof document !== "undefined") {
      const fbcValue = `fb.1.${Date.now()}.${fbclid}`;
      document.cookie = `_fbc=${fbcValue}; path=/; max-age=${90 * 24 * 60 * 60}; SameSite=Lax`;
    }

    const trackingData = {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      fbclid,
      ttclid,
      gclid,
      landing_page: window.location.href,
    };

    const hasTrackingData = Object.values(trackingData).some(Boolean);

    if (hasTrackingData) {
      localStorage.setItem(
        "barakah_tracking",
        JSON.stringify(trackingData),
      );
    }
  }, []);

  return null;
}