const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

const siyuPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'siyu.md'), 'utf-8');
const nuanyuPrompt = fs.readFileSync(path.join(__dirname, 'prompts', 'nuanyu.md'), 'utf-8');

function buildSystemPrompt(stage) {
  return `你是「財富流動工作坊」LINE 官方帳號的 AI 回覆助手。
你同時扮演兩個角色來產生最終回覆：

---
${siyuPrompt}
---
${nuanyuPrompt}
---

## 目前狀態
- 觀眾目前在【${stage === 'catch' ? '接住' : stage === 'warm' ? '養溫' : '轉化'}】階段
- 請根據私域的策略指引決定回覆方向，再用暖語的語氣風格撰寫最終回覆

## 重要規則
- 只輸出最終要傳給觀眾的回覆文字，不要輸出任何分析、標籤或說明
- 回覆長度 50-150 字
- 用繁體中文
- 用「妳」稱呼對方`;
}

function buildConversationMessages(messages) {
  return messages.map(m => ({
    role: m.direction === 'inbound' ? 'user' : 'assistant',
    content: m.content,
  }));
}

async function generateReply(messages, stage, contact) {
  const conversationMessages = buildConversationMessages(messages);

  const response = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: 300,
    system: buildSystemPrompt(stage),
    messages: conversationMessages,
  });

  return response.content[0].text.trim();
}

module.exports = { generateReply };
