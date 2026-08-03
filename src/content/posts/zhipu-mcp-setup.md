---
title: "「MCP：AI 的 USB-C」——智谱四件套配置实录"
date: 2026-08-03
type: article
tags: ["MCP", "智谱", "Claude Code", "GLM"]
summary: "智谱为 GLM Coding Plan 用户做了四个专属 MCP——视觉理解、联网搜索、网页读取、开源仓库。记录配置方法与实测体验，并讲清如何用 CCswitch 让一套配置在 Claude Code / Codex / OpenCode 多端通用，以及 bigmodel 与 z.ai 两套 key 的区别。"
draft: false
readTime: 3
---

> 整理日期：2026-07-08 ｜ 定稿日期：2026-08-03

## 智谱的四个专属 MCP

[Model Context Protocol（MCP）](https://modelcontextprotocol.io) 让大模型能"长手"——挂上各种工具，模型自己决定何时调用。Anthropic 推、各家跟，如今主流 Coding 客户端基本都支持。

智谱（GLM 背后那家）给 **GLM Coding Plan** 用户做了一套**专属 MCP**，正好四个，补的全是 Coding 客户端常见的短板：

- **视觉理解** —— 看图、看视频、OCR、UI 转代码
- **联网搜索** —— 实时搜网络
- **网页读取** —— 把网页抓成干净的 markdown
- **开源仓库** —— 结构化地理解 GitHub 仓库

我把它配齐、实测了一遍，顺手记下来。

## 先说为什么：MCP 到底解决了什么

先把"为什么"讲清楚，再聊智谱这四个具体的。

**没有 MCP 之前**：想让 AI 用上外部能力——联网搜、读文件、查数据库、调 API——得给"每个模型 × 每个工具"单独写一套对接。模型一多、工具一多，就是 N×M 的集成地狱，而且写死、锁死，换一个就得重来。

**MCP（Model Context Protocol）** 是 Anthropic 提的开放标准，可以理解成 **"AI 界的 USB-C"**：

- 一个工具按 MCP 协议封装成 **server**，**写一次**；
- 任何支持 MCP 的客户端（Claude Code、Cursor、Codex、OpenCode、Cline…）**插上就能用**，不必各写各的。

它主要解决三件事：

1. **碎片化** —— 统一接口，把 N×M 的对接压成 N+M。
2. **工具复用** —— 同一个 MCP server，换个客户端照样能用（这也是后文"一份配置多端通用"的前提）。
3. **解耦** —— 工具方和模型/客户端方各管各的，谁也不绑死谁。

智谱这四个专属 MCP 就是按这个标准做的——所以才能一份配置在 Claude Code / Codex / OpenCode 里通用。

顺带澄清个常见误解：MCP **不绑定任何模型厂商**——不绑 Claude、也不绑 GLM。它只认两样东西：① 客户端支不支持 MCP；② 智谱这四个 MCP 调的是智谱服务，认的是**智谱 key**。所以你在跑 GPT 的 Codex、跑 Claude 的 Cursor 里，照样能用这套 MCP——**模型是谁，无所谓**。

> 前置：你需要一个 **GLM Coding Plan 的 API Key**（Pro / Max 档才含这四个专属 MCP，Lite 不含）。下文命令里的 `your_api_key` 换成你自己的。

## 四个 MCP，分别是干嘛的

### 1. 视觉理解（zai-mcp-server）—— 唯一"本地"的那个

四个里只有它是**本地运行**（npx 拉起一个 stdio 服务），后端接 **GLM-4.6V**，其余三个都是远程 HTTP。它一口气给了 8 个工具：

- `extract_text_from_screenshot` —— OCR，从截图抠代码 / 终端输出 / 文档文字
- `ui_to_artifact` —— UI 截图直接转前端代码 / 设计规范
- `diagnose_error_screenshot` —— 报错截图喂进去，给根因和修复建议
- `understand_technical_diagram` —— 读架构图、流程图、UML
- `analyze_data_visualization` —— 读仪表盘 / 图表，提炼趋势和异常
- `ui_diff_check` —— 两张 UI 截图比对，做视觉回归
- `analyze_image` —— 通用读图（兜底）
- `analyze_video` —— 视频内容分析（MP4/MOV/M4V，本地 ≤8MB）

实测：丢一张订阅价格卡截图让它 OCR，文字和排版基本原样抠出来了。报错诊断也挺实用——以后终端一片红，截个图问问就行。

### 2. 联网搜索（web-search-prime）—— 补中文搜索的坑

Claude Code 内置搜索是 US-only，中文内容覆盖很弱。这个 MCP 接的是智谱的搜索，**中文场景明显更强**。

实测搜「智谱 GLM-4.6」，知乎、百科、开源中国、官方文档全回来了，摘要也干净。支持时效过滤（最近一天/一周/一月）、区域（cn / us）、域名白名单。

### 3. 网页读取（web-reader）—— 给模型"喂"网页

丢一个 URL，它把页面（**包括 JS 渲染的 SPA**）抓成干净 markdown 喂给模型，比裸抓 HTML 强不少。

实测抓 Mintlify 文档站、GitHub 仓库页，都能拿到渲染后的正文。唯一小毛病：返回里会夹一堆 favicon / CSS 元数据噪音，但正文 `content` 字段本身是干净的。

### 4. 开源仓库（zread）—— 这个我最惊喜

基于 zread.ai，能**结构化地理解一个 GitHub 仓库**：

- `get_repo_structure` —— 拉仓库目录树
- `read_file` —— 读仓库里任意文件的完整代码
- `search_doc` —— 语义搜索仓库的文档 / issues / commits

实测对着 `vitejs/vite` 一键拉出完整目录树（packages / playground / scripts…），想看哪个文件直接 `read_file`。比起网页读取只能看个 README，这是**结构化访问**，查源码、摸清项目结构都顺手多了。

## 怎么配：四条命令搞定

以 Claude Code 为例（国内 bigmodel 平台）：

```bash
# 1. 视觉理解（本地 npx）
claude mcp add -s user zai-mcp-server \
  --env Z_AI_API_KEY=your_api_key \
  -- npx -y "@z_ai/mcp-server"

# 2. 联网搜索（远程 http）
claude mcp add -s user -t http web-search-prime \
  https://open.bigmodel.cn/api/mcp/web_search_prime/mcp \
  --header "Authorization: Bearer your_api_key"

# 3. 网页读取（远程 http)
claude mcp add -s user -t http web-reader \
  https://open.bigmodel.cn/api/mcp/web_reader/mcp \
  --header "Authorization: Bearer your_api_key"

# 4. 开源仓库（远程 http）
claude mcp add -s user -t http zread \
  https://open.bigmodel.cn/api/mcp/zread/mcp \
  --header "Authorization: Bearer your_api_key"
```

配完 `claude mcp list` 看一眼，四个都 `✓ Connected` 就成了。

> 几个坑：
> - MCP 只在**会话启动时加载**，配完**重启**客户端才生效。
> - 第一个（视觉理解）首次跑 npx 要下包，健康检查可能超时报 `Failed to connect`，下完缓存再 `list` 就正常。
> - Windows 下若报 `-y` 参数问题，用 CMD 跑；出现 `cmd /c wrapper` 告警忽略即可。

## 进阶：一份配置，多端通用（CCswitch）

我同时用 Claude Code、Codex、OpenCode，难道每个客户端都配一遍？

不用。[CCswitch](https://ccswitch.io) 有个「MCP 面板」，**一次定义，自动写进各客户端的原生配置**。因为 MCP 是标准协议——这套四个 MCP 在任何支持 MCP 的客户端都能用，CCswitch 只是帮你把同一份配置翻译成各家格式（Claude 的 JSON、Codex 的 `config.toml`、OpenCode 的配置…）。

填法很直接：远程三个选 `http` 类型填 URL + `Authorization` 头；本地那个选 `stdio`，命令 `npx`、参数 `-y @z_ai/mcp-server`、环境变量加 `Z_AI_API_KEY`。

> 注意：CCswitch 会把 key 写进每个客户端的配置文件，副本变多——**别把这些配置提交到公开仓库**。

## bigmodel vs z.ai：两套 key 别搞混

智谱其实有**两套平台**：

| | 智谱开放平台 | Z.AI（国际站） |
|---|---|---|
| 域名 | bigmodel.cn | z.ai |
| MCP 端点 | `open.bigmodel.cn` | `api.z.ai` |
| 视觉 MCP 模式 | `Z_AI_MODE=ZHIPU`（默认） | `Z_AI_MODE=ZAI` |

两套的 **key 不通用**。如果你用的是 z.ai 的 key，相比上文只改两处：

1. 三个远程 MCP 的 URL：`open.bigmodel.cn` → `api.z.ai`
2. 视觉 MCP 多加一个环境变量 `Z_AI_MODE=ZAI`

套餐结构两边一致（Lite / Pro / Max），都是 Pro、Max 才含这四个专属 MCP。

## 换成 DeepSeek / MiMo 当主模型，还能用这套 MCP 吗？

能。回到前面那条原理——**MCP 不绑定模型**，模型和 MCP 是两层独立的东西：

- **主模型**用 DeepSeek / MiMo 自己的 key（走它们的 OpenAI 兼容 API）
- **四个 MCP** 照旧填智谱 key，一个不用改

在 Cursor / Cline / OpenCode / Codex 里，主模型填 DeepSeek / MiMo、MCP 挂智谱那套，直接跑。

**Claude Code 要注意**：它只认 anthropic 兼容接口，而 DeepSeek / MiMo 是 OpenAI 兼容，直连不上——得加个代理（如 claude-code-router）转一下。但这只影响主模型，**MCP 那条通道不受影响**。

> 前提：模型要有 **tool-use** 能力才会主动调工具。DeepSeek 有；MiMo 看具体版本（coding 向的一般有）。

## 小结

一套智谱 key + 四个 MCP，在任意支持 MCP 的 Coding 客户端里都能用上**读图、联网、读网、读仓库**；CCswitch 再把多端配置收口——配一次，到处用。

这几个 MCP 我还在长期用，踩到新坑再来更新。

## 官方文档

- **智谱开放平台（bigmodel.cn，国内）**
  - [GLM Coding Plan · MCP 总览](https://docs.bigmodel.cn/cn/coding-plan/mcp/)
  - 四个 MCP：[视觉理解](https://docs.bigmodel.cn/cn/coding-plan/mcp/vision-mcp-server) · [联网搜索](https://docs.bigmodel.cn/cn/coding-plan/mcp/search-mcp-server) · [网页读取](https://docs.bigmodel.cn/cn/coding-plan/mcp/reader-mcp-server) · [开源仓库](https://docs.bigmodel.cn/cn/coding-plan/mcp/zread-mcp-server)
- **Z.AI（z.ai，国际站）**
  - [MCP Integration 总览](https://docs.z.ai/devpack/mcp/)
  - 四个 MCP：[Vision](https://docs.z.ai/devpack/mcp/vision-mcp-server) · [Web Search](https://docs.z.ai/devpack/mcp/search-mcp-server) · [Web Reader](https://docs.z.ai/devpack/mcp/reader-mcp-server) · [Zread](https://docs.z.ai/devpack/mcp/zread-mcp-server)
- [Model Context Protocol 官网](https://modelcontextprotocol.io)

> 本文配置细节整理自上述官方文档，端点与命令均经实测。
