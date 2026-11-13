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

/**
 * Resilient Fetch with automatic retry and timeout
 * Prevents "fetch failed" during sudden network hiccups or DNS latency
 */
async function fetchWithRetry(url, options = {}, retries = 3, timeoutMs = 15000) {
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      console.warn(`[Telegram API] Attempt ${attempt}/${retries} failed (${err.name === "AbortError" ? "Timeout" : err.message}). Retrying in 1.5s...`);
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, 1500));
      }
    }
  }

  throw new Error(`টেলিগ্রাম নেটওয়ার্ক সংযোগ ব্যর্থ (৩ বার চেষ্টার পরও সংযোগ পাওয়া যায়নি): ${lastError?.message || "Connection timeout"}`);
}

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
      const meRes = await fetchWithRetry(`https://api.telegram.org/bot${config.botToken}/getMe`);
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

      const sendRes = await fetchWithRetry(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
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
   * Uploads backup zip directly to Telegram Chat / Channel as a Document
   * Supports both PRE-UPDATE (safety snapshot before import) and EXPORT ARCHIVES!
   */
  async uploadBackupZip(filePath, fileName, domainName = "main_domain", notes = "", type = "import_pre_backup") {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file not found at: ${filePath}`);
    }

    const config = await this.getConfig();

    if (!config.botToken || !config.chatId) {
      throw new Error("Telegram Bot credentials not configured");
    }

    const dateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const fileSizeMB = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(2);

    let caption = "";
    if (type === "export_package") {
      caption = `📦🚀 SASHROYI EXPORT UPDATE ARCHIVE
━━━━━━━━━━━━━━━━━━━━━━━━
🔵 TYPE: EXPORT PACKAGE (রিলিজ প্যাকেজ)
🌐 Source Domain: ${domainName}
📁 Package: ${fileName}
📊 Size: ${fileSizeMB} MB
⏰ Export Time: ${dateStr} (BST)
━━━━━━━━━━━━━━━━━━━━━━━━
✨ মেইন সাইট থেকে নতুন আপডেট প্যাকেজ এক্সপোর্টের সাথে সাথে এর একটি পার্মানেন্ট কপি টেলিগ্রাম ক্লাউড ভল্টে নিরাপদে সংরক্ষণ করা হলো।`;
    } else {
      caption = `🛡️📦 SASHROYI PRE-UPDATE SAFETY BACKUP
━━━━━━━━━━━━━━━━━━━━━━━━
🟠 TYPE: PRE-UPDATE SAFETY BACKUP (আপডেটের আগের ব্যাকআপ)
🌐 Domain: ${domainName}
📁 Backup: ${fileName}
📊 Size: ${fileSizeMB} MB
⏰ Backup Time: ${dateStr} (BST)
━━━━━━━━━━━━━━━━━━━━━━━━
✅ সাইট আপডেটের পূর্বের সম্পূর্ণ কোডের সেফটি ব্যাকআপ টেলিগ্রামে সফলভাবে পৌঁছেছে! কোনো সমস্যা হলে এটি দিয়ে ইনস্ট্যান্ট রিস্টোর করা যাবে।`;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileBlob = new Blob([fileBuffer], { type: "application/zip" });

    const formData = new FormData();
    formData.append("chat_id", config.chatId);
    formData.append("caption", caption);
    formData.append("document", fileBlob, fileName);

    const uploadRes = await fetchWithRetry(
      `https://api.telegram.org/bot${config.botToken}/sendDocument`,
      {
        method: "POST",
        body: formData,
      },
      3,
      60000 // 60 seconds timeout for big file uploads
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
