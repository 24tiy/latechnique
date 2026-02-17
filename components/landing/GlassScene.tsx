'use client';

import React, { useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════
   ULTRA GLASS SCENE
   - TextGeometry with high-quality bevel
   - MeshPhysicalMaterial transmission + refraction render target
   - Head/tail reveal via onBeforeCompile shader injection
   - Post-processing: Bloom + ChromaticAberration + FilmGrain
   - Spring-damped motion (camera-first feel)
   - 3D cloud planes in scene (participate in refraction)
   - Mouse parallax on specular light
   ═══════════════════════════════════════════════════════════ */

interface GlassSceneProps {
  scrollProgress: number;
}

/* ---------- Math helpers ---------- */
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
    renderer.toneMappingExposure = 1.4;
    renderer.setClearColor(0x000000, 0);

    /* ═══════ SCENE / CAMERA ═══════ */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(mobile ? 52 : 38, W / H, 0.1, 300);
    camera.position.set(0, 1.5, 18);
    camera.lookAt(0, 0, 0);

    /* ═══════ HDR ENVIRONMENT — rich sky for reflections ═══════ */
    const envCanvas = buildRichSkyEnv();
    const envTex = new THREE.CanvasTexture(envCanvas);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    envTex.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envMap = pmrem.fromEquirectangular(envTex).texture;
    scene.environment = envMap;
    pmrem.dispose();

    /* ═══════ REFRACTION RENDER TARGET ═══════ */
    const refractionRT = new THREE.WebGLRenderTarget(
      Math.floor(W * dpr * 0.5),
      Math.floor(H * dpr * 0.5),
      { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat }
    );

    /* ═══════ 3D CLOUD PLANES (participate in refraction) ═══════ */
    const cloudGroup = new THREE.Group();
    const cloudTextures = buildCloudTextures(THREE);
    const cloudPlanes: any[] = [];

    const cloudConfigs = [
      { z: -40, y: 8, x: -15, scale: 22, opacity: 0.45, speed: 0.008 },
      { z: -55, y: 4, x: 20, scale: 28, opacity: 0.35, speed: 0.005 },
      { z: -30, y: 12, x: 5, scale: 18, opacity: 0.5, speed: 0.01 },
      { z: -65, y: -2, x: -10, scale: 32, opacity: 0.3, speed: 0.004 },
      { z: -45, y: 6, x: -25, scale: 24, opacity: 0.4, speed: 0.007 },
      { z: -50, y: 10, x: 18, scale: 20, opacity: 0.38, speed: 0.006 },
    ];

    cloudConfigs.forEach((cfg, i) => {
      const tex = cloudTextures[i % cloudTextures.length];
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: cfg.opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending,
      });
      const geo = new THREE.PlaneGeometry(cfg.scale, cfg.scale * 0.5);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cfg.x, cfg.y, cfg.z);
      mesh.userData = { speed: cfg.speed, baseX: cfg.x };
      cloudGroup.add(mesh);
      cloudPlanes.push(mesh);
    });
    scene.add(cloudGroup);

    /* ═══════ LIGHTING — cinematic setup ═══════ */
    scene.add(new THREE.AmbientLight(0xf0f8ff, 1.2));

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
    keyLight.position.set(8, 14, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe8f4ff, 1.5);
    fillLight.position.set(-7, 5, 7);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfff8f0, 2.5);
    rimLight.position.set(0, 6, -12);
    scene.add(rimLight);

    const specLight = new THREE.PointLight(0xffffff, 60, 50);
    specLight.position.set(5, 6, 14);
    scene.add(specLight);

    const bottomRim = new THREE.DirectionalLight(0xaaccff, 1.8);
    bottomRim.position.set(0, -6, 8);
    scene.add(bottomRim);

    // Extra colored accent lights for "cinematic" look
    const accentA = new THREE.PointLight(0x4c96f7, 15, 40);
    accentA.position.set(-10, 3, 5);
    scene.add(accentA);

    const accentB = new THREE.PointLight(0x8b5cf6, 10, 40);
    accentB.position.set(10, -2, 8);
    scene.add(accentB);

    /* ═══════ GLASS MATERIAL — ultra quality ═══════ */
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      transmission: 0.94,
      roughness: 0.02,
      metalness: 0.0,
      ior: 1.45,
      thickness: 1.2,
      envMapIntensity: 5.0,
      specularIntensity: 2.0,
      specularColor: new THREE.Color(0xffffff),
      clearcoat: 1.0,
      clearcoatRoughness: 0.01,
      attenuationColor: new THREE.Color('#e0f0ff'),
      attenuationDistance: 4.0,
      color: new THREE.Color(0xffffff),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.12,
    });

    /* ═══════ HEAD/TAIL REVEAL SHADER INJECTION ═══════ */
    const revealUniforms = {
      uRevealHead: { value: 0.0 },
      uRevealTail: { value: 0.0 },
      uBBoxMin: { value: new THREE.Vector3(-10, -2, -1) },
      uBBoxMax: { value: new THREE.Vector3(10, 2, 1) },
    };

    glassMaterial.onBeforeCompile = (shader: any) => {
      shader.uniforms.uRevealHead = revealUniforms.uRevealHead;
      shader.uniforms.uRevealTail = revealUniforms.uRevealTail;
      shader.uniforms.uBBoxMin = revealUniforms.uBBoxMin;
      shader.uniforms.uBBoxMax = revealUniforms.uBBoxMax;

      // Inject varying into vertex shader
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
         uniform vec3 uBBoxMin;
         uniform vec3 uBBoxMax;
         varying float vProgress;`
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vProgress = (position.x - uBBoxMin.x) / (uBBoxMax.x - uBBoxMin.x);`
      );

      // Inject discard into fragment shader
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
         uniform float uRevealHead;
         uniform float uRevealTail;
         varying float vProgress;`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
         // Soft reveal edges
         float edgeWidth = 0.03;
         float headAlpha = smoothstep(uRevealHead - edgeWidth, uRevealHead, vProgress);
         float tailAlpha = 1.0 - smoothstep(uRevealTail, uRevealTail + edgeWidth, vProgress);

         // Only apply reveal when head < 1 (during writing animation)
         if (uRevealHead < 0.999) {
           gl_FragColor.a *= (1.0 - headAlpha);
         }

         // Dispersion-like color shift at edges (prismatic effect)
         float edge = smoothstep(0.0, edgeWidth * 3.0, abs(vProgress - uRevealHead));
         if (uRevealHead < 0.999 && edge < 1.0) {
           gl_FragColor.rgb += vec3(0.05, 0.02, 0.08) * (1.0 - edge) * gl_FragColor.a;
         }`
      );
    };

    /* ═══════ LOAD FONT + BUILD TEXT ═══════ */
    const fontLoader = new FontLoader();
    let textGroup: any = null;

    const fontUrl = 'https://cdn.jsdelivr.net/npm/three@0.164.0/examples/fonts/droid/droid_serif_bold.typeface.json';

    fontLoader.load(fontUrl, (font: any) => {
      const sz = mobile ? 1.4 : 2.6;
      const depth = mobile ? 0.45 : 0.8;

      const geo = new TextGeometry('LaTechNique', {
        font,
        size: sz,
        height: depth,
        curveSegments: mobile ? 20 : 48,
        bevelEnabled: true,
        bevelThickness: mobile ? 0.18 : 0.35,
        bevelSize: mobile ? 0.15 : 0.28,
        bevelOffset: 0,
        bevelSegments: mobile ? 12 : 24,
      });

      geo.computeBoundingBox();
      const bb = geo.boundingBox!;
      const mesh = new THREE.Mesh(geo, glassMaterial);

      // Center the mesh
      const cx = (bb.max.x - bb.min.x) / 2;
      const cy = (bb.max.y - bb.min.y) / 2;
      const cz = (bb.max.z - bb.min.z) / 2;
      mesh.position.set(-cx - bb.min.x, -cy - bb.min.y, -cz - bb.min.z);

      // Update reveal bbox uniforms
      revealUniforms.uBBoxMin.value.set(bb.min.x, bb.min.y, bb.min.z);
      revealUniforms.uBBoxMax.value.set(bb.max.x, bb.max.y, bb.max.z);

      textGroup = new THREE.Group();
      textGroup.add(mesh);
      mesh.rotation.z = -0.03;
      scene.add(textGroup);
    });

    /* ═══════ POST-PROCESSING ═══════ */
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    renderPass.clearAlpha = 0;
    composer.addPass(renderPass);

    // Bloom — subtle but adds glass glow
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(W, H),
      mobile ? 0.3 : 0.45,  // strength
      0.6,                     // radius
      0.85                     // threshold
    );
    composer.addPass(bloomPass);

    // Chromatic aberration — subtle prismatic edge effect
    const ChromaticAberrationShader = {
      uniforms: {
        tDiffuse: { value: null },
        uOffset: { value: new THREE.Vector2(mobile ? 0.0008 : 0.0012, mobile ? 0.0006 : 0.0008) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 uOffset;
        varying vec2 vUv;
        void main() {
          vec2 dir = vUv - vec2(0.5);
          float dist = length(dir);
          vec2 offset = uOffset * dist;
          float r = texture2D(tDiffuse, vUv + offset).r;
          float g = texture2D(tDiffuse, vUv).g;
          float b = texture2D(tDiffuse, vUv - offset).b;
          float a = texture2D(tDiffuse, vUv).a;
          gl_FragColor = vec4(r, g, b, a);
        }
      `,
    };
    const chromaticPass = new ShaderPass(ChromaticAberrationShader);
    composer.addPass(chromaticPass);

    // Film grain — very subtle for "cinema" feel
    const FilmGrainShader = {
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uIntensity: { value: 0.025 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform float uIntensity;
        varying vec2 vUv;
        float hash(vec2 p) {
          vec3 p3 = fract(vec3(p.xyx) * 0.1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
        }
        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          float grain = hash(vUv * 1000.0 + uTime * 100.0) - 0.5;
          color.rgb += grain * uIntensity;
          gl_FragColor = color;
        }
      `,
    };
    const grainPass = new ShaderPass(FilmGrainShader);
    composer.addPass(grainPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    /* ═══════ SPRING STATE ═══════ */
    const spring = {
      scrollSmooth: 0, scrollVel: 0,
      rotY: 0, rotYVel: 0,
      rotX: 0, rotXVel: 0,
      scale: 1, scaleVel: 0,
      posY: 0, posYVel: 0,
      reveal: 0, revealVel: 0,
      lightX: 5, lightXVel: 0,
      lightY: 6, lightYVel: 0,
    };

    const mouse = { x: 0, y: 0 };

    /* ═══════ HELPER: header world Y ═══════ */
    const _tmpV = new THREE.Vector3();
    function headerWorldY(): number {
      const ndcY = 1 - 2 * (36 / H);
      _tmpV.set(0, ndcY, 0.5).unproject(camera);
      const dir = _tmpV.sub(camera.position).normalize();
      const t = -camera.position.z / dir.z;
      return camera.position.y + dir.y * t;
    }

    /* ═══════ CLOCK ═══════ */
    let lastTime = performance.now();
    let clock = 0;

    /* ═══════ ANIMATION LOOP ═══════ */
    const STIFFNESS = 4.0;
    const DAMPING = 5.0;
    const LIGHT_STIFFNESS = 2.0;
    const LIGHT_DAMPING = 4.0;
    const ANIM_END = 0.6;

    function animate() {
      frameRef.current = requestAnimationFrame(animate);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      clock += dt;

      const targetScroll = scrollRef.current;

      // Spring-damp scroll
      const ss = springDamp(spring.scrollSmooth, targetScroll, spring.scrollVel, STIFFNESS, DAMPING, dt);
      spring.scrollSmooth = ss.value;
      spring.scrollVel = ss.velocity;

      const s = spring.scrollSmooth;
      const animT = Math.min(1, s / ANIM_END);
      const eased = smoothstep(0, 1, animT);

      /* --- Reveal animation (writing effect) --- */
      const revealTarget = Math.min(1, s * 3.0);
      const rv = springDamp(spring.reveal, revealTarget, spring.revealVel, 6.0, 6.0, dt);
      spring.reveal = rv.value;
      spring.revealVel = rv.velocity;

      revealUniforms.uRevealHead.value = 1.0 - Math.max(0, Math.min(1, spring.reveal));

      /* --- Text transform targets --- */
      const targetRotY = eased * Math.PI * 4;
      const targetRotX = Math.sin(animT * Math.PI) * 0.06;
      const targetScale = Math.max(0.18, 1 - eased * 0.82);
      const targetPosY = eased * headerWorldY();

      // Spring-damp rotation
      const ry = springDamp(spring.rotY, targetRotY, spring.rotYVel, STIFFNESS * 1.5, DAMPING, dt);
      spring.rotY = ry.value; spring.rotYVel = ry.velocity;

      const rx = springDamp(spring.rotX, targetRotX, spring.rotXVel, STIFFNESS, DAMPING, dt);
      spring.rotX = rx.value; spring.rotXVel = rx.velocity;

      const sc = springDamp(spring.scale, targetScale, spring.scaleVel, STIFFNESS, DAMPING, dt);
      spring.scale = sc.value; spring.scaleVel = sc.velocity;

      const py = springDamp(spring.posY, targetPosY, spring.posYVel, STIFFNESS, DAMPING, dt);
      spring.posY = py.value; spring.posYVel = py.velocity;

      /* --- Apply to text group --- */
      if (textGroup) {
        textGroup.rotation.y = spring.rotY;
        textGroup.rotation.x = spring.rotX;
        textGroup.scale.setScalar(spring.scale);
        textGroup.position.y = spring.posY;

        // Subtle breathing/drift
        textGroup.position.x = Math.sin(clock * 0.3) * 0.08;
        textGroup.position.z = Math.cos(clock * 0.25) * 0.05;
      }

      /* --- Light follows mouse with spring --- */
      const lxTarget = 5 + mouse.x * 6;
      const lyTarget = 6 + mouse.y * 4;
      const lx = springDamp(spring.lightX, lxTarget, spring.lightXVel, LIGHT_STIFFNESS, LIGHT_DAMPING, dt);
      spring.lightX = lx.value; spring.lightXVel = lx.velocity;
      const ly = springDamp(spring.lightY, lyTarget, spring.lightYVel, LIGHT_STIFFNESS, LIGHT_DAMPING, dt);
      spring.lightY = ly.value; spring.lightYVel = ly.velocity;

      specLight.position.x = spring.lightX;
      specLight.position.y = spring.lightY;

      /* --- Animate clouds --- */
      cloudPlanes.forEach((mesh: any) => {
        const spd = mesh.userData.speed as number;
        mesh.position.x = (mesh.userData.baseX as number) + Math.sin(clock * spd * 2) * 3;
        mesh.position.y += Math.sin(clock * spd * 3 + mesh.id) * 0.001;
      });

      /* --- Dynamic tone mapping exposure --- */
      renderer.toneMappingExposure = 1.4 + Math.sin(animT * Math.PI) * 0.2;

      /* --- Update film grain time --- */
      grainPass.uniforms.uTime.value = clock;

      /* --- Chromatic aberration intensifies at speed --- */
      const scrollSpeed = Math.abs(spring.scrollVel);
      const caStrength = mobile ? 0.0008 : 0.0012;
      const caBoost = Math.min(scrollSpeed * 0.003, 0.003);
      chromaticPass.uniforms.uOffset.value.set(caStrength + caBoost, (caStrength + caBoost) * 0.7);

      /* --- Render --- */
      composer.render();
    }

    animate();

    /* ═══════ EVENTS ═══════ */
    const onMouse = (e: MouseEvent) => {
      mouse.x = (e.clientX / W - 0.5) * 2;
      mouse.y = -(e.clientY / H - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouse);

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloomPass.setSize(w, h);
      refractionRT.setSize(Math.floor(w * dpr * 0.5), Math.floor(h * dpr * 0.5));
    };
    window.addEventListener('resize', onResize);

    /* ═══════ STORE STATE FOR CLEANUP ═══════ */
    stateRef.current = {
      renderer, scene, camera, composer, textGroup,
      cleanup: () => {
        window.removeEventListener('mousemove', onMouse);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
        refractionRT.dispose();
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

/* ═══════════════════════════════════════════════════════════
   RICH SKY ENVIRONMENT MAP
   ═══════════════════════════════════════════════════════════ */

function buildRichSkyEnv(): HTMLCanvasElement {
  const w = 2048, h = 1024;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0.0, '#0a1535');
  g.addColorStop(0.1, '#1a2a5c');
  g.addColorStop(0.2, '#2a4080');
  g.addColorStop(0.3, '#3558a8');
  g.addColorStop(0.4, '#4a78cc');
  g.addColorStop(0.5, '#5f95e4');
  g.addColorStop(0.6, '#78b2f0');
  g.addColorStop(0.7, '#95ccfa');
  g.addColorStop(0.8, '#b0e0ff');
  g.addColorStop(0.9, '#d0f0ff');
  g.addColorStop(1.0, '#f0f8ff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'screen';
  const sun = ctx.createRadialGradient(w * 0.55, h * 0.25, 0, w * 0.55, h * 0.25, w * 0.35);
  sun.addColorStop(0, 'rgba(255, 255, 240, 0.3)');
  sun.addColorStop(0.3, 'rgba(255, 248, 230, 0.12)');
  sun.addColorStop(0.7, 'rgba(255, 240, 220, 0.03)');
  sun.addColorStop(1, 'rgba(255, 235, 210, 0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);

  const warm = ctx.createRadialGradient(w * 0.3, h * 0.35, 0, w * 0.3, h * 0.35, w * 0.25);
  warm.addColorStop(0, 'rgba(255, 220, 180, 0.08)');
  warm.addColorStop(1, 'rgba(255, 220, 180, 0)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, w, h);

  return c;
}

/* ═══════════════════════════════════════════════════════════
   PROCEDURAL CLOUD TEXTURES (for 3D planes)
   ═══════════════════════════════════════════════════════════ */

function buildCloudTextures(THREE: any): any[] {
  const textures: any[] = [];
  const seeds = [42, 17, 83, 56, 91, 29];

  for (const seed of seeds) {
    const size = 512;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d')!;

    ctx.clearRect(0, 0, size, size);

    let s = seed;
    const rng = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

    const cx = size / 2;
    const cy = size / 2;
    const numPuffs = 30 + Math.floor(rng() * 25);

    for (let i = 0; i < numPuffs; i++) {
      const angle = (i / numPuffs) * Math.PI * 2 + rng() * 0.6;
      const dist = (0.15 + rng() * 0.3) * size * 0.35;
      const px = cx + Math.cos(angle) * dist + (rng() - 0.5) * size * 0.05;
      const py = cy + Math.sin(angle) * dist * 0.55 + (rng() - 0.5) * size * 0.03;
      const r = size * 0.1 + rng() * size * 0.15;

      const grad = ctx.createRadialGradient(px, py - r * 0.1, 0, px, py, r);
      const b = 248 + Math.floor(rng() * 7);
      grad.addColorStop(0, `rgba(${b}, ${b}, ${Math.min(255, b + 3)}, ${0.55 + rng() * 0.3})`);
      grad.addColorStop(0.5, `rgba(${b - 3}, ${b - 2}, ${b}, ${0.2 + rng() * 0.1})`);
      grad.addColorStop(1, 'rgba(250, 252, 255, 0)');

      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    for (let i = 0; i < 8; i++) {
      const px = cx + (rng() - 0.5) * size * 0.15;
      const py = cy - size * 0.08 + (rng() - 0.5) * size * 0.05;
      const r = size * 0.05 + rng() * size * 0.08;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
      grad.addColorStop(0, `rgba(255, 255, 255, ${0.3 + rng() * 0.2})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    textures.push(tex);
  }

  return textures;
}

export default GlassScene;
