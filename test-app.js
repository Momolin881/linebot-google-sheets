const express = require('express');

const app = express();
const port = process.env.PORT || 8080;

console.log('🚀 開始啟動測試伺服器...');
console.log('PORT 環境變數:', process.env.PORT);
console.log('監聽 port:', port);

// 基本健康檢查
app.get('/', (req, res) => {
  res.json({
    message: '✅ 伺服器運行正常',
    port: port,
    timestamp: new Date().toISOString(),
    env: {
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV || 'development'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 簡單測試端點
app.post('/callback', (req, res) => {
  console.log('收到 callback 請求');
  res.json({ message: 'callback endpoint works' });
});

const server = app.listen(port, () => {
  console.log(`✅ 測試伺服器成功啟動在 port ${port}`);
  console.log(`🌐 伺服器正在運行...`);
});

server.on('error', (err) => {
  console.error('❌ 伺服器啟動失敗:', err);
});