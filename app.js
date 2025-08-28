const express = require('express');
const line = require('@line/bot-sdk');
// 暫時註解掉 Google Sheets 測試 LINE Bot
// const GoogleSheetsService = require('./googleSheets');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// LINE Bot 配置
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// 檢查 LINE 環境變數
if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
  console.error('❌ LINE_CHANNEL_ACCESS_TOKEN 環境變數未設定');
  process.exit(1);
}
if (!process.env.LINE_CHANNEL_SECRET) {
  console.error('❌ LINE_CHANNEL_SECRET 環境變數未設定');
  process.exit(1);
}

console.log('✅ LINE Bot 環境變數檢查通過');
const client = new line.Client(config);
// const googleSheetsService = new GoogleSheetsService();

// 初始化 Google Sheets
// googleSheetsService.initializeSheet();

// 處理 LINE Bot webhook
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  try {
    // 取得使用者資訊
    const profile = await client.getProfile(event.source.userId);
    
    // 暫時註解掉 Google Sheets，先測試 LINE Bot 回覆
    console.log('收到訊息:', {
      userId: event.source.userId,
      userName: profile.displayName || '未知使用者',
      message: event.message.text
    });

    // 簡單回覆測試
    const echo = {
      type: 'text',
      text: `🤖 LINE Bot 連接成功！\n收到您的訊息：${event.message.text}\n\n來自：${profile.displayName}`
    };

    return client.replyMessage(event.replyToken, echo);
  } catch (error) {
    console.error('處理訊息時發生錯誤:', error);
    
    // 回覆錯誤訊息
    const errorMessage = {
      type: 'text',
      text: '❌ LINE Bot 設定有問題，請檢查 token 和 secret'
    };
    
    return client.replyMessage(event.replyToken, errorMessage);
  }
}

// 設置 webhook 端點
app.post('/callback', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// 健康檢查端點
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 根路徑
app.get('/', (req, res) => {
  res.json({
    message: 'LINE Bot with Google Sheets Integration',
    status: 'running'
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🤖 LINE Bot 伺服器啟動在 port ${port}`);
  console.log(`📊 Google Sheets ID: ${process.env.GOOGLE_SHEETS_ID || '未設定'}`);
  console.log(`🌐 伺服器監聽在 0.0.0.0:${port}`);
});