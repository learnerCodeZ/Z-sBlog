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
  controls.target.set(-0.5, 1, -1.8);
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
    new THREE.MeshStandardMaterial({ color: 0x4a4036 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  box(7, 3, 0.1, 0xede4d3, [0, 1.5, -3]); // 后墙
  box(0.1, 3, 7, 0xe6dccc, [-3, 1.5, 0]); // 左墙

  // 窗：后墙，大窗，上移（在桌子正上方）
  const winMat = new THREE.MeshStandardMaterial({
    color: 0x16203a,
    emissive: 0x2a3560,
    emissiveIntensity: 0.25,
  });
  const winMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.0), winMat);
  winMesh.position.set(0.3, 1.9, -2.94);
  scene.add(winMesh);

  // 地毯（桌前）
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 2.0),
    new THREE.MeshStandardMaterial({ color: 0x6b5a55 })
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.02, -1.2);
  scene.add(rug);

  // 长桌：贴后墙，左端延伸到左墙角
  // 桌面 x: -2.9（贴左墙）到 1.5；z: -2.95（贴后墙）到 -2.05
  box(4.4, 0.05, 0.9, 0x6b4f3a, [-0.7, 0.75, -2.5]); // 桌面
  // 桌腿（前缘，z=-2.05）
  [-2.6, -1.3, 0, 1.3].forEach((x) =>
    box(0.06, 0.75, 0.06, 0x4a3528, [x, 0.37, -2.05])
  );
  // L 型：左墙段（沿左墙向前延伸，拐弯）
  box(0.9, 0.05, 2.5, 0x6b4f3a, [-2.5, 0.75, -0.8]); // 左墙段桌面
  [-1.5, 0].forEach((z) =>
    box(0.06, 0.75, 0.06, 0x4a3528, [-2.05, 0.37, z])
  );

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

  // 椅子 + 男孩（桌前，面朝 -z 看屏幕）
  box(0.5, 0.05, 0.5, 0x2a2a2e, [-0.8, 0.45, -1.5]); // 座椅
  box(0.5, 0.6, 0.05, 0x2a2a2e, [-0.8, 0.75, -1.28]); // 椅背
  box(0.35, 0.55, 0.3, 0xe8b166, [-0.8, 0.73, -1.5]); // 占位男孩

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
