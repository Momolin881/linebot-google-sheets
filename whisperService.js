const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class WhisperService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // 檢查 API Key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY 環境變數未設定');
    }
    
    console.log('✅ Whisper API 初始化成功');
  }

  async downloadAudio(messageId, accessToken) {
    try {
      console.log('📥 開始下載音檔:', messageId);
      
      // LINE Bot API 取得音檔內容
      const response = await axios({
        method: 'get',
        url: `https://api-data.line.me/v2/bot/message/${messageId}/content`,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        responseType: 'stream'
      });

      // 建立暫存檔案
      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }

      const fileName = `audio_${messageId}_${Date.now()}.m4a`;
      const filePath = path.join(tempDir, fileName);

      // 儲存音檔
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log('✅ 音檔下載完成:', fileName);
          resolve(filePath);
        });
        writer.on('error', reject);
      });

    } catch (error) {
      console.error('❌ 音檔下載失敗:', error);
      throw error;
    }
  }

  async transcribeAudio(audioFilePath) {
    try {
      console.log('🎯 開始語音轉文字:', audioFilePath);

      // 使用 OpenAI Whisper API
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: "whisper-1",
        language: "zh", // 中文
        response_format: "text"
      });

      console.log('✅ 語音轉文字完成');
      console.log('📝 逐字稿內容:', transcription.substring(0, 100) + '...');

      return transcription;

    } catch (error) {
      console.error('❌ 語音轉文字失敗:', error);
      throw error;
    }
  }

  async processAudioMessage(messageId, accessToken) {
    let audioFilePath = null;
    
    try {
      // 1. 下載音檔
      audioFilePath = await this.downloadAudio(messageId, accessToken);
      
      // 2. 轉換成文字
      const transcription = await this.transcribeAudio(audioFilePath);
      
      return transcription;

    } catch (error) {
      console.error('❌ 處理語音訊息失敗:', error);
      throw error;
      
    } finally {
      // 清理暫存檔案
      if (audioFilePath && fs.existsSync(audioFilePath)) {
        try {
          fs.unlinkSync(audioFilePath);
          console.log('🗑️ 暫存檔案已清理');
        } catch (cleanupError) {
          console.error('⚠️ 清理暫存檔案失敗:', cleanupError);
        }
      }
    }
  }

  // 計算音檔時長（用於計費參考）
  getDuration(audioFilePath) {
    // 這裡可以加入音檔時長檢測邏輯
    // 暫時返回預估值
    return '未知時長';
  }
}

module.exports = WhisperService;