import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

RectAreaLightUniformsLib.init();

const BG = 0xf8fafc;

const container = document.getElementById("stage");
if (container) {
  // --- Escena Base ---
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xf8fafc, 0.010);

  const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    180
  );
  camera.position.set(0, 0, 30);
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

  // --- Post-Procesado (Bokeh Depth of Field) ---
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bokehPass = new BokehPass(scene, camera, {
    focus: 30.0,
    aperture: 0.0007,
    maxblur: 0.012,
    width: window.innerWidth,
    height: window.innerHeight,
  });
  composer.addPass(bokehPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  // --- Fondo Degradado Estudio Blanco Perlado Neutro ---
  function buildBackgroundTexture(aspect) {
    const height = 512;
    const width = Math.round(height * aspect);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.5, "#f1f5f9");
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

  // --- Iluminación Escénica de Estudio ---
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.6);
  keyLight.position.set(25, 35, 25);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xe2e8f0, 1.8);
  fillLight.position.set(-25, -20, -15);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 1.8);
  rimLight.position.set(0, 25, -25);
  scene.add(rimLight);

  const ambientLight = new THREE.AmbientLight(0xf8fafc, 1.35);
  scene.add(ambientLight);

  const areaLight = new THREE.RectAreaLight(0xffffff, 4.5, 60, 60);
  areaLight.position.set(15, 25, 20);
  areaLight.lookAt(0, 4, 0);
  scene.add(areaLight);

  // --- Contenedor del Flujo Celular Superior ---
  const flowGroup = new THREE.Group();
  scene.add(flowGroup);

  const cellInstances = [];
  const mixers = [];

  // Indicador de Carga UI Sutil
  const loadingOverlay = document.createElement("div");
  loadingOverlay.id = "cell-loading-indicator";
  loadingOverlay.style.position = "fixed";
  loadingOverlay.style.bottom = "20px";
  loadingOverlay.style.right = "20px";
  loadingOverlay.style.background = "rgba(255, 255, 255, 0.85)";
  loadingOverlay.style.backdropFilter = "blur(8px)";
  loadingOverlay.style.border = "1px solid rgba(0,0,0,0.1)";
  loadingOverlay.style.padding = "8px 16px";
  loadingOverlay.style.borderRadius = "20px";
  loadingOverlay.style.fontSize = "0.75rem";
  loadingOverlay.style.fontWeight = "600";
  loadingOverlay.style.color = "#0f172a";
  loadingOverlay.style.zIndex = "1000";
  loadingOverlay.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
  loadingOverlay.style.transition = "opacity 0.5s ease";
  loadingOverlay.innerHTML = `<span>Loading 3D Red Blood Cell... <strong id="cell-progress">0%</strong></span>`;
  document.body.appendChild(loadingOverlay);

  // --- Carga del Modelo GLTF/GLB (red_blood_cell.glb) ---
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/");

  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  const pearlWhiteColor = new THREE.Color("#ffffff");

  gltfLoader.load(
    "red_blood_cell.glb",
    (gltf) => {
      const baseModel = gltf.scene;

      // Centrar pivote del modelo base en su centro geométrico
      const box = new THREE.Box3().setFromObject(baseModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      baseModel.position.sub(center);

      // Normalizar escala base
      const maxDim = Math.max(size.x, size.y, size.z);
      const baseScale = 2.4 / (maxDim || 1);
      baseModel.scale.setScalar(baseScale);

      // Aplicar Material Blanco Perlado Puro
      baseModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.castShadow = true;
          child.receiveShadow = true;

          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => {
            mat.side = THREE.DoubleSide;
            if (mat.color) {
              mat.color.copy(pearlWhiteColor);
            }
            if (mat.roughness !== undefined) mat.roughness = 0.22;
            if (mat.metalness !== undefined) mat.metalness = 0.05;
            if (mat.clearcoat !== undefined) mat.clearcoat = 0.45;
            if (mat.clearcoatRoughness !== undefined) mat.clearcoatRoughness = 0.10;
          });
        }
      });

      // Parámetros del torrente de células en la parte superior
      const cellCount = 45;
      const streamWidth = 38.0;
      const topYCenter = 6.8;

      for (let i = 0; i < cellCount; i++) {
        const cellClone = baseModel.clone(true);

        // ROTACIÓN INICIAL COMPLETAMENTE ALEATORIA PARA CADA CÉLULA
        cellClone.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        );

        const x = (Math.random() - 0.5) * streamWidth;
        const y = topYCenter + (Math.random() - 0.5) * 3.8 + Math.sin(x * 0.2) * 0.8;
        const z = (Math.random() - 0.5) * 8.0;
        const instanceScale = 0.70 + Math.random() * 0.65;

        const cellPivot = new THREE.Group();
        cellPivot.position.set(x, y, z);
        cellPivot.scale.setScalar(instanceScale);
        cellPivot.add(cellClone);

        flowGroup.add(cellPivot);

        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(cellClone);
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.timeScale = 0.3;
            action.play();
          });
          mixers.push(mixer);
        }

        cellInstances.push({
          pivot: cellPivot,
          model: cellClone,
          pos: new THREE.Vector3(x, y, z),
          baseY: y,
          baseZ: z,
          scale: instanceScale,
          flowSpeed: 0.035 + Math.random() * 0.040,
          rotSpeedX: (Math.random() - 0.5) * 0.014,
          rotSpeedY: (Math.random() - 0.5) * 0.020,
          rotSpeedZ: (Math.random() - 0.5) * 0.012,
          wavePhase: Math.random() * Math.PI * 2,
          waveFreq: 0.7 + Math.random() * 0.7,
          targetOffsetX: 0,
          targetOffsetY: 0
        });
      }

      // Ocultar indicador de carga con fade-out
      loadingOverlay.style.opacity = "0";
      setTimeout(() => {
        if (loadingOverlay.parentNode) {
          loadingOverlay.parentNode.removeChild(loadingOverlay);
        }
      }, 500);
    },
    (xhr) => {
      if (xhr.lengthComputable && xhr.total > 0) {
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        const progressEl = document.getElementById("cell-progress");
        if (progressEl) progressEl.innerText = `${percent}%`;
      }
    },
    (error) => {
      console.error("Error cargando red_blood_cell.glb:", error);
      loadingOverlay.innerHTML = `<span style="color: #ef4444;">Error cargando modelo 3D</span>`;
    }
  );

  // --- Control de Interacción con Mouse & Scroll ---
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

  // --- Bucle de Animación del Torrente Blanco Perlado ---
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    mixers.forEach((m) => m.update(delta));

    const streamWidth = 38.0;

    cellInstances.forEach((c) => {
      // 1. Avance continuo horizontal
      c.pos.x += c.flowSpeed;
      if (c.pos.x > streamWidth * 0.5 + 2) {
        c.pos.x = -streamWidth * 0.5 - 2;
        // Re-randomizar la rotación al reingresar por la izquierda
        c.model.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        );
      }

      // 2. Ondulación suave
      const waveY = Math.sin(elapsedTime * c.waveFreq + c.wavePhase + c.pos.x * 0.25) * 0.40;
      const waveZ = Math.cos(elapsedTime * c.waveFreq * 0.8 + c.wavePhase) * 0.25;

      // 3. Rotación libre continua
      c.model.rotation.x += c.rotSpeedX;
      c.model.rotation.y += c.rotSpeedY;
      c.model.rotation.z += c.rotSpeedZ;

      // 4. Reacción interactiva al cursor
      const cellWorldPos = new THREE.Vector3(c.pos.x, c.baseY + waveY, c.baseZ + waveZ);
      const distToMouse = cellWorldPos.distanceTo(mouseWorld);
      let targetPushY = 0;
      let targetPushX = 0;

      if (distToMouse < 11.0) {
        const factor = Math.pow(1.0 - distToMouse / 11.0, 2);
        targetPushY = (cellWorldPos.y > mouseWorld.y ? 1 : -1) * factor * 1.4;
        targetPushX = (cellWorldPos.x > mouseWorld.x ? 1 : -1) * factor * 0.9;
      }

      c.targetOffsetX += (targetPushX - c.targetOffsetX) * 0.05;
      c.targetOffsetY += (targetPushY - c.targetOffsetY) * 0.05;

      c.pivot.position.set(
        c.pos.x + c.targetOffsetX,
        c.baseY + waveY + c.targetOffsetY,
        c.baseZ + waveZ
      );
    });

    // Desplazamiento orgánico en Scroll
    const scrollFactor = Math.min(scrollY / 1000, 1);
    flowGroup.position.y = -scrollFactor * 1.2;

    // Renderizado con Post-processing
    composer.render();
  }

  animate();
}
