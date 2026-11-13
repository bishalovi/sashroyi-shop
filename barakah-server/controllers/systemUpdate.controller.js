/**
 * ============================================================================
 * FILE: systemUpdate.controller.js
 * VERSION: v1.4.0 (Strict Telegram Pre-Condition & Multi-Level Undo / Rollback)
 * ----------------------------------------------------------------------------
 * 1. Export Update Package (.zip) with professional RELEASE_NOTES.txt
 * 2. Preview incoming Update Package (reads notes without installing)
 * 3. Safe Deploy: STRICT Telegram send confirmation BEFORE unpacking
 * 4. Undo / Rollback Engine: Restore up to last 5+ versions with 1-click
 * 5. Telegram Cloud settings & connection testing
 * 6. Update history tracking
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const telegramBackupService = require("../services/telegramBackup.service");
const connectDB = require("../config/db");

const TELEGRAM_SETTINGS_KEY = "system_telegram_backup_config";
const SECURITY_SETTINGS_KEY = "system_root_security_config";

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
${whatsNew.trim()}

[-] 2. RESOLVED ISSUES & BUG FIXES (আগের ভার্সনের ভুল/সমস্যা যা ঠিক করা হয়েছে):
--------------------------------------------------------------------------------
${bugFixes.trim()}

[!] 3. DATABASE & MIGRATION INSTRUCTIONS (ডাটাবেজ ও কনফিগারেশন নোট):
--------------------------------------------------------------------------------
${migrationNotes.trim()}

================================================================================
  CONFIDENTIAL & PROPRIETARY — FOR AUTHORIZED ROOT OWNER DEPLOYMENT ONLY
================================================================================
`;
}

function addFolderToZipRecursively(zip, localFolderPath, zipRelativePath, ignoreList) {
  if (!fs.existsSync(localFolderPath)) return;
  const items = fs.readdirSync(localFolderPath);

  for (const item of items) {
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

    zip.addFile("RELEASE_NOTES.txt", Buffer.from(releaseNotesContent, "utf8"));
    zip.addFile("manifest.json", Buffer.from(JSON.stringify(manifest, null, 2), "utf8"));

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

    if (includeClient) {
      const clientDir = path.resolve(PROJECT_ROOT, "barakah-client");
      if (fs.existsSync(clientDir)) {
        addFolderToZipRecursively(zip, clientDir, "barakah-client", ignoreList);
      }
    }

    if (includeServer) {
      const serverDir = path.resolve(PROJECT_ROOT, "barakah-server");
      if (fs.existsSync(serverDir)) {
        addFolderToZipRecursively(zip, serverDir, "barakah-server", ignoreList);
      }
    }

    const zipBuffer = zip.toBuffer();
    const zipFileName = `sashroyi-export-${version}.zip`;

    // Also automatically backup this export package to Telegram Cloud Vault!
    try {
      const tempExportDir = path.resolve(STORAGE_BACKUPS_DIR, "exports");
      if (!fs.existsSync(tempExportDir)) {
        fs.mkdirSync(tempExportDir, { recursive: true });
      }
      const tempExportPath = path.join(tempExportDir, zipFileName);
      fs.writeFileSync(tempExportPath, zipBuffer);

      telegramBackupService.uploadBackupZip(
        tempExportPath,
        zipFileName,
        domainName,
        releaseNotesContent,
        "export_package"
      ).then(async (teleRes) => {
        console.log(`[System Update] Export archive backed up to Telegram! Message ID: ${teleRes.messageId}`);
        const db = await connectDB();
        await db.collection("system_update_history").insertOne({
          version: `EXPORT ${version}`,
          appliedAt: new Date(),
          appliedBy: req.rootOwner?.email || author || "Root Owner",
          domainName,
          cloudProvider: "Telegram",
          telegramDelivered: true,
          telegramMessageId: teleRes.messageId,
          localBackupFile: path.join("exports", zipFileName),
          type: "export",
          releaseNotes: releaseNotesContent,
          status: "exported",
        });
      }).catch(err => {
        console.warn("[System Update] Could not auto-send export to Telegram:", err.message);
      });
    } catch (saveErr) {
      console.warn("Could not save local export copy:", saveErr.message);
    }

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
 * 2. PREVIEW UPDATE PACKAGE
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
 * 3. STRICT DEPLOY UPDATE:
 *    Step 1: Check Telegram configuration
 *    Step 2: Create local backup zip of current live code
 *    Step 3: UPLOAD TO TELEGRAM FIRST -> MUST RECEIVE 100% SUCCESS CONFIRMATION
 *    Step 4: Only when Telegram delivery confirms, extract new update!
 */
exports.deployUpdatePackage = async (req, res) => {
  try {
    const { tempFileName, domainName = "main_domain" } = req.body;

    if (!tempFileName) {
      return res.status(400).json({ success: false, message: "Missing update package reference" });
    }

    // 1. STRICT TELEGRAM CHECK
    const telegramConfig = await telegramBackupService.getConfig();
    if (!telegramConfig.isEnabled || !telegramConfig.botToken || !telegramConfig.chatId) {
      return res.status(400).json({
        success: false,
        aborted: true,
        message:
          "টেলিগ্রাম ক্লাউড ব্যাকআপ সক্রিয় নেই! টেলিগ্রামের সাথে পূর্ণ কানেকশন এবং ব্যাকআপ সফলভাবে সেন্ড হওয়া নিশ্চিত না হওয়া পর্যন্ত আপডেট শুরু করা অসম্ভব। দয়া করে আগে টেলিগ্রাম কনফিগার করুন।",
      });
    }

    const updateZipPath = path.resolve(STORAGE_TEMP_DIR, tempFileName);
    if (!fs.existsSync(updateZipPath)) {
      return res.status(404).json({ success: false, message: "Update package file not found" });
    }

    // Read manifest
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

    // STEP 2: CREATE PRE-UPDATE SNAPSHOT BACKUP OF CURRENT CODE
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `backup-before-${incomingVersion}-${timestamp}.zip`;
    const localBackupFilePath = path.resolve(STORAGE_BACKUPS_DIR, backupFileName);

    console.log(`[System Update] Generating pre-update safety backup at: ${localBackupFilePath}`);

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
    console.log(`[System Update] Local safety backup generated (${fs.statSync(localBackupFilePath).size} bytes)`);

    // STEP 3: STRICT UPLOAD TO TELEGRAM FIRST
    let cloudUploadResult = null;
    try {
      console.log(`[System Update] Uploading backup to Telegram Cloud...`);
      cloudUploadResult = await telegramBackupService.uploadBackupZip(
        localBackupFilePath,
        backupFileName,
        domainName,
        releaseNotesText,
        "import_pre_backup"
      );
      console.log(`[System Update] Telegram upload CONFIRMED 100%! Message ID: ${cloudUploadResult.messageId}`);
    } catch (teleErr) {
      console.error("[System Update] TELEGRAM UPLOAD FAILED. ABORTING DEPLOY:", teleErr.message);
      try { fs.unlinkSync(localBackupFilePath); } catch (e) {}

      return res.status(502).json({
        success: false,
        aborted: true,
        message: `টেলিগ্রামে ব্যাকআপ পাঠানো ব্যর্থ হয়েছে (${teleErr.message})! টেলিগ্রামে নিশ্চিতভাবে ব্যাকআপ ডেলিভারি না হওয়া পর্যন্ত সাইটের কোনো কোড পরিবর্তন করা হবে না।`,
      });
    }

    // STEP 4: TELEGRAM CONFIRMED -> NOW APPLY THE NEW UPDATE
    console.log(`[System Update] Applying new update files from: ${updateZipPath}`);
    updateZip.extractAllTo(PROJECT_ROOT, true);

    // STEP 5: RECORD IN DATABASE FOR MULTI-LEVEL UNDO
    try {
      const db = await connectDB();
      await db.collection("system_update_history").insertOne({
        version: incomingVersion,
        appliedAt: new Date(),
        appliedBy: req.rootOwner?.email || "Root Owner",
        domainName,
        cloudProvider: "Telegram",
        telegramDelivered: true,
        telegramMessageId: cloudUploadResult?.messageId,
        localBackupFile: backupFileName,
        type: "import",
        releaseNotes: releaseNotesText,
        status: "active",
      });
    } catch (dbErr) {
      console.warn("Failed to record history log:", dbErr.message);
    }

    try { fs.unlinkSync(updateZipPath); } catch (e) {}

    res.json({
      success: true,
      message: `System successfully updated to ${incomingVersion}!`,
      version: incomingVersion,
      backupFileName,
      telegramChat: cloudUploadResult.chatTitle,
      telegramMessageId: cloudUploadResult.messageId,
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
 * 4. UNDO / ROLLBACK ENGINE
 *    Can restore the last update or any past backup from history!
 */
exports.undoRollbackUpdate = async (req, res) => {
  try {
    const { backupFileName } = req.body;
    const db = await connectDB();

    let targetFile = backupFileName;

    if (!targetFile) {
      const lastUpdate = await db
        .collection("system_update_history")
        .findOne({ localBackupFile: { $exists: true, $ne: null }, status: { $ne: "rolled_back" } }, { sort: { appliedAt: -1 } });

      if (lastUpdate && lastUpdate.localBackupFile) {
        targetFile = lastUpdate.localBackupFile;
      }
    }

    if (!targetFile) {
      return res.status(404).json({
        success: false,
        message: "আনডু করার মতো কোনো পূর্ববর্তী ব্যাকআপ ফাইল পাওয়া যায়নি।",
      });
    }

    const backupFilePath = path.resolve(STORAGE_BACKUPS_DIR, targetFile);

    if (!fs.existsSync(backupFilePath)) {
      return res.status(404).json({
        success: false,
        message: `ব্যাকআপ ফাইলটি সার্ভারে পাওয়া যায়নি: ${targetFile}`,
      });
    }

    console.log(`[System Update] Performing UNDO / Rollback from: ${backupFilePath}`);

    const restoreZip = new AdmZip(backupFilePath);
    restoreZip.extractAllTo(PROJECT_ROOT, true);

    await db.collection("system_update_history").insertOne({
      version: "ROLLBACK",
      appliedAt: new Date(),
      appliedBy: req.rootOwner?.email || "Root Owner",
      restoredFrom: targetFile,
      status: "rolled_back",
      releaseNotes: `System successfully rolled back using backup archive: ${targetFile}`,
    });

    console.log(`[System Update] UNDO / Rollback COMPLETED SUCCESSFULLY.`);

    res.json({
      success: true,
      message: "সফলভাবে পূর্ববর্তী ভার্সনে সাইট ফিরিয়ে নেওয়া হয়েছে (Undo / Rollback Successful)!",
      restoredBackup: targetFile,
    });
  } catch (error) {
    console.error("Rollback error:", error);
    res.status(500).json({
      success: false,
      message: "Rollback failed: " + error.message,
    });
  }
};

/**
 * 5. GET UPDATE HISTORY & AVAILABLE UNDO POINTS
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

    const historyWithAvailability = history.map((h) => {
      let isRestorable = false;
      if (h.localBackupFile) {
        const fullPath = path.resolve(STORAGE_BACKUPS_DIR, h.localBackupFile);
        isRestorable = fs.existsSync(fullPath);
      }
      return {
        ...h,
        isRestorable,
      };
    });

    res.json({ success: true, history: historyWithAvailability });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 6. TELEGRAM CONFIG & CONNECTION TEST
 */
exports.getTelegramConfig = async (req, res) => {
  try {
    const config = await telegramBackupService.getConfig();
    res.json({
      success: true,
      isEnabled: config.isEnabled,
      botToken: config.botToken ? config.botToken.slice(0, 8) + "*******************" : "",
      chatId: config.chatId || "",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.saveTelegramConfig = async (req, res) => {
  try {
    const { isEnabled, botToken, chatId } = req.body;
    const db = await connectDB();

    const cleanChatId = String(chatId || "").trim();
    let cleanToken = botToken ? String(botToken).trim() : "";

    // If botToken was masked (e.g. 92651509*******************), fetch the existing real token from DB
    if (!cleanToken || cleanToken.includes("*****")) {
      const existing = await db.collection("settings").findOne({ key: TELEGRAM_SETTINGS_KEY });
      cleanToken = existing?.botToken || process.env.TELEGRAM_BOT_TOKEN || "";
    }

    // Proactive live validation before saving!
    if (isEnabled && cleanToken && cleanChatId) {
      // 1. Verify token
      const meRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
      const meData = await meRes.json();
      if (!meData.ok) {
        return res.status(400).json({
          success: false,
          message: `ভুল টেলিগ্রাম বট টোকেন: ${meData.description || "Invalid Bot Token"}`,
        });
      }

      // 2. Verify chat ID (prevent bot-to-bot 403 or invalid chat ID)
      const botId = String(meData.result.id);
      if (cleanChatId === botId) {
        return res.status(400).json({
          success: false,
          message: "ভুল Chat ID! আপনি বটের নিজের আইডি দিয়েছেন। টেলিগ্রাম বট নিজেকে মেসেজ পাঠাতে পারে না। আপনার নিজের ইউজার আইডি দিন।",
        });
      }

      // 3. Send quick verification ping
      const pingRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: cleanChatId,
          text: `🔔 *Telegram Vault Connected!*\n\nSashroyi Update Backup Vault has been linked with @${meData.result.username}.`,
          parse_mode: "Markdown",
        }),
      });
      const pingData = await pingRes.json();
      if (!pingData.ok) {
        return res.status(400).json({
          success: false,
          message: `টেলিগ্রাম যাচাইকরণ ব্যর্থ: ${pingData.description || "Chat ID invalid"}. নিশ্চিত করুন আপনি বটে @${meData.result.username} এ গিয়ে /start দিয়েছেন।`,
        });
      }
    }

    const updateFields = {
      key: TELEGRAM_SETTINGS_KEY,
      isEnabled: isEnabled !== undefined ? !!isEnabled : true,
      chatId: cleanChatId,
      updatedAt: new Date(),
    };

    if (cleanToken) {
      updateFields.botToken = cleanToken;
    }

    await db.collection("settings").updateOne(
      { key: TELEGRAM_SETTINGS_KEY },
      { $set: updateFields },
      { upsert: true }
    );

    res.json({
      success: true,
      message: "Telegram Cloud কনফিগারেশন সফলভাবে যাচাই ও সেভ হয়েছে!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.testTelegramConnection = async (req, res) => {
  try {
    const result = await telegramBackupService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 7. ROOT SECURITY & MASTER PIN SETTINGS
 */
exports.getSecurityConfig = async (req, res) => {
  try {
    const db = await connectDB();
    const sec = await db.collection("settings").findOne({ key: SECURITY_SETTINGS_KEY });

    res.json({
      success: true,
      isEnabled: !!(sec && sec.isEnabled),
      hasPin: !!(sec && sec.masterPin),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.saveSecurityPin = async (req, res) => {
  try {
    const { masterPin, currentPin, isEnabled } = req.body;
    const db = await connectDB();
    const sec = await db.collection("settings").findOne({ key: SECURITY_SETTINGS_KEY });

    if (sec && sec.isEnabled && sec.masterPin) {
      if (String(currentPin).trim() !== String(sec.masterPin).trim()) {
        return res.status(401).json({ success: false, message: "Current Master PIN is incorrect" });
      }
    }

    await db.collection("settings").updateOne(
      { key: SECURITY_SETTINGS_KEY },
      {
        $set: {
          key: SECURITY_SETTINGS_KEY,
          isEnabled: isEnabled !== undefined ? !!isEnabled : true,
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
