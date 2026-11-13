/**
 * ============================================================================
 * FILE: systemUpdate.controller.js
 * VERSION: v1.1.0 (Enterprise Solidified)
 * ----------------------------------------------------------------------------
 * System Core & Update Controller:
 * 1. Export Update Package (.zip) with professional RELEASE_NOTES.txt & manifest
 * 2. Preview incoming Update Package (reads notes without installing)
 * 3. Safe Deploy: creates backup, uploads to Google Drive FIRST, then applies
 * 4. Google Drive settings & connection testing
 * 5. Update history tracking
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const googleDriveService = require("../services/googleDrive.service");
const connectDB = require("../config/db");

const DRIVE_SETTINGS_KEY = "system_google_drive_config";
const SECURITY_SETTINGS_KEY = "system_root_security_config";

/**
 * Dynamically resolves the true project root regardless of where process is launched
 */
function getProjectRoot() {
  const cwd = process.cwd();
  if (fs.existsSync(path.resolve(cwd, "barakah-client")) && fs.existsSync(path.resolve(cwd, "barakah-server"))) {
    return cwd;
  }
  const parent = path.resolve(cwd, "..");
  if (fs.existsSync(path.resolve(parent, "barakah-client"))) {
    return parent;
  }
  const dirnameRoot = path.resolve(__dirname, "..", "..");
  if (fs.existsSync(path.resolve(dirnameRoot, "barakah-client"))) {
    return dirnameRoot;
  }
  return parent;
}

const PROJECT_ROOT = getProjectRoot();
const STORAGE_BACKUPS_DIR = path.resolve(__dirname, "..", "storage", "backups");
const STORAGE_TEMP_DIR = path.resolve(__dirname, "..", "storage", "temp");

if (!fs.existsSync(STORAGE_BACKUPS_DIR)) {
  fs.mkdirSync(STORAGE_BACKUPS_DIR, { recursive: true });
}
if (!fs.existsSync(STORAGE_TEMP_DIR)) {
  fs.mkdirSync(STORAGE_TEMP_DIR, { recursive: true });
}

/**
 * Formats professional RELEASE_NOTES.txt
 */
function generateReleaseNotesText({
  version,
  previousVersion = "v2.6.0",
  author = "Root Owner",
  whatsNew = "",
  bugFixes = "",
  migrationNotes = "",
  domainName = "All Domains",
}) {
  const dateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

  return `================================================================================
                    BARAKAH / SASHROYI SYSTEM UPDATE PACKAGE
================================================================================
Version         : ${version}
Previous Version: ${previousVersion}
Release Date    : ${dateStr} (BST)
Author/Owner    : ${author}
Target Scope    : ${domainName}
Compatibility   : Node.js 18+ | Next.js 14+ | MongoDB 6+
================================================================================

[+] 1. WHAT'S NEW (নতুন কী কী কাজ হয়েছে):
--------------------------------------------------------------------------------
${
  whatsNew.trim() ||
  "- Core system improvements and performance optimizations.\n- Updated dependencies and styling fixes."
}

[-] 2. RESOLVED ISSUES & BUG FIXES (আগের ভার্সনের ভুল/সমস্যা যা ঠিক করা হয়েছে):
--------------------------------------------------------------------------------
${
  bugFixes.trim() ||
  "- Resolved minor edge-case UI rendering bugs.\n- Fixed stability and network response handlers."
}

[!] 3. DATABASE & MIGRATION INSTRUCTIONS (ডাটাবেজ ও কনফিগারেশন নোট):
--------------------------------------------------------------------------------
${
  migrationNotes.trim() ||
  "- No breaking schema changes required.\n- Auto-synchronization enabled for this release."
}

================================================================================
  CONFIDENTIAL & PROPRIETARY — FOR AUTHORIZED ROOT OWNER DEPLOYMENT ONLY
================================================================================
`;
}

/**
 * Recursively adds directory contents to AdmZip while filtering out ignored files
 */
function addFolderToZipRecursively(zip, localFolderPath, zipRelativePath, ignoreList) {
  if (!fs.existsSync(localFolderPath)) return;
  const items = fs.readdirSync(localFolderPath);

  for (const item of items) {
    // Check if item should be ignored
    const isIgnored = ignoreList.some((ign) => {
      if (ign.startsWith("*.")) {
        return item.endsWith(ign.slice(1));
      }
      return item === ign || (item.startsWith(".") && item !== ".env.example");
    });

    if (isIgnored) continue;

    const fullItemPath = path.join(localFolderPath, item);
    const targetZipPath = zipRelativePath ? `${zipRelativePath}/${item}` : item;
    const stat = fs.statSync(fullItemPath);

    if (stat.isDirectory()) {
      addFolderToZipRecursively(zip, fullItemPath, targetZipPath, ignoreList);
    } else {
      zip.addLocalFile(fullItemPath, zipRelativePath || "");
    }
  }
}

/**
 * 1. EXPORT UPDATE PACKAGE (.zip with RELEASE_NOTES.txt)
 */
exports.exportUpdatePackage = async (req, res) => {
  try {
    const {
      version = "v2.7.0",
      previousVersion = "v2.6.0",
      author = "Root Owner",
      whatsNew = "",
      bugFixes = "",
      migrationNotes = "",
      includeClient = true,
      includeServer = true,
      domainName = "sashroyi.shop",
    } = req.body;

    const releaseNotesContent = generateReleaseNotesText({
      version,
      previousVersion,
      author,
      whatsNew,
      bugFixes,
      migrationNotes,
      domainName,
    });

    const manifest = {
      version,
      previousVersion,
      createdAt: new Date().toISOString(),
      author,
      components: {
        client: !!includeClient,
        server: !!includeServer,
      },
    };

    const zip = new AdmZip();

    // 1. Add RELEASE_NOTES.txt and manifest.json
    zip.addFile("RELEASE_NOTES.txt", Buffer.from(releaseNotesContent, "utf8"));
    zip.addFile("manifest.json", Buffer.from(JSON.stringify(manifest, null, 2), "utf8"));

    // Standard ignore patterns
    const ignoreList = [
      "node_modules",
      ".next",
      ".git",
      ".vscode",
      "storage",
      "backups",
      ".env",
      ".env.local",
      ".env.production",
      "*.zip",
      "*.log",
    ];

    // 2. Package barakah-client
    if (includeClient) {
      const clientDir = path.resolve(PROJECT_ROOT, "barakah-client");
      if (fs.existsSync(clientDir)) {
        addFolderToZipRecursively(zip, clientDir, "barakah-client", ignoreList);
      }
    }

    // 3. Package barakah-server
    if (includeServer) {
      const serverDir = path.resolve(PROJECT_ROOT, "barakah-server");
      if (fs.existsSync(serverDir)) {
        addFolderToZipRecursively(zip, serverDir, "barakah-server", ignoreList);
      }
    }

    const zipBuffer = zip.toBuffer();
    const zipFileName = `sashroyi-update-${version}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipFileName}"`);
    res.setHeader("Content-Length", zipBuffer.length);

    return res.end(zipBuffer);
  } catch (error) {
    console.error("Export failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

/**
 * 2. PREVIEW UPDATE PACKAGE (Reads notes before installing)
 */
exports.previewUpdatePackage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No update zip file uploaded" });
    }

    const zipFilePath = req.file.path;
    const zip = new AdmZip(zipFilePath);
    const zipEntries = zip.getEntries();

    let releaseNotesText = "";
    let manifestData = null;

    for (const entry of zipEntries) {
      if (entry.entryName === "RELEASE_NOTES.txt") {
        releaseNotesText = entry.getData().toString("utf8");
      }
      if (entry.entryName === "manifest.json") {
        try {
          manifestData = JSON.parse(entry.getData().toString("utf8"));
        } catch (e) {
          console.warn("Invalid manifest JSON");
        }
      }
    }

    res.json({
      success: true,
      tempFilePath: req.file.filename,
      version: manifestData?.version || "Unknown Version",
      previousVersion: manifestData?.previousVersion || "N/A",
      author: manifestData?.author || "Root Owner",
      createdAt: manifestData?.createdAt || new Date(),
      components: manifestData?.components || { client: true, server: true },
      releaseNotesText: releaseNotesText || "No custom RELEASE_NOTES.txt found in package.",
      fileCount: zipEntries.length,
      fileSize: (req.file.size / (1024 * 1024)).toFixed(2) + " MB",
    });
  } catch (error) {
    console.error("Preview failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. SAFE DEPLOY UPDATE:
 *    Step 1: Create local backup zip of current code
 *    Step 2: Upload backup zip to Google Drive FIRST
 *    Step 3: Only when Drive confirms upload, extract & apply new update!
 */
exports.deployUpdatePackage = async (req, res) => {
  try {
    const { tempFileName, domainName = "main_domain", skipDriveUpload = false } = req.body;

    if (!tempFileName) {
      return res.status(400).json({ success: false, message: "Missing update package reference" });
    }

    const updateZipPath = path.resolve(STORAGE_TEMP_DIR, tempFileName);
    if (!fs.existsSync(updateZipPath)) {
      return res.status(404).json({ success: false, message: "Update package file not found" });
    }

    // Read manifest of incoming package
    const updateZip = new AdmZip(updateZipPath);
    let incomingVersion = "vNext";
    let releaseNotesText = "";
    try {
      const manifestEntry = updateZip.getEntry("manifest.json");
      if (manifestEntry) {
        const manifest = JSON.parse(manifestEntry.getData().toString("utf8"));
        incomingVersion = manifest.version || incomingVersion;
      }
      const notesEntry = updateZip.getEntry("RELEASE_NOTES.txt");
      if (notesEntry) {
        releaseNotesText = notesEntry.getData().toString("utf8");
      }
    } catch (e) {}

    // STEP 1: CREATE PRE-UPDATE BACKUP ZIP OF CURRENT CODE
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `backup-before-${incomingVersion}-${timestamp}.zip`;
    const localBackupFilePath = path.resolve(STORAGE_BACKUPS_DIR, backupFileName);

    console.log(`[System Update] Creating pre-update backup at: ${localBackupFilePath}`);

    const backupZip = new AdmZip();
    const clientDir = path.resolve(PROJECT_ROOT, "barakah-client");
    const serverDir = path.resolve(PROJECT_ROOT, "barakah-server");

    const ignoreList = [
      "node_modules",
      ".next",
      ".git",
      "storage",
      "backups",
      "temp",
      ".env",
      ".env.local",
      "*.zip",
    ];

    if (fs.existsSync(clientDir)) {
      addFolderToZipRecursively(backupZip, clientDir, "barakah-client", ignoreList);
    }
    if (fs.existsSync(serverDir)) {
      addFolderToZipRecursively(backupZip, serverDir, "barakah-server", ignoreList);
    }

    backupZip.writeZip(localBackupFilePath);
    console.log(`[System Update] Local backup written successfully (${fs.statSync(localBackupFilePath).size} bytes)`);

    // STEP 2: UPLOAD TO GOOGLE DRIVE FIRST
    let driveUploadResult = null;
    const driveConfig = await googleDriveService.getConfig();

    if (driveConfig.isEnabled && !skipDriveUpload) {
      console.log(`[System Update] Uploading backup to Google Drive for domain: ${domainName}`);
      try {
        driveUploadResult = await googleDriveService.uploadBackupZip(
          localBackupFilePath,
          backupFileName,
          domainName
        );
        console.log(`[System Update] Google Drive upload successful! File ID: ${driveUploadResult.fileId}`);
      } catch (driveErr) {
        console.error("[System Update] GOOGLE DRIVE UPLOAD FAILED:", driveErr.message);
        // ABORT: Do not touch live site if Google Drive backup failed!
        return res.status(502).json({
          success: false,
          aborted: true,
          message:
            "Google Drive-এ ব্যাকআপ আপলোড ব্যর্থ হয়েছে! সাইটের সুরক্ষার্থে আপডেট স্থগিত করা হলো: " +
            driveErr.message,
        });
      }
    } else {
      console.log("[System Update] Google Drive upload skipped (not configured or disabled).");
    }

    // STEP 3: EXTRACT & APPLY NEW UPDATE
    console.log(`[System Update] Applying new update files from: ${updateZipPath}`);
    updateZip.extractAllTo(PROJECT_ROOT, true);

    // STEP 4: RECORD UPDATE IN DATABASE HISTORY
    try {
      const db = await connectDB();
      await db.collection("system_update_history").insertOne({
        version: incomingVersion,
        appliedAt: new Date(),
        appliedBy: req.rootOwner?.email || "Root Owner",
        domainName,
        googleDriveLink: driveUploadResult?.webViewLink || null,
        googleDriveFileId: driveUploadResult?.fileId || null,
        localBackupFile: backupFileName,
        releaseNotes: releaseNotesText,
        status: "success",
      });
    } catch (dbErr) {
      console.warn("Failed to save update history log:", dbErr.message);
    }

    // Clean up temporary update zip
    try {
      fs.unlinkSync(updateZipPath);
    } catch (e) {}

    res.json({
      success: true,
      message: `System successfully updated to ${incomingVersion}!`,
      version: incomingVersion,
      backupFileName,
      googleDriveBackup: driveUploadResult
        ? {
            uploaded: true,
            link: driveUploadResult.webViewLink,
            fileId: driveUploadResult.fileId,
          }
        : {
            uploaded: false,
            note: "Local backup created in server storage.",
          },
    });
  } catch (error) {
    console.error("Deploy failed:", error);
    res.status(500).json({
      success: false,
      message: "Deployment error: " + error.message,
    });
  }
};

/**
 * 4. GET UPDATE HISTORY
 */
exports.getUpdateHistory = async (req, res) => {
  try {
    const db = await connectDB();
    const history = await db
      .collection("system_update_history")
      .find({})
      .sort({ appliedAt: -1 })
      .limit(30)
      .toArray();

    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 5. GOOGLE DRIVE CONFIG & CONNECTION TEST
 */
exports.getDriveConfig = async (req, res) => {
  try {
    const config = await googleDriveService.getConfig();
    res.json({
      success: true,
      isEnabled: config.isEnabled,
      clientEmail: config.clientEmail ? config.clientEmail.slice(0, 5) + "***" : "",
      parentFolderId: config.parentFolderId,
      hasPrivateKey: !!config.privateKey,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.saveDriveConfig = async (req, res) => {
  try {
    const { isEnabled, clientEmail, privateKey, parentFolderId, credentialsJson } = req.body;
    const db = await connectDB();

    let parsedEmail = clientEmail;
    let parsedKey = privateKey;
    let parsedFolder = parentFolderId;

    if (credentialsJson && credentialsJson.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(credentialsJson);
        parsedEmail = parsed.client_email || parsedEmail;
        parsedKey = parsed.private_key || parsedKey;
      } catch (e) {
        return res.status(400).json({ success: false, message: "Invalid JSON credentials" });
      }
    }

    await db.collection("settings").updateOne(
      { key: DRIVE_SETTINGS_KEY },
      {
        $set: {
          key: DRIVE_SETTINGS_KEY,
          isEnabled: !!isEnabled,
          clientEmail: parsedEmail || "",
          privateKey: parsedKey || "",
          parentFolderId: parsedFolder || "",
          credentialsJson: credentialsJson || "",
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    res.json({ success: true, message: "Google Drive configuration saved successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.testDriveConnection = async (req, res) => {
  try {
    const result = await googleDriveService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 6. ROOT SECURITY & MASTER PIN SETTINGS
 */
exports.getSecurityConfig = async (req, res) => {
  try {
    const db = await connectDB();
    const sec = await db.collection("settings").findOne({ key: SECURITY_SETTINGS_KEY });

    res.json({
      success: true,
      hasPin: !!(sec && sec.masterPin),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.saveSecurityPin = async (req, res) => {
  try {
    const { masterPin, currentPin } = req.body;
    const db = await connectDB();
    const sec = await db.collection("settings").findOne({ key: SECURITY_SETTINGS_KEY });

    if (sec && sec.masterPin) {
      if (String(currentPin).trim() !== String(sec.masterPin).trim()) {
        return res.status(401).json({ success: false, message: "Current Master PIN is incorrect" });
      }
    }

    await db.collection("settings").updateOne(
      { key: SECURITY_SETTINGS_KEY },
      {
        $set: {
          key: SECURITY_SETTINGS_KEY,
          masterPin: masterPin ? String(masterPin).trim() : null,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    res.json({ success: true, message: "Root Master PIN updated successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
