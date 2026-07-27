const path = require('path');
const db = require('../db/database');
const { pushMessage } = require('../line/reply');
const { requireAuth } = require('./auth');

function setupRoutes(app) {
  app.get('/dashboard', requireAuth, (req, res) => {
    res.redirect('/dashboard/inbox');
  });

  app.get('/dashboard/inbox', requireAuth, (req, res) => {
    res.sendFile('inbox.html', { root: path.join(__dirname, 'views') });
  });

  app.get('/dashboard/conversation/:contactId', requireAuth, (req, res) => {
    res.sendFile('conversation.html', { root: path.join(__dirname, 'views') });
  });

  app.get('/dashboard/settings', requireAuth, (req, res) => {
    res.sendFile('settings.html', { root: path.join(__dirname, 'views') });
  });

  // --- API ---

  app.get('/api/me', requireAuth, (req, res) => {
    res.json(req.session.operator);
  });

  app.get('/api/conversations', requireAuth, (req, res) => {
    res.json(db.listContacts());
  });

  app.get('/api/conversations/:contactId', requireAuth, (req, res) => {
    const contact = db.getContact(parseInt(req.params.contactId));
    if (!contact) return res.status(404).json({ error: '找不到此聯絡人' });
    const messages = db.getMessages(contact.id);
    res.json({ contact, messages });
  });

  app.get('/api/drafts', requireAuth, (req, res) => {
    res.json(db.getPendingDrafts());
  });

  app.post('/api/drafts/:draftId/approve', requireAuth, (req, res) => {
    const draft = db.getDraft(parseInt(req.params.draftId));
    if (!draft || draft.status !== 'pending') {
      return res.status(404).json({ error: '草稿不存在或已處理' });
    }
    db.updateDraft(draft.id, 'approved', req.session.operator.username, null);
    const content = draft.ai_content;
    db.saveMessage(draft.contact_id, 'outbound', 'ai', content, null, req.session.operator.username);
    pushMessage(draft.line_user_id, content).catch(err => console.error('Push error:', err));
    res.json({ ok: true });
  });

  app.post('/api/drafts/:draftId/edit', requireAuth, (req, res) => {
    const draft = db.getDraft(parseInt(req.params.draftId));
    if (!draft || draft.status !== 'pending') {
      return res.status(404).json({ error: '草稿不存在或已處理' });
    }
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: '請提供修改後的內容' });
    db.updateDraft(draft.id, 'approved', req.session.operator.username, content);
    db.saveMessage(draft.contact_id, 'outbound', 'operator', content, null, req.session.operator.username);
    pushMessage(draft.line_user_id, content).catch(err => console.error('Push error:', err));
    res.json({ ok: true });
  });

  app.post('/api/drafts/:draftId/reject', requireAuth, (req, res) => {
    const draft = db.getDraft(parseInt(req.params.draftId));
    if (!draft || draft.status !== 'pending') {
      return res.status(404).json({ error: '草稿不存在或已處理' });
    }
    db.updateDraft(draft.id, 'rejected', req.session.operator.username, null);
    res.json({ ok: true });
  });

  app.post('/api/conversations/:contactId/send', requireAuth, (req, res) => {
    const contact = db.getContact(parseInt(req.params.contactId));
    if (!contact) return res.status(404).json({ error: '找不到此聯絡人' });
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: '請提供訊息內容' });
    db.saveMessage(contact.id, 'outbound', 'operator', content, null, req.session.operator.username);
    pushMessage(contact.line_user_id, content).catch(err => console.error('Push error:', err));
    res.json({ ok: true });
  });

  app.get('/api/settings', requireAuth, (req, res) => {
    res.json({
      reply_mode: db.getSetting('reply_mode') || 'semi-auto',
      ai_model: db.getSetting('ai_model') || 'claude-haiku-4-5-20251001',
    });
  });

  app.post('/api/settings', requireAuth, (req, res) => {
    const { reply_mode } = req.body;
    if (reply_mode && ['auto', 'semi-auto'].includes(reply_mode)) {
      db.setSetting('reply_mode', reply_mode);
    }
    res.json({ ok: true });
  });

  app.post('/api/contacts/:contactId/stage', requireAuth, (req, res) => {
    const { stage } = req.body;
    if (!['catch', 'warm', 'convert'].includes(stage)) {
      return res.status(400).json({ error: '無效的階段' });
    }
    db.updateContactStage(parseInt(req.params.contactId), stage);
    res.json({ ok: true });
  });

  app.post('/api/contacts/:contactId/notes', requireAuth, (req, res) => {
    const { notes } = req.body;
    db.updateContactNotes(parseInt(req.params.contactId), notes || '');
    res.json({ ok: true });
  });
}

module.exports = { setupRoutes };
