import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

RectAreaLightUniformsLib.init();

const BG = 0xf8fafc;

const container = document.getElementById('stage');
if (container) {
  // --- Escena base ---
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xf8fafc, 0.025);

  const camera = new THREE.PerspectiveCamera(
    28,
    window.innerWidth / window.innerHeight,
    0.1,
    120
  );
  camera.position.set(0, 3, 30);
  camera.lookAt(0, 3, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(BG, 1);
  container.appendChild(renderer.domElement);

  // --- Post-procesado: Profundidad de Campo (Depth of Field) sutil con OutputPass ---
  const composer = new EffectComposer(renderer);

  // 1. Render inicial de la escena 3D
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // 2. BokehPass con profundidad de campo sutil (focus en z = -5, aperture suave)
  const bokehPass = new BokehPass(scene, camera, {
    focus: 35.0,         // Plano de enfoque medio (35 unidades desde la cámara)
    aperture: 0.001,     // Apertura suave para un desenfoque sutil y elegante
    maxblur: 0.015,      // Desenfoque máximo contenido
    width: window.innerWidth,
    height: window.innerHeight,
  });
  composer.addPass(bokehPass);

  // 3. OutputPass para mantener los tonos de color exactos en sRGB
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  // --- Fondo degradado claro ---
  function buildBackgroundTexture(aspect) {
    const height = 1024;
    const width = Math.round(height * aspect);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#e5eaf0');
    grad.addColorStop(0.5, '#f7f7f7');
    grad.addColorStop(1, '#e5eaf0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  function updateBackground() {
    const aspect = window.innerWidth / window.innerHeight;
    // innerHeight can momentarily be 0 during tab creation/resize, which
    // turns aspect into Infinity/NaN and crashes createLinearGradient.
    const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
    const old = scene.background;
    scene.background = buildBackgroundTexture(safeAspect);
    if (old) old.dispose();
  }
  updateBackground();

  // --- Iluminación pura blanca ---
  const areaLight = new THREE.RectAreaLight(0xffffff, 5, 50, 403);
  const areaLight2 = new THREE.RectAreaLight(0xffffff, 1.4, 400, 403);
  areaLight2.position.set(-140, -41, 25);
  areaLight.position.set(90, 81, 40);
  areaLight.lookAt(0, 3, 0);
  areaLight2.lookAt(0, 3, 0);
  scene.add(areaLight);
  scene.add(areaLight2);

  // Paleta de blancos y cremas elegantes
  const palette = [
    0xffffff, // Blanco puro perla
  ];

  // --- Grupo y esferas ---
  const group = new THREE.Group();
  scene.add(group);

  const SPHERE_COUNT = 140;
  const spheres = [];
  const placedSpheres = [];

  function findNonOverlappingPosition(radius) {
    const spreadX = 38, yMin = 4, yMax = 14.5, zMin = -24, zMax = 6;
    const PADDING = 0.15;
    const MAX_ATTEMPTS = 60;

    let best = null;
    let bestScore = -Infinity;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const x = THREE.MathUtils.randFloatSpread(spreadX);
      const y = THREE.MathUtils.randFloat(yMin, yMax);
      const z = THREE.MathUtils.randFloat(zMin, zMax);

      let minGap = Infinity;
      for (const p of placedSpheres) {
        const dx = x - p.x, dy = y - p.y, dz = z - p.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const gap = dist - (radius + p.r + PADDING);
        if (gap < minGap) minGap = gap;
      }
      if (placedSpheres.length === 0) minGap = Infinity;

      if (minGap >= 0) {
        return { x, y, z };
      }
      if (minGap > bestScore) {
        bestScore = minGap;
        best = { x, y, z };
      }
    }
    return best;
  }

  // Geometría compartida + una única instancia de material (mismo color para
  // todas las esferas): permite renderizar todo el enjambre con InstancedMesh
  // en vez de 140 Mesh/Material independientes, sin cambiar el resultado visual.
  const geometry = new THREE.IcosahedronGeometry(1, 4);
  const coreGeometry = new THREE.SphereGeometry(1, 16, 16);

  const baseColor = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
  const material = new THREE.MeshPhysicalMaterial({
    color: baseColor,
    emissive: baseColor.clone().multiplyScalar(0.15),
    emissiveIntensity: 0.2,
    roughness: 0.3,
    metalness: 0,
  });
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    opacity: 0.65,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const sphereMesh = new THREE.InstancedMesh(geometry, material, SPHERE_COUNT);
  const coreMesh = new THREE.InstancedMesh(coreGeometry, coreMaterial, SPHERE_COUNT);
  group.add(sphereMesh);
  group.add(coreMesh);

  for (let i = 0; i < SPHERE_COUNT; i++) {
    const scale = THREE.MathUtils.randFloat(0.28, 0.95);
    const pos = findNonOverlappingPosition(scale);
    placedSpheres.push({ x: pos.x, y: pos.y, z: pos.z, r: scale });

    spheres.push({
      position: new THREE.Vector3(pos.x, pos.y, pos.z),
      basePos: new THREE.Vector3(pos.x, pos.y, pos.z),
      radius: scale,
      floatSpeed: THREE.MathUtils.randFloat(0.3, 0.9),
      floatAmp: THREE.MathUtils.randFloat(0.15, 0.5),
      phase: Math.random() * Math.PI * 2,
      rotSpeed: THREE.MathUtils.randFloat(-0.4, 0.4),
      rotX: 0,
      rotY: 0,
      velocity: new THREE.Vector3(),
    });
  }

  const MAX_LINKS = 100;
  const LINK_DISTANCE = 9.0;
  const MIN_CONNECTIONS = 1;
  const MAX_CONNECTIONS = 3;

  const links = [];
  const linkKeys = new Set();
  const connectionCount = new Array(spheres.length).fill(0);

  function addLink(i, j) {
    const key = i < j ? i + '-' + j : j + '-' + i;
    if (linkKeys.has(key)) return;
    linkKeys.add(key);
    links.push([i, j]);
    connectionCount[i]++;
    connectionCount[j]++;
  }

  const candidatePairs = [];
  for (let i = 0; i < spheres.length; i++) {
    for (let j = i + 1; j < spheres.length; j++) {
      candidatePairs.push([i, j, spheres[i].basePos.distanceTo(spheres[j].basePos)]);
    }
  }
  candidatePairs.sort((a, b) => a[2] - b[2]);

  for (const [i, j, dist] of candidatePairs) {
    if (links.length >= MAX_LINKS) break;
    if (dist >= LINK_DISTANCE) break;
    if (connectionCount[i] >= MAX_CONNECTIONS || connectionCount[j] >= MAX_CONNECTIONS) continue;
    addLink(i, j);
  }

  for (const [i, j] of candidatePairs) {
    if (links.length >= MAX_LINKS) break;
    if (connectionCount.every((c) => c >= MIN_CONNECTIONS)) break;
    if (connectionCount[i] >= MIN_CONNECTIONS && connectionCount[j] >= MIN_CONNECTIONS) continue;
    if (connectionCount[i] >= MAX_CONNECTIONS || connectionCount[j] >= MAX_CONNECTIONS) continue;
    addLink(i, j);
  }

  const LINK_RADIUS = 0.03;
  const linkGeometry = new THREE.CylinderGeometry(LINK_RADIUS, LINK_RADIUS, 1, 12, 1, false);
  const linkMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xd1d5db,
    emissiveIntensity: 3,
    roughness: 0.4,
    metalness: 0,
  });
  const linkMesh = new THREE.InstancedMesh(linkGeometry, linkMaterial, Math.max(links.length, 1));
  group.add(linkMesh);

  const _linkMid = new THREE.Vector3();
  const _linkDir = new THREE.Vector3();
  const _linkQuat = new THREE.Quaternion();
  const _linkScale = new THREE.Vector3();
  const _linkMatrix = new THREE.Matrix4();
  const _upAxis = new THREE.Vector3(0, 1, 0);

  const _floatTarget = new THREE.Vector3();
  const _instQuat = new THREE.Quaternion();
  const _instEuler = new THREE.Euler();
  const _instScale = new THREE.Vector3();
  const _instMatrix = new THREE.Matrix4();
  const _identityQuat = new THREE.Quaternion();

  const mouseNDC = new THREE.Vector2(0, 0);
  const raycaster = new THREE.Raycaster();
  const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const cursorWorldPos = new THREE.Vector3();
  let hasPointer = false;

  let targetScrollY = 0;
  let currentScrollY = 0;

  window.addEventListener('scroll', () => {
    targetScrollY = window.scrollY || document.documentElement.scrollTop;
  }, { passive: true });

  function updatePointer(clientX, clientY) {
    mouseNDC.x = (clientX / window.innerWidth) * 2 - 1;
    mouseNDC.y = -(clientY / window.innerHeight) * 2 + 1;
    hasPointer = true;
  }

  window.addEventListener('pointermove', (e) => updatePointer(e.clientX, e.clientY));
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      updatePointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  function updateCameraAspect() {
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;

    if (aspect < 1.0) {
      camera.fov = 42;
      camera.position.set(0, 3.5, 32);
      group.scale.setScalar(0.85);
    } else if (aspect < 1.4) {
      camera.fov = 34;
      camera.position.set(0, 3.2, 31);
      group.scale.setScalar(0.92);
    } else {
      camera.fov = 28;
      camera.position.set(0, 3, 30);
      group.scale.setScalar(1.0);
    }
    camera.updateProjectionMatrix();
  }
  updateCameraAspect();

  let resizeRAF = null;
  window.addEventListener('resize', () => {
    updateCameraAspect();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    bokehPass.setSize(window.innerWidth, window.innerHeight);

    if (resizeRAF) cancelAnimationFrame(resizeRAF);
    resizeRAF = requestAnimationFrame(updateBackground);
  });

  const clock = new THREE.Clock();
  const REPEL_RADIUS = 3.2;
  const REPEL_STRENGTH = 2.4;
  const SPRING = 0.06;
  const DAMPING = 0.90;

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    currentScrollY += (targetScrollY - currentScrollY) * 0.05;
    const scrollFactor = currentScrollY * 0.0025;

    if (hasPointer) {
      raycaster.setFromCamera(mouseNDC, camera);
      raycaster.ray.intersectPlane(interactionPlane, cursorWorldPos);
    }

    const mobileYOffset = window.innerWidth < 768 ? 2.5 : 0;
    group.rotation.y += ((mouseNDC.x * 0.25) + (scrollFactor * 0.15) - group.rotation.y) * 0.03;
    group.rotation.x += ((mouseNDC.y * 0.08) - (scrollFactor * 0.2) - group.rotation.x) * 0.03;
    group.position.y = -scrollFactor * 0.8 + mobileYOffset;

    for (const s of spheres) {
      const { position, basePos, floatSpeed, floatAmp, phase, rotSpeed, velocity } = s;

      _floatTarget.copy(basePos);
      _floatTarget.y += Math.sin(t * floatSpeed + phase) * floatAmp;
      _floatTarget.x += Math.cos(t * floatSpeed * 0.6 + phase) * (floatAmp * 0.4);

      if (hasPointer) {
        const dx = position.x - cursorWorldPos.x;
        const dy = position.y - cursorWorldPos.y;
        const dz = position.z - cursorWorldPos.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        const dist = Math.sqrt(distSq);

        if (dist < REPEL_RADIUS) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          velocity.x += (dx / (dist || 1)) * force * 0.02;
          velocity.y += (dy / (dist || 1)) * force * 0.02;
          velocity.z += (dz / (dist || 1)) * force * 0.02;
        }
      }

      velocity.x += (_floatTarget.x - position.x) * SPRING;
      velocity.y += (_floatTarget.y - position.y) * SPRING;
      velocity.z += (_floatTarget.z - position.z) * SPRING;

      velocity.multiplyScalar(DAMPING);
      position.add(velocity);

      s.rotX += rotSpeed * 0.01;
      s.rotY += rotSpeed * 0.015;
    }

    const COLLISION_PADDING = 0.05;
    const COLLISION_SOFTNESS = 0.5;
    for (let i = 0; i < spheres.length; i++) {
      const a = spheres[i].position;
      const ra = spheres[i].radius;
      for (let j = i + 1; j < spheres.length; j++) {
        const b = spheres[j].position;
        const rb = spheres[j].radius;
        const minDist = ra + rb + COLLISION_PADDING;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq > 0.0001 && distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          const overlap = (minDist - dist) * 0.5 * COLLISION_SOFTNESS;
          const nx = dx / dist, ny = dy / dist, nz = dz / dist;

          a.x -= nx * overlap;
          a.y -= ny * overlap;
          a.z -= nz * overlap;

          b.x += nx * overlap;
          b.y += ny * overlap;
          b.z += nz * overlap;
        }
      }
    }

    for (let i = 0; i < spheres.length; i++) {
      const s = spheres[i];

      _instQuat.setFromEuler(_instEuler.set(s.rotX, s.rotY, 0));
      _instScale.setScalar(s.radius);
      _instMatrix.compose(s.position, _instQuat, _instScale);
      sphereMesh.setMatrixAt(i, _instMatrix);

      // El núcleo es una esfera lisa: su rotación no altera el resultado
      // visual, así que se compone sin cuaternión para ahorrar trabajo.
      _instScale.setScalar(s.radius * 0.35);
      _instMatrix.compose(s.position, _identityQuat, _instScale);
      coreMesh.setMatrixAt(i, _instMatrix);
    }
    sphereMesh.instanceMatrix.needsUpdate = true;
    coreMesh.instanceMatrix.needsUpdate = true;

    for (let k = 0; k < links.length; k++) {
      const [i, j] = links[k];
      const a = spheres[i].position;
      const b = spheres[j].position;

      _linkDir.subVectors(b, a);
      const length = _linkDir.length();
      _linkMid.addVectors(a, b).multiplyScalar(0.5);
      _linkDir.normalize();
      _linkQuat.setFromUnitVectors(_upAxis, _linkDir);
      _linkScale.set(1, length, 1);

      _linkMatrix.compose(_linkMid, _linkQuat, _linkScale);
      linkMesh.setMatrixAt(k, _linkMatrix);
    }
    linkMesh.instanceMatrix.needsUpdate = true;

    composer.render();
  }

  animate();
}
