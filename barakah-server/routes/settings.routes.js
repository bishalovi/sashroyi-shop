/**
 * ============================================================================
 * FILE: settings.routes.js
 * VERSION: v1.0.0
 * ----------------------------------------------------------------------------
 * Express routes for Website Settings & Customization Hub.
 * ============================================================================
 */

const express = require("express");
const router = express.Router();
const {
  getPublicSettings,
  getAdminSettings,
  updateAdminSettings,
} = require("../controllers/settings.controller");

router.get("/public", getPublicSettings);
router.get("/admin", getAdminSettings);
router.put("/admin", updateAdminSettings);

module.exports = router;
