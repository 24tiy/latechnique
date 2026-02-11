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
  const cameraRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const textGroupRef = useRef<any>(null);
  const specLightRef = useRef<any>(null);
  const rimLightRef = useRef<any>(null);
  const frameRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  const smoothScrollRef = useRef(0);
  const clockRef = useRef(0);
  const lastTimeRef = useRef(0);

  const initScene = useCallback(async () => {
    if (!canvasRef.current) return;

    const THREE = await import('three');
    const { FontLoader } = await import(
      'three/examples/jsm/loaders/FontLoader.js'
    );
    const { TextGeometry } = await import(
      'three/examples/jsm/geometries/TextGeometry.js'
    );

    const canvas = canvasRef.current;
    const mobile = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio, mobile ? 1.5 : 2);

    /* ---------- Renderer ---------- */
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    /* ---------- Scene / Camera ---------- */
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      mobile ? 52 : 40,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 1.5, 16);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    /* ---------- Environment for glass ---------- */
    const skyCanvas = buildBrightSky();
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    skyTex.mapping = THREE.EquirectangularReflectionMapping;
    skyTex.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envMap = pmrem.fromEquirectangular(skyTex).texture;
    scene.environment = envMap;
    pmrem.dispose();

    /* ---------- Lighting ---------- */
    scene.add(new THREE.AmbientLight(0xf0f8ff, 1.4));

    const key = new THREE.DirectionalLight(0xffffff, 3.0);
    key.position.set(8, 14, 8);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xe8f4ff, 1.2);
    fill.position.set(-7, 5, 7);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xfff8f0, 2.2);
    rim.position.set(0, 6, -12);
    scene.add(rim);
    rimLightRef.current = rim;

    const spec = new THREE.PointLight(0xffffff, 50, 50);
    spec.position.set(5, 6, 12);
    scene.add(spec);
    specLightRef.current = spec;

    // Extra rim from below for visible edges
    const bottomRim = new THREE.DirectionalLight(0xaaccff, 1.5);
    bottomRim.position.set(0, -6, 8);
    scene.add(bottomRim);

    /* ---------- Glass material — bright, visible ---------- */
    const glass = new THREE.MeshPhysicalMaterial({
      transmission: 0.92,
      roughness: 0.005,
      metalness: 0.0,
      ior: 1.52,
      thickness: 0.8,
      envMapIntensity: 6.0,
      specularIntensity: 2.5,
      specularColor: new THREE.Color(0xffffff),
      clearcoat: 1.0,
      clearcoatRoughness: 0.005,
      attenuationColor: new THREE.Color('#e8f4ff'),
      attenuationDistance: 5.0,
      color: new THREE.Color(0xffffff),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.15,
    });

    /* ---------- Load CURSIVE font ---------- */
    const fontLoader = new FontLoader();

    // Use a script/cursive-style font
    // "Pacifico"-like feel from Google Fonts — we use the Three.js typeface format
    // Fallback: use helvetiker but with italic-like rotation trick
    // Best approach: load a proper cursive typeface JSON
    const fontUrls = [
      // Try the droid serif italic first (closest to cursive in Three.js defaults)
      'https://cdn.jsdelivr.net/npm/three@0.164.0/examples/fonts/droid/droid_serif_bold.typeface.json',
    ];

    fontLoader.load(fontUrls[0], (font: any) => {
      const sz = mobile ? 1.5 : 2.8;
      const depth = mobile ? 0.5 : 0.9;
      const bevelThickness = mobile ? 0.2 : 0.38;
      const bevelSize = mobile ? 0.18 : 0.3;
      const bevelSegments = mobile ? 16 : 28;

      const geo = new TextGeometry('LaTechNique', {
        font,
        size: sz,
        height: depth,
        curveSegments: mobile ? 24 : 48,
        bevelEnabled: true,
        bevelThickness,
        bevelSize,
        bevelOffset: 0,
        bevelSegments,
      });

      geo.computeBoundingBox();
      const bb = geo.boundingBox!;
      const mesh = new THREE.Mesh(geo, glass);
      mesh.position.set(
        -(bb.max.x - bb.min.x) / 2,
        -(bb.max.y - bb.min.y) / 2,
        -(bb.max.z - bb.min.z) / 2
      );

      // Slight italic lean like Air.inc
      const group = new THREE.Group();
      group.add(mesh);
      // Apply a subtle shear for cursive feel
      mesh.rotation.z = -0.04;
      scene.add(group);
      textGroupRef.current = group;
    });

    /* ---------- Helper: header world Y ---------- */
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

    /* ---------- Animation loop ---------- */
    const LERP_SPEED = 0.05;
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
        LERP_SPEED
      );
      const s = smoothScrollRef.current;
      const animT = Math.min(1, s / ANIM_END);
      const eased = smoothstep(0, 1, animT);

      camera.position.set(0, 1.5, 16);
      camera.lookAt(0, 0, 0);

      if (textGroupRef.current) {
        const g = textGroupRef.current;
        g.rotation.y = eased * Math.PI * 4;
        g.rotation.x = Math.sin(animT * Math.PI) * 0.06;

        const sc = Math.max(0.18, 1 - eased * 0.82);
        g.scale.setScalar(lerp(g.scale.x, sc, LERP_SPEED));
        camera.updateMatrixWorld();
        g.position.y = lerp(0, headerWorldY(camera), eased);
      }

      // Light follows mouse
      if (specLightRef.current) {
        specLightRef.current.position.x = lerp(
          specLightRef.current.position.x,
          5 + mouseRef.current.x * 6,
          0.025
        );
        specLightRef.current.position.y = lerp(
          specLightRef.current.position.y,
          6 + mouseRef.current.y * 4,
          0.025
        );
      }

      renderer.setClearColor(0x000000, 0);
      renderer.render(scene, camera);
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
      if (!rendererRef.current || !cameraRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
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

/* ---------- Bright sky environment ---------- */
function buildBrightSky(): HTMLCanvasElement {
  const w = 2048, h = 1024;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;

  // Rich bright blue sky
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0.0, '#1a2a5c');
  g.addColorStop(0.1, '#2a4080');
  g.addColorStop(0.2, '#3558a8');
  g.addColorStop(0.3, '#4070c8');
  g.addColorStop(0.4, '#5088e0');
  g.addColorStop(0.5, '#65a0f0');
  g.addColorStop(0.6, '#80b8f8');
  g.addColorStop(0.7, '#98d0fc');
  g.addColorStop(0.8, '#b0e0ff');
  g.addColorStop(0.9, '#d0f0ff');
  g.addColorStop(1.0, '#f0f8ff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Sun glow for highlights
  ctx.globalCompositeOperation = 'screen';
  const sun = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, w * 0.4);
  sun.addColorStop(0, 'rgba(255, 255, 250, 0.22)');
  sun.addColorStop(0.5, 'rgba(255, 248, 240, 0.08)');
  sun.addColorStop(1, 'rgba(255, 245, 230, 0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);

  return c;
}

export default GlassScene;
