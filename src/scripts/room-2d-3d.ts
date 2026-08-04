/**
 * 像素房间 v3b —— 修正比例 + Group 统一缩放
 */

import * as THREE from 'three';

type Ctx = CanvasRenderingContext2D;

function createCanvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

function toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function px(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function adj(hex: string, amt: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const cl = (v: number) => Math.max(0, Math.min(255, v + amt)).toString(16).padStart(2, '0');
  return `#${cl(r)}${cl(g)}${cl(b)}`;
}

function pal(day: boolean) {
  const d = day;
  return {
    wall: d ? '#ede4d3' : '#2c2a30', wallDark: d ? '#d8d0c0' : '#222228', wallLight: d ? '#f5efe2' : '#333338',
    floor: d ? '#c4b498' : '#3a342e', floorDark: d ? '#b0a088' : '#2e2822', floorLine: d ? '#d4c4a8' : '#46403a',
    desk: d ? '#7a7874' : '#5a5854', deskTop: d ? '#969490' : '#6a6864', deskDark: d ? '#5a5854' : '#3a3834',
    laptop: d ? '#2a2a2e' : '#0e0f11', screen: '#7dd3c0',
    chair: d ? '#2a2a2e' : '#1a1a1e', chairLight: d ? '#3a3a3e' : '#2a2a2e',
    ep: d ? '#1a1a1e' : '#0e0f11', epRed: '#d02828', epBlue: '#2848d0', epGray: d ? '#3a3a3e' : '#2a2a2e',
    window: d ? '#a8d8f0' : '#1a2540', windowLight: d ? '#c8e8ff' : '#0a1525', windowFrame: '#5a5a5a',
    rug: d ? '#4a5870' : '#2a3040', rugDark: d ? '#3a4860' : '#1a2030',
    door: d ? '#6b4f3a' : '#3a2a1e', doorDark: d ? '#4a3528' : '#2a1f18',
    cabinet: d ? '#6a6864' : '#4a4844', cabinetDark: d ? '#4a4844' : '#3a3834',
    shelf: d ? '#7a7874' : '#5a5854', shelfDark: d ? '#5a5854' : '#3a3834',
    posterRed: '#c02020', posterBlue: '#2030a0',
    board: '#8a6a4a', boardDark: '#6a4a3a',
    note1: '#e8d068', note2: '#f0a8a8', note3: '#8ad0a0', note4: '#a8c8f0',
    accent: '#e8b166', outline: '#1a1a1e',
    bookColors: ['#c04040', '#4060c0', '#40a040', '#c0a040', '#a040c0', '#40c0a0'],
  };
}

type Pal = ReturnType<typeof pal>;

// === 精灵绘制（固定尺寸，比例正确）===

function drawFloor(ctx: Ctx, P: Pal) {
  ctx.clearRect(0, 0, 1024, 384);
  const tile = 16;
  for (let y = 0; y < 384; y += tile)
    for (let x = 0; x < 1024; x += tile) {
      const c = (Math.floor(x / tile) + Math.floor(y / tile)) % 2;
      px(ctx, x, y, tile, tile, c ? P.floor : P.floorDark);
      px(ctx, x, y, tile, 1, P.floorLine);
      px(ctx, x, y, 1, tile, P.floorLine);
    }
}

function drawWall(ctx: Ctx, P: Pal) {
  ctx.clearRect(0, 0, 1024, 384);
  px(ctx, 0, 0, 1024, 384, P.wall);
  for (let y = 8; y < 384; y += 12) {
    px(ctx, 0, y, 1024, 1, P.wallLight);
    px(ctx, 0, y + 1, 1024, 1, P.wallDark);
  }
  px(ctx, 0, 380, 1024, 4, P.wallDark);
}

function drawWindow(ctx: Ctx, P: Pal, day: boolean) {
  ctx.clearRect(0, 0, 80, 64);
  px(ctx, 0, 0, 80, 64, P.windowFrame);
  px(ctx, 3, 3, 74, 58, P.window);
  px(ctx, 3, 3, 74, 14, P.windowLight);
  if (!day) {
    px(ctx, 10, 8, 14, 14, '#f0f0d0'); px(ctx, 12, 6, 10, 2, '#f0f0d0'); px(ctx, 12, 22, 10, 2, '#f0f0d0');
    px(ctx, 42, 10, 2, 2, '#f0f0d0'); px(ctx, 54, 16, 2, 2, '#f0f0d0'); px(ctx, 34, 24, 1, 1, '#f0f0d0');
  }
  px(ctx, -2, 60, 84, 5, P.windowFrame);
}

function drawPoster(ctx: Ctx, P: Pal) {
  ctx.clearRect(0, 0, 40, 52);
  px(ctx, 0, 0, 40, 52, P.outline);
  px(ctx, 2, 2, 36, 48, P.posterRed);
  px(ctx, 5, 8, 30, 16, P.posterRed); px(ctx, 5, 8, 30, 2, adj(P.posterRed, 25));
  px(ctx, 8, 24, 24, 16, P.posterBlue);
  px(ctx, 12, 3, 16, 6, P.posterRed);
  px(ctx, 14, 5, 3, 3, '#fff'); px(ctx, 23, 5, 3, 3, '#fff');
}

function drawShelf(ctx: Ctx, P: Pal) {
  ctx.clearRect(0, 0, 80, 64);
  px(ctx, 0, 0, 80, 64, P.outline);
  px(ctx, 2, 2, 76, 60, P.shelf);
  px(ctx, 4, 4, 72, 56, P.wallDark);
  [18, 36, 52].forEach(g => { px(ctx, 4, g, 72, 3, P.shelf); px(ctx, 4, g, 72, 1, adj(P.shelf, 20)); });
  P.bookColors.forEach((c, i) => {
    const x = 6 + i * 6;
    px(ctx, x, 19 - i % 2, 3, 14 - i % 2, c); px(ctx, x, 19 - i % 2, 3, 1, adj(c, 30));
    px(ctx, x + 30, 37 - i % 3, 3, 12 - i % 2, P.bookColors[(i + 2) % 6]);
  });
  px(ctx, 64, 48, 8, 8, '#4a8a4a'); px(ctx, 66, 44, 4, 4, '#5aaa5a');
  px(ctx, 62, 54, 12, 4, '#6a5a4a');
}

function drawBoard(ctx: Ctx, P: Pal) {
  ctx.clearRect(0, 0, 80, 56);
  px(ctx, 0, 0, 80, 56, P.outline);
  px(ctx, 2, 2, 76, 52, P.boardDark);
  px(ctx, 4, 4, 72, 48, P.board);
  const notes: [number, number, number, number, string][] = [
    [8, 6, 18, 14, P.note1], [34, 8, 18, 14, P.note2],
    [14, 28, 18, 14, P.note3], [42, 30, 18, 14, P.note4],
  ];
  notes.forEach(([nx, ny, nw, nh, nc]) => {
    px(ctx, nx + 1, ny + nh, nw, 1, 'rgba(0,0,0,0.2)');
    px(ctx, nx, ny, nw, nh, nc); px(ctx, nx, ny, nw, 1, adj(nc, 25));
    px(ctx, nx + nw / 2, ny, 2, 2, '#d04040');
  });
}

function drawDesk(ctx: Ctx, P: Pal) {
  ctx.clearRect(0, 0, 280, 120);
  // 桌面
  px(ctx, 0, 0, 280, 12, P.deskTop);
  px(ctx, 0, 0, 280, 2, adj(P.deskTop, 20)); px(ctx, 0, 11, 280, 1, adj(P.deskTop, -20));
  // 桌身
  px(ctx, 0, 12, 280, 24, P.desk); px(ctx, 0, 12, 280, 1, adj(P.desk, 15));
  // 桌腿
  px(ctx, 8, 36, 10, 84, P.deskDark); px(ctx, 262, 36, 10, 84, P.deskDark); px(ctx, 135, 36, 10, 84, P.deskDark);
  px(ctx, 0, 0, 280, 1, P.outline); px(ctx, 0, 0, 1, 120, P.outline); px(ctx, 279, 0, 1, 120, P.outline);
}

function drawLaptop(ctx: Ctx, P: Pal) {
  ctx.clearRect(0, 0, 100, 76);
  px(ctx, 0, 70, 100, 6, P.laptop); px(ctx, 0, 70, 100, 1, adj(P.laptop, 20));
  px(ctx, 6, 0, 88, 72, P.laptop);
  px(ctx, 8, 2, 84, 68, '#0a1a18'); px(ctx, 8, 2, 84, 68, P.screen);
  px(ctx, 10, 4, 30, 2, 'rgba(255,255,255,0.5)');
  px(ctx, 10, 8, 42, 2, 'rgba(255,255,255,0.3)');
  px(ctx, 10, 12, 24, 2, 'rgba(255,255,255,0.4)');
  px(ctx, 10, 16, 36, 2, 'rgba(255,255,255,0.25)');
  px(ctx, 10, 20, 18, 2, 'rgba(255,255,255,0.35)');
  px(ctx, 10, 24, 28, 2, 'rgba(255,255,255,0.2)');
  px(ctx, 8, 2, 84, 1, 'rgba(255,255,255,0.15)');
  px(ctx, 6, 0, 88, 1, P.outline); px(ctx, 5, 0, 1, 72, P.outline); px(ctx, 94, 0, 1, 72, P.outline);
}

function drawTablet(ctx: Ctx, P: Pal) {
  ctx.clearRect(0, 0, 44, 34);
  px(ctx, 0, 0, 44, 34, P.outline);
  px(ctx, 2, 2, 40, 30, P.laptop);
  px(ctx, 3, 3, 38, 28, P.screen);
  px(ctx, 4, 4, 16, 1, 'rgba(255,255,255,0.3)');
}

function drawChair(ctx: Ctx, P: Pal) {
  ctx.clearRect(0, 0, 44, 68);
  // 椅背
  px(ctx, 4, 0, 36, 30, P.outline); px(ctx, 6, 2, 32, 26, P.chair); px(ctx, 6, 2, 32, 2, P.chairLight);
  // 座椅
  px(ctx, 0, 30, 44, 10, P.outline); px(ctx, 2, 32, 40, 6, P.chair); px(ctx, 2, 32, 40, 1, P.chairLight);
  // 中柱
  px(ctx, 20, 40, 4, 12, P.chairLight);
  // 五星脚
  px(ctx, 2, 52, 40, 5, P.outline); px(ctx, 4, 53, 36, 3, P.chair); px(ctx, 20, 46, 4, 12, P.chairLight);
  // 轮子
  px(ctx, 2, 57, 4, 4, P.outline); px(ctx, 38, 57, 4, 4, P.outline);
}

function drawEP(ctx: Ctx, P: Pal) {
  ctx.clearRect(0, 0, 52, 44);
  px(ctx, 4, 24, 44, 10, P.outline); px(ctx, 6, 26, 40, 6, P.ep); px(ctx, 6, 26, 40, 1, adj(P.ep, 20));
  px(ctx, 0, 30, 8, 8, P.outline); px(ctx, 2, 32, 4, 4, P.epGray);
  px(ctx, 44, 30, 8, 8, P.outline); px(ctx, 46, 32, 4, 4, P.epGray);
  px(ctx, 6, 18, 40, 4, P.outline); px(ctx, 8, 19, 36, 2, P.epRed);
  px(ctx, 6, 22, 40, 2, P.epBlue);
  px(ctx, 10, 19, 2, 2, P.accent); px(ctx, 40, 19, 2, 2, P.accent);
  px(ctx, 18, 6, 16, 14, P.outline); px(ctx, 20, 8, 12, 10, P.ep);
  px(ctx, 22, 10, 8, 6, P.epGray); px(ctx, 24, 12, 4, 2, P.accent);
  px(ctx, 38, 4, 4, 22, P.outline); px(ctx, 39, 5, 2, 20, P.ep);
  px(ctx, 38, 2, 12, 4, P.outline); px(ctx, 40, 3, 8, 2, P.ep);
  px(ctx, 48, 2, 2, 8, P.epGray); px(ctx, 50, 2, 2, 8, P.epGray);
}

function drawCabinet(ctx: Ctx, P: Pal) {
  ctx.clearRect(0, 0, 88, 64);
  px(ctx, 0, 0, 88, 64, P.outline);
  px(ctx, 2, 2, 84, 60, P.cabinet);
  for (let i = 0; i < 4; i++) {
    const x = 4 + i * 21;
    px(ctx, x, 4, 19, 56, P.cabinetDark);
    px(ctx, x, 4, 19, 1, adj(P.cabinet, 15));
    px(ctx, x + 18, 4, 1, 56, P.outline);
    px(ctx, x + 14, 32, 3, 3, P.accent);
  }
}

function drawRug(ctx: Ctx, P: Pal) {
  const w = 200, h = 56;
  ctx.clearRect(0, 0, w, h);
  for (let y = 0; y < h; y++) {
    const hw = Math.sqrt(1 - Math.pow((y - h / 2) / (h / 2), 2)) * w / 2;
    const sx = Math.round(w / 2 - hw), ex = Math.round(w / 2 + hw);
    px(ctx, sx, y, ex - sx, 1, P.rug);
  }
  for (let y = 3; y < h - 3; y++) {
    const hw = Math.sqrt(1 - Math.pow((y - h / 2) / (h / 2), 2)) * w / 2;
    const sx = Math.round(w / 2 - hw), ex = Math.round(w / 2 + hw);
    if (y < 5 || y >= h - 5) { px(ctx, sx, y, Math.min(3, ex - sx), 1, P.accent); px(ctx, ex - 3, y, 3, 1, P.accent); }
  }
  px(ctx, w / 2 - 24, h / 2 - 1, 48, 2, adj(P.rug, 15));
}

function drawDoor(ctx: Ctx, P: Pal) {
  ctx.clearRect(0, 0, 36, 64);
  px(ctx, 0, 0, 36, 64, P.outline);
  px(ctx, 2, 2, 32, 60, P.door);
  px(ctx, 4, 4, 28, 56, P.doorDark);
  px(ctx, 4, 4, 28, 1, adj(P.door, 20));
  px(ctx, 26, 32, 3, 3, P.accent); px(ctx, 26, 32, 3, 1, adj(P.accent, 30));
}

// === 主初始化 ===

export function initRoom2D(container: HTMLElement): () => void {
  const W = container.clientWidth;
  const H = container.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 1000);
  camera.position.set(0, 0, 100);

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  let isDay = !document.documentElement.classList.contains('light');
  scene.background = new THREE.Color(isDay ? 0xede4d3 : 0x1a1a1e);

  const screenLight = new THREE.PointLight(0x7dd3c0, isDay ? 0 : 1, 1000);
  scene.add(screenLight);
  scene.add(new THREE.AmbientLight(0xffffff, 1));

  // 场景 group（统一缩放用）
  const roomGroup = new THREE.Group();
  scene.add(roomGroup);

  function makePlane(tex: THREE.Texture, w: number, h: number, x: number, y: number, z: number) {
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(x, y, z);
    roomGroup.add(mesh);
    return mesh;
  }

  let hotspotData: { mesh: THREE.Mesh; id: string; tipZh: string; tipEn: string; action: string }[] = [];

  function buildScene() {
    // 清空
    while (roomGroup.children.length > 0) roomGroup.remove(roomGroup.children[0]);
    hotspotData = [];
    const P = pal(isDay);
    scene.background = new THREE.Color(isDay ? 0xede4d3 : 0x1a1a1e);

    // === 坐标系统（以屏幕中心为原点） ===
    // 墙：上半部分（y: 0 ~ 300）
    // 地板：下半部分（y: -300 ~ 0）

    // 墙（窄，占上方 30%）
    const [wc, wctx] = createCanvas(1024, 384);
    drawWall(wctx, P);
    makePlane(toTexture(wc), W * 1.2, H * 0.3, 0, H * 0.4, -50);

    // 地板（大，占下方 70%）
    const [fc, fctx] = createCanvas(1024, 384);
    drawFloor(fctx, P);
    const floorMesh = makePlane(toTexture(fc), W * 1.2, H * 0.7, 0, -H * 0.18, -30);
    floorMesh.rotation.x = -Math.PI / 2;

    // 窗户（高和墙一样高）
    const [winc, winx] = createCanvas(80, 64);
    drawWindow(winx, P, isDay);
    makePlane(toTexture(winc), W * 0.18, H * 0.28, -W * 0.25, H * 0.4, -48);

    // 海报
    const [pc, pctx] = createCanvas(40, 52);
    drawPoster(pctx, P);
    makePlane(toTexture(pc), W * 0.06, H * 0.08, -W * 0.04, H * 0.3, -48);

    // 书架
    const [sc, sctx] = createCanvas(80, 64);
    drawShelf(sctx, P);
    makePlane(toTexture(sc), W * 0.1, H * 0.1, W * 0.08, H * 0.28, -48);

    // 留言板
    const [bc, bctx] = createCanvas(80, 56);
    drawBoard(bctx, P);
    const boardMesh = makePlane(toTexture(bc), W * 0.08, H * 0.07, W * 0.23, H * 0.35, -48);
    hotspotData.push({ mesh: boardMesh, id: 'board', tipZh: '留言板', tipEn: 'Message Board', action: '/guestbook' });

    // 地毯
    const [rc, rctx] = createCanvas(200, 56);
    drawRug(rctx, P);
    makePlane(toTexture(rc), W * 0.22, H * 0.08, 0, -H * 0.3, -10);

    // 桌子（更小，靠墙）
    const [dc, dctx] = createCanvas(280, 120);
    drawDesk(dctx, P);
    makePlane(toTexture(dc), W * 0.2, H * 0.15, 0, -H * 0.04, -25);

    // 笔电
    const [lc, lctx] = createCanvas(100, 76);
    drawLaptop(lctx, P);
    makePlane(toTexture(lc), W * 0.1, H * 0.11, -W * 0.05, H * 0.05, -20);

    // 平板
    const [tc, tctx] = createCanvas(44, 34);
    drawTablet(tctx, P);
    makePlane(toTexture(tc), W * 0.05, H * 0.05, W * 0.05, H * 0.02, -20);

    // 椅子
    const [cc, cctx] = createCanvas(44, 68);
    drawChair(cctx, P);
    makePlane(toTexture(cc), W * 0.05, H * 0.1, 0, -H * 0.1, -15);

    // EP
    const [ec, ectx] = createCanvas(52, 44);
    drawEP(ectx, P);
    const epMesh = makePlane(toTexture(ec), W * 0.06, H * 0.07, W * 0.15, -H * 0.15, -10);
    hotspotData.push({ mesh: epMesh, id: 'ep', tipZh: 'EP小车', tipEn: 'EP Robot', action: '/projects#ep-navigation' });

    // 矮柜
    const [vc, vctx] = createCanvas(88, 64);
    drawCabinet(vctx, P);
    makePlane(toTexture(vc), W * 0.1, H * 0.1, -W * 0.2, -H * 0.18, -20);

    // 门（在墙上）
    const [drc, drx] = createCanvas(36, 64);
    drawDoor(drx, P);
    const doorMesh = makePlane(toTexture(drc), W * 0.05, H * 0.2, W * 0.38, H * 0.36, -48);
    hotspotData.push({ mesh: doorMesh, id: 'door', tipZh: '返回主页', tipEn: 'Home', action: '/' });

    // 晚上灯
    screenLight.intensity = isDay ? 0 : 1;
    screenLight.position.set(0, 0, 50);
  }

  buildScene();

  // === 交互 ===
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function setPointer(e: MouseEvent) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }

  renderer.domElement.addEventListener('mousemove', (e) => {
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const meshes = hotspotData.map(h => h.mesh);
    const hits = raycaster.intersectObjects(meshes);
    renderer.domElement.style.cursor = hits.length ? 'pointer' : 'default';
    const tip = document.getElementById('roomTip');
    meshes.forEach(m => (m.material as THREE.MeshBasicMaterial).color.setHex(0xffffff));
    if (hits.length) {
      const h = hotspotData.find(d => d.mesh === hits[0].object)!;
      (h.mesh.material as THREE.MeshBasicMaterial).color.setHex(0xfff0d0);
      if (tip) {
        tip.textContent = document.documentElement.lang === 'en' ? h.tipEn : h.tipZh;
        tip.style.display = 'block';
        tip.style.left = `${e.clientX + 14}px`;
        tip.style.top = `${e.clientY + 14}px`;
      }
    } else if (tip) tip.style.display = 'none';
  });

  renderer.domElement.addEventListener('click', (e) => {
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(hotspotData.map(h => h.mesh));
    if (hits.length) {
      const h = hotspotData.find(d => d.mesh === hits[0].object)!;
      window.location.href = import.meta.env.BASE_URL.replace(/\/$/, '') + h.action;
    }
  });

  renderer.domElement.addEventListener('mouseleave', () => {
    hotspotData.forEach(h => (h.mesh.material as THREE.MeshBasicMaterial).color.setHex(0xffffff));
    const tip = document.getElementById('roomTip');
    if (tip) tip.style.display = 'none';
  });

  // 昼夜
  const obs = new MutationObserver(() => {
    const d = !document.documentElement.classList.contains('light');
    if (d !== isDay) { isDay = d; buildScene(); }
  });
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  // 渲染
  let raf = 0;
  const loop = () => { raf = requestAnimationFrame(loop); renderer.render(scene, camera); };
  loop();

  const onResize = () => {
    const w = container.clientWidth, h = container.clientHeight;
    camera.left = -w / 2; camera.right = w / 2; camera.top = h / 2; camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    buildScene();
  };
  window.addEventListener('resize', onResize);

  return () => {
    cancelAnimationFrame(raf);
    obs.disconnect();
    window.removeEventListener('resize', onResize);
    renderer.dispose();
    if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
  };
}
