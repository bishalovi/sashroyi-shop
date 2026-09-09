const express = require("express");
const router = express.Router();
const blacklistController = require("../controllers/blacklist.controller");

// Check if visitor/device/IP is blacklisted
router.get("/check", blacklistController.checkBlacklist);
router.post("/check", blacklistController.checkBlacklist);

// Block an entity
router.post("/block", blacklistController.blockEntity);

// Unblock an entity
router.post("/unblock", blacklistController.unblockEntity);

module.exports = router;
