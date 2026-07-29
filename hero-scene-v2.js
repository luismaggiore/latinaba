import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

RectAreaLightUniformsLib.init();

const BG = 0xf8fafc;

const container = document.getElementById("stage");
if (container) {
  // --- Escena base ---
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xf8fafc, 0.015);

  const camera = new THREE.PerspectiveCamera(
    28,
    window.innerWidth / window.innerHeight,
    0.1,
    120
  );
  camera.position.set(0, 3, 30);
  camera.lookAt(0, 3, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(BG, 1);
  container.appendChild(renderer.domElement);

  // --- Post-procesado ---
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bokehPass = new BokehPass(scene, camera, {
    focus: 32.0,
    aperture: 0.002,
    maxblur: 0.01,
    width: window.innerWidth,
    height: window.innerHeight,
  });
  composer.addPass(bokehPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  // --- Fondo degradado claro ---
  function buildBackgroundTexture(aspect) {
    const height = 512;
    const width = Math.round(height * aspect);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#e5eaf0");
    grad.addColorStop(0.5, "#f7f7f7");
    grad.addColorStop(1, "#e5eaf0");
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

  // --- Iluminación ---
  const areaLight = new THREE.RectAreaLight(0xffffff, 5, 50, 403);
  const areaLight2 = new THREE.RectAreaLight(0xffffff, 1.4, 400, 403);
  areaLight2.position.set(-140, -41, 25);
  areaLight.position.set(90, 81, 40);
  areaLight.lookAt(0, 3, 0);
  areaLight2.lookAt(0, 3, 0);
  scene.add(areaLight);
  scene.add(areaLight2);

  // --- Grupos de escena ---
  const group = new THREE.Group();
  scene.add(group);

  // GRUPO DE LA HÉLICE DE ADN
  const dnaHelixGroup = new THREE.Group();
  dnaHelixGroup.position.set(3, 0, 0);
  dnaHelixGroup.rotation.z = -0.15;
  group.add(dnaHelixGroup);

  // ==========================================
  // OPCIÓN 2: ADN MOLÉCULAS
  // ==========================================
  const PAIR_LEVELS = 32;
  const HELIX_RADIUS = 3.2;
  const Y_MIN = -18.0;
  const Y_MAX = 24.0;
  const TURNS = 2.8;

  const RUNG_PALETTES = [
    [0xffffff, 0xefefef],

  ];

  const dnaSpheres = [];

  const nodeGeometry = new THREE.IcosahedronGeometry(1, 4);
  const coreGeometry = new THREE.SphereGeometry(1, 16, 16);

  const SUB_BACKBONE = 5;
  const TOTAL_BACKBONE_STEPS = (PAIR_LEVELS - 1) * SUB_BACKBONE + 1;
  const JITTER_AMP = 0.16;

  for (let k = 0; k < TOTAL_BACKBONE_STEPS; k++) {
    const progress = k / (TOTAL_BACKBONE_STEPS - 1);
    const y = Y_MIN + progress * (Y_MAX - Y_MIN);
    const angle = progress * (TURNS * Math.PI * 2);

    const isMainLevel = k % SUB_BACKBONE === 0;
    const baseR = isMainLevel
      ? THREE.MathUtils.randFloat(0.48, 0.58)
      : THREE.MathUtils.randFloat(0.18, 0.28);

    const jxA = THREE.MathUtils.randFloatSpread(JITTER_AMP);
    const jyA = THREE.MathUtils.randFloatSpread(JITTER_AMP);
    const jzA = THREE.MathUtils.randFloatSpread(JITTER_AMP);

    const xA = HELIX_RADIUS * Math.cos(angle) + jxA;
    const yA = y + jyA;
    const zA = HELIX_RADIUS * Math.sin(angle) + jzA;

    dnaSpheres.push({
      position: new THREE.Vector3(xA, yA, zA),
      basePos: new THREE.Vector3(xA, yA, zA),
      radius: baseR,
      color: 0xffffff,
      floatSpeed: THREE.MathUtils.randFloat(0.4, 0.8),
      floatAmp: THREE.MathUtils.randFloat(0.06, 0.14),
      phase: angle + Math.random() * 2.0,
      rotSpeed: THREE.MathUtils.randFloat(-0.4, 0.4),
      rotX: Math.random() * Math.PI,
      rotY: Math.random() * Math.PI,
      velocity: new THREE.Vector3(),
    });

    const jxB = THREE.MathUtils.randFloatSpread(JITTER_AMP);
    const jyB = THREE.MathUtils.randFloatSpread(JITTER_AMP);
    const jzB = THREE.MathUtils.randFloatSpread(JITTER_AMP);

    const xB = HELIX_RADIUS * Math.cos(angle + Math.PI) + jxB;
    const yB = y + jyB;
    const zB = HELIX_RADIUS * Math.sin(angle + Math.PI) + jzB;
    const baseR_B = isMainLevel
      ? THREE.MathUtils.randFloat(0.48, 0.58)
      : THREE.MathUtils.randFloat(0.18, 0.28);

    dnaSpheres.push({
      position: new THREE.Vector3(xB, yB, zB),
      basePos: new THREE.Vector3(xB, yB, zB),
      radius: baseR_B,
      color: 0xffffff,
      floatSpeed: THREE.MathUtils.randFloat(0.4, 0.8),
      floatAmp: THREE.MathUtils.randFloat(0.06, 0.14),
      phase: angle + Math.PI + Math.random() * 2.0,
      rotSpeed: THREE.MathUtils.randFloat(-0.4, 0.4),
      rotX: Math.random() * Math.PI,
      rotY: Math.random() * Math.PI,
      velocity: new THREE.Vector3(),
    });

    if (isMainLevel) {
      const levelIdx = Math.floor(k / SUB_BACKBONE);
      const palette = RUNG_PALETTES[levelIdx % RUNG_PALETTES.length];
      const RUNG_SPHERES = 12;

      for (let s = 1; s <= RUNG_SPHERES; s++) {
        const tRung = s / (RUNG_SPHERES + 1);
        const jxR = THREE.MathUtils.randFloatSpread(JITTER_AMP * 0.5);
        const jyR = THREE.MathUtils.randFloatSpread(JITTER_AMP * 0.5);
        const jzR = THREE.MathUtils.randFloatSpread(JITTER_AMP * 0.5);

        const rx = THREE.MathUtils.lerp(xA, xB, tRung) + jxR;
        const ry = THREE.MathUtils.lerp(yA, yB, tRung) + jyR;
        const rz = THREE.MathUtils.lerp(zA, zB, tRung) + jzR;

        const rungR = THREE.MathUtils.randFloat(0.14, 0.32);
        const rungColor = tRung <= 0.5 ? palette[0] : palette[1];

        dnaSpheres.push({
          position: new THREE.Vector3(rx, ry, rz),
          basePos: new THREE.Vector3(rx, ry, rz),
          radius: rungR,
          color: rungColor,
          floatSpeed: THREE.MathUtils.randFloat(0.4, 0.8),
          floatAmp: THREE.MathUtils.randFloat(0.04, 0.1),
          phase: angle + tRung * 3.0 + Math.random() * 1.5,
          rotSpeed: THREE.MathUtils.randFloat(-0.4, 0.4),
          rotX: Math.random() * Math.PI,
          rotY: Math.random() * Math.PI,
          velocity: new THREE.Vector3(),
        });
      }
    }
  }

  const dnaByColor = new Map();
  for (let i = 0; i < dnaSpheres.length; i++) {
    const hex = dnaSpheres[i].color;
    if (!dnaByColor.has(hex)) dnaByColor.set(hex, []);
    dnaByColor.get(hex).push(i);
  }

  const dnaColorMeshes = [];
  dnaByColor.forEach((indices, hex) => {
    const isWhite = hex === 0xffffff;
    const mat = new THREE.MeshPhysicalMaterial({
      color: hex,
      emissive: new THREE.Color(hex).multiplyScalar(isWhite ? 0.18 : 0.12),
      emissiveIntensity: isWhite ? 0.2 : 0.25,
      roughness: isWhite ? 0.25 : 0.5,
      metalness: isWhite ? 0.0 : 0.3,
    });
    const coreMat = new THREE.MeshBasicMaterial({
      color: hex,
      opacity: isWhite ? 0.65 : 0.75,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const mesh = new THREE.InstancedMesh(nodeGeometry, mat, indices.length);
    const coreMesh = new THREE.InstancedMesh(
      coreGeometry,
      coreMat,
      indices.length
    );

    dnaHelixGroup.add(mesh);
    dnaHelixGroup.add(coreMesh);

    dnaColorMeshes.push({ hex, indices, mesh, coreMesh });
  });

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

  window.addEventListener(
    "scroll",
    () => {
      targetScrollY = window.scrollY || document.documentElement.scrollTop;
    },
    { passive: true }
  );

  function updatePointer(clientX, clientY) {
    mouseNDC.x = (clientX / window.innerWidth) * 2 - 1;
    mouseNDC.y = -(clientY / window.innerHeight) * 2 + 1;
    hasPointer = true;
  }

  window.addEventListener("pointermove", (e) =>
    updatePointer(e.clientX, e.clientY)
  );
  window.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 0) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    },
    { passive: true }
  );

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
  window.addEventListener("resize", () => {
    updateCameraAspect();
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2)
    );
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    bokehPass.setSize(window.innerWidth, window.innerHeight);

    if (resizeRAF) cancelAnimationFrame(resizeRAF);
    resizeRAF = requestAnimationFrame(updateBackground);
  });

  const clock = new THREE.Clock();
  const REPEL_RADIUS = 3.6;
  const REPEL_STRENGTH = 2.4;
  const SPRING = 0.06;
  const DAMPING = 0.89;

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    currentScrollY += (targetScrollY - currentScrollY) * 0.05;
    const scrollFactor = currentScrollY * 0.0025;

    if (hasPointer) {
      raycaster.setFromCamera(mouseNDC, camera);
      raycaster.ray.intersectPlane(interactionPlane, cursorWorldPos);
    }

    dnaHelixGroup.rotation.y = t * 0.35;

    const mobileYOffset = window.innerWidth < 768 ? 2.5 : 0;
    group.rotation.y = mouseNDC.x * 0.12 + scrollFactor * 0.1;
    group.rotation.x = mouseNDC.y * 0.05 - scrollFactor * 0.15;
    group.position.y = -scrollFactor * 0.8 + mobileYOffset;

    for (let i = 0; i < dnaSpheres.length; i++) {
      const s = dnaSpheres[i];
      const {
        position,
        basePos,
        floatSpeed,
        floatAmp,
        phase,
        rotSpeed,
        velocity,
      } = s;

      _floatTarget.copy(basePos);
      _floatTarget.y += Math.sin(t * floatSpeed + phase) * floatAmp;
      _floatTarget.x +=
        Math.cos(t * floatSpeed * 0.6 + phase) * (floatAmp * 0.4);

      if (hasPointer) {
        const localCursor = cursorWorldPos
          .clone()
          .applyMatrix4(dnaHelixGroup.matrixWorld.clone().invert());
        const dx = position.x - localCursor.x;
        const dy = position.y - localCursor.y;
        const dz = position.z - localCursor.z;
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

    for (const groupObj of dnaColorMeshes) {
      const { indices, mesh, coreMesh } = groupObj;
      for (let instanceIdx = 0; instanceIdx < indices.length; instanceIdx++) {
        const sphereIdx = indices[instanceIdx];
        const s = dnaSpheres[sphereIdx];

        _instQuat.setFromEuler(_instEuler.set(s.rotX, s.rotY, 0));
        _instScale.setScalar(s.radius);
        _instMatrix.compose(s.position, _instQuat, _instScale);
        mesh.setMatrixAt(instanceIdx, _instMatrix);

        _instScale.setScalar(s.radius * 0.35);
        _instMatrix.compose(s.position, _identityQuat, _instScale);
        coreMesh.setMatrixAt(instanceIdx, _instMatrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      coreMesh.instanceMatrix.needsUpdate = true;
    }

    composer.render();
  }

  animate();
}
