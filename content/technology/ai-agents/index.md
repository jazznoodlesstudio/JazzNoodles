---
title: AI Agents：把開發流程交給一支接力隊
description: 把 SDLC 拆成專職 agent，加一位不跑步的裁判。從分工、變更傳播到可遷移性的實戰設計筆記。
date: 2026-11-09
tags:
  - multi-agent
  - claude-code
  - 系列/ai-agents
series: ai-agents
order: 0
---

![[ai-agents-cover.svg]]

# AI Agents：把開發流程交給一支接力隊

這個系列記錄我怎麼把軟體開發生命週期（SDLC）拆成一組專職 agent，再由一位**不跑步的裁判**（Orchestrator）調度。

貫穿全系列的比喻只有一個：==接力賽==。

- **選手** = 專職 agent，各跑一段，只在自己的賽道上跑
- **接力棒** = 產物檔案（PRD、SA、SD、程式碼……），選手之間不直接傳話，只傳棒
- **裁判** = Orchestrator，自己不跑，只看棒子有沒有換、該誰接、什麼時候要暫停讓人簽名

## 系列文章

1. [[agents-01-why-specialist|為什麼要把 SDLC 拆成專職 agent]]
2. [[agents-02-change-propagation|產物依賴圖與變更傳播：上游變了，下游怎麼知道]]
3. [[agents-03-orchestrator|Orchestrator 不做事，只調度：STATE.json 與人工核准閘]]
4. [[agents-04-bug-upstream|Bug 的向上傳播：根因分級，避免文件變謊言]]
5. [[agents-05-portability|可遷移性四規則：從 Claude Code subagents 到 Agent SDK]]

> [!note] 關於故事
> 系列中的人物與情境為綜合改編。「我」是導入 AI 的 TPM；小安是後端工程師；小米是 UI 設計師；阿哲是資深工程師。
