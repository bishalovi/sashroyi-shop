const path = require('path');
require('dotenv').config({ path: 'E:/project/sashroyi.shop/barakah-demo-project-main/barakah-server/.env' });
const connectDB = require('E:/project/sashroyi.shop/barakah-demo-project-main/barakah-server/config/db');

async function run() {
  try {
    const db = await connectDB();
    const TELEGRAM_SETTINGS_KEY = 'system_telegram_backup_config';
    const updateFields = {
      key: TELEGRAM_SETTINGS_KEY,
      isEnabled: true,
      botToken: '9265150930:AAFPIlmz1tZjNpaW8Tar_KO2g0pEmRry5p4',
      chatId: '8342936432',
      updatedAt: new Date()
    };
    await db.collection('settings').updateOne(
      { key: TELEGRAM_SETTINGS_KEY },
      { $set: updateFields },
      { upsert: true }
    );
    console.log('SUCCESSFULLY_UPDATED_DATABASE_WITH_TELEGRAM_CREDENTIALS');
    const res = await db.collection('settings').findOne({ key: TELEGRAM_SETTINGS_KEY });
    console.log('Current in DB:', {
      key: res.key,
      isEnabled: res.isEnabled,
      botToken: res.botToken,
      chatId: res.chatId
    });
    process.exit(0);
  } catch (err) {
    console.error('Update failed:', err);
    process.exit(1);
  }
}

run();
