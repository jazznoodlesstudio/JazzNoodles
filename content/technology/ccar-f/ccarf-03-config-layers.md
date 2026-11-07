---
title: 編曲者筆記 03｜Claude Code（上）：規則放在哪一層
description: CLAUDE.md、.claude/rules、Skills、hooks、permissions 都能放規則，但保證力不同。這篇用一張決策圖分清哪些規則只是建議、哪些必須由程式強制，並整理 PreToolUse／PostToolUse 的 exit code 行為。
date: 2026-11-07
tags:
  - ccar-f
  - claude
  - 系列/ccar-f備考
  - claude-code
  - hooks
series: 編曲者筆記：CCAR-F 備考心得
order: 3
draft: false
---

![[ccarf-cover.jpg]]

> [!abstract] 對應官方考試目標
> #11 依需求選擇設定機制（CLAUDE.md、`.claude/rules/` glob、Skills、hooks、permissions）｜#10 settings 的 permissions／hooks 與 CLAUDE.md 的分工｜#5 用 Pre／PostToolUse hooks 落實業務規則｜#12 用 PostToolUse hooks 做格式化、lint、測試｜#16 專案脈絡的給法：`@` 引用、CLAUDE.md 或直接寫在提示裡（編號見系列規劃）

## 情境

某團隊在 CLAUDE.md 寫了一行：「退款超過 500 元，一律先請主管核准。」上線後有一次 agent 直接呼叫了退款工具，金額 820 元，沒有任何核准記錄。團隊的第一個反應是把這行改成「**絕對不可以**」並加粗，下週同樣的事又發生一次。

問題不在措辭。CLAUDE.md 的內容是以文字形式交給模型，模型多半會遵守，但沒有任何機制保證它每次都遵守。這條規則出錯的代價是金錢損失，應該放到會執行的地方。

這是 Domain 3 的核心題型：==這條規則該放哪一層？==

---

## 這題在考什麼

### 用樂團來想：樂譜上的註記，和寫進編曲的聲部

在樂譜空白處寫「這段請輕一點」，是**註記**：樂手看到、通常會照做，但領班不能保證。要讓某件事「一定發生」，就得把它寫成**聲部本身**：譜上有這個音，樂手不可能漏掉。

CLAUDE.md 是註記，hooks 和 permissions 是寫進聲部。

### 正式一點：兩大類機制

| 類別 | 機制 | 保證力 | 適合放什麼 |
|---|---|---|---|
| **建議（advisory）** | CLAUDE.md、`.claude/rules/*.md`、Skills | 模型會讀到，但可能不遵守 | 程式風格、慣例、專案背景、工作流程指引 |
| **強制（enforced）** | hooks、settings 的 permissions | 由 Claude Code 在工具執行前後執行，與模型是否「記得」無關 | 業務規則、安全限制、一定要跑的格式化或測試 |

決策的第一個問題只有一個：==這件事萬一沒做到，後果是「不好看」還是「出事」？== 前者放建議層，後者放強制層。

![[ccarf-03-layers.svg]]

---

## 建議層：三個地方，差在「何時載入」

| 機制 | 位置 | 何時進入 context | 適合 |
|---|---|---|---|
| CLAUDE.md | 專案 `CLAUDE.md` 或 `.claude/CLAUDE.md`、使用者 `~/.claude/CLAUDE.md`、個人 `CLAUDE.local.md`，另有組織管理版 | 啟動時載入 | 全專案通用的慣例與背景 |
| `.claude/rules/*.md`（無 `paths`） | 專案內 | 啟動時載入 | 想拆成多個檔案維護的通用規則 |
| `.claude/rules/*.md`（有 `paths:` glob） | 專案內，frontmatter 寫 glob | **只在處理符合路徑的檔案時**才載入 | 只適用某類檔案的規則，例如 `src/api/**/*.ts` |
| Skills | `.claude/skills/<name>/SKILL.md` | 需要時才載入（on demand） | 偶爾才用的流程或知識，不想佔常駐空間 |

選擇邏輯整理成三句：

- 每次對話都用得到 → CLAUDE.md。官方建議單檔控制在約 200 行以內，太長遵守度會下降。
- 只跟特定路徑的檔案有關 → `.claude/rules/` 加 `paths:` glob，別人改別的檔案時不會被這些規則佔空間。
- 某個任務才會用到的步驟 → Skill，用到才載入。

### 專案脈絡的三種給法（目標 #16）

| 給法 | 行為 | 什麼時候用 |
|---|---|---|
| 寫在 CLAUDE.md | 每次都載入 | 長期不變的背景 |
| 用 `@path` 引用檔案 | 被引用的檔案**會載入 context**，不是只留個指標 | 想讓內容單獨維護、又希望常駐 |
| 直接寫在這次提示裡 | 只影響這次任務 | 臨時、一次性的資訊 |

> [!warning] `@` 引用不省 context
> 在 CLAUDE.md 裡用 `@docs/api.md`，是把那個檔案的內容也載進來，所以總量不會變小。想省空間，要改用帶 `paths:` 的 rules 或 Skill。

---

## 強制層：hooks 與 permissions

### hooks 在做什麼

hooks 是你在 settings 裡註冊的指令，Claude Code 會在固定時機自動執行。與考試最相關的兩個：

- **PreToolUse**：工具**執行前**觸發，可以擋下這次呼叫
- **PostToolUse**：工具**執行後**觸發，用來檢查結果或做收尾（格式化、lint、跑測試）

設定檔位置：使用者層 `~/.claude/settings.json`，專案層 `.claude/settings.json`（可進版控，團隊共用）。

### exit code：最容易被問的細節

| 時機 | exit 0 | exit 2 | 其他 exit code |
|---|---|---|---|
| PreToolUse | 放行 | **擋下這次呼叫**，stderr 回給 Claude，讓它換做法 | 不阻擋，只是非阻擋型錯誤 |
| PostToolUse | 成功 | 工具**已經執行完了**，無法撤銷，stderr 只會顯示給 Claude | 不阻擋 |

重點是第二列：==PostToolUse 擋不住任何事==，因為動作已經發生。要阻止的事，一定要放在 PreToolUse。

除了 exit code，hook 也可以輸出 JSON 來表達決定：PreToolUse 用 `hookSpecificOutput.permissionDecision`（`allow`／`deny`／`ask`）；PostToolUse 和 Stop 用 `"decision": "block"`。

> [!note] 以官方文件為準
> 社群曾回報特定版本的 PreToolUse 對 Write／Edit 沒有如預期擋下。考試以官方文件描述的行為為準，實務上則建議在你的版本上實測一次。

### permissions

settings 裡的 `permissions` 用 `allow`、`deny`、`ask` 三種規則限制工具可以做什麼。幾個規則要記：

- 清單型設定（例如 `permissions.allow`）在不同層級的檔案之間是**合併**，不是後者覆蓋前者
- `deny` 在任一層出現，就不能被別層的 `allow` 蓋掉
- 優先順序：managed ＞ 命令列參數 ＞ 專案本機（`.claude/settings.local.json`，不進版控）＞ 專案共用（`.claude/settings.json`）＞ 使用者（`~/.claude/settings.json`）

---

## 常見陷阱

> [!failure] 陷阱 1：把業務規則寫在 CLAUDE.md
> 「退款超過 500 一律要核准」寫在 CLAUDE.md，模型大多數時候會照做，但沒有保證。正確做法是在 PreToolUse hook 檢查金額，超過就 exit 2，並在 stderr 說明「需主管核准」，讓 agent 改走升級流程。

> [!failure] 陷阱 2：用 PostToolUse 想擋危險操作
> 例如在 PostToolUse 檢查「是不是改到了 `.env`」並 exit 2。檔案已經寫入了，exit 2 只能提醒。要擋，必須在 PreToolUse。

> [!failure] 陷阱 3：以為把規則寫得更大聲就會變成強制
> 加粗、全大寫、重複三次，仍然是建議層。可靠度的差別來自**誰執行**，不是語氣。

---

## 實作：兩個最常見的 hook

### A. PreToolUse：金額超過門檻就擋

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__billing__process_refund",
        "hooks": [
          { "type": "command", "command": ".claude/hooks/check_refund.sh" }
        ]
      }
    ]
  }
}
```

```bash
#!/bin/bash
# check_refund.sh：從 stdin 讀工具輸入，超過 500 就擋下
amount=$(jq -r '.tool_input.amount')
if [ "$amount" -gt 500 ]; then
  echo "退款 $amount 超過 500，需主管核准，請改走升級流程" >&2
  exit 2
fi
exit 0
```

### B. PostToolUse：改完檔案自動格式化

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "npx prettier --write \"$CLAUDE_FILE_PATHS\"" }
        ]
      }
    ]
  }
}
```

> [!note] 變數名稱與輸入格式請對照官方文件
> 上面的 hook 輸入欄位與環境變數是示意寫法，不同版本可能不同。考試要記的是**概念**：Pre 用來擋、Post 用來收尾，格式化這類「一定要做」的事交給 hook，不要寫進 CLAUDE.md 期待模型記得。

### 選擇檢查表

- [ ] 沒做到會造成金錢、安全、合規後果？ → hook 或 permissions
- [ ] 要「阻止」某個動作？ → PreToolUse（或 permissions 的 `deny`）
- [ ] 要在動作之後「一定執行」某件事？ → PostToolUse
- [ ] 只是風格或慣例？ → CLAUDE.md
- [ ] 只適用某類檔案？ → `.claude/rules/` 加 `paths:`
- [ ] 偶爾才用的流程？ → Skill

---

## 自編類題

> [!question] 類題 03-1
> 某客服 agent 透過 MCP 工具 `process_refund` 處理退款。公司規定超過 500 元必須主管核准，但稽核發現有 3 筆超額退款沒有核准記錄。團隊的 CLAUDE.md 已經寫了這條規定。最有效的修正是？
> A. 把規定改成大寫並放在 CLAUDE.md 最上面
> B. 在 system prompt 加入三個違規範例
> C. 設定 PreToolUse hook，金額超過 500 時 exit 2 並回報原因
> D. 增加 `.claude/rules/refund.md`，寫明門檻
>
> > [!tip]- 解析
> > 答案 **C**。A、B、D 都只是把建議講得更清楚，仍由模型決定要不要遵守。C 由 Claude Code 在工具執行前檢查，違規呼叫根本不會送出。

> [!question] 類題 03-2
> 團隊希望每次 Claude 修改檔案後都自動跑 `eslint --fix`，之前寫在 CLAUDE.md 裡，但有些 session 會漏掉。應該怎麼做？
> A. 把指令寫成 PreToolUse hook
> B. 設定匹配 `Edit|Write` 的 PostToolUse hook 執行 eslint
> C. 在每次提示結尾提醒「記得跑 eslint」
> D. 把 eslint 設定檔用 `@` 引用進 CLAUDE.md
>
> > [!tip]- 解析
> > 答案 **B**。「改完之後一定做」是 PostToolUse 的用途。A 的時機錯了：檔案還沒改，修不到。C 和 D 仍是建議層。

> [!question] 類題 03-3
> 一個 monorepo 的 `src/api/` 底下有一套專用的錯誤處理慣例，只在改 API 檔案時才相關，但 CLAUDE.md 因為塞了這些慣例而超過 400 行，其他工作也被拖累。最合適的整理方式是？
> A. 刪掉這些慣例，靠模型自己看程式碼推斷
> B. 把慣例移到 `.claude/rules/api-errors.md`，frontmatter 設 `paths: ["src/api/**/*.ts"]`
> C. 用 `@docs/api-errors.md` 引用，內容維持在 CLAUDE.md 裡
> D. 改成 PostToolUse hook 檢查所有檔案
>
> > [!tip]- 解析
> > 答案 **B**。帶 `paths:` 的 rules 只在處理符合路徑的檔案時才載入，剛好符合「只在某類檔案才相關」。C 的 `@` 引用還是會把內容載進來，沒有省空間。D 是用強制層處理風格問題，用錯工具。

---

## 備考建議

- **先問後果再選層**：每看到一條規則，先問「沒做到會怎樣」。這個習慣能直接解掉大半個 Domain 3 的選擇題。
- **Pre 擋、Post 收尾**：這組對照和 exit code 表要背熟，題目常拿 PostToolUse 當錯誤選項。
- **分清「載入時機」**：CLAUDE.md、無 `paths` 的 rules 是啟動時載入；帶 `paths` 的 rules 和 Skills 是用到才載入。

---

## 速查表

| 要解決的事 | 放哪一層 | 保證力 |
|---|---|---|
| 退款、刪除、付款等業務規則 | PreToolUse hook／permissions | 強制 |
| 禁止讀寫某些檔案 | permissions `deny` | 強制 |
| 改完檔案一定要格式化、lint、測試 | PostToolUse hook | 強制（事後執行） |
| 全專案程式風格與慣例 | CLAUDE.md | 建議 |
| 只適用某類檔案的慣例 | `.claude/rules/` ＋ `paths:` | 建議 |
| 偶爾使用的流程 | Skill | 建議 |
| 想把內容單獨維護但常駐 | CLAUDE.md 用 `@` 引用 | 建議（不省 context） |

> [!tip] 一句話
> 「出事會痛」的規則交給程式執行，「做得更好」的規則交給模型參考。

---

## 延伸閱讀

- 上一篇：[[ccarf-02-multi-agent|02｜多 agent：拆解、交接與續接]]
- 下一篇：[[ccarf-04-explore-plan|04｜Claude Code（下）：探索、規劃與團隊設定]]
- 相關：[[ccarf-01-agentic-loop|01｜Agentic Loop]]（orchestration 層的保證，與 hooks 是同一個思路）

## Sources

- Claude Code 官方文件：Hooks、Memory（CLAUDE.md）、Settings（設定範圍與優先順序）、Sessions
- 說明：hooks 與 CLAUDE.md 細節以官方文件轉述；範例程式為示意，需對照所用版本
