"use client";

import { useEffect } from "react";

export default function UTMTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const trackingData = {
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      fbclid: params.get("fbclid"),
      ttclid: params.get("ttclid"),
      gclid: params.get("gclid"),
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