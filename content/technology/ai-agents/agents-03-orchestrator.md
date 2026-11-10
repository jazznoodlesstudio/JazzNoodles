---
title: 接力隊筆記 03｜Orchestrator 不做事，只調度：STATE.json 與人工核准閘
description: 換了一台電腦、開了新對話，AI 說專案「大概做到 SD」。真實進度其實在檔案裡，不在記憶裡。
date: 2026-11-09
tags:
  - multi-agent
  - claude-code
  - 系列/ai-agents
series: 接力隊筆記：SDLC Multi-Agent 開發流程
order: 3
draft: false
---

![[ai-agents-cover.svg]]

> [!abstract] 這篇的重點
> 接力賽需要裁判，但裁判不能下場跑。Orchestrator 的設計原則只有一句：**自己不產出任何東西，只讀狀態、決定下一步、派人、收結果、該停就停。** 所有進度都落在檔案裡，不放在對話記憶裡。

## 情境

那天我在外面，用另一台電腦打開新對話，隨口問 AI：「專案現在做到哪了？」

它回答：「根據我們先前的討論，目前大概在 SD 階段。」

我回到辦公室打開資料夾，SD 早就核准了，程式碼也寫到一半。

AI 沒有說謊。它只是沒有別的辦法：它手上只有「對話裡出現過的片段」，真實狀態不在那裡。

---

## 問題漏在哪

> [!failure] 漏洞一：狀態住在對話裡
> 對話會被截斷、換機器、換人接手。把「現在做到哪」放在對話記憶裡，等於把帳本放在會被清掉的白板上。

> [!failure] 漏洞二：調度者也下場做事
> 如果負責調度的 agent 同時也在寫 PRD、改程式，它的上下文很快被產出內容塞滿，調度判斷反而變差，也沒人能驗收它。

> [!failure] 漏洞三：什麼時候該停，沒有明文
> 全自動沒人把關，產出方向偏了也一路跑到底；全部都要人簽，又慢到沒人想用。

## 解法：三個零件

### 零件一：STATE.json，唯一真相來源

```json
{
  "project": "<專案名稱>",
  "pipeline_state": "QA_TESTING",
  "artifacts": {
    "PRD":  { "version": 2, "hash": "a1b2c3", "status": "APPROVED", "upstream": {} },
    "SA":   { "version": 3, "hash": "d4e5f6", "status": "APPROVED", "upstream": { "PRD": "a1b2c3" } },
    "CODE": { "version": 5, "hash": "git:abc123", "status": "CURRENT", "upstream": { "SD": "778899" } }
  },
  "pending_updates": ["SD", "CODE"],
  "approvals": [ { "at": "2026-07-10 11:44", "artifact": "PRD", "version": 2, "decision": "核准" } ],
  "jira": { "adapter": "mock", "open_bugs": ["BUG-12"] }
}
```

流程狀態和版本指紋**只存在這個檔案和產物檔案裡**。換 session、換電腦、換人，讀檔就能接上。

### 零件二：Orchestrator 的六項職責

1. 流程狀態機：現在在哪個階段
2. 產物註冊表：維護 `STATE.json`
3. 變更傳播：標 STALE、依序派工
4. 人工核准閘：文件階段產出後暫停
5. Bug 分級路由（下一篇細講）
6. 狀態看板渲染：每次狀態一變就重刷 `STATUS.md`

在階段 1，它是一個 `orchestrate` skill，由主 session 執行，流程像這樣：

```text
讀 STATE.json
→ 決定下一步
→ 用 Agent tool 派 subagent
→ 收結果、更新 STATE.json、重刷 STATUS.md
→ 文件階段：停下來，請使用者核准
```

它自己不寫任何產物。使用者只需要下很少的指令：「開始」「繼續」「核准」「退回：……」「修改 PRD：……」。

### 零件三：該停和不該停的界線

下圖是裁判每一圈的工作，以及哪裡該停、哪裡自動接力：

![[agents-03-orchestrator.svg]]

- **文件階段**（需求訪談、PRD、SA、SD）：每份產出後停下，呈現摘要與 diff，核准後才往下。文件錯了，後面蓋再多都白費，所以這裡值得停。
- **開發之後**（Code Review、QA、自動化測試、Bug 循環）：自動接力，不逐步核准。這些階段有明確的驗收標準可以機械式判斷，不需要人在每一步簽名。

## 看板不經過 AI

還有一個小設計我很喜歡：`STATUS.md` 是由一支腳本從 `STATE.json` **確定性產生**的，不經過 LLM。

為什麼？因為我要的是一份「忠實反映狀態檔」的看板。如果讓 AI 自己寫進度報告，它可能寫得很流暢，但也可能寫錯，就回到開頭那個「大概在 SD」的問題。腳本不會「大概」。

內容包括階段進度條、各產物的版本與狀態、上游是否過期、待更新佇列、未結工單、核准紀錄。

## 改完之後

我再次在另一台電腦開新對話，說：「繼續。」

Orchestrator 讀了 `STATE.json`：`pipeline_state` 是 `QA_TESTING`，`SD` 為 STALE，待更新佇列裡有 `SD` 和 `CODE`。它不問我「做到哪」，直接說：「SD 過期，先處理 SD，請 sd-agent 評估影響範圍。」

我打開 `STATUS.md`，看板上的狀態和它說的一模一樣，因為兩者讀的是同一個檔案。

---

## 速查表

| 設計 | 解決的問題 | 容易搞混的地方 |
|---|---|---|
| `STATE.json` | 狀態不依賴對話記憶 | 它是唯一真相來源，產物檔案以外不另存 |
| Orchestrator 不產出 | 調度判斷不被內容塞滿 | 它「派」，不「做」 |
| 文件階段核准 | 在錯誤擴散前攔截 | 開發後不逐步核准，靠驗收標準 |
| `STATUS.md` 由腳本產生 | 看板不會寫錯 | 腳本讀檔，不經 LLM |
| 簡短的指令面 | 降低操作成本 | 「核准」和「退回」才是人要做的判斷 |

> [!tip] 一句話記住
> ==裁判不下場，帳本不放在記憶裡，進度看檔案，不看對話。==

---

## 延伸閱讀

- 上一篇：[[agents-02-change-propagation|02｜產物依賴圖與變更傳播]]
- 下一篇：[[agents-04-bug-upstream|04｜Bug 的向上傳播]]
- 相關：[[token-05-checkpoints|檢查點與交接摘要]]

## Sources

- 本系列內容來自作者自行設計與實作的流程框架，沒有外部資料來源。

*故事情境為綜合改編。*
