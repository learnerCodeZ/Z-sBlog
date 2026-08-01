import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * 3D 房间 —— 纯 Three.js（命令式）。
 * 布局：后墙（窗）+ 左墙（书柜）+ 右墙 + 地板，桌子在中间靠后墙窗下。
 */
export function initRoom(container: HTMLElement): () => void {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    55,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(2.8, 2, 3);

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
  controls.minAzimuthAngle = -Math.PI / 4;
  controls.maxAzimuthAngle = Math.PI / 4;
  controls.target.set(0, 1, -0.5);
  controls.update();

  // 灯光
  const ambient = new THREE.AmbientLight(0xffffff, 0.18);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xfff2dd, 1.3);
  dirLight.position.set(4, 6, 3);
  scene.add(dirLight);
  const screenLight = new THREE.PointLight(0x7dd3c0, 1.3, 3.5);
  screenLight.position.set(0, 1.3, -1.4);
  scene.add(screenLight);
  const lampLight = new THREE.PointLight(0xe8b166, 0.7, 2.8);
  lampLight.position.set(-0.8, 1.3, -1.0);
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

  // 房间：3 面墙（奶色）+ 地板
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 7),
    new THREE.MeshStandardMaterial({ color: 0x4a4036 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  box(7, 3, 0.1, 0xede4d3, [0, 1.5, -3]); // 后墙
  box(0.1, 3, 7, 0xe6dccc, [-3, 1.5, 0]); // 左墙（略深一点做层次）

  // 窗：后墙，大窗，上移
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x16203a,
    emissive: 0x2a3560,
    emissiveIntensity: 0.25,
  });
  const winMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.0), winMat);
  winMesh.position.set(0, 1.7, -2.94);
  scene.add(winMesh);

  // 地毯
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 2.4),
    new THREE.MeshStandardMaterial({ color: 0x6b5a55 })
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.02, -0.8);
  scene.add(rug);

  // 桌子（中间，靠后墙窗下）
  box(2.2, 0.05, 0.9, 0x6b4f3a, [0, 0.75, -1.5]); // 桌面
  [
    [-1, -1.85],
    [1, -1.85],
    [-1, -1.15],
    [1, -1.15],
  ].forEach(([x, z]) => box(0.06, 0.75, 0.06, 0x4a3528, [x, 0.37, z]));

  // 显示器（桌后靠墙，屏朝 +z 朝男孩）
  box(1.1, 0.7, 0.04, 0x0e0f11, [0, 1.18, -1.8]);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.0, 0.6),
    new THREE.MeshStandardMaterial({
      color: 0x7dd3c0,
      emissive: 0x7dd3c0,
      emissiveIntensity: 0.7,
    })
  );
  screen.position.set(0, 1.18, -1.775);
  scene.add(screen);

  // 键盘
  box(0.7, 0.02, 0.25, 0x1a1a1e, [0, 0.78, -1.3]);

  // 椅子 + 男孩（桌前，面朝 -z 看屏幕）
  box(0.5, 0.05, 0.5, 0x2a2a2e, [0, 0.45, -0.7]); // 座椅
  box(0.5, 0.6, 0.05, 0x2a2a2e, [0, 0.75, -0.48]); // 椅背
  box(0.35, 0.55, 0.3, 0xe8b166, [0, 0.73, -0.7]); // 占位男孩

  // 书柜（左墙）：上格子 + 下柜门
  box(0.4, 2.2, 1.8, 0x6b4f3a, [-2.7, 1.1, -1.5]); // 柜体
  box(0.46, 0.06, 1.86, 0x4a3528, [-2.7, 2.23, -1.5]); // 顶板
  // 上部格子（开放搁板）
  [1.45, 1.75, 2.05].forEach((y) =>
    box(0.42, 0.04, 1.7, 0x4a3528, [-2.7, y, -1.5])
  );
  [-0.35, 0.35].forEach((z) =>
    box(0.42, 0.8, 0.03, 0x4a3528, [-2.7, 1.75, -1.5 + z])
  );
  // 中隔板
  box(0.42, 0.04, 1.7, 0x4a3528, [-2.7, 1.25, -1.5]);
  // 下部两扇柜门
  box(0.03, 1.1, 0.8, 0x5a4030, [-2.66, 0.65, -1.5 - 0.42]);
  box(0.03, 1.1, 0.8, 0x5a4030, [-2.66, 0.65, -1.5 + 0.42]);
  box(0.03, 1.1, 0.02, 0x1a1410, [-2.66, 0.65, -1.5]); // 门缝
  // 把手
  box(0.04, 0.08, 0.04, 0xe8b166, [-2.64, 0.7, -1.5 - 0.32]);
  box(0.04, 0.08, 0.04, 0xe8b166, [-2.64, 0.7, -1.5 + 0.32]);

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

  // resize
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
