'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface GlassSceneProps {
  scrollProgress: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/* ═══════════════════════════════════════════════════════
   CUSTOM SHADERS
   ═══════════════════════════════════════════════════════ */

/**
 * Chromatic Aberration + Vignette
 */
const ChromaVignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    uChroma: { value: 0.004 },
    uVignette: { value: 0.35 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uChroma;
    uniform float uVignette;
    varying vec2 vUv;

    void main() {
      vec2 center = vUv - 0.5;
      float dist = length(center);

      // Chromatic aberration
      vec2 offset = center * dist * uChroma;
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;

      // Vignette
      float vig = 1.0 - dist * dist * uVignette;
      vig = clamp(vig, 0.0, 1.0);
      vig = smoothstep(0.0, 1.0, vig);

      gl_FragColor = vec4(vec3(r, g, b) * vig, 1.0);
    }
  `,
};

/* ═══════════════════════════════════════════════════════ */

const GlassScene: React.FC<GlassSceneProps> = ({ scrollProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<any>(null);
  const composerRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const textGroupRef = useRef<any>(null);
  const specLightRef = useRef<any>(null);
  const frameRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  const smoothScrollRef = useRef(0);
  const lookAtYRef = useRef(0);

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
    const { ShaderPass } = await import(
      'three/examples/jsm/postprocessing/ShaderPass.js'
    );

    const canvas = canvasRef.current;
    const mobile = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio, mobile ? 1.5 : 2);

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       RENDERER
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
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
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       SCENE & CAMERA
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      mobile ? 48 : 36,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 0.3, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       HDR ENVIRONMENT MAP
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    const skyCanvas = buildHDRSkyTexture();
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    skyTex.mapping = THREE.EquirectangularReflectionMapping;
    skyTex.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envMap = pmrem.fromEquirectangular(skyTex).texture;

    scene.background = skyTex;
    scene.environment = envMap;
    pmrem.dispose();

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       LIGHTING
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    scene.add(new THREE.AmbientLight(0xd8d0e8, 0.25));

    const key = new THREE.DirectionalLight(0xfff4e0, 2.5);
    key.position.set(7, 12, 5);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xc0d0ff, 0.7);
    fill.position.set(-7, 3, 5);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xd0b8ff, 1.8);
    rim.position.set(0, 6, -10);
    scene.add(rim);

    const bounce = new THREE.DirectionalLight(0xffd8b0, 0.5);
    bounce.position.set(0, -6, 4);
    scene.add(bounce);

    const kicker = new THREE.DirectionalLight(0xffe0f0, 0.8);
    kicker.position.set(-8, 8, -3);
    scene.add(kicker);

    const spec = new THREE.PointLight(0xffffff, 50, 40);
    spec.position.set(3, 5, 8);
    scene.add(spec);
    specLightRef.current = spec;

    const sp1 = new THREE.PointLight(0xc8b8ff, 18, 22);
    sp1.position.set(-5, 4, 4);
    scene.add(sp1);

    const sp2 = new THREE.PointLight(0xffe0c8, 14, 20);
    sp2.position.set(5, -2, 6);
    scene.add(sp2);

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       GLASS MATERIAL
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    const glass = new THREE.MeshPhysicalMaterial({
      transmission: 0.95,
      roughness: 0.02,
      metalness: 0.0,
      ior: 1.52,
      thickness: 0.5,
      envMapIntensity: 3.0,
      specularIntensity: 1.5,
      specularColor: new THREE.Color(0xffffff),
      clearcoat: 1.0,
      clearcoatRoughness: 0.01,
      attenuationColor: new THREE.Color('#e8e0fa'),
      attenuationDistance: 10.0,
      color: new THREE.Color(0xffffff),
      side: THREE.FrontSide,
    });

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       3D TEXT
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    const fontLoader = new FontLoader();
    fontLoader.load(
      'https://cdn.jsdelivr.net/npm/three@0.164.0/examples/fonts/helvetiker_bold.typeface.json',
      (font: any) => {
        const sz = mobile ? 0.85 : 1.35;
        const depth = mobile ? 0.45 : 0.7;
        const curveSegs = mobile ? 12 : 24;
        const bevelSegs = mobile ? 4 : 10;

        const geo = new TextGeometry('LaTechNique', {
          font,
          size: sz,
          height: depth,
          curveSegments: curveSegs,
          bevelEnabled: true,
          bevelThickness: 0.14,
          bevelSize: 0.07,
          bevelOffset: 0,
          bevelSegments: bevelSegs,
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

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       POST-PROCESSING
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.3,
      0.5,
      0.75
    );
    composer.addPass(bloom);

    const chromaPass = new ShaderPass(ChromaVignetteShader);
    chromaPass.uniforms.uChroma.value = mobile ? 0.002 : 0.004;
    chromaPass.uniforms.uVignette.value = 0.3;
    composer.addPass(chromaPass);

    composerRef.current = composer;

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       HELPER FUNCTIONS
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    const _v1 = new THREE.Vector3();
    const _v2 = new THREE.Vector3();
    const _v3 = new THREE.Vector3();

    function getWorldYAtScreen(cam: any, ndcY: number): number {
      _v1.set(0, ndcY, -1).unproject(cam);
      _v2.set(0, ndcY, 1).unproject(cam);
      _v3.subVectors(_v2, _v1).normalize();
      const t = -_v1.z / _v3.z;
      return _v1.y + _v3.y * t;
    }

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ANIMATION LOOP
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    const LERP_SPEED = 0.05;
    const ANIM_END = 0.65;

    function animate() {
      frameRef.current = requestAnimationFrame(animate);

      smoothScrollRef.current = lerp(
        smoothScrollRef.current,
        scrollRef.current,
        LERP_SPEED
      );
      const s = smoothScrollRef.current;

      const animT = Math.min(1, s / ANIM_END);
      const eased = smoothstep(0, 1, animT);

      const targetCamZ = 20 - s * 5;
      const targetCamY = 0.3 + s * 3.5;
      const targetLookY = s * 3.5;

      camera.position.z = lerp(camera.position.z, targetCamZ, LERP_SPEED);
      camera.position.y = lerp(camera.position.y, targetCamY, LERP_SPEED);
      lookAtYRef.current = lerp(lookAtYRef.current, targetLookY, LERP_SPEED);
      camera.lookAt(0, lookAtYRef.current, 0);

      if (textGroupRef.current) {
        const group = textGroupRef.current;
        group.rotation.y = eased * Math.PI * 4;
        group.rotation.x = Math.sin(animT * Math.PI) * 0.1;
        group.scale.setScalar(Math.max(0.18, 1 - eased * 0.82));

        camera.updateMatrixWorld();
        const headerNdcY = 1 - 2 * (36 / window.innerHeight);
        const headerWorldY = getWorldYAtScreen(camera, headerNdcY);
        group.position.y = lerp(0, headerWorldY, eased);
      }

      if (specLightRef.current) {
        specLightRef.current.position.x = lerp(
          specLightRef.current.position.x,
          3 + mouseRef.current.x * 5,
          0.03
        );
        specLightRef.current.position.y = lerp(
          specLightRef.current.position.y,
          5 + mouseRef.current.y * 3,
          0.03
        );
      }

      composer.render();
    }

    animate();
  }, []);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

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

/* ═══════════════════════════════════════════════════════════
   HDR SKY TEXTURE
   ═══════════════════════════════════════════════════════════ */
function buildHDRSkyTexture(): HTMLCanvasElement {
  const w = 2048;
  const h = 1024;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0.0,  '#3D3280');
  sky.addColorStop(0.06, '#4E4298');
  sky.addColorStop(0.14, '#6858AE');
  sky.addColorStop(0.22, '#8874C0');
  sky.addColorStop(0.30, '#A694D0');
  sky.addColorStop(0.38, '#C0B0D8');
  sky.addColorStop(0.44, '#D4C4D4');
  sky.addColorStop(0.50, '#E2D2C6');
  sky.addColorStop(0.56, '#ECDCB8');
  sky.addColorStop(0.62, '#F2D0A0');
  sky.addColorStop(0.70, '#ECC088');
  sky.addColorStop(0.78, '#E0AC70');
  sky.addColorStop(0.86, '#D49858');
  sky.addColorStop(0.94, '#C48848');
  sky.addColorStop(1.0,  '#B07838');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const horizon = ctx.createLinearGradient(0, h * 0.40, 0, h * 0.64);
  horizon.addColorStop(0.0, 'rgba(255,210,160,0)');
  horizon.addColorStop(0.25, 'rgba(255,215,175,0.12)');
  horizon.addColorStop(0.50, 'rgba(255,200,150,0.18)');
  horizon.addColorStop(0.75, 'rgba(255,215,175,0.12)');
  horizon.addColorStop(1.0, 'rgba(255,210,160,0)');
  ctx.fillStyle = horizon;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'screen';
  const sun = ctx.createRadialGradient(
    w * 0.3, h * 0.50, 0,
    w * 0.3, h * 0.50, w * 0.22
  );
  sun.addColorStop(0.0, 'rgba(255,235,210,0.20)');
  sun.addColorStop(0.2, 'rgba(255,220,185,0.12)');
  sun.addColorStop(0.5, 'rgba(255,205,165,0.05)');
  sun.addColorStop(1.0, 'rgba(255,200,150,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);

  const fill = ctx.createRadialGradient(
    w * 0.75, h * 0.45, 0,
    w * 0.75, h * 0.45, w * 0.18
  );
  fill.addColorStop(0.0, 'rgba(200,190,240,0.10)');
  fill.addColorStop(0.5, 'rgba(190,180,230,0.04)');
  fill.addColorStop(1.0, 'rgba(180,170,220,0)');
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, w, h);

  const S = [
    0.12, 0.34, 0.56, 0.78, 0.91, 0.23, 0.45, 0.67, 0.89, 0.01,
    0.38, 0.72, 0.15, 0.58, 0.93, 0.27, 0.61, 0.84, 0.49, 0.06,
    0.33, 0.77, 0.19, 0.52, 0.88, 0.41, 0.66, 0.03, 0.75, 0.29,
    0.55, 0.82, 0.11, 0.47, 0.69, 0.95, 0.36, 0.63, 0.08, 0.71,
  ];

  for (let i = 0; i < 12; i++) {
    const cx = S[i % 40] * w;
    const cy = h * 0.08 + S[(i + 7) % 40] * h * 0.35;
    const rx = 250 + S[(i + 3) % 40] * 500;
    const ry = 50 + S[(i + 11) % 40] * 120;
    const a = 0.035 + S[(i + 5) % 40] * 0.07;
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    cg.addColorStop(0.0, `rgba(210,205,235,${a})`);
    cg.addColorStop(0.5, `rgba(205,200,230,${a * 0.35})`);
    cg.addColorStop(1.0, 'rgba(200,195,225,0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, S[(i + 2) % 40] * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 12; i < 28; i++) {
    const cx = S[i % 40] * w;
    const cy = h * 0.20 + S[(i + 3) % 40] * h * 0.35;
    const rx = 80 + S[(i + 7) % 40] * 250;
    const ry = 20 + S[(i + 11) % 40] * 65;
    const a = 0.03 + S[(i + 9) % 40] * 0.06;
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    cg.addColorStop(0.0, `rgba(225,218,238,${a})`);
    cg.addColorStop(0.5, `rgba(220,215,235,${a * 0.3})`);
    cg.addColorStop(1.0, 'rgba(215,210,230,0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 28; i < 40; i++) {
    const cx = S[i % 40] * w;
    const cy = h * 0.38 + S[(i + 5) % 40] * h * 0.18;
    const rx = 60 + S[(i + 7) % 40] * 180;
    const ry = 12 + S[(i + 11) % 40] * 35;
    const a = 0.025 + S[(i + 1) % 40] * 0.04;
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    cg.addColorStop(0.0, `rgba(240,230,225,${a})`);
    cg.addColorStop(0.6, `rgba(235,225,220,${a * 0.25})`);
    cg.addColorStop(1.0, 'rgba(230,220,215,0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'multiply';
  const zenith = ctx.createLinearGradient(0, 0, 0, h * 0.25);
  zenith.addColorStop(0.0, 'rgba(55,40,110,0.20)');
  zenith.addColorStop(1.0, 'rgba(80,65,130,0)');
  ctx.fillStyle = zenith;
  ctx.fillRect(0, 0, w, h * 0.25);

  ctx.globalCompositeOperation = 'screen';
  const ground = ctx.createLinearGradient(0, h * 0.80, 0, h);
  ground.addColorStop(0.0, 'rgba(200,155,90,0)');
  ground.addColorStop(0.5, 'rgba(195,150,85,0.06)');
  ground.addColorStop(1.0, 'rgba(185,140,75,0.10)');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, w, h);

  return c;
}

export default GlassScene;
