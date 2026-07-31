import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

RectAreaLightUniformsLib.init();

// Tono del entorno: Celeste estudio fresco y elegante
const BG = 0xebf5ff;

const container = document.getElementById("stage");
if (container) {
  // --- Escena Base con Niebla Celeste Suave ---
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xebf5ff, 0.006);

  const camera = new THREE.PerspectiveCamera(
    38,
    window.innerWidth / window.innerHeight,
    0.1,
    220
  );
  camera.position.set(0, 0, 32);
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
  renderer.toneMappingExposure = 1.22;
  container.appendChild(renderer.domElement);

  // --- Post-Procesado (Bokeh Depth of Field Blur) ---
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bokehPass = new BokehPass(scene, camera, {
    focus: 32.0,
    aperture: 0.0006,
    maxblur: 0.013,
    width: window.innerWidth,
    height: window.innerHeight,
  });
  composer.addPass(bokehPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  // --- Fondo Degradado Estudio Celeste / Sky Blue ---
  function buildBackgroundTexture(aspect) {
    const height = 512;
    const width = Math.round(height * aspect);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    const grad = ctx.createRadialGradient(
      width * 0.5, height * 0.4, 50,
      width * 0.5, height * 0.5, width * 0.9
    );
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.35, "#e0f2fe");
    grad.addColorStop(1, "#bae6fd");
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

  // --- Iluminación Escénica Tono Celeste Armónico ---
  // Luz Principal (Key Light)
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.4);
  keyLight.position.set(30, 35, 30);
  scene.add(keyLight);

  // Luz de Relleno Tono Celeste Cyan (Fill Light)
  const fillLight = new THREE.DirectionalLight(0x7dd3fc, 2.0);
  fillLight.position.set(-30, -25, -15);
  scene.add(fillLight);

  // Luz de Contorno Celeste Claro (Rim Light)
  const rimLight = new THREE.DirectionalLight(0xe0f2fe, 1.8);
  rimLight.position.set(0, 30, -30);
  scene.add(rimLight);

  // Luz Ambiental Celeste Suave
  const ambientLight = new THREE.AmbientLight(0xf0f9ff, 1.45);
  scene.add(ambientLight);

  const areaLight = new THREE.RectAreaLight(0xe0f2fe, 4.5, 60, 60);
  areaLight.position.set(20, 25, 25);
  areaLight.lookAt(0, 0, 0);
  scene.add(areaLight);

  // --- Contenedor Principal para las 6 Células ---
  const cellGroup = new THREE.Group();
  if (window.innerWidth > 992) {
    cellGroup.position.set(1.0, 0, 0);
  } else {
    cellGroup.position.set(0, -0.5, 0);
  }
  scene.add(cellGroup);

  const mixers = [];
  const cellInstances = [];

  // Indicador de Carga UI Sutil
  const loadingOverlay = document.createElement("div");
  loadingOverlay.id = "cell-loading-indicator";
  loadingOverlay.style.position = "fixed";
  loadingOverlay.style.bottom = "20px";
  loadingOverlay.style.right = "20px";
  loadingOverlay.style.background = "rgba(255, 255, 255, 0.85)";
  loadingOverlay.style.backdropFilter = "blur(8px)";
  loadingOverlay.style.border = "1px solid rgba(186, 230, 253, 0.6)";
  loadingOverlay.style.padding = "8px 16px";
  loadingOverlay.style.borderRadius = "20px";
  loadingOverlay.style.fontSize = "0.75rem";
  loadingOverlay.style.fontWeight = "600";
  loadingOverlay.style.color = "#0f172a";
  loadingOverlay.style.zIndex = "1000";
  loadingOverlay.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
  loadingOverlay.style.transition = "opacity 0.5s ease";
  loadingOverlay.innerHTML = `<span>Loading 3D Cell Models... <strong id="cell-progress">0%</strong></span>`;
  document.body.appendChild(loadingOverlay);

  // --- Carga del Modelo GLTF/GLB (cell.glb) ---
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/gltf/");

  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  gltfLoader.load(
    "cell.glb",
    (gltf) => {
      const baseModel = gltf.scene;

      // Calcular caja delimitadora y centrar el modelo base en su pivote
      const box = new THREE.Box3().setFromObject(baseModel);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      baseModel.position.sub(center);

      // Escala base
      const maxDim = Math.max(size.x, size.y, size.z);
      const baseScale = 15.0 / (maxDim || 1);
      baseModel.scale.setScalar(baseScale);

      // GIRO DE HUE A CELESTE / CYAN / BLUE AZULADO
      baseModel.traverse((child) => {
        if (child.isMesh && child.material) {
          child.castShadow = true;
          child.receiveShadow = true;

          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat) => {
            mat.side = THREE.DoubleSide;

            // Ajustar el Hue del material hacia tonos Celeste / Cian / Azul
            if (mat.color) {
              const hsl = {};
              mat.color.getHSL(hsl);
              // Rotar Hue a rango Celeste (0.52 - 0.58)
              let newHue = (hsl.h + 0.45) % 1.0;
              // Si el nuevo hue está fuera del rango celeste/turquesa, mapear suavemente a celeste (0.54 = ~194 deg)
              if (newHue < 0.48 || newHue > 0.62) {
                newHue = 0.53 + (hsl.h * 0.08);
              }
              mat.color.setHSL(newHue, Math.min(hsl.s * 1.1, 0.85), hsl.l);
            }
          });
        }
      });

      // Disposición de 6 Células repartidas en profundidad (Z = +3.5 a Z = -12.0)
      const cellConfigs = [
        // 1. Célula Frente Derecha (Z = +3.5)
        {
          pos: new THREE.Vector3(4.8, 1.1, 3.5),
          scaleMultiplier: 1.22,
          speedX: 0.0009,
          speedY: 0.0013,
          speedZ: 0.0005,
          floatPhase: 0
        },
        // 2. Célula Superior Izquierda (Z = +0.5)
        {
          pos: new THREE.Vector3(-7.2, 4.8, 0.5),
          scaleMultiplier: 1.05,
          speedX: -0.0010,
          speedY: 0.0015,
          speedZ: 0.0006,
          floatPhase: 1.2
        },
        // 3. Célula Inferior Derecha (Z = -3.5)
        {
          pos: new THREE.Vector3(8.0, -4.8, -3.5),
          scaleMultiplier: 0.95,
          speedX: 0.0011,
          speedY: -0.0010,
          speedZ: -0.0005,
          floatPhase: 2.4
        },
        // 4. Célula Inferior Izquierda (Z = -6.0)
        {
          pos: new THREE.Vector3(-7.8, -5.0, -6.0),
          scaleMultiplier: 0.88,
          speedX: -0.0008,
          speedY: 0.0014,
          speedZ: 0.0007,
          floatPhase: 3.6
        },
        // 5. Célula Superior Centro/Derecha Fondo (Z = -9.5)
        {
          pos: new THREE.Vector3(1.8, 6.2, -9.5),
          scaleMultiplier: 0.78,
          speedX: 0.0006,
          speedY: 0.0016,
          speedZ: -0.0006,
          floatPhase: 4.8
        },
        // 6. Célula Centro Fondo Profundo (Z = -12.0)
        {
          pos: new THREE.Vector3(-3.0, -1.8, -12.0),
          scaleMultiplier: 0.70,
          speedX: -0.0009,
          speedY: 0.0011,
          speedZ: 0.0004,
          floatPhase: 5.5
        }
      ];

      // Instanciar las 6 células
      cellConfigs.forEach((cfg) => {
        const cellClone = baseModel.clone(true);

        const cellPivot = new THREE.Group();
        cellPivot.position.copy(cfg.pos);
        cellPivot.scale.setScalar(cfg.scaleMultiplier);
        cellPivot.add(cellClone);

        cellGroup.add(cellPivot);

        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(cellClone);
          gltf.animations.forEach((clip) => {
            const action = mixer.clipAction(clip);
            action.timeScale = 0.25;
            action.play();
          });
          mixers.push(mixer);
        }

        cellInstances.push({
          pivot: cellPivot,
          model: cellClone,
          basePos: cfg.pos.clone(),
          currentPos: cfg.pos.clone(),
          targetOffset: new THREE.Vector3(),
          baseScale: cfg.scaleMultiplier,
          currentScale: cfg.scaleMultiplier,
          speedX: cfg.speedX,
          speedY: cfg.speedY,
          speedZ: cfg.speedZ,
          floatPhase: cfg.floatPhase,
          mouseRotX: 0,
          mouseRotY: 0
        });
      });

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
      console.error("Error cargando cell.glb:", error);
      loadingOverlay.innerHTML = `<span style="color: #ef4444;">Error cargando modelo 3D</span>`;
    }
  );

  // --- Control de Interacción de Cursor Dinámico para Células ---
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

    if (window.innerWidth > 992) {
      cellGroup.position.set(1.0, 0, 0);
    } else {
      cellGroup.position.set(0, -0.5, 0);
    }
  });

  // --- Bucle de Animación con Reacción Interactiva de Células al Cursor ---
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    mixers.forEach((m) => m.update(delta));

    // Rotación suave del grupo principal
    cellGroup.rotation.y += 0.0006;
    cellGroup.rotation.x = Math.sin(elapsedTime * 0.15) * 0.04;

    // Animación individual e interactiva para cada célula
    cellInstances.forEach((c) => {
      // 1. Rotación continua de fondo
      c.model.rotation.x += c.speedX;
      c.model.rotation.y += c.speedY;
      c.model.rotation.z += c.speedZ;

      // 2. Flotación oscilante básica
      const floatY = Math.sin(elapsedTime * 0.25 + c.floatPhase) * 0.18;
      const floatX = Math.cos(elapsedTime * 0.20 + c.floatPhase) * 0.10;

      // 3. Reacción interactiva al cursor
      const worldCellPos = c.basePos.clone().add(cellGroup.position);
      const distToMouse = worldCellPos.distanceTo(mouseWorld);
      const interactRadius = 14.0;

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

        targetPushX = (dirX > 0 ? 1 : -1) * smoothFactor * 1.8;
        targetPushY = (dirY > 0 ? 1 : -1) * smoothFactor * 1.8;

        targetTiltY = (mouseNDC.x) * smoothFactor * 0.8;
        targetTiltX = (-mouseNDC.y) * smoothFactor * 0.8;

        targetScaleBoost = 1.0 + smoothFactor * 0.14;
      }

      // Suavizado Lerp
      c.targetOffset.x += (targetPushX - c.targetOffset.x) * 0.05;
      c.targetOffset.y += (targetPushY - c.targetOffset.y) * 0.05;
      c.mouseRotX += (targetTiltX - c.mouseRotX) * 0.05;
      c.mouseRotY += (targetTiltY - c.mouseRotY) * 0.05;
      c.currentScale += ((c.baseScale * targetScaleBoost) - c.currentScale) * 0.05;

      c.pivot.position.set(
        c.basePos.x + floatX + c.targetOffset.x,
        c.basePos.y + floatY + c.targetOffset.y,
        c.basePos.z
      );

      c.pivot.rotation.x = c.mouseRotX;
      c.pivot.rotation.y = c.mouseRotY;
      c.pivot.scale.setScalar(c.currentScale);
    });

    // Desplazamiento en Scroll
    const scrollFactor = Math.min(scrollY / 1000, 1);
    cellGroup.position.y = (window.innerWidth > 992 ? 0 : -0.5) - scrollFactor * 1.5;
    cellGroup.rotation.z = Math.sin(elapsedTime * 0.15) * 0.03 + scrollFactor * 0.08;

    // Renderizado con Post-processing
    composer.render();
  }

  animate();
}
