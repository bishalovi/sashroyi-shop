/**
 * ============================================================================
 * FILE: shipping.controller.js
 * VERSION: v1.0.0
 * ----------------------------------------------------------------------------
 * USER REQUIREMENT:
 * Dynamic Shipping Charge management (Inside Dhaka, Outside Dhaka, Free Shipping)
 * with full Admin Panel control and real-time storefront checkout integration.
 *
 * IMPLEMENTATION DETAILS:
 * - Public API /api/shipping/public for storefront checkout.
 * - Admin API /api/shipping/admin for updating charges, toggles, and labels.
 * - Stores state in MongoDB "shipping_settings" collection.
 * ============================================================================
 */

const connectDB = require("../config/db");

const SETTINGS_KEY = "main_shipping_config";

const DEFAULT_SHIPPING_SETTINGS = {
  key: SETTINGS_KEY,
  insideDhaka: {
    title: "ঢাকার ভিতরে",
    cost: 60,
    isEnabled: true,
  },
  outsideDhaka: {
    title: "ঢাকার বাইরে",
    cost: 120,
    isEnabled: true,
  },
  freeShipping: {
    title: "ফ্রি ডেলিভারি",
    cost: 0,
    isEnabled: false,
    minOrderAmount: 0,
  },
  updatedAt: new Date(),
};

async function getShippingConfigFromDB() {
  const db = await connectDB();
  const collection = db.collection("shipping_settings");
  let doc = await collection.findOne({ key: SETTINGS_KEY });
  if (!doc) {
    await collection.insertOne(DEFAULT_SHIPPING_SETTINGS);
    doc = DEFAULT_SHIPPING_SETTINGS;
  }
  return doc;
}

// Public endpoint for storefront checkout
exports.getPublicShippingSettings = async (req, res) => {
  try {
    const config = await getShippingConfigFromDB();
    res.json({
      success: true,
      data: {
        insideDhaka: {
          title: config.insideDhaka?.title || "ঢাকার ভিতরে",
          cost: Number(config.insideDhaka?.cost ?? 60),
          isEnabled: Boolean(config.insideDhaka?.isEnabled),
        },
        outsideDhaka: {
          title: config.outsideDhaka?.title || "ঢাকার বাইরে",
          cost: Number(config.outsideDhaka?.cost ?? 120),
          isEnabled: Boolean(config.outsideDhaka?.isEnabled),
        },
        freeShipping: {
          title: config.freeShipping?.title || "ফ্রি ডেলিভারি",
          cost: 0,
          isEnabled: Boolean(config.freeShipping?.isEnabled),
          minOrderAmount: Number(config.freeShipping?.minOrderAmount || 0),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin endpoint (Full configuration)
exports.getAdminShippingSettings = async (req, res) => {
  try {
    const config = await getShippingConfigFromDB();
    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin update endpoint
exports.updateAdminShippingSettings = async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("shipping_settings");
    const payload = req.body || {};

    const updatedData = {
      key: SETTINGS_KEY,
      insideDhaka: {
        title: (payload.insideDhaka?.title || "ঢাকার ভিতরে").trim(),
        cost: Number(payload.insideDhaka?.cost ?? 60),
        isEnabled: Boolean(payload.insideDhaka?.isEnabled),
      },
      outsideDhaka: {
        title: (payload.outsideDhaka?.title || "ঢাকার বাইরে").trim(),
        cost: Number(payload.outsideDhaka?.cost ?? 120),
        isEnabled: Boolean(payload.outsideDhaka?.isEnabled),
      },
      freeShipping: {
        title: (payload.freeShipping?.title || "ফ্রি ডেলিভারি").trim(),
        cost: 0,
        isEnabled: Boolean(payload.freeShipping?.isEnabled),
        minOrderAmount: Number(payload.freeShipping?.minOrderAmount || 0),
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
      message: "Shipping settings updated successfully",
      data: updatedData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
