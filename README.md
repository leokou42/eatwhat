# 🍽️ Eat What - MVP

「Eat What」是一個基於 Next.js 14 的決策輔助工具，旨在解決「今天吃什麼」的世紀難題。

---

## ✨ 核心功能
- **智能推薦**：根據你的偏好（飯/麵、口味、預算等）自動排行餐廳。
- **地理位置整合**：使用真實 GPS 座標計算與餐廳的距離。
- **直覺交互**：支援 Tinder 式的滑動手勢與鍵盤快捷鍵。
- **可解釋性**：告訴你為什麼推薦這間餐廳。
- **離線開發模式**：支援切換 Mock 資料或真實 API。

---

## 🛠️ 開發接手說明 (Handover)

如果你是切換裝置開發，或是交接給其他 AI Agent，請務必先閱讀：
👉 **[HANDOVER.md](./HANDOVER.md)**

---

## 🚀 快速開始 (Quick Start)

### 1. 安裝環境
```bash
npm install
```

### 2. 設定環境變數
建立 `.env.local`，至少包含：
```
DATABASE_URL=postgresql://user:pass@localhost:5432/eatwhat
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your-secret
GOOGLE_MAPS_API_KEY=your-google-maps-key
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.0-flash
NEXT_PUBLIC_STARTUP_DEBUG=1
```

`next-auth v5` 建議使用 `AUTH_SECRET`。若你沿用舊設定，`NEXTAUTH_SECRET` 也支援。

另外 Prisma CLI 預設讀取 `.env`。若你只設定 `.env.local`，請同步建立 `.env`（至少要有 `DATABASE_URL`）：
```
DATABASE_URL=postgresql://user:pass@localhost:5432/eatwhat
```

`NEXT_PUBLIC_STARTUP_DEBUG=1` 可在開啟 app 時輸出 client/server 啟動 trace（包含每個 API phase 與耗時）。
`GEMINI_MODEL` 可調整推論模型；若模型不可用，`init` 會自動 fallback 預設偏好，不再直接中斷流程。

### 3. 初始化 Prisma
```bash
npx prisma generate
npx prisma migrate dev
```

若你更新過 schema（例如新增 `UserSettings`），請務必先跑以上指令再啟動 server。

### 4. 啟動開發伺服器
```bash
npm run dev
```

### 5. 執行測試
```bash
npx vitest run
```

---

## 🔧 常見問題
- 若 `recommend` 可開啟但設定 API 回傳 `SETTINGS_STORAGE_UNAVAILABLE`：
  1. 先確認 PostgreSQL 有啟動且 `DATABASE_URL` 正確。
  2. 重新執行 `npx prisma generate` 與 `npx prisma migrate dev`。
  3. 在 migration 完成前，app 會 fallback 到 default/local settings，推薦流程可繼續使用，但登入後雲端設定持久化會暫時不可用。

---

## 📁 專案結構
- `app/api/`: 提供餐飲資料的 API 路由。
- `repositories/`: 資料存取抽象層。
- `hooks/`: 問答邏輯與地理位置獲取。
- `lib/`: 狀態機與排行演算法。
