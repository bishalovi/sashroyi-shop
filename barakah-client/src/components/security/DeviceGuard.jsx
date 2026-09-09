"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getOrCreateDeviceId } from "@/lib/deviceId";
import { useSettings } from "@/contexts/SettingsContext";
import { FiAlertOctagon, FiPhoneCall } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

export default function DeviceGuard() {
  const pathname = usePathname();
  const [blockedData, setBlockedData] = useState(null);
  const { contact, cleanPhoneNumber, getWhatsAppUrl } = useSettings();

  const phoneNum = cleanPhoneNumber || contact?.phone || "01910037935";
  const waUrl = getWhatsAppUrl
    ? getWhatsAppUrl("হ্যালো Sashroyi সাপোর্ট, আমার ডিভাইসে অ্যাক্সেস স্থগিত দেখাচ্ছে। অনুগ্রহ করে সাহায্য করবেন?")
    : "https://wa.me/8801910037935";

  useEffect(() => {
    // Never block admin panel or admin login
    if (pathname && (pathname.startsWith("/admin") || pathname.startsWith("/login"))) {
      return;
    }

    const checkDeviceBlock = async () => {
      try {
        const deviceId = getOrCreateDeviceId();
        const baseUrl = "https://sashroyi-api.onrender.com";

        const res = await fetch(`${baseUrl}/api/blacklist/check?deviceId=${encodeURIComponent(deviceId)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) return;

        const data = await res.json();
        if (data && data.isBlocked) {
          setBlockedData(data);
          // Lock document scroll
          if (typeof document !== "undefined") {
            document.body.style.overflow = "hidden";
          }
        }
      } catch (err) {
        // Fail open silently on network glitch so normal customers are unaffected
        console.warn("Device security check skipped:", err.message);
      }
    };

    checkDeviceBlock();
  }, [pathname]);

  // If in admin or not blocked, render nothing
  if (pathname && (pathname.startsWith("/admin") || pathname.startsWith("/login"))) {
    return null;
  }

  if (!blockedData) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[999999] bg-[#faf7f0] flex flex-col items-center justify-center p-6 text-[#3d2f1f]">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-rose-200 p-8 text-center space-y-5">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <FiAlertOctagon className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-rose-700">
            প্রবেশাধিকার স্থগিত
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            (Access Restricted)
          </p>
        </div>

        <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-4 text-sm text-[#4a3b2c] leading-relaxed">
          <p>
            আপনার ডিভাইস বা ইন্টারনেট আইপি থেকে sashroyi.shop-এ প্রবেশাধিকার সাময়িকভাবে স্থগিত করা হয়েছে।
          </p>
          {blockedData.reason && (
            <p className="mt-2 text-xs font-semibold text-rose-800">
              কারণ: {blockedData.reason}
            </p>
          )}
        </div>

        <div className="pt-2 text-xs text-gray-500 space-y-3">
          <p>
            যদি মনে করেন এটি কোনো ভুলবশত হয়েছে, তবে অবিলম্বে আমাদের সাথে যোগাযোগ করুন:
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-transform active:scale-95 w-full sm:w-auto"
            >
              <FaWhatsapp className="w-4 h-4" />
              <span>WhatsApp Support</span>
            </a>
            <a
              href={`tel:${phoneNum}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#3d2f1f] hover:bg-[#2b2115] text-white text-xs font-bold shadow-md transition-transform active:scale-95 w-full sm:w-auto"
            >
              <FiPhoneCall className="w-4 h-4" />
              <span>Call ({phoneNum})</span>
            </a>
          </div>
        </div>

        {blockedData.clientIp && (
          <p className="text-[10px] text-gray-400 font-mono pt-2">
            IP: {blockedData.clientIp}
          </p>
        )}
      </div>
    </div>
  );
}
