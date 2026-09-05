/**
 * ============================================================================
 * FILE: shipping.routes.js
 * VERSION: v1.0.0
 * ----------------------------------------------------------------------------
 * USER REQUIREMENT:
 * Express routes for Shipping Settings management.
 * ============================================================================
 */

const express = require("express");
const router = express.Router();
const {
  getPublicShippingSettings,
  getAdminShippingSettings,
  updateAdminShippingSettings,
  testSteadfastConnection,
  testPathaoConnection,
} = require("../controllers/shipping.controller");

router.get("/public", getPublicShippingSettings);
router.get("/admin", getAdminShippingSettings);
router.put("/admin", updateAdminShippingSettings);
router.post("/test-steadfast", testSteadfastConnection);
router.post("/test-pathao", testPathaoConnection);

module.exports = router;
