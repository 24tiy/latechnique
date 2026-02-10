'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface GlassSceneProps {
  scrollProgress: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const GlassScene: React.FC<GlassSceneProps> = ({ scrollProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const textGroupRef = useRef<any>(null);
  const specLightRef = useRef<any>(null);
  const frameRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);

  // Smooth animation values
  const sm = useRef({
    scroll: 0,
    rotY: 0,
    scale: 1,
    posY: 0,
    camZ: 20,
    camY: 0.5,
    envRot: 0,
  });

  const initScene = useCallback(async () => {
    if (!canvasRef.current) return;

    const THREE = await import('three');
    const { TextGeometry } = await import('three/examples/jsm/geometries/TextGeometry.js');
    const { FontLoader } = await import('three/examples/jsm/loaders/FontLoader.js');

    const canvas = canvasRef.current;
    const mobile = window.innerWidth < 768;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    rendererRef.current = renderer;

    /* ── Scene ── */
    const scene = new THREE.Scene();

    /* ── Camera ── */
    const camera = new THREE.PerspectiveCamera(
      mobile ? 50 : 38,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 0.5, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    /* ── Sky / Environment ── */
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

    /* ── Lights ── */
    scene.add(new THREE.AmbientLight(0xe0d8f0, 0.3));

    const key = new THREE.DirectionalLight(0xfff0e0, 1.6);
    key.position.set(5, 8, 6);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xd0d8ff, 0.5);
    fill.position.set(-5, 2, 4);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffe8ff, 1.0);
    rim.position.set(0, 4, -6);
    scene.add(rim);

    const spec = new THREE.PointLight(0xffffff, 20, 25);
    spec.position.set(3, 4, 6);
    scene.add(spec);
    specLightRef.current = spec;

    /* ══════════════════════════════════════════
       GLASS MATERIAL — fixed for Three.js r164
       ══════════════════════════════════════════
       Key fixes vs previous version:
       - NO `dispersion` (only exists in r165+)
       - NO `transparent: true` (conflicts with transmission)
       - `side: FrontSide` (DoubleSide breaks transmission)
       - thin geometry + low thickness for clear see-through
    */
    const glass = new THREE.MeshPhysicalMaterial({
      // Core glass transmission
      transmission: 0.97,
      roughness: 0.02,
      metalness: 0.0,
      ior: 1.45,
      thickness: 0.3,

      // Reflections
      envMapIntensity: 3.0,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),

      // Clearcoat for extra shine
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,

      // Subtle color tint when light passes through
      attenuationColor: new THREE.Color('#efe8ff'),
      attenuationDistance: 15.0,

      // IMPORTANT: do NOT set transparent:true with transmission
      // and use FrontSide only — DoubleSide breaks transmission
      color: new THREE.Color(0xffffff),
      side: THREE.FrontSide,
    });

    /* ── 3D Text ── */
    const fontLoader = new FontLoader();
    fontLoader.load(
      'https://cdn.jsdelivr.net/npm/three@0.164.0/examples/fonts/helvetiker_bold.typeface.json',
      (font: any) => {
        const sz = mobile ? 0.9 : 1.4;
        const depth = mobile ? 0.25 : 0.4; // thinner for more transparency
        const segs = mobile ? 8 : 16;
        const bSegs = mobile ? 3 : 6;

        const geo = new TextGeometry('LaTechNique', {
          font,
          size: sz,
          height: depth,
          curveSegments: segs,
          bevelEnabled: true,
          bevelThickness: 0.08,
          bevelSize: 0.04,
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

    /* ── Animation loop ── */
    const L = 0.045; // lerp speed

    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      const v = sm.current;

      const t = scrollRef.current;
      v.scroll = lerp(v.scroll, t, L);
      const s = v.scroll;

      // Camera
      v.camZ = lerp(v.camZ, 20 - s * 4, L);
      v.camY = lerp(v.camY, 0.5 + s * 2.5, L);
      camera.position.z = v.camZ;
      camera.position.y = v.camY;
      camera.lookAt(0, s * 2.5, 0);

      if (textGroupRef.current) {
        // 2 full rotations with easeOut
        const eased = easeOutCubic(s);
        v.rotY = lerp(v.rotY, eased * Math.PI * 4, L);
        textGroupRef.current.rotation.y = v.rotY;
        textGroupRef.current.rotation.x = lerp(
          textGroupRef.current.rotation.x, s * 0.08, L
        );

        // Scale 1 → 0.22
        v.scale = lerp(v.scale, Math.max(0.18, 1 - s * 0.78), L);
        textGroupRef.current.scale.setScalar(v.scale);

        // Rise to header
        v.posY = lerp(v.posY, s * 5.5, L);
        textGroupRef.current.position.y = v.posY;
      }

      // Mouse → spec light
      if (specLightRef.current) {
        specLightRef.current.position.x = lerp(
          specLightRef.current.position.x, 3 + mouseRef.current.x * 3, 0.04
        );
        specLightRef.current.position.y = lerp(
          specLightRef.current.position.y, 4 + mouseRef.current.y * 2, 0.04
        );
      }

      // Slow env rotation
      v.envRot += 0.0003;
      if ((scene as any).backgroundRotation)
        (scene as any).backgroundRotation.y = v.envRot;
      if ((scene as any).environmentRotation)
        (scene as any).environmentRotation.y = v.envRot;

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
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
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

/* ═══════════════════════════════════════
   SKY TEXTURE
   ═══════════════════════════════════════ */
function buildSkyTexture(): HTMLCanvasElement {
  const w = 2048, h = 1024;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d')!;

  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0.00, '#6B5A9E');
  g.addColorStop(0.12, '#8B7ABE');
  g.addColorStop(0.25, '#B0A0D0');
  g.addColorStop(0.36, '#D0C0E0');
  g.addColorStop(0.45, '#E0D0D8');
  g.addColorStop(0.52, '#EDE0D0');
  g.addColorStop(0.60, '#F5D8B5');
  g.addColorStop(0.72, '#F0C898');
  g.addColorStop(0.85, '#E0A870');
  g.addColorStop(1.00, '#D09058');
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);

  // Clouds
  x.globalCompositeOperation = 'screen';
  const s = [0.12,0.34,0.56,0.78,0.91,0.23,0.45,0.67,0.89,0.01,
    0.38,0.72,0.15,0.58,0.93,0.27,0.61,0.84,0.49,0.06,
    0.33,0.77,0.19,0.52,0.88,0.41,0.66,0.03,0.75,0.29,
    0.55,0.82,0.11,0.47,0.69,0.95,0.36,0.63,0.08,0.71];

  for (let i = 0; i < 50; i++) {
    const cx = s[i % 40] * w;
    const cy = h * 0.05 + s[(i + 7) % 40] * h * 0.6;
    const rx = 100 + s[(i + 3) % 40] * 400;
    const ry = 30 + s[(i + 11) % 40] * 120;
    const a = 0.06 + s[(i + 5) % 40] * 0.22;
    const cg = x.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    cg.addColorStop(0, `rgba(255,255,255,${a})`);
    cg.addColorStop(0.3, `rgba(255,252,248,${a * 0.5})`);
    cg.addColorStop(0.7, `rgba(255,248,240,${a * 0.15})`);
    cg.addColorStop(1, 'rgba(255,245,235,0)');
    x.fillStyle = cg;
    x.beginPath();
    x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    x.fill();
  }

  x.globalCompositeOperation = 'lighter';
  const hz = x.createRadialGradient(w * 0.5, h * 0.48, 0, w * 0.5, h * 0.48, w * 0.5);
  hz.addColorStop(0, 'rgba(255,240,220,0.18)');
  hz.addColorStop(0.5, 'rgba(255,220,180,0.06)');
  hz.addColorStop(1, 'rgba(255,200,150,0)');
  x.fillStyle = hz;
  x.fillRect(0, 0, w, h);

  return c;
}

export default GlassScene;
