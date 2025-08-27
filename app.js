const express = require('express');
const line = require('@line/bot-sdk');
const GoogleSheetsService = require('./googleSheets');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// LINE Bot 配置
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);
const googleSheetsService = new GoogleSheetsService();

// 初始化 Google Sheets
googleSheetsService.initializeSheet();

// 處理 LINE Bot webhook
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  try {
    // 取得使用者資訊
    const profile = await client.getProfile(event.source.userId);
    
    // 準備要儲存的資料
    const data = {
      userId: event.source.userId,
      userName: profile.displayName || '未知使用者',
      message: event.message.text
    };

    // 儲存到 Google Sheets
    await googleSheetsService.appendData(data);
    console.log('訊息已儲存到 Google Sheets:', data);

    // 回覆確認訊息
    const echo = {
      type: 'text',
      text: `✅ 已成功儲存您的訊息：\n"${event.message.text}"`
    };

    return client.replyMessage(event.replyToken, echo);
  } catch (error) {
    console.error('處理訊息時發生錯誤:', error);
    
    // 回覆錯誤訊息
    const errorMessage = {
      type: 'text',
      text: '❌ 儲存訊息時發生錯誤，請稍後再試。'
    };
    
    return client.replyMessage(event.replyToken, errorMessage);
  }
}

// 設置 webhook 端點
app.post('/webhook', line.middleware(config), (req, res) => {
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

app.listen(port, () => {
  console.log(`🤖 LINE Bot 伺服器啟動在 port ${port}`);
  console.log(`📊 Google Sheets ID: ${process.env.GOOGLE_SHEETS_ID || '未設定'}`);
});