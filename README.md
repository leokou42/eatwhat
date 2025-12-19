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

### 2. 啟動開發伺服器
```bash
npm run dev
```

### 3. 以 API 模式啟動
```bash
NEXT_PUBLIC_DATA_SOURCE=api npm run dev
```

### 4. 執行測試
```bash
npx vitest run
```

---

## 📁 專案結構
- `app/api/`: 提供餐飲資料的 API 路由。
- `repositories/`: 資料存取抽象層。
- `hooks/`: 問答邏輯與地理位置獲取。
- `lib/`: 狀態機與排行演算法。
