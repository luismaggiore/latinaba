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
  // --- Escena Base ---
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xf8fafc, 0.017);

  const camera = new THREE.PerspectiveCamera(
    40,
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

  // --- Post-Procesado (Bokeh Depth of Field) ---
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bokehPass = new BokehPass(scene, camera, {
    focus: 30.0,
    aperture: 0.0006,
    maxblur: 0.00, // Desenfoque más contenido y afilado
    width: window.innerWidth,
    height: window.innerHeight,
  });
  composer.addPass(bokehPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  // --- Fondo Degradado Claro ---
  function buildBackgroundTexture(aspect) {
    const height = 512;
    const width = Math.round(height * aspect);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#e2e8f0");
    grad.addColorStop(0.5, "#f8fafc");
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

  // --- Iluminación Escénica ---
  const areaLight1 = new THREE.RectAreaLight(0xffffff, 4.5, 50, 400);
  areaLight1.position.set(90, 80, 40);
  areaLight1.lookAt(0, 3, 0);

  const areaLight2 = new THREE.RectAreaLight(0xdbeafe, 2.0, 400, 400);
  areaLight2.position.set(-140, -40, 25);
  areaLight2.lookAt(0, 3, 0);

  scene.add(areaLight1);
  scene.add(areaLight2);

  const ambientLight = new THREE.AmbientLight(0xf1f5f9, 1.2);
  scene.add(ambientLight);

  // --- Grupo Principal ---
  const group = new THREE.Group();
  scene.add(group);

  // =========================================================================
  // OPCIÓN 4: RED SINÁPTICA DIAGONAL CURVA (TOP-LEFT A BOTTOM-RIGHT)
  // Distribución de nodos a lo largo de una trayectoria curva diagonal
  // que fluye desde la esquina superior izquierda a la inferior derecha.
  // =========================================================================

  const NODE_COUNT = 80;
  const nodes = [];
  const placedNodes = [];

  function findNodePosition(index) {
    const PADDING = 0.5;
    const MAX_ATTEMPTS = 75;

    // Bounds contenidos perfectamente dentro del encuadre de la cámara
    const xStart = -26.0, xEnd = 28.0;
    const zStart = -6.0, zEnd = 5.0;

    let best = null;
    let bestScore = -Infinity;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const tProgress = THREE.MathUtils.clamp(
        (index / (NODE_COUNT - 1)) + THREE.MathUtils.randFloatSpread(0.20),
        0.0,
        1.0
      );

      const baseX = THREE.MathUtils.lerp(xStart, xEnd, tProgress);

      // Arco semicircular elegante perfectamente encuadrado
      const semiCircleArc = Math.sin(Math.pow(tProgress, 0.65) * Math.PI) * 13.5;
      const linearY = THREE.MathUtils.lerp(8.0, -10.0, tProgress);
      const baseY = linearY + semiCircleArc;

      const baseZ = THREE.MathUtils.lerp(zStart, zEnd, tProgress) + Math.cos(tProgress * Math.PI) * 4.0;

      // Dispersión 3D contenida dentro de la toma
      const x = baseX + THREE.MathUtils.randFloatSpread(1.0);
      const y = baseY + THREE.MathUtils.randFloatSpread(30.0);
      const z = baseZ + THREE.MathUtils.randFloatSpread(32.0);

      let minGap = Infinity;
      for (const p of placedNodes) {
        const dx = x - p.x;
        const dy = y - p.y;
        const dz = z - p.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const gap = dist - PADDING;
        if (gap < minGap) minGap = gap;
      }
      if (placedNodes.length === 0) minGap = Infinity;

      if (minGap >= 0) return { x, y, z };
      if (minGap > bestScore) {
        bestScore = minGap;
        best = { x, y, z };
      }
    }
    return best;
  }

  for (let i = 0; i < NODE_COUNT; i++) {
    const isHub = i % 7 === 0;
    const pos = findNodePosition(i);
    placedNodes.push({ x: pos.x, y: pos.y, z: pos.z });

    nodes.push({
      position: new THREE.Vector3(pos.x, pos.y, pos.z),
      basePos: new THREE.Vector3(pos.x, pos.y, pos.z),
      floatSpeed: THREE.MathUtils.randFloat(0.3, 0.7),
      floatAmp: THREE.MathUtils.randFloat(0.08, 0.22),
      phase: Math.random() * Math.PI * 2,
      velocity: new THREE.Vector3(),
      isHub: isHub,
    });
  }

  // --- Conexiones de la Red ---
  const links = [];
  const linkKeys = new Set();
  const connectionCount = new Array(NODE_COUNT).fill(0);
  const MAX_LINKS = 1850;
  const LINK_DISTANCE = 18.0;

  function addLink(i, j) {
    if (i === j) return;
    const key = i < j ? `${i}-${j}` : `${j}-${i}`;
    if (linkKeys.has(key)) return;
    linkKeys.add(key);
    links.push({ i, j });
    connectionCount[i]++;
    connectionCount[j]++;
  }

  const candidatePairs = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    for (let j = i + 1; j < NODE_COUNT; j++) {
      candidatePairs.push([
        i,
        j,
        nodes[i].basePos.distanceTo(nodes[j].basePos),
      ]);
    }
  }
  candidatePairs.sort((a, b) => a[2] - b[2]);

  for (const [i, j, dist] of candidatePairs) {
    if (links.length >= MAX_LINKS) break;
    if (dist >= LINK_DISTANCE) break;
    if (connectionCount[i] >= 4 || connectionCount[j] >= 4) continue;
    addLink(i, j);
  }

  // Asegurar componente totalmente conexo (Union-Find)
  const parent = Array.from({ length: NODE_COUNT }, (_, k) => k);
  function find(u) {
    return parent[u] === u ? u : (parent[u] = find(parent[u]));
  }
  function union(u, v) {
    const rootU = find(u);
    const rootV = find(v);
    if (rootU !== rootV) {
      parent[rootU] = rootV;
      return true;
    }
    return false;
  }
  for (const link of links) {
    union(link.i, link.j);
  }
  for (const [i, j] of candidatePairs) {
    if (find(i) !== find(j)) {
      union(i, j);
      addLink(i, j);
    }
  }

  // Garantizar red totalmente cerrada (mínimo 2 conexiones por cada nodo)
  const MIN_CONNECTIONS = 2;

  for (let i = 0; i < NODE_COUNT; i++) {
    while (connectionCount[i] < MIN_CONNECTIONS) {
      let bestJ = -1;
      let minDist = Infinity;
      for (let j = 0; j < NODE_COUNT; j++) {
        if (i === j) continue;
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (linkKeys.has(key)) continue;

        const d = nodes[i].basePos.distanceTo(nodes[j].basePos);
        if (d < minDist) {
          minDist = d;
          bestJ = j;
        }
      }
      if (bestJ !== -1) {
        addLink(i, bestJ);
      } else {
        break;
      }
    }
  }

  // =========================================================================
  // MATRICIAL Y SHADER DE AXONES RECTOS CON PULSOS (SUAVES)
  // =========================================================================

  const TUBULAR_SEGMENTS = 1;
  const RADIAL_SEGMENTS = 4;
  const AXON_RADIUS = 0.03;

  const pulseUniforms = {
    uTime: { value: 0 },
    uPulseColor: { value: new THREE.Color(0x007575) }, // Azul celeste suave
    uPulseSpeed: { value: 0.7 },
    uPulseWidth: { value: 0.3 },
  };

  // Material suave plateado/perla que se integra delicadamente con el fondo claro
  const axonMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xbbccdd,
    emissive: 0x334155,
    emissiveIntensity: 0.12,
    roughness: 0.35,
    metalness: 0.1,
  });

  axonMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = pulseUniforms.uTime;
    shader.uniforms.uPulseColor = pulseUniforms.uPulseColor;
    shader.uniforms.uPulseSpeed = pulseUniforms.uPulseSpeed;
    shader.uniforms.uPulseWidth = pulseUniforms.uPulseWidth;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute float aT;
        attribute float aEdgePhase;
        varying float vT;
        varying float vEdgePhase;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vT = aT;
        vEdgePhase = aEdgePhase;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uTime;
        uniform vec3 uPulseColor;
        uniform float uPulseSpeed;
        uniform float uPulseWidth;
        varying float vT;
        varying float vEdgePhase;`
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        // Pulso 1: Sentido directo (0 -> 1)
        float pulseT1 = fract(uTime * uPulseSpeed + vEdgePhase);
        float delta1 = vT - pulseT1;
        if (delta1 < 0.0) delta1 += 1.0;
        float rawPulse1 = smoothstep(uPulseWidth, 0.0, delta1);
        float pulse1 = pow(rawPulse1, 1.8);

        // Pulso 2: Sentido contrario (1 -> 0) con desfase dinámico
        float pulseT2 = fract(1.0 - (uTime * (uPulseSpeed * 0.85) + vEdgePhase * 1.6 + 0.5));
        float delta2 = pulseT2 - vT;
        if (delta2 < 0.0) delta2 += 1.0;
        float rawPulse2 = smoothstep(uPulseWidth, 0.0, delta2);
        float pulse2 = pow(rawPulse2, 1.8);

        // Combinación de ambos pulsos con destello de colisión/intersección
        float totalPulse = max(pulse1, pulse2) + (pulse1 * pulse2 * 0.7);

        // Destello sutil en los extremos
        float junctionGlow = smoothstep(0.06, 0.0, vT) + smoothstep(0.94, 1.0, vT);

        vec3 activeEmissive = (uPulseColor * totalPulse * 1.15) + 
                             (vec3(0.5, 0.8, 1.0) * junctionGlow * (totalPulse * 0.2 + 0.08));

        totalEmissiveRadiance += activeEmissive;`
      );
  };

  const tubeTracks = [];

  for (let k = 0; k < links.length; k++) {
    const { i, j } = links[k];
    const posA = nodes[i].position;
    const posB = nodes[j].position;

    const curve = new THREE.LineCurve3(posA.clone(), posB.clone());

    const tubeGeo = new THREE.TubeGeometry(
      curve,
      TUBULAR_SEGMENTS,
      AXON_RADIUS,
      RADIAL_SEGMENTS,
      false
    );

    const uvAttr = tubeGeo.attributes.uv;
    const vertCount = uvAttr.count;
    const aT = new Float32Array(vertCount);
    for (let vi = 0; vi < vertCount; vi++) {
      aT[vi] = uvAttr.getX(vi);
    }
    tubeGeo.setAttribute("aT", new THREE.BufferAttribute(aT, 1));

    const edgePhase = Math.random();
    const aEdgePhase = new Float32Array(vertCount).fill(edgePhase);
    tubeGeo.setAttribute("aEdgePhase", new THREE.BufferAttribute(aEdgePhase, 1));

    const mesh = new THREE.Mesh(tubeGeo, axonMaterial);
    group.add(mesh);

    tubeTracks.push({
      i,
      j,
      curve,
      tubeGeo,
    });
  }

  // --- Actualización de Vértices In-Place (Tubos Rectos, Zero GC) ---
  const _vP = new THREE.Vector3();
  const _vN = new THREE.Vector3();
  const _vB = new THREE.Vector3();
  const _vVertex = new THREE.Vector3();
  const _vNormal = new THREE.Vector3();

  function updateTubeVerticesInPlace(track) {
    const { i, j, curve, tubeGeo } = track;
    const posA = nodes[i].position;
    const posB = nodes[j].position;

    curve.v1.copy(posA);
    curve.v2.copy(posB);

    const posAttr = tubeGeo.attributes.position;
    const frames = curve.computeFrenetFrames(TUBULAR_SEGMENTS, false);

    let idx = 0;
    for (let uIdx = 0; uIdx <= TUBULAR_SEGMENTS; uIdx++) {
      const u = uIdx / TUBULAR_SEGMENTS;
      curve.getPointAt(u, _vP);
      _vN.copy(frames.normals[uIdx]);
      _vB.copy(frames.binormals[uIdx]);

      for (let rIdx = 0; rIdx <= RADIAL_SEGMENTS; rIdx++) {
        const v = (rIdx / RADIAL_SEGMENTS) * Math.PI * 2;
        const cx = -AXON_RADIUS * Math.cos(v);
        const cy = AXON_RADIUS * Math.sin(v);

        _vNormal.x = cx * _vN.x + cy * _vB.x;
        _vNormal.y = cx * _vN.y + cy * _vB.y;
        _vNormal.z = cx * _vN.z + cy * _vB.z;

        _vVertex.copy(_vP).add(_vNormal);

        posAttr.setXYZ(idx, _vVertex.x, _vVertex.y, _vVertex.z);
        idx++;
      }
    }
    posAttr.needsUpdate = true;
  }

  // Auxiliary structures
  const _floatTarget = new THREE.Vector3();
  const _instQuat = new THREE.Quaternion();
  const _instEuler = new THREE.Euler();
  const _instScale = new THREE.Vector3();
  const _instMatrix = new THREE.Matrix4();

  // Pointer & Scroll
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
      // Pantallas móviles: elevamos la cámara y centramos más arriba
      camera.fov = 52;
      camera.position.set(0, 1.2, 32);
      group.scale.setScalar(0.85);
    } else if (aspect < 1.4) {
      camera.fov = 50;
      camera.position.set(0, 2.2, 31);
      group.scale.setScalar(0.92);
    } else {
      camera.fov = 48;
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
  const REPEL_RADIUS = 4.0;
  const REPEL_STRENGTH = 2.6;
  const SPRING = 0.05;
  const DAMPING = 0.88;

  // --- BUCLE DE ANIMACIÓN DE ALTO RENDIMIENTO (60 FPS, 0 ALLOCATIONS) ---
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    pulseUniforms.uTime.value = t;

    currentScrollY += (targetScrollY - currentScrollY) * 0.05;
    const scrollFactor = currentScrollY * 0.0025;

    if (hasPointer) {
      raycaster.setFromCamera(mouseNDC, camera);
      raycaster.ray.intersectPlane(interactionPlane, cursorWorldPos);
    }

    const mobileYOffset = window.innerWidth < 768 ? 2.5 : 0;
    group.rotation.y +=
      (mouseNDC.x * 0.22 + scrollFactor * 0.12 - group.rotation.y) * 0.03;
    group.rotation.x +=
      (mouseNDC.y * 0.08 - scrollFactor * 0.18 - group.rotation.x) * 0.03;
    group.position.y = -scrollFactor * 0.8 + mobileYOffset;

    // 1. Actualizar posiciones de nodos sinápticos
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const { position, basePos, floatSpeed, floatAmp, phase, velocity } = n;

      _floatTarget.copy(basePos);
      _floatTarget.y += Math.sin(t * floatSpeed + phase) * floatAmp;
      _floatTarget.x +=
        Math.cos(t * floatSpeed * 0.6 + phase) * (floatAmp * 0.4);

      if (hasPointer) {
        const localCursor = cursorWorldPos
          .clone()
          .applyMatrix4(group.matrixWorld.clone().invert());
        const dx = position.x - localCursor.x;
        const dy = position.y - localCursor.y;
        const dz = position.z - localCursor.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        const dist = Math.sqrt(distSq);

        if (dist < REPEL_RADIUS) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          velocity.x += (dx / (dist || 1)) * force * 0.022;
          velocity.y += (dy / (dist || 1)) * force * 0.022;
          velocity.z += (dz / (dist || 1)) * force * 0.022;
        }
      }

      velocity.x += (_floatTarget.x - position.x) * SPRING;
      velocity.y += (_floatTarget.y - position.y) * SPRING;
      velocity.z += (_floatTarget.z - position.z) * SPRING;

      velocity.multiplyScalar(DAMPING);
      position.add(velocity);
    }

    // 2. Actualizar tubos rectos IN-PLACE
    for (let k = 0; k < tubeTracks.length; k++) {
      updateTubeVerticesInPlace(tubeTracks[k]);
    }

    composer.render();
  }

  animate();
}
