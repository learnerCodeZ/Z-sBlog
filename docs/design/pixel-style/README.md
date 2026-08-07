# 像素房间设计档案

博客「Room」页面（像素/RPG 风互动房间）的设计档案：**方案演变 + AI 出图提示词**。
房间页面的实际代码见 `src/scripts/room-pixel.ts`（纯 Canvas 2D，俯视 3/4 像素 RPG）。

## 方案演变

完整的设计决策记录见 [`room-design-evolution.md`](./room-design-evolution.md)：
`3D + 像素化后处理`（❌ 放弃）→ `AI 底图 + 热点`（❌ 未采用）→ `纯 Canvas 2D 手绘`（✅ 当前实现）。

## ⚠️ 关于这些提示词的产物

房间最终走的是**纯 Canvas 2D 手绘**（`room-pixel.ts`），并非 AI 生成底图；
`public/room/photos/` 目前只有 `SpiderMan.png`。
所以这些提示词的产物**多数未直接落地**——它们是"AI 底图方案"阶段（最终未被采用）的遗留。
"状态"列按代码/目录推断，请按实际情况修正。

## 文件清单

### 设计方案
| 文件 | 内容 |
|---|---|
| `room-design-evolution.md` | 完整方案演变与决策（3D → AI 底图 → 纯 Canvas），含落地总结表 |

### 出图提示词
| 文件 | 用途 | 模型 | 产物 / 状态 |
|---|---|---|---|
| `prompt_GPT.md` | 互动房间整体布局规划（书架 / 电脑 / 机器人 / 宝箱分区，含 ASCII 草图） | GPT | 设计参考被采纳；⚠️ 最终走纯 Canvas 手绘，非 2D 贴图 |
| `prompt-for-ai.md` | 房间背景图，白天 + 晚上两张（→ `public/room/photos/room-day.png`、`room-night.png`） | 豆包 | ❌ 背景图未落地，仅 `SpiderMan.png`（海报元素）入库；方案被纯 Canvas 手绘取代 |
| `prompt_EP.md` | EP 工程机器人小车 sprite（房间热点 `EP小车 / EP Robot`） | 待补 | 房间内热点已存在；待补：实际用的 sprite 路径 |
| `prompt_HL2.md` | （空文件，0 字节） | — | ❓ 未完成，用途待确认 |

## 维护建议

- 每次新出图，回头在"产物 / 状态"列补一句结果路径，方便复现。
