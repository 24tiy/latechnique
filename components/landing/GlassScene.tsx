'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface GlassSceneProps {
  scrollProgress: number;
}

function springDamp(current: number, target: number, velocity: number, stiffness: number, damping: number, dt: number) {
  const force = (target - current) * stiffness;
  const damp = -velocity * damping;
  const newVel = velocity + (force + damp) * dt;
  const newPos = current + newVel * dt;
  return { value: newPos, velocity: newVel };
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

const GlassScene: React.FC<GlassSceneProps> = ({ scrollProgress }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<any>(null);
  const scrollRef = useRef(0);
  const frameRef = useRef(0);

  const initScene = useCallback(async () => {
    if (!canvasRef.current) return;

    const THREE = await import('three');
    const { FontLoader } = await import('three/examples/jsm/loaders/FontLoader.js');
    const { TextGeometry } = await import('three/examples/jsm/geometries/TextGeometry.js');
    const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js');
    const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js');
    const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js');
    const { ShaderPass } = await import('three/examples/jsm/postprocessing/ShaderPass.js');
    const { OutputPass } = await import('three/examples/jsm/postprocessing/OutputPass.js');

    const canvas = canvasRef.current;
    const mobile = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio, mobile ? 1.5 : 2);
    const W = window.innerWidth;
    const H = window.innerHeight;

    /* ═══════ RENDERER ═══════ */
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;
    renderer.setClearColor(0x000000, 0);

    /* ═══════ SCENE / CAMERA ═══════ */
    const scene = new THREE.Scene();
    const fov = mobile ? 55 : 44;
    const camera = new THREE.PerspectiveCamera(fov, W / H, 0.1, 300);
    camera.position.set(0, 0.8, 14);
    camera.lookAt(0, 0, 0);

    /* ═══════ ENVIRONMENT MAP ═══════ */
    const envCanvas = buildRichSkyEnv();
    const envTex = new THREE.CanvasTexture(envCanvas);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    envTex.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envMap = pmrem.fromEquirectangular(envTex).texture;
    scene.environment = envMap;
    pmrem.dispose();

    /* ═══════ 3D CLOUD PLANES (subtle, behind text) ═══════ */
    const cloudTextures = buildCloudTextures(THREE);
    const cloudPlanes: any[] = [];
    const cloudConfigs = [
      { z: -50, y: 6, x: -18, scale: 24, opacity: 0.22, speed: 0.006 },
      { z: -65, y: 3, x: 22, scale: 30, opacity: 0.15, speed: 0.004 },
      { z: -40, y: 10, x: 6, scale: 18, opacity: 0.25, speed: 0.008 },
      { z: -75, y: -3, x: -12, scale: 35, opacity: 0.12, speed: 0.003 },
      { z: -55, y: 5, x: -28, scale: 22, opacity: 0.18, speed: 0.005 },
    ];
    cloudConfigs.forEach((cfg, i) => {
      const tex = cloudTextures[i % cloudTextures.length];
      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: cfg.opacity,
        depthWrite: false, side: THREE.DoubleSide,
      });
      const geo = new THREE.PlaneGeometry(cfg.scale, cfg.scale * 0.45);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cfg.x, cfg.y, cfg.z);
      mesh.userData = { speed: cfg.speed, baseX: cfg.x };
      scene.add(mesh);
      cloudPlanes.push(mesh);
    });

    /* ═══════ LIGHTING ═══════ */
    scene.add(new THREE.AmbientLight(0xf0f8ff, 1.5));
    const keyLight = new THREE.DirectionalLight(0xffffff, 4.0);
    keyLight.position.set(8, 14, 10);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xe8f4ff, 2.0);
    fillLight.position.set(-8, 4, 8);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xfff8f0, 3.0);
    rimLight.position.set(0, 6, -14);
    scene.add(rimLight);
    const specLight = new THREE.PointLight(0xffffff, 80, 60);
    specLight.position.set(5, 6, 14);
    scene.add(specLight);
    const bottomRim = new THREE.DirectionalLight(0xaaccff, 2.0);
    bottomRim.position.set(0, -8, 10);
    scene.add(bottomRim);
    const accentA = new THREE.PointLight(0x4c96f7, 20, 45);
    accentA.position.set(-12, 3, 6);
    scene.add(accentA);
    const accentB = new THREE.PointLight(0x8b5cf6, 15, 45);
    accentB.position.set(12, -2, 8);
    scene.add(accentB);

    /* ═══════ GLASS MATERIAL ═══════ */
    /*
     * BUG FIX: The old code had opacity: 0.12, which made text invisible.
     * With MeshPhysicalMaterial + transmission, do NOT set opacity < 1.
     * Transmission handles the see-through effect by itself.
     */
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      transmission: 0.92,
      roughness: 0.03,
      metalness: 0.0,
      ior: 1.5,
      thickness: 2.0,
      envMapIntensity: 4.0,
      specularIntensity: 2.0,
      specularColor: new THREE.Color(0xffffff),
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      attenuationColor: new THREE.Color('#d8ecff'),
      attenuationDistance: 3.0,
      color: new THREE.Color(0xffffff),
      side: THREE.DoubleSide,
      transparent: true,
      // opacity defaults to 1.0 — DO NOT override to 0.12!
    });

    /* ═══════ LOAD FONT ═══════ */
    const fontLoader = new FontLoader();
    let textGroup: any = null;

    const fontUrl = 'https://cdn.jsdelivr.net/npm/three@0.164.0/examples/fonts/droid/droid_serif_bold.typeface.json';

    fontLoader.load(fontUrl, (font: any) => {
      /*
       * BUG FIX: Text must fit in viewport.
       * Camera z=14, FOV=44° → visible width at z=0 ≈ 11.3 units.
       * "LaTechNique" (12 chars) at size 1.3 → width ≈ 8.6 units → 76% fill. Good.
       * Old code used size 2.6 → ~17 units → way wider than viewport → appeared tiny/cropped.
       */
      const sz = mobile ? 0.9 : 1.3;
      const depth = mobile ? 0.35 : 0.55;

      const geo = new TextGeometry('LaTechNique', {
        font,
        size: sz,
        height: depth,
        curveSegments: mobile ? 16 : 40,
        bevelEnabled: true,
        bevelThickness: mobile ? 0.12 : 0.22,
        bevelSize: mobile ? 0.1 : 0.18,
        bevelOffset: 0,
        bevelSegments: mobile ? 10 : 20,
      });

      geo.computeBoundingBox();
      const bb = geo.boundingBox!;
      const mesh = new THREE.Mesh(geo, glassMaterial);

      // Center precisely
      mesh.position.set(
        -(bb.max.x + bb.min.x) / 2,
        -(bb.max.y + bb.min.y) / 2,
        -(bb.max.z + bb.min.z) / 2
      );

      textGroup = new THREE.Group();
      textGroup.add(mesh);
      mesh.rotation.z = -0.03; // Slight italic lean
      scene.add(textGroup);
    });

    /* ═══════ POST-PROCESSING ═══════ */
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    renderPass.clearAlpha = 0;
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(W, H),
      mobile ? 0.25 : 0.4, 0.6, 0.85
    );
    composer.addPass(bloomPass);

    const ChromaticAberrationShader = {
      uniforms: {
        tDiffuse: { value: null },
        uOffset: { value: new THREE.Vector2(0.001, 0.0007) },
      },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform sampler2D tDiffuse; uniform vec2 uOffset; varying vec2 vUv;
        void main() {
          vec2 dir = vUv - vec2(0.5); float dist = length(dir); vec2 offset = uOffset * dist;
          float r = texture2D(tDiffuse, vUv + offset).r;
          float g = texture2D(tDiffuse, vUv).g;
          float b = texture2D(tDiffuse, vUv - offset).b;
          float a = texture2D(tDiffuse, vUv).a;
          gl_FragColor = vec4(r, g, b, a);
        }`,
    };
    const chromaticPass = new ShaderPass(ChromaticAberrationShader);
    composer.addPass(chromaticPass);

    const FilmGrainShader = {
      uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uIntensity: { value: 0.02 } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform sampler2D tDiffuse; uniform float uTime; uniform float uIntensity; varying vec2 vUv;
        float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          color.rgb += (hash(vUv * 1000.0 + uTime * 100.0) - 0.5) * uIntensity;
          gl_FragColor = color;
        }`,
    };
    const grainPass = new ShaderPass(FilmGrainShader);
    composer.addPass(grainPass);
    composer.addPass(new OutputPass());

    /* ═══════ SPRING STATE ═══════ */
    const spring = {
      scrollSmooth: 0, scrollVel: 0,
      rotY: 0, rotYVel: 0, rotX: 0, rotXVel: 0,
      scale: 1, scaleVel: 0, posY: 0, posYVel: 0,
      lightX: 5, lightXVel: 0, lightY: 6, lightYVel: 0,
    };
    const mouse = { x: 0, y: 0 };

    const _tmpV = new THREE.Vector3();
    function headerWorldY(): number {
      const ndcY = 1 - 2 * (36 / H);
      _tmpV.set(0, ndcY, 0.5).unproject(camera);
      const dir = _tmpV.sub(camera.position).normalize();
      const t = -camera.position.z / dir.z;
      return camera.position.y + dir.y * t;
    }

    let lastTime = performance.now();
    let clock = 0;
    const ST = 4.0, DM = 5.0, ANIM_END = 0.6;

    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      clock += dt;

      const ss = springDamp(spring.scrollSmooth, scrollRef.current, spring.scrollVel, ST, DM, dt);
      spring.scrollSmooth = ss.value; spring.scrollVel = ss.velocity;

      const animT = Math.min(1, spring.scrollSmooth / ANIM_END);
      const eased = smoothstep(0, 1, animT);

      const ry = springDamp(spring.rotY, eased * Math.PI * 4, spring.rotYVel, ST * 1.5, DM, dt);
      spring.rotY = ry.value; spring.rotYVel = ry.velocity;
      const rx = springDamp(spring.rotX, Math.sin(animT * Math.PI) * 0.06, spring.rotXVel, ST, DM, dt);
      spring.rotX = rx.value; spring.rotXVel = rx.velocity;
      const sc = springDamp(spring.scale, Math.max(0.18, 1 - eased * 0.82), spring.scaleVel, ST, DM, dt);
      spring.scale = sc.value; spring.scaleVel = sc.velocity;
      const py = springDamp(spring.posY, eased * headerWorldY(), spring.posYVel, ST, DM, dt);
      spring.posY = py.value; spring.posYVel = py.velocity;

      if (textGroup) {
        textGroup.rotation.y = spring.rotY;
        textGroup.rotation.x = spring.rotX;
        textGroup.scale.setScalar(spring.scale);
        textGroup.position.y = spring.posY;
        textGroup.position.x = Math.sin(clock * 0.3) * 0.06;
      }

      const lx = springDamp(spring.lightX, 5 + mouse.x * 6, spring.lightXVel, 2, 4, dt);
      spring.lightX = lx.value; spring.lightXVel = lx.velocity;
      const ly = springDamp(spring.lightY, 6 + mouse.y * 4, spring.lightYVel, 2, 4, dt);
      spring.lightY = ly.value; spring.lightYVel = ly.velocity;
      specLight.position.set(spring.lightX, spring.lightY, 14);

      cloudPlanes.forEach((m: any) => {
        m.position.x = (m.userData.baseX as number) + Math.sin(clock * (m.userData.speed as number) * 2) * 3;
      });

      renderer.toneMappingExposure = 1.6 + Math.sin(animT * Math.PI) * 0.15;
      grainPass.uniforms.uTime.value = clock;
      const spd = Math.abs(spring.scrollVel);
      const ca = (mobile ? 0.0006 : 0.001) + Math.min(spd * 0.002, 0.002);
      chromaticPass.uniforms.uOffset.value.set(ca, ca * 0.7);

      composer.render();
    }

    animate();

    const onMouse = (e: MouseEvent) => {
      mouse.x = (e.clientX / W - 0.5) * 2;
      mouse.y = -(e.clientY / H - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouse);

    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloomPass.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    stateRef.current = {
      cleanup: () => {
        window.removeEventListener('mousemove', onMouse);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
      },
    };
  }, []);

  useEffect(() => { scrollRef.current = scrollProgress; }, [scrollProgress]);

  useEffect(() => {
    initScene();
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      stateRef.current?.cleanup?.();
    };
  }, [initScene]);

  return <canvas ref={canvasRef} className="glass-canvas" />;
};

function buildRichSkyEnv(): HTMLCanvasElement {
  const w = 2048, h = 1024;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#0a1535'); g.addColorStop(0.15, '#1a3070');
  g.addColorStop(0.3, '#2a50a0'); g.addColorStop(0.45, '#4080d0');
  g.addColorStop(0.55, '#60a8f0'); g.addColorStop(0.7, '#88ccff');
  g.addColorStop(0.85, '#b8e4ff'); g.addColorStop(1, '#e8f8ff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'screen';
  const sun = ctx.createRadialGradient(w * 0.55, h * 0.22, 0, w * 0.55, h * 0.22, w * 0.35);
  sun.addColorStop(0, 'rgba(255,255,240,0.35)'); sun.addColorStop(0.3, 'rgba(255,248,230,0.15)');
  sun.addColorStop(1, 'rgba(255,235,210,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);

  return c;
}

function buildCloudTextures(THREE: any): any[] {
  const textures: any[] = [];
  for (const seed of [42, 17, 83, 56, 91]) {
    const size = 512;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, size, size);

    let s = seed;
    const rng = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const cx = size / 2, cy = size / 2;

    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + rng() * 0.6;
      const d = (0.1 + rng() * 0.25) * size * 0.35;
      const px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d * 0.5;
      const r = size * 0.08 + rng() * size * 0.1;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
      const b = 248 + Math.floor(rng() * 7);
      grad.addColorStop(0, `rgba(${b},${b},${b+2},${0.35 + rng() * 0.2})`);
      grad.addColorStop(0.5, `rgba(${b-3},${b-2},${b},${0.1 + rng() * 0.06})`);
      grad.addColorStop(1, 'rgba(250,252,255,0)');
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = grad; ctx.fill();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    textures.push(tex);
  }
  return textures;
}

export default GlassScene;
