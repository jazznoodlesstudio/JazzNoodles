---
title: 編曲者筆記 05｜結構化輸出：把即興變成可交付
description: 用 tool use 加 JSON schema 取得穩定的結構化輸出、tool_choice 怎麼選、schema 怎麼設計 optional 與 nullable、如何提升擷取準確度，以及同步 API 與 Message Batches 的取捨。
date: 2026-11-07
tags:
  - ccar-f
  - claude
  - 系列/ccar-f備考
  - structured-output
  - tool-use
series: 編曲者筆記：CCAR-F 備考心得
order: 5
draft: false
---

![[ccarf-cover.jpg]]

> [!abstract] 對應官方考試目標
> #21 選擇取得結構化輸出的方法｜#23 tool use ＋ JSON schema ＋ `tool_choice`｜#22 擷取 schema 的 optional 與 nullable 欄位｜#24 提升擷取準確度的做法｜#8 迭代修正流程｜#20 同步 API 與 Message Batches 的取捨（編號見系列規劃）

## 情境

某公司要從每月 8,000 份供應商發票擷取「發票編號、金額、幣別、到期日」寫入會計系統。第一版在提示裡寫「請以 JSON 格式回覆」，大部分時候沒問題，但每幾百份就有幾份在 JSON 前後多了一句「以下是結果：」，解析程式直接報錯。另一個問題是：有些發票根本沒有到期日，模型卻編了一個日期填進去。

這一篇處理兩件事：==怎麼讓輸出的**格式**可靠，怎麼讓**內容**不亂填。==

---

## 考點 1：怎麼拿到結構化輸出（目標 #21、#23）

### 用樂團來想：不是請樂手「盡量照譜」，而是給他一份只有這幾格能填的表格

「請以 JSON 回覆」是口頭拜託，模型多半會照做，但沒有保證。tool use 的做法是：定義一個工具，它的 `input_schema` 就是你要的資料結構，模型的回覆是一個符合該 schema 的 `tool_use` 區塊。

### 三種做法比較

| 做法 | 格式可靠度 | 說明 |
|---|---|---|
| 提示裡寫「請回 JSON」 | 低到中 | 可能多出前後文字、欄位名稱不穩 |
| 預填（prefill）或範例引導 | 中 | 提高成功率，仍無保證 |
| **tool use ＋ JSON schema（搭配 `tool_choice`）** | **高** | 由 API 約束輸出為工具呼叫，是考試的標準答案 |

> [!note] 另有 strict 模式
> 官方的工具定義另外提供 `strict` 之類強化 schema 遵循的選項，細節與適用模型以官方文件為準。考試的核心觀念不變：用 schema 約束，而不是靠提示請求。

### `tool_choice`：控制模型要不要、要用哪個工具

| 設定 | 行為 | 用在 |
|---|---|---|
| `{"type": "auto"}` | 模型自己決定要不要呼叫工具（工具存在時的預設） | 一般對話型 agent |
| `{"type": "any"}` | **一定**要呼叫某個工具，但由模型挑 | 有多種結構可選、一定要結構化 |
| `{"type": "tool", "name": "extract_invoice"}` | **一定**呼叫指定的那個工具 | 只有一種輸出結構，例如擷取 |
| `{"type": "none"}` | 這一輪不准用工具 | 暫時關掉工具 |

擷取任務通常用 `tool` 強制呼叫指定工具，保證每次回應都是符合 schema 的資料，不會夾雜前言。

```python
response = client.messages.create(
    model=MODEL,
    max_tokens=1024,
    tools=[extract_invoice_tool],
    tool_choice={"type": "tool", "name": "extract_invoice"},
    messages=[{"role": "user", "content": invoice_text}],
)
data = next(b.input for b in response.content if b.type == "tool_use")
```

> [!warning] 強制呼叫的兩個代價
> 1. **失去「問一句再說」的出路**：被強制呼叫時，資訊不足的模型仍會呼叫並勉強填值。需要允許它回問時，改用 `auto`。
> 2. **與 extended thinking 不相容**：官方文件說明，開啟 thinking 時只支援 `auto` 與 `none`；`any` 和指定工具會報錯。

> [!failure] 陷阱 1：靠 system prompt 強調「一定要用 JSON」
> 這是請求，不是約束。格式要有保證，用 tool use ＋ schema ＋ `tool_choice`。

---

## 考點 2：schema 怎麼設計（目標 #22）

情境中的「沒有到期日卻編一個」，源頭常是 schema：把 `due_date` 設成必填，模型被迫填值。

| 欄位性質 | schema 設計 | 原因 |
|---|---|---|
| 文件裡一定有的 | `required` | 缺了就該視為錯誤 |
| **文件裡可能沒有的** | **非必填，或允許 `null`** | 沒有就回 `null`，不要逼它編 |
| 有限的類別 | `enum`，必要時加 `"other"` 與說明欄位 | 避免模型自創標籤 |
| 難以分類的情況 | 加 `"unclear"` 之類的值 | 給它誠實回答「不確定」的位置 |

```json
{
  "name": "extract_invoice",
  "description": "從發票文字擷取欄位。文件中沒有的欄位請回傳 null，不要推測。",
  "input_schema": {
    "type": "object",
    "properties": {
      "invoice_no": { "type": "string" },
      "amount": { "type": "number" },
      "currency": { "type": "string", "enum": ["TWD", "USD", "JPY", "other"] },
      "due_date": { "type": ["string", "null"], "description": "YYYY-MM-DD；未標示則為 null" }
    },
    "required": ["invoice_no", "amount", "currency", "due_date"]
  }
}
```

> [!failure] 陷阱 2：所有欄位都設必填
> 模型為了符合 schema 而編造內容。可能缺的欄位要允許 `null` 或設為非必填。

> [!failure] 陷阱 3：enum 沒有「其他」
> 遇到沒列出的類別，模型會硬塞一個最接近的，資料就被污染了。加上 `other` 與一個說明欄位，之後可以回頭分析新類別。

---

## 考點 3：提升擷取準確度（目標 #24）

schema 只保證**格式**，不保證**內容正確**。常見的做法：

| 做法 | 解決什麼 |
|---|---|
| **提示中放 few-shot 範例**（含「欄位缺失」的範例） | 讓模型學到邊界情況怎麼處理 |
| **程式端驗證**：金額加總是否等於明細、日期格式、必填邏輯 | 抓出語意上的錯，不只格式 |
| **驗證失敗就把錯誤回饋給模型重試** | 具體指出哪裡錯，讓它修正（見下一節） |
| **自我一致性檢查**：同時擷取「明細合計」與「發票總額」，比對差異 | 發現矛盾就送人工 |
| 對來源文件**加引用**（原文片段） | 方便人工複核與除錯 |

重點是：==schema 驗證通過 ≠ 資料正確==。金額欄位格式對，但數字是錯的，語法驗證抓不到。

---

## 考點 4：迭代修正流程（目標 #8）

當驗證失敗，不是只說「再試一次」，而是把**具體的失敗原因**帶回去：

1. 呼叫模型，取得結構化結果
2. 在程式端驗證（格式、語意、跨欄位檢查）
3. 失敗 → 把「原始文件、上次的輸出、失敗原因」一起送回，請它修正
4. 設定**最大重試次數**；超過就送人工，不無限重試

> [!note] 重試不是萬能
> 如果失敗是因為**資訊根本不在文件裡**（例如發票就是沒印到期日），重試一百次也不會好，只會逼出編造。這類情況應回 `null` 並交由業務規則處理。

---

## 考點 5：同步 API 還是 Message Batches？（目標 #20）

Message Batches API 以非同步方式處理大量請求：

- 費用為標準價格的 **50%**
- 處理時間**最長 24 小時**，多數更快，但沒有保證時間
- 單一批次上限 10,000 個請求或 32 MB
- 每個請求要有唯一的 `custom_id`；**結果的順序不保證**與送出順序一致，要靠 `custom_id` 對回去

| 條件 | 選擇 |
|---|---|
| 使用者在等結果、需要即時回應 | **同步 API** |
| 阻擋流程的檢查（例如合併前的 CI 檢查，要等結果才能往下） | **同步 API** |
| 夜間跑的大量處理、報表、評測、回補資料 | **Batches**（省 50%） |
| 不趕時間、數量大 | **Batches** |
| 需要在一次請求中多輪來回執行工具 | 同步（Batches 適合單次請求） |

判斷問句：==這個結果晚一點（最多一天）拿到可以嗎？== 可以 → Batches；不行 → 同步。

> [!failure] 陷阱 4：把會卡住流程的檢查放進 Batches
> 例如「PR 合併前必須通過的檢查」。結果可能要等很久，會卡住開發流程。這種要同步。

> [!failure] 陷阱 5：用 Batches 又假設結果依序回來
> 結果順序不保證，要用 `custom_id` 對應。

---

## 自編類題

> [!question] 類題 05-1
> 某系統從合約擷取「簽署日、金額、對方公司」。偶爾回應前面多出「好的，以下是結果」，導致解析失敗。最可靠的修正是？
>
> - A. 在 system prompt 加上「禁止輸出任何前言」
> - B. 定義擷取工具與 `input_schema`，並以 `tool_choice` 強制呼叫該工具
> - C. 用正規表示式從回應中切出 JSON
> - D. 降低 temperature
>
> > [!tip]- 解析
> > 答案 **B**。tool use ＋ schema ＋ 強制呼叫，讓輸出本身就是結構化資料。A、D 是請求或機率性緩解；C 是事後補救。

> [!question] 類題 05-2
> 擷取發票時，模型常為沒有「付款條件」的發票編造內容。最合適的 schema 修改是？
>
> - A. 把 `payment_terms` 設為必填，並在提示中強調不要編造
> - B. 將 `payment_terms` 設為可為 `null` 或非必填，並在欄位說明寫明「文件未提及時為 null」
> - C. 移除 `payment_terms` 欄位
> - D. 增加 `required` 欄位讓結構更嚴格
>
> > [!tip]- 解析
> > 答案 **B**。必填迫使模型填值，給它誠實回答「沒有」的出口才是根本解法。

> [!question] 類題 05-3
> 某團隊每週日夜間要重新分類 20 萬筆舊客服紀錄，週一早上用；另一個流程是每個 PR 合併前自動檢查程式碼。兩者各該用什麼？
>
> - A. 兩者都用同步 API
> - B. 兩者都用 Batches
> - C. 分類用 Batches，PR 檢查用同步 API
> - D. 分類用同步 API，PR 檢查用 Batches
>
> > [!tip]- 解析
> > 答案 **C**。分類可等到週一，用 Batches 省 50%；PR 檢查會卡住合併流程，需要同步結果。

---

## 備考建議

- **看到「格式要可靠」就想 schema ＋ `tool_choice`**，不是提示詞技巧。
- **看到「會編造」就檢查 schema**：必填與沒有 `null` 出口，是最常見的根源。
- **區分「格式正確」和「內容正確」**：驗證有兩層，題目常拿前者假裝解決後者。
- **Batches 題只問一件事**：晚一點拿到可不可以？

---

## 速查表

| 問題 | 解法 | 常見錯誤選項 |
|---|---|---|
| 輸出夾雜前後文字 | tool use ＋ schema ＋ 強制 `tool_choice` | 提示加強語氣、正規表示式補救 |
| 沒有的資料被編造 | 欄位可為 `null` 或非必填 | 欄位必填、提示求不要編 |
| 類別被亂塞 | `enum` 加 `other` 與說明 | 只列已知類別 |
| 格式對但數字錯 | 程式端語意驗證、跨欄位檢查 | 只驗證 schema |
| 驗證失敗 | 帶失敗原因重試，限制次數 | 無限重試、只說「再試一次」 |
| 大量、不趕時間 | Message Batches，用 `custom_id` 對應 | 假設依序回來 |
| 使用者在等、卡流程 | 同步 API | 用 Batches |

> [!tip] 一句話
> 格式交給 schema 約束，內容交給驗證把關，時間不趕的交給 Batches。

---

## 延伸閱讀

- 上一篇：[[ccarf-04-explore-plan|04｜Claude Code（下）：探索、規劃與團隊設定]]
- 下一篇：[[ccarf-06-tool-design-mcp|06｜工具設計與 MCP：樂器要好上手]]
- 相關：[[ccarf-06-tool-design-mcp|06]]（`tool_choice` 與多工具順序）

## Sources

- Claude API 官方文件：Define tools（`tool_choice` 四種設定、與 thinking 的相容性）
- Claude API 官方文件：Message Batches（50% 費用、24 小時、`custom_id`）；上限與模型支援以最新文件為準
- schema 與驗證的做法為整理後的實務建議，非官方逐字條文
