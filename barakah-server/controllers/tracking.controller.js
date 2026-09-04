/**
 * ============================================================================
 * FILE: tracking.controller.js
 * VERSION: v1.0.0
 * ----------------------------------------------------------------------------
 * USER REQUIREMENT:
 * Admin panel dynamic management of GTM, Facebook Pixel & CAPI, TikTok Pixel & CAPI.
 * Support for add, update, pause, delete, and test event codes.
 *
 * IMPLEMENTATION DETAILS:
 * - Public API /api/tracking/public for dynamic storefront injection (no sensitive tokens exposed).
 * - Admin API /api/tracking/admin for full management, toggles, test codes, and resets.
 * - Test event dispatcher for instant verification in Meta/TikTok Events Manager.
 * - Stores all state in MongoDB "tracking_settings" collection with auto-initialization.
 * ============================================================================
 */

const connectDB = require("../config/db");
const { sendMetaCapiPurchase, sendTikTokEventsApiPurchase } = require("../services/capi.service");

const SETTINGS_KEY = "main_tracking_config";

const DEFAULT_SETTINGS = {
  key: SETTINGS_KEY,
  gtm: {
    containerId: "",
    isEnabled: false,
  },
  facebook: {
    pixelId: "",
    capiAccessToken: "",
    testEventCode: "",
    isEnabled: false,
    isCapiEnabled: false,
  },
  tiktok: {
    pixelId: "",
    accessToken: "",
    testEventCode: "",
    isEnabled: false,
    isCapiEnabled: false,
  },
  updatedAt: new Date(),
};

async function getTrackingConfigFromDB() {
  const db = await connectDB();
  const collection = db.collection("tracking_settings");
  let doc = await collection.findOne({ key: SETTINGS_KEY });
  if (!doc) {
    await collection.insertOne(DEFAULT_SETTINGS);
    doc = DEFAULT_SETTINGS;
  }
  return doc;
}

// Public endpoint for storefront (Omits CAPI Tokens)
exports.getPublicTrackingSettings = async (req, res) => {
  try {
    const config = await getTrackingConfigFromDB();
    res.json({
      success: true,
      data: {
        gtm: {
          containerId: config.gtm?.containerId || "",
          isEnabled: Boolean(config.gtm?.isEnabled),
        },
        facebook: {
          pixelId: config.facebook?.pixelId || "",
          isEnabled: Boolean(config.facebook?.isEnabled),
        },
        tiktok: {
          pixelId: config.tiktok?.pixelId || "",
          isEnabled: Boolean(config.tiktok?.isEnabled),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin endpoint (Full configuration)
exports.getAdminTrackingSettings = async (req, res) => {
  try {
    const config = await getTrackingConfigFromDB();
    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin update endpoint
exports.updateAdminTrackingSettings = async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("tracking_settings");
    const payload = req.body || {};

    const updatedData = {
      key: SETTINGS_KEY,
      gtm: {
        containerId: (payload.gtm?.containerId || "").trim(),
        isEnabled: Boolean(payload.gtm?.isEnabled),
      },
      facebook: {
        pixelId: (payload.facebook?.pixelId || "").trim(),
        capiAccessToken: (payload.facebook?.capiAccessToken || "").trim(),
        testEventCode: (payload.facebook?.testEventCode || "").trim(),
        isEnabled: Boolean(payload.facebook?.isEnabled),
        isCapiEnabled: Boolean(payload.facebook?.isCapiEnabled),
      },
      tiktok: {
        pixelId: (payload.tiktok?.pixelId || "").trim(),
        accessToken: (payload.tiktok?.accessToken || "").trim(),
        testEventCode: (payload.tiktok?.testEventCode || "").trim(),
        isEnabled: Boolean(payload.tiktok?.isEnabled),
        isCapiEnabled: Boolean(payload.tiktok?.isCapiEnabled),
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
      message: "Tracking settings saved successfully",
      data: updatedData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin delete/reset specific platform
exports.deletePlatformSettings = async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("tracking_settings");
    const { platform } = req.params;

    if (!["gtm", "facebook", "tiktok"].includes(platform)) {
      return res.status(400).json({ success: false, message: "Invalid platform" });
    }

    const resetFields = {};
    if (platform === "gtm") {
      resetFields.gtm = DEFAULT_SETTINGS.gtm;
    } else if (platform === "facebook") {
      resetFields.facebook = DEFAULT_SETTINGS.facebook;
    } else if (platform === "tiktok") {
      resetFields.tiktok = DEFAULT_SETTINGS.tiktok;
    }

    await collection.updateOne({ key: SETTINGS_KEY }, { $set: resetFields });

    res.json({
      success: true,
      message: `${platform.toUpperCase()} tracking settings cleared successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Test event trigger endpoint
exports.testPlatformConnection = async (req, res) => {
  try {
    const { platform, pixelId, accessToken, testEventCode } = req.body;

    const sampleOrder = {
      _id: `test_event_${Date.now()}`,
      orderId: `TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      total: 990,
      customerName: "Test Customer",
      phone: "01700000000",
      email: "test@example.com",
      items: [
        {
          productId: "test_prod_1",
          name: "Test Product Sample",
          quantity: 1,
          price: 990,
        },
      ],
    };

    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    if (platform === "facebook") {
      const metaConfig = {
        pixelId,
        capiAccessToken: accessToken,
        testEventCode,
        isEnabled: true,
        isCapiEnabled: true,
      };
      const result = await sendMetaCapiPurchase({
        order: sampleOrder,
        metaConfig,
        clientIp,
        userAgent,
      });
      return res.json({ success: true, platform: "facebook", result });
    }

    if (platform === "tiktok") {
      const tiktokConfig = {
        pixelId,
        accessToken,
        testEventCode,
        isEnabled: true,
        isCapiEnabled: true,
      };
      const result = await sendTikTokEventsApiPurchase({
        order: sampleOrder,
        tiktokConfig,
        clientIp,
        userAgent,
      });
      return res.json({ success: true, platform: "tiktok", result });
    }

    res.status(400).json({ success: false, message: "Unsupported test platform" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
