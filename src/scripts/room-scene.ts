import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * 3D 房间 —— 纯 Three.js（命令式）。
 * 布局：后墙（窗）+ 左墙 + 地板；长桌贴后墙、左端延伸到左墙角。
 */
export function initRoom(container: HTMLElement): () => void {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    55,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(3.5, 3.2, 3.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.minDistance = 2;
  controls.maxDistance = 7;
  controls.minPolarAngle = Math.PI / 4;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.minAzimuthAngle = -Math.PI / 3;
  controls.maxAzimuthAngle = Math.PI / 3;
  controls.target.set(-3, 0, -3);
  controls.enabled = false; // 先固定视野，调布局期间不让拖
  controls.update();

  // 灯光
  const ambient = new THREE.AmbientLight(0xffffff, 0.18);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xfff2dd, 1.3);
  dirLight.position.set(4, 6, 3);
  scene.add(dirLight);
  const screenLight = new THREE.PointLight(0x7dd3c0, 1.3, 3.5);
  screenLight.position.set(-0.8, 1.1, -2.0);
  scene.add(screenLight);
  const lampLight = new THREE.PointLight(0xe8b166, 0.7, 2.8);
  lampLight.position.set(0.8, 1.3, -1.8);
  scene.add(lampLight);

  const box = (
    w: number,
    h: number,
    d: number,
    color: number,
    pos: [number, number, number]
  ) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color })
    );
    m.position.set(...pos);
    scene.add(m);
    return m;
  };

  // 房间：2 面墙（奶色）+ 地板
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 7),
    new THREE.MeshStandardMaterial({ color: 0xede4d3 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  // 地毯（覆盖桌区 + 左右超出桌子）
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(5.0, 4.5),
    new THREE.MeshStandardMaterial({ color: 0x556070 })
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-0.5, 0.02, -0.75);
  scene.add(rug);
  box(7, 3, 0.1, 0xfbf8f1, [0, 1.5, -3]); // 后墙（更浅）
  box(0.1, 3, 7, 0xfbf8f1, [-3, 1.5, 0]); // 左墙（更浅）

  // 窗：后墙，大窗，上移（在桌子正上方）
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x16203a,
    emissive: 0x2a3560,
    emissiveIntensity: 0.25,
  });
  const winMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), winMat);
  winMesh.position.set(0.3, 1.7, -2.94);
  scene.add(winMesh);
  // 窗帘盒（窗顶横盒，遮挡窗帘轨道）
  box(2.6, 0.15, 0.25, 0x807e7a, [0.3, 2.58, -2.88]);

  // 长桌：贴后墙，左端延伸到左墙角（无腿，左段下方是柜子）
  box(4.4, 0.05, 0.9, 0x807e7a, [-0.7, 0.75, -2.5]); // 后墙段桌面
  // L 型：左墙段桌面（搭在柜子上）
  box(0.9, 0.05, 2.5, 0x807e7a, [-2.5, 0.75, -0.8]);
  // 左墙段下方：有门柜子（地面到桌面，支撑桌面）
  box(0.9, 0.7, 2.5, 0x807e7a, [-2.5, 0.4, -0.8]); // 柜体
  // 4 扇柜门（两两一对）
  [-1.74, -1.11, -0.49, 0.14].forEach((z) =>
    box(0.04, 0.62, 0.58, 0x6a6864, [-2.04, 0.4, z])
  );
  // 对内细缝（每对的两门之间）
  box(0.04, 0.62, 0.02, 0x3a3834, [-2.04, 0.4, -1.42]);
  box(0.04, 0.62, 0.02, 0x3a3834, [-2.04, 0.4, -0.18]);
  // 对间竖向分隔（两对的分界，更宽更明显）
  box(0.04, 0.7, 0.05, 0x5a5854, [-2.03, 0.4, -0.8]);
  // 每门一个把手
  [-1.56, -0.94, -0.31, 0.32].forEach((z) =>
    box(0.05, 0.08, 0.05, 0xe8b166, [-2.02, 0.45, z])
  );

  // 左墙段上方：镂空格子挂柜（挂在墙面，桌面以上）
  box(0.3, 1.2, 0.04, 0x807e7a, [-2.85, 1.9, -1.68]); // 左侧板
  box(0.3, 1.2, 0.04, 0x807e7a, [-2.85, 1.9, -0.12]); // 右侧板
  box(0.3, 0.04, 1.6, 0x807e7a, [-2.85, 2.5, -0.9]); // 顶板
  box(0.3, 0.04, 1.6, 0x807e7a, [-2.85, 1.3, -0.9]); // 底板
  [1.7, 2.1].forEach((y) =>
    box(0.3, 0.03, 1.6, 0x5a5854, [-2.85, y, -0.9])
  ); // 搁板（分 3 层）
  box(0.3, 1.2, 0.03, 0x5a5854, [-2.85, 1.9, -0.9]); // 竖分隔（每层分 2）

  // 笔记本电脑（桌上，偏左）
  box(0.9, 0.04, 0.6, 0x2a2a2e, [-0.8, 0.77, -2.4]); // 底座
  box(0.84, 0.012, 0.42, 0x141416, [-0.8, 0.793, -2.47]); // 键盘区
  box(0.3, 0.012, 0.18, 0x222226, [-0.8, 0.794, -2.3]); // 触控板
  const laptop = new THREE.Group();
  laptop.position.set(-0.8, 0.79, -2.68);
  laptop.rotation.x = -0.12;
  const laptopShell = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.55, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2e })
  );
  laptopShell.position.set(0, 0.28, 0);
  laptop.add(laptopShell);
  const laptopDisplay = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 0.48),
    new THREE.MeshStandardMaterial({
      color: 0x7dd3c0,
      emissive: 0x7dd3c0,
      emissiveIntensity: 0.7,
    })
  );
  laptopDisplay.position.set(0, 0.28, 0.018);
  laptop.add(laptopDisplay);
  scene.add(laptop);

  // 平板（笔记本左侧，副屏，斜立对着人物）
  const tablet = new THREE.Group();
  tablet.position.set(-1.6, 0.79, -2.37);
  tablet.rotation.order = 'YXZ'; // 先水平斜，再后倾，避免扭转歪斜
  tablet.rotation.x = -0.35; // 后倾
  tablet.rotation.y = 0.32; // 斜放（和桌边有夹角），屏朝人脸
  const tBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.59, 0.37, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1e })
  );
  tBody.position.set(0, 0.185, 0);
  tablet.add(tBody);
  const tScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.54, 0.32),
    new THREE.MeshStandardMaterial({
      color: 0x7dd3c0,
      emissive: 0x7dd3c0,
      emissiveIntensity: 0.6,
    })
  );
  tScreen.position.set(0, 0.185, 0.012);
  tablet.add(tScreen);
  scene.add(tablet);

  // 椅子 + 男孩（桌前，面朝 -z 看屏幕）
  box(0.5, 0.05, 0.5, 0x2a2a2e, [-0.8, 0.45, -1.5]); // 座椅
  box(0.5, 0.6, 0.05, 0x2a2a2e, [-0.8, 0.75, -1.28]); // 椅背
  // 椅子腿：中柱 + 五星脚 + 滚轮
  const chairPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.35, 14),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2e })
  );
  chairPost.position.set(-0.8, 0.275, -1.5);
  scene.add(chairPost);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.04, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2e })
    );
    leg.position.set(-0.8 + dx * 0.21, 0.08, -1.5 + dz * 0.21);
    leg.rotation.y = Math.PI / 2 - a;
    scene.add(leg);
    const wheel = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x141414 })
    );
    wheel.position.set(-0.8 + dx * 0.42, 0.045, -1.5 + dz * 0.42);
    scene.add(wheel);
  }
  // 人物待定（椅上暂空）

  // 昼夜联动
  const applyTheme = () => {
    const isDay = document.documentElement.classList.contains('light');
    const bg = isDay ? 0xcfd5dc : 0x101218;
    scene.background = new THREE.Color(bg);
    scene.fog = new THREE.Fog(bg, 7, 14);
    ambient.intensity = isDay ? 0.85 : 0.18;
    dirLight.intensity = isDay ? 1.3 : 0;
    screenLight.intensity = isDay ? 0 : 1.3;
    lampLight.intensity = isDay ? 0 : 0.7;
    winMat.color.set(isDay ? 0xa8d8f0 : 0x16203a);
    winMat.emissive.set(isDay ? 0xa8d8f0 : 0x2a3560);
    winMat.emissiveIntensity = isDay ? 0.5 : 0.25;
  };
  applyTheme();
  const obs = new MutationObserver(applyTheme);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  const onResize = () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };
  window.addEventListener('resize', onResize);

  let raf = 0;
  const animate = () => {
    raf = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  return () => {
    cancelAnimationFrame(raf);
    obs.disconnect();
    window.removeEventListener('resize', onResize);
    controls.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  };
}
