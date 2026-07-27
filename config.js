const path = require('path');

if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config(); } catch (e) {}
}

module.exports = {
  line: {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.AI_MODEL || 'claude-haiku-4-5-20251001',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  },
  port: parseInt(process.env.PORT, 10) || 3000,
  dbPath: process.env.DB_PATH || path.join(__dirname, 'data', 'database.sqlite'),
  operators: [
    { name: process.env.OPERATOR1_NAME || '品慧', password: process.env.OPERATOR1_PASSWORD || 'changeme1' },
    { name: process.env.OPERATOR2_NAME || '淑芬', password: process.env.OPERATOR2_PASSWORD || 'changeme2' },
  ],
};
