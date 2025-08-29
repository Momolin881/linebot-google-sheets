const express = require('express');
const line = require('@line/bot-sdk');
const GoogleSheetsService = require('./googleSheets');
const WhisperService = require('./whisperService');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// LINE Bot 配置
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// 檢查環境變數
if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
  console.error('❌ LINE_CHANNEL_ACCESS_TOKEN 環境變數未設定');
  process.exit(1);
}
if (!process.env.LINE_CHANNEL_SECRET) {
  console.error('❌ LINE_CHANNEL_SECRET 環境變數未設定');
  process.exit(1);
}

// OpenAI API Key 是選用的（語音功能需要）
const hasWhisperAPI = !!process.env.OPENAI_API_KEY;
if (hasWhisperAPI) {
  console.log('✅ OpenAI Whisper API 已啟用');
} else {
  console.log('⚠️ OpenAI API Key 未設定，語音轉文字功能將被停用');
}

console.log('✅ 所有環境變數檢查通過');
const client = new line.Client(config);
const googleSheetsService = new GoogleSheetsService();

// 只在有 OpenAI API Key 時初始化 Whisper 服務
let whisperService = null;
if (hasWhisperAPI) {
  try {
    whisperService = new WhisperService();
  } catch (error) {
    console.error('⚠️ Whisper 服務初始化失敗:', error.message);
    console.log('🔄 將以純文字模式運行');
  }
}

// 初始化 Google Sheets
googleSheetsService.initializeSheet();

// 防重複處理的訊息 ID 記錄
const processedMessages = new Set();

// 處理 LINE Bot webhook
async function handleEvent(event) {
  // 只處理訊息事件，且為文字或語音訊息
  if (event.type !== 'message' || 
      (event.message.type !== 'text' && event.message.type !== 'audio')) {
    return Promise.resolve(null);
  }

  // 防重複處理
  if (processedMessages.has(event.message.id)) {
    console.log('⚠️ 訊息已處理過，跳過:', event.message.id);
    return Promise.resolve(null);
  }
  
  // 標記為已處理
  processedMessages.add(event.message.id);
  
  // 清理舊的訊息記錄（保留最近 1000 筆）
  if (processedMessages.size > 1000) {
    const oldMessages = Array.from(processedMessages).slice(0, 500);
    oldMessages.forEach(id => processedMessages.delete(id));
  }

  try {
    // 取得使用者資訊
    const profile = await client.getProfile(event.source.userId);
    const userName = profile.displayName || '未知使用者';
    const userId = event.source.userId;

    let data;
    let replyMessage;

    if (event.message.type === 'text') {
      // 處理文字訊息
      console.log(`💬 收到 ${userName} 的文字訊息:`, event.message.text);
      
      data = {
        type: 'text',
        userId: userId,
        userName: userName,
        message: event.message.text
      };

      replyMessage = {
        type: 'text',
        text: `✅ 已成功儲存您的文字訊息：\n"${event.message.text}"`
      };

    } else if (event.message.type === 'audio') {
      // 處理語音訊息
      console.log(`🎤 收到 ${userName} 的語音訊息`);
      
      if (!whisperService) {
        // 沒有 OpenAI API Key，無法處理語音
        replyMessage = {
          type: 'text',
          text: '❌ 語音轉文字功能尚未啟用\n請設定 OPENAI_API_KEY 環境變數'
        };
        
        data = {
          type: 'audio',
          userId: userId,
          userName: userName,
          transcription: '[語音轉文字功能未啟用]',
          duration: event.message.duration || '未知'
        };
      } else {
        try {
          // 先回覆處理中訊息
          await client.replyMessage(event.replyToken, {
            type: 'text',
            text: '🎯 正在處理您的語音訊息，請稍候...'
          });

          // 使用 Whisper API 轉換語音為文字
          const transcription = await whisperService.processAudioMessage(
            event.message.id, 
            process.env.LINE_CHANNEL_ACCESS_TOKEN
          );

          data = {
            type: 'audio',
            userId: userId,
            userName: userName,
            transcription: transcription,
            duration: event.message.duration || '未知'
          };

          // 使用 push message 發送結果（因為已經用過 replyToken）
          replyMessage = {
            type: 'text',
            text: `🎤 語音轉文字完成！\n\n📝 逐字稿：\n"${transcription}"\n\n✅ 已儲存到會議記錄`
          };

          // 語音訊息使用 push message
          await client.pushMessage(userId, replyMessage);
          replyMessage = null; // 避免重複發送
          
        } catch (whisperError) {
          console.error('❌ 語音處理失敗:', whisperError);
          
          data = {
            type: 'audio',
            userId: userId,
            userName: userName,
            transcription: '[語音轉文字處理失敗]',
            duration: event.message.duration || '未知'
          };

          replyMessage = {
            type: 'text',
            text: `❌ 語音轉文字失敗\n錯誤: ${whisperError.message}`
          };
        }
      }
    }

    // 儲存到 Google Sheets
    await googleSheetsService.appendData(data);
    console.log('✅ 資料已儲存到 Google Sheets');

    // 回覆訊息（僅文字訊息）
    if (replyMessage) {
      return client.replyMessage(event.replyToken, replyMessage);
    }

  } catch (error) {
    console.error('❌ 處理訊息時發生錯誤:', error.message);
    console.error('錯誤詳情:', {
      messageType: event.message.type,
      messageId: event.message.id,
      userId: event.source.userId,
      errorCode: error.status || error.code
    });
    
    // 簡化錯誤回覆，避免過多 API 呼叫
    try {
      const errorMessage = {
        type: 'text',
        text: `❌ 處理${event.message.type === 'audio' ? '語音' : '文字'}訊息時發生錯誤`
      };
      
      return client.replyMessage(event.replyToken, errorMessage);
    } catch (replyError) {
      console.error('❌ 回覆錯誤訊息也失敗:', replyError.message);
      // 不再嘗試 push message，避免更多錯誤
    }
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