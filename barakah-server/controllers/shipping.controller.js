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
  couriers: {
    steadfast: {
      isEnabled: true,
      apiUrl: "https://portal.packzy.com/api/v1",
      apiKey: "",
      secretKey: "",
      accounts: {
        narayanganj: { apiKey: "", secretKey: "" },
        badda: { apiKey: "", secretKey: "" },
        jamalpur: { apiKey: "", secretKey: "" },
      },
    },
    pathao: {
      isEnabled: false,
      baseUrl: "https://api-hermes.pathao.com",
      clientId: "",
      clientSecret: "",
      username: "",
      password: "",
      storeId: "",
    },
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

// Admin endpoint (Full configuration including Couriers)
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
      couriers: {
        steadfast: {
          isEnabled: typeof payload.couriers?.steadfast?.isEnabled === "boolean" ? payload.couriers.steadfast.isEnabled : true,
          apiUrl: (payload.couriers?.steadfast?.apiUrl || "https://portal.packzy.com/api/v1").trim(),
          apiKey: (payload.couriers?.steadfast?.apiKey || "").trim(),
          secretKey: (payload.couriers?.steadfast?.secretKey || "").trim(),
          accounts: {
            narayanganj: {
              apiKey: (payload.couriers?.steadfast?.accounts?.narayanganj?.apiKey || "").trim(),
              secretKey: (payload.couriers?.steadfast?.accounts?.narayanganj?.secretKey || "").trim(),
            },
            badda: {
              apiKey: (payload.couriers?.steadfast?.accounts?.badda?.apiKey || "").trim(),
              secretKey: (payload.couriers?.steadfast?.accounts?.badda?.secretKey || "").trim(),
            },
            jamalpur: {
              apiKey: (payload.couriers?.steadfast?.accounts?.jamalpur?.apiKey || "").trim(),
              secretKey: (payload.couriers?.steadfast?.accounts?.jamalpur?.secretKey || "").trim(),
            },
          },
        },
        pathao: {
          isEnabled: Boolean(payload.couriers?.pathao?.isEnabled),
          baseUrl: (payload.couriers?.pathao?.baseUrl || "https://api-hermes.pathao.com").trim(),
          clientId: (payload.couriers?.pathao?.clientId || "").trim(),
          clientSecret: (payload.couriers?.pathao?.clientSecret || "").trim(),
          username: (payload.couriers?.pathao?.username || "").trim(),
          password: (payload.couriers?.pathao?.password || "").trim(),
          storeId: (payload.couriers?.pathao?.storeId || "").trim(),
        },
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
      message: "Shipping & Courier settings updated successfully",
      data: updatedData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Test Steadfast Connection
exports.testSteadfastConnection = async (req, res) => {
  try {
    const { apiUrl, apiKey, secretKey } = req.body;
    const targetUrl = (apiUrl || process.env.STEADFAST_API_URL || "https://portal.packzy.com/api/v1").trim();
    const targetKey = (apiKey || process.env.STEADFAST_API_KEY_NARAYANGANJ || process.env.STEADFAST_API_KEY || "").trim();
    const targetSecret = (secretKey || process.env.STEADFAST_SECRET_KEY_NARAYANGANJ || process.env.STEADFAST_SECRET_KEY || "").trim();

    if (!targetKey || !targetSecret) {
      return res.status(400).json({ success: false, message: "API Key এবং Secret Key প্রদান করুন" });
    }

    const response = await fetch(`${targetUrl}/get_balance`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": targetKey,
        "Secret-Key": targetSecret,
      },
    });

    const data = await response.json();
    if (response.ok && data.status === 200) {
      return res.json({
        success: true,
        message: `Steadfast এর সাথে সফলভাবে কানেক্ট হয়েছে! বর্তমান ব্যালেন্স: ৳${data.current_balance ?? 0}`,
        data,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: data.message || `Steadfast কানেকশন ব্যর্থ হয়েছে (স্ট্যাটাস: ${response.status})`,
        data,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Steadfast এর সাথে যোগাযোগ করা যায়নি: " + error.message });
  }
};

// Test Pathao Connection
exports.testPathaoConnection = async (req, res) => {
  try {
    const { baseUrl, clientId, clientSecret, username, password } = req.body;
    const targetBase = (baseUrl || process.env.PATHAO_BASE_URL || "https://api-hermes.pathao.com").trim();
    const targetClientId = (clientId || process.env.PATHAO_CLIENT_ID || "").trim();
    const targetSecret = (clientSecret || process.env.PATHAO_CLIENT_SECRET || "").trim();
    const targetUser = (username || process.env.PATHAO_USERNAME || "").trim();
    const targetPass = (password || process.env.PATHAO_PASSWORD || "").trim();

    if (!targetClientId || !targetSecret || !targetUser || !targetPass) {
      return res.status(400).json({ success: false, message: "Client ID, Secret, Username এবং Password প্রদান করুন" });
    }

    const response = await fetch(`${targetBase}/aladdin/api/v1/issue-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: targetClientId,
        client_secret: targetSecret,
        grant_type: "password",
        username: targetUser,
        password: targetPass,
      }),
    });

    const data = await response.json();
    if (response.ok && data.access_token) {
      return res.json({
        success: true,
        message: "Pathao এর সাথে সফলভাবে কানেক্ট হয়েছে! (OAuth Token Generated)",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: data.message || `Pathao অথেনটিকেশন ব্যর্থ হয়েছে (স্ট্যাটাস: ${response.status})`,
        data,
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Pathao এর সাথে যোগাযোগ করা যায়নি: " + error.message });
  }
};
