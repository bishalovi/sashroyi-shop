"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { FaWhatsapp } from "react-icons/fa";
import { useSettings } from "@/contexts/SettingsContext";

export default function WhatsAppFloatButton() {
  const pathname = usePathname();
  const { getWhatsAppUrl, contact } = useSettings();
  const [showTooltip, setShowTooltip] = useState(false);

  // Don't display in admin dashboard
  if (pathname && pathname.startsWith("/admin")) {
    return null;
  }

  const getPageMessage = () => {
    if (pathname === "/") {
      return "হ্যালো! আমি sashroyi.shop ওয়েবসাইট থেকে হোমপেজের অফার ও প্রোডাক্ট সম্পর্কে জানতে চাচ্ছি।";
    }
    if (pathname.startsWith("/category")) {
      return "হ্যালো! আমি ক্যাটাগরির প্রোডাক্টগুলো সম্পর্কে জানতে চাচ্ছি।";
    }
    if (pathname === "/checkout" || pathname === "/cart") {
      return "হ্যালো! আমি অর্ডার করতে চাচ্ছি, আমাকে সাহায্য করবেন?";
    }
    return "হ্যালো! আমি sashroyi.shop থেকে কিছু তথ্য ও প্রোডাক্ট সম্পর্কে জানতে চাচ্ছি।";
  };

  const handleWhatsAppClick = () => {
    const url = getWhatsAppUrl(getPageMessage());
    window.open(url, "_blank");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Tooltip on hover */}
      <div
        className={`hidden sm:block transition-all duration-300 transform ${
          showTooltip ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"
        } bg-[#0f2a44] text-white text-xs font-medium py-2 px-3.5 rounded-full shadow-lg border border-[#d4af37]/30 whitespace-nowrap`}
      >
        💬 হোয়াটসঅ্যাপে মেসেজ দিন
      </div>

      {/* Button */}
      <button
        onClick={handleWhatsAppClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="relative group flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-[#20ba59] active:scale-95 cursor-pointer focus:outline-none"
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
      >
        {/* Pulsing ring */}
        <span className="absolute -inset-1 animate-ping rounded-full bg-[#25D366]/40 opacity-75" />
        
        <FaWhatsapp size={32} className="relative z-10" />
      </button>
    </div>
  );
}
