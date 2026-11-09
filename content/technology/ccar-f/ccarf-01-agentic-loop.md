---
title: 編曲者筆記 01｜Agentic Loop：領班的手勢
description: Agent 什麼時候該繼續、什麼時候該收尾，不是看模型說了什麼，而是看 stop_reason。從一個常見的停止條件錯誤講起，拆解 agentic loop 的正確寫法、歷史為何要重送，以及如何保證每個 session 都有結果。
date: 2026-11-07
tags:
  - ccar-f
  - claude
  - 系列/ccar-f備考
  - agentic-loop
series: 編曲者筆記：CCAR-F 備考心得
order: 1
draft: false
---

![[ccarf-cover.jpg]]

> [!abstract] 對應官方考試目標
> #6 用 stop_reason 決定繼續或結束｜#17 無狀態 API 為何要帶完整歷史｜#1 無論迴圈怎麼結束，都要保證完成或升級（編號見系列規劃）

## 情境

一個查訂單的 agent，任務是「查訂單 A1024 的出貨狀態，延遲就寄道歉信」。測試時它回了一句「我會先查詢訂單狀態，確認是否延遲，再依結果處理」，程式隨即印出「任務完成」並結束，查詢和寄信都沒有發生。

原因在停止條件：程式看到回應裡有文字，就當模型講完了。實際上那段文字只是呼叫工具前的開場白，同一個回應後面還有一個 `tool_use` 區塊，程式沒有處理。

這是 Domain 1 最常見的題型：==agent 什麼時候該繼續，什麼時候該停？==

---

## 這題在考什麼

### 用樂團來想：看領班的手勢，不要聽樂手在說什麼

爵士現場，一首曲子什麼時候結束，不是看哪個樂手說「我彈完了」，而是看**領班的手勢**：手一舉是「再來一輪」，手一握是「收」。樂手在獨奏中間講話、喊一聲，都不代表曲子結束。

Claude 的回應也有一個「手勢」，叫做 **`stop_reason`**。模型回應裡的文字是樂手在說話，`stop_reason` 才是領班的手勢。

上面情境的 bug 就是：==聽樂手說話，沒看領班的手勢。==

### 正式一點：agentic loop 長什麼樣

Messages API 每次回應都帶一個 `stop_reason` 欄位，告訴你模型**為什麼**停下來。一個 agentic loop 的核心就是依照它決定下一步：

![[ccarf-01-loop.svg]]

1. 把對話歷史＋工具定義送給 Claude
2. 看 `stop_reason`：
   - **`tool_use`** → 模型要你執行工具。執行回應裡**每一個** `tool_use` 區塊，把結果包成 `tool_result`（用 `tool_use_id` 對應），放進下一則 user 訊息，回到第 1 步
   - **`end_turn`** → 模型自然地完成了這一輪。這才是正常的結束
   - **其他值** → 各有各的處理方式（見下表）

| stop_reason | 什麼時候出現 | 該怎麼做 |
|---|---|---|
| `end_turn` | 模型自然完成回應 | 使用回應，迴圈結束 |
| `tool_use` | 模型要呼叫你提供的工具 | 執行工具，回傳 `tool_result`，繼續迴圈 |
| `max_tokens` | 輸出達到你設定的 `max_tokens` 上限 | ==不是完成==：調高上限或接著產生 |
| `stop_sequence` | 輸出了你設定的停止字串 | 看是哪一個觸發，依你的設計處理 |
| `pause_turn` | 伺服器端工具（如 web search）的迴圈達到迭代上限 | 把 assistant 的內容原樣送回去，讓它繼續 |
| `refusal` | 模型拒絕回應 | 讀 `stop_details`，視情況改用備援方案 |

> [!note] `pause_turn` 和 `tool_use` 的差別
> 官方文件特別說明：如果回應裡有**等你執行**的工具呼叫，`stop_reason` 一定是 `tool_use`，不會是 `pause_turn`。`pause_turn` 只跟 Anthropic 那邊執行的伺服器端工具有關。有用伺服器端工具的 agent 迴圈都要處理它。

### 用樂團再對一次

| 手勢 | 樂團裡的意思 | 程式該做的事 |
|---|---|---|
| `tool_use` | 「鼓手，換你」 | 讓工具上場，把結果交回給領班 |
| `end_turn` | 手一握：收 | 結束 |
| `max_tokens` | 時間到了被燈光師切掉 | 曲子沒彈完，不是收尾 |
| `pause_turn` | 中場換氣 | 原樣接回去，繼續 |

### 為什麼每一輪都要重送完整歷史（目標 #17）

Messages API 的每次請求彼此獨立，伺服器不會記得上一輪。要讓模型「接著剛才的做」，呼叫端必須把到目前為止的 messages 全部再送一次：user 訊息、assistant 回應（含 `tool_use` 區塊）、`tool_result`。程式碼裡的 `messages.append(...)` 就是在維護這份狀態。

這帶來三個後果：

- assistant 的回應要**原樣**放回歷史，缺了 `tool_use` 區塊，下一則的 `tool_result` 就沒有對應的 `tool_use_id`
- 歷史越長，每一輪送出的內容越多，成本和延遲跟著上升，也可能超過 context 上限（處理方式見 [[token-05-checkpoints|檢查點與交接摘要]]）
- 跨輪、跨 session 的狀態由你的應用程式負責保存，不是模型或伺服器的責任

### 不管迴圈怎麼結束，都要保證收尾（目標 #1）

迴圈可能因 `end_turn`、`max_tokens`、輪數上限、工具故障或例外而終止。包住迴圈的那一層（orchestration 層）要確保每個 session 最後一定落在兩種狀態之一：**已完成解決**，或**已升級給真人**。不能是「做到一半、沒人知道」。

```python
def run_session(ticket):
    try:
        answer = run_agent(ticket.text, tools, tool_impls)   # 上一節的迴圈
        if not business_check(ticket):                       # 用程式確認結果，不是聽模型說
            raise RuntimeError("模型回報完成，但業務結果未達成")
        return {"status": "resolved", "answer": answer}
    except Exception as e:                                   # max_tokens、輪數上限、工具故障…
        escalate_to_human({"ticket": ticket.id,
                           "reason": str(e),
                           "progress": load_progress(ticket)})
        return {"status": "escalated", "reason": str(e)}
```

（`business_check`、`escalate_to_human`、`load_progress` 是示意用的函式名稱。）重點有兩個：非正常結束一律走升級路徑並附上進度；`end_turn` 也不等於任務達成，是否真的完成要由程式檢查。何時該立刻升級、何時先自行處理，見 [[ccarf-07-reliability-escalation|07]]。

---

## 常見陷阱

![[ccarf-01-traps.svg]]

> [!failure] 陷阱 1：從文字內容判斷是否完成
> 例如「回應裡有『完成』就結束」，或「有 text 就結束」。
> **為什麼會錯**：同一個回應可以同時有 text 和 `tool_use` 區塊，模型常常先講一句「我來查一下」再呼叫工具。反過來，模型說「我已經完成了」也不代表它真的做了。==自然語言是給人看的，不是控制訊號。==

> [!failure] 陷阱 2：把迭代上限當成主要的停止條件
> 例如 `for i in range(5)`，跑完 5 輪就結束，不管模型做到哪。
> **為什麼會錯**：任務簡單時 5 輪太多（浪費），任務複雜時 5 輪不夠（做到一半被切掉，而且程式以為成功了）。迭代上限應該是**安全網**：用來防止無窮迴圈，觸發時要當成異常處理（記錄、告警、回報「未完成」），不是正常的結束路徑。

> [!failure] 陷阱 3：工具出錯就讓整個程式丟例外
> 例如查訂單的 API 回 404，程式直接 crash。
> **為什麼會錯**：工具錯誤是模型應該知道的**資訊**。把錯誤包成 `tool_result` 並設 `is_error: true` 回傳給模型，它可以換個參數重試、改用別的工具，或告訴使用者查不到。直接 crash 等於樂器壞了就整團散場，連「抱歉這首換個編制」的機會都沒有。

---

## 觀念拆解與準備方法

### 1. 最小可用的 agent 迴圈

較穩的寫法如下，重點都在註解裡：

```python
import anthropic

client = anthropic.Anthropic()
MODEL = "claude-sonnet-5-5"   # 換成你要用的模型
MAX_TURNS = 20                # 安全網，不是正常的停止條件

def run_agent(user_input: str, tools: list, tool_impls: dict) -> str:
    messages = [{"role": "user", "content": user_input}]

    for turn in range(MAX_TURNS):
        resp = client.messages.create(
            model=MODEL, max_tokens=4096, tools=tools, messages=messages,
        )
        # 1. 先把 assistant 的完整回應（含 tool_use 區塊）放回歷史
        messages.append({"role": "assistant", "content": resp.content})

        # 2. 看手勢，不看文字
        if resp.stop_reason == "end_turn":
            return "".join(b.text for b in resp.content if b.type == "text")

        if resp.stop_reason == "tool_use":
            results = []
            for block in resp.content:          # 可能一次有好幾個工具呼叫
                if block.type != "tool_use":
                    continue
                try:
                    output = tool_impls[block.name](**block.input)
                    results.append({"type": "tool_result",
                                    "tool_use_id": block.id,
                                    "content": str(output)})
                except Exception as e:          # 錯誤交給模型判斷
                    results.append({"type": "tool_result",
                                    "tool_use_id": block.id,
                                    "content": f"錯誤：{e}",
                                    "is_error": True})
            # 所有結果放在同一則 user 訊息裡
            messages.append({"role": "user", "content": results})
            continue

        if resp.stop_reason == "pause_turn":
            continue    # assistant 內容已放回歷史，再呼叫一次就會接著做

        if resp.stop_reason == "max_tokens":
            raise RuntimeError("輸出被截斷：調高 max_tokens 或改成分段產生")

        raise RuntimeError(f"未處理的 stop_reason：{resp.stop_reason}")

    # 3. 走到這裡代表安全網被觸發：這是異常，不是成功
    raise RuntimeError(f"超過 {MAX_TURNS} 輪仍未完成，請檢查任務或工具設計")
```

### 2. 讀題時的檢查清單

情境題只要出現「agent 停得太早／停不下來／做一半」，就照這個順序檢查選項：

- [ ] 停止條件是看 **`stop_reason`**，還是看文字內容？
- [ ] `tool_use` 之後，有沒有把**所有**工具結果用正確的 `tool_use_id` 回傳？
- [ ] assistant 的回應（含 `tool_use` 區塊）有沒有**原樣**留在歷史裡？
- [ ] 工具錯誤是**回傳給模型**，還是直接中斷？
- [ ] 迭代上限是**安全網**（觸發時告警），還是**主要的結束條件**？
- [ ] `max_tokens` 有沒有被誤當成完成？

### 3. 動手做一次

> [!example] 30 分鐘練習
> 1. 用上面的迴圈，接兩個假工具：`get_order(order_id)` 和 `send_email(to, body)`
> 2. 故意讓 `get_order` 對某個訂單編號丟例外，觀察模型拿到 `is_error` 之後怎麼做
> 3. 把 `max_tokens` 設成 50，觀察 `stop_reason` 變成什麼
> 4. 把停止條件改成「有 text 就結束」，重現上面情境的翻車

做完第 4 步，你在考場上看到這類選項，會直接想起來。

---

## 自編類題

> [!example] 自編類題 01-1
> **情境**：一個多步驟的資料整理 agent，偶爾會在只完成一半時就結束，最後一則回應的文字通常是「我接下來會處理剩下的檔案」。目前迴圈的停止條件是「回應中沒有 `tool_use` 區塊就結束」，另外有 10 輪的上限。
>
> 以下哪個修改**最能**解決問題？
>
> - A. 把迭代上限從 10 輪調高到 30 輪
> - B. 在 system prompt 加上「完成所有工作前不要結束」
> - C. 改成依 `stop_reason` 判斷；`max_tokens` 時視為未完成並接著產生，`end_turn` 才結束
> - D. 偵測回應文字中是否出現「接下來」「稍後」等字眼，出現就自動再送一次「請繼續」
>
> > [!tip]- 解析
> > **答案：C。**
> > 「最後一句說接下來會處理」，很像回應在中途被 `max_tokens` 截斷了：沒有 `tool_use` 區塊，但也不是 `end_turn`。原本的停止條件把截斷誤判成完成。
> > A 不相關（它不是被輪數上限切掉的）。B 是請模型自律，沒處理到截斷。D 是用文字內容當控制訊號，就是陷阱 1，換一種說法就失效。

> [!example] 自編類題 01-2
> **情境**：客服 agent 呼叫 `lookup_customer` 時，後端偶爾逾時。目前的做法是丟例外並回覆使用者「系統錯誤，請稍後再試」。產品經理希望 agent 能自己處理大部分的暫時性錯誤。
>
> 最合適的設計是？
>
> - A. 在 `lookup_customer` 外層包一個無限重試迴圈，直到成功
> - B. 把錯誤以 `tool_result`（`is_error: true`）回傳，並在錯誤內容中說明「逾時，可重試」；同時保留迭代上限作為安全網
> - C. 遇到錯誤時改用另一個 agent 重新開始整個對話
> - D. 在 system prompt 列出所有可能的錯誤碼及處理方式
>
> > [!tip]- 解析
> > **答案：B。**
> > 錯誤是資訊，交給模型決定要重試、換方法，還是告訴使用者。錯誤訊息寫清楚「可不可以重試」，模型才有判斷依據。
> > A 可能卡死，而且模型完全不知道發生什麼事。C 丟掉所有 context，代價太大。D 把執行期的資訊塞進總譜，錯誤碼一改就過時，也讓每一輪的 context 變大。

> [!example] 自編類題 01-3
> **情境**：客服 agent 偶爾因為達到輪數上限而結束，客戶沒有收到任何回覆，系統裡也沒有留下工單。哪個設計**最能**確保每個 session 都有結果？
>
> - A. 把輪數上限從 15 調高到 50
> - B. 在 system prompt 寫「無法解決時一定要升級給真人」
> - C. 在 orchestration 層對任何非正常結束都建立升級工單，附上原因與已完成的步驟
> - D. 結束後再請模型自我評估任務是否完成
>
> > [!tip]- 解析
> > **答案：C。**
> > A 只是降低發生機率，上限被觸發時仍然沒有結果。B 和 D 都是請模型自律；輪數上限被觸發時，模型根本沒有機會執行這段指示。C 把「一定要有結果」寫進程式，不依賴模型當下的行為。

---

## 備考建議

- **先寫迴圈、後讀文件**：自己讓 agent 在「有 text 就結束」的寫法下失敗一次，比背 stop_reason 表格記得久。
- **把 `max_tokens`、`pause_turn`、輪數上限也寫進練習**：平常幾乎碰不到，但考題喜歡出這種「上線才會出事」的情況。

---

## 速查表

| 觀念 | 容易搞混的地方 | 判斷方法 |
|---|---|---|
| 停止條件 | 看文字內容判斷是否完成 | 只看 `stop_reason`；`end_turn` 才是正常結束 |
| `tool_use` | 只執行第一個工具呼叫 | 一個回應可能有多個 `tool_use`，全部執行，結果放同一則 user 訊息 |
| 歷史紀錄 | 只存文字，丟掉 `tool_use` 區塊 | assistant 的 content 原樣放回 |
| `max_tokens` | 當成完成 | 是截斷；調高上限或接著產生 |
| `pause_turn` | 跟 `tool_use` 混在一起 | 只出現在伺服器端工具；原樣送回繼續 |
| 歷史 | 以為伺服器記得上一輪 | 每次請求獨立；送完整 messages，含 `tool_use` 與 `tool_result` |
| 收尾 | 以為 `end_turn` 就代表任務達成 | orchestration 層用程式驗證結果；任何非正常結束都走升級 |
| 迭代上限 | 當成主要停止條件 | 是安全網；觸發要告警、回報未完成 |
| 工具錯誤 | 丟例外中斷 | `tool_result` 加 `is_error: true` 交給模型 |

> [!tip] 一句話記住
> ==看領班的手勢（stop_reason），不要聽樂手在說什麼（text）。==

---

**上一篇** ← [[ccarf-00-guide|00｜導讀：這張考卷在考判斷，不是背誦]]
**下一篇** → [[ccarf-02-multi-agent|02｜多 agent：拆解、交接與續接]]

## Sources

- [Claude Docs：Handling stop reasons（stop_reason 各值的意義與處理方式）](https://platform.claude.com/docs/en/api/handling-stop-reasons)
- [Claude Docs：Handling stop reasons（pause_turn 與 tool_use 的差別、各值處理表）](https://platform.claude.com/docs/de/api/handling-stop-reasons)
- [Clarista：CCAR-F Domain 1 範圍（agentic architecture 27%）](https://www.clarista.io/blog/claude-certified-architect-guide)
