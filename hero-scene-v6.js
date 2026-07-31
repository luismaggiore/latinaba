import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

RectAreaLightUniformsLib.init();

// --- Algoritmo Fast Simplex Noise 3D para Deformación Orgánica Fluida ---
const F3 = 1.0 / 3.0;
const G3 = 1.0 / 6.0;

const p = new Uint8Array(256);
for (let i = 0; i < 256; i++) p[i] = Math.floor(Math.random() * 256);
const perm = new Uint8Array(512);
const permMod12 = new Uint8Array(512);
for (let i = 0; i < 512; i++) {
  perm[i] = p[i & 255];
  permMod12[i] = perm[i] % 12;
}

const grad3 = new Float32Array([
  1,1,0, -1,1,0, 1,-1,0, -1,-1,0,
  1,0,1, -1,0,1, 1,0,-1, -1,0,-1,
  0,1,1, 0,-1,1, 0,1,-1, 0,-1,-1
]);

function simplexNoise3D(xin, yin, zin) {
  let n0, n1, n2, n3;
  const s = (xin + yin + zin) * F3;
  const i = Math.floor(xin + s);
  const j = Math.floor(yin + s);
  const k = Math.floor(zin + s);
  const t = (i + j + k) * G3;
  const X0 = i - t;
  const Y0 = j - t;
  const Z0 = k - t;
  const x0 = xin - X0;
  const y0 = yin - Y0;
  const z0 = zin - Z0;

  let i1, j1, k1, i2, j2, k2;
  if (x0 >= y0) {
    if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
    else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
    else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
  } else {
    if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
    else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
    else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
  }

  const x1 = x0 - i1 + G3;
  const y1 = y0 - j1 + G3;
  const z1 = z0 - k1 + G3;
  const x2 = x0 - i2 + 2.0 * G3;
  const y2 = y0 - j2 + 2.0 * G3;
  const z2 = z0 - k2 + 2.0 * G3;
  const x3 = x0 - 1.0 + 3.0 * G3;
  const y3 = y0 - 1.0 + 3.0 * G3;
  const z3 = z0 - 1.0 + 3.0 * G3;

  const ii = i & 255;
  const jj = j & 255;
  const kk = k & 255;

  let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
  if (t0 < 0) n0 = 0.0;
  else {
    t0 *= t0;
    const gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
    n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
  }

  let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
  if (t1 < 0) n1 = 0.0;
  else {
    t1 *= t1;
    const gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
    n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
  }

  let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
  if (t2 < 0) n2 = 0.0;
  else {
    t2 *= t2;
    const gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
    n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
  }

  let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
  if (t3 < 0) n3 = 0.0;
  else {
    t3 *= t3;
    const gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
    n3 = t3 * t3 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
  }

  return 32.0 * (n0 + n1 + n2 + n3);
}

const BG = 0xf8fafc;

const container = document.getElementById("stage");
if (container) {
  // --- Escena Base ---
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xf8fafc, 0.006);

  const camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    240
  );
  camera.position.set(0, 0, 34);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(BG, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  container.appendChild(renderer.domElement);

  // --- Post-Procesado (Bokeh Depth of Field Blur) ---
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bokehPass = new BokehPass(scene, camera, {
    focus: 34.0,
    aperture: 0.0006,
    maxblur: 0.014,
    width: window.innerWidth,
    height: window.innerHeight,
  });
  composer.addPass(bokehPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  // --- Fondo Degradado Estudio Claro ---
  function buildBackgroundTexture(aspect) {
    const height = 512;
    const width = Math.round(height * aspect);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    const grad = ctx.createRadialGradient(
      width * 0.5, height * 0.4, 50,
      width * 0.5, height * 0.5, width * 0.95
    );
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.4, "#f1f5f9");
    grad.addColorStop(1, "#e2e8f0");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  function updateBackground() {
    const aspect = window.innerWidth / window.innerHeight;
    const old = scene.background;
    scene.background = buildBackgroundTexture(aspect);
    if (old) old.dispose();
  }
  updateBackground();

  // --- Iluminación de Estudio Profesional ---
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.6);
  keyLight.position.set(30, 35, 30);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.8);
  fillLight.position.set(-30, -25, -15);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 1.8);
  rimLight.position.set(0, 30, -30);
  scene.add(rimLight);

  const ambientLight = new THREE.AmbientLight(0xf8fafc, 1.4);
  scene.add(ambientLight);

  const areaLight = new THREE.RectAreaLight(0xffffff, 5.0, 60, 60);
  areaLight.position.set(20, 25, 25);
  areaLight.lookAt(0, 0, 0);
  scene.add(areaLight);

  // --- Contenedor Principal de la Composición ---
  const cellGroup = new THREE.Group();
  scene.add(cellGroup);

  // --- Materiales de la Célula Procedural (Limpia, sin micro-partículas) ---

  // 1. Membrana Exterior Transparente Cristalina
  const outerMembraneMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#ffffff"),
    transparent: true,
    opacity: 0.26,
    roughness: 0.04,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    reflectivity: 0.95,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // 2. Núcleo Interno Deformado: Celeste Cian Saturado (#38bdf8)
  const innerNucleusMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#38bdf8"),
    roughness: 0.38,
    metalness: 0.05,
  });

  // --- Función Fábrica para Crear una Célula Procedural Limpia (Sin círculos pequeños) ---
  function createProceduralCell(outerRadius = 2.3, innerRadius = 1.0) {
    const singleCellGroup = new THREE.Group();

    // 1. Membrana Exterior
    const outerGeometry = new THREE.IcosahedronGeometry(outerRadius, 5);
    outerGeometry.computeVertexNormals();

    const outerMesh = new THREE.Mesh(outerGeometry, outerMembraneMaterial);
    outerMesh.castShadow = true;
    outerMesh.receiveShadow = true;
    singleCellGroup.add(outerMesh);

    const outerPosAttr = outerGeometry.attributes.position;
    const outerOriginalPositions = outerPosAttr.array.slice();

    // 2. Núcleo Interno
    const innerGeometry = new THREE.IcosahedronGeometry(innerRadius, 4);
    innerGeometry.computeVertexNormals();

    const innerMesh = new THREE.Mesh(innerGeometry, innerNucleusMaterial);
    innerMesh.castShadow = true;
    innerMesh.receiveShadow = true;
    singleCellGroup.add(innerMesh);

    const innerPosAttr = innerGeometry.attributes.position;
    const innerOriginalPositions = innerPosAttr.array.slice();

    // Rotación inicial aleatoria para máxima variedad orgánica
    singleCellGroup.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );

    return {
      group: singleCellGroup,
      outerMesh: outerMesh,
      outerGeometry: outerGeometry,
      outerPosAttr: outerPosAttr,
      outerOriginalPositions: outerOriginalPositions,
      innerMesh: innerMesh,
      innerGeometry: innerGeometry,
      innerPosAttr: innerPosAttr,
      innerOriginalPositions: innerOriginalPositions
    };
  }

  // --- Disposición Orgánica Asimétrica y Ancha a lo largo de Toda la Pantalla ---
  const cellConfigs = [
    // 1. Célula Destacada Superior Derecha
    { pos: new THREE.Vector3(7.8, 3.8, 3.5), scale: 1.30, noiseFreqOuter: 0.42, noiseAmpOuter: 0.38, noiseFreqInner: 0.65, noiseAmpInner: 0.24, speedX: 0.0012, speedY: 0.0016, floatPhase: 0.0 },
    // 2. Célula Superior Izquierda Gran Tamaño
    { pos: new THREE.Vector3(-8.2, 4.5, 2.5), scale: 1.22, noiseFreqOuter: 0.38, noiseAmpOuter: 0.40, noiseFreqInner: 0.60, noiseAmpInner: 0.22, speedX: -0.0014, speedY: 0.0012, floatPhase: 0.7 },
    // 3. Célula Centro-Izquierda
    { pos: new THREE.Vector3(-3.5, 2.0, 4.0), scale: 1.15, noiseFreqOuter: 0.48, noiseAmpOuter: 0.32, noiseFreqInner: 0.72, noiseAmpInner: 0.20, speedX: 0.0010, speedY: -0.0015, floatPhase: 1.5 },
    // 4. Célula Extremo Izquierdo Medio
    { pos: new THREE.Vector3(-12.8, 1.2, 0.5), scale: 1.10, noiseFreqOuter: 0.44, noiseAmpOuter: 0.36, noiseFreqInner: 0.68, noiseAmpInner: 0.25, speedX: -0.0011, speedY: 0.0014, floatPhase: 2.2 },
    // 5. Célula Extremo Derecho Medio
    { pos: new THREE.Vector3(12.5, 0.8, -1.0), scale: 1.18, noiseFreqOuter: 0.40, noiseAmpOuter: 0.34, noiseFreqInner: 0.62, noiseAmpInner: 0.20, speedX: 0.0013, speedY: -0.0011, floatPhase: 2.9 },
    // 6. Célula Centro Superior
    { pos: new THREE.Vector3(1.8, 5.2, 1.0), scale: 1.05, noiseFreqOuter: 0.50, noiseAmpOuter: 0.30, noiseFreqInner: 0.75, noiseAmpInner: 0.18, speedX: -0.0009, speedY: 0.0017, floatPhase: 3.6 },
    // 7. Célula Superior Extremo Izquierdo
    { pos: new THREE.Vector3(-11.2, 5.8, -3.5), scale: 0.98, noiseFreqOuter: 0.45, noiseAmpOuter: 0.28, noiseFreqInner: 0.64, noiseAmpInner: 0.19, speedX: -0.0012, speedY: 0.0010, floatPhase: 4.3 },
    // 8. Célula Superior Extremo Derecho
    { pos: new THREE.Vector3(11.0, 5.5, -4.0), scale: 0.95, noiseFreqOuter: 0.42, noiseAmpOuter: 0.30, noiseFreqInner: 0.66, noiseAmpInner: 0.21, speedX: 0.0011, speedY: -0.0013, floatPhase: 5.0 },

    // Células de Profundidad Media (Spread Z: -5 a -10)
    { pos: new THREE.Vector3(-6.5, -0.8, -5.5), scale: 0.92, noiseFreqOuter: 0.52, noiseAmpOuter: 0.26, noiseFreqInner: 0.70, noiseAmpInner: 0.17, speedX: 0.0008, speedY: 0.0015, floatPhase: 1.1 },
    { pos: new THREE.Vector3(5.5, -1.2, -6.0), scale: 0.90, noiseFreqOuter: 0.46, noiseAmpOuter: 0.28, noiseFreqInner: 0.68, noiseAmpInner: 0.18, speedX: -0.0010, speedY: -0.0012, floatPhase: 1.8 },
    { pos: new THREE.Vector3(-1.5, 1.5, -7.5), scale: 0.85, noiseFreqOuter: 0.38, noiseAmpOuter: 0.32, noiseFreqInner: 0.58, noiseAmpInner: 0.20, speedX: 0.0014, speedY: 0.0009, floatPhase: 2.6 },
    { pos: new THREE.Vector3(9.2, -2.5, -8.0), scale: 0.88, noiseFreqOuter: 0.50, noiseAmpOuter: 0.24, noiseFreqInner: 0.72, noiseAmpInner: 0.16, speedX: -0.0009, speedY: 0.0014, floatPhase: 3.4 },

    // Células Fondo Profundo (Spread Z: -11 a -18)
    { pos: new THREE.Vector3(-13.5, 3.2, -11.0), scale: 0.78, noiseFreqOuter: 0.44, noiseAmpOuter: 0.22, noiseFreqInner: 0.62, noiseAmpInner: 0.15, speedX: 0.0007, speedY: -0.0011, floatPhase: 4.1 },
    { pos: new THREE.Vector3(13.8, 3.5, -12.5), scale: 0.75, noiseFreqOuter: 0.48, noiseAmpOuter: 0.20, noiseFreqInner: 0.66, noiseAmpInner: 0.14, speedX: -0.0011, speedY: 0.0013, floatPhase: 4.9 },
    { pos: new THREE.Vector3(-5.2, 6.2, -14.0), scale: 0.70, noiseFreqOuter: 0.40, noiseAmpOuter: 0.25, noiseFreqInner: 0.56, noiseAmpInner: 0.16, speedX: 0.0010, speedY: 0.0008, floatPhase: 5.6 },
    { pos: new THREE.Vector3(4.5, 6.5, -15.5), scale: 0.68, noiseFreqOuter: 0.52, noiseAmpOuter: 0.18, noiseFreqInner: 0.70, noiseAmpInner: 0.13, speedX: -0.0008, speedY: -0.0012, floatPhase: 0.3 },
    { pos: new THREE.Vector3(-9.5, -1.5, -16.5), scale: 0.62, noiseFreqOuter: 0.36, noiseAmpOuter: 0.22, noiseFreqInner: 0.54, noiseAmpInner: 0.14, speedX: 0.0012, speedY: 0.0010, floatPhase: 1.9 },
    { pos: new THREE.Vector3(10.2, -1.8, -17.5), scale: 0.58, noiseFreqOuter: 0.46, noiseAmpOuter: 0.16, noiseFreqInner: 0.64, noiseAmpInner: 0.12, speedX: -0.0007, speedY: -0.0009, floatPhase: 3.1 }
  ];

  const proceduralCellInstances = [];

  cellConfigs.forEach((cfg) => {
    const cellData = createProceduralCell(2.3, 1.0);

    const cellPivot = new THREE.Group();
    cellPivot.position.copy(cfg.pos);
    cellPivot.scale.setScalar(cfg.scale);
    cellPivot.add(cellData.group);

    cellGroup.add(cellPivot);

    proceduralCellInstances.push({
      pivot: cellPivot,
      cellData: cellData,
      basePos: cfg.pos.clone(),
      baseScale: cfg.scale,
      currentScale: cfg.scale,
      targetOffset: new THREE.Vector3(),
      mouseRotX: 0,
      mouseRotY: 0,
      noiseFreqOuter: cfg.noiseFreqOuter,
      noiseAmpOuter: cfg.noiseAmpOuter,
      noiseFreqInner: cfg.noiseFreqInner,
      noiseAmpInner: cfg.noiseAmpInner,
      speedX: cfg.speedX,
      speedY: cfg.speedY,
      floatPhase: cfg.floatPhase
    });
  });

  // --- Control de Interacción de Cursor Dinámico ---
  let mouseNDC = new THREE.Vector2(-10, -10);
  let mouseWorld = new THREE.Vector3(0, 0, 0);

  window.addEventListener("mousemove", (e) => {
    mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouseNDC, camera);
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    raycaster.ray.intersectPlane(planeZ, mouseWorld);
  });

  let scrollY = 0;
  window.addEventListener("scroll", () => {
    scrollY = window.scrollY || window.pageYOffset;
  });

  // --- Resize Handler ---
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    updateBackground();
  });

  // --- Bucle de Animación con Deformación de Vértices en Tiempo Real ---
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();
    const time = elapsedTime * 0.6;

    // Rotación suave del grupo principal
    cellGroup.rotation.y += 0.0006;
    cellGroup.rotation.x = Math.sin(elapsedTime * 0.15) * 0.04;

    // Deformar y animar cada una de las 18 células procedurales
    proceduralCellInstances.forEach((inst) => {
      const cd = inst.cellData;

      // 1. Rotación lenta de la célula
      cd.group.rotation.x += inst.speedX;
      cd.group.rotation.y += inst.speedY;

      // 2. Deformación Orgánica de Vértices para la Membrana Exterior Transparente
      const outerPosAttr = cd.outerPosAttr;
      const outerPositions = outerPosAttr.array;
      const outerOrig = cd.outerOriginalPositions;
      const outerCount = outerPosAttr.count;

      for (let i = 0; i < outerCount; i++) {
        const idx = i * 3;
        const ox = outerOrig[idx];
        const oy = outerOrig[idx + 1];
        const oz = outerOrig[idx + 2];

        const n = simplexNoise3D(
          ox * inst.noiseFreqOuter + time * 0.4,
          oy * inst.noiseFreqOuter + time * 0.3,
          oz * inst.noiseFreqOuter + time * 0.5
        );

        const displacement = 1.0 + n * inst.noiseAmpOuter;

        outerPositions[idx] = ox * displacement;
        outerPositions[idx + 1] = oy * displacement;
        outerPositions[idx + 2] = oz * displacement;
      }
      outerPosAttr.needsUpdate = true;
      cd.outerGeometry.computeVertexNormals();

      // 3. Deformación Orgánica de Vértices para el Núcleo Interno (Celeste Cian Saturado)
      const innerPosAttr = cd.innerPosAttr;
      const innerPositions = innerPosAttr.array;
      const innerOrig = cd.innerOriginalPositions;
      const innerCount = innerPosAttr.count;

      for (let i = 0; i < innerCount; i++) {
        const idx = i * 3;
        const ox = innerOrig[idx];
        const oy = innerOrig[idx + 1];
        const oz = innerOrig[idx + 2];

        const n = simplexNoise3D(
          ox * inst.noiseFreqInner - time * 0.5,
          oy * inst.noiseFreqInner + time * 0.4,
          oz * inst.noiseFreqInner - time * 0.6
        );

        const displacement = 1.0 + n * inst.noiseAmpInner;

        innerPositions[idx] = ox * displacement;
        innerPositions[idx + 1] = oy * displacement;
        innerPositions[idx + 2] = oz * displacement;
      }
      innerPosAttr.needsUpdate = true;
      cd.innerGeometry.computeVertexNormals();

      // 4. Flotación oscilante en 3D
      const floatY = Math.sin(elapsedTime * 0.25 + inst.floatPhase) * 0.22;
      const floatX = Math.cos(elapsedTime * 0.20 + inst.floatPhase) * 0.14;

      // 5. Reacción interactiva al cursor
      const worldCellPos = inst.basePos.clone().add(cellGroup.position);
      const distToMouse = worldCellPos.distanceTo(mouseWorld);
      const interactRadius = 15.0;

      let targetPushX = 0;
      let targetPushY = 0;
      let targetTiltX = 0;
      let targetTiltY = 0;
      let targetScaleBoost = 1.0;

      if (distToMouse < interactRadius) {
        const factor = 1.0 - (distToMouse / interactRadius);
        const smoothFactor = Math.pow(factor, 2);

        const dirX = worldCellPos.x - mouseWorld.x;
        const dirY = worldCellPos.y - mouseWorld.y;

        targetPushX = (dirX > 0 ? 1 : -1) * smoothFactor * 2.0;
        targetPushY = (dirY > 0 ? 1 : -1) * smoothFactor * 2.0;

        targetTiltY = (mouseNDC.x) * smoothFactor * 0.8;
        targetTiltX = (-mouseNDC.y) * smoothFactor * 0.8;

        targetScaleBoost = 1.0 + smoothFactor * 0.14;
      }

      inst.targetOffset.x += (targetPushX - inst.targetOffset.x) * 0.05;
      inst.targetOffset.y += (targetPushY - inst.targetOffset.y) * 0.05;
      inst.mouseRotX += (targetTiltX - inst.mouseRotX) * 0.05;
      inst.mouseRotY += (targetTiltY - inst.mouseRotY) * 0.05;
      inst.currentScale += ((inst.baseScale * targetScaleBoost) - inst.currentScale) * 0.05;

      inst.pivot.position.set(
        inst.basePos.x + floatX + inst.targetOffset.x,
        inst.basePos.y + floatY + inst.targetOffset.y,
        inst.basePos.z
      );

      inst.pivot.rotation.x = inst.mouseRotX;
      inst.pivot.rotation.y = inst.mouseRotY;
      inst.pivot.scale.setScalar(inst.currentScale);
    });

    // Desplazamiento orgánico en Scroll
    const scrollFactor = Math.min(scrollY / 1000, 1);
    cellGroup.position.y = -scrollFactor * 1.2;

    // Renderizado con Post-processing
    composer.render();
  }

  animate();
}
