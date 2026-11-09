---
title: 編曲者筆記 00｜導讀：這張考卷在考判斷，不是背誦
description: CCAR-F 是 Anthropic 第一張 Claude 技術認證。60 題全是情境題，考的是做架構取捨的判斷力。這篇整理考試結構、五個 domain 的權重，以及備考路線。
date: 2026-11-07
tags:
  - ccar-f
  - claude
  - 系列/ccar-f備考
series: 編曲者筆記：CCAR-F 備考心得
order: 0
draft: false
---

![[ccarf-cover.jpg]]

## 這篇在講什麼

CCAR-F 的題目幾乎都是情境題：給你一個系統（客服 agent、CI pipeline、多 agent 研究系統），問你哪個設計最合理。選項通常每個都「做得到」，差別在哪個最適合這個情境。

所以這個系列不是 API 參數整理，而是**做架構取捨的練習**。這篇先整理考試結構、五個 domain 的權重和備考路線；後面每一篇對應一組官方考試目標。

---

## 這張證照是什麼

CCAR-F 的全名是 **Claude Certified Architect – Foundations**。Anthropic 在 2026 年推出 Claude Partner Network 時，同時發表了這張認證，並稱它是第一張 Claude 技術認證，對象是用 Claude 打造正式上線應用的解決方案架構師。

官方的說法是：這張證照驗證你能不能在實作真實解決方案時，==做出有根據的取捨決策==。範圍橫跨四項技術：

- **Claude API**（Messages API、tool use、批次處理）
- **Claude Agent SDK**
- **Claude Code**
- **MCP**（Model Context Protocol）

官方 exam guide 描述的典型考生，是對 Claude API、Agent SDK、Claude Code、MCP 都有大約半年以上實作經驗的解決方案架構師。

> [!note] 報考資格
> 目前考試只開放給 Claude Partner Network 成員組織的人報考（加入 Partner Network 免費），要用公司網域的 email 註冊。考試由 Pearson 執行，證書透過 Credly 發放。資格規定可能調整，**以官方說明為準**。

---

## 用樂團來想：架構師是編曲者

這個系列會一直用一個比喻：**爵士樂團**。

爵士樂常被誤會成「大家隨便亂彈」。其實好的爵士樂團有很嚴謹的結構：編曲者先寫好總譜，決定哪一段誰獨奏、哪一段全團齊奏、什麼手勢代表收尾。樂手在這個框架裡即興，聽起來自由，但不會失控。

Agent 系統也是這樣：

| 樂團 | Claude 系統 |
|---|---|
| 編曲者 | **你**（架構師） |
| 總譜 | system prompt、CLAUDE.md |
| 領班 | coordinator / orchestrator agent |
| 樂手 | subagent |
| 樂器、音響接口 | tools、MCP server |
| 舞台上的譜架 | context window（擺得下的東西有限） |
| 領班的手勢 | stop_reason（現在要繼續、要換人，還是收尾） |
| 「這段不即興，照譜彈」 | structured output、JSON schema |

模型負責即興，你負責編曲。CCAR-F 考的就是編曲的能力：==什麼時候讓它自由發揮，什麼時候要把譜寫死==。

> [!tip] 比喻只用來開門
> 每篇我都會先用樂團講直覺，再換回正式術語。考試用的是術語，不要在考場上想著薩克斯風。

---

## 考試結構

### 基本資訊

| 項目 | 內容 |
|---|---|
| 題數／時間 | 60 題／120 分鐘 |
| 形式 | 情境題，監考（線上 OnVUE 或考場） |
| 計分 | 100–1,000 分，720 分通過，只看總分決定是否通過 |
| 閉書 | 手機、手錶、耳機、資料、第二螢幕都不能用 |
| 費用 | US$125（待確認，早期資料寫 US$99） |
| 題型 | 第三方資料有兩種說法：「單選＋複選，每題會標明選幾個」或「全部單選」（待確認） |

### 四個情境，從六個抽

這是 CCAR-F 最特別的地方。所有題目都掛在一個「生產情境」底下。題庫有 6 個情境，每位考生隨機抽 4 個：

1. 客服問題處理 agent
2. 用 Claude Code 產生程式碼
3. 多 agent 研究系統
4. 用 Claude 提升開發者生產力
5. 在 CI 裡用 Claude Code
6. 結構化資料抽取

==你沒辦法賭哪個情境不會考==，六個都要準備。

### 五個 domain 與權重

![[ccarf-00-domains.svg]]

| Domain | 權重 | 在考什麼（白話版） | 對應篇 |
|---|---|---|---|
| 1. Agentic Architecture & Orchestration | 27% | 迴圈怎麼跑、何時停、單 agent 還是多 agent、hooks | [[ccarf-01-agentic-loop\|01]]、02 |
| 2. Tool Design & MCP Integration | 18% | 工具怎麼設計模型才會選對、MCP 介面怎麼切 | 06 |
| 3. Claude Code Configuration & Workflows | 20% | CLAUDE.md、Skills、slash commands、plan mode、接進團隊流程 | 03、04 |
| 4. Prompt Engineering & Structured Output | 20% | JSON schema、few-shot、從非結構化文件抽資料 | 05 |
| 5. Context Management & Reliability | 15% | 長文件、長對話、多 agent 交接、錯誤處理、升級給真人 | 07 |

> [!warning] 不考的東西
> 據第三方整理，exam guide 附錄列了不在範圍內的主題，例如 fine-tuning、計費、computer use、雲端供應商設定。習慣把計價背熟的人，這次可以省下這部分。**以官方 guide 附錄為準**。

---

## 常見的錯誤準備方式

> [!failure] 陷阱 1：把它當功能型考試準備
> **為什麼會錯**：雲端證照考久了，會習慣「這個服務叫什麼、上限多少」。但 CCAR-F 的選項通常每個在技術上都做得到，差別只在哪個最適合這個情境。背規格對這種題目幫助不大。

> [!failure] 陷阱 2：只讀文件，沒動手做
> **為什麼會錯**：第三方整理提到，exam guide 本身就強調實作經驗才是真正的準備，誘答選項是設計來抓「讀過但沒做過」的人的。沒寫過 agent 迴圈的人，很難分辨「用 stop_reason 判斷結束」和「看模型有沒有說『完成』」差在哪裡。

> [!failure] 陷阱 3：平均分配時間
> **為什麼會錯**：Domain 1 占 27%，Domain 5 只占 15%，差了將近一倍。但 Domain 5（context、可靠性）的觀念會滲進其他 domain 的情境題，實際份量比 15% 重。

---

## 備考路線

![[ccarf-00-roadmap.svg]]

%% 範本提醒：以下時間軸請換成你的真實經歷：花多久、用了哪些資源、哪週卡住。 %%

| 週 | 做什麼 | 產出 |
|---|---|---|
| 第 1 週 | 讀完官方 exam guide，把每一條 task statement 抄進 Obsidian，一條一則筆記 | 一份「考點地圖」 |
| 第 2 週 | 動手做：寫一個最小的 agent 迴圈、接一個 MCP server、設定一次 CLAUDE.md | 三個能跑的小專案 |
| 第 3 週 | 依權重逐個 domain 精讀，每讀完一個就自編 5 題情境題 | 自編題庫 |
| 第 4 週 | 做官方範例題和模擬題，錯的題目回頭找對應的 task statement | 錯題筆記 |

> [!example] 可複製：task statement 筆記範本
> ```markdown
> ---
> domain: 1
> task: "1.x 〈task statement 原文〉"
> status: 🔴 不熟 / 🟡 看得懂 / 🟢 做過
> ---
> ## 用一句話說
> ## 我做過的例子（沒有就寫「待實作」）
> ## 容易選錯的方向
> ## 相關筆記
> ```

---

## 自編類題

> [!example] 自編類題 00-1
> **情境**：一家電商要做客服 agent，可以查訂單、處理退款。團隊有三個方案：
>
> - A. 在 system prompt 寫「退款超過 NT$5,000 請先詢問主管」
> - B. 在 `process_refund` 工具裡檢查金額，超過門檻就回傳錯誤並要求呼叫 `escalate_to_human`
> - C. 把退款上限寫進 few-shot 範例，讓模型學會
> - D. 每次退款後再請另一個 agent 審查
>
> **哪個設計最能確保高額退款一定會經過真人？**
>
> > [!tip]- 解析
> > **答案：B。**
> > A 和 C 都是在「請」模型遵守，大多數時候有效，但不保證。D 是事後審查，錢已經退出去了。B 把規則放在程式碼裡，模型怎麼即興都繞不過去。
> > 用樂團來說：重要的段落不要靠樂手自覺，==直接寫死在譜上==。這個「硬性規則放程式、軟性判斷給模型」的原則，整個系列會一直出現。

---

## 備考建議

- **第一天就動手寫 agent 迴圈**，不要先讀文件。每個情境只要親手做過一次，就看得出選項裡哪個是「看起來對、做了才會出事」。
- **自己出題**：要想出三個看起來合理的錯誤選項，就必須想清楚每個設計的代價，比做現成題目更有效。

---

## 速查表

| 觀念 | 容易搞混的地方 | 判斷方法 |
|---|---|---|
| 考試性質 | 以為是功能型考試 | 選項通常都做得到，問的是「最適合」 |
| 情境 | 以為可以只準備幾個 | 6 抽 4，全部都要準備 |
| 權重 | 平均分配時間 | D1 最重；D5 會滲進其他情境 |
| 硬規則 vs 軟判斷 | 把業務規則寫在 prompt 裡就以為安全 | 「一定要發生」的寫在程式；「通常這樣比較好」的給模型 |
| 範圍 | 準備計價、fine-tuning | 先看 exam guide 附錄的「不在範圍內」清單 |

> [!tip] 一句話記住
> ==CCAR-F 不問你 Claude 會什麼，問你什麼時候該讓它即興、什麼時候該把譜寫死。==

---

**下一篇** → [[ccarf-01-agentic-loop|01｜Agentic Loop：領班的手勢]]

> [!note] 關於這個系列
> 文中情境與範例皆為自編，範例題標示為**自編類題**，不重現任何真實考題（考試有保密協議）。考試規格以 Anthropic 官方 exam guide 為準。署名：Jazznoodles。

## Sources

- [Anthropic：Claude Partner Network 與首個技術認證](https://www.anthropic.com/news/claude-partner-network)
- [Anthropic Skilljar：Claude Certified Architect – Foundations 考試頁](https://anthropic.skilljar.com/claude-certified-architect-foundations-access-request)
- [Claude Academy FAQ：考試由 Pearson 執行、證書走 Credly](https://academy.claude.com/help/faq)
- [Tutorials Dojo：如何報名 CCAR-F（典型考生描述）](https://tutorialsdojo.com/how-to-book-ccar-f-exam/)
- [AItomation Academy：CCAR-F exam guide 摘要（權重、情境、計分、考場規則、不在範圍內的主題）](https://www.aitomationacademy.com/blog/claude-certified-architect)
- [Clarista：CCAR-F 指南（題型、監考方式、guide 頁數）](https://www.clarista.io/blog/claude-certified-architect-guide)
