---
title: "让 AI 编程助手的数据完全住在 D 盘：Claude Code、ZCode 与 OpenCode 迁移实战"
date: 2026-08-20
type: article
tags: ["AI", "Agent", "Windows", "符号链接"]
summary: "AI 编程助手的运行数据默认堆在 C 盘且持续膨胀。本文记录了如何用 Windows 符号链接将 Claude Code、ZCode 和 OpenCode 的数据目录无痛迁移到 D 盘，总结了三次迁移中踩过的坑和经验。"
draft: false
readTime: 10
---

> AI 编程助手越用越多，它们的运行数据（对话记录、配置、缓存）默认全堆在 C 盘，而且会随使用不断膨胀。本文记录了如何用 Windows 符号链接将 Claude Code、ZCode 和 OpenCode 三个工具的数据目录无痛迁移到 D 盘，实现"程序可以装在任何地方、数据统一住在 D 盘"的分离，并总结了实战中踩过的坑。

**提示**：本文中的所有命令和路径均基于作者个人的 Windows 环境实际操作记录，仅供参考。执行前请根据自己的实际情况调整路径和参数。符号链接操作涉及文件系统变更，建议操作前做好备份。希望这篇记录能帮助到有同样需求的朋友。

---

## 为什么要关注 Agent 的磁盘占用？

使用 AI 编程助手时，我们需要区分两类磁盘占用：

### 安装目录 vs 运行数据目录

| | 安装目录 | 运行数据目录 |
|------|---------|-------------|
| 类比 | 买了一本书 | 在书上做的笔记和贴的便签 |
| 内容 | 程序本体（.exe、库文件、内置工具） | 对话记录、配置、插件缓存、会话状态 |
| 大小变化 | 装完就固定，更新时才有变化 | **持续增长**，用得越多越大 |
| 位置可控性 | 安装时可以自选路径 | 通常硬编码在 `C:\Users\<用户名>\` 下，无法配置 |

以我使用的三个工具为例：

**Claude Code**（Anthropic 出品的 CLI 编程助手）：
- 安装目录：通过 npm 全局安装，几十 MB，基本不增长
- 运行数据：`C:\Users\用户名\.claude\`，144 MB 且在增长

**ZCode**（国产同类工具，Electron 架构）：
- 安装目录：`D:\Zcode\`，617 MB，安装时已自选 D 盘
- 运行数据：分散在 `.zcode` + 两个 AppData 目录，共 336 MB 且在增长

**OpenCode**（开源 AI 编程助手，CLI + 桌面版）：
- 安装目录：桌面版 493 MB（per-user 安装，不提供选路径）、CLI 通过 npm 安装 341 MB
- 运行数据：分散在 7 个目录，共约 1.6 GB

安装目录好说——装的时候选 D 盘就行（如果提供选项的话）。**真正麻烦的是运行数据目录**，它们默认锁死在 C 盘，你没有选择。

### 运行数据为什么会持续增长？

AI 编程助手不是"用完即走"的工具，它们需要记住大量上下文。以下是最主要的增长来源：

**对话记录（最大头）**

每次和 Agent 的完整对话都会被保存为一个 `.jsonl` 文件（或 SQLite 数据库），包含用户提问、AI 回复、工具调用的完整记录。以 Claude Code 为例：

```
projects/
├── D--ClaudeTest/           ← 项目 A 的所有会话
│   ├── abc123.jsonl         ← 一次对话，可能几 MB
│   ├── def456.jsonl         ← 又一次对话
│   └── ...                  ← 累积几十到几百个文件
├── D--MYCODE-xxx/           ← 项目 B 的所有会话
└── ...
```

OpenCode 更极端——所有项目的会话存在一个 SQLite 数据库里，352 MB 一个文件。

一天高强度使用下来，新增 10 MB 对话记录很正常。一个月 300 MB，一年 3.6 GB。这是最大的增长引擎。

**文件编辑快照**

Agent 帮你改代码时，会把改之前的文件版本存一份快照，用于回溯和对比。每次编辑递增一个版本号：

```
file-history/
└── <sessionId>/
    ├── abc123@v1            ← 第一次编辑前的版本
    ├── abc123@v2            ← 第二次编辑前的版本
    └── ...
```

日积月累也能到十几 MB。

**遥测数据堆积**

很多 Agent 会尝试上报使用统计（模型、耗时、平台信息），但如果用的是第三方代理而非官方 API，这些统计数据发不出去，就会一直堆积在本地。Claude Code 的 `telemetry/` 文件夹尤其严重——每天一个文件，永远发不出去。

**插件和技能缓存**

安装的插件、技能定义、市场源信息等，随使用逐渐积累。

**其他零散项**

Shell 环境快照、plan 模式计划文件、会话元数据、配置备份等——单项不大，加起来也有几 MB。

### 三个工具的磁盘分布全景

```
C:\Users\用户名\
│
│  ── Claude Code ──────────────────────────
├── .claude\                              144 MB
│   ├── projects/         120 MB  ★ 对话记录（增长主力）
│   ├── telemetry/         16 MB  遥测堆积
│   ├── file-history/      14 MB  文件快照
│   └── 其余              < 1 MB
│
│  ── ZCode ────────────────────────────────
├── .zcode\                                28 MB
│   ├── cli/plugins/       --    插件缓存
│   ├── cli/memories/      --    记忆文件
│   └── v2/                --    配置、凭证、数据库
├── AppData\Roaming\ZCode\                28 MB
└── AppData\Local\@zcodedesktop-updater\ 282 MB  ← 更新缓存
│
│  ── OpenCode ─────────────────────────────
├── .local\share\opencode\               585 MB  ← opencode.db (352MB)
├── .config\opencode\                     56 MB
├── .local\state\opencode\               20 KB
├── AppData\Local\Programs\@opencode-aidesktop\       493 MB  ← 程序本体
├── AppData\Roaming\ai.opencode.desktop\                45 MB
├── AppData\Local\@opencode-aidesktop-updater\         121 MB
└── AppData\Roaming\npm\node_modules\opencode-ai\     341 MB  ← npm 包
│
│  ── 总计 ─────────────────────────────────
└──  约 2.1 GB（三个工具的运行数据全在 C 盘）
```

注意 ZCode 的安装目录 `D:\Zcode\`（617 MB）和 OpenCode 桌面版程序（493 MB）——安装目录和运行数据是两回事。**运行数据才是迁移的重点。**

---

## 为什么不能直接改配置？

理想情况下，这些工具应该提供一个配置项让用户自定义数据目录。但现实是：

- **Claude Code**：没有 `CLAUDE_CONFIG_DIR` 之类的环境变量，数据目录硬编码为用户主目录下的 `.claude`
- **ZCode**：同理，`.zcode` 和 AppData 下的目录由程序和 Electron 框架决定，没有可配置项
- **OpenCode**：CLI 数据遵循 XDG 规范（`~/.local/share/opencode`），桌面版由 Electron 决定，都没有用户可配置项

直接改环境变量 `HOME`？会影响所有用 `~` 的程序，牵连太广。只移动部分子文件夹？拆开来链接容易漏，不如整体迁移。

---

## 解决方案：符号链接

Windows 提供了两种机制，可以让程序以为文件还在原位置，实际数据存在别处：

### Junction（目录联接）

```cmd
mklink /J "C:\Users\用户名\.claude" "D:\ClaudeData"
```

- Windows 2000 时代的 NTFS 特性
- **不需要管理员权限**，普通用户就能创建
- **只支持目录**，不能链接文件
- 对程序完全透明

### Symlink（符号链接）

```cmd
mklink /D "C:\Users\用户名\.zcode" "D:\ZcodeData\.zcode"
```

- Windows Vista 引入的通用符号链接
- **需要管理员权限**（或开启开发者模式）
- **同时支持目录和文件**，还能跨网络路径
- 对程序完全透明

两者对程序来说**完全透明**——程序读写 C 盘路径时，Windows 自动重定向到 D 盘，程序毫无感知。就像搬家后设了邮件转发，寄信人还是写旧地址，信照样到新家。

### 什么时候用哪个？

| 场景 | 推荐 | 原因 |
|------|------|------|
| 同机器跨盘迁移（最常见） | **Junction** | 免管理员权限，创建方便 |
| 需要链接文件（非目录） | Symlink | Junction 只支持目录 |
| 跨网络路径 | Symlink | Junction 不支持网络路径 |

实际使用中**完全一样**，程序感知不到任何区别。

---

## Claude Code 迁移（2026-07-10）

### 迁移范围

| C 盘原位置 | 数据大小 |
|-----------|---------|
| `C:\Users\用户名\.claude\` | 144 MB |

只涉及一个目录，最简单。

### 迁移前的准备

先评估值不值得做。数据只有 144 MB，搬走并不能让 C 盘明显变空。**真正的价值在于转移未来的增长**——每月 300 MB 的增长从 C 盘挪到 D 盘，C 盘压力骤减。

决定动手后，制定了方案：备份 → 移动 → 删源 → 建链接 → 验证。

### 具体操作

**第一步：关闭所有 Claude Code**

这一步必须手动完成。包括 VSCode 里的 Claude 插件窗口、所有终端里运行的 `claude`、以及任务管理器里的残留进程。文件被占用的话，移动会失败。

**第二步：备份（保险起见）**

```cmd
robocopy "C:\Users\用户名\.claude" "D:\ClaudeData_backup" /E /COPY:DAT /R:1 /W:1
```

> `/R:1 /W:1` 很重要——robocopy 默认重试 100 万次，遇到锁文件会卡死。加了这个参数才会"重试 1 次、等 1 秒就放弃"。

**第三步：移动数据**

```cmd
robocopy "C:\Users\用户名\.claude" "D:\ClaudeData" /E /MOVE /COPY:DAT /R:1 /W:1
```

`/MOVE` 会复制后自动删除源文件。完成后 C 盘的 `.claude` 变成一个空文件夹。

**第四步：删除空的源文件夹**

```cmd
rmdir "C:\Users\用户名\.claude"
```

`mklink` 要求目标路径不存在，所以必须先删掉。

**第五步：创建 Junction**

```cmd
mklink /J "C:\Users\用户名\.claude" "D:\ClaudeData"
```

成功提示：`为 C:\Users\用户名\.claude <<===>> 为 D:\ClaudeData 创建的联接`

**第六步：验证**

启动 Claude Code，检查：
- ✅ `/resume` 能看到历史会话
- ✅ `/model` 能切换模型（CC Switch 正常）
- ✅ 发新消息能正常回复

全部通过，迁移成功。

### 踩坑记录

写了一键脚本 `migrate_claude.bat`，第一版含中文注释。在中文 Windows（GBK 编码）下，cmd 读取 bat 文件时中文变成乱码，命令被错误拆分，脚本在进程检测阶段就崩了。好在**未造成任何破坏**——源文件原封不动，只是脚本白跑了。

修复方法：把脚本改成**纯 ASCII 英文**，中文提示用拼音或简单英文替代。

另一个坑：在 Git Bash 里调用 `robocopy`，`/R:1` 等斜杠参数会被 MSYS（Git Bash 的底层）当成 Unix 路径做自动转换，导致"无效参数"错误。解决方法：加 `MSYS_NO_PATHCONV=1` 环境变量，或者直接在原生 CMD 里运行 bat 文件（不受影响）。

---

## ZCode 迁移（2026-08-20）

### 迁移范围

| C 盘原位置 | 数据大小 |
|-----------|---------|
| `C:\Users\用户名\.zcode\` | 28 MB |
| `C:\Users\用户名\AppData\Roaming\ZCode\` | 28 MB |
| `C:\Users\用户名\AppData\Local\@zcodedesktop-updater\` | 282 MB |

三个目录，其中更新器缓存 282 MB 是最大的一块（里面存了两份 140 MB 的安装包）。

### 和 Claude Code 迁移的差异

1. **三个目录 vs 一个目录**：需要分别处理
2. **用了 Symlink 而非 Junction**：脚本里用了 `/D` 参数，需要管理员权限。实际上用 `/J` 也行
3. **没有预先做备份**：直接复制到 D 盘、验证完整性、再删原目录建链接
4. **更新器缓存是意外收获**：`@zcodedesktop-updater` 有 282 MB，比程序数据本身大 5 倍

### 具体操作

整体流程和 Claude Code 一样：复制 → 验证 → 删除原目录 → 创建符号链接。

```cmd
:: 复制三个目录到 D:\ZcodeData
robocopy "C:\Users\用户名\.zcode" "D:\ZcodeData\.zcode" /E /COPY:DAT /R:1 /W:1
robocopy "C:\Users\用户名\AppData\Roaming\ZCode" "D:\ZcodeData\AppData-Roaming-ZCode" /E /COPY:DAT /R:1 /W:1
robocopy "C:\Users\用户名\AppData\Local\@zcodedesktop-updater" "D:\ZcodeData\Updater-Cache" /E /COPY:DAT /R:1 /W:1

:: 删除原目录 + 创建符号链接
rmdir /s /q "C:\Users\用户名\.zcode"
rmdir /s /q "C:\Users\用户名\AppData\Roaming\ZCode"
rmdir /s /q "C:\Users\用户名\AppData\Local\@zcodedesktop-updater"

mklink /D "C:\Users\用户名\.zcode" "D:\ZcodeData\.zcode"
mklink /D "C:\Users\用户名\AppData\Roaming\ZCode" "D:\ZcodeData\AppData-Roaming-ZCode"
mklink /D "C:\Users\用户名\AppData\Local\@zcodedesktop-updater" "D:\ZcodeData\Updater-Cache"
```

### 踩坑记录

在 Git Bash 里执行 `robocopy` 时，`/COPYALL` 参数中的 `/C` 被截断，报错"'OPYALL' 不是内部或外部命令"。原因和 Claude Code 迁移时一样——MSYS 的路径转换干扰。最终写成 `.bat` 脚本在 CMD 里执行解决。

另一个发现：`/COPYALL` 需要管理员权限（因为它尝试复制审核信息 SACL），改用 `/COPY:DAT` 就够了（复制数据、属性、时间戳），不需要管理员。

### 补充：ZCode 自带的"数据存储路径"设置

ZCode 设置里有一个"数据存储路径"选项，默认值是 `C:\Users\用户名`，修改后会把 `.zcode\v2\` 下的数据复制到新位置。但这个设置**只管 `.zcode` 这一个目录**，AppData 下的两个目录（310 MB）不受它控制，仍然需要符号链接。而且它会"将现有数据复制到新位置"——如果复制过程中 ZCode 正在运行，可能出现数据不一致。

所以如果你是刚装好 ZCode，可以改这个设置把 `.zcode` 搬到 D 盘，但 AppData 的两个目录还是得靠符号链接。我们的方案是三个目录统一用符号链接，一步到位，更可控。

---

## OpenCode 迁移（2026-08-20）

### 迁移范围

OpenCode 是三个工具中最复杂的——涉及 **7 个目录**，总计约 **1.6 GB**：

| # | C 盘原位置 | 数据大小 | 来源 |
|---|-----------|---------|------|
| 1 | `AppData\Local\Programs\@opencode-aidesktop\` | 493 MB | 桌面版程序本体 |
| 2 | `.local\share\opencode\` | 585 MB | CLI 数据（含 352 MB 的 opencode.db） |
| 3 | `AppData\Roaming\npm\node_modules\opencode-ai\` | 341 MB | CLI npm 全局包 |
| 4 | `AppData\Local\@opencode-aidesktop-updater\` | 121 MB | 更新器缓存 |
| 5 | `.config\opencode\` | 56 MB | CLI 配置 |
| 6 | `AppData\Roaming\ai.opencode.desktop\` | 45 MB | 桌面版数据 |
| 7 | `.local\state\opencode\` | 20 KB | CLI 状态 |

### 为什么 OpenCode 最复杂？

OpenCode 同时有 CLI 和桌面版两个形态，数据分散在 XDG 风格路径（`.local/share`、`.config`、`.local/state`）和 Windows 传统路径（`AppData\Local`、`AppData\Roaming`）两类位置。其中 CLI 的数据量（585 MB）远大于桌面版数据（45 MB），因为所有项目的会话都存在一个 SQLite 数据库文件里（352 MB）。

### 具体操作

同样用符号链接法，7 个目录一次性处理：

```cmd
:: 复制
robocopy "C:\Users\用户名\AppData\Local\Programs\@opencode-aidesktop" "D:\OpenCode\Programs" /E /COPY:DAT /R:1 /W:1
robocopy "C:\Users\用户名\AppData\Roaming\ai.opencode.desktop" "D:\OpenCode\Data" /E /COPY:DAT /R:1 /W:1
robocopy "C:\Users\用户名\AppData\Local\@opencode-aidesktop-updater" "D:\OpenCode\Updater" /E /COPY:DAT /R:1 /W:1
robocopy "C:\Users\用户名\.local\share\opencode" "D:\OpenCode\CLI-Data" /E /COPY:DAT /R:1 /W:1
robocopy "C:\Users\用户名\.config\opencode" "D:\OpenCode\CLI-Config" /E /COPY:DAT /R:1 /W:1
robocopy "C:\Users\用户名\.local\state\opencode" "D:\OpenCode\CLI-State" /E /COPY:DAT /R:1 /W:1
robocopy "C:\Users\用户名\AppData\Roaming\npm\node_modules\opencode-ai" "D:\OpenCode\CLI-Package" /E /COPY:DAT /R:1 /W:1

:: 删除原目录
rmdir /s /q "C:\Users\用户名\AppData\Local\Programs\@opencode-aidesktop"
rmdir /s /q "C:\Users\用户名\AppData\Roaming\ai.opencode.desktop"
rmdir /s /q "C:\Users\用户名\AppData\Local\@opencode-aidesktop-updater"
rmdir /s /q "C:\Users\用户名\.local\share\opencode"
rmdir /s /q "C:\Users\用户名\.config\opencode"
rmdir /s /q "C:\Users\用户名\.local\state\opencode"
rmdir /s /q "C:\Users\用户名\AppData\Roaming\npm\node_modules\opencode-ai"

:: 创建符号链接（AppData 用 Junction 免管理员，XDG 路径用 Symlink）
mklink /J "C:\Users\用户名\AppData\Local\Programs\@opencode-aidesktop" "D:\OpenCode\Programs"
mklink /J "C:\Users\用户名\AppData\Roaming\ai.opencode.desktop" "D:\OpenCode\Data"
mklink /J "C:\Users\用户名\AppData\Local\@opencode-aidesktop-updater" "D:\OpenCode\Updater"
mklink /D "C:\Users\用户名\.local\share\opencode" "D:\OpenCode\CLI-Data"
mklink /D "C:\Users\用户名\.config\opencode" "D:\OpenCode\CLI-Config"
mklink /D "C:\Users\用户名\.local\state\opencode" "D:\OpenCode\CLI-State"
mklink /D "C:\Users\用户名\AppData\Roaming\npm\node_modules\opencode-ai" "D:\OpenCode\CLI-Package"
```

### npm shim 路径问题

OpenCode CLI 通过 npm 安装，`C:\Users\用户名\AppData\Roaming\npm\opencode` 是一个 shell 脚本，内部引用 `node_modules\opencode-ai\bin\opencode.exe`。我们迁移的是 `node_modules\opencode-ai\` 整个目录并用符号链接替代，所以 shim 脚本**不需要修改**，路径解析自动正确。

---

## 三个迁移的对比总结

| 对比项 | Claude Code | ZCode | OpenCode |
|--------|------------|-------|----------|
| 迁移日期 | 2026-07-10 | 2026-08-20 | 2026-08-20 |
| 目录数量 | 1 个 | 3 个 | 7 个 |
| 数据大小 | 144 MB | 336 MB | 1.6 GB |
| 链接类型 | Junction | Symlink | Junction + Symlink 混合 |
| 目标路径 | `D:\ClaudeData` | `D:\ZcodeData` | `D:\OpenCode` |
| 踩坑 | 中文 bat 乱码 | Git Bash 路径转换 | 无（借鉴了前两次经验） |

三次迁移的**核心原理完全相同**：数据搬到 D 盘，C 盘留指针，程序无感知。

---

## 迁移结果总览

```
C 盘用户目录（全部为符号链接，0 字节实际占用）：
  .claude         → <JUNCTION>  → D:\ClaudeData
  .zcode          → <SYMLINKD>  → D:\ZcodeData\.zcode

C 盘 AppData（全部为符号链接）：
  Roaming\ZCode                    → <SYMLINKD>  → D:\ZcodeData\AppData-Roaming-ZCode
  Local\@zcodedesktop-updater      → <SYMLINKD>  → D:\ZcodeData\Updater-Cache
  Local\Programs\@opencode-aidesktop   → <JUNCTION>  → D:\OpenCode\Programs
  Roaming\ai.opencode.desktop          → <JUNCTION>  → D:\OpenCode\Data
  Local\@opencode-aidesktop-updater    → <JUNCTION>  → D:\OpenCode\Updater
  Roaming\npm\node_modules\opencode-ai → <SYMLINKD>  → D:\OpenCode\CLI-Package

C 盘 .local/.config（全部为符号链接）：
  .local\share\opencode   → <SYMLINKD>  → D:\OpenCode\CLI-Data
  .config\opencode         → <SYMLINKD>  → D:\OpenCode\CLI-Config
  .local\state\opencode    → <SYMLINKD>  → D:\OpenCode\CLI-State

D 盘数据：
  D:\ClaudeData\      143 MB   ← Claude Code
  D:\ZcodeData\       353 MB   ← ZCode
  D:\OpenCode\        1.8 GB   ← OpenCode
  D:\Zcode\           617 MB   ← ZCode 安装目录（未动）
```

**C 盘总共释放约 2.1 GB，三个工具运行完全正常，没有任何功能损失。**

---

## 经验总结

### 1. 符号链接是迁移数据目录的最安全方案

相比改环境变量、修改程序源码、重新安装等方案，符号链接的优势在于：
- **对程序完全透明**，不需要程序本身支持
- **可逆**，删掉链接把数据复制回来就恢复原状
- **零风险**，不会影响其他程序

### 2. Junction 优于 Symlink（同机器跨盘场景）

两者效果完全一样，但 Junction 不需要管理员权限，创建更方便。只有在需要跨网络或链接文件时才必须用 Symlink。

OpenCode 迁移中，AppData 下的三个目录用了 Junction（免管理员），XDG 风格路径用了 Symlink（因为 Git Bash 环境下创建 Junction 有兼容性问题）。混合使用完全没问题。

### 3. robocopy 的 `/R:1 /W:1` 必加

默认重试 100 万次，遇到被占用的文件会卡死。加了这两个参数才是人能用的工具。

### 4. Git Bash 和 Windows 命令行工具有兼容性坑

MSYS 会自动把 `/` 开头的参数当路径转换。解决方法：用原生 CMD 执行 `.bat` 文件，或者加 `MSYS_NO_PATHCONV=1`。

### 5. 迁移的价值不在"省空间"，在"转移增长"

2 GB 对几十 GB 的 C 盘来说不算多。但每月几百 MB 的增长从 C 盘挪到 D 盘，焦虑感完全不同。这是一次设置、长期受益的事。

### 6. 更新缓存往往是隐藏的空间大户

ZCode 的 `@zcodedesktop-updater` 有 282 MB，OpenCode 的有 121 MB。里面存了安装包副本，定期检查和清理值得做。

### 7. 写成 `.bat` 在 CMD 里执行是最稳妥的方式

三次迁移下来，最可靠的执行方式就是写一个纯 ASCII 的 `.bat` 文件，在原生 CMD 里运行。Git Bash 调用 Windows 工具时的各种兼容性问题，通过 `.bat` + CMD 全部规避。

---

## 适用场景

这个方案不仅适用于这三个 AI 编程工具，任何把数据目录硬编码在用户主目录下的程序都可以用同样的方法迁移，比如：

- `.npm` / `.pnpm-store`（Node.js 包缓存）
- `.gradle` / `.m2`（Java 构建缓存）
- `.docker`（Docker 镜像和容器数据）
- `.vscode` 下的 `extensions`（VSCode 扩展）

核心思路永远一样：**数据搬到 D 盘，C 盘留指针，程序无感知。**
