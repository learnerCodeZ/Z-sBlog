// room-pixel.ts — 俯视 3/4 像素 RPG 房间（纯 Canvas 2D）
// 参考：Stardew Valley / 元气骑士 的室内地图。房间本身是主角，无人物。
// 所有家具/电脑/机器人/书架/宝箱独立分层、可单独点击交互。
//
// 渲染策略：逻辑低分辨率画布 (480×300) → CSS 放大 + image-rendering: pixelated。
// 静态场景缓存到离屏 canvas；每帧只 blit + 夜晚辉光 + 悬浮高亮，性能友好。

type Ctx = CanvasRenderingContext2D;

const LW = 480; // 视口宽（可见 canvas 宽）
const LH = 300; // 逻辑高
const WALL_H = 78; // 后墙高度
const SCENE_W = 680; // 场景总宽（> 视口，可左右平移探索）

// === 基础工具（沿用 room-2d-3d.ts 的成熟写法） ===

function createCanvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false; // 关键：保持像素硬边
  return [c, ctx];
}

function px(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// hex 颜色整体调亮/调暗
function adj(hex: string, amt: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const cl = (v: number) => Math.max(0, Math.min(255, v + amt)).toString(16).padStart(2, '0');
  return `#${cl(r)}${cl(g)}${cl(b)}`;
}

// 地面投影（半透明黑条）
function shadow(ctx: Ctx, x: number, y: number, w: number, h = 4, a = 0.22) {
  ctx.fillStyle = `rgba(0,0,0,${a})`;
  ctx.fillRect(x, y, w, h);
}

// 径向辉光
function radial(ctx: Ctx, x: number, y: number, r: number, inner: string, outer: string, comp: GlobalCompositeOperation = 'lighter') {
  ctx.save();
  ctx.globalCompositeOperation = comp;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// === 调色板（白天/夜晚） ===

function pal(day: boolean) {
  const d = day;
  return {
    outline: '#15131a',
    // 墙 / 地
    wall: d ? '#e9ddc4' : '#2a2731',
    wallDark: d ? '#d3c5a8' : '#211e27',
    wallLight: d ? '#f3e9d6' : '#332f3b',
    base: d ? '#b6a68a' : '#3a342e',
    floor: d ? '#cda978' : '#3e362c',
    floorDark: d ? '#b89768' : '#312a22',
    floorLight: d ? '#ddbc8a' : '#4a4034',
    // 木家具
    wood: d ? '#9a6b3a' : '#6a4a2a',
    woodDark: d ? '#74502d' : '#52381f',
    woodLight: d ? '#b17d48' : '#7c5832',
    shelf: d ? '#8a5e34' : '#5e4022',
    shelfDark: d ? '#6a4828' : '#42301c',
    // 金属
    metal: d ? '#9a9aa4' : '#5a5a64',
    metalDark: d ? '#6a6a74' : '#3a3a44',
    metalLight: d ? '#c4c4ce' : '#7a7a84',
    // 显示器
    bezel: d ? '#181820' : '#0a0a0e',
    screen: '#7dd3c0',
    screenDark: '#3a8a7a',
    screenLight: '#b6ebe0',
    // 灯
    lamp: '#e8b166',
    lampGlow: '#ffd28a',
    // 机器人 EP
    epBody: d ? '#1c1c22' : '#0e0f12',
    epGray: d ? '#3c3c42' : '#262628',
    epRed: '#d02828',
    epBlue: '#2848d0',
    // 宝箱
    chest: d ? '#9a6b3a' : '#6a4a2a',
    chestDark: d ? '#6a4828' : '#42301c',
    gold: '#e8b166',
    goldLight: '#ffd28a',
    // 植物
    leaf: d ? '#3a8a3a' : '#2a6a2a',
    leafLight: d ? '#5cb45c' : '#3a8a3a',
    leafDark: d ? '#2e6a2e' : '#1f4a1f',
    pot: d ? '#b5603a' : '#7a4030',
    potDark: d ? '#8a4828' : '#523020',
    // 留言板
    board: d ? '#8a6a4a' : '#5a4434',
    boardDark: d ? '#6a4a3a' : '#3e2e22',
    note1: '#e8d068',
    note2: '#f0a8a8',
    note3: '#8ad0a0',
    note4: '#a8c8f0',
    // 杂项
    accent: '#e8b166',
    bookColors: ['#c04040', '#4060c0', '#40a040', '#c0a040', '#a040c0', '#40c0a0', '#c06030', '#3060a0'],
    rug: d ? '#4a5870' : '#2a3040',
    rugDark: d ? '#3a4860' : '#1a2030',
    rugLight: d ? '#5e6c84' : '#3a4050',
    door: d ? '#7a5230' : '#4a3220',
    doorDark: d ? '#5a3a20' : '#322318',
    window: d ? '#a8d8f0' : '#1a2540',
    windowLight: d ? '#d0ecff' : '#0a1428',
    windowFrame: d ? '#6a5230' : '#3a2e1e',
    pcb: d ? '#2f8a3a' : '#1f6a2a',
    pcbDark: d ? '#1f6a2a' : '#134a1c',
  };
}
type Pal = ReturnType<typeof pal>;

// ============================================================
//  物体绘制函数（各自负责自己的坐标，按 y 排序在 drawScene 里调用）
// ============================================================

// --- 后墙 ---
function drawWall(ctx: Ctx, P: Pal) {
  px(ctx, 0, 0, SCENE_W, WALL_H, P.wall);
  // 横向护墙板纹理
  for (let y = 14; y < WALL_H - 8; y += 16) px(ctx, 0, y, SCENE_W, 1, P.wallDark);
  px(ctx, 0, 8, SCENE_W, 1, P.wallLight);
  // 踢脚线
  px(ctx, 0, WALL_H - 6, SCENE_W, 6, P.base);
  px(ctx, 0, WALL_H - 6, SCENE_W, 1, adj(P.base, -18));
  px(ctx, 0, WALL_H, SCENE_W, 1, P.outline);
}

// --- 窗户（左上墙） ---
function drawWindow(ctx: Ctx, P: Pal, day: boolean) {
  const x = 56, y = 12, w = 70, h = 44;
  // 框
  px(ctx, x - 4, y - 4, w + 8, h + 8, P.windowFrame);
  px(ctx, x, y, w, h, P.window);
  // 天空渐变（像素分层）
  px(ctx, x, y, w, 14, P.windowLight);
  px(ctx, x, y + 14, w, h - 14, P.window);
  if (day) {
    // 太阳
    px(ctx, x + w - 18, y + 4, 10, 10, '#ffd86b');
    px(ctx, x + w - 16, y + 6, 6, 6, '#ffe89a');
    // 云
    px(ctx, x + 8, y + 8, 14, 4, '#ffffff');
    px(ctx, x + 10, y + 6, 10, 2, '#ffffff');
  } else {
    // 月亮 + 星星
    px(ctx, x + w - 18, y + 5, 8, 8, '#e8ecff');
    px(ctx, x + w - 15, y + 7, 5, 5, P.window);
    px(ctx, x + 10, y + 7, 1, 1, '#ffffff');
    px(ctx, x + 24, y + 12, 1, 1, '#ffffff');
    px(ctx, x + 16, y + 18, 1, 1, '#cfd8ff');
    px(ctx, x + 40, y + 9, 1, 1, '#ffffff');
  }
  // 窗棂（十字）
  px(ctx, x + w / 2 - 1, y, 2, h, P.windowFrame);
  px(ctx, x, y + h / 2 - 1, w, 2, P.windowFrame);
  px(ctx, x - 4, y - 4, w + 8, 1, adj(P.windowFrame, 20));
}

// --- 墙上留言板 ---
function drawBoard(ctx: Ctx, P: Pal) {
  const x = 178, y = 14, w = 94, h = 48;
  shadow(ctx, x + 2, y + 2, w, h, 0.12);
  px(ctx, x - 3, y - 3, w + 6, h + 6, '#5a4030'); // 木框
  px(ctx, x, y, w, h, P.board);
  px(ctx, x, y, w, h, P.board); // 软木底
  for (let i = 0; i < 6; i++) px(ctx, x + 4 + i * 16, y + 4, 1, h - 8, P.boardDark); // 纹理
  // 便签
  const notes: [number, number, number, number, string][] = [
    [x + 8, y + 6, 22, 18, P.note1],
    [x + 40, y + 4, 24, 16, P.note2],
    [x + 68, y + 8, 18, 20, P.note3],
    [x + 14, y + 28, 28, 14, P.note4],
    [x + 52, y + 26, 22, 18, P.note1],
  ];
  for (const [nx, ny, nw, nh, c] of notes) {
    px(ctx, nx, ny, nw, nh, c);
    px(ctx, nx, ny, nw, 1, adj(c, -20));
    px(ctx, nx, ny + nh - 1, nw, 1, adj(c, -30));
    px(ctx, nx + nw / 2 - 1, ny - 1, 2, 2, '#c02020'); // 图钉
  }
}

// --- 墙上小海报（科技装饰） ---
function drawWallPoster(ctx: Ctx, P: Pal) {
  const x = 308, y = 16, w = 44, h = 44;
  shadow(ctx, x + 2, y + 2, w, h, 0.12);
  px(ctx, x, y, w, h, '#2a2a35');
  px(ctx, x, y, w, h, '#2a2a35');
  px(ctx, x, y, w, 4, '#3a3a48');
  // 像素小人/ logo 装饰
  px(ctx, x + 14, y + 10, 16, 16, '#e8b166');
  px(ctx, x + 12, y + 12, 4, 4, '#e8b166');
  px(ctx, x + 28, y + 12, 4, 4, '#e8b166');
  px(ctx, x + 18, y + 18, 8, 2, '#2a2a35');
  px(ctx, x + 14, y + 30, 16, 2, '#7dd3c0');
  px(ctx, x + 16, y + 34, 12, 2, '#c04040');
  px(ctx, x + 1, y + 1, w - 2, 1, adj('#2a2a35', 30));
}

// --- 地板 ---
function drawFloor(ctx: Ctx, P: Pal) {
  px(ctx, 0, WALL_H + 1, SCENE_W, LH - WALL_H - 1, P.floor);
  // 木地板纹理（横向通铺条纹 + 板缝）
  for (let y = WALL_H + 1; y < LH; y += 18) {
    px(ctx, 0, y, SCENE_W, 1, P.floorDark); // 板缝
    for (let x = 0; x < SCENE_W; x += 64) {
      const off = ((y / 18) % 2) * 32; // 错缝
      px(ctx, x + off, y, 1, 18, P.floorDark);
      // 木纹高光
      px(ctx, x + off + 6, y + 3, 22, 1, P.floorLight);
      px(ctx, x + off + 34, y + 9, 18, 1, P.floorLight);
    }
  }
}

// --- 地毯（中央焦点） ---
function drawRug(ctx: Ctx, P: Pal) {
  const cx = 232, cy = 196, rx = 116, ry = 40;
  // 椭圆（sqrt 法，保持像素感）
  const ellipse = (rcx: number, rcy: number, rrx: number, rry: number, col: string) => {
    for (let yy = -rry; yy <= rry; yy++) {
      const span = Math.floor(rrx * Math.sqrt(1 - (yy * yy) / (rry * rry)));
      px(ctx, rcx - span, rcy + yy, span * 2, 1, col);
    }
  };
  ellipse(cx, cy, rx, ry, P.rugDark);
  ellipse(cx, cy, rx - 3, ry - 3, P.rug);
  ellipse(cx, cy, rx - 8, ry - 6, P.rugDark);
  ellipse(cx, cy, rx - 12, ry - 9, P.rugLight);
  // 中心菱形纹
  for (let i = 0; i < 5; i++) {
    px(ctx, cx - 30 + i * 15, cy - 4 + Math.abs(i - 2) * 3, 6, 6, P.rugDark);
  }
}

// --- 大书架（左，靠墙） ---
function drawBookshelf(ctx: Ctx, P: Pal) {
  const x = 14, y = 26, w = 78, h = 104;
  shadow(ctx, x + 4, y + h - 2, w, 6, 0.28);
  // 外框
  px(ctx, x, y, w, h, P.shelf);
  px(ctx, x, y, w, 2, adj(P.shelf, 18));
  px(ctx, x, y, 2, h, P.shelfDark);
  px(ctx, x + w - 2, y, 2, h, P.shelfDark);
  // 顶板装饰（小盆栽 + 卷轴）
  px(ctx, x + 8, y - 8, 14, 10, P.potDark);
  px(ctx, x + 8, y - 8, 14, 2, P.pot);
  px(ctx, x + 10, y - 14, 3, 6, P.leafLight);
  px(ctx, x + 13, y - 16, 3, 8, P.leaf);
  px(ctx, x + 16, y - 14, 3, 6, P.leafLight);
  px(ctx, x + 40, y - 6, 18, 6, '#e8e0d0'); // 卷轴
  px(ctx, x + 40, y - 7, 18, 1, '#c8b890');
  px(ctx, x + 38, y - 7, 3, 8, P.gold);

  // 3 层书
  const shelves = [y + 14, y + 44, y + 74];
  shelves.forEach((sy, si) => {
    // 层板
    px(ctx, x + 2, sy + 22, w - 4, 4, P.shelfDark);
    px(ctx, x + 2, sy + 22, w - 4, 1, adj(P.shelf, 14));
    // 书籍
    let bx = x + 5;
    let i = 0;
    while (bx < x + w - 8) {
      const bw = 5 + ((i * 3 + si) % 4);
      const bh = 16 + ((i + si) % 4) * 2;
      const col = P.bookColors[(i + si * 3) % P.bookColors.length];
      px(ctx, bx, sy + 22 - bh, bw, bh, col);
      px(ctx, bx, sy + 22 - bh, bw, 1, adj(col, 25)); // 书顶高光
      px(ctx, bx + bw - 1, sy + 22 - bh, 1, bh, adj(col, -30)); // 书脊暗面
      px(ctx, bx + 1, sy + 22 - bh + 4, bw - 2, 1, adj(col, -18)); // 书脊横纹
      // 偶尔一本横放
      if (i === 3 + si) {
        px(ctx, bx + bw + 1, sy + 20, 10, 3, P.bookColors[(i + 5) % P.bookColors.length]);
        bx += 11;
      }
      bx += bw + 1;
      i++;
    }
    // 层板下阴影
    px(ctx, x + 2, sy + 26, w - 4, 1, 'rgba(0,0,0,0.18)');
  });
  void h;
}

// --- 电脑桌（右，靠墙）：桌 + 显示器 + 键鼠 + 台灯 + 椅 ---
function drawDesk(ctx: Ctx, P: Pal, t: number) {
  const dx = 286, dy = 96, dw = 152;
  shadow(ctx, dx + 4, dy + 40, dw, 6, 0.25);
  // 桌面
  px(ctx, dx, dy, dw, 10, P.woodLight);
  px(ctx, dx, dy, dw, 2, adj(P.woodLight, 18));
  px(ctx, dx, dy + 9, dw, 1, P.woodDark);
  // 桌身（前板）
  px(ctx, dx + 4, dy + 10, dw - 8, 20, P.wood);
  px(ctx, dx + 4, dy + 10, dw - 8, 1, adj(P.wood, 14));
  // 抽屉
  px(ctx, dx + 90, dy + 13, 50, 14, P.woodDark);
  px(ctx, dx + 92, dy + 15, 46, 10, P.wood);
  px(ctx, dx + 112, dy + 19, 6, 2, P.gold); // 把手
  // 桌腿
  px(ctx, dx + 6, dy + 30, 6, 8, P.woodDark);
  px(ctx, dx + dw - 12, dy + 30, 6, 8, P.woodDark);

  // 显示器（蓝光）
  const mx = 330, my = 52, mw = 68, mh = 46;
  shadow(ctx, mx + 3, my + mh, mw, 4, 0.2);
  px(ctx, mx + 24, my + mh, 20, 6, P.metalDark); // 支架
  px(ctx, mx + 16, my + mh + 4, 36, 4, P.metal); // 底座
  px(ctx, mx, my, mw, mh, P.bezel);
  px(ctx, mx + 3, my + 3, mw - 6, mh - 8, '#0a1418');
  // 代码行
  const lines: [number, number, number][] = [
    [mx + 6, my + 7, 22],
    [mx + 10, my + 13, 30],
    [mx + 10, my + 19, 18],
    [mx + 14, my + 25, 26],
    [mx + 6, my + 31, 14],
  ];
  lines.forEach(([lx, ly, ll], i) => {
    const c = [P.screen, P.screenLight, '#5aa0c0', P.screen, '#9ad8c8'][i];
    px(ctx, lx, ly, ll, 2, c);
  });
  // 闪烁光标
  if (Math.floor(t * 2) % 2 === 0) px(ctx, mx + 22, my + 31, 2, 2, P.screenLight);
  px(ctx, mx + 3, my + 3, mw - 6, 1, P.screen); // 屏幕顶光
  px(ctx, mx, my, mw, 1, adj(P.bezel, 25));

  // 键盘 + 鼠标
  px(ctx, dx + 16, dy - 1, 52, 6, P.metalDark);
  px(ctx, dx + 18, dy, 48, 3, P.metal);
  for (let i = 0; i < 6; i++) px(ctx, dx + 20 + i * 8, dy + 1, 5, 1, P.metalDark);
  px(ctx, dx + 74, dy, 8, 5, P.metalDark);
  px(ctx, dx + 75, dy + 1, 6, 3, P.metal);

  // 台灯（右侧，暖光）
  const lx = dx + dw - 18;
  px(ctx, lx, dy + 6, 6, 4, P.metalDark); // 底座
  px(ctx, lx + 2, dy - 18, 2, 24, P.metalDark); // 灯杆
  px(ctx, lx - 6, dy - 24, 16, 8, P.metalDark); // 灯罩
  px(ctx, lx - 5, dy - 23, 14, 3, P.lampGlow); // 灯泡光
  px(ctx, lx - 4, dy - 19, 12, 1, P.lamp);

  // === 办公椅（游戏椅风格，背对观众：椅背朝向我们）===
  const cx = 358; // 椅子中心（对齐显示器）
  const cy = 130; // 座垫顶部 y（往里推，靠近桌子）—— 调这一个数即可整体前后移动
  const bt = cy - 26; // 椅背顶部
  shadow(ctx, cx - 22, cy + 32, 44, 5, 0.26);
  // 五星脚轮底座（先画，座垫/椅背覆盖于上）
  const hubY = cy + 22;
  px(ctx, cx - 18, hubY, 16, 2, P.metalDark); // 左腿
  px(ctx, cx + 2, hubY, 16, 2, P.metalDark); // 右腿
  px(ctx, cx - 1, hubY, 3, 6, P.metalDark); // 正下腿
  px(ctx, cx - 3, hubY - 2, 6, 4, P.metalDark); // 中轴座
  const wheel = (wx: number, wy: number) => {
    px(ctx, wx, wy, 7, 5, P.outline);
    px(ctx, wx + 1, wy + 1, 5, 3, P.metalDark);
    px(ctx, wx + 1, wy + 1, 5, 1, P.metal);
  };
  wheel(cx - 24, hubY + 2);
  wheel(cx - 1, hubY + 5);
  wheel(cx + 18, hubY + 2);
  // 气压中柱
  px(ctx, cx - 2, cy + 6, 4, 18, P.metalDark);
  px(ctx, cx - 2, cy + 6, 1, 18, P.metal);
  // 座垫
  px(ctx, cx - 20, cy, 40, 8, P.epBody);
  px(ctx, cx - 20, cy, 40, 2, adj(P.epBody, 18));
  px(ctx, cx - 20, cy + 7, 40, 1, P.outline);
  // 扶手
  px(ctx, cx - 23, cy - 5, 4, 12, P.epGray);
  px(ctx, cx + 19, cy - 5, 4, 12, P.epGray);
  px(ctx, cx - 23, cy - 5, 4, 2, adj(P.epGray, 20));
  px(ctx, cx + 19, cy - 5, 4, 2, adj(P.epGray, 20));
  // 椅背：圆角外框 + 头枕 + 侧翼 + 红色中央条纹
  px(ctx, cx - 15, bt, 30, 1, P.outline); // 圆角顶行
  px(ctx, cx - 17, bt + 1, 34, 27, P.outline); // 外框
  px(ctx, cx - 16, bt + 1, 32, 26, P.epBody); // 主体
  px(ctx, cx - 14, bt + 1, 28, 5, adj(P.epBody, 10)); // 头枕
  px(ctx, cx - 14, bt + 1, 28, 1, adj(P.epBody, 24));
  px(ctx, cx - 16, bt + 6, 5, 21, adj(P.epBody, 12)); // 左侧翼
  px(ctx, cx + 11, bt + 6, 5, 21, adj(P.epBody, 12)); // 右侧翼
  px(ctx, cx - 3, bt + 8, 6, 18, P.epRed); // 中央红条
  px(ctx, cx - 3, bt + 8, 6, 1, adj(P.epRed, 32));
  px(ctx, cx + 2, bt + 9, 1, 16, adj(P.epRed, -28));
  px(ctx, cx - 15, bt + 1, 30, 1, adj(P.epBody, 22)); // 顶高光
}

// --- 机器人工作台（左下）：工作台 + EP 小车 + 电路板 + 工具箱 ---
function drawRobotBench(ctx: Ctx, P: Pal) {
  const bx = 20, by = 214, bw = 148;
  shadow(ctx, bx + 4, by + 46, bw, 6, 0.28);
  // 台面
  px(ctx, bx, by, bw, 12, P.woodLight);
  px(ctx, bx, by, bw, 2, adj(P.woodLight, 16));
  px(ctx, bx, by + 11, bw, 1, P.woodDark);
  // 台腿
  px(ctx, bx + 4, by + 12, 6, 36, P.woodDark);
  px(ctx, bx + bw - 10, by + 12, 6, 36, P.woodDark);
  px(ctx, bx + bw / 2 - 3, by + 12, 6, 36, P.woodDark);

  // 工具箱（左）
  const tx = bx + 6, ty = by - 6;
  px(ctx, tx, ty, 34, 16, P.metal);
  px(ctx, tx, ty, 34, 3, P.metalLight);
  px(ctx, tx, ty + 13, 34, 1, P.metalDark);
  px(ctx, tx + 2, ty + 4, 30, 8, P.metalDark);
  px(ctx, tx + 14, ty + 1, 6, 3, P.metalDark); // 把手
  px(ctx, tx + 4, ty + 6, 6, 4, P.epRed);
  px(ctx, tx + 12, ty + 6, 6, 4, P.gold);

  // 电路板（右）
  const pcbX = bx + 110, pcbY = by - 2;
  px(ctx, pcbX, pcbY, 32, 14, P.pcb);
  px(ctx, pcbX, pcbY, 32, 1, adj(P.pcb, 20));
  px(ctx, pcbX + 2, pcbY + 2, 4, 10, P.pcbDark);
  px(ctx, pcbX + 26, pcbY + 2, 4, 10, P.pcbDark);
  for (let i = 0; i < 4; i++) px(ctx, pcbX + 8 + i * 4, pcbY + 4, 2, 2, P.gold);
  px(ctx, pcbX + 8, pcbY + 9, 16, 1, P.metalLight); // 走线

  // === EP 工程机器人（重设计：工业底盘 + 多关节机械臂为视觉焦点）===
  const rx = 94; // 机器人中心 x
  const rbase = 214; // 接地点 y（台面上）
  shadow(ctx, rx - 34, rbase + 2, 68, 5, 0.32);

  const wheel = (wx: number, wy: number, back = false) => {
    const h = back ? 8 : 9;
    px(ctx, wx, wy, 7, h, P.outline); // 轮胎
    px(ctx, wx + 1, wy + 1, 5, h - 2, P.epGray);
    px(ctx, wx + 1, wy + 1, 5, 1, adj(P.epGray, 24)); // 高光
    px(ctx, wx + 3, wy + 2, 1, h - 4, P.outline); // 辐条
    px(ctx, wx + 2, wy + Math.floor(h / 2), 3, 1, P.outline);
    px(ctx, wx + 3, wy + Math.floor(h / 2), 1, 1, P.metalLight); // 轮毂
  };
  // 后轮（先画，被底盘遮挡一部分）
  wheel(rx - 28, rbase - 12, true);
  wheel(rx + 21, rbase - 12, true);

  // 底盘：黑色金属 + 模块化侧装甲
  px(ctx, rx - 32, rbase - 22, 64, 18, P.outline);
  px(ctx, rx - 31, rbase - 21, 62, 16, P.epBody);
  px(ctx, rx - 31, rbase - 21, 62, 2, adj(P.epBody, 20)); // 顶高光
  px(ctx, rx - 31, rbase - 7, 62, 2, adj(P.epBody, -24)); // 底阴影
  // 侧装甲板
  px(ctx, rx - 31, rbase - 18, 9, 12, adj(P.epBody, 12));
  px(ctx, rx + 22, rbase - 18, 9, 12, adj(P.epBody, 12));
  px(ctx, rx - 31, rbase - 18, 9, 1, adj(P.epBody, 26));
  px(ctx, rx + 22, rbase - 18, 9, 1, adj(P.epBody, 26));
  // 前面板 + 电路接口 + 针脚
  px(ctx, rx - 18, rbase - 17, 36, 9, adj(P.epBody, -10));
  px(ctx, rx - 16, rbase - 16, 12, 7, P.epGray);
  px(ctx, rx - 14, rbase - 15, 8, 1, P.metalLight);
  px(ctx, rx - 14, rbase - 13, 8, 1, P.metalLight);
  px(ctx, rx - 14, rbase - 11, 8, 1, P.metalLight);
  // 四角螺丝
  px(ctx, rx - 30, rbase - 20, 2, 2, P.metalLight);
  px(ctx, rx + 28, rbase - 20, 2, 2, P.metalLight);
  px(ctx, rx - 30, rbase - 8, 2, 2, P.metalLight);
  px(ctx, rx + 28, rbase - 8, 2, 2, P.metalLight);
  // 蓝/红状态灯
  px(ctx, rx, rbase - 15, 5, 2, P.epBlue);
  px(ctx, rx, rbase - 15, 5, 1, adj(P.epBlue, 45));
  px(ctx, rx + 7, rbase - 15, 4, 2, P.epRed);
  px(ctx, rx + 7, rbase - 15, 4, 1, adj(P.epRed, 45));
  // 前轮（后画，遮挡底盘底部）
  wheel(rx - 30, rbase - 9);
  wheel(rx + 23, rbase - 9);

  // 顶部传感器：激光雷达（左）+ 摄像头（右）
  // 激光雷达
  px(ctx, rx - 24, rbase - 27, 7, 5, P.epBody); // 底座
  px(ctx, rx - 23, rbase - 31, 5, 4, P.epGray); // 立柱
  px(ctx, rx - 25, rbase - 33, 9, 3, P.outline); // 旋转头
  px(ctx, rx - 24, rbase - 32, 7, 1, P.epRed);
  px(ctx, rx - 24, rbase - 32, 3, 1, adj(P.epRed, 50));
  // 摄像头模块
  px(ctx, rx + 15, rbase - 27, 11, 8, P.outline);
  px(ctx, rx + 16, rbase - 26, 9, 6, P.epBody);
  px(ctx, rx + 18, rbase - 24, 6, 3, P.epBlue); // 镜头
  px(ctx, rx + 19, rbase - 23, 3, 1, adj(P.epBlue, 50));

  // === 多关节机械臂（视觉焦点，待机姿态：举起的折臂）===
  // 旋转底座
  px(ctx, rx - 7, rbase - 28, 14, 6, P.outline);
  px(ctx, rx - 6, rbase - 27, 12, 5, P.metalDark);
  px(ctx, rx - 6, rbase - 27, 12, 1, P.metalLight);
  // 肩关节
  px(ctx, rx - 3, rbase - 35, 9, 9, P.outline);
  px(ctx, rx - 2, rbase - 34, 7, 7, P.metal);
  px(ctx, rx - 2, rbase - 34, 7, 1, P.metalLight);
  px(ctx, rx + 1, rbase - 31, 2, 2, P.epRed); // 关节灯
  // 大臂（向上偏右）
  px(ctx, rx + 3, rbase - 46, 6, 13, P.outline);
  px(ctx, rx + 4, rbase - 45, 4, 11, P.metalDark);
  px(ctx, rx + 4, rbase - 45, 4, 1, P.metal);
  // 肘关节
  px(ctx, rx + 1, rbase - 51, 9, 8, P.outline);
  px(ctx, rx + 2, rbase - 50, 7, 6, P.metal);
  px(ctx, rx + 2, rbase - 50, 7, 1, P.metalLight);
  // 小臂（向右上斜）
  px(ctx, rx + 7, rbase - 60, 5, 11, P.outline);
  px(ctx, rx + 8, rbase - 59, 3, 9, P.metalDark);
  px(ctx, rx + 8, rbase - 59, 3, 1, P.metal);
  // 腕关节
  px(ctx, rx + 6, rbase - 63, 7, 5, P.outline);
  px(ctx, rx + 7, rbase - 62, 5, 3, P.metal);
  // 末端双爪夹爪（张开待机）
  px(ctx, rx + 11, rbase - 68, 3, 7, P.outline); // 上爪
  px(ctx, rx + 12, rbase - 67, 1, 6, P.metalDark);
  px(ctx, rx + 15, rbase - 68, 3, 7, P.outline); // 下爪
  px(ctx, rx + 16, rbase - 67, 1, 6, P.metalDark);
  px(ctx, rx + 11, rbase - 68, 7, 2, P.metalDark); // 爪根
  px(ctx, rx + 13, rbase - 64, 2, 1, P.epBlue); // 工作灯
}

// --- 宝箱（右下角，GitHub） ---
function drawChest(ctx: Ctx, P: Pal, t: number) {
  const x = 358, y = 226, w = 70, h = 44;
  shadow(ctx, x + 4, y + h - 2, w, 5, 0.3);
  // 箱体
  px(ctx, x, y + 14, w, h - 14, P.chest);
  px(ctx, x, y + 14, w, 2, adj(P.chest, 16));
  px(ctx, x, y + 14, 2, h - 14, P.chestDark);
  px(ctx, x + w - 2, y + 14, 2, h - 14, P.chestDark);
  // 金属包边
  px(ctx, x, y + 18, w, 3, P.gold);
  px(ctx, x, y + 18, w, 1, P.goldLight);
  px(ctx, x, y + h - 6, w, 3, P.gold);
  // 盖子（半开）
  const lidLift = 6;
  px(ctx, x, y - lidLift, w, 16 + lidLift, P.chest);
  px(ctx, x, y - lidLift, w, 3, P.gold);
  px(ctx, x, y - lidLift, w, 1, P.goldLight);
  px(ctx, x, y - lidLift, 2, 16 + lidLift, P.chestDark);
  px(ctx, x + w - 2, y - lidLift, 2, 16 + lidLift, P.chestDark);
  // 内部金光（开口处）
  px(ctx, x + 3, y + 10, w - 6, 6, '#3a2a10');
  radial(ctx, x + w / 2, y + 12, 16, 'rgba(255,210,120,0.9)', 'rgba(255,210,120,0)');
  // 锁
  px(ctx, x + w / 2 - 4, y + 14, 8, 8, P.gold);
  px(ctx, x + w / 2 - 3, y + 15, 6, 6, P.goldLight);
  px(ctx, x + w / 2 - 1, y + 17, 2, 3, P.chestDark);
  // 闪烁星光（浮动）
  const sp = Math.sin(t * 2) * 0.5 + 0.5;
  px(ctx, x + 14, y - 2 - Math.floor(sp * 3), 2, 2, '#fff6c8');
  px(ctx, x + w - 16, y - 6 - Math.floor(sp * 4), 1, 1, '#fff6c8');
}

// --- 盆栽 ---
function drawPlant(ctx: Ctx, P: Pal, x: number, y: number, scale = 1) {
  const s = scale;
  shadow(ctx, x + 2 * s, y + 12 * s, 16 * s, 4, 0.22);
  // 花盆
  px(ctx, x, y + 8 * s, 16 * s, 8 * s, P.pot);
  px(ctx, x, y + 8 * s, 16 * s, 2 * s, P.potDark);
  px(ctx, x + 1 * s, y + 14 * s, 14 * s, 2 * s, P.potDark);
  px(ctx, x, y + 8 * s, 1 * s, 8 * s, adj(P.pot, -20));
  px(ctx, x + 15 * s, y + 8 * s, 1 * s, 8 * s, adj(P.pot, -20));
  // 叶子簇
  const leaf = (lx: number, ly: number, lw: number, lh: number, c: string) =>
    px(ctx, x + lx * s, y + ly * s, lw * s, lh * s, c);
  leaf(5, -6, 6, 8, P.leaf);
  leaf(2, -2, 5, 6, P.leafDark);
  leaf(9, -2, 5, 6, P.leafDark);
  leaf(3, -8, 4, 5, P.leafLight);
  leaf(8, -9, 4, 5, P.leafLight);
  leaf(6, -10, 4, 4, P.leafLight);
  px(ctx, x + 6 * s, y - 11 * s, 4 * s, 1 * s, adj(P.leafLight, 30));
}

// === 夜晚辉光叠加 ===
function drawNightGlow(ctx: Ctx, P: Pal, t: number, panX: number) {
  const pulse = 0.85 + Math.sin(t * 1.6) * 0.15;
  // 显示器蓝光（场景内，随平移偏移）
  radial(ctx, 364 - panX, 78, 70 * pulse, 'rgba(125,211,192,0.45)', 'rgba(125,211,192,0)');
  // 台灯暖光
  const flick = 0.9 + Math.sin(t * 5) * 0.05 + Math.sin(t * 13) * 0.03;
  radial(ctx, 416 - panX, 80, 56 * flick, 'rgba(255,200,120,0.45)', 'rgba(255,200,120,0)');
  // 宝箱金光（微弱）
  radial(ctx, 392 - panX, 244, 34, 'rgba(255,210,120,0.22)', 'rgba(255,210,120,0)');
  // 暗角（视口级，不随平移）
  radial(ctx, LW / 2, LH / 2 + 30, 320, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.32)', 'source-over');
  void P;
}

// === 悬浮高亮 ===
function drawHover(ctx: Ctx, hit: { x: number; y: number; w: number; h: number }, t: number) {
  const pulse = 0.55 + Math.sin(t * 5) * 0.45;
  ctx.save();
  // 描边
  ctx.strokeStyle = `rgba(232,177,102,${Math.min(1, pulse + 0.3)})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(hit.x + 0.5, hit.y + 0.5, hit.w - 1, hit.h - 1);
  // 四角小标记
  const c = 4;
  const col = `rgba(255,210,138,${Math.min(1, pulse + 0.2)})`;
  [
    [hit.x, hit.y],
    [hit.x + hit.w - c, hit.y],
    [hit.x, hit.y + hit.h - c],
    [hit.x + hit.w - c, hit.y + hit.h - c],
  ].forEach(([cx, cy]) => px(ctx, cx, cy, c, c, col));
  // 内部微亮
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = `rgba(232,177,102,${0.08 * pulse})`;
  ctx.fillRect(hit.x, hit.y, hit.w, hit.h);
  ctx.restore();
}

// ============================================================
//  热点（可点击区域） + 场景组装
// ============================================================

type Hotspot = {
  id: string;
  tipZh: string;
  tipEn: string;
  action: string;
  external?: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
};

const HOTSPOTS: Hotspot[] = [
  { id: 'chest', tipZh: 'GitHub 仓库', tipEn: 'GitHub', action: 'https://github.com/learnerCodeZ', external: true, x: 354, y: 214, w: 78, h: 60 },
  { id: 'robot', tipZh: '机器人项目', tipEn: 'Robotics', action: '/projects#ep-navigation', x: 14, y: 144, w: 156, h: 122 },
  { id: 'desk', tipZh: '关于我', tipEn: 'About', action: '/about', x: 286, y: 50, w: 152, h: 140 },
  { id: 'bookshelf', tipZh: '博客文章', tipEn: 'Blog', action: '/blog', x: 12, y: 22, w: 82, h: 110 },
  { id: 'board', tipZh: '留言板', tipEn: 'Guestbook', action: '/guestbook', x: 174, y: 10, w: 100, h: 56 },
];

// 绘制顺序（后到前）。墙/地板先，再按 base y 排序物体。
function drawScene(ctx: Ctx, P: Pal, day: boolean, t: number) {
  drawWall(ctx, P);
  drawWindow(ctx, P, day);
  drawWallPoster(ctx, P);
  drawBoard(ctx, P);
  drawFloor(ctx, P);
  drawRug(ctx, P);
  drawBookshelf(ctx, P);
  drawPlant(ctx, P, 102, 116, 1); // 书架旁小盆栽
  drawDesk(ctx, P, t);
  drawRobotBench(ctx, P);
  drawChest(ctx, P, t);
  drawPlant(ctx, P, 296, 250, 0.9); // 前景小盆栽
}

// ============================================================
//  初始化
// ============================================================

export function initRoomPixel(container: HTMLElement): () => void {
  const [canvas, ctx] = createCanvas(LW, LH);
  canvas.className = 'room-pixel-canvas';

  // 舞台：包裹 canvas + 左右平移按钮（房间比视口宽，可左右探索）
  const stage = document.createElement('div');
  stage.className = 'room-stage';
  const mkPan = (side: 'left' | 'right') => {
    const b = document.createElement('button');
    b.className = `room-pan room-pan-${side}`;
    b.type = 'button';
    b.setAttribute('aria-label', side === 'left' ? '往左看' : '往右看');
    b.textContent = side === 'left' ? '◀' : '▶';
    return b;
  };
  const panLeft = mkPan('left');
  const panRight = mkPan('right');
  stage.appendChild(canvas);
  stage.appendChild(panLeft);
  stage.appendChild(panRight);
  container.appendChild(stage);

  // 离屏静态场景（比视口宽，可平移）
  const [sceneCanvas, sceneCtx] = createCanvas(SCENE_W, LH);
  const MAX_PAN = SCENE_W - LW;

  let isDay = document.documentElement.classList.contains('light'); // 亮色主题 = 白天
  let P = pal(isDay);
  let hovered: Hotspot | null = null;
  let panX = 0; // 当前平移（场景坐标偏移）
  let panTarget = 0; // 目标平移
  let raf = 0;

  const rebuildScene = () => {
    P = pal(isDay);
    sceneCtx.clearRect(0, 0, SCENE_W, LH);
    drawScene(sceneCtx, P, isDay, performance.now() / 1000);
  };
  rebuildScene();

  const updatePanButtons = () => {
    panLeft.disabled = panTarget <= 0.5;
    panRight.disabled = panTarget >= MAX_PAN - 0.5;
  };
  const setPan = (v: number) => {
    panTarget = Math.max(0, Math.min(MAX_PAN, v));
    updatePanButtons();
  };
  updatePanButtons();

  // 仅在「夜晚 / 悬浮 / 平移中」跑 RAF；动画结束自动停，省电。
  const isAnimating = () => !isDay || !!hovered || Math.abs(panTarget - panX) > 0.3;
  const renderFrame = () => {
    const t = performance.now() / 1000;
    // 平移缓动
    if (Math.abs(panTarget - panX) > 0.3) {
      panX += (panTarget - panX) * 0.18;
      if (Math.abs(panTarget - panX) <= 0.3) panX = panTarget;
    }
    const ox = Math.round(panX);
    ctx.clearRect(0, 0, LW, LH);
    ctx.drawImage(sceneCanvas, -ox, 0);
    if (!isDay) drawNightGlow(ctx, P, t, ox);
    if (hovered) drawHover(ctx, { x: hovered.x - ox, y: hovered.y, w: hovered.w, h: hovered.h }, t);
  };
  const startLoop = () => {
    if (raf) return;
    const loop = () => {
      renderFrame();
      raf = isAnimating() ? requestAnimationFrame(loop) : 0;
    };
    raf = requestAnimationFrame(loop);
  };
  const stopLoop = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
  const updateLoop = () => {
    if (isAnimating()) startLoop();
    else {
      stopLoop();
      renderFrame();
    }
  };
  updateLoop();

  // 坐标转换：客户端 → 视口逻辑坐标
  const toLogical = (clientX: number, clientY: number) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / r.width) * LW,
      y: ((clientY - r.top) / r.height) * LH,
    };
  };

  const tip = document.getElementById('roomTip');

  const pick = (clientX: number, clientY: number) => {
    const { x, y } = toLogical(clientX, clientY);
    const sx = x + panX; // 视口坐标 + 平移 = 场景坐标
    for (const h of HOTSPOTS) {
      if (sx >= h.x && sx <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h;
    }
    return null;
  };

  const onMove = (e: MouseEvent) => {
    const h = pick(e.clientX, e.clientY);
    canvas.style.cursor = h ? 'pointer' : 'default';
    if (h !== hovered) {
      hovered = h;
      updateLoop();
    }
    if (h && tip) {
      tip.textContent = document.documentElement.lang === 'en' ? h.tipEn : h.tipZh;
      tip.style.display = 'block';
      tip.style.left = `${e.clientX + 14}px`;
      tip.style.top = `${e.clientY + 14}px`;
    } else if (tip) {
      tip.style.display = 'none';
    }
  };

  const onLeave = () => {
    hovered = null;
    updateLoop();
    canvas.style.cursor = 'default';
    if (tip) tip.style.display = 'none';
  };

  const onClick = (e: MouseEvent) => {
    const h = pick(e.clientX, e.clientY);
    if (!h) return;
    if (h.external) {
      window.open(h.action, '_blank', 'noopener');
    } else {
      window.location.href = import.meta.env.BASE_URL.replace(/\/$/, '') + h.action;
    }
  };

  // 左右按钮：每次平移一整段（右侧目前是预留的空地）
  const PAN_STEP = Math.min(LW, MAX_PAN);
  panLeft.addEventListener('click', () => { setPan(panTarget - PAN_STEP); updateLoop(); });
  panRight.addEventListener('click', () => { setPan(panTarget + PAN_STEP); updateLoop(); });

  // 滚轮：水平平移（在画布上时拦截页面滚动）
  const onWheel = (e: WheelEvent) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (delta === 0) return;
    e.preventDefault();
    setPan(panTarget + delta * 0.6);
    updateLoop();
  };
  canvas.addEventListener('wheel', onWheel, { passive: false });

  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseleave', onLeave);
  canvas.addEventListener('click', onClick);

  // 触摸：横滑平移，轻点触发热点（用位移阈值区分）
  let touchStartX = 0;
  let touchStartPan = 0;
  let touchMoved = false;
  canvas.addEventListener('touchstart', (e) => {
    const t0 = e.touches[0];
    if (!t0) return;
    touchStartX = t0.clientX;
    touchStartPan = panTarget;
    touchMoved = false;
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    const t0 = e.touches[0];
    if (!t0) return;
    const dx = t0.clientX - touchStartX;
    if (Math.abs(dx) > 6) {
      touchMoved = true;
      const r = canvas.getBoundingClientRect();
      setPan(touchStartPan - (dx / r.width) * LW);
      updateLoop();
    }
  }, { passive: true });
  canvas.addEventListener('touchend', (e) => {
    if (touchMoved) return; // 是平移手势
    const t0 = e.changedTouches[0];
    if (!t0) return;
    const h = pick(t0.clientX, t0.clientY);
    if (h) {
      if (h.external) window.open(h.action, '_blank', 'noopener');
      else window.location.href = import.meta.env.BASE_URL.replace(/\/$/, '') + h.action;
    }
  });

  // 昼夜联动（修正了原版 isDay 取反的 bug：亮色主题 = 白天）
  const obs = new MutationObserver(() => {
    const d = document.documentElement.classList.contains('light');
    if (d !== isDay) {
      isDay = d;
      rebuildScene();
      updateLoop();
    }
  });
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  return () => {
    cancelAnimationFrame(raf);
    obs.disconnect();
    canvas.removeEventListener('mousemove', onMove);
    canvas.removeEventListener('mouseleave', onLeave);
    canvas.removeEventListener('click', onClick);
    canvas.removeEventListener('wheel', onWheel);
    if (stage.parentNode === container) container.removeChild(stage);
  };
}
