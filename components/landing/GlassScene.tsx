'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface GlassSceneProps {
  scrollProgress: number;
}

const GlassScene: React.FC<GlassSceneProps> = ({ scrollProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const textGroupRef = useRef<any>(null);
  const specLightRef = useRef<any>(null);
  const envRotRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(0);
  const loadedRef = useRef(false);
  const onLoadRef = useRef<(() => void) | null>(null);

  // ── Build the entire Three.js scene ──
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
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // ── Scene ──
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(
      isMobile ? 55 : 40,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.3, isMobile ? 16 : 12);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // ── Procedural sky environment ──
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
    scene.add(new THREE.AmbientLight(0xd8d0e8, 0.6));

    const keyLight = new THREE.DirectionalLight(0xfff0e0, 2.5);
    keyLight.position.set(5, 6, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xd0d8ff, 1.2);
    fillLight.position.set(-4, 2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.8);
    rimLight.position.set(0, 3, -5);
    scene.add(rimLight);

    const bounceLight = new THREE.DirectionalLight(0xffd8a0, 0.6);
    bounceLight.position.set(0, -4, 2);
    scene.add(bounceLight);

    const specPoint = new THREE.PointLight(0xffffff, 30, 20);
    specPoint.position.set(2, 3, 5);
    scene.add(specPoint);
    specLightRef.current = specPoint;

    // ── Glass material ──
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      transmission: 0.97,
      roughness: 0.03,
      metalness: 0,
      ior: 1.52,
      thickness: 2.0,
      specularIntensity: 1.0,
      specularColor: new THREE.Color(0xffffff),
      envMapIntensity: 1.4,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      attenuationColor: new THREE.Color('#D8C8F0'),
      attenuationDistance: 4,
      dispersion: 0.4,
      transparent: true,
      color: new THREE.Color(0xffffff),
      side: THREE.FrontSide,
    });

    // ── Load font + create text ──
    const fontLoader = new FontLoader();
    fontLoader.load(
      'https://cdn.jsdelivr.net/npm/three@0.164.0/examples/fonts/helvetiker_bold.typeface.json',
      (font: any) => {
        const textSize = isMobile ? 1.6 : 2.4;
        const extrudeDepth = isMobile ? 0.6 : 1.0;
        const curves = isMobile ? 10 : 20;
        const bevSeg = isMobile ? 4 : 8;

        const laGeo = new TextGeometry('La ', {
          font,
          size: textSize,
          height: extrudeDepth,
          curveSegments: curves,
          bevelEnabled: true,
          bevelThickness: 0.18,
          bevelSize: 0.12,
          bevelOffset: 0,
          bevelSegments: bevSeg,
        });

        const tnGeo = new TextGeometry('TechNique', {
          font,
          size: textSize,
          height: extrudeDepth,
          curveSegments: curves,
          bevelEnabled: true,
          bevelThickness: 0.18,
          bevelSize: 0.12,
          bevelOffset: 0,
          bevelSegments: bevSeg,
        });

        const laGlass = glassMaterial.clone();
        laGlass.thickness = 1.2;
        laGlass.attenuationDistance = 6;

        const laMesh = new THREE.Mesh(laGeo, laGlass);
        const tnMesh = new THREE.Mesh(tnGeo, glassMaterial);

        laGeo.computeBoundingBox();
        tnMesh.position.x = laGeo.boundingBox!.max.x - laGeo.boundingBox!.min.x;

        const group = new THREE.Group();
        group.add(laMesh, tnMesh);

        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        group.position.sub(center);

        scene.add(group);
        textGroupRef.current = group;
        loadedRef.current = true;

        if (onLoadRef.current) onLoadRef.current();
      }
    );

    // ── Animation loop ──
    function animate() {
      frameRef.current = requestAnimationFrame(animate);

      envRotRef.current += 0.0008;
      if ((scene as any).backgroundRotation) (scene as any).backgroundRotation.y = envRotRef.current;
      if ((scene as any).environmentRotation) (scene as any).environmentRotation.y = envRotRef.current;

      if (specLightRef.current) {
        specLightRef.current.position.x = 2 + mouseRef.current.x * 2;
        specLightRef.current.position.y = 3 + mouseRef.current.y * 1.5;
      }

      renderer.render(scene, camera);
    }
    animate();
  }, []);

  // ── Mouse tracking ──
  useEffect(() => {
    const onMove = (ev: MouseEvent) => {
      mouseRef.current.x = (ev.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (ev.clientY / window.innerHeight - 0.5) * 2;
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, []);

  // ── Resize ──
  useEffect(() => {
    const onResize = () => {
      if (!rendererRef.current || !cameraRef.current) return;
      const w = window.innerWidth, h = window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Init ──
  useEffect(() => {
    initScene();
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      rendererRef.current?.dispose();
    };
  }, [initScene]);

  // ── Scroll-driven updates ──
  useEffect(() => {
    const e = 1 - Math.pow(1 - scrollProgress, 2.4);
    const canvas = canvasRef.current;

    if (canvas) {
      const blur = 22 * (1 - e);
      canvas.style.filter = blur > 0.2 ? `blur(${blur}px)` : 'none';
    }

    if (textGroupRef.current) {
      textGroupRef.current.rotation.x = -0.08 * (1 - e);
      textGroupRef.current.rotation.y = 0.04 * Math.sin(e * Math.PI * 0.4);
    }
  }, [scrollProgress]);

  return (
    <canvas
      ref={canvasRef}
      id="glassCanvas"
      className="glass-canvas"
    />
  );
};

// ═══════════════════════════════════════════════════
// PROCEDURAL SKY TEXTURE
// ═══════════════════════════════════════════════════

function createSkyTexture(): HTMLCanvasElement {
  const w = 2048, h = 1024;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0.00, '#5B4A8A');
  sky.addColorStop(0.15, '#7B6AAE');
  sky.addColorStop(0.28, '#A898CC');
  sky.addColorStop(0.38, '#C8B8D8');
  sky.addColorStop(0.46, '#DDD0D8');
  sky.addColorStop(0.52, '#EAE0D0');
  sky.addColorStop(0.60, '#F2D8B5');
  sky.addColorStop(0.72, '#ECC898');
  sky.addColorStop(0.85, '#D8A870');
  sky.addColorStop(1.00, '#C89058');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'screen';

  const seed = [0.12,0.34,0.56,0.78,0.91,0.23,0.45,0.67,0.89,0.01,0.38,0.72,0.15,0.58,0.93,0.27,0.61,0.84,0.49,0.06,0.33,0.77,0.19,0.52,0.88,0.41,0.66,0.03,0.75,0.29,0.55,0.82,0.11,0.47,0.69,0.95,0.36,0.63,0.08,0.71];

  for (let i = 0; i < 40; i++) {
    const x = seed[i % seed.length] * w;
    const y = h * 0.1 + seed[(i + 7) % seed.length] * h * 0.55;
    const rx = 80 + seed[(i + 3) % seed.length] * 380;
    const ry = 25 + seed[(i + 11) % seed.length] * 110;
    const alpha = 0.04 + seed[(i + 5) % seed.length] * 0.2;

    const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    g.addColorStop(0, `rgba(255,255,255,${alpha})`);
    g.addColorStop(0.3, `rgba(255,252,248,${alpha * 0.6})`);
    g.addColorStop(0.6, `rgba(255,248,240,${alpha * 0.25})`);
    g.addColorStop(1, 'rgba(255,245,235,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'lighter';
  const hz = ctx.createRadialGradient(w * 0.5, h * 0.48, 0, w * 0.5, h * 0.48, w * 0.5);
  hz.addColorStop(0, 'rgba(255,240,220,0.15)');
  hz.addColorStop(0.5, 'rgba(255,220,180,0.05)');
  hz.addColorStop(1, 'rgba(255,200,150,0)');
  ctx.fillStyle = hz;
  ctx.fillRect(0, 0, w, h);

  return c;
}

export default GlassScene;
