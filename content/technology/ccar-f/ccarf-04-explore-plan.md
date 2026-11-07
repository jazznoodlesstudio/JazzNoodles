---
title: 編曲者筆記 04｜Claude Code（下）：探索、規劃與團隊設定
description: 探索程式碼用 Grep、Glob、Read 的順序、plan mode 與直接執行怎麼選、自訂 slash command 放哪個目錄，以及 MCP 與 settings 的 project／user 範圍。
date: 2026-11-07
tags:
  - ccar-f
  - claude
  - 系列/ccar-f備考
  - claude-code
  - mcp
series: 編曲者筆記：CCAR-F 備考心得
order: 4
draft: false
---

![[ccarf-cover.jpg]]

> [!abstract] 對應官方考試目標
> #13 用 Grep、Glob、Read 探索程式碼｜#9 plan mode 與直接執行的取捨｜#7 把自訂 slash command 放在正確的目錄｜#14 MCP 與 settings 的範圍：project 或 user（編號見系列規劃）

## 情境

某團隊要把內部 `auth` 模組從 session 改成 token。開發者直接要求 Claude Code「改好它」，agent 先把 40 個檔案整個讀進來，改到一半才發現還有三個服務也依賴舊介面，已改的部分得全部回退。另一位同事為了讓全組都能用 Jira 的 MCP server，把設定加在自己的個人設定裡，結果其他人的 Claude Code 完全看不到。

兩個問題一個出在**動手前沒有先探索與規劃**，一個出在**設定放錯範圍**。

---

## 考點 1：探索程式碼的順序（目標 #13）

### 用樂團來想：先翻目錄，再翻到那一頁

拿到一本厚厚的樂譜，沒有人會從第一頁讀到最後一頁。先看目錄找到段落，再翻到那一頁。

### 正式一點：三個工具，各管一件事

| 工具 | 用來做什麼 | 典型用法 |
|---|---|---|
| **Grep** | 搜尋**檔案內容**（字串、正規表示式） | 找某個函式的所有呼叫處、某個錯誤訊息出現在哪 |
| **Glob** | 依**檔名模式**找檔案 | 找所有 `**/*.test.ts`、某個資料夾下的設定檔 |
| **Read** | 讀**一個檔案**的內容 | 已經鎖定目標之後，讀懂它 |

順序通常是：**先 Grep／Glob 縮小範圍，再 Read 讀必要的檔案**。反過來整批 Read，會把大量不相關的內容灌進 context。

追蹤一個函式的影響範圍，做法是先用 Grep 找所有 import 或呼叫它的地方，再依結果決定要 Read 哪幾個檔案，而不是猜測。

> [!failure] 陷阱 1：一上來就整個資料夾 Read
> 把 40 個檔案都讀進來，context 被佔滿，後面推理品質下降。正確做法是 Grep 找到相關檔案，只 Read 那幾個。

> [!failure] 陷阱 2：用 Glob 找內容
> Glob 只看檔名，不會看檔案裡有什麼。要找「哪些檔案用到 `legacyAuth`」，要用 Grep。

量大的探索可以交給 subagent（見 [[ccarf-02-multi-agent|02]]）：雜訊留在它的 context 裡，主 agent 只收摘要。

---

## 考點 2：plan mode 與直接執行（目標 #9）

plan mode 是**唯讀的規劃階段**：Claude 分析程式碼、提問、提出計畫，在你核准之前不會修改檔案。進入方式：`Shift+Tab` 循環切換權限模式，或在提示中使用 `/plan`，也可以用 `--permission-mode plan` 啟動。

| 情況 | 建議 |
|---|---|
| 大範圍變更（多個檔案、架構調整、遷移） | **plan mode**：先探索、再核准計畫 |
| 有多種可行做法，需要先比較 | plan mode |
| 不熟悉的程式碼庫 | plan mode，先摸清楚再動手 |
| 範圍明確的小修改（改一個 typo、加一個 log、單一函式 bug） | **直接執行** |
| 失敗代價高（資料庫遷移、對外 API） | plan mode，加上人工審核 |

判斷標準：==這件事動手之後，回頭的代價有多大？== 範圍越大、越難回頭，越該先規劃。

> [!failure] 陷阱 3：小修改也開 plan mode
> 一行 typo 也要先寫計畫、等核准，只是浪費時間。plan mode 的價值在於避免大範圍、難回頭的錯誤。

> [!failure] 陷阱 4：大遷移直接動手
> 情境中的 auth 遷移就是例子。先在 plan mode 用 Grep 找出所有依賴，列出受影響的服務，再核准計畫，才不會改一半才發現範圍。

---

## 考點 3：自訂 slash command 放哪裡（目標 #7）

自訂 slash command 是你自己定義的 `/xxx` 快捷指令，內容是一份 markdown 提示。放置位置決定**誰能用**：

| 位置 | 範圍 | 進版控 |
|---|---|---|
| `.claude/commands/<name>.md`（專案內） | 這個專案的所有成員 | 是，隨 repo 共用 |
| `~/.claude/commands/<name>.md`（使用者目錄） | 只有你，所有專案 | 否 |

另外，目前官方把自訂指令與 Skills 整併：`.claude/skills/<name>/SKILL.md` 也會產生同名的 `/name` 指令，舊的 `.claude/commands/` 檔案仍然有效。考試若問「讓全組都能用的指令放哪」，答案是**專案目錄**（進版控）；「只給自己用」放**使用者目錄**。

> [!note] 命名與版本
> 這部分近期有調整，細節（例如 skill 與 command 同名時的優先順序）請以你使用版本的官方文件為準。考試要記的是**範圍邏輯**：專案內＝共用，使用者目錄＝個人。

---

## 考點 4：MCP 與 settings 的範圍（目標 #14）

### MCP server 的三個範圍

| 範圍 | 指令旗標 | 載入範圍 | 與團隊共用 | 儲存位置 |
|---|---|---|---|---|
| **local**（預設） | `--scope local` | 只有目前專案 | 否 | `~/.claude.json`（記在該專案路徑下） |
| **project** | `--scope project` | 目前專案 | **是，進版控** | 專案根目錄 `.mcp.json` |
| **user** | `--scope user` | 你的所有專案 | 否 | `~/.claude.json`（最上層） |

同名 server 出現在多個範圍時，用**最高優先權的整份定義**，優先順序是 local ＞ project ＞ user。欄位**不會**跨範圍合併。

![[ccarf-04-scopes.svg]]

回到情境：全組都要用 Jira MCP，就該加在 **project 範圍**（`.mcp.json`，進版控），而不是 local 或 user。

### 密碼不要直接寫進 `.mcp.json`

`.mcp.json` 要進版控，所以 token 不能明文寫在裡面。它支援**環境變數展開**，可用在 `command`、`args`、`env`、`url`、`headers`：

```json
{
  "mcpServers": {
    "jira": {
      "type": "http",
      "url": "${JIRA_BASE_URL:-https://example.atlassian.net}/mcp",
      "headers": { "Authorization": "Bearer ${JIRA_TOKEN}" }
    }
  }
}
```

`${VAR}` 取變數值，`${VAR:-預設值}` 在變數未設定時用預設值。每個人在自己的環境設好 `JIRA_TOKEN` 就能共用同一份設定檔。

### settings 的範圍

settings 也有類似分層（細節見 [[ccarf-03-config-layers|03]]）：`~/.claude/settings.json` 是個人，`.claude/settings.json` 是專案共用，`.claude/settings.local.json` 是專案內的個人覆寫（不進版控）。

> [!failure] 陷阱 5：把團隊要用的 server 設成 local 或 user
> 只有自己看得到。團隊共用的放 project 範圍，個人試用的放 local，跨專案的個人工具放 user。

> [!failure] 陷阱 6：把 API token 直接寫進 `.mcp.json`
> 該檔案進版控，等於把密碼推上 repo。用 `${VAR}` 引用環境變數。

---

## 自編類題

> [!question] 類題 04-1
> 要找出整個 monorepo 裡所有呼叫 `legacyAuth.verify()` 的地方，以評估遷移範圍。最有效率的第一步是？
> A. 把 `src/` 底下所有檔案用 Read 讀進來
> B. 用 Glob 搜尋 `**/*legacyAuth*`
> C. 用 Grep 搜尋 `legacyAuth.verify`，再 Read 命中的檔案
> D. 直接開始修改，遇到錯誤再處理
>
> > [!tip]- 解析
> > 答案 **C**。要找的是檔案**內容**中的呼叫，用 Grep；縮小範圍後才 Read。B 的 Glob 只比對檔名，找不到呼叫處。

> [!question] 類題 04-2
> 開發者要把付款服務從 REST 改成事件驅動，涉及十幾個服務與兩套資料庫遷移。下列哪個做法最合適？
> A. 直接執行，邊做邊調整
> B. 先進入 plan mode 探索依賴並提出計畫，核准後再執行
> C. 開 plan mode，但只讓它改一個檔案試試
> D. 請 Claude 一次改完，再靠測試把關
>
> > [!tip]- 解析
> > 答案 **B**。範圍大、回頭代價高，先規劃。D 把風險全推給事後測試；A 的代價就是情境中的「改到一半才發現範圍」。

> [!question] 類題 04-3
> 團隊要讓所有人共用同一個 Sentry MCP server，每個人用各自的 token。下列哪個設定最合適？
> A. 每人各自執行 `claude mcp add`，用預設範圍
> B. 在專案 `.mcp.json` 設定，token 用 `${SENTRY_TOKEN}` 引用環境變數
> C. 在專案 `.mcp.json` 直接寫入 token，大家共用
> D. 設定在 `--scope user`，請同事複製
>
> > [!tip]- 解析
> > 答案 **B**。project 範圍進版控共用，環境變數展開讓每人使用自己的 token。A、D 無法共用；C 洩漏密碼。

---

## 備考建議

- **探索題看工具對象**：找內容用 Grep、找檔名用 Glob、讀已知檔案用 Read。
- **plan mode 題看「回頭代價」**：大、模糊、難回頭 → plan；小、明確 → 直接做。
- **範圍題先問「誰要用」**：全組共用 → project；只有自己 → local 或 user。
- 動手做一次：在測試專案加一個 `.mcp.json` 並用 `${VAR}`，比背表格有效。

---

## 速查表

| 要做的事 | 用什麼 | 常見錯誤 |
|---|---|---|
| 找哪裡用到某函式 | Grep | 用 Glob 或整批 Read |
| 找符合檔名的檔案 | Glob | 用 Grep 找檔名 |
| 大範圍、難回頭的變更 | plan mode | 直接動手 |
| 小而明確的修改 | 直接執行 | 一律開 plan mode |
| 全組共用的指令 | `.claude/commands/`（專案） | 放在使用者目錄 |
| 全組共用的 MCP server | project 範圍 `.mcp.json` | local／user 範圍 |
| MCP 設定中的密碼 | `${VAR}` 環境變數展開 | 明文寫入 |

> [!tip] 一句話
> 先翻目錄再翻頁，越難回頭的事越要先寫計畫，要共用的東西放進版控。

---

## 延伸閱讀

- 上一篇：[[ccarf-03-config-layers|03｜Claude Code（上）：規則放在哪一層]]
- 下一篇：[[ccarf-05-structured-output|05｜結構化輸出：把即興變成可交付]]

## Sources

- Claude Code 官方文件：Settings、Sessions、Create custom subagents
- MCP 範圍與 `.mcp.json` 環境變數展開：依官方文件行為，經第三方整理核對（範圍表、優先順序、`${VAR:-default}`）
- slash command 與 skills 的整併，以官方文件為準
