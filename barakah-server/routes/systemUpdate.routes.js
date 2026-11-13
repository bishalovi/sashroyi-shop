/**
 * ============================================================================
 * FILE: systemUpdate.routes.js
 * VERSION: v1.2.0
 * ----------------------------------------------------------------------------
 * Express routes for System Core Engine & Updates Manager.
 * Strictly protected by Root Owner verification middleware.
 * ============================================================================
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const verifyRootOwner = require("../middlewares/rootAuth.middleware");
const {
  exportUpdatePackage,
  previewUpdatePackage,
  deployUpdatePackage,
  undoRollbackUpdate,
  getUpdateHistory,
  getTelegramConfig,
  saveTelegramConfig,
  testTelegramConnection,
  getSecurityConfig,
  saveSecurityPin,
} = require("../controllers/systemUpdate.controller");

const tempDir = path.resolve(__dirname, "..", "storage", "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".zip";
    cb(null, `incoming-update-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 300 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes("zip") || file.originalname.endsWith(".zip")) {
      cb(null, true);
    } else {
      cb(new Error("Only .zip update packages are allowed"));
    }
  },
});

// Protect all routes with verifyRootOwner
router.use(verifyRootOwner);

// 1. Export Package
router.post("/export", exportUpdatePackage);

// 2. Preview Package
router.post("/preview", upload.single("updateZip"), previewUpdatePackage);

// 3. Strict Deploy Package (Telegram First)
router.post("/deploy", deployUpdatePackage);

// 4. Undo / Rollback Engine
router.post("/undo", undoRollbackUpdate);

// 5. Update History
router.get("/history", getUpdateHistory);

// 6. Telegram Cloud Backup
router.get("/telegram-config", getTelegramConfig);
router.post("/telegram-config", saveTelegramConfig);
router.get("/test-telegram", testTelegramConnection);

// 7. Security PIN
router.get("/security-config", getSecurityConfig);
router.post("/security-pin", saveSecurityPin);

module.exports = router;
