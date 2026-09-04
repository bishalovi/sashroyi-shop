/**
 * ============================================================================
 * FILE: settings.controller.js
 * VERSION: v1.0.0
 * ----------------------------------------------------------------------------
 * USER REQUIREMENT:
 * Website Settings & Customization Hub for managing:
 * 1. General & Branding (Site name, tagline, logo, favicon)
 * 2. Top Notice / Announcement Bar
 * 3. Hero Banner & Video
 * 4. Contact Info & Social Links (Phone, WhatsApp, FB, Instagram, Email, Address)
 * 5. Offer Countdown Timer
 * ============================================================================
 */

const connectDB = require("../config/db");

const SETTINGS_KEY = "main_website_config";

const DEFAULT_WEBSITE_SETTINGS = {
  key: SETTINGS_KEY,
  general: {
    shopName: "Barakah",
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
    subtitle: "Discover curated collections of premium Islamic wall clocks and canvas art. Crafted with elegance for those who value faith and beauty.",
    primaryBtnText: "Shop Now",
    primaryBtnLink: "/category/wall-clock/natural",
    secondaryBtnText: "Explore Categories",
    secondaryBtnLink: "/category/wall-canvas/natural",
    videoUrl: "https://www.youtube.com/embed/amRfomXo1_0?rel=0",
  },
  contact: {
    phone: "01810529221",
    whatsapp: "01810529221",
    facebookPage: "https://www.facebook.com/profile.php?id=61575470920192",
    messengerUrl: "https://m.me/61575470920192",
    instagram: "https://www.instagram.com/saheen_shuvo/?hl=en",
    facebookGroup: "https://facebook.com/groups/893573157040880/",
    email: "barakahislamicclock@gmail.com",
    address: "Dhaka, Bangladesh",
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
        general: config.general || DEFAULT_WEBSITE_SETTINGS.general,
        noticeBar: config.noticeBar || DEFAULT_WEBSITE_SETTINGS.noticeBar,
        hero: config.hero || DEFAULT_WEBSITE_SETTINGS.hero,
        contact: config.contact || DEFAULT_WEBSITE_SETTINGS.contact,
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

    const updatedData = {
      key: SETTINGS_KEY,
      general: {
        shopName: (payload.general?.shopName || "Barakah").trim(),
        tagline: (payload.general?.tagline || "").trim(),
        logoUrl: (payload.general?.logoUrl || "").trim(),
        faviconUrl: (payload.general?.faviconUrl || "").trim(),
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
        title: (payload.hero?.title || "Barakah - Islamic Clock & Canvas").trim(),
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
