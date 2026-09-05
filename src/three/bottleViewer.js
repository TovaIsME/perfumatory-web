// src/three/bottleViewer.js
// Perfumatory Oman — Ultra-Luxury 3D Perfume Bottle (OBVIOUS 'UN ÉTÉ' Model)
// Features: Rounded rectangular glass flacon, thick glass base, natural cork stopper,
// silver atomizer collar with transparent dip tube, screen-printed glass typography,
// soft glowing rounded circular particles, and physical glass refraction.

import * as THREE from 'three';

// Helper: Procedural Natural Cork Texture
function createCorkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base warm cork beige
  ctx.fillStyle = '#C5A37E';
  ctx.fillRect(0, 0, 512, 512);

  // Organic cork pores & flecks
  for (let i = 0; i < 4500; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const rx = 0.8 + Math.random() * 4.5;
    const ry = 0.6 + Math.random() * 2.8;
    const rot = Math.random() * Math.PI;
    const tone = Math.random();

    if (tone < 0.5) {
      ctx.fillStyle = `rgba(125, 83, 51, ${0.15 + Math.random() * 0.55})`;
    } else if (tone < 0.8) {
      ctx.fillStyle = `rgba(74, 46, 26, ${0.12 + Math.random() * 0.45})`;
    } else {
      ctx.fillStyle = `rgba(235, 218, 195, ${0.1 + Math.random() * 0.4})`;
    }

    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    ctx.fill();
  }

  // Horizontal wood/cork strata
  for (let y = 0; y < 512; y += 3) {
    if (Math.random() > 0.45) {
      ctx.fillStyle = `rgba(100, 65, 38, ${0.08 + Math.random() * 0.25})`;
      ctx.fillRect(0, y, 512, 1 + Math.random() * 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Helper: Screen-Printed OBVIOUS 'UN ÉTÉ' Glass Label
function createObviousLabelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 1024, 1024);

  // Black screen-print color directly on the glass
  ctx.fillStyle = '#14110E';

  // Left vertical: 'OBVI'
  ctx.save();
  ctx.translate(260, 520);
  ctx.rotate(-Math.PI / 2);
  ctx.font = "900 135px 'Cinzel', 'Montserrat', sans-serif";
  ctx.letterSpacing = '10px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OBVI', 0, 0);
  ctx.restore();

  // Center horizontal: 'UN ÉTÉ'
  ctx.save();
  ctx.font = "500 48px 'Cinzel', 'Playfair Display', serif";
  ctx.letterSpacing = '14px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('UN ÉTÉ', 512, 520);
  ctx.restore();

  // Right vertical: 'OUS'
  ctx.save();
  ctx.translate(764, 520);
  ctx.rotate(Math.PI / 2);
  ctx.font = "900 135px 'Cinzel', 'Montserrat', sans-serif";
  ctx.letterSpacing = '10px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OUS', 0, 0);
  ctx.restore();

  // Bottom centered: 'EAU DE PARFUM / 100 ML'
  ctx.save();
  ctx.font = "600 24px 'Montserrat', 'Inter', sans-serif";
  ctx.letterSpacing = '7px';
  ctx.textAlign = 'center';
  ctx.fillText('EAU DE PARFUM', 512, 790);

  ctx.font = "500 22px 'Montserrat', 'Inter', sans-serif";
  ctx.letterSpacing = '5px';
  ctx.fillText('100 ML', 512, 830);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Helper: Circular Soft Glowing Particle Alpha Map
function createCircularParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255, 255, 255, 1)');
  g.addColorStop(0.25, 'rgba(242, 220, 185, 0.85)');
  g.addColorStop(0.6, 'rgba(212, 175, 143, 0.25)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Helper: Floor Contact Shadow Texture
function createContactShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 120);
  g.addColorStop(0, 'rgba(15, 10, 8, 0.7)');
  g.addColorStop(0.4, 'rgba(25, 18, 14, 0.35)');
  g.addColorStop(0.8, 'rgba(43, 37, 32, 0.1)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export class BottleViewer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = {
      autoRotate: true,
      rotationSpeed: 0.0035,
      interactive: false,
      enableZoom: false,
      ...options,
    };
    this.isDragging = false;
    this.prevMouseX = 0;
    this.prevMouseY = 0;
    this.rotationY = 0;
    this.targetRotationY = 0;
    this.rotationX = 0;
    this.targetRotationX = 0;
    this.animationId = null;
    this._init();
  }

  _init() {
    const w = this.canvas.clientWidth || 360;
    const h = this.canvas.clientHeight || 420;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    this.camera.position.set(0, 0.1, 4.3);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this._buildBottle();
    this._buildLights();
    this._buildParticles();

    if (this.options.interactive) {
      this._attachInteraction();
    }

    this._handleResize();
    this._startLoop();
  }

  _buildBottle() {
    this.bottleGroup = new THREE.Group();

    // 1. Outer Glass Body (Filleted Rounded Rectangle Flacon)
    const bw = 1.15;
    const bh = 1.52;
    const br = 0.28;
    const shape = new THREE.Shape();
    shape.moveTo(-bw / 2 + br, -bh / 2);
    shape.lineTo(bw / 2 - br, -bh / 2);
    shape.absarc(bw / 2 - br, -bh / 2 + br, br, -Math.PI / 2, 0);
    shape.lineTo(bw / 2, bh / 2 - br);
    shape.absarc(bw / 2 - br, bh / 2 - br, br, 0, Math.PI / 2);
    shape.lineTo(-bw / 2 + br, bh / 2);
    shape.absarc(-bw / 2 + br, bh / 2 - br, br, Math.PI / 2, Math.PI);
    shape.lineTo(-bw / 2, -bh / 2 + br);
    shape.absarc(-bw / 2 + br, -bh / 2 + br, br, Math.PI, Math.PI * 1.5);

    const extrudeSettings = {
      depth: 0.62,
      bevelEnabled: true,
      bevelSegments: 7,
      steps: 1,
      bevelSize: 0.07,
      bevelThickness: 0.07,
    };

    const glassGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    glassGeo.center();

    // Physical Glass Material with pristine luxury dispersion & reflection
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#FFFFFF'),
      metalness: 0.0,
      roughness: 0.03,
      transmission: 0.96,
      thickness: 1.1,
      ior: 1.517,
      reflectivity: 0.95,
      transparent: true,
      opacity: 0.94,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      attenuationColor: new THREE.Color('#F5F0E8'),
      attenuationDistance: 2.2,
      envMapIntensity: 2.2,
    });

    const glassBody = new THREE.Mesh(glassGeo, glassMat);
    glassBody.position.y = -0.05;
    this.bottleGroup.add(glassBody);

    // 2. Liquid Volume Inside (Raised ~0.35 to show authentic thick glass bottom!)
    const lw = 0.96;
    const lh = 1.08;
    const lr = 0.22;
    const lShape = new THREE.Shape();
    lShape.moveTo(-lw / 2 + lr, -lh / 2);
    lShape.lineTo(lw / 2 - lr, -lh / 2);
    lShape.absarc(lw / 2 - lr, -lh / 2 + lr, lr, -Math.PI / 2, 0);
    lShape.lineTo(lw / 2, lh / 2 - lr);
    lShape.absarc(lw / 2 - lr, lh / 2 - lr, lr, 0, Math.PI / 2);
    lShape.lineTo(-lw / 2 + lr, lh / 2);
    lShape.absarc(-lw / 2 + lr, lh / 2 - lr, lr, Math.PI / 2, Math.PI);
    lShape.lineTo(-lw / 2, -lh / 2 + lr);
    lShape.absarc(-lw / 2 + lr, -lh / 2 + lr, lr, Math.PI, Math.PI * 1.5);

    const liquidExtrude = {
      depth: 0.50,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    };

    const liquidGeo = new THREE.ExtrudeGeometry(lShape, liquidExtrude);
    liquidGeo.center();

    // Pale golden, crystal clear perfume liquid as in the photo
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#F7EFE1'),
      metalness: 0.02,
      roughness: 0.06,
      transmission: 0.88,
      thickness: 0.5,
      ior: 1.34,
      transparent: true,
      opacity: 0.78,
      clearcoat: 0.6,
    });

    const liquid = new THREE.Mesh(liquidGeo, liquidMat);
    // Elevated by 0.12 relative to body center so thick bottom glass is apparent!
    liquid.position.set(0, 0.02, 0);
    this.bottleGroup.add(liquid);

    // 3. Screen-Printed Front Glass Label
    const labelGeo = new THREE.PlaneGeometry(1.05, 1.4);
    const labelTex = createObviousLabelTexture();
    const labelMat = new THREE.MeshBasicMaterial({
      map: labelTex,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    const labelMesh = new THREE.Mesh(labelGeo, labelMat);
    labelMesh.position.set(0, -0.05, 0.385);
    this.bottleGroup.add(labelMesh);

    // 4. Glass Collar Neck
    const neckGeo = new THREE.CylinderGeometry(0.24, 0.27, 0.22, 32);
    const neckMesh = new THREE.Mesh(neckGeo, glassMat);
    neckMesh.position.y = 0.82;
    this.bottleGroup.add(neckMesh);

    // 5. Silver/Chrome Spray Atomizer Collar & Pump
    const pumpGeo = new THREE.CylinderGeometry(0.19, 0.20, 0.28, 32);
    const chromeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#E8ECEE'),
      metalness: 0.96,
      roughness: 0.12,
      envMapIntensity: 2.0,
    });
    const pump = new THREE.Mesh(pumpGeo, chromeMat);
    pump.position.y = 0.98;
    this.bottleGroup.add(pump);

    // 6. Clear Dip Tube descending into the perfume liquid
    const tubeGeo = new THREE.CylinderGeometry(0.013, 0.013, 1.55, 16);
    const tubeMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#FFFFFF'),
      metalness: 0.0,
      roughness: 0.1,
      transmission: 0.92,
      thickness: 0.08,
      transparent: true,
      opacity: 0.75,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.position.set(0.02, 0.16, 0);
    tube.rotation.z = -0.025; // Authentic slight natural lean
    this.bottleGroup.add(tube);

    // 7. Cylindrical Natural Cork Stopper Cap! (Matching the photo)
    const corkGeo = new THREE.CylinderGeometry(0.31, 0.31, 0.64, 48, 1, false);
    const corkTex = createCorkTexture();
    const corkMat = new THREE.MeshStandardMaterial({
      map: corkTex,
      bumpMap: corkTex,
      bumpScale: 0.045,
      roughness: 0.88,
      metalness: 0.0,
      color: new THREE.Color('#DFBE9B'),
    });
    const cork = new THREE.Mesh(corkGeo, corkMat);
    cork.position.y = 1.34;
    this.bottleGroup.add(cork);

    // Beveled rim at top of cork for realistic finish
    const rimGeo = new THREE.TorusGeometry(0.29, 0.02, 16, 48);
    const rim = new THREE.Mesh(rimGeo, corkMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 1.66;
    this.bottleGroup.add(rim);

    // 8. Soft Floor Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: createContactShadowTexture(),
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.89;
    this.scene.add(shadow);

    this.bottleGroup.position.y = -0.10;
    this.scene.add(this.bottleGroup);
  }

  _buildLights() {
    // Key Light: Warm natural sun through studio window
    const key = new THREE.DirectionalLight(new THREE.Color('#FFF3DC'), 3.2);
    key.position.set(3, 4.5, 3.5);
    this.scene.add(key);

    // Fill Light: Soft neutral studio fill
    const fill = new THREE.DirectionalLight(new THREE.Color('#D6E6F5'), 1.1);
    fill.position.set(-3.5, 2, -1.5);
    this.scene.add(fill);

    // Rim Light: Gold rim illuminating cork texture and glass edges from behind
    const rim = new THREE.DirectionalLight(new THREE.Color('#E6CAAE'), 2.4);
    rim.position.set(0, 1.5, -4);
    this.scene.add(rim);

    // Secondary Warm Uplight: Illuminating perfume liquid
    const uplight = new THREE.PointLight(new THREE.Color('#D4AF8F'), 1.8, 6);
    uplight.position.set(0, -1.8, 1.5);
    this.scene.add(uplight);

    // Ambient
    const ambient = new THREE.AmbientLight(new THREE.Color('#2B241E'), 0.9);
    this.scene.add(ambient);
  }

  _buildParticles() {
    // Soft, glowing, ROUNDED golden particles (Radial gradient alpha, NO square pixels!)
    const count = 55;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 5.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3.5;
      scales[i] = Math.random() * 0.8 + 0.6;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleTexture = createCircularParticleTexture();
    const mat = new THREE.PointsMaterial({
      color: new THREE.Color('#E8C8A6'),
      size: 0.12,
      map: particleTexture,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  _attachInteraction() {
    const el = this.canvas.parentElement || this.canvas;

    el.addEventListener('mousedown', e => {
      this.isDragging = true;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
    });

    window.addEventListener('mousemove', e => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMouseX;
      const dy = e.clientY - this.prevMouseY;

      this.targetRotationY += dx * 0.009;
      this.targetRotationX = Math.max(-0.25, Math.min(0.25, this.targetRotationX + dy * 0.005));

      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Touch
    el.addEventListener('touchstart', e => {
      this.isDragging = true;
      this.prevMouseX = e.touches[0].clientX;
      this.prevMouseY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', e => {
      if (!this.isDragging) return;
      const dx = e.touches[0].clientX - this.prevMouseX;
      const dy = e.touches[0].clientY - this.prevMouseY;

      this.targetRotationY += dx * 0.011;
      this.targetRotationX = Math.max(-0.25, Math.min(0.25, this.targetRotationX + dy * 0.006));

      this.prevMouseX = e.touches[0].clientX;
      this.prevMouseY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // Hover tilt
    el.addEventListener('mousemove', e => {
      if (this.isDragging) return;
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      this.targetRotationX = -ny * 0.08;
    });
  }

  _handleResize() {
    const ro = new ResizeObserver(() => {
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      if (!w || !h) return;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
    ro.observe(this.canvas.parentElement || this.canvas);
    this._ro = ro;
  }

  _startLoop() {
    const clock = new THREE.Clock();
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Gentle luxury auto-rotation when not dragging
      if (this.options.autoRotate && !this.isDragging) {
        this.targetRotationY += this.options.rotationSpeed;
      }

      // Smooth inertia following
      this.bottleGroup.rotation.y += (this.targetRotationY - this.bottleGroup.rotation.y) * 0.06;
      this.bottleGroup.rotation.x += (this.targetRotationX - this.bottleGroup.rotation.x) * 0.06;

      // Restrained luxury floating motion
      this.bottleGroup.position.y = -0.10 + Math.sin(t * 0.75) * 0.025;

      // Soft particles drifting
      if (this.particles) {
        this.particles.rotation.y = t * 0.025;
        this.particles.rotation.x = t * 0.012;
      }

      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  scrollRespond(progress) {
    if (this.bottleGroup) {
      this.bottleGroup.rotation.x = progress * 0.22;
      this.camera.position.z = 4.3 - progress * 0.45;
    }
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.renderer.dispose();
    if (this._ro) {
      this._ro.disconnect();
    }
  }
}
