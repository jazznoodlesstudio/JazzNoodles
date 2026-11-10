---
title: 接力隊筆記 05｜可遷移性四規則：從 Claude Code subagents 到 Agent SDK
description: 小米問：「這套只能在你的電腦、你的 Claude Code 上跑嗎？」答案取決於一開始有沒有遵守四條規則。
date: 2026-11-09
tags:
  - multi-agent
  - claude-code
  - 系列/ai-agents
series: 接力隊筆記：SDLC Multi-Agent 開發流程
order: 5
draft: false
---

![[ai-agents-cover.svg]]

> [!abstract] 這篇的重點
> 平台會換，但資產不該跟著丟。我把整套設計限制在四條規則內，讓階段 1 到階段 2 的遷移，==只換外殼，不換資產==。

## 情境

小米看完整套流程，問了一句很實際的話：「這是不是只有在你的電腦上，用你開的那個 Claude Code session 才跑得起來？」

我愣了一下。因為我一開始確實是這樣用的：階段 1 是在 Claude Code 裡，用 subagents 和一個 skill 把流水線跑起來。

如果哪天想讓它變成常駐服務，被 webhook 叫醒、核准透過通知，而不是我坐在終端機前，那些 agent、那些狀態，能不能直接搬過去？

---

## 問題漏在哪

> [!failure] 漏洞一：資產綁在平台上
> agent 的定義寫在某個工具專屬的介面裡，換平台就等於重寫。

> [!failure] 漏洞二：狀態住在 runtime 裡
> 流程做到哪、版本是什麼，如果只存在某個執行環境的記憶體，換 runtime 就失憶。

> [!failure] 漏洞三：外部系統寫死
> 把 Jira 的呼叫散落在各 agent 裡，將來換系統或換環境，每個 agent 都要改。

## 解法：四條規則

**規則一：Agent 定義全部檔案化。**
`.claude/agents/*.md` 用 markdown 加 frontmatter，格式本身就是 Agent SDK 直接支援的，遷移不用改寫。

**規則二：狀態全部落檔。**
流程狀態、版本指紋只存在 `STATE.json` 和產物檔案裡，不依賴對話記憶。任何 runtime 讀檔就能恢復。（回頭看第三篇：同一個原則。）

**規則三：Agent 之間不直接溝通。**
只透過產物檔案加 Orchestrator 轉派。因為 agent 彼此不認識，換一個調度器，agent 完全不受影響。

**規則四：外部系統走 adapter。**
Jira、以及未來的 CI、部署，一律介面化。切換只改設定，不改 agent。

## 階段 1 到階段 2：要換什麼，不換什麼

![[agents-05-layers.svg]]

| | 階段 1 | 階段 2 |
|---|---|---|
| 調度 | 主 session 執行 `orchestrate` skill | SDK `query()` 調度迴圈 |
| 觸發 | 使用者在 session 裡下指令 | webhook / cron |
| 核准 | 在對話中用問答確認 | 通知介面（Slack 或網頁） |
| Agent 定義、狀態、Jira | `.md`、`STATE.json`、adapter | **完全相同** |

## 通用骨架：開新專案只要複製

因為資產都是檔案，新專案不用從頭來：

```text
<project-workspace>/
├── .claude/agents/          # agent 定義
├── .claude/skills/orchestrate/
├── STATE.json               # 唯一真相來源
├── STATUS.md                # 腳本產生，勿手改
├── tools/                   # 看板產生器
├── docs/                    # 架構設計、訪談清單
├── artifacts/               # PRD / SA / SD / QA / 手冊……
├── src/
├── tests/
└── jira-mock/issues/
```

開新專案：複製骨架，清空 `artifacts/`，把 `STATE.json` 重置為初始狀態，`git init`。專案層級的 agent 和 skill，只在那個資料夾開的 session 裡生效。

## 目前走到哪

這個部分我想誠實交代，不要讓這篇讀起來像「已經完成」：

| 里程碑 | 內容 | 狀態 |
|---|---|---|
| M1–M3 | 骨架、文件階段核准、開發到 Bug 循環、手冊、變更傳播演練 | 完成 |
| M3+ | 選用的市調與訪談、狀態看板、設計規範參考 | 完成 |
| M4 | 接真實 Jira；評估 release、安全審查、UX 審查 agent | 待辦 |
| M5 | 遷移到 Agent SDK 常駐服務（即上文的「階段 2」） | 待辦 |

框架已經在兩個專案上跑過，其中一個走完整條流程。**但遷移到 Agent SDK 這一步還沒做**。四條規則是我為它預留的路，不是已經驗證過的成果。等我真的遷移了，會再回頭更新這篇。

## 改完之後

回到小米的問題。這次我的回答是：「現在是的，階段 1 在 Claude Code 裡跑。但每個 agent 是一份 markdown 檔，進度是一份 JSON，Jira 是一組介面。想搬的時候，要新寫的只有調度迴圈、觸發方式和核准通知，其他東西都可以原封不動。」

小米點點頭，又補了一句：「那我的設計規範參考，也只是 agent 讀的一個檔案嘛。」

沒錯，這就是這套設計想要的樣子。

---

## 速查表

| 規則 | 遷移時省掉什麼 | 如果違反會怎樣 |
|---|---|---|
| 一、定義檔案化 | 不用改寫 agent | 換平台等於重寫全部 |
| 二、狀態落檔 | 不會失憶 | 換 runtime 後不知道做到哪 |
| 三、不直接溝通 | 換調度器不影響 agent | agent 之間耦合，牽一髮動全身 |
| 四、adapter | 換外部系統只改設定 | 每個 agent 都要改 |

> [!tip] 一句話記住
> ==資產是檔案，狀態是檔案，外部系統是介面，這樣平台就只是外殼。==

---

## 延伸閱讀

- 上一篇：[[agents-04-bug-upstream|04｜Bug 的向上傳播]]
- 下一篇：番外篇「與 AWS AI-DLC 對照」（撰寫中）

## Sources

- 本系列內容來自作者自行設計與實作的流程框架，沒有外部資料來源。

*故事情境為綜合改編。*
