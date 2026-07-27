const crypto = require('crypto');
const config = require('../config');
const db = require('../db/database');
const { generateReply } = require('../ai/generate');
const { replyMessage, pushMessage } = require('./reply');
const { classifyStage } = require('../utils/stage');

function validateSignature(body, signature) {
  const hash = crypto
    .createHmac('SHA256', config.line.channelSecret)
    .update(body)
    .digest('base64');
  return hash === signature;
}

async function handleWebhook(req, res) {
  const signature = req.headers['x-line-signature'];
  if (!signature || !validateSignature(req.rawBody, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  res.status(200).json({ ok: true });

  const events = req.body.events || [];
  for (const event of events) {
    try {
      await processEvent(event);
    } catch (err) {
      console.error('Error processing event:', err);
    }
  }
}

async function processEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return;

  const userId = event.source.userId;
  const text = event.message.text;
  const messageId = event.message.id;
  const replyToken = event.replyToken;

  let displayName = null;
  try {
    const { getProfile } = require('./reply');
    const profile = await getProfile(userId);
    displayName = profile.displayName;
  } catch (e) {}

  const contact = db.findOrCreateContact(userId, displayName);
  const inboundId = db.saveMessage(contact.id, 'inbound', 'user', text, messageId, null);

  const messageCount = db.getMessageCount(contact.id);
  const daysSinceFirst = Math.floor(
    (Date.now() - new Date(contact.first_message_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const newStage = classifyStage(contact.stage, messageCount, daysSinceFirst);
  if (newStage !== contact.stage) {
    db.updateContactStage(contact.id, newStage);
  }

  const messages = db.getMessages(contact.id);
  const aiReply = await generateReply(messages, newStage, contact);

  const mode = db.getSetting('reply_mode') || 'semi-auto';

  if (mode === 'auto') {
    await replyMessage(replyToken, aiReply);
    db.saveMessage(contact.id, 'outbound', 'ai', aiReply, null, null);
  } else {
    db.saveDraft(contact.id, inboundId, aiReply);
  }
}

module.exports = { handleWebhook };
