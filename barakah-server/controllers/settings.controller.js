/**
 * ============================================================================
 * FILE: settings.controller.js
 * VERSION: v2.1.0
 * ----------------------------------------------------------------------------
 * USER REQUIREMENT:
 * Comprehensive Website Settings & Customization Hub for managing:
 * 1. Header & Navigation (Logo, Shop name, Tagline, Favicon, Nav Menu Links)
 * 2. Payment Methods & Numbers (bKash, Nagad, Rocket, Cash On Delivery)
 * 3. Top Notice / Announcement Bar (Enabled, Text, Link, Colors)
 * 4. Hero Banner & Video (Headline, Subtitle, Buttons, YouTube Embed)
 * 5. Contact Info & Social Links (Phone, WhatsApp, FB Page, FB Group, Instagram, Messenger, Email, Address)
 * 6. Footer & Branding (About text, Quick links, Copyright)
 * 7. Offer Countdown Timer (Enabled, Title, Target Date)
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
  paymentMethods: {
    bkash: {
      isEnabled: true,
      number: "01910037935",
      type: "Personal",
      instructions: "বিকাশ পার্সোনাল নম্বরে Send Money করুন",
    },
    nagad: {
      isEnabled: true,
      number: "01910037935",
      type: "Personal",
      instructions: "নগদ পার্সোনাল নম্বরে Send Money করুন",
    },
    rocket: {
      isEnabled: false,
      number: "01910037935",
      type: "Personal",
      instructions: "রকেট পার্সোনাল নম্বরে Send Money করুন",
    },
    cod: {
      isEnabled: true,
      title: "ক্যাশ অন ডেলিভারি",
      instructions: "পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন",
    },
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
        paymentMethods: config.paymentMethods || DEFAULT_WEBSITE_SETTINGS.paymentMethods,
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
    const existing = await getSettingsFromDB();
    const payload = req.body || {};

    const shopName = (
      payload.header?.shopName ||
      payload.general?.shopName ||
      existing.header?.shopName ||
      existing.general?.shopName ||
      "Sashroyi"
    ).trim();

    const tagline = (
      payload.header?.tagline !== undefined
        ? payload.header.tagline
        : payload.general?.tagline !== undefined
        ? payload.general.tagline
        : existing.header?.tagline || existing.general?.tagline || ""
    ).trim();

    const logoUrl = (
      payload.header?.logoUrl !== undefined
        ? payload.header.logoUrl
        : payload.general?.logoUrl !== undefined
        ? payload.general.logoUrl
        : existing.header?.logoUrl || existing.general?.logoUrl || ""
    ).trim();

    const faviconUrl = (
      payload.header?.faviconUrl !== undefined
        ? payload.header.faviconUrl
        : payload.general?.faviconUrl !== undefined
        ? payload.general.faviconUrl
        : existing.header?.faviconUrl || existing.general?.faviconUrl || ""
    ).trim();

    const formattedNavLinks = Array.isArray(payload.header?.navLinks)
      ? payload.header.navLinks.map((l) => ({
          label: (l.label || "").trim(),
          url: (l.url || "").trim(),
        }))
      : existing.header?.navLinks || DEFAULT_WEBSITE_SETTINGS.header.navLinks;

    const formattedQuickLinks = Array.isArray(payload.footer?.quickLinks)
      ? payload.footer.quickLinks.map((l) => ({
          label: (l.label || "").trim(),
          url: (l.url || "").trim(),
        }))
      : existing.footer?.quickLinks || DEFAULT_WEBSITE_SETTINGS.footer.quickLinks;

    const existPay = existing.paymentMethods || DEFAULT_WEBSITE_SETTINGS.paymentMethods;
    const paymentMethods = {
      bkash: {
        isEnabled:
          payload.paymentMethods?.bkash?.isEnabled !== undefined
            ? Boolean(payload.paymentMethods.bkash.isEnabled)
            : existPay.bkash?.isEnabled !== undefined
            ? existPay.bkash.isEnabled
            : DEFAULT_WEBSITE_SETTINGS.paymentMethods.bkash.isEnabled,
        number: (
          payload.paymentMethods?.bkash?.number ||
          existPay.bkash?.number ||
          DEFAULT_WEBSITE_SETTINGS.paymentMethods.bkash.number
        ).trim(),
        type: (
          payload.paymentMethods?.bkash?.type ||
          existPay.bkash?.type ||
          "Personal"
        ).trim(),
        instructions: (
          payload.paymentMethods?.bkash?.instructions ||
          existPay.bkash?.instructions ||
          "বিকাশ পার্সোনাল নম্বরে Send Money করুন"
        ).trim(),
      },
      nagad: {
        isEnabled:
          payload.paymentMethods?.nagad?.isEnabled !== undefined
            ? Boolean(payload.paymentMethods.nagad.isEnabled)
            : existPay.nagad?.isEnabled !== undefined
            ? existPay.nagad.isEnabled
            : DEFAULT_WEBSITE_SETTINGS.paymentMethods.nagad.isEnabled,
        number: (
          payload.paymentMethods?.nagad?.number ||
          existPay.nagad?.number ||
          DEFAULT_WEBSITE_SETTINGS.paymentMethods.nagad.number
        ).trim(),
        type: (
          payload.paymentMethods?.nagad?.type ||
          existPay.nagad?.type ||
          "Personal"
        ).trim(),
        instructions: (
          payload.paymentMethods?.nagad?.instructions ||
          existPay.nagad?.instructions ||
          "নগদ পার্সোনাল নম্বরে Send Money করুন"
        ).trim(),
      },
      rocket: {
        isEnabled:
          payload.paymentMethods?.rocket?.isEnabled !== undefined
            ? Boolean(payload.paymentMethods.rocket.isEnabled)
            : existPay.rocket?.isEnabled !== undefined
            ? existPay.rocket.isEnabled
            : DEFAULT_WEBSITE_SETTINGS.paymentMethods.rocket.isEnabled,
        number: (
          payload.paymentMethods?.rocket?.number ||
          existPay.rocket?.number ||
          DEFAULT_WEBSITE_SETTINGS.paymentMethods.rocket.number
        ).trim(),
        type: (
          payload.paymentMethods?.rocket?.type ||
          existPay.rocket?.type ||
          "Personal"
        ).trim(),
        instructions: (
          payload.paymentMethods?.rocket?.instructions ||
          existPay.rocket?.instructions ||
          "রকেট পার্সোনাল নম্বরে Send Money করুন"
        ).trim(),
      },
      cod: {
        isEnabled:
          payload.paymentMethods?.cod?.isEnabled !== undefined
            ? Boolean(payload.paymentMethods.cod.isEnabled)
            : existPay.cod?.isEnabled !== undefined
            ? existPay.cod.isEnabled
            : DEFAULT_WEBSITE_SETTINGS.paymentMethods.cod.isEnabled,
        title: (
          payload.paymentMethods?.cod?.title ||
          existPay.cod?.title ||
          "ক্যাশ অন ডেলিভারি"
        ).trim(),
        instructions: (
          payload.paymentMethods?.cod?.instructions ||
          existPay.cod?.instructions ||
          "পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন"
        ).trim(),
      },
    };

    const existNotice = existing.noticeBar || DEFAULT_WEBSITE_SETTINGS.noticeBar;
    const noticeBar = {
      isEnabled:
        payload.noticeBar?.isEnabled !== undefined
          ? Boolean(payload.noticeBar.isEnabled)
          : Boolean(existNotice.isEnabled),
      text: (
        payload.noticeBar?.text !== undefined
          ? payload.noticeBar.text
          : existNotice.text || ""
      ).trim(),
      link: (
        payload.noticeBar?.link !== undefined
          ? payload.noticeBar.link
          : existNotice.link || ""
      ).trim(),
      bgColor: (
        payload.noticeBar?.bgColor ||
        existNotice.bgColor ||
        "#0f2a44"
      ).trim(),
      textColor: (
        payload.noticeBar?.textColor ||
        existNotice.textColor ||
        "#f2c94c"
      ).trim(),
    };

    const existHero = existing.hero || DEFAULT_WEBSITE_SETTINGS.hero;
    const hero = {
      badgeText: (
        payload.hero?.badgeText !== undefined
          ? payload.hero.badgeText
          : existHero.badgeText || ""
      ).trim(),
      title: (
        payload.hero?.title !== undefined
          ? payload.hero.title
          : existHero.title || "Sashroyi - Islamic Clock & Canvas"
      ).trim(),
      subtitle: (
        payload.hero?.subtitle !== undefined
          ? payload.hero.subtitle
          : existHero.subtitle || ""
      ).trim(),
      primaryBtnText: (
        payload.hero?.primaryBtnText !== undefined
          ? payload.hero.primaryBtnText
          : existHero.primaryBtnText || "Shop Now"
      ).trim(),
      primaryBtnLink: (
        payload.hero?.primaryBtnLink !== undefined
          ? payload.hero.primaryBtnLink
          : existHero.primaryBtnLink || "/category/wall-clock/natural"
      ).trim(),
      secondaryBtnText: (
        payload.hero?.secondaryBtnText !== undefined
          ? payload.hero.secondaryBtnText
          : existHero.secondaryBtnText || "Explore Categories"
      ).trim(),
      secondaryBtnLink: (
        payload.hero?.secondaryBtnLink !== undefined
          ? payload.hero.secondaryBtnLink
          : existHero.secondaryBtnLink || "/category/wall-canvas/natural"
      ).trim(),
      videoUrl: (
        payload.hero?.videoUrl !== undefined
          ? payload.hero.videoUrl
          : existHero.videoUrl || ""
      ).trim(),
    };

    const existContact = existing.contact || DEFAULT_WEBSITE_SETTINGS.contact;
    const contact = {
      phone: (
        payload.contact?.phone !== undefined
          ? payload.contact.phone
          : existContact.phone || ""
      ).trim(),
      whatsapp: (
        payload.contact?.whatsapp !== undefined
          ? payload.contact.whatsapp
          : existContact.whatsapp || ""
      ).trim(),
      facebookPage: (
        payload.contact?.facebookPage !== undefined
          ? payload.contact.facebookPage
          : existContact.facebookPage || ""
      ).trim(),
      messengerUrl: (
        payload.contact?.messengerUrl !== undefined
          ? payload.contact.messengerUrl
          : existContact.messengerUrl || ""
      ).trim(),
      instagram: (
        payload.contact?.instagram !== undefined
          ? payload.contact.instagram
          : existContact.instagram || ""
      ).trim(),
      facebookGroup: (
        payload.contact?.facebookGroup !== undefined
          ? payload.contact.facebookGroup
          : existContact.facebookGroup || ""
      ).trim(),
      email: (
        payload.contact?.email !== undefined
          ? payload.contact.email
          : existContact.email || ""
      ).trim(),
      address: (
        payload.contact?.address !== undefined
          ? payload.contact.address
          : existContact.address || ""
      ).trim(),
    };

    const existFooter = existing.footer || DEFAULT_WEBSITE_SETTINGS.footer;
    const footer = {
      aboutText: (
        payload.footer?.aboutText !== undefined
          ? payload.footer.aboutText
          : existFooter.aboutText || DEFAULT_WEBSITE_SETTINGS.footer.aboutText
      ).trim(),
      copyrightText: (
        payload.footer?.copyrightText !== undefined
          ? payload.footer.copyrightText
          : existFooter.copyrightText || DEFAULT_WEBSITE_SETTINGS.footer.copyrightText
      ).trim(),
      quickLinks: formattedQuickLinks,
    };

    const existTimer = existing.offerTimer || DEFAULT_WEBSITE_SETTINGS.offerTimer;
    const offerTimer = {
      isEnabled:
        payload.offerTimer?.isEnabled !== undefined
          ? Boolean(payload.offerTimer.isEnabled)
          : Boolean(existTimer.isEnabled),
      title: (
        payload.offerTimer?.title !== undefined
          ? payload.offerTimer.title
          : existTimer.title || ""
      ).trim(),
      targetDate:
        payload.offerTimer?.targetDate ||
        existTimer.targetDate ||
        new Date().toISOString(),
    };

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
      paymentMethods,
      noticeBar,
      hero,
      contact,
      footer,
      offerTimer,
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

