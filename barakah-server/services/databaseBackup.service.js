/**
 * ============================================================================
 * FILE: databaseBackup.service.js
 * VERSION: v1.0.0
 * ----------------------------------------------------------------------------
 * Automated MongoDB Database Backup Service with Telegram Cloud Vault
 * Dumps all collections (products, orders, users, settings, categories, etc.)
 * into compressed JSON files inside a single timestamped .zip archive
 * and transmits it securely to your Telegram Cloud.
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const connectDB = require("../config/db");
const telegramBackupService = require("./telegramBackup.service");

const STORAGE_DB_BACKUPS_DIR = path.resolve(__dirname, "..", "storage", "db-backups");
if (!fs.existsSync(STORAGE_DB_BACKUPS_DIR)) {
  fs.mkdirSync(STORAGE_DB_BACKUPS_DIR, { recursive: true });
}

class DatabaseBackupService {
  /**
   * Generates a complete dump of all MongoDB collections and packs into .zip
   */
  async createDatabaseBackupZip() {
    const db = await connectDB();
    const collections = await db.listCollections().toArray();

    const timestamp = Date.now();
    const dateTag = new Date().toISOString().replace(/[:.]/g, "-");
    const zip = new AdmZip();

    const metadata = {
      backupType: "MongoDB Full Database Vault",
      createdAt: new Date().toISOString(),
      collections: {},
      totalDocuments: 0,
    };

    for (const colInfo of collections) {
      const colName = colInfo.name;
      // Skip system update temporary logs if too huge, or include all
      const docs = await db.collection(colName).find({}).toArray();
      metadata.collections[colName] = docs.length;
      metadata.totalDocuments += docs.length;

      // Add each collection as formatted JSON
      const jsonContent = JSON.stringify(docs, null, 2);
      zip.addFile(`${colName}.json`, Buffer.from(jsonContent, "utf8"));
    }

    zip.addFile("manifest.json", Buffer.from(JSON.stringify(metadata, null, 2), "utf8"));

    const zipFileName = `mongodb-backup-${dateTag}-${timestamp}.zip`;
    const fullZipPath = path.join(STORAGE_DB_BACKUPS_DIR, zipFileName);

    zip.writeZip(fullZipPath);

    return {
      filePath: fullZipPath,
      fileName: zipFileName,
      metadata,
    };
  }

  /**
   * Creates backup and immediately transmits to Telegram with purple database badge
   */
  async backupDatabaseToTelegram(domainName = "sashroyi.shop") {
    const { filePath, fileName, metadata } = await this.createDatabaseBackupZip();
    const config = await telegramBackupService.getConfig();

    if (!config.isEnabled || !config.botToken || !config.chatId) {
      throw new Error("Telegram Bot credentials not configured in settings");
    }

    const dateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const fileSizeMB = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(3);
    const fileSizeKB = (fs.statSync(filePath).size / 1024).toFixed(1);

    const caption = `🗄️⚡ SASHROYI DATABASE CLOUD BACKUP
━━━━━━━━━━━━━━━━━━━━━━━━
🟣 TYPE: MONGODB DATABASE DUMP
🌐 Domain: ${domainName}
📦 File: ${fileName}
📊 Size: ${fileSizeKB} KB (${fileSizeMB} MB)
📝 Total Docs: ${metadata.totalDocuments} records
⏰ Time: ${dateStr} (BST)
━━━━━━━━━━━━━━━━━━━━━━━━
✨ আপনার সম্পূর্ণ ডাটাবেজ (প্রোডাক্ট, অর্ডার, সেটিংস, ক্যাটাগরি ও ইউজার তথ্য) টেলিগ্রাম ক্লাউড ভল্টে নিরাপদে সংরক্ষিত হয়েছে!`;

    const fileBuffer = fs.readFileSync(filePath);
    const fileBlob = new Blob([fileBuffer], { type: "application/zip" });

    const formData = new FormData();
    formData.append("chat_id", config.chatId);
    formData.append("caption", caption);
    formData.append("document", fileBlob, fileName);

    const uploadRes = await fetch(
      `https://api.telegram.org/bot${config.botToken}/sendDocument`,
      {
        method: "POST",
        body: formData,
      }
    );

    const uploadData = await uploadRes.json();

    if (!uploadData.ok) {
      throw new Error(uploadData.description || "Failed to upload DB backup to Telegram");
    }

    // Record in history
    try {
      const db = await connectDB();
      await db.collection("system_update_history").insertOne({
        version: "DATABASE BACKUP",
        appliedAt: new Date(),
        appliedBy: "Database Auto-Backup Service",
        domainName,
        cloudProvider: "Telegram",
        telegramDelivered: true,
        telegramMessageId: uploadData.result.message_id,
        localBackupFile: path.join("db-backups", fileName),
        type: "db_backup",
        metadata,
        status: "db_vault_saved",
      });
    } catch (dbErr) {
      console.warn("Could not log DB backup to history:", dbErr.message);
    }

    return {
      success: true,
      fileName,
      messageId: uploadData.result.message_id,
      totalDocuments: metadata.totalDocuments,
      collectionsCount: Object.keys(metadata.collections).length,
    };
  }
}

module.exports = new DatabaseBackupService();
