---
title: 早上七點的那則「早安」：額度時段的排法，與團隊推行的三週計畫
description: 5 小時額度時段從第一則訊息開始算。小安用一個早上七點的排程任務，把重置時間從下午兩點移到中午。最後把整個系列濃縮成 10 條團隊規則與三週導入計畫。
date: 2026-11-06
tags:
  - claude
  - token
  - team-playbook
  - AI導入
  - 系列/token經濟學
series: Claude Token 經濟學
order: 6
draft: false
---

![[token-06-cover.svg]]

## 每天下午兩點前的那段空白

讀完前面幾篇，小安的用量已經省了很多。但他還是常在中午前後碰到上限，然後要等到下午兩點才能繼續。

他算了一下：九點開工，九點零二分送出第一則訊息，5 小時的時段就從那一刻開始算，**下午兩點才重置**。上午是他精神最好、工作量最大的時候，額度剛好在午餐前後用完，下午最有生產力的那一段卻在空等。

後來他做了一件小事：設定一個**排程任務，每個工作日早上七點自動送一則極短的訊息給 Claude**，內容只有「早安」兩個字。

結果時段從七點開始算，**中午十二點就重置了**。上午用 7–12 的時段，午餐後拿到一段全新的 12–17 時段。

![[token-06-window.svg]]

## 這招的本質：重新分配時間，不是多給額度

這個技巧要講清楚它**做不到**什麼：

> [!warning] 每週上限不會因此增加
> 5 小時時段和每週上限是**兩道獨立的限制**。排程叫醒只是改變 5 小時時段的「起點」，讓重置時間落在對你比較有利的時刻。一週能用的總量是一樣的。

所以它適合的情況是：**你常常卡在 5 小時時段，但每週上限還用不完**。如果你連每週上限都會碰到，該回頭看的是前面幾篇的省法，而不是時段的排法。

### 實際設定的幾個重點

- **叫醒訊息要極短**：「早安」就好。排程任務本身也從同一個池子扣額度。
- **時間抓在開工前 2 小時左右**：讓重置落在午餐時間，例如 07:00 叫醒 → 12:00 重置。
- **重度任務排在剛重置之後**：大量讀 repo、長時間研究這種吃額度的工作，放在一個時段的開頭。
- **定期報告類的排程要精簡**：如果你還有其他排程任務（每日摘要、週報），它們也在吃同一個池子。

> [!info] 規則可能調整
> 額度的時段計算方式是 Anthropic 的產品規則，可能隨方案調整而改變，實際以官方說明為準。

---

## 團隊推行版：10 條規則

這個系列一路從原理講到各個角色的做法。要在團隊裡推行時，不需要每個人都讀完六篇，只要記住這 10 條：

> [!tip] Claude 用量 10 條規則
> 1. **一任務一對話**：換任務就 `/clear` 或開新對話
> 2. **長任務用交接檔**：寫 handoff → 清掉 → 讀 handoff 繼續
> 3. **Opus 想、Sonnet 做**；subagent 用 Haiku
> 4. **指名檔案**，不要叫它自己找；維護 `repo_map.md`
> 5. **CLAUDE.md 只放每次都要的**；其餘放 skill／docs
> 6. **雜訊工作丟 subagent**：測試、log、查文件
> 7. **意見集中一則**；錯了就**編輯原訊息**，不要追加
> 8. **只要修改段落**，不要整份重寫
> 9. **可調參數集中 CONFIG**＋頁面內調整面板；A/B/C 並排一次比
> 10. **上班前排程叫醒**，讓重置落在中午

> [!info] 給工程師的一句話解釋
> 每一輪都會重送整段 context；快取讀取 0.1、寫入 1.25、輸出 5。**短對話、穩定前綴、少輪數、短輸出 ＝ 省。**

### 每條規則對應的原理

| 規則 | 槓桿 | 詳見 |
|---|---|---|
| 1、2 | 讓 context 變小（歷史） | [[token-02-claude-code\|02]]、[[token-05-checkpoints\|05]] |
| 3 | 同樣 token 用較小模型 | [[token-02-claude-code\|02]] |
| 4、6 | 讓輪數變少、工具結果變小 | [[token-02-claude-code\|02]] |
| 5 | 縮小固定前綴 | [[token-02-claude-code\|02]] |
| 7、9 | 讓輪數變少 | [[token-03-designer\|03]]、[[token-05-checkpoints\|05]] |
| 8、9 | 讓輸出變短 | [[token-03-designer\|03]]、[[token-04-research-and-docs\|04]] |
| 10 | 重新分配時段 | 本篇 |

---

## 三週導入計畫

規則寫出來容易，讓團隊真的改變習慣比較難。我們團隊是這樣分三週推的：

### 第 1 週：先量測，不要先規定

- 全員養成每天開工跑一次 `/usage` 的習慣
- 每個人記錄自己**最大的一個占比來源**（某個 MCP？subagent？長對話？）
- 週五花 15 分鐘分享：誰的最大來源是什麼

> [!note] 為什麼先量測
> 每個人的漏洞不一樣。工程師可能是讀檔太多，設計師可能是截圖太多。先讓每個人看見自己的數字，規則才有說服力。

### 第 2 週：把好習慣變成預設值

- 把精簡過的 **CLAUDE.md 範本**（含 `# Compact instructions`）放進 repo
- 把 **handoff 範本**放進 repo 的 `.claude/` 目錄
- 在 repo 加一份 `docs/repo_map.md`
- 設計師共用一份「CONFIG＋調整面板」的開場 prompt

好習慣如果要靠每個人記得，很快就會被忘掉；放進範本，它就變成預設。

### 第 3 週：回顧與調整

- 回頭看第 1 週「一小時就用完」的人，現在是否改善
- 哪些規則大家真的在用？哪些沒人用？為什麼？
- 依團隊實際狀況調整這 10 條（你的團隊可能只需要其中 6 條）

---

## 系列結語

回到第一篇那位失憶的天才顧問。

他不會因為你換了方案就變得有記憶，也不會因為你多付錢就少念幾頁記錄。能改變的只有你怎麼跟他工作：**給他看對的東西、看少一點、讓他少寫一點，並且別讓他等太久。**

星期一早上十點七分的那則求救訊息，後來再也沒出現過。

> [!tip] 整個系列的一句話
> **用量 ≈ 每一輪重送的 context × 輪數 ＋ 輸出 × 5。** 讓 context 變小、輪數變少、輸出變短，並讓快取持續命中。

---

← [[token-05-checkpoints|檢查點與交接摘要]]　｜　**回到** → [[token-00-series-guide|系列導讀]]

## Sources

- [Anthropic prompt caching 計價說明（5 分鐘寫入 1.25×、1 小時寫入 2×、讀取 0.1×）](https://docs.electronhub.ai/guides/prompt-caching)
- [Prompt caching：快取在 5 分鐘內重用才划算](https://docs.opper.ai/build/gateway/prompt-caching)
- [Cache 計價表與 Claude Code session 範例](https://chuizi.ai/docs/billing/cache-pricing)
- [Claude Code usage limits（共用池、5 小時＋每週）— Hashnode, 2026-10](https://hashnode.com/blog/claude-code-usage-limits)
- [Claude usage limits：5 小時時段從第一則訊息開始](https://fast.inference.net/guides/claude-usage)
- [Claude Code usage limits：`/clear` 不會重置額度](https://www.morphllm.com/claude-code-usage-limits)
- [Claude Code token limit：固定開銷、檔案讀取成本](https://www.morphllm.com/claude-code-token-limit)
- [Tips for token optimisation in Claude Code（/usage、/compact、CLAUDE.md、@import）](https://dev.to/vishnub33527201/tips-for-token-optimisation-in-claude-code-1kn5)
- [9 Ways to Cut Token Consumption in Claude Code（handoff、subagent 模型）](https://composio.dev/blog/ways-to-cut-token-consumption-in-claude-code)
- [Claude Code Playbook – Cost optimization（subagent 隔離輸出）](https://claude-code-playbook.pages.dev/en/docs/level-3/cost-optimization)
