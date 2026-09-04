/**
 * ============================================================================
 * FILE: tracking.routes.js
 * VERSION: v1.0.0
 * ----------------------------------------------------------------------------
 * USER REQUIREMENT:
 * Routes for dynamic tracking management (GTM, Facebook, TikTok).
 * ============================================================================
 */

const express = require("express");
const router = express.Router();
const {
  getPublicTrackingSettings,
  getAdminTrackingSettings,
  updateAdminTrackingSettings,
  deletePlatformSettings,
  testPlatformConnection,
} = require("../controllers/tracking.controller");

router.get("/public", getPublicTrackingSettings);
router.get("/admin", getAdminTrackingSettings);
router.put("/admin", updateAdminTrackingSettings);
router.delete("/admin/:platform", deletePlatformSettings);
router.post("/admin/test-event", testPlatformConnection);

module.exports = router;
