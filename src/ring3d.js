/**
 * ring3d.js — Three.js ring scene
 * Loads ring.glb, applies platinum + diamond materials,
 * renders to a transparent overlay canvas, supports drag-rotate.
 */
import * as THREE from 'three';
import { GLTFLoader }  from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CONFIG } from './config.js';

const {
  RING_METALNESS, RING_ROUGHNESS,
  DIAMOND_IOR, DIAMOND_THICKNESS,
} = CONFIG;

export class Ring3D {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas  = canvas;
    this.ready   = false;
    this._group  = null;
    this._animId = null;
    this._sparkCb = null; // callback(x, y) for sparkle bursts

    this._initRenderer();
    this._initScene();
    this._initLights();
    this._initEnvironment();
    this._initDragRotate();
    this._resize();

    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(canvas.parentElement ?? document.body);
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  _initScene() {
    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
    this.camera.position.set(0, 0, 4);
  }

  _initLights() {
    const ambientLight = new THREE.AmbientLight(0xfff0f5, 0.8);
    this.scene.add(ambientLight);

    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(3, 5, 3);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xffe0ea, 0.6);
    fill.position.set(-3, 2, 2);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xc8cdd6, 0.4);
    rim.position.set(0, -3, -3);
    this.scene.add(rim);
  }

  _initEnvironment() {
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const envTexture = pmremGenerator.fromScene(
      new RoomEnvironment(), 0.04
    ).texture;
    this.scene.environment = envTexture;
    pmremGenerator.dispose();
  }

  _initDragRotate() {
    let dragging = false;
    let prevX = 0, prevY = 0;

    const onDown = (e) => {
      dragging = true;
      const pt = e.touches ? e.touches[0] : e;
      prevX = pt.clientX;
      prevY = pt.clientY;
    };
    const onMove = (e) => {
      if (!dragging || !this._group) return;
      const pt = e.touches ? e.touches[0] : e;
      const dx = (pt.clientX - prevX) * 0.008;
      const dy = (pt.clientY - prevY) * 0.008;
      this._group.rotation.y += dx;
      this._group.rotation.x += dy;
      prevX = pt.clientX;
      prevY = pt.clientY;
    };
    const onUp = () => { dragging = false; };

    this.canvas.addEventListener('mousedown',  onDown,  { passive: true });
    window.addEventListener('mousemove',       onMove,  { passive: true });
    window.addEventListener('mouseup',         onUp,    { passive: true });
    this.canvas.addEventListener('touchstart', onDown,  { passive: true });
    window.addEventListener('touchmove',       onMove,  { passive: true });
    window.addEventListener('touchend',        onUp,    { passive: true });
  }

  _resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(dpr);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** Make a material look like polished platinum */
  _makePlatinumMaterial() {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.9, 0.9, 0.95),
      metalness: RING_METALNESS,
      roughness: RING_ROUGHNESS,
      envMapIntensity: 2.0,
    });
  }

  /** Make a physically-based diamond / gemstone material */
  _makeDiamondMaterial() {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(1, 0.95, 0.98),
      transmission: 1,
      ior: DIAMOND_IOR,
      thickness: DIAMOND_THICKNESS,
      roughness: 0.0,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.0,
      envMapIntensity: 5.0,
      transparent: true,
    });
  }

  /**
   * Heuristic to decide if a mesh is the diamond / gemstone.
   * Checks mesh name, material name, then vertex centroid height.
   */
  _isDiamond(mesh) {
    const name = (mesh.name + (mesh.material?.name ?? '')).toLowerCase();
    if (/diamond|gem|stone|crystal/.test(name)) return true;

    // Positional heuristic: diamond is usually at the top of the ring
    const box = new THREE.Box3().setFromObject(mesh);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Small, positioned higher than the band
    if (size.y < 0.3 && center.y > 0.1) return true;
    return false;
  }

  /**
   * Load the GLB model and apply materials.
   * @returns {Promise<void>}
   */
  async load() {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      const modelUrl = '/assets/ring.glb';
      const fallbackUrl = '/frames/heart+ring+3d+model.glb';

      const tryLoad = (url, isFallback = false) => {
        loader.load(
          url,
          (gltf) => {
          const model = gltf.scene;

          const platinumMat = this._makePlatinumMaterial();
          const diamondMat  = this._makeDiamondMaterial();

          model.traverse((child) => {
            if (!child.isMesh) return;
            if (this._isDiamond(child)) {
              child.material = diamondMat;
            } else {
              child.material = platinumMat;
            }
            child.castShadow    = false;
            child.receiveShadow = false;
          });

          // Centre and normalise scale
          const box = new THREE.Box3().setFromObject(model);
          const centre = new THREE.Vector3();
          box.getCenter(centre);
          model.position.sub(centre);

          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale  = 1.4 / maxDim;
          model.scale.setScalar(scale);

          // Wrap in a group so we can rotate independently of position
          this._group = new THREE.Group();
          this._group.add(model);
          this._group.visible = false; // hidden until shown
          this.scene.add(this._group);

          this.ready = true;
          resolve();
        },
        undefined,
        (err) => {
          if (!isFallback) {
            tryLoad(fallbackUrl, true);
          } else {
            console.warn('[Ring3D] Could not load ring.glb — using placeholder geometry.', err);
            this._buildPlaceholderRing();
            resolve();
          }
        }
      );
    };

    tryLoad(modelUrl, false);
  });
}

  /** Simple torus as placeholder when ring.glb is missing */
  _buildPlaceholderRing() {
    const torusGeo  = new THREE.TorusGeometry(0.55, 0.12, 32, 120);
    const torusMat  = this._makePlatinumMaterial();
    const torus     = new THREE.Mesh(torusGeo, torusMat);

    const sphGeo    = new THREE.SphereGeometry(0.12, 32, 32);
    const sphMat    = this._makeDiamondMaterial();
    const sphere    = new THREE.Mesh(sphGeo, sphMat);
    sphere.position.set(0, 0.67, 0);

    this._group = new THREE.Group();
    this._group.add(torus, sphere);
    this._group.visible = false;
    this.scene.add(this._group);
    this.ready = true;
  }

  /** Start the render loop */
  startLoop(onSparkle) {
    this._sparkCb = onSparkle ?? null;
    this._sparkTimer = 0;
    this._autoRotateSpeed = 0.004;

    const tick = (t) => {
      this._animId = requestAnimationFrame(tick);

      if (this._group) {
        this._group.rotation.y += this._autoRotateSpeed;
        // Gentle float
        this._group.position.y = Math.sin(t * 0.001) * 0.04;
      }

      this.renderer.render(this.scene, this.camera);

      // Emit sparkle position every ~0.5s
      if (this._sparkCb && this._group) {
        this._sparkTimer += 16;
        if (this._sparkTimer > 500) {
          this._sparkTimer = 0;
          const pos = this._getScreenPos();
          this._sparkCb(pos.x, pos.y);
        }
      }
    };
    requestAnimationFrame(tick);
  }

  /** Project ring centre to screen coords */
  _getScreenPos() {
    if (!this._group) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = new THREE.Vector3();
    this._group.getWorldPosition(pos);
    pos.project(this.camera);
    return {
      x: (pos.x + 1) / 2 * window.innerWidth,
      y: (-pos.y + 1) / 2 * window.innerHeight,
    };
  }

  showGroup() {
    if (this._group) this._group.visible = true;
  }

  hideGroup() {
    if (this._group) this._group.visible = false;
  }

  /** GSAP-compatible: set opacity via a dummy object (renderer doesn't support alpha directly) */
  setOpacity(v) {
    // opacity is controlled via CSS on the canvas element
    this.canvas.style.opacity = v;
  }

  destroy() {
    if (this._animId) cancelAnimationFrame(this._animId);
    this.renderer.dispose();
    this._ro.disconnect();
  }
}
