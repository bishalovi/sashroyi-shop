"use client";

import { useEffect, useState } from "react";
import { FaBolt } from "react-icons/fa";

export default function OfferCountdown({ product }) {
  const baseUrl = "https://sashroyi-api.onrender.com";
  const [offerConfig, setOfferConfig] = useState({
    isEnabled: true,
    title: "সীমিত সময়ের বিশেষ অফার!",
    targetDate: null,
  });

  const [timeLeft, setTimeLeft] = useState({
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    if (!baseUrl) return;
    fetch(`${baseUrl}/api/settings/public`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data?.offerTimer) {
          setOfferConfig(res.data.offerTimer);
        }
      })
      .catch((err) => console.error("Error loading offer timer config:", err));
  }, [baseUrl]);

  useEffect(() => {
    const calculateTime = () => {
      let targetTime;
      if (offerConfig.targetDate) {
        targetTime = new Date(offerConfig.targetDate).getTime();
      } else {
        // Fallback: 24h rolling countdown
        const now = new Date();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        targetTime = endOfDay.getTime();
      }

      const diff = targetTime - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft({ hours: "00", minutes: "00", seconds: "00" });
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        hours: String(h).padStart(2, "0"),
        minutes: String(m).padStart(2, "0"),
        seconds: String(s).padStart(2, "0"),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [offerConfig.targetDate]);

  if (!offerConfig.isEnabled) return null;

  return (
    <div className="mb-3 rounded-xl bg-linear-to-r from-[#0f2a44] via-[#1e3a5f] to-[#0f2a44] px-3.5 py-2.5 text-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d4af37] text-xs text-[#0f2a44] animate-pulse">
            <FaBolt />
          </span>
          <span className="text-sm font-semibold text-[#f5d76e]">
            {offerConfig.title || "সীমিত সময়ের বিশেষ অফার!"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
          <span className="rounded bg-black/40 px-2 py-1 text-white">
            {timeLeft.hours}
          </span>
          <span>:</span>
          <span className="rounded bg-black/40 px-2 py-1 text-white">
            {timeLeft.minutes}
          </span>
          <span>:</span>
          <span className="rounded bg-black/40 px-2 py-1 text-white">
            {timeLeft.seconds}
          </span>
        </div>
      </div>
    </div>
  );
}
