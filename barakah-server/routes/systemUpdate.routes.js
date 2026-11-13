/**
 * ============================================================================
 * FILE: systemUpdate.routes.js
 * VERSION: v1.0.0
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
  getUpdateHistory,
  getDriveConfig,
  saveDriveConfig,
  testDriveConnection,
  getSecurityConfig,
  saveSecurityPin,
} = require("../controllers/systemUpdate.controller");

// Setup multer storage for temporary update zips
const tempDir = path.resolve(process.cwd(), "storage", "temp");
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
  limits: { fileSize: 300 * 1024 * 1024 }, // 300 MB limit
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

// 2. Preview Package (Upload zip to inspect release notes)
router.post("/preview", upload.single("updateZip"), previewUpdatePackage);

// 3. Deploy Package (Auto Google Drive upload -> unpack & apply)
router.post("/deploy", deployUpdatePackage);

// 4. Update History
router.get("/history", getUpdateHistory);

// 5. Google Drive Integration
router.get("/drive-config", getDriveConfig);
router.post("/drive-config", saveDriveConfig);
router.get("/test-drive", testDriveConnection);

// 6. Security PIN
router.get("/security-config", getSecurityConfig);
router.post("/security-pin", saveSecurityPin);

module.exports = router;
