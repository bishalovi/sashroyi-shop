"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function DynamicTrackingProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Ensure fbq is initialized
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
        window.fbq("init", "3629834650489314");
      }

      // 2. Track PageView
      window.fbq("track", "PageView");
    }
  }, [pathname]);

  return null;
}
