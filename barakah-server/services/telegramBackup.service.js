/**
 * ============================================================================
 * FILE: telegramBackup.service.js
 * VERSION: v1.0.0
 * ----------------------------------------------------------------------------
 * 100% Free Lifetime Cloud Backup Service using Telegram Bot API.
 * Automatically sends pre-update backup archives directly to your private
 * Telegram channel or personal chat with zero hosting costs, zero expiration,
 * and instant mobile notifications.
 * ============================================================================
 */

const fs = require("fs");
const connectDB = require("../config/db");

const TELEGRAM_SETTINGS_KEY = "system_telegram_backup_config";

class TelegramBackupService {
  /**
   * Retrieves Telegram configuration from Database or Environment
   */
  async getConfig() {
    try {
      const db = await connectDB();
      const settings = await db
        .collection("settings")
        .findOne({ key: TELEGRAM_SETTINGS_KEY });

      if (settings && settings.isEnabled) {
        return {
          isEnabled: true,
          botToken: settings.botToken || process.env.TELEGRAM_BOT_TOKEN || "",
          chatId: settings.chatId || process.env.TELEGRAM_CHAT_ID || "",
        };
      }
    } catch (err) {
      console.warn("Could not read Telegram config from DB:", err.message);
    }

    // Fallback to .env
    const envToken = process.env.TELEGRAM_BOT_TOKEN;
    const envChatId = process.env.TELEGRAM_CHAT_ID;

    if (envToken && envChatId) {
      return {
        isEnabled: true,
        botToken: envToken,
        chatId: envChatId,
      };
    }

    return {
      isEnabled: false,
      botToken: "",
      chatId: "",
    };
  }

  /**
   * Tests the Telegram Bot Connection by sending a test ping
   */
  async testConnection() {
    try {
      const config = await this.getConfig();

      if (!config.botToken || !config.chatId) {
        return {
          success: false,
          message: "টেলিগ্রাম Bot Token এবং Chat ID কনফিগার করা নেই। দয়া করে সেটিংস দিন।",
        };
      }

      // 1. Verify Bot Token
      const meRes = await fetch(`https://api.telegram.org/bot${config.botToken}/getMe`);
      const meData = await meRes.json();

      if (!meData.ok) {
        return {
          success: false,
          message: `টেলিগ্রাম বট টোকেন ভুল: ${meData.description || "Invalid Bot Token"}`,
        };
      }

      const botUsername = meData.result.username;

      // 2. Send Test Message to Chat
      const testMsg = `✅ *Sashroyi Auto-Backup Bot Connected!*\n\n🤖 *Bot:* @${botUsername}\n📅 *Time:* ${new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}\n\nআপনার টেলিগ্রাম ব্যাকআপ সিস্টেম সফলভাবে কানেক্টেড এবং প্রস্তুত।`;

      const sendRes = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: testMsg,
          parse_mode: "Markdown",
        }),
      });

      const sendData = await sendRes.json();

      if (!sendData.ok) {
        return {
          success: false,
          message: `Chat ID-তে মেসেজ পাঠানো যায়নি: ${sendData.description || "Invalid Chat ID"}. নিশ্চিত করুন আপনি বটে /start দিয়েছেন।`,
        };
      }

      return {
        success: true,
        message: `টেলিগ্রাম কানেকশন সফল! @${botUsername} বটে টেস্ট মেসেজ পাঠানো হয়েছে।`,
        botName: botUsername,
        chatId: config.chatId,
      };
    } catch (error) {
      return {
        success: false,
        message: "টেলিগ্রাম কানেকশন ত্রুটি: " + error.message,
      };
    }
  }

  /**
   * Uploads the backup zip directly to Telegram Chat / Channel as a Document
   */
  async uploadBackupZip(filePath, fileName, domainName = "main_domain", releaseNotesText = "") {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file not found at: ${filePath}`);
    }

    const config = await this.getConfig();

    if (!config.botToken || !config.chatId) {
      throw new Error("Telegram Bot credentials not configured");
    }

    const dateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const fileSizeMB = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);

    // Formatted Telegram Caption
    const caption = `📦 SASHROYI AUTO-BACKUP VAULT
━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Domain: ${domainName}
📦 Backup: ${fileName}
📊 Size: ${fileSizeMB} MB
⏰ Time: ${dateStr} (BST)
━━━━━━━━━━━━━━━━━━━━━━━━
✅ সাইট আপডেটের পূর্বের সেফটি ব্যাকআপ সফলভাবে টেলিগ্রাম ক্লাউডে সংরক্ষিত হয়েছে!`;

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
      throw new Error(uploadData.description || "Failed to upload document to Telegram");
    }

    return {
      success: true,
      messageId: uploadData.result.message_id,
      fileId: uploadData.result.document?.file_id,
      fileName: uploadData.result.document?.file_name || fileName,
      fileSize: fileSizeMB + " MB",
      chatTitle: uploadData.result.chat?.title || uploadData.result.chat?.username || "Telegram Chat",
    };
  }
}

module.exports = new TelegramBackupService();
