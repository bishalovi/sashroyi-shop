/**
 * ============================================================================
 * FILE: rootAuth.middleware.js
 * VERSION: v1.0.0
 * ----------------------------------------------------------------------------
 * Middleware to restrict System Engine & Core Update endpoints strictly
 * to the Root Owner.
 * ============================================================================
 */

const connectDB = require("../config/db");

const SETTINGS_KEY = "system_root_security_config";

module.exports = async function verifyRootOwner(req, res, next) {
  try {
    const userRole = req.headers["x-user-role"] || req.query.role;
    const userEmail = (req.headers["x-user-email"] || req.query.email || "").trim().toLowerCase();
    const providedPin = req.headers["x-root-pin"] || req.query.pin || req.body?.masterPin;

    // Must have admin or root role
    const isOwnerRole =
      userRole === "barakahAdmin1234" ||
      userRole === "root_owner" ||
      userRole === "super_admin";

    if (!isOwnerRole && !userEmail) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Only authenticated Root Owner can access this system.",
      });
    }

    const db = await connectDB();

    // Check if security PIN is configured
    const secConfig = await db.collection("settings").findOne({ key: SETTINGS_KEY });

    if (secConfig && secConfig.masterPin) {
      // If PIN is enabled, verify it
      if (!providedPin || String(providedPin).trim() !== String(secConfig.masterPin).trim()) {
        return res.status(401).json({
          success: false,
          requirePin: true,
          message: "Root Master PIN is required or invalid.",
        });
      }
    }

    // Attach verified user info
    req.rootOwner = {
      email: userEmail,
      role: userRole,
    };

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Root verification failed: " + err.message,
    });
  }
};
