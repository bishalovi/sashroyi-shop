"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const SettingsContext = createContext();

export const DEFAULT_SETTINGS = {
  general: {
    shopName: "Sashroyi",
    tagline: "Blessings in every moment",
    logoUrl: "",
    faviconUrl: "",
  },
  noticeBar: {
    isEnabled: true,
    text: "🔥 যেকোনো ২টি প্রোডাক্ট অর্ডারে ডেলিভারি সম্পূর্ণ ফ্রি!",
    link: "",
    bgColor: "#0f2a44",
    textColor: "#f2c94c",
  },
  hero: {
    badgeText: "Blessings in every moment",
    title: "Barakah - Islamic Clock & Canvas",
    subtitle:
      "Discover curated collections of premium Islamic wall clocks and canvas art. Crafted with elegance for those who value faith and beauty.",
    primaryBtnText: "Shop Now",
    primaryBtnLink: "/category/wall-clock/natural",
    secondaryBtnText: "Explore Categories",
    secondaryBtnLink: "/category/wall-canvas/natural",
    videoUrl: "https://www.youtube.com/embed/",
  },
  contact: {
    phone: "01910037935",
    whatsapp: "01910037935",
    facebookPage: "https://www.facebook.com/",
    messengerUrl: "https://m.me/",
    instagram: "https://instagram.com/",
    facebookGroup: "https://facebook.com/groups/",
    email: "sashroyi@gmail.com",
    address: "Dhaka, Bangladesh",
  },
  offerTimer: {
    isEnabled: false,
    title: "সীমিত সময়ের বিশেষ অফার!",
    targetDate: "",
  },
};

/**
 * Normalizes phone numbers to standard BD WhatsApp format (e.g. 8801910037935)
 */
export function formatWhatsAppNumber(phone) {
  if (!phone) return "8801910037935";
  // Remove all non-digits (including invisible unicode characters like \u202c)
  let clean = String(phone).replace(/[^\d]/g, "");
  if (!clean) return "8801910037935";
  if (clean.startsWith("880")) return clean;
  if (clean.startsWith("0")) return "88" + clean;
  if (clean.length === 10 && clean.startsWith("1")) return "880" + clean;
  return clean;
}

export function formatPhoneNumber(phone) {
  if (!phone) return "01910037935";
  let clean = String(phone).replace(/[^\d+]/g, "");
  return clean || "01910037935";
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://sashroyi-api.onrender.com";

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/api/settings/public`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSettings((prev) => ({
          general: { ...prev.general, ...(data.data.general || {}) },
          noticeBar: { ...prev.noticeBar, ...(data.data.noticeBar || {}) },
          hero: { ...prev.hero, ...(data.data.hero || {}) },
          contact: { ...prev.contact, ...(data.data.contact || {}) },
          offerTimer: { ...prev.offerTimer, ...(data.data.offerTimer || {}) },
        }));
      }
    } catch (err) {
      console.error("Failed to load website settings:", err);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getWhatsAppUrl = useCallback(
    (customMessage = "হ্যালো! আমি কিছু তথ্য ও প্রোডাক্ট সম্পর্কে জানতে চাচ্ছি।") => {
      const waNumber = formatWhatsAppNumber(settings.contact?.whatsapp || "01910037935");
      return `https://wa.me/${waNumber}?text=${encodeURIComponent(customMessage)}`;
    },
    [settings.contact?.whatsapp]
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        contact: settings.contact || DEFAULT_SETTINGS.contact,
        general: settings.general || DEFAULT_SETTINGS.general,
        noticeBar: settings.noticeBar || DEFAULT_SETTINGS.noticeBar,
        hero: settings.hero || DEFAULT_SETTINGS.hero,
        offerTimer: settings.offerTimer || DEFAULT_SETTINGS.offerTimer,
        loading,
        getWhatsAppUrl,
        refreshSettings: fetchSettings,
        cleanWhatsAppNumber: formatWhatsAppNumber(settings.contact?.whatsapp),
        cleanPhoneNumber: formatPhoneNumber(settings.contact?.phone),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    return {
      settings: DEFAULT_SETTINGS,
      contact: DEFAULT_SETTINGS.contact,
      general: DEFAULT_SETTINGS.general,
      noticeBar: DEFAULT_SETTINGS.noticeBar,
      hero: DEFAULT_SETTINGS.hero,
      offerTimer: DEFAULT_SETTINGS.offerTimer,
      loading: false,
      getWhatsAppUrl: (msg = "হ্যালো!") => `https://wa.me/8801910037935?text=${encodeURIComponent(msg)}`,
      refreshSettings: () => {},
      cleanWhatsAppNumber: "8801910037935",
      cleanPhoneNumber: "01910037935",
    };
  }
  return context;
}
