import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

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
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.minDistance = 2;
  controls.maxDistance = 7;
  controls.minPolarAngle = Math.PI / 4;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.minAzimuthAngle = Math.PI / 6;
  controls.maxAzimuthAngle = Math.PI / 3;
  controls.target.set(-3, 0, -3);
  controls.update();

  // 灯光
  const ambient = new THREE.AmbientLight(0xffffff, 0.18);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xfff2dd, 1.3);
  dirLight.position.set(4, 6, 3);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 30;
  dirLight.shadow.camera.left = -5;
  dirLight.shadow.camera.right = 5;
  dirLight.shadow.camera.top = 5;
  dirLight.shadow.camera.bottom = -5;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);
  const screenLight = new THREE.PointLight(0x7dd3c0, 1.3, 3.5);
  screenLight.position.set(-0.8, 1.1, -2.0);
  scene.add(screenLight);
  const lampLight = new THREE.PointLight(0xe8b166, 0.7, 2.8);
  lampLight.position.set(0.8, 1.3, -1.8);
  scene.add(lampLight);
  // 椅区补光（提亮桌下暗区，让椅子光影更明显）
  const fillLight = new THREE.PointLight(0xffffff, 0.35, 5);
  fillLight.position.set(-0.5, 1.8, -0.8);
  scene.add(fillLight);

  const box = (
    w: number,
    h: number,
    d: number,
    color: number,
    pos: [number, number, number]
  ) => {
    const m = new THREE.Mesh(
      new RoundedBoxGeometry(w, h, d, 4, 0.02),
      new THREE.MeshStandardMaterial({ color })
    );
    m.position.set(...pos);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };

  // 房间：2 面墙（奶色）+ 地板
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 7),
    new THREE.MeshStandardMaterial({ color: 0xede4d3 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
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

  // 窗帘（单侧右侧，点击拉上/拉开）
  const curtainGroup = new THREE.Group();
  curtainGroup.position.set(1.5, 1.7, -2.9); // 锚点在窗右边缘
  const curtainGeo = new THREE.PlaneGeometry(2.4, 1.8, 20, 1);
  const cPos = curtainGeo.attributes.position;
  for (let i = 0; i < cPos.count; i++) {
    const x = cPos.getX(i);
    cPos.setZ(i, Math.sin(x * 8) * 0.04); // 竖向褶皱（前后波动）
  }
  curtainGeo.computeVertexNormals();
  const curtain = new THREE.Mesh(
    curtainGeo,
    new THREE.MeshStandardMaterial({
      color: 0xe8e0d4,
      roughness: 1,
      side: THREE.DoubleSide,
    })
  );
  curtain.position.x = -1.2; // 布面中心左偏，右边缘对齐锚点
  curtain.castShadow = true;
  curtainGroup.add(curtain);
  curtainGroup.scale.x = 0.12; // 初始：拉开（收在右侧）
  scene.add(curtainGroup);

  // 长桌：贴后墙，左端延伸到左墙角（无腿，左段下方是柜子）
  box(4.4, 0.05, 0.9, 0x807e7a, [-0.7, 0.75, -2.5]); // 后墙段桌面
  // L 型：左墙段桌面（搭在柜子上）
  box(0.9, 0.05, 2.5, 0x807e7a, [-2.5, 0.75, -0.8]);
  // 左墙段下方：有门柜子（地面到桌面，支撑桌面）
  // 柜体（中空框架：顶/底/背/侧，开门可见内部）
  box(0.9, 0.04, 2.5, 0x807e7a, [-2.5, 0.73, -0.8]); // 顶板
  box(0.9, 0.04, 2.5, 0x807e7a, [-2.5, 0.07, -0.8]); // 底板
  box(0.05, 0.7, 2.5, 0x6a6864, [-2.9, 0.4, -0.8]); // 背板（贴左墙，略深）
  box(0.9, 0.7, 0.04, 0x807e7a, [-2.5, 0.4, -2.03]); // 左侧板
  box(0.9, 0.7, 0.04, 0x807e7a, [-2.5, 0.4, 0.43]); // 右侧板
  box(0.88, 0.66, 0.04, 0x6a6864, [-2.5, 0.4, -0.8]); // 中隔（分2格）
  // 柜内暂空（物品待后续添加）

  // RoboMaster EP（桌下靠窗）—— 履带底盘 + 云台 + 发射器 + 红蓝装甲
  const ep = new THREE.Group();
  ep.position.set(0.6, 0, -2.2);
  const addEp = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    ep.add(m);
  };
  const epBlack = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.55, metalness: 0.3 });
  const epGray = new THREE.MeshStandardMaterial({ color: 0x3a3a3e, roughness: 0.6 });
  const epRed = new THREE.MeshStandardMaterial({ color: 0xd02828, roughness: 0.5 });
  const epBlue = new THREE.MeshStandardMaterial({ color: 0x2848d0, roughness: 0.5 });
  // 底盘
  addEp(new RoundedBoxGeometry(0.42, 0.12, 0.5, 2, 0.02), epBlack, 0, 0.16, 0);
  // 4 个麦克纳姆轮（4 角，圆柱横放）
  const wheelGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.06, 16);
  [
    [-0.2, 0.2],
    [0.2, 0.2],
    [-0.2, -0.2],
    [0.2, -0.2],
  ].forEach(([x, z]) => {
    addEp(wheelGeo, epGray, x, 0.08, z);
    ep.children[ep.children.length - 1].rotation.x = Math.PI / 2;
  });
  // 装甲条（前红后蓝，RM 阵营色）
  addEp(new THREE.BoxGeometry(0.44, 0.04, 0.03), epRed, 0, 0.17, 0.26);
  addEp(new THREE.BoxGeometry(0.44, 0.04, 0.03), epBlue, 0, 0.17, -0.26);
  // 机械臂（底座 + 大臂 + 小臂 + 夹爪）
  addEp(new THREE.CylinderGeometry(0.06, 0.07, 0.06, 14), epBlack, 0, 0.25, 0); // 底座
  const arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.05), epBlack);
  arm1.position.set(0, 0.35, 0.04);
  arm1.rotation.x = -0.4;
  arm1.castShadow = true;
  ep.add(arm1);
  const arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.05), epBlack);
  arm2.position.set(0, 0.44, 0.12);
  arm2.rotation.x = -1.0;
  arm2.castShadow = true;
  ep.add(arm2);
  // 末端夹爪
  addEp(new THREE.BoxGeometry(0.015, 0.05, 0.03), epGray, -0.025, 0.49, 0.18);
  addEp(new THREE.BoxGeometry(0.015, 0.05, 0.03), epGray, 0.025, 0.49, 0.18);
  scene.add(ep);
  // 4 扇柜门（可点击向外打开；前2门/后2门各共享一格）
  const doors: { group: THREE.Group; angle: number; target: number }[] = [];
  const doorMeshes: THREE.Mesh[] = [];
  // [铰链z, 门中心z, 开角（正=向右外开，负=向左外开）]
  const doorDefs: [number, number, number][] = [
    [-2.03, -1.74, Math.PI / 2], // 门1 向外开 90°
    [-0.82, -1.11, -Math.PI / 2], // 门2 向外开 90°
    [-0.8, -0.49, Math.PI / 2], // 门3 向外开 90°
    [0.43, 0.14, -Math.PI / 2], // 门4 向外开 90°
  ];
  doorDefs.forEach(([hingeZ, cz, openAngle], i) => {
    const g = new THREE.Group();
    g.position.set(-2.04, 0.4, hingeZ);
    const door = new THREE.Mesh(
      new RoundedBoxGeometry(0.04, 0.62, 0.58, 2, 0.015),
      new THREE.MeshStandardMaterial({ color: 0x6a6864 })
    );
    door.position.z = cz - hingeZ;
    door.castShadow = true;
    door.receiveShadow = true;
    g.add(door);
    const handle = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xe8b166,
        metalness: 0.6,
        roughness: 0.3,
      })
    );
    handle.position.set(0.02, -0.22, cz - hingeZ > 0 ? 0.45 : -0.45);
    g.add(handle);
    scene.add(g);
    doors.push({ group: g, angle: openAngle, target: 0 });
    door.userData.doorIndex = i;
    doorMeshes.push(door);
  });
  // 对间竖向分隔（固定，两格分界）
  box(0.04, 0.7, 0.05, 0x5a5854, [-2.03, 0.4, -0.8]);

  // 左墙段上方：镂空格子挂柜（挂在墙面，桌面以上）
  box(0.3, 1.2, 0.04, 0x807e7a, [-2.85, 1.9, -1.68]); // 左侧板
  box(0.3, 1.2, 0.04, 0x807e7a, [-2.85, 1.9, -0.12]); // 右侧板
  box(0.3, 0.04, 1.6, 0x807e7a, [-2.85, 2.5, -0.9]); // 顶板
  box(0.3, 0.04, 1.6, 0x807e7a, [-2.85, 1.3, -0.9]); // 底板
  [1.7, 2.1].forEach((y) =>
    box(0.3, 0.03, 1.6, 0x5a5854, [-2.85, y, -0.9])
  ); // 搁板（分 3 层）
  box(0.3, 1.2, 0.03, 0x5a5854, [-2.85, 1.9, -0.9]); // 竖分隔（每层分 2）

  // 留言板（挂柜左侧墙上，点击进留言页）
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.55, 0.75),
    new THREE.MeshStandardMaterial({ color: 0x9a7a5a, roughness: 0.92 })
  );
  board.position.set(-2.87, 1.9, 0.5);
  board.castShadow = true;
  board.receiveShadow = true;
  scene.add(board);
  // 留言板边缘线（hover 时高亮显示，面板不变色）
  const boardEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(board.geometry, 30),
    new THREE.LineBasicMaterial({ color: 0xe8b166 })
  );
  boardEdges.position.copy(board.position);
  boardEdges.visible = false;
  scene.add(boardEdges);
  // 便签纸（圆角 + 图钉 + 微倾，更自然）
  [
    [-2.84, 2.02, 0.7, 0xe8d068, 0.12],
    [-2.84, 1.78, 0.3, 0xf0a8a8, -0.18],
  ].forEach(([x, y, z, c, rot]) => {
    const note = new THREE.Mesh(
      new RoundedBoxGeometry(0.01, 0.18, 0.18, 2, 0.012),
      new THREE.MeshStandardMaterial({ color: c as number, roughness: 0.85 })
    );
    note.position.set(x as number, y as number, z as number);
    note.rotation.x = rot as number;
    note.castShadow = true;
    note.receiveShadow = true;
    scene.add(note);
    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xd04040,
        metalness: 0.6,
        roughness: 0.3,
      })
    );
    pin.position.set(
      (x as number) - 0.008,
      (y as number) + 0.06,
      z as number
    );
    scene.add(pin);
  });

  // 点击留言板 → 跳转留言页（Raycaster 检测）
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  renderer.domElement.style.cursor = 'default';
  let draggingCurtain = false;
  let lastCurtainX = 0;
  let draggingChair = false;
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hitGround = new THREE.Vector3();
  const moveCurtain = (clientX: number) => {
    const dx = clientX - lastCurtainX;
    lastCurtainX = clientX;
    curtainGroup.scale.x = Math.max(
      0.12,
      Math.min(1, curtainGroup.scale.x - dx * 0.005)
    );
  };
  renderer.domElement.addEventListener('pointerdown', (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.intersectObject(curtain).length > 0) {
      draggingCurtain = true;
      controls.enabled = false;
      lastCurtainX = e.clientX;
    } else if (raycaster.intersectObjects(chairParts).length > 0) {
      draggingChair = true;
      controls.enabled = false;
    }
  });
  window.addEventListener('pointerup', () => {
    draggingCurtain = false;
    draggingChair = false;
    controls.enabled = true;
  });
  renderer.domElement.addEventListener('pointermove', (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    if (draggingCurtain) {
      moveCurtain(e.clientX);
      return;
    }
    if (draggingChair) {
      raycaster.ray.intersectPlane(groundPlane, hitGround);
      // 限制在开敞区，考虑椅子半径 0.25，不进桌子/柜子区域
      chair.position.x = THREE.MathUtils.clamp(hitGround.x, -1.7, 2.6);
      chair.position.z = THREE.MathUtils.clamp(hitGround.z, -1.8, 1.5);
      return;
    }
    const hoverBoard = raycaster.intersectObject(board).length > 0;
    const hoverCurtain = raycaster.intersectObject(curtain).length > 0;
    const hoverChair = raycaster.intersectObjects(chairParts).length > 0;
    renderer.domElement.style.cursor =
      hoverBoard || hoverCurtain || hoverChair ? 'pointer' : 'default';
    boardEdges.visible = hoverBoard;
    const tip = document.getElementById('roomTip');
    if (tip) {
      if (hoverBoard) {
        tip.style.display = 'block';
        tip.style.left = `${e.clientX + 14}px`;
        tip.style.top = `${e.clientY + 14}px`;
      } else {
        tip.style.display = 'none';
      }
    }
  });
  renderer.domElement.addEventListener('click', (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.intersectObjects(chairParts).length > 0) {
      chairSpin += 0.12; // 点击拨动转椅
    } else if (raycaster.intersectObjects(doorMeshes).length > 0) {
      const hitDoor = raycaster.intersectObjects(doorMeshes);
      const idx = hitDoor[0].object.userData.doorIndex;
      const doorZ = doorDefs[idx][1];
      // 椅子挡在门前（靠近柜 + z 在门范围内）→ 门打不开
      const blocked =
        chair.position.x < -1.0 &&
        Math.abs(chair.position.z - doorZ) < 0.4;
      if (!blocked) {
        const d = doors[idx];
        d.target = d.target !== 0 ? 0 : d.angle;
      }
    } else if (raycaster.intersectObject(board).length > 0) {
      window.location.href = import.meta.env.BASE_URL + 'guestbook';
    }
  });

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

  // 椅子（上半可旋转，下半固定）
  const chair = new THREE.Group();
  chair.position.set(-0.8, 0, -1.5);
  const chairTop = new THREE.Group(); // 座椅 + 椅背（点击旋转）
  const chairBase = new THREE.Group(); // 中柱 + 五星腿 + 轮（固定）
  const chairParts: THREE.Object3D[] = [];
  let chairSpin = 0;
  const addPart = (
    parent: THREE.Group,
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    ry = 0
  ) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    chairParts.push(m);
  };
  addPart(chairTop, new RoundedBoxGeometry(0.5, 0.05, 0.5, 2, 0.02), new THREE.MeshStandardMaterial({ color: 0x2a2a2e }), 0, 0.45, 0);
  addPart(chairTop, new RoundedBoxGeometry(0.5, 0.6, 0.05, 2, 0.02), new THREE.MeshStandardMaterial({ color: 0x2a2a2e }), 0, 0.75, 0.22);
  addPart(chairBase, new THREE.CylinderGeometry(0.04, 0.04, 0.35, 14), new THREE.MeshStandardMaterial({ color: 0x2a2a2e }), 0, 0.275, 0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    addPart(chairBase, new THREE.BoxGeometry(0.06, 0.04, 0.42), new THREE.MeshStandardMaterial({ color: 0x2a2a2e }), dx * 0.21, 0.08, dz * 0.21, Math.PI / 2 - a);
    addPart(chairBase, new THREE.SphereGeometry(0.045, 12, 12), new THREE.MeshStandardMaterial({ color: 0x141414 }), dx * 0.42, 0.045, dz * 0.42);
  }
  chair.add(chairTop);
  chair.add(chairBase);
  scene.add(chair);

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
    for (const d of doors) {
      d.group.rotation.y += (d.target - d.group.rotation.y) * 0.15;
    }
    chairTop.rotation.y += chairSpin;
    chairSpin *= 0.97;
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
