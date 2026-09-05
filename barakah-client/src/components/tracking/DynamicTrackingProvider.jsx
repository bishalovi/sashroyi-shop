"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function DynamicTrackingProvider() {
  const pathname = usePathname();
  const baseUrl = "https://sashroyi-api.onrender.com";
  const initializedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Fetch tracking config from API
    fetch(`${baseUrl}/api/tracking/public`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          const { gtm, facebook, tiktok } = res.data;

          // 1. Google Tag Manager (GTM)
          if (gtm?.isEnabled && gtm?.containerId && !window._gtm_loaded) {
            window._gtm_loaded = true;
            (function (w, d, s, l, i) {
              w[l] = w[l] || [];
              w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
              var f = d.getElementsByTagName(s)[0],
                j = d.createElement(s),
                dl = l != "dataLayer" ? "&l=" + l : "";
              j.async = true;
              j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
              f.parentNode.insertBefore(j, f);
            })(window, document, "script", "dataLayer", gtm.containerId);
          }

          // 2. Facebook Pixel (Meta)
          const targetFbPixelId = (facebook?.isEnabled && facebook?.pixelId) ? facebook.pixelId : "3090216584507410";
          if (!window.fbq) {
            !(function (f, b, e, v, n, t, s) {
              if (f.fbq) return;
              n = f.fbq = function () {
                n.callMethod
                  ? n.callMethod.apply(n, arguments)
                  : n.queue.push(arguments);
              };
              if (!f._fbq) f._fbq = n;
              n.push = n;
              n.loaded = !0;
              n.version = "2.0";
              n.queue = [];
              t = b.createElement(e);
              t.async = !0;
              t.src = v;
              s = b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t, s);
            })(
              window,
              document,
              "script",
              "https://connect.facebook.net/en_US/fbevents.js"
            );
            window.fbq("init", targetFbPixelId);
          }

          // 3. TikTok Pixel
          if (tiktok?.isEnabled && tiktok?.pixelId && !window.ttq) {
            !(function (w, d, t) {
              w.TiktokAnalyticsObject = t;
              var ttq = (w[t] = w[t] || []);
              (ttq.methods = [
                "page",
                "track",
                "identify",
                "instances",
                "debug",
                "on",
                "off",
                "once",
                "ready",
                "alias",
                "group",
                "enableCookie",
                "disableCookie",
              ]),
                (ttq.setAndDefer = function (t, e) {
                  t[e] = function () {
                    t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
                  };
                });
              for (var i = 0; i < ttq.methods.length; i++)
                ttq.setAndDefer(ttq, ttq.methods[i]);
              (ttq.instance = function (t) {
                for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++)
                  ttq.setAndDefer(e, ttq.methods[n]);
                return e;
              }),
                (ttq.load = function (e, n) {
                  var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
                  (ttq._i = ttq._i || {}),
                    (ttq._i[e] = []),
                    (ttq._i[e]._u = i),
                    (ttq._t = ttq._t || {}),
                    (ttq._t[e] = +new Date()),
                    (ttq._o = ttq._o || {}),
                    (ttq._o[e] = n || {});
                  var o = document.createElement("script");
                  (o.type = "text/javascript"),
                    (o.async = !0),
                    (o.src = i + "?sdkid=" + e + "&lib=" + t);
                  var a = document.getElementsByTagName("script")[0];
                  a.parentNode.insertBefore(o, a);
                });
              ttq.load(tiktok.pixelId);
              ttq.page();
            })(window, document, "ttq");
          }
        }
      })
      .catch((err) => console.log("Tracking config fetch error:", err));
  }, [baseUrl]);

  // Track PageView on route navigation
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (typeof window.fbq === "function") {
        window.fbq("track", "PageView");
      }
      if (typeof window.ttq?.page === "function") {
        window.ttq.page();
      }
    }
  }, [pathname]);

  return null;
}
