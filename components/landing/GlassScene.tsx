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
    renderer.toneMappingExposure = 1.2;
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
       HDR-QUALITY ENVIRONMENT MAP
       Rich contrast = beautiful glass reflections
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
       LIGHTING — dramatic for glass
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    scene.add(new THREE.AmbientLight(0xd8d0e8, 0.3));

    // Key light — warm, high, right
    const key = new THREE.DirectionalLight(0xfff4e8, 2.2);
    key.position.set(6, 10, 5);
    scene.add(key);

    // Fill — cool, left
    const fill = new THREE.DirectionalLight(0xc8d8ff, 0.6);
    fill.position.set(-6, 3, 4);
    scene.add(fill);

    // Rim — purple back light for glass edge glow
    const rim = new THREE.DirectionalLight(0xd8c0ff, 1.5);
    rim.position.set(0, 5, -8);
    scene.add(rim);

    // Bottom warm bounce
    const bounce = new THREE.DirectionalLight(0xffe0c0, 0.5);
    bounce.position.set(0, -5, 3);
    scene.add(bounce);

    // Specular highlight — follows mouse
    const spec = new THREE.PointLight(0xffffff, 40, 35);
    spec.position.set(3, 5, 8);
    scene.add(spec);
    specLightRef.current = spec;

    // Extra sparkle lights for glass
    const sparkle1 = new THREE.PointLight(0xd0c0ff, 15, 20);
    sparkle1.position.set(-5, 3, 3);
    scene.add(sparkle1);

    const sparkle2 = new THREE.PointLight(0xffe8d0, 12, 18);
    sparkle2.position.set(4, -2, 5);
    scene.add(sparkle2);

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       GLASS MATERIAL — premium refractive glass

       Key principles:
       - transmission 0.92: not fully transparent, so
         refraction distortion is visible
       - ior 1.55: higher = more visible light bending
       - thickness 0.8: increases refraction effect
       - envMapIntensity 5.0: strong environment reflections
       - attenuationColor: light gets tinted going through
       - clearcoat: second reflective surface layer
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    const glass = new THREE.MeshPhysicalMaterial({
      transmission: 0.92,
      roughness: 0.05,
      metalness: 0.0,
      ior: 1.55,
      thickness: 0.8,

      envMapIntensity: 5.0,

      specularIntensity: 1.5,
      specularColor: new THREE.Color(0xffffff),

      clearcoat: 1.0,
      clearcoatRoughness: 0.0,

      // Subtle lavender tint = premium crystal feel
      attenuationColor: new THREE.Color('#e0d8f8'),
      attenuationDistance: 5.0,

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
        const depth = mobile ? 0.4 : 0.65;
        const segs = mobile ? 10 : 20;
        const bSegs = mobile ? 4 : 8;

        const geo = new TextGeometry('LaTechNique', {
          font,
          size: sz,
          height: depth,
          curveSegments: segs,
          bevelEnabled: true,
          bevelThickness: 0.12,
          bevelSize: 0.06,
          bevelOffset: 0,
          bevelSegments: bSegs,
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
       POST-PROCESSING — Bloom

       Makes specular highlights on glass edges
       glow softly. The difference between "ok" glass
       and "premium crystal" look.
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.35,  // strength — subtle glow
      0.6,   // radius — soft spread
      0.7    // threshold — only bright spots bloom
    );
    composer.addPass(bloomPass);
    composerRef.current = composer;

    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ANIMATION LOOP
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
    const LERP_SPEED = 0.05;

    function animate() {
      frameRef.current = requestAnimationFrame(animate);

      // Single smoothed scroll drives everything
      smoothScrollRef.current = lerp(
        smoothScrollRef.current,
        scrollRef.current,
        LERP_SPEED
      );
      const s = smoothScrollRef.current;

      // Camera
      camera.position.z = lerp(camera.position.z, 20 - s * 5, LERP_SPEED);
      camera.position.y = lerp(camera.position.y, 0.3 + s * 3.5, LERP_SPEED);
      camera.lookAt(0, s * 3.5, 0);

      if (textGroupRef.current) {
        const group = textGroupRef.current;

        // ROTATION: exactly 2 turns with smooth ease
        const rotEased = smoothstep(0, 1, s);
        group.rotation.y = rotEased * Math.PI * 4;

        // Subtle X tilt during spin
        group.rotation.x = Math.sin(s * Math.PI) * 0.08;

        // SCALE: 1 → 0.18
        const targetScale = Math.max(0.18, 1 - s * 0.82);
        group.scale.setScalar(lerp(group.scale.x, targetScale, LERP_SPEED));

        // POSITION: rise to header
        group.position.y = lerp(group.position.y, s * 6.2, LERP_SPEED);
      }

      // Mouse → specular light
      if (specLightRef.current) {
        specLightRef.current.position.x = lerp(
          specLightRef.current.position.x,
          3 + mouseRef.current.x * 4,
          0.035
        );
        specLightRef.current.position.y = lerp(
          specLightRef.current.position.y,
          5 + mouseRef.current.y * 3,
          0.035
        );
      }

      // Render through bloom pipeline
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
      composerRef.current?.dispose?.();
    };
  }, [initScene]);

  return <canvas ref={canvasRef} className="glass-canvas" />;
};

/* ═══════════════════════════════════════════════════════
   HDR-QUALITY SKY TEXTURE

   The environment map is THE key to good glass.
   Rich contrast and color variety create interesting
   reflections and refractions through the material.
   ═══════════════════════════════════════════════════════ */
function buildHDRSkyTexture(): HTMLCanvasElement {
  const w = 2048;
  const h = 1024;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;

  // Base: deep purple → lavender → peach → warm gold
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0.0,  '#4A3D8F');
  sky.addColorStop(0.08, '#6355A4');
  sky.addColorStop(0.18, '#8272B8');
  sky.addColorStop(0.28, '#A898CC');
  sky.addColorStop(0.38, '#C4B4D8');
  sky.addColorStop(0.46, '#D8C8D8');
  sky.addColorStop(0.52, '#E4D4C8');
  sky.addColorStop(0.58, '#ECDCC0');
  sky.addColorStop(0.65, '#F2D0A8');
  sky.addColorStop(0.75, '#E8B880');
  sky.addColorStop(0.85, '#D8A068');
  sky.addColorStop(0.95, '#C88850');
  sky.addColorStop(1.0,  '#B87840');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Warm horizon band
  const horizon = ctx.createLinearGradient(0, h * 0.42, 0, h * 0.62);
  horizon.addColorStop(0, 'rgba(255,200,150,0)');
  horizon.addColorStop(0.3, 'rgba(255,210,170,0.15)');
  horizon.addColorStop(0.5, 'rgba(255,195,145,0.2)');
  horizon.addColorStop(0.7, 'rgba(255,210,170,0.15)');
  horizon.addColorStop(1, 'rgba(255,200,150,0)');
  ctx.fillStyle = horizon;
  ctx.fillRect(0, 0, w, h);

  // Subtle off-center sun glow
  ctx.globalCompositeOperation = 'screen';
  const sun = ctx.createRadialGradient(
    w * 0.35, h * 0.50, 0,
    w * 0.35, h * 0.50, w * 0.25
  );
  sun.addColorStop(0, 'rgba(255,230,200,0.18)');
  sun.addColorStop(0.3, 'rgba(255,215,175,0.10)');
  sun.addColorStop(0.7, 'rgba(255,200,160,0.03)');
  sun.addColorStop(1, 'rgba(255,200,150,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);

  // Cloud layers — tinted, NOT white
  const seeds = [
    0.12, 0.34, 0.56, 0.78, 0.91, 0.23, 0.45, 0.67, 0.89, 0.01,
    0.38, 0.72, 0.15, 0.58, 0.93, 0.27, 0.61, 0.84, 0.49, 0.06,
    0.33, 0.77, 0.19, 0.52, 0.88, 0.41, 0.66, 0.03, 0.75, 0.29,
    0.55, 0.82, 0.11, 0.47, 0.69, 0.95, 0.36, 0.63, 0.08, 0.71,
  ];

  // Layer 1: Large atmospheric haze
  for (let i = 0; i < 15; i++) {
    const cx = seeds[i % 40] * w;
    const cy = h * 0.15 + seeds[(i + 7) % 40] * h * 0.45;
    const rx = 200 + seeds[(i + 3) % 40] * 500;
    const ry = 40 + seeds[(i + 11) % 40] * 100;
    const a = 0.04 + seeds[(i + 5) % 40] * 0.08;

    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    cg.addColorStop(0, `rgba(220,215,235,${a})`);
    cg.addColorStop(0.5, `rgba(215,210,230,${a * 0.4})`);
    cg.addColorStop(1, 'rgba(210,205,225,0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, seeds[(i + 2) % 40] * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Layer 2: Smaller, brighter patches (contrast for refraction)
  for (let i = 15; i < 40; i++) {
    const cx = seeds[i % 40] * w;
    const cy = h * 0.10 + seeds[(i + 3) % 40] * h * 0.50;
    const rx = 50 + seeds[(i + 7) % 40] * 180;
    const ry = 15 + seeds[(i + 11) % 40] * 50;
    const a = 0.03 + seeds[(i + 9) % 40] * 0.06;

    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    cg.addColorStop(0, `rgba(235,230,245,${a})`);
    cg.addColorStop(0.6, `rgba(225,220,240,${a * 0.3})`);
    cg.addColorStop(1, 'rgba(220,215,235,0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Depth at top
  ctx.globalCompositeOperation = 'multiply';
  const depth = ctx.createLinearGradient(0, 0, 0, h * 0.3);
  depth.addColorStop(0, 'rgba(70,55,130,0.15)');
  depth.addColorStop(1, 'rgba(100,80,150,0)');
  ctx.fillStyle = depth;
  ctx.fillRect(0, 0, w, h * 0.3);

  // Warm ground bounce
  ctx.globalCompositeOperation = 'screen';
  const ground = ctx.createLinearGradient(0, h * 0.75, 0, h);
  ground.addColorStop(0, 'rgba(200,160,100,0)');
  ground.addColorStop(0.5, 'rgba(200,160,100,0.06)');
  ground.addColorStop(1, 'rgba(180,140,80,0.1)');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, w, h);

  return c;
}

export default GlassScene;
