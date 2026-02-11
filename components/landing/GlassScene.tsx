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

const GlassScene: React.FC<GlassSceneProps> = ({ scrollProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<any>(null);
  const composerRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const textGroupRef = useRef<any>(null);
  const specLightRef = useRef<any>(null);
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

    /* ━━ RENDERER — transparent background ━━ */
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    /* ━━ SCENE & CAMERA ━━ */
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    // No fog, no background — transparent

    const camera = new THREE.PerspectiveCamera(
      mobile ? 50 : 38,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 2, 18);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    /* ━━ ENV MAP for glass reflections ━━ */
    const skyCanvas = buildSkyTexture();
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    skyTex.mapping = THREE.EquirectangularReflectionMapping;
    skyTex.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envMap = pmrem.fromEquirectangular(skyTex).texture;
    scene.environment = envMap;
    // scene.background NOT set — stays transparent
    pmrem.dispose();

    /* ━━ LIGHTING ━━ */
    scene.add(new THREE.AmbientLight(0xc8d8ff, 0.6));

    const key = new THREE.DirectionalLight(0xfff0e0, 1.4);
    key.position.set(5, 10, 5);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xc8d0ff, 0.5);
    fill.position.set(-5, 3, 5);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xd8c0ff, 0.9);
    rim.position.set(0, 4, -8);
    scene.add(rim);

    const spec = new THREE.PointLight(0xffffff, 18, 30);
    spec.position.set(3, 4, 8);
    scene.add(spec);
    specLightRef.current = spec;

    /* ━━ GLASS TEXT ━━ */
    const glass = new THREE.MeshPhysicalMaterial({
      transmission: 0.94,
      roughness: 0.03,
      metalness: 0.0,
      ior: 1.5,
      thickness: 0.45,
      envMapIntensity: 2.5,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),
      clearcoat: 0.9,
      clearcoatRoughness: 0.02,
      attenuationColor: new THREE.Color('#c8d8ff'),
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

    /* ━━ POST-PROCESSING ━━ */
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    renderPass.clear = true;
    renderPass.clearAlpha = 0;
    composer.addPass(renderPass);
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.12,
      0.3,
      0.9
    );
    composer.addPass(bloom);
    composerRef.current = composer;

    /* ━━ HELPER: target Y for header dock ━━ */
    const _v1 = new THREE.Vector3();
    const _v2 = new THREE.Vector3();
    const _v3 = new THREE.Vector3();

    function headerWorldY(cam: any): number {
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

      // Text rotation and docking
      if (textGroupRef.current) {
        const g = textGroupRef.current;
        g.rotation.y = eased * Math.PI * 4;
        g.rotation.x = Math.sin(animT * Math.PI) * 0.08;
        const sc = Math.max(0.18, 1 - eased * 0.82);
        g.scale.setScalar(lerp(g.scale.x, sc, LERP));
        camera.updateMatrixWorld();
        g.position.y = lerp(0, headerWorldY(camera), eased);
      }

      // Mouse-reactive specular light
      if (specLightRef.current) {
        specLightRef.current.position.x = lerp(
          specLightRef.current.position.x,
          3 + mouseRef.current.x * 4,
          0.03
        );
        specLightRef.current.position.y = lerp(
          specLightRef.current.position.y,
          4 + mouseRef.current.y * 2,
          0.03
        );
      }

      // Clear to transparent before each frame
      renderer.setClearColor(0x000000, 0);
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
      if (!rendererRef.current || !cameraRef.current || !composerRef.current)
        return;
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
   SKY TEXTURE — used ONLY for env-map reflections
   ═══════════════════════════════════════════════════════ */
function buildSkyTexture(): HTMLCanvasElement {
  const w = 2048,
    h = 1024;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0.0, '#0f1b3d');
  g.addColorStop(0.15, '#1a3068');
  g.addColorStop(0.3, '#254a96');
  g.addColorStop(0.45, '#3568b8');
  g.addColorStop(0.55, '#5090d0');
  g.addColorStop(0.65, '#78b8e2');
  g.addColorStop(0.75, '#92cce8');
  g.addColorStop(0.85, '#b0dcf0');
  g.addColorStop(1.0, '#daf2fa');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Subtle sun glow
  ctx.globalCompositeOperation = 'screen';
  const sun = ctx.createRadialGradient(
    w * 0.5,
    h * 0.45,
    0,
    w * 0.5,
    h * 0.45,
    w * 0.25
  );
  sun.addColorStop(0, 'rgba(255,245,230,0.1)');
  sun.addColorStop(0.4, 'rgba(255,230,210,0.05)');
  sun.addColorStop(1, 'rgba(255,220,200,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);

  return c;
}

export default GlassScene;
