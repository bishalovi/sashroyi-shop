/**
 * ============================================================================
 * FILE: googleDrive.service.js
 * VERSION: v1.0.0
 * ----------------------------------------------------------------------------
 * Google Drive Cloud Backup Service for Barakah / Sashroyi E-Commerce.
 * Automatically uploads pre-update backup archives to dedicated Google Drive
 * folders before applying any system updates.
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const connectDB = require("../config/db");

const DRIVE_SETTINGS_KEY = "system_google_drive_config";

class GoogleDriveService {
  /**
   * Retrieves Google Drive configuration from Database or Environment
   */
  async getConfig() {
    try {
      const db = await connectDB();
      const settings = await db
        .collection("settings")
        .findOne({ key: DRIVE_SETTINGS_KEY });

      if (settings && settings.isEnabled) {
        return {
          isEnabled: true,
          clientEmail: settings.clientEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          privateKey: settings.privateKey
            ? settings.privateKey.replace(/\\n/g, "\n")
            : process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          parentFolderId: settings.parentFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID,
          credentialsJson: settings.credentialsJson || "",
        };
      }
    } catch (err) {
      console.warn("Could not read Drive config from DB, falling back to ENV:", err.message);
    }

    // Fallback to .env
    const envEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const envKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
    const envFolder = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (envEmail && envKey) {
      return {
        isEnabled: true,
        clientEmail: envEmail,
        privateKey: envKey.replace(/\\n/g, "\n"),
        parentFolderId: envFolder || "",
      };
    }

    // Check for service account JSON file
    const serviceAccountFile = path.resolve(process.cwd(), "google-service-account.json");
    if (fs.existsSync(serviceAccountFile)) {
      try {
        const fileContent = JSON.parse(fs.readFileSync(serviceAccountFile, "utf-8"));
        return {
          isEnabled: true,
          clientEmail: fileContent.client_email,
          privateKey: fileContent.private_key,
          parentFolderId: envFolder || "",
        };
      } catch (e) {
        console.error("Failed to parse google-service-account.json:", e.message);
      }
    }

    return {
      isEnabled: false,
      clientEmail: "",
      privateKey: "",
      parentFolderId: "",
    };
  }

  /**
   * Initializes and authenticates Google Drive v3 client
   */
  async getDriveClient() {
    const config = await this.getConfig();

    let clientEmail = config.clientEmail;
    let privateKey = config.privateKey;

    if (config.credentialsJson) {
      try {
        const parsed = JSON.parse(config.credentialsJson);
        clientEmail = parsed.client_email || clientEmail;
        privateKey = parsed.private_key || privateKey;
      } catch (e) {
        // use standard clientEmail/privateKey
      }
    }

    if (!clientEmail || !privateKey) {
      throw new Error(
        "Google Drive API is not configured. Please provide Google Service Account credentials."
      );
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    return google.drive({ version: "v3", auth });
  }

  /**
   * Tests the Google Drive API connection and folder access
   */
  async testConnection() {
    try {
      const drive = await this.getDriveClient();
      const config = await this.getConfig();

      // Test listing files
      const params = {
        pageSize: 5,
        fields: "files(id, name, mimeType)",
      };

      if (config.parentFolderId) {
        params.q = `'${config.parentFolderId}' in parents and trashed = false`;
      }

      const res = await drive.files.list(params);

      let targetFolderInfo = null;
      if (config.parentFolderId) {
        try {
          const folderRes = await drive.files.get({
            fileId: config.parentFolderId,
            fields: "id, name",
          });
          targetFolderInfo = folderRes.data;
        } catch (fErr) {
          console.warn("Folder info lookup error:", fErr.message);
        }
      }

      return {
        success: true,
        message: "Google Drive connection test successful!",
        targetFolder: targetFolderInfo ? targetFolderInfo.name : "Default Root",
        folderId: config.parentFolderId || "root",
        filesFound: res.data.files ? res.data.files.length : 0,
      };
    } catch (error) {
      return {
        success: false,
        message: `Google Drive Connection Failed: ${error.message}`,
      };
    }
  }

  /**
   * Finds or creates a sub-folder (e.g. for domain name) inside parent backup folder
   */
  async getOrCreateSubFolder(folderName, parentFolderId) {
    const drive = await this.getDriveClient();

    let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`;
    if (parentFolderId) {
      query += ` and '${parentFolderId}' in parents`;
    }

    const existing = await drive.files.list({
      q: query,
      fields: "files(id, name)",
      spaces: "drive",
    });

    if (existing.data.files && existing.data.files.length > 0) {
      return existing.data.files[0].id;
    }

    // Create new folder
    const fileMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentFolderId ? [parentFolderId] : [],
    };

    const newFolder = await drive.files.create({
      resource: fileMetadata,
      fields: "id, name",
    });

    return newFolder.data.id;
  }

  /**
   * Uploads a backup zip file stream to Google Drive
   */
  async uploadBackupZip(filePath, fileName, domainName = "main_domain") {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file not found at: ${filePath}`);
    }

    const drive = await this.getDriveClient();
    const config = await this.getConfig();

    let targetFolderId = config.parentFolderId;

    // Organize inside domain-specific subfolder if parent folder is configured
    if (targetFolderId) {
      try {
        const cleanDomainName = domainName.replace(/[^a-zA-Z0-9_-]/g, "_");
        targetFolderId = await this.getOrCreateSubFolder(cleanDomainName, config.parentFolderId);
      } catch (subErr) {
        console.warn("Subfolder creation failed, uploading to parent folder:", subErr.message);
        targetFolderId = config.parentFolderId;
      }
    }

    const fileMetadata = {
      name: fileName,
      parents: targetFolderId ? [targetFolderId] : [],
      description: `Automated pre-update backup for ${domainName} taken before system upgrade.`,
    };

    const media = {
      mimeType: "application/zip",
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id, name, webViewLink, size, createdTime",
    });

    return {
      success: true,
      fileId: response.data.id,
      fileName: response.data.name,
      webViewLink: response.data.webViewLink,
      size: response.data.size,
      createdTime: response.data.createdTime,
    };
  }

  /**
   * Lists existing backups from Google Drive
   */
  async listBackups(domainName) {
    try {
      const drive = await this.getDriveClient();
      const config = await this.getConfig();

      let targetFolderId = config.parentFolderId;
      if (targetFolderId && domainName) {
        const cleanDomain = domainName.replace(/[^a-zA-Z0-9_-]/g, "_");
        try {
          const subFolderRes = await drive.files.list({
            q: `mimeType = 'application/vnd.google-apps.folder' and name = '${cleanDomain}' and '${targetFolderId}' in parents and trashed = false`,
            fields: "files(id)",
          });
          if (subFolderRes.data.files && subFolderRes.data.files.length > 0) {
            targetFolderId = subFolderRes.data.files[0].id;
          }
        } catch (e) {
          // fallback to parent
        }
      }

      let q = "trashed = false and mimeType = 'application/zip'";
      if (targetFolderId) {
        q += ` and '${targetFolderId}' in parents`;
      }

      const res = await drive.files.list({
        q: q,
        pageSize: 20,
        fields: "files(id, name, webViewLink, size, createdTime)",
        orderBy: "createdTime desc",
      });

      return {
        success: true,
        files: res.data.files || [],
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        files: [],
      };
    }
  }
}

module.exports = new GoogleDriveService();
