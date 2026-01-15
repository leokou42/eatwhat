# 測試指南 - Results Display Debugging

## 已修復的問題

### 1. Zod 版本錯誤
- **問題**: `package.json` 中使用了不存在的 `zod@4.2.1`
- **修復**: 更新為正確的穩定版本 `zod@3.23.8`
- **狀態**: ✅ 已修復並重新安裝

### 2. 缺少錯誤狀態處理
- **問題**: `app/page.tsx` 沒有處理 `uiState === 'error'` 的情況
- **修復**: 添加了錯誤狀態的 UI，包含錯誤訊息和重試按鈕
- **狀態**: ✅ 已修復

### 3. 增強的調試日誌
- **位置**: 
  - `app/page.tsx` - 顯示 uiState, results 數量, 錯誤訊息
  - `services/recommendationService.ts` - 追蹤推薦流程
  - `components/ResultCardStack.tsx` - 顯示餐廳數據
- **狀態**: ✅ 已添加

## 測試步驟

### 1. 開啟應用程式
```bash
# 開發伺服器已在運行
# URL: http://localhost:3001
```

### 2. 完成問卷
1. 回答所有 7 個問題（可以選擇任意選項）
2. 觀察 console 日誌輸出

### 3. 檢查 Console 輸出
應該看到以下日誌順序：

```
Home: uiState=questioning, results=0, error=undefined
Home: uiState=loading, results=0, error=undefined
[RecommendationService] Tags extracted: [tags]
[RecommendationService] Using repository: MockRestaurantRepository
[RecommendationService] Fetched 5 restaurants from repository
Checking restaurant: [name] (Tags: ...)
rankRestaurants finished. Returning 5 results.
[RecommendationService] Ranked 5 restaurants, returning top results
useQuiz: Received 5 recommendations
Home: uiState=results, results=5, error=undefined
[ResultCardStack] Rendering with 5 restaurants, currentIndex=0
[ResultCardStack] First restaurant: {...}
```

### 4. 預期結果
- ✅ 看到 Tinder 風格的卡片堆疊
- ✅ 顯示餐廳名稱、圖片、評分、距離、價格等級
- ✅ 顯示 LLM 推薦理由（或匹配理由）
- ✅ 可以左右滑動卡片
- ✅ 底部有三個按鈕：Undo、X（左滑）、✓（右滑）

### 5. 如果出現錯誤
檢查 console 中的錯誤訊息：
- 如果看到 Zod 驗證錯誤 → 檢查 restaurant schema
- 如果看到 API 錯誤 → 檢查環境變數設定
- 如果 results=0 → 檢查 mock data 或 ranking 邏輯

## 可能的問題場景

### 場景 1: 空結果數組
**症狀**: `results=0` 但沒有錯誤
**原因**: 
- Mock data 可能沒有載入
- Ranking 邏輯過濾掉所有餐廳
**檢查**: 查看 `[RecommendationService]` 日誌

### 場景 2: 顯示錯誤畫面
**症狀**: 看到紅色錯誤圖示和 "Oops! Something went wrong"
**原因**: 
- Zod schema 驗證失敗
- Repository 拋出異常
**檢查**: 查看錯誤訊息和 console

### 場景 3: 卡在 Loading 狀態
**症狀**: 一直顯示 "Finding best matches..."
**原因**: 
- Promise 沒有 resolve
- 狀態機沒有觸發 LOADED 事件
**檢查**: 查看是否有 `useQuiz: Received X recommendations` 日誌

## 當前配置

- **數據源**: MockRestaurantRepository (因為沒有 .env 文件)
- **Mock 餐廳數量**: 5 家
- **問題數量**: 7 題

## 下一步

如果測試後仍然無法顯示結果，請：
1. 複製完整的 console 輸出
2. 截圖當前畫面
3. 說明在哪個步驟卡住

## 已增強的功能

✅ 價格等級顯示（$-$$$$）
✅ 基於分類的美食圖片
✅ 中文空狀態訊息
✅ 錯誤處理和重試功能
✅ 詳細的調試日誌
