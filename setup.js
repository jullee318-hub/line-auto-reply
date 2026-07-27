const db = require('./db/database');
const { hashPassword } = require('./dashboard/auth');
const config = require('./config');

async function setup() {
  await db.init();

  for (const op of config.operators) {
    const hash = hashPassword(op.password);
    db.createOperator(op.name, hash);
    console.log(`管理者帳號已建立：${op.name}`);
  }

  console.log('\n設定完成！現在可以用 npm start 啟動系統。');
}

setup().catch(err => {
  console.error('設定失敗:', err);
  process.exit(1);
});
