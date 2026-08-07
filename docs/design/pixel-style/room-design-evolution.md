# 像素房间设计演变

> 本文档记录 `/room` 像素房间从 **3D → 2D AI 底图 → 纯 Canvas 手绘** 的方案演变与决策。
> 当前线上实现见 `src/scripts/room-pixel.ts`（`initRoomPixel`），由 `src/pages/room.astro` 加载。
> 本文由早期两份方案文档（`01-像素点缀方案C.md`、`02-2D像素房间计划.md`）合并而来。

## 一句话演变

`方案 C（3D + 像素化后处理）` → 嫌 3D 效果不满意 → `2D 计划（AI 生成底图 + 热点）` → 最终落地为 `纯 Canvas 2D 手绘（room-pixel.ts，俯视 3/4）`

## 落地总结

| 方案 | 来源 | 命运 |
|---|---|---|
| 主站像素点缀（favicon / 导航 icon crispEdges / 浮动门像素 icon） | 方案 C §一 | ✅ 已落地 |
| 3D 房间 + 像素化后处理（EffectComposer + PixelationShader） | 方案 C §二 | ❌ 放弃（3D 低多边形效果不满意） |
| AI 生成等距像素底图 + 热点 overlay | 2D 计划 | ❌ 未采用（改走纯 Canvas 手绘） |
| 纯 Canvas 2D 像素 RPG 房间（俯视 3/4） | 演变终点 | ✅ 当前实现（`room-pixel.ts`） |

> 保留下来并落地的核心：热点交互（留言板 → `/guestbook`、EP 小车 → `/projects`、门 → 主页）、昼夜联动、主站像素点缀。

---

## 阶段一：像素点缀方案 C（3D + 像素化后处理）

> 📌 **命运**：主站像素点缀部分（§一）**已落地**——favicon 像素 Z、导航 icon `crispEdges`、浮动门像素 icon 都做了；3D 像素化后处理部分（§二）**放弃**——后续评估 3D 低多边形 + 像素化效果仍不理想，整个转向 2D（见阶段二）。
>
> 原策略：主站保持极简现代，加入像素点缀元素，`/room` 作为像素世界终极彩蛋。

### 一、像素点缀（博客主站）

#### 1. Logo 像素化
- 导航左上 `learnerCodeZ.` 换成像素字体（[Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) 英文部分 + 中文用系统字体）
- 或者：logo 保持现有字体，但加一个**像素小图标**前缀（像素方块/像素灯泡/像素角色头）
- 推荐：logo 前加一个 16x16 像素小图标（CSS box-shadow 拼像素，零图片）

#### 2. Favicon 像素化  ✅ 已做
- 当前：琥珀圆点 SVG
- 改成：16x16 像素风 logo（像素方块拼字母 Z / 像素角色头 / 像素门）
- 实现：SVG rect 拼像素（零图片，纯代码）

#### 3. 导航图标像素化  ✅ 已做（crispEdges）
- GitHub icon → 像素版 GitHub（已有 SVG，改成像素描边/像素化 path）
- Bilibili icon → 同上
- 亮暗切换（Sun/Moon）→ 像素版太阳/月亮
- 中英切换 → 像素字体 "EN / 中"
- **改动**：修改 `src/components/icons/` 下的 SVG，改用像素风描边（`shape-rendering: crispEdges`）

#### 4. 分隔/装饰线像素化
- section 之间的分隔线 → 像素虚线（CSS `background: repeating-linear-gradient` 或 border-style: dashed + 像素字号调）
- 卡片圆角 → 像素风直角 + 像素描边边框

#### 5. 空状态点缀
- "还没有内容" / "待添加" / "敬请期待" → 旁边加小像素画
  - 📦 像素箱子（待添加）
  - 🚧 像素路障（敬请期待）
  - 🐱 像素猫（还没有内容）
- 实现：CSS box-shadow 拼像素（零图片）或 SVG rect

#### 6. /room 浮动入口像素化  ✅ 已做
- 当前：SVG 门图标
- 改成：像素门（16x16 或 24x24，rect 拼像素）
- hover 效果：像素门"打开"动画（CSS）

### 二、/room 像素化（3D + pixelation 后处理）  ❌ 放弃

> 方案：保留现有 Three.js 场景 + 像素化后处理。
> **不丢现有工作**（桌子/柜门/窗帘/EP/椅子/海报/留言板/昼夜 全部保留），只在渲染输出上加像素化。

**实现**

```
Three.js Scene → 渲染到 RenderTarget → Pixelation Shader → 屏幕输出
```

**步骤**：
1. 安装/引入 `EffectComposer` + `RenderPass` + 自定义 `PixelationShader`
2. Three.js 自带 `ShaderPass`，像素化 shader 核心：
   - 把画面按 `pixelSize`（如 4px）分块
   - 每块取中心像素颜色，填满整块
   - 效果：3D 画面变成大像素颗粒，像马赛克/像素画
3. 参数 `pixelSize`：
   - 4 → 精细像素
   - 6-8 → 明显像素（推荐，像元气骑士）
   - 12 → 极粗像素（太模糊）

**额外效果**
- 像素字体 overlay：房间里 hover tooltip（"留言板"/"EP小车"）用像素字体
- 调色板限制：后处理时量化颜色（每通道只保留 4-5 个值），模拟复古主机调色板
- 扫描线：加 CRT 扫描线 overlay（可选，进一步增强复古感）

**性能**
- pixelation shader 开销很低（fragment shader，per-pixel 采样）
- 比当前 3D 渲染几乎无额外开销
- 可以用 `<details>` 让用户开关（"复古模式"按钮）

### 三、现有 3D 房间的安置

**问题**：改成像素风后，现有的低多边形 3D 场景怎么处理？

**推荐：保留，不删**

理由：
1. 像素化后处理直接覆盖在现有 3D 上——不需要删 3D，只是"换皮"
2. 现有的交互（拖窗帘、开柜门、拖椅子、转椅子、点留言板/EP）全部保留
3. 如果以后想回退到非像素风，只需关掉后处理，3D 场景原样恢复

```
现有代码不动：
- room-scene.ts 的所有物体/交互/灯光保留
- animate() 里加一行：composer.render() 替代 renderer.render()
- 加一个 toggle：像素 / 非像素（用户可选）

代码结构：
initRoom(container) {
  scene/camera/renderer/objects...（全部保留）
  + composer = new EffectComposer(renderer)
  + composer.addPass(new RenderPass(scene, camera))
  + composer.addPass(pixelationPass)
  animate() { composer.render() }
}
```

如果以后想做真正的 2D 像素房间（路线 1）：
- 当前 3D 代码 git 保留（`room-scene-3d.ts`）  ✅ 已归档
- 新写 `room-scene-pixel.ts`（Canvas 2D 像素）
- `room.astro` 根据模式切换加载哪个
- 3D 版本作为"经典模式"保留

### 四、执行顺序（建议分 3 步）

1. **像素点缀**（改动小，见效快）：favicon 像素化、导航 icon 像素化（`shape-rendering: crispEdges`）、空状态加像素小画、浮动门改像素门 icon
2. **3D 房间像素化后处理**：加 EffectComposer + pixelation shader、调 pixelSize、加"复古模式"toggle  ❌ 未执行（整个转向 2D）
3. **细节打磨**：像素字体（tooltip / 空状态）、调色板量化、扫描线（可选）、logo 像素化

### 五、待确认

- [ ] 像素化程度：精细（4px）/ 中等（6-8px）/ 粗糙（12px+）
- [ ] 是否加 toggle：让用户开关像素模式？
- [ ] 像素点缀范围：只 favicon + 浮动门？还是连导航 icon、空状态都改？
- [ ] 像素字体：tooltip/空状态用像素字体？
- [ ] 调色板量化：限制颜色数量？

---

## 阶段二：2D 像素房间计划（弃 3D，改 AI 底图）

> 📌 **命运**："弃 3D"的决策**生效**（3D 代码归档为 `room-scene-3d.ts`）；但"AI 生成底图 + 热点"的具体方案**最终未采用**——改为纯 Canvas 2D 手绘（`room-pixel.ts`）。热点交互、昼夜联动的思路被保留并落地。

### Context

3D 房间（Three.js）效果不满意（低多边形不真实 + 像素化后处理也不理想）。决定**换成 2D 像素画房间**（元气骑士式等距/isometric 风格）。3D 代码归档不删（git 保留）。

### 方案：AI 生成像素画 + Canvas 热点交互  ❌ 未采用

用 AI 生成一张**等距像素风房间插画**当底图，页面上叠加**可点击热点**（留言板、EP小车、海报、门），保持核心交互。

> 为什么不纯代码画：元气骑士式像素画需要大量像素美术素材（桌椅/电脑/EP/书架/窗/海报），纯代码 Canvas 绘制工作量巨大且效果难保证。AI 生成一张精致底图 + 代码做热点交互，是性价比最高的路径。
>
> （实际结果：最终还是走了纯 Canvas 手绘 `room-pixel.ts`，见落地总结。）

### 实现步骤

#### 1. 准备像素画底图  →  衍生出本目录下的 prompt 文件
- 用 AI 生成等距像素风房间插画（参考元气骑士/星露谷物语的室内场景）
- prompt 方向：isometric pixel art, cozy room with desk, laptop, window, bookshelf, robot, day/night, 16-bit style
- 生成两张：白天 + 晚上（同构图不同光照）
- 放入 `public/room/photos/room-day.png` + `room-night.png`
- 尺寸建议 1920×1080 或 1600×900

> 本目录 `prompt-for-ai.md` / `prompt_GPT.md` / `prompt_EP.md` 就是这一步衍生出来的出图提示词。

#### 2. 归档 3D 代码  ✅ 已做
- `src/scripts/room-scene.ts` → 重命名为 `src/scripts/room-scene-3d.ts`（保留，不删）
- 卸载 `three` 依赖（package.json 清理，可选——归档代码不 import 就不打包）

#### 3. 新建 2D 像素房间  →  最终实现为 `room-pixel.ts`
原计划新建 `room-scene-2d.ts`，实际演变为 `room-pixel.ts`（俯视 3/4 像素 RPG，纯 Canvas 2D）。

#### 4. 改 `room.astro`  ✅ 已做
- 加载 `initRoomPixel`（from `room-pixel.ts`）
- 保留 tooltip + 昼夜联动

#### 5. 热点交互（保留的核心）  ✅ 已做

| 热点 | 动作 |
|---|---|
| 留言板 | hover 边框 + tooltip → 点击跳 `/guestbook` |
| EP 小车 | hover + tooltip → 点击跳 `/projects#ep-navigation` |
| 门 | hover → 点击回主页 |

#### 6. 昼夜联动  ✅ 已做
- `light` 主题 → 白天，否则 → 夜晚
- 与主题切换联动

### 不在本次范围
- 3D 场景还原到 2D（不逐个复刻桌椅柜子）
- 窗帘拖拽 / 柜门打开 / 椅子拖动（3D 特有交互，2D 版先不做）

---

> 📝 **归档说明**：本文档为历史决策记录，方案中的"待确认"项已随实现结束而失效，保留仅供复盘。当前如需修改房间，以 `src/scripts/room-pixel.ts` 为准。
