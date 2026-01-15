### 🧠 邏輯架構分析：從「過濾」轉向「動態聚類」

#### 1. 核心流程構想 (The Workflow)

你的新邏輯可以拆解為四個步驟：

1. **Data Fetching**: 從 Google Maps 抓取 3km 內餐廳（Pool Size）。
2. **AI Clustering**: LLM 讀取這批資料，找出它們之間的「主要差異特徵」（例如：有些是麵食、有些是飯；有些昂貴、有些便宜）。
3. **Dynamic Questioning**: 針對這些特徵生成 N 個「二選一 + 中立」的問題。
4. **Ranking & Display**: 根據用戶選擇保留特定群組，並依照（距離/評分/相關性）進行最終排序。


### 優化方案 (Refined Architecture)

為了存活在「Google 60 筆限制」與「使用者耐心有限」的夾縫中，我建議採用 **「預取 + 標籤生成 (Pre-fetch & Tagging)」** 模式，而不是即時生成。

#### 實作流程圖

1. **Smart Fetch (智慧獲取)**:
* 不只是抓「附近 3km」，而是根據時間點（如中午）抓取 `openNow=true` 且 `rankBy=PROMINENCE` 的前 40-60 間。


2. **The "Map-Reduce" Strategy (AI 處理策略)**:
* **不要**讓 AI 針對每個人生出不一樣的問題（太慢）。
* **要**讓 AI 針對這 60 間餐廳，**打上多維度標籤 (Multi-dimensional Tagging)**。
* *Prompt 範例*：「這裡是 40 間餐廳資料，請為每一間餐廳標記以下維度：[主食類型: 麵/飯/不限], [氣氛: 熱鬧/安靜/不限], [罪惡感: 高熱量/健康/不限]。」


3. **Client-Side Filtering (前端極速互動)**:
* 後端回傳這 60 間餐廳（已帶有 AI 標籤）。
* 前端直接根據標籤顯示問題。
* **優點**：使用者回答問題時，**完全不需要再等待 Loading**，因為資料已經在前端，只是隱藏/顯示而已。


4. **Dynamic Sorting (動態排序)**:
* 這部分最簡單，前端 `Array.sort()` 即可實作：
* `sortByDistance`: 使用 Haversine 公式算出的距離排序。
* `sortByRating`: 依照 `rating` 欄位排序。
* `sortByRelevance`: 依照符合標籤的數量排序。


---

### 💻 技術實作指南 (Implementation Guide)

我們將這個新邏輯拆解為後端與前端任務。

#### Step 1: 後端 API 改造 (`app/api/restaurants/route.ts`)

你需要一個強大的 "Orchestrator" (指揮官)。

```typescript
// 虛擬代碼概念
export async function POST(req) {
  // 1. Google API Fetching (平行請求以加速)
  // 抓取 2-3 頁，湊滿 40-60 筆
  const googlePlaces = await fetchNearbyPlaces(lat, lng, radius=3000); 

  // 2. Data Minification (極簡化資料以省 Token)
  const minifiedPlaces = googlePlaces.map(p => ({
    id: p.id,
    name: p.displayName.text,
    types: p.types,
    price: p.priceLevel
  }));

  // 3. LLM Processing (一次性分類)
  // 讓 LLM 回傳一個 Map: { "rest-id-1": { isNoodle: true, isHeavy: false }, ... }
  const aiTags = await getLLMTags(minifiedPlaces); 

  // 4. Merge & Return
  const finalData = googlePlaces.map(p => ({
    ...p,
    aiTags: aiTags[p.id] // 將 AI 智慧注入每一筆資料
  }));

  return NextResponse.json(finalData);
}

```

#### Step 2: 定義問題設定檔 (Question Configuration)

既然是動態，我們可以設定一個變數來控制問題上限。

```typescript
// config/questions.ts
export const QUESTION_LIMIT = 5; // 可自訂

// 這些問題的邏輯現在變成「檢查餐廳的 aiTags」
export const DYNAMIC_QUESTIONS = [
  {
    id: 'carb_type',
    text: '想吃麵還是飯？',
    optionA: { label: '麵食派', tag: 'isNoodle' }, // 對應 AI 標籤
    optionB: { label: '吃飯派', tag: 'isRice' },
    optionN: { label: '都可以', tag: null }
  },
  // ... 更多問題
];

```

#### Step 3: 前端排序邏輯 (`components/ResultCardStack.tsx`)

當使用者回答完，前端會有一個 `activeFilters` 陣列。

```typescript
const sortRestaurants = (restaurants, criteria: 'distance' | 'rating' | 'relevance') => {
  return [...restaurants].sort((a, b) => {
    if (criteria === 'distance') return a.distance - b.distance;
    if (criteria === 'rating') return b.rating - a.rating;
    if (criteria === 'relevance') {
      // 算出符合多少個 user selected tags
      const scoreA = calculateMatchScore(a, userAnswers);
      const scoreB = calculateMatchScore(b, userAnswers);
      return scoreB - scoreA;
    }
    return 0;
  });
};

```

---

### 最終決策

為了**避免使用者在第一題出來前就等到睡著**，我考慮採用 **「非同步加載 (Lazy Loading / Streaming)」** 的策略：

1. **第一階段 (快速)**：
* App 啟動，先顯示**靜態**的第一題（例如：想吃大餐還是小吃？）。
* 這時候背景偷偷去呼叫 Google API 抓資料。


2. **第二階段 (AI 介入)**：
* 當使用者在回答前 2 題時，後端 LLM 正在拼命分析那 60 間餐廳。
* 等使用者滑到第 3 題時，資料已經回來了，接下來的題目就可以根據那 60 間餐廳的特徵動態調整（例如：如果發現附近全是咖啡廳，就不要問「想吃火鍋嗎」）。



**下一步行動 (Next Step):**

這是一個比較大的架構更動。為了降低風險，我們先做一個 **「數據實驗 (Data Experiment)」**：

> **AI Agent 指令：**
> 「請寫一個獨立的 Script (例如 `scripts/test-llm-clustering.ts`)。
> 1. 用寫死的座標呼叫 Google Places API 抓取 20 筆餐廳。
> 2. 將這 20 筆資料丟給 LLM (Gemini)。
> 3. 測試 Prompt：請 LLM 根據這 20 間店，自動生成 3 個最能將這些餐廳『二分法』的問題（例如：日式 vs 美式、正餐 vs 點心），並回傳每間餐廳對應的分類結果。
> 4. 印出結果讓我看看分類是否準確，以及耗時多久。」
