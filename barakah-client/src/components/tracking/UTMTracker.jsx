"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function UTMTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const params = new URLSearchParams(window.location.search);
      const fbclid = params.get("fbclid");
      const ttclid = params.get("ttclid");
      const gclid = params.get("gclid");
      const utmSource = params.get("utm_source");
      const utmMedium = params.get("utm_medium");
      const utmCampaign = params.get("utm_campaign");
      const testCode = params.get("test_event_code");

      if (testCode) {
        if (testCode.toLowerCase() === "clear" || testCode.toLowerCase() === "off") {
          sessionStorage.removeItem("meta_test_event_code");
        } else {
          sessionStorage.setItem("meta_test_event_code", testCode.trim());
        }
      }

      let existingTracking = {};
      try {
        existingTracking = JSON.parse(localStorage.getItem("barakah_tracking") || "{}");
      } catch {
        existingTracking = {};
      }

      let fbcValue = existingTracking.fbc || "";
      if (fbclid) {
        const existingFbcCookieMatch = document.cookie.match(/(?:^|; )_fbc=([^;]+)/);
        const existingCookieFbc = existingFbcCookieMatch ? decodeURIComponent(existingFbcCookieMatch[1]) : "";
        if (existingCookieFbc && existingCookieFbc.endsWith(`.${fbclid}`)) {
          fbcValue = existingCookieFbc;
        } else if (existingTracking.fbc && existingTracking.fbc.endsWith(`.${fbclid}`)) {
          fbcValue = existingTracking.fbc;
        } else {
          fbcValue = `fb.1.${Date.now()}.${fbclid}`;
        }
        document.cookie = `_fbc=${encodeURIComponent(fbcValue)}; path=/; max-age=${90 * 24 * 60 * 60}; SameSite=Lax`;
      }

      const hasNewAttribution = Boolean(
        utmSource || utmMedium || utmCampaign || fbclid || ttclid || gclid
      );

      if (hasNewAttribution) {
        const mergedTracking = {
          ...existingTracking,
          ...(utmSource ? { utm_source: utmSource } : {}),
          ...(utmMedium ? { utm_medium: utmMedium } : {}),
          ...(utmCampaign ? { utm_campaign: utmCampaign } : {}),
          ...(fbclid ? { fbclid, fbc: fbcValue } : {}),
          ...(ttclid ? { ttclid } : {}),
          ...(gclid ? { gclid } : {}),
          landing_page: existingTracking.landing_page || window.location.href,
          updated_at: Date.now(),
        };

        localStorage.setItem("barakah_tracking", JSON.stringify(mergedTracking));
      }
    } catch (e) {
      console.error("UTMTracker error:", e);
    }
  }, [pathname]);

  return null;
}