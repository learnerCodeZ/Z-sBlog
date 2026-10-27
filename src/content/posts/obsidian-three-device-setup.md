---
title: "个人知识库搭建"
date: 2026-10-27
type: article
tags: ["Obsidian", "GitHub", "知识管理", "多端同步"]
summary: "记录这次用 Obsidian 和 GitHub 搭建 Z_Atlas 个人知识库的过程。笔记用纯 Markdown 保存，Agent 辅助整理，也分享一下目录、图谱和电脑、手机、平板同步的配置。"
draft: false
---

最近给自己搭了一个个人知识库，取名 Z_Atlas，用的是 Obsidian 和 GitHub，搭建和整理过程中也有 Agent 辅助。

它就是一个纯 Markdown 文档库，笔记都存成 `.md` 文件，图片、PDF 等附件单独归档。平时用 Obsidian 写笔记、看链接和图谱，也可以直接用文本编辑器打开这些文档，交给 Agent 辅助整理。GitHub 私有仓库用来记录版本，再配合插件把笔记同步到不同设备。

我一般在电脑上写长笔记，手机上随手翻看，平板用来看资料和记学习内容。ROS 2 是放进去的第一组系统学习笔记。

这篇主要记录这次搭建的过程，分享一下目前的目录、导航和同步配置。手机和平板接入时花了些时间，遇到的问题也一起记在后面，方便以后查。我的设备是 Windows 电脑、安卓手机和小米平板，同步用的是 Obsidian Git Vault 1.1.1。

## 知识库的目录

Obsidian 把存放笔记的文件夹叫作 Vault。我把这个文件夹也作为 Git 仓库的根目录，笔记和附件一起管理。

目前分了六个目录：

| 目录 | 放什么 |
|---|---|
| `00-Inbox` | 随手记录、待整理内容、个人日志 |
| `01-Knowledge` | 可以复用的知识，例如 ROS 2 |
| `02-Projects` | 项目目标、进展、问题和仓库链接 |
| `03-Resources` | 图片、PDF 等附件 |
| `04-Reviews` | 有记录之后再写复盘 |
| `05-Agent` | Agent 辅助整理的规则和知识库建设记录 |

之前的一些 Word 笔记也转成了 Markdown，原件还留在电脑上。之后的新笔记就直接用 Markdown 写，和库里的其他文档放在一起。

Agent 也围绕这些 Markdown 文档辅助整理。相关规则和建设记录放在 `05-Agent`，后面继续补笔记、调整目录时可以接着参考。

## 导航页和图谱

整理笔记时，我给每个大目录加了导航页，方便找到里面的内容。Obsidian 的图谱会把笔记之间的链接画出来，所以导航页里的链接也成了图谱的一部分。

我的做法是每个大目录放一个入口，再按学习阶段往下分：

```text
知识导航
└── ROS 2 导航
    ├── 第一轮_阶段总结
    │   └── 基础概念的各篇笔记
    └── 第二轮_阶段总结
        └── 代码阅读与实践的各篇笔记
```

ROS 2 的笔记比较多，我又按学习阶段分了一层。找具体内容时，可以先看阶段总结，再进入对应的笔记。

笔记链接和图片嵌入分别这样写，路径相对于 Vault：

```markdown
[[01-Knowledge/ROS2/01_基础概念/第一轮_阶段总结|第一轮阶段总结]]
![[01-Knowledge/ROS2/01_基础概念/图片/ROS 2 核心架构关系图-1.png]]
```

项目也单独建页，放仓库链接和进展。项目代码仍放在自己的开发目录，不把知识库变成代码仓库的副本。

下面是目前的图谱。

<img src="../../images/obsidian-three-device-setup/knowledge-graph.png" alt="Z_Atlas 关系图谱，按导航页连接学习笔记和项目" width="1025" height="971" loading="lazy">

颜色组用路径查询匹配。我的 00 到 05 依次是灰蓝 `#94A3B8`、蓝 `#60A5FA`、琥珀 `#FBBF24`、青绿 `#2DD4BF`、淡紫 `#C4B5FD`、粉 `#F472B6`。普通日志用更浅的 `#B0BCCB`，ROS 2 第一轮笔记用 `#93C5FD`。

例如知识目录填 `path:"01-Knowledge"`；更具体的浅色规则放在宽泛的目录规则前面。配色参数也放进了文末的配置包。

## 哪些内容放到 GitHub

我的个人日志只留在设备本地，整个 `00-Inbox/` 不进入 GitHub。`.obsidian/` 也不提交，设备布局、插件和凭据各端分别管理。

电脑的 `.gitignore` 至少有这些规则：

```gitignore
.obsidian/
.trash/
.env
.env.*
*.pem
*.key
/00-Inbox/
/03-Resources/日志/
*日志*
```

`03-Resources/日志/` 是早期留下的日志附件目录。`*日志*` 会扩大排除范围，连同名的技术笔记也可能被忽略，照搬前要检查自己的文件命名。

已经被 Git 跟踪的文件，补一条忽略规则不会让它退出版本管理。例如此前提交过 `.obsidian/`，需要另外停止跟踪；本地配置仍要保留。

被排除的日志不会出现在其他设备，也无法从 GitHub 恢复。我另有本地备份。私有仓库只是限制访问，不代表文件经过端到端加密。

## 电脑、手机和平板怎么同步

三台设备用的是同一个插件，但后端不同：

| 设备 | 同步后端 | 认证方式 |
|---|---|---|
| Windows 电脑 | Git | 电脑的 Git 凭据 |
| 安卓手机 | GitHub API | 手机自己的个人访问令牌 |
| 小米平板 | GitHub API | 平板自己的个人访问令牌 |

GitHub 手机客户端可以用来查看仓库，但它不会自动同步 Obsidian 的本地文件。

### 安装插件

本次使用的是 [redoracle/obsidian-git-vault](https://github.com/redoracle/obsidian-git-vault)，不要只看“Git”这个名字就装成另一个插件。

1. 先装好 Obsidian。插件 1.1.1 要求 Obsidian 至少为 **1.11.4**。
2. 在“设置 → 第三方插件”中允许社区插件，搜索 **Obsidian Git Vault**，安装并启用。
3. 如果市场中找不到，从 [1.1.1 官方发布页](https://github.com/redoracle/obsidian-git-vault/releases/tag/1.1.1) 下载 `main.js`、`manifest.json`、`styles.css`。
4. 完全关闭 Obsidian，在实际 Vault 内建立 `.obsidian/plugins/git-vault/`，把这三个文件放进去，重开后启用插件。安卓文件管理器需要打开“显示隐藏文件”。

手动安装时，三个文件要来自同一版本。这里没有使用修改版插件。

电脑端选择 Git 后端，确认本地 Git 仓库已经关联自己的私有远端，并能完成一次提交、拉取和推送。电脑的 Git 登录与移动端令牌是两套认证，某一端能连接，不代表另一端也已配置好。

### 给手机和平板分别创建令牌

这里常说的“API”，实际需要申请的是 GitHub **Personal access token（PAT）**。我给两台安卓设备分别建了一枚，方便以后单独撤销。

1. 用浏览器登录 GitHub，打开 [Fine-grained tokens](https://github.com/settings/personal-access-tokens)，点 **Generate new token**。
2. 名称写成能认出设备的名字，例如 `Z_Atlas_Phone`、`Z_Atlas_Xiaomi_Pad`。
3. **Resource owner** 选仓库所属账号。
4. **Repository access → Only select repositories**，只勾选知识库仓库 `Z_Atlas`。
5. **Repository permissions → Contents** 设为 **Read and write**。**Metadata** 保持自动附带的 **Read-only**，不需要开 Administration。
6. 设置到期时间，生成后复制到对应设备的插件令牌栏。令牌只显示一次，不写进笔记或文章。

我这次选了 **No expiration**。它表示没有预设到期日；设备丢失或令牌泄露时，仍要自己撤销。

### 移动端填写这些设置

在手机、平板上分别打开“设置 → Obsidian Git Vault”：

| 设置项 | 填写内容 |
|---|---|
| UI Mode | Simple |
| Sync Backend | GitHub API |
| Personal access token | 当前设备的令牌 |
| Owner / organization | 仓库所属用户名，按实际大小写填写 |
| Repository | `Z_Atlas`，不是仓库完整网址 |
| Branch | `main`，或实际存在的分支 |
| Tracked directory | 留空 |
| Conflict resolution strategy | Manual |

**Tracked directory 不是远端仓库地址。**它把本地子目录映射到远端根目录；我的 Vault 根目录已经对应仓库根目录，所以不填。

移动端还要单独设置 **API sync scope → Excluded paths**。它与电脑的 `.gitignore` 分开工作，我在手机和平板上各填了一次，每行一项：

```text
.obsidian/
.git/
.trash/
.gitignore
.gitkeep
00-Inbox/
03-Resources/日志/
*日志*
.env
.env.*
*.pem
*.key
.DS_Store
Thumbs.db
*~
```

`.gitignore` 和 `.gitkeep` 是这次踩坑后补上的。平板的一次同步提交删除了远端的这几个文件，后来从电脑恢复了。我把它们加入 API 排除项，避免它们参与移动端同步；还需要继续观察后续同步结果。

我暂时把自动同步关了，先手动使用一段时间：

| 标题 | 设置 |
|---|---|
| Sync on file change | 关闭 |
| Sync on app close | 关闭 |
| Sync on network reconnect | 关闭 |
| Sync after idle time (minutes) | `-1` |
| Auto commit / push / pull interval (minutes) | 如果显示，均设为 `0` |

## 令牌有效，为什么还找不到私有仓库？

手机和平板都遇到过：**Check token 显示 Valid，仓库下拉框却没有 Z_Atlas。**

Valid 只能说明这次令牌检查通过，不能据此确认它能读取目标私有仓库。先查仓库所属账号、选中的仓库和 Contents 权限，再刷新 Repository 列表。

我遇到的另一条报错是访问 `/repos/用户名/Z_Atlas` 返回 **404**。私有仓库没授权给当前令牌，也可能这样返回，并不一定是仓库被删了。

如果权限核对后列表仍不显示，可以用配置文件直接指定目标。我这次按下面的办法绕过了列表：

1. 完全关闭 Obsidian。
2. 在当前 Vault 的 `.obsidian/plugins/git-vault/` 中，把旧 `data.json` 重命名为 `data.json.bak`。
3. 解压文末配置包，打开其中的 `git-vault/data.json`，把 `YOUR_GITHUB_USERNAME` 改成自己的 GitHub 用户名；仓库名和分支也按实际修改。
4. 将它复制到手机或平板的同一插件目录，文件名必须是 `data.json`，不能是 `data (1).json` 或 `data.jsom`。
5. 重开 Obsidian，检查目标仓库、排除路径和自动同步状态；如果令牌提示缺失，只在插件设置中重新填入。

这个包只提供配置，不修改插件代码，也不包含令牌。1.1.1 使用设备上的 Obsidian 密钥存储保存令牌。

## 第一次同步

我的远端已经有电脑上的笔记，所以手机和平板接入时，先获取已有内容。

1. 确认目标仓库、分支和排除规则已保存，重新打开设置检查一次。
2. 打开左侧边栏，点 Git 的分叉图标进入 Source Control 面板，再点 **Sync**。
3. 如果出现同名文件冲突，只有在手机或平板没有独有修改时，才选 **Keep Remote**。**Keep Local** 可能把本地旧版本传回远端，不能一律选它。
4. 完成后打开几篇笔记，检查中文、配图和内部链接，再到 GitHub 检查新增、修改和删除了哪些文件。

**Create & upload** 用来创建新仓库，不是首次下载已有知识库的按钮。

后面还打算拿一篇不含隐私的测试笔记，把整个流程走一遍：电脑新建并推送 → 手机拉取并修改 → 手机同步 → 电脑拉取核对，平板再重复一次。离线修改、两端冲突和误删恢复也还需要单独测试。

平时先同步再编辑，写完再同步，尽量避免三台设备同时改同一篇。

## 还有两件事不会自动跟过来

第一，图谱颜色保存在 `.obsidian/graph.json`。因为我排除了整个 `.obsidian/`，同步笔记不会复制颜色。可以对照颜色表在各端手动设置，或关闭 Obsidian、备份配置后，只迁移其中的 `colorGroups`。

第二，个人日志继续留在各设备本地。想在三端查看同一份个人日志，就得重新选择同步方案和隐私边界，这次没有做。

目前先这样用着，保留手动同步，边写笔记边看看这套目录用起来是否顺手。自动同步和冲突恢复还有待继续测试，有新的使用体会再补到这里。

## 配套下载

<a href="../../downloads/obsidian-three-device-config-1.1.1.zip" download>下载三端配置参考包（ZIP）</a>

包内有无令牌的移动端 `data.json` 模板、图谱颜色参数和简短说明。先改成自己的账号、仓库和分支，再使用；这份模板不适合直接覆盖已有复杂同步配置。

插件本体请从 [Obsidian Git Vault 1.1.1 官方发布页](https://github.com/redoracle/obsidian-git-vault/releases/tag/1.1.1) 获取，配置包不附带插件代码。

## 参考

- [Obsidian 下载](https://obsidian.md/download)
- [Obsidian Git Vault 开源仓库](https://github.com/redoracle/obsidian-git-vault)
- [Git Vault API 同步说明（1.1.1）](https://github.com/redoracle/obsidian-git-vault/blob/1.1.1/docs/Gitless-Mode.md)
- [GitHub：管理个人访问令牌](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
