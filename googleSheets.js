const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
require('dotenv').config();

class GoogleSheetsService {
  constructor() {
    // 檢查環境變數
    const credentialsBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!credentialsBase64) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY 環境變數未設定');
    }

    // 解碼 BASE64 編碼的 credentials.json
    let credentials;
    try {
      const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
      credentials = JSON.parse(credentialsJson);
    } catch (error) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY 格式錯誤: ' + error.message);
    }
    
    this.auth = new GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    
    // 檢查 spreadsheetId
    if (!this.spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_ID 環境變數未設定或為空');
    }
    console.log('✅ Google Sheets ID 設定正確:', this.spreadsheetId);
  }

  async appendData(data) {
    try {
      const timestamp = new Date().toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei'
      });
      
      const values = [
        [timestamp, data.userId, data.userName, data.message]
      ];

      const request = {
        spreadsheetId: this.spreadsheetId,
        range: 'A:D', // A到D欄
        valueInputOption: 'RAW',
        resource: {
          values: values
        }
      };

      const response = await this.sheets.spreadsheets.values.append(request);
      console.log('成功寫入 Google Sheets:', response.data);
      return response.data;
    } catch (error) {
      console.error('寫入 Google Sheets 失敗:', error);
      throw error;
    }
  }

  async initializeSheet() {
    try {
      // 檢查是否需要建立標題行
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'A1:D1'
      });

      if (!response.data.values || response.data.values.length === 0) {
        // 建立標題行
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: 'A1:D1',
          valueInputOption: 'RAW',
          resource: {
            values: [['時間', '使用者ID', '使用者名稱', '訊息內容']]
          }
        });
        console.log('已初始化 Google Sheets 標題行');
      }
    } catch (error) {
      console.error('初始化 Google Sheets 失敗:', error);
    }
  }
}

module.exports = GoogleSheetsService;