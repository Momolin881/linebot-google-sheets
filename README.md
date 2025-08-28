# 🎤 會議記錄音檔轉逐字稿小幫手

這是一個 LINE Bot 專案，可以將使用者的文字訊息和語音訊息儲存到指定的 Google Sheets 中。**特別支援語音轉文字功能**，讓你輕鬆製作會議記錄！

## ✨ 功能特色

### 📝 文字訊息處理
- ✅ 接收 LINE 使用者的文字訊息
- ✅ 自動儲存訊息到 Google Sheets

### 🎤 語音轉逐字稿
- ✅ **接收語音訊息並轉換為逐字稿**
- ✅ 使用 OpenAI Whisper API 進行語音識別
- ✅ 支援中文語音轉文字
- ✅ 自動儲存逐字稿到 Google Sheets

### 📊 資料記錄
- ✅ 記錄時間戳記、使用者資訊、訊息類型
- ✅ 完整的會議記錄管理
- ✅ 支援 Zeabur/Railway 雲端部署

## 設定步驟

### 1. LINE Bot 設定

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 建立新的 Provider 和 Channel
3. 取得以下資訊：
   - Channel Access Token
   - Channel Secret

### 2. Google Sheets 設定

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 Google Sheets API
4. 建立服務帳戶：
   - 前往「IAM 與管理」→「服務帳戶」
   - 建立服務帳戶
   - 下載 JSON 金鑰檔案
5. 建立 Google Sheets 試算表
6. 將服務帳戶的電子郵件加入試算表的編輯權限

### 3. OpenAI API 設定（語音轉文字功能）

1. 前往 [OpenAI Platform](https://platform.openai.com/)
2. 註冊並登入帳號
3. 前往 API Keys 頁面
4. 點擊「Create new secret key」
5. 複製生成的 API Key
6. **注意**：Whisper API 按使用量計費，詳情請參考 [OpenAI 定價](https://openai.com/pricing)

### 4. 環境變數設定

複製 `.env.example` 為 `.env` 並填入以下資訊：

```env
# LINE Bot 設定
LINE_CHANNEL_ACCESS_TOKEN=你的_line_channel_access_token
LINE_CHANNEL_SECRET=你的_line_channel_secret

# Google Sheets 設定
GOOGLE_SHEETS_ID=你的_google_sheets_id
GOOGLE_SERVICE_ACCOUNT_KEY=你的_base64_encoded_credentials_json

# OpenAI Whisper API 設定（語音轉文字功能）
OPENAI_API_KEY=你的_openai_api_key

# 伺服器設定
PORT=3000
```

#### 如何產生 BASE64 編碼的 credentials.json：

在終端機執行以下命令：
```bash
# macOS/Linux
base64 -i path/to/your/credentials.json

# 或使用 Node.js
node -e "console.log(Buffer.from(require('fs').readFileSync('path/to/credentials.json')).toString('base64'))"
```

將輸出的 BASE64 字串複製到 `GOOGLE_SERVICE_ACCOUNT_KEY` 環境變數中。

### 5. 本地測試

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 或啟動正式伺服器
npm start
```

### 6. Zeabur/Railway 部署

1. 前往 [Zeabur](https://zeabur.com/)
2. 連接 GitHub 帳號並匯入此專案
3. 在環境變數中設定所有必要的變數
4. 部署完成後，將 webhook URL 設定到 LINE Bot 設定中

#### 部署平台環境變數設定

在 Zeabur/Railway 控制台中設定以下環境變數：

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`
- `GOOGLE_SHEETS_ID`
- `GOOGLE_SERVICE_ACCOUNT_KEY` (BASE64 編碼的 credentials.json)
- `OPENAI_API_KEY` (**新增：語音轉文字功能**)
- `PORT` (通常設為 3000)

### 7. LINE Bot Webhook 設定

部署完成後：

1. 前往 LINE Developers Console
2. 在 Messaging API 設定中
3. 將 Webhook URL 設為：`https://your-zeabur-domain.zeabur.app/webhook`
4. 啟用 Use webhook

## 📊 Google Sheets 格式

試算表會自動建立以下欄位：

| A欄 | B欄 | C欄 | D欄 | E欄 | F欄 |
|-----|-----|-----|-----|-----|-----|
| 時間 | 使用者ID | 使用者名稱 | 訊息類型 | 內容/逐字稿 | 音檔時長 |

## 🎯 使用說明

### 📝 文字訊息
- 直接傳送文字訊息給 LINE Bot
- Bot 會回覆確認訊息並儲存到 Google Sheets

### 🎤 語音轉逐字稿
1. **錄製語音**：在 LINE 聊天室中按住錄音按鈕錄製語音
2. **傳送語音**：放開按鈕傳送語音訊息
3. **等待處理**：Bot 會回覆「正在處理您的語音訊息，請稍候...」
4. **取得結果**：幾秒後會收到完整的逐字稿內容
5. **自動儲存**：逐字稿會自動儲存到 Google Sheets

### 💡 使用技巧
- **清晰發音**：語音轉文字效果與音質和發音清晰度有關
- **安靜環境**：建議在安靜環境錄音以獲得更好的轉換效果
- **中文支援**：系統已最佳化支援繁體中文語音識別
- **會議記錄**：適合用於會議、訪談、筆記等場景

## ✅ 測試

1. **文字測試**：傳送文字訊息，應該收到確認回覆
2. **語音測試**：傳送語音訊息，等待逐字稿結果
3. **檢查記錄**：查看 Google Sheets 是否正確記錄所有資料

## ⚠️ 故障排除

1. **Google Sheets 寫入失敗**：
   - 檢查服務帳戶權限
   - 確認 Google Sheets ID 正確
   - 檢查私鑰格式是否正確

2. **語音轉文字失敗**：
   - 檢查 OPENAI_API_KEY 是否正確設定
   - 確認 OpenAI 帳戶有足夠的額度
   - 檢查音檔格式是否支援（LINE 通常使用 M4A）
   - 查看伺服器日誌中的具體錯誤訊息

3. **LINE Bot 無回應**：
   - 檢查 Webhook URL 是否正確
   - 確認 Channel Access Token 和 Channel Secret
   - 查看伺服器日誌

4. **部署問題**：
   - 確認所有環境變數都已設定（包括新增的 OPENAI_API_KEY）
   - 檢查 Node.js 版本是否相容
   - 確認部署平台支援所需的依賴套件

## 💰 費用說明

- **LINE Bot API**：免費（有訊息數量限制）
- **Google Sheets API**：免費
- **OpenAI Whisper API**：按使用量計費
  - 價格：$0.006 / 分鐘音檔
  - 建議設定 OpenAI 帳戶的使用限額以控制費用