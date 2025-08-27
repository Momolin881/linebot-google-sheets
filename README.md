# LINE Bot Google Sheets Integration

這是一個 LINE Bot 專案，可以將使用者輸入的文字訊息儲存到指定的 Google Sheets 中。

## 功能特色

- ✅ 接收 LINE 使用者的文字訊息
- ✅ 自動儲存訊息到 Google Sheets
- ✅ 記錄時間戳記、使用者ID、使用者名稱和訊息內容
- ✅ 支援 Zeabur 一鍵部署

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

### 3. 環境變數設定

複製 `.env.example` 為 `.env` 並填入以下資訊：

```env
# LINE Bot 設定
LINE_CHANNEL_ACCESS_TOKEN=你的_line_channel_access_token
LINE_CHANNEL_SECRET=你的_line_channel_secret

# Google Sheets 設定
GOOGLE_SHEETS_ID=你的_google_sheets_id
GOOGLE_SERVICE_ACCOUNT_KEY=你的_base64_encoded_credentials_json

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

### 4. 本地測試

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 或啟動正式伺服器
npm start
```

### 5. Zeabur 部署

1. 前往 [Zeabur](https://zeabur.com/)
2. 連接 GitHub 帳號並匯入此專案
3. 在環境變數中設定所有必要的變數
4. 部署完成後，將 webhook URL 設定到 LINE Bot 設定中

#### Zeabur 環境變數設定

在 Zeabur 控制台中設定以下環境變數：

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`
- `GOOGLE_SHEETS_ID`
- `GOOGLE_SERVICE_ACCOUNT_KEY` (BASE64 編碼的 credentials.json)
- `PORT` (通常設為 3000)

### 6. LINE Bot Webhook 設定

部署完成後：

1. 前往 LINE Developers Console
2. 在 Messaging API 設定中
3. 將 Webhook URL 設為：`https://your-zeabur-domain.zeabur.app/webhook`
4. 啟用 Use webhook

## Google Sheets 格式

試算表會自動建立以下欄位：

| A欄 | B欄 | C欄 | D欄 |
|-----|-----|-----|-----|
| 時間 | 使用者ID | 使用者名稱 | 訊息內容 |

## 測試

傳送訊息到您的 LINE Bot，應該會收到確認回覆，同時訊息會被儲存到 Google Sheets 中。

## 故障排除

1. **Google Sheets 寫入失敗**：
   - 檢查服務帳戶權限
   - 確認 Google Sheets ID 正確
   - 檢查私鑰格式是否正確

2. **LINE Bot 無回應**：
   - 檢查 Webhook URL 是否正確
   - 確認 Channel Access Token 和 Channel Secret
   - 查看伺服器日誌

3. **部署問題**：
   - 確認所有環境變數都已設定
   - 檢查 Node.js 版本是否相容