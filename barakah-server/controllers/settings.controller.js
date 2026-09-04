/**
 * ============================================================================
 * FILE: settings.controller.js
 * VERSION: v2.0.0
 * ----------------------------------------------------------------------------
 * USER REQUIREMENT:
 * Comprehensive Website Settings & Customization Hub for managing:
 * 1. Header & Navigation (Logo, Shop name, Tagline, Favicon, Nav Menu Links)
 * 2. Top Notice / Announcement Bar (Enabled, Text, Link, Colors)
 * 3. Hero Banner & Video (Headline, Subtitle, Buttons, YouTube Embed)
 * 4. Contact Info & Social Links (Phone, WhatsApp, FB Page, FB Group, Instagram, Messenger, Email, Address)
 * 5. Footer & Branding (About text, Quick links, Copyright)
 * 6. Offer Countdown Timer (Enabled, Title, Target Date)
 * ============================================================================
 */

const connectDB = require("../config/db");

const SETTINGS_KEY = "main_website_config";

const DEFAULT_WEBSITE_SETTINGS = {
  key: SETTINGS_KEY,
  general: {
    shopName: "Sashroyi",
    tagline: "Blessings in every moment",
    logoUrl: "",
    faviconUrl: "",
  },
  header: {
    shopName: "Sashroyi",
    tagline: "Blessings in every moment",
    logoUrl: "",
    faviconUrl: "",
    navLinks: [
      { label: "Home", url: "/" },
      { label: "Wall Clock", url: "/category/wall-clock/natural" },
      { label: "Wall Canvas", url: "/category/wall-canvas/natural" },
      { label: "Wall Art", url: "/category/wall-art/natural" },
      { label: "Round Clock", url: "/category/round-clock/natural" },
      { label: "Others", url: "/category/others/natural" },
    ],
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
    title: "Sashroyi - Islamic Clock & Canvas",
    subtitle: "Discover curated collections of premium Islamic wall clocks and canvas art. Crafted with elegance for those who value faith and beauty.",
    primaryBtnText: "Shop Now",
    primaryBtnLink: "/category/wall-clock/natural",
    secondaryBtnText: "Explore Categories",
    secondaryBtnLink: "/category/wall-canvas/natural",
    videoUrl: "https://www.youtube.com/embed/amRfomXo1_0?rel=0",
  },
  contact: {
    phone: "01910037935",
    whatsapp: "01910037935",
    facebookPage: "https://www.facebook.com/",
    messengerUrl: "https://m.me/",
    instagram: "https://www.instagram.com/",
    facebookGroup: "https://facebook.com/groups/",
    email: "sashroyi@gmail.com",
    address: "Dhaka, Bangladesh",
  },
  footer: {
    aboutText: "Premium Islamic Wall Clocks & Canvas Art. Crafted with elegance for your home.",
    copyrightText: "© 2026 Sashroyi. All rights reserved.",
    quickLinks: [
      { label: "Home", url: "/" },
      { label: "Wall Clocks", url: "/category/wall-clock/natural" },
      { label: "Wall Canvas", url: "/category/wall-canvas/natural" },
      { label: "Facebook Group", url: "https://facebook.com/groups/" },
    ],
  },
  offerTimer: {
    isEnabled: true,
    title: "সীমিত সময়ের বিশেষ অফার!",
    targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  updatedAt: new Date(),
};

async function getSettingsFromDB() {
  const db = await connectDB();
  const collection = db.collection("website_settings");
  let doc = await collection.findOne({ key: SETTINGS_KEY });
  if (!doc) {
    await collection.insertOne(DEFAULT_WEBSITE_SETTINGS);
    doc = DEFAULT_WEBSITE_SETTINGS;
  }
  return doc;
}

// Public endpoint for storefront
exports.getPublicSettings = async (req, res) => {
  try {
    const config = await getSettingsFromDB();
    res.json({
      success: true,
      data: {
        general: config.general || config.header || DEFAULT_WEBSITE_SETTINGS.general,
        header: config.header || {
          shopName: config.general?.shopName || DEFAULT_WEBSITE_SETTINGS.general.shopName,
          tagline: config.general?.tagline || DEFAULT_WEBSITE_SETTINGS.general.tagline,
          logoUrl: config.general?.logoUrl || "",
          faviconUrl: config.general?.faviconUrl || "",
          navLinks: DEFAULT_WEBSITE_SETTINGS.header.navLinks,
        },
        noticeBar: config.noticeBar || DEFAULT_WEBSITE_SETTINGS.noticeBar,
        hero: config.hero || DEFAULT_WEBSITE_SETTINGS.hero,
        contact: config.contact || DEFAULT_WEBSITE_SETTINGS.contact,
        footer: config.footer || DEFAULT_WEBSITE_SETTINGS.footer,
        offerTimer: config.offerTimer || DEFAULT_WEBSITE_SETTINGS.offerTimer,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin endpoint (Full configuration)
exports.getAdminSettings = async (req, res) => {
  try {
    const config = await getSettingsFromDB();
    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin update endpoint
exports.updateAdminSettings = async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("website_settings");
    const payload = req.body || {};

    const shopName = (payload.header?.shopName || payload.general?.shopName || "Sashroyi").trim();
    const tagline = (payload.header?.tagline || payload.general?.tagline || "").trim();
    const logoUrl = (payload.header?.logoUrl || payload.general?.logoUrl || "").trim();
    const faviconUrl = (payload.header?.faviconUrl || payload.general?.faviconUrl || "").trim();

    const formattedNavLinks = Array.isArray(payload.header?.navLinks)
      ? payload.header.navLinks.map((l) => ({
          label: (l.label || "").trim(),
          url: (l.url || "").trim(),
        }))
      : DEFAULT_WEBSITE_SETTINGS.header.navLinks;

    const formattedQuickLinks = Array.isArray(payload.footer?.quickLinks)
      ? payload.footer.quickLinks.map((l) => ({
          label: (l.label || "").trim(),
          url: (l.url || "").trim(),
        }))
      : DEFAULT_WEBSITE_SETTINGS.footer.quickLinks;

    const updatedData = {
      key: SETTINGS_KEY,
      general: {
        shopName,
        tagline,
        logoUrl,
        faviconUrl,
      },
      header: {
        shopName,
        tagline,
        logoUrl,
        faviconUrl,
        navLinks: formattedNavLinks,
      },
      noticeBar: {
        isEnabled: Boolean(payload.noticeBar?.isEnabled),
        text: (payload.noticeBar?.text || "").trim(),
        link: (payload.noticeBar?.link || "").trim(),
        bgColor: (payload.noticeBar?.bgColor || "#0f2a44").trim(),
        textColor: (payload.noticeBar?.textColor || "#f2c94c").trim(),
      },
      hero: {
        badgeText: (payload.hero?.badgeText || "").trim(),
        title: (payload.hero?.title || "Sashroyi - Islamic Clock & Canvas").trim(),
        subtitle: (payload.hero?.subtitle || "").trim(),
        primaryBtnText: (payload.hero?.primaryBtnText || "Shop Now").trim(),
        primaryBtnLink: (payload.hero?.primaryBtnLink || "/category/wall-clock/natural").trim(),
        secondaryBtnText: (payload.hero?.secondaryBtnText || "Explore Categories").trim(),
        secondaryBtnLink: (payload.hero?.secondaryBtnLink || "/category/wall-canvas/natural").trim(),
        videoUrl: (payload.hero?.videoUrl || "").trim(),
      },
      contact: {
        phone: (payload.contact?.phone || "").trim(),
        whatsapp: (payload.contact?.whatsapp || "").trim(),
        facebookPage: (payload.contact?.facebookPage || "").trim(),
        messengerUrl: (payload.contact?.messengerUrl || "").trim(),
        instagram: (payload.contact?.instagram || "").trim(),
        facebookGroup: (payload.contact?.facebookGroup || "").trim(),
        email: (payload.contact?.email || "").trim(),
        address: (payload.contact?.address || "").trim(),
      },
      footer: {
        aboutText: (payload.footer?.aboutText || DEFAULT_WEBSITE_SETTINGS.footer.aboutText).trim(),
        copyrightText: (payload.footer?.copyrightText || DEFAULT_WEBSITE_SETTINGS.footer.copyrightText).trim(),
        quickLinks: formattedQuickLinks,
      },
      offerTimer: {
        isEnabled: Boolean(payload.offerTimer?.isEnabled),
        title: (payload.offerTimer?.title || "").trim(),
        targetDate: payload.offerTimer?.targetDate || new Date().toISOString(),
      },
      updatedAt: new Date(),
    };

    await collection.updateOne(
      { key: SETTINGS_KEY },
      { $set: updatedData },
      { upsert: true }
    );

    res.json({
      success: true,
      message: "Website settings saved successfully",
      data: updatedData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
