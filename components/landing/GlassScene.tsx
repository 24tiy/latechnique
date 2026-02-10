'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface GlassSceneProps {
  scrollProgress: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/* ═══════════════════════════════════════
   GRASS SHADERS
   ═══════════════════════════════════════ */
const GRASS_VS = /* glsl */ `
  attribute vec3 offset;
  attribute float angle;
  attribute float heightScale;
  attribute float phase;

  uniform float uTime;
  uniform float uWindStrength;

  varying float vHeight;
  varying float vPhase;
  varying float vFogDepth;

  void main() {
    vec3 pos = position;
    float h = pos.y;
    vHeight = h;
    vPhase = phase;

    pos.y *= heightScale;

    float wf = h * h;
    float w1 = sin(uTime * 1.5 + offset.x * 0.3 + offset.z * 0.4 + phase * 6.283);
    float w2 = sin(uTime * 2.6 + offset.x * 0.7 + offset.z * 0.5 + phase * 4.0) * 0.35;
    float w3 = cos(uTime * 0.9 + offset.x * 0.15 + offset.z * 0.25) * 0.25;

    pos.x += (w1 + w2 + w3) * uWindStrength * wf;
    pos.z += cos(uTime * 1.1 + offset.z * 0.4 + offset.x * 0.2) * uWindStrength * 0.35 * wf;

    float c = cos(angle);
    float s = sin(angle);
    vec3 r = vec3(pos.x * c - pos.z * s, pos.y, pos.x * s + pos.z * c);

    vec4 mvPos = modelViewMatrix * vec4(r + offset, 1.0);
    vFogDepth = -mvPos.z;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const GRASS_FS = /* glsl */ `
  uniform vec3 uFogColor;
  uniform float uFogDensity;

  varying float vHeight;
  varying float vPhase;
  varying float vFogDepth;

  void main() {
    vec3 dark  = vec3(0.04, 0.24, 0.02);
    vec3 mid   = vec3(0.07, 0.38, 0.05);
    vec3 light = vec3(0.16, 0.52, 0.10);

    vec3 col = mix(dark, mid, smoothstep(0.0, 0.4, vHeight));
    col = mix(col, light, smoothstep(0.3, 1.0, vHeight));
    col += (vPhase - 0.5) * 0.05;

    float ao = smoothstep(0.0, 0.12, vHeight);
    col *= mix(0.55, 1.0, ao);

    // Distance fog
    float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
    fogFactor = clamp(fogFactor, 0.0, 1.0);
    col = mix(col, uFogColor, fogFactor);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* ═══════════════════════════════════════ */

const GlassScene: React.FC<GlassSceneProps> = ({ scrollProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<any>(null);
  const composerRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const textGroupRef = useRef<any>(null);
  const specLightRef = useRef<any>(null);
  const grassMatRef = useRef<any>(null);
  const cloudsRef = useRef<any[]>([]);
  const frameRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  const smoothScrollRef = useRef(0);
  const clockRef = useRef(0);
  const lastTimeRef = useRef(0);

  const initScene = useCallback(async () => {
    if (!canvasRef.current) return;

    const THREE = await import('three');
    const { TextGeometry } = await import(
      'three/examples/jsm/geometries/TextGeometry.js'
    );
    const { FontLoader } = await import(
      'three/examples/jsm/loaders/FontLoader.js'
    );
    const { EffectComposer } = await import(
      'three/examples/jsm/postprocessing/EffectComposer.js'
    );
    const { RenderPass } = await import(
      'three/examples/jsm/postprocessing/RenderPass.js'
    );
    const { UnrealBloomPass } = await import(
      'three/examples/jsm/postprocessing/UnrealBloomPass.js'
    );

    const canvas = canvasRef.current;
    const mobile = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio, mobile ? 1.5 : 2);

    /* ━━ RENDERER ━━ */
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    rendererRef.current = renderer;

    /* ━━ SCENE & CAMERA ━━ */
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xd0b8c8, 0.014);

    const camera = new THREE.PerspectiveCamera(
      mobile ? 50 : 38,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 2, 18);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    /* ━━ SKY ENVIRONMENT ━━ */
    const skyCanvas = buildSkyTexture();
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    skyTex.mapping = THREE.EquirectangularReflectionMapping;
    skyTex.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envMap = pmrem.fromEquirectangular(skyTex).texture;
    scene.background = skyTex;
    scene.environment = envMap;
    pmrem.dispose();

    /* ━━ LIGHTING — controlled ━━ */
    scene.add(new THREE.AmbientLight(0xe0d8e8, 0.5));

    const key = new THREE.DirectionalLight(0xfff0e0, 1.2);
    key.position.set(5, 10, 5);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xc8d0ff, 0.4);
    fill.position.set(-5, 3, 5);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xd8c0ff, 0.8);
    rim.position.set(0, 4, -8);
    scene.add(rim);

    const spec = new THREE.PointLight(0xffffff, 15, 30);
    spec.position.set(3, 4, 8);
    scene.add(spec);
    specLightRef.current = spec;

    /* ━━ CLOUDS ━━ */
    const cloudTextures: THREE.CanvasTexture[] = [];
    for (let v = 0; v < 3; v++) {
      cloudTextures.push(new THREE.CanvasTexture(buildCloudCanvas(v)));
    }

    const cloudDefs = [
      { x: -14, y: 6.5, z: -8,  sx: 9,  sy: 3.5, sp: 0.15, op: 0.65 },
      { x: -6,  y: 8,   z: -12, sx: 12, sy: 5,   sp: 0.08, op: 0.50 },
      { x: 5,   y: 7,   z: -6,  sx: 8,  sy: 3,   sp: 0.12, op: 0.60 },
      { x: 15,  y: 9,   z: -14, sx: 14, sy: 5.5, sp: 0.06, op: 0.45 },
      { x: -10, y: 10,  z: -18, sx: 16, sy: 6,   sp: 0.04, op: 0.35 },
      { x: 8,   y: 5.5, z: -4,  sx: 7,  sy: 2.5, sp: 0.18, op: 0.55 },
      { x: -18, y: 7.5, z: -10, sx: 10, sy: 4,   sp: 0.10, op: 0.50 },
      { x: 20,  y: 8.5, z: -16, sx: 13, sy: 5,   sp: 0.05, op: 0.40 },
      { x: -3,  y: 11,  z: -20, sx: 18, sy: 7,   sp: 0.03, op: 0.30 },
      { x: 12,  y: 6,   z: -7,  sx: 8,  sy: 3,   sp: 0.14, op: 0.50 },
      { x: -20, y: 5,   z: -3,  sx: 6,  sy: 2,   sp: 0.20, op: 0.45 },
      { x: 0,   y: 9.5, z: -15, sx: 11, sy: 4.5, sp: 0.07, op: 0.40 },
    ];

    for (let i = 0; i < cloudDefs.length; i++) {
      const d = cloudDefs[i];
      const mat = new THREE.SpriteMaterial({
        map: cloudTextures[i % 3],
        transparent: true,
        opacity: d.op,
        depthWrite: false,
        fog: true,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.set(d.x, d.y, d.z);
      sprite.scale.set(d.sx, d.sy, 1);
      sprite.userData.speed = d.sp;
      sprite.userData.wrapRight = 30;
      sprite.userData.wrapLeft = -30;
      scene.add(sprite);
      cloudsRef.current.push(sprite);
    }

    /* ━━ GROUND ━━ */
    const groundGeo = new THREE.PlaneGeometry(60, 40);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(0x164a0e),
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -2.01, 2);
    scene.add(ground);

    /* ━━ GRASS ━━ */
    const GRASS_COUNT = mobile ? 3500 : 9000;
    const SEGS = 4;

    const gPositions: number[] = [];
    const gIndices: number[] = [];
    for (let i = 0; i <= SEGS; i++) {
      const t = i / SEGS;
      const w = 0.04 * (1 - t * 0.85);
      gPositions.push(-w, t, 0);
      gPositions.push(w, t, 0);
    }
    for (let i = 0; i < SEGS; i++) {
      const b = i * 2;
      gIndices.push(b, b + 1, b + 2);
      gIndices.push(b + 1, b + 3, b + 2);
    }

    const grassGeo = new THREE.InstancedBufferGeometry();
    grassGeo.setAttribute('position', new THREE.Float32BufferAttribute(gPositions, 3));
    grassGeo.setIndex(gIndices);
    grassGeo.instanceCount = GRASS_COUNT;

    const offsets = new Float32Array(GRASS_COUNT * 3);
    const angles = new Float32Array(GRASS_COUNT);
    const scales = new Float32Array(GRASS_COUNT);
    const phases = new Float32Array(GRASS_COUNT);

    for (let i = 0; i < GRASS_COUNT; i++) {
      offsets[i * 3] = (Math.random() - 0.5) * 40;
      offsets[i * 3 + 1] = -2;
      offsets[i * 3 + 2] = -6 + Math.random() * 20;
      angles[i] = Math.random() * Math.PI * 2;
      scales[i] = 0.4 + Math.random() * 1.2;
      phases[i] = Math.random();
    }

    grassGeo.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3));
    grassGeo.setAttribute('angle', new THREE.InstancedBufferAttribute(angles, 1));
    grassGeo.setAttribute('heightScale', new THREE.InstancedBufferAttribute(scales, 1));
    grassGeo.setAttribute('phase', new THREE.InstancedBufferAttribute(phases, 1));

    const fogColor = new THREE.Color(0xd0b8c8);
    const grassMat = new THREE.ShaderMaterial({
      vertexShader: GRASS_VS,
      fragmentShader: GRASS_FS,
      uniforms: {
        uTime: { value: 0 },
        uWindStrength: { value: 0.35 },
        uFogColor: { value: fogColor },
        uFogDensity: { value: 0.014 },
      },
      side: THREE.DoubleSide,
    });

    const grassMesh = new THREE.Mesh(grassGeo, grassMat);
    grassMesh.frustumCulled = false;
    scene.add(grassMesh);
    grassMatRef.current = grassMat;

    /* ━━ GLASS TEXT ━━ */
    const glass = new THREE.MeshPhysicalMaterial({
      transmission: 0.94,
      roughness: 0.03,
      metalness: 0.0,
      ior: 1.5,
      thickness: 0.45,
      envMapIntensity: 2.0,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),
      clearcoat: 0.9,
      clearcoatRoughness: 0.02,
      attenuationColor: new THREE.Color('#e8e2f4'),
      attenuationDistance: 12.0,
      color: new THREE.Color(0xffffff),
      side: THREE.FrontSide,
    });

    const fontLoader = new FontLoader();
    fontLoader.load(
      'https://cdn.jsdelivr.net/npm/three@0.164.0/examples/fonts/helvetiker_bold.typeface.json',
      (font: any) => {
        const sz = mobile ? 0.8 : 1.3;
        const depth = mobile ? 0.4 : 0.6;
        const geo = new TextGeometry('LaTechNique', {
          font,
          size: sz,
          height: depth,
          curveSegments: mobile ? 10 : 20,
          bevelEnabled: true,
          bevelThickness: 0.12,
          bevelSize: 0.06,
          bevelOffset: 0,
          bevelSegments: mobile ? 4 : 8,
        });
        geo.computeBoundingBox();
        const bb = geo.boundingBox!;
        const mesh = new THREE.Mesh(geo, glass);
        mesh.position.set(
          -(bb.max.x - bb.min.x) / 2,
          -(bb.max.y - bb.min.y) / 2,
          -(bb.max.z - bb.min.z) / 2
        );
        const group = new THREE.Group();
        group.add(mesh);
        scene.add(group);
        textGroupRef.current = group;
      }
    );

    /* ━━ POST-PROCESSING — very subtle bloom ━━ */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.08,
      0.3,
      0.92
    );
    composer.addPass(bloom);
    composerRef.current = composer;

    /* ━━ HELPER: header world Y ━━ */
    const _v1 = new THREE.Vector3();
    const _v2 = new THREE.Vector3();
    const _v3 = new THREE.Vector3();

    function headerWorldY(cam: THREE.PerspectiveCamera): number {
      const ndcY = 1 - 2 * (36 / window.innerHeight);
      _v1.set(0, ndcY, -1).unproject(cam);
      _v2.set(0, ndcY, 1).unproject(cam);
      _v3.subVectors(_v2, _v1).normalize();
      const t = -_v1.z / _v3.z;
      return _v1.y + _v3.y * t;
    }

    /* ━━ ANIMATION LOOP ━━ */
    const LERP = 0.05;
    const ANIM_END = 0.65;
    lastTimeRef.current = performance.now();

    function animate() {
      frameRef.current = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      clockRef.current += dt;
      const time = clockRef.current;

      smoothScrollRef.current = lerp(
        smoothScrollRef.current,
        scrollRef.current,
        LERP
      );
      const s = smoothScrollRef.current;
      const animT = Math.min(1, s / ANIM_END);
      const eased = smoothstep(0, 1, animT);

      // Camera fixed
      camera.position.set(0, 2, 18);
      camera.lookAt(0, 0, 0);

      // Text
      if (textGroupRef.current) {
        const g = textGroupRef.current;
        g.rotation.y = eased * Math.PI * 4;
        g.rotation.x = Math.sin(animT * Math.PI) * 0.08;
        const sc = Math.max(0.18, 1 - eased * 0.82);
        g.scale.setScalar(lerp(g.scale.x, sc, LERP));
        camera.updateMatrixWorld();
        g.position.y = lerp(0, headerWorldY(camera), eased);
      }

      // Mouse spec
      if (specLightRef.current) {
        specLightRef.current.position.x = lerp(
          specLightRef.current.position.x, 3 + mouseRef.current.x * 4, 0.03
        );
        specLightRef.current.position.y = lerp(
          specLightRef.current.position.y, 4 + mouseRef.current.y * 2, 0.03
        );
      }

      // Grass wind
      if (grassMatRef.current) {
        grassMatRef.current.uniforms.uTime.value = time;
      }

      // Cloud drift
      for (const cl of cloudsRef.current) {
        cl.position.x += cl.userData.speed * dt;
        if (cl.position.x > cl.userData.wrapRight) {
          cl.position.x = cl.userData.wrapLeft;
        }
      }

      composer.render();
    }

    animate();
  }, []);

  useEffect(() => { scrollRef.current = scrollProgress; }, [scrollProgress]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', fn);
    return () => window.removeEventListener('mousemove', fn);
  }, []);

  useEffect(() => {
    const fn = () => {
      if (!rendererRef.current || !cameraRef.current || !composerRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
      composerRef.current.setSize(w, h);
    };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    initScene();
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      rendererRef.current?.dispose();
    };
  }, [initScene]);

  return <canvas ref={canvasRef} className="glass-canvas" />;
};

/* ═══════════════════════════════════════════════════════
   SKY TEXTURE
   Purple zenith → pink/peach horizon → green ground
   No painted clouds — 3D sprites handle those
   ═══════════════════════════════════════════════════════ */
function buildSkyTexture(): HTMLCanvasElement {
  const w = 2048, h = 1024;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0.00, '#4A3D8F');
  g.addColorStop(0.10, '#6355A4');
  g.addColorStop(0.20, '#8272B8');
  g.addColorStop(0.30, '#A898CC');
  g.addColorStop(0.38, '#C0B0D4');
  g.addColorStop(0.44, '#D4C4D4');
  g.addColorStop(0.50, '#E2D2C8');
  g.addColorStop(0.56, '#ECDCBC');
  g.addColorStop(0.62, '#F0CCA0');
  g.addColorStop(0.70, '#E8BC88');
  g.addColorStop(0.80, '#9AAA60');
  g.addColorStop(0.88, '#4A7830');
  g.addColorStop(0.94, '#2A5818');
  g.addColorStop(1.00, '#1A4A10');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'screen';
  const sun = ctx.createRadialGradient(
    w * 0.35, h * 0.48, 0,
    w * 0.35, h * 0.48, w * 0.2
  );
  sun.addColorStop(0, 'rgba(255,230,200,0.12)');
  sun.addColorStop(0.4, 'rgba(255,215,180,0.06)');
  sun.addColorStop(1, 'rgba(255,200,150,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);

  return c;
}

/* ═══════════════════════════════════════════════════════
   CLOUD CANVAS — soft fluffy shapes
   ═══════════════════════════════════════════════════════ */
function buildCloudCanvas(variant: number): HTMLCanvasElement {
  const w = 512, h = 256;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;

  const layouts = [
    [
      { x: 0.25, y: 0.50, r: 0.22 },
      { x: 0.40, y: 0.42, r: 0.28 },
      { x: 0.55, y: 0.48, r: 0.26 },
      { x: 0.70, y: 0.52, r: 0.20 },
      { x: 0.45, y: 0.56, r: 0.24 },
      { x: 0.60, y: 0.40, r: 0.18 },
    ],
    [
      { x: 0.20, y: 0.48, r: 0.20 },
      { x: 0.35, y: 0.44, r: 0.25 },
      { x: 0.50, y: 0.50, r: 0.30 },
      { x: 0.65, y: 0.46, r: 0.22 },
      { x: 0.78, y: 0.52, r: 0.18 },
      { x: 0.42, y: 0.55, r: 0.20 },
      { x: 0.58, y: 0.42, r: 0.16 },
    ],
    [
      { x: 0.30, y: 0.50, r: 0.26 },
      { x: 0.48, y: 0.44, r: 0.30 },
      { x: 0.65, y: 0.50, r: 0.24 },
      { x: 0.38, y: 0.56, r: 0.22 },
      { x: 0.55, y: 0.38, r: 0.18 },
      { x: 0.75, y: 0.46, r: 0.16 },
      { x: 0.22, y: 0.44, r: 0.14 },
      { x: 0.80, y: 0.54, r: 0.12 },
    ],
  ];

  const blobs = layouts[variant % 3];
  const dim = Math.min(w, h);

  for (const b of blobs) {
    const cx = b.x * w, cy = b.y * h, r = b.r * dim;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0.0, 'rgba(255,255,255,0.85)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0.20)');
    grad.addColorStop(0.80, 'rgba(255,255,255,0.05)');
    grad.addColorStop(1.0, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  return c;
}

export default GlassScene;
