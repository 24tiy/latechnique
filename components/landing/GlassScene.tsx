'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface GlassSceneProps {
  scrollProgress: number;
}

function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

const GlassScene: React.FC<GlassSceneProps> = ({ scrollProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<any>(null);
  const sceneRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const textGroupRef = useRef<any>(null);
  const specLightRef = useRef<any>(null);
  const frameRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  const smoothScroll = useRef(0);
  const smoothRotY = useRef(0);
  const smoothScale = useRef(1);
  const smoothPosY = useRef(0);
  const smoothCamZ = useRef(20);
  const smoothCamY = useRef(0.8);
  const envRotRef = useRef(0);

  const initScene = useCallback(async () => {
    if (!canvasRef.current) return;

    const THREE = await import('three');
    const { TextGeometry } = await import('three/examples/jsm/geometries/TextGeometry.js');
    const { FontLoader } = await import('three/examples/jsm/loaders/FontLoader.js');

    const canvas = canvasRef.current;
    const isMobile = window.innerWidth < 768;

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    // ── Scene ──
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(
      isMobile ? 50 : 38,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    camera.position.set(0, 0.8, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // ── Sky environment ──
    const skyCanvas = createSkyTexture();
    const skyTexture = new THREE.CanvasTexture(skyCanvas);
    skyTexture.mapping = THREE.EquirectangularReflectionMapping;
    skyTexture.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envMap = pmrem.fromEquirectangular(skyTexture).texture;
    scene.background = skyTexture;
    scene.environment = envMap;
    pmrem.dispose();

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0xd8d0e8, 0.5));

    const keyLight = new THREE.DirectionalLight(0xfff0e0, 2.8);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xd0d8ff, 1.0);
    fillLight.position.set(-5, 2, 4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffe8ff, 2.0);
    rimLight.position.set(0, 4, -6);
    scene.add(rimLight);

    const bounceLight = new THREE.DirectionalLight(0xffd8a0, 0.5);
    bounceLight.position.set(0, -5, 3);
    scene.add(bounceLight);

    const specPoint = new THREE.PointLight(0xffffff, 40, 25);
    specPoint.position.set(3, 4, 6);
    scene.add(specPoint);
    specLightRef.current = specPoint;

    // ── Glass material ──
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      transmission: 0.95,
      roughness: 0.05,
      metalness: 0,
      ior: 1.5,
      thickness: 1.5,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),
      envMapIntensity: 1.6,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      attenuationColor: new THREE.Color('#E0D0F8'),
      attenuationDistance: 3.5,
      dispersion: 0.3,
      transparent: true,
      color: new THREE.Color(0xffffff),
      side: THREE.DoubleSide,
    });

    // ── Load font + create 3D text ──
    const fontLoader = new FontLoader();
    fontLoader.load(
      'https://cdn.jsdelivr.net/npm/three@0.164.0/examples/fonts/helvetiker_bold.typeface.json',
      (font: any) => {
        const textSize = isMobile ? 0.9 : 1.4;
        const extrudeDepth = isMobile ? 0.5 : 0.8;
        const curves = isMobile ? 8 : 16;
        const bevSeg = isMobile ? 3 : 6;

        const geo = new TextGeometry('LaTechNique', {
          font,
          size: textSize,
          height: extrudeDepth,
          curveSegments: curves,
          bevelEnabled: true,
          bevelThickness: 0.15,
          bevelSize: 0.08,
          bevelOffset: 0,
          bevelSegments: bevSeg,
        });

        const mesh = new THREE.Mesh(geo, glassMaterial);

        geo.computeBoundingBox();
        const box = geo.boundingBox!;
        mesh.position.set(
          -(box.max.x - box.min.x) / 2,
          -(box.max.y - box.min.y) / 2,
          -(box.max.z - box.min.z) / 2
        );

        const group = new THREE.Group();
        group.add(mesh);
        scene.add(group);
        textGroupRef.current = group;
      }
    );

    // ── Render loop with lerp ──
    const LERP = 0.055;

    function animate() {
      frameRef.current = requestAnimationFrame(animate);

      const t = scrollRef.current;
      smoothScroll.current = lerp(smoothScroll.current, t, LERP);
      const s = smoothScroll.current;

      // Camera: gentle shift only
      const targetCamZ = 20 - s * 2;
      const targetCamY = 0.8 + s * 3.2;
      smoothCamZ.current = lerp(smoothCamZ.current, targetCamZ, LERP);
      smoothCamY.current = lerp(smoothCamY.current, targetCamY, LERP);
      camera.position.z = smoothCamZ.current;
      camera.position.y = smoothCamY.current;
      camera.lookAt(0, smoothScroll.current * 3, 0);

      if (textGroupRef.current) {
        // 2 full rotations around Y axis
        const targetRotY = s * Math.PI * 4;
        smoothRotY.current = lerp(smoothRotY.current, targetRotY, LERP);
        textGroupRef.current.rotation.y = smoothRotY.current;

        // Slight X tilt
        textGroupRef.current.rotation.x = lerp(
          textGroupRef.current.rotation.x,
          s * 0.1,
          LERP
        );

        // Scale: 1 → 0.18 (shrink as you scroll)
        const targetScale = 1 - s * 0.82;
        smoothScale.current = lerp(smoothScale.current, targetScale, LERP);
        textGroupRef.current.scale.setScalar(smoothScale.current);

        // Position Y: move up to header area
        const targetPosY = s * 5.8;
        smoothPosY.current = lerp(smoothPosY.current, targetPosY, LERP);
        textGroupRef.current.position.y = smoothPosY.current;
      }

      // Mouse → light
      if (specLightRef.current) {
        specLightRef.current.position.x = lerp(
          specLightRef.current.position.x, 3 + mouseRef.current.x * 3, 0.04
        );
        specLightRef.current.position.y = lerp(
          specLightRef.current.position.y, 4 + mouseRef.current.y * 2, 0.04
        );
      }

      envRotRef.current += 0.0006;
      if ((scene as any).backgroundRotation)
        (scene as any).backgroundRotation.y = envRotRef.current;
      if ((scene as any).environmentRotation)
        (scene as any).environmentRotation.y = envRotRef.current;

      renderer.render(scene, camera);
    }

    animate();
  }, []);

  useEffect(() => { scrollRef.current = scrollProgress; }, [scrollProgress]);

  useEffect(() => {
    const onMove = (ev: MouseEvent) => {
      mouseRef.current.x = (ev.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(ev.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (!rendererRef.current || !cameraRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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

/* ═══════════════════════════════════════════
   PROCEDURAL SKY
   ═══════════════════════════════════════════ */
function createSkyTexture(): HTMLCanvasElement {
  const w = 2048, h = 1024;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0.00, '#6B5A9E');
  sky.addColorStop(0.12, '#8B7ABE');
  sky.addColorStop(0.25, '#B0A0D0');
  sky.addColorStop(0.36, '#D0C0E0');
  sky.addColorStop(0.45, '#E0D0D8');
  sky.addColorStop(0.52, '#EDE0D0');
  sky.addColorStop(0.60, '#F5D8B5');
  sky.addColorStop(0.72, '#F0C898');
  sky.addColorStop(0.85, '#E0A870');
  sky.addColorStop(1.00, '#D09058');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'screen';
  const seed = [0.12,0.34,0.56,0.78,0.91,0.23,0.45,0.67,0.89,0.01,
    0.38,0.72,0.15,0.58,0.93,0.27,0.61,0.84,0.49,0.06,
    0.33,0.77,0.19,0.52,0.88,0.41,0.66,0.03,0.75,0.29,
    0.55,0.82,0.11,0.47,0.69,0.95,0.36,0.63,0.08,0.71];

  for (let i = 0; i < 50; i++) {
    const x = seed[i % 40] * w;
    const y = h * 0.05 + seed[(i + 7) % 40] * h * 0.6;
    const rx = 100 + seed[(i + 3) % 40] * 400;
    const ry = 30 + seed[(i + 11) % 40] * 120;
    const alpha = 0.06 + seed[(i + 5) % 40] * 0.22;
    const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    g.addColorStop(0, `rgba(255,255,255,${alpha})`);
    g.addColorStop(0.3, `rgba(255,252,248,${alpha * 0.5})`);
    g.addColorStop(0.7, `rgba(255,248,240,${alpha * 0.15})`);
    g.addColorStop(1, 'rgba(255,245,235,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'lighter';
  const hz = ctx.createRadialGradient(w * 0.5, h * 0.48, 0, w * 0.5, h * 0.48, w * 0.5);
  hz.addColorStop(0, 'rgba(255,240,220,0.18)');
  hz.addColorStop(0.5, 'rgba(255,220,180,0.06)');
  hz.addColorStop(1, 'rgba(255,200,150,0)');
  ctx.fillStyle = hz;
  ctx.fillRect(0, 0, w, h);

  return c;
}

export default GlassScene;
