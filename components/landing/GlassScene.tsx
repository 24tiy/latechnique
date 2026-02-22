'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface GlassSceneProps {
  scrollProgress: number;
}

function springDamp(
  current: number,
  target: number,
  velocity: number,
  stiffness: number,
  damping: number,
  dt: number
) {
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
    const { OutputPass } = await import(
      'three/examples/jsm/postprocessing/OutputPass.js'
    );
    const { SVGLoader } = await import(
      'three/examples/jsm/loaders/SVGLoader.js'
    );

    const canvas = canvasRef.current;
    const mobile = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio, mobile ? 1.5 : 2);
    const W = window.innerWidth;
    const H = window.innerHeight;

    /* ═══════ RENDERER — opaque white background ═══════ */
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setClearColor(0xfafafa, 1); // white background

    /* ═══════ SCENE / CAMERA ═══════ */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfafafa); // ensures transmission works on white
    const fov = mobile ? 55 : 42;
    const camera = new THREE.PerspectiveCamera(fov, W / H, 0.1, 300);
    camera.position.set(0, 0.5, 18);
    camera.lookAt(0, 0, 0);

    /* ═══════ BRIGHT STUDIO ENVIRONMENT ═══════ */
    const envCanvas = buildBrightStudioEnv();
    const envTex = new THREE.CanvasTexture(envCanvas);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    envTex.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envMap = pmrem.fromEquirectangular(envTex).texture;
    scene.environment = envMap;
    pmrem.dispose();

    /* ═══════ LIGHTING ═══════ */
    scene.add(new THREE.AmbientLight(0xf0f6ff, 2.5));

    // Key light — bright, crisp from upper right
    const keyLight = new THREE.DirectionalLight(0xffffff, 5.0);
    keyLight.position.set(8, 14, 12);
    scene.add(keyLight);

    // Cool fill from the left
    const fillLight = new THREE.DirectionalLight(0xc8e0f8, 3.0);
    fillLight.position.set(-10, 4, 8);
    scene.add(fillLight);

    // Warm back rim
    const rimLight = new THREE.DirectionalLight(0xfff0e0, 4.5);
    rimLight.position.set(0, 6, -15);
    scene.add(rimLight);

    // Strong specular point
    const specLight = new THREE.PointLight(0xffffff, 120, 60);
    specLight.position.set(5, 8, 14);
    scene.add(specLight);

    // Bottom fill to lighten underside
    const bottomFill = new THREE.DirectionalLight(0xe8f0ff, 2.0);
    bottomFill.position.set(0, -10, 8);
    scene.add(bottomFill);

    // Blue accent
    const accentBlue = new THREE.PointLight(0x4c96f7, 25, 40);
    accentBlue.position.set(-14, 3, 5);
    scene.add(accentBlue);

    /* ═══════ ICE-GLASS MATERIAL ═══════ */
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      transmission: 0.75,
      roughness: 0.02,
      metalness: 0.0,
      ior: 1.55,
      thickness: 3.5,
      envMapIntensity: 5.0,
      specularIntensity: 3.0,
      specularColor: new THREE.Color(0xffffff),
      clearcoat: 1.0,
      clearcoatRoughness: 0.01,
      attenuationColor: new THREE.Color('#a8d0f0'), // cool ice-blue tint
      attenuationDistance: 2.5,
      color: new THREE.Color(0xeef6ff),
      side: THREE.DoubleSide,
    });

    /* ═══════ LOAD HANDWRITTEN FONT via opentype.js ═══════ */
    let textGroup: any = null;

    try {
      const opentype = await import('opentype.js');

      // Pacifico — bold cursive script, thick enough for 3D extrusion
      const fontUrl =
        'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/pacifico/Pacifico-Regular.ttf';

      const response = await fetch(fontUrl);
      if (!response.ok) throw new Error(`Font fetch failed: ${response.status}`);
      const buffer = await response.arrayBuffer();
      const font = (opentype as any).parse(buffer);

      // Get text path in opentype units
      const TEXT = 'LaTechNique';
      const FONT_SIZE = 80;
      const fontPath = font.getPath(TEXT, 0, 0, FONT_SIZE);
      const bb = fontPath.getBoundingBox();

      // Convert to SVG path string
      const pathData = fontPath.toPathData(3);

      // Parse with SVGLoader
      const svgLoader = new SVGLoader();
      const svgData = svgLoader.parse(
        `<svg xmlns="http://www.w3.org/2000/svg"><path d="${pathData}"/></svg>`
      );

      // Collect Three.js shapes from SVG paths
      const allShapes: any[] = [];
      for (const shapePath of svgData.paths) {
        const shapes = SVGLoader.createShapes(shapePath);
        allShapes.push(...shapes);
      }

      if (allShapes.length === 0) throw new Error('No shapes from SVG');

      // Extrude shapes into 3D
      const extrudeSettings = {
        depth: mobile ? 12 : 18,
        bevelEnabled: true,
        bevelThickness: mobile ? 3 : 5,
        bevelSize: mobile ? 2 : 3.5,
        bevelSegments: mobile ? 6 : 12,
        curveSegments: mobile ? 12 : 24,
      };

      const geometry = new THREE.ExtrudeGeometry(allShapes, extrudeSettings);

      // Compute bounding box of the raw geometry
      geometry.computeBoundingBox();
      const gbb = geometry.boundingBox!;
      const geoWidth = gbb.max.x - gbb.min.x;
      const geoHeight = gbb.max.y - gbb.min.y;

      // Auto-scale to fill ~78% of visible viewport width
      const fovRad = (fov * Math.PI) / 180;
      const visibleWidth = 2 * camera.position.z * Math.tan(fovRad / 2);
      const targetWidth = visibleWidth * (mobile ? 0.85 : 0.78);
      const scale = targetWidth / geoWidth;

      const textMesh = new THREE.Mesh(geometry, glassMaterial);

      // Center geometry — SVG is y-down, Three.js is y-up → flip y via scale
      const cx = (gbb.max.x + gbb.min.x) / 2;
      const cy = (gbb.max.y + gbb.min.y) / 2;

      // Apply scale with y-flip (scale.y negative = SVG→3D flip)
      textMesh.scale.set(scale, -scale, scale);

      // Offset to center after scale + y-flip
      textMesh.position.set(
        -cx * scale,
        cy * scale,   // positive because y was flipped
        0
      );

      textGroup = new THREE.Group();
      textGroup.add(textMesh);
      scene.add(textGroup);

    } catch (err) {
      console.warn('Handwritten font failed, using fallback serif:', err);

      // Fallback: Three.js built-in FontLoader
      try {
        const { FontLoader } = await import(
          'three/examples/jsm/loaders/FontLoader.js'
        );
        const { TextGeometry } = await import(
          'three/examples/jsm/geometries/TextGeometry.js'
        );
        const fontLoader = new FontLoader();
        const fontUrl =
          'https://cdn.jsdelivr.net/npm/three@0.164.0/examples/fonts/droid/droid_serif_bold.typeface.json';
        fontLoader.load(fontUrl, (font: any) => {
          const sz = mobile ? 0.9 : 1.2;
          const geo = new TextGeometry('LaTechNique', {
            font,
            size: sz,
            height: mobile ? 0.3 : 0.5,
            curveSegments: 24,
            bevelEnabled: true,
            bevelThickness: 0.15,
            bevelSize: 0.12,
            bevelSegments: 8,
          });
          geo.computeBoundingBox();
          const bb2 = geo.boundingBox!;
          const mesh2 = new THREE.Mesh(geo, glassMaterial);
          mesh2.position.set(
            -(bb2.max.x + bb2.min.x) / 2,
            -(bb2.max.y + bb2.min.y) / 2,
            0
          );
          textGroup = new THREE.Group();
          textGroup.add(mesh2);
          scene.add(textGroup);
        });
      } catch (_) {
        // silent failure
      }
    }

    /* ═══════ POST-PROCESSING ═══════ */
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Subtle bloom — reduced significantly for white background
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(W, H),
      mobile ? 0.06 : 0.10, // very subtle
      0.5,
      0.92
    );
    composer.addPass(bloomPass);

    // Subtle chromatic aberration
    const ChromaticAberrationShader = {
      uniforms: {
        tDiffuse: { value: null },
        uOffset: { value: new THREE.Vector2(0.0008, 0.0006) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
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
          gl_FragColor = vec4(r, g, b, 1.0);
        }
      `,
    };
    const chromaticPass = new ShaderPass(ChromaticAberrationShader);
    composer.addPass(chromaticPass);

    // Subtle film grain
    const FilmGrainShader = {
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uIntensity: { value: 0.012 },
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
          color.rgb += (hash(vUv * 800.0 + uTime * 80.0) - 0.5) * uIntensity;
          gl_FragColor = color;
        }
      `,
    };
    const grainPass = new ShaderPass(FilmGrainShader);
    composer.addPass(grainPass);
    composer.addPass(new OutputPass());

    /* ═══════ SPRING STATE ═══════ */
    const spring = {
      scrollSmooth: 0, scrollVel: 0,
      rotY: 0, rotYVel: 0,
      rotX: 0, rotXVel: 0,
      scale: 1, scaleVel: 0,
      posY: 0, posYVel: 0,
      lightX: 5, lightXVel: 0,
      lightY: 8, lightYVel: 0,
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
    const ST = 4.0;
    const DM = 5.0;
    const ANIM_END = 0.6;

    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      clock += dt;

      const ss = springDamp(spring.scrollSmooth, scrollRef.current, spring.scrollVel, ST, DM, dt);
      spring.scrollSmooth = ss.value;
      spring.scrollVel = ss.velocity;

      const animT = Math.min(1, spring.scrollSmooth / ANIM_END);
      const eased = smoothstep(0, 1, animT);

      const ry = springDamp(spring.rotY, eased * Math.PI * 4, spring.rotYVel, ST * 1.5, DM, dt);
      spring.rotY = ry.value; spring.rotYVel = ry.velocity;

      const rx = springDamp(spring.rotX, Math.sin(animT * Math.PI) * 0.05, spring.rotXVel, ST, DM, dt);
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
        // Gentle floating
        textGroup.position.x = Math.sin(clock * 0.28) * 0.04;
      }

      // Light follows mouse
      const lx = springDamp(spring.lightX, 5 + mouse.x * 7, spring.lightXVel, 2, 4, dt);
      spring.lightX = lx.value; spring.lightXVel = lx.velocity;
      const ly = springDamp(spring.lightY, 8 + mouse.y * 5, spring.lightYVel, 2, 4, dt);
      spring.lightY = ly.value; spring.lightYVel = ly.velocity;
      specLight.position.set(spring.lightX, spring.lightY, 14);

      // Exposure stays stable on white background
      renderer.toneMappingExposure = 1.2 + Math.sin(animT * Math.PI) * 0.08;

      grainPass.uniforms.uTime.value = clock;

      // Subtle chromatic aberration based on scroll speed
      const spd = Math.abs(spring.scrollVel);
      const ca = 0.0006 + Math.min(spd * 0.0015, 0.0018);
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
      const w = window.innerWidth;
      const h = window.innerHeight;
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

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    initScene();
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      stateRef.current?.cleanup?.();
    };
  }, [initScene]);

  return <canvas ref={canvasRef} className="glass-canvas" />;
};

/* ─────────────────────────────────────────────────────────────────
   Bright studio environment for glass on white background.
   Creates cool sky reflections in the ice-blue glass.
───────────────────────────────────────────────────────────────── */
function buildBrightStudioEnv(): HTMLCanvasElement {
  const w = 2048;
  const h = 1024;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;

  // Soft studio gradient — bright blue sky into white floor
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0.0, '#7ab8e8');   // sky blue zenith
  g.addColorStop(0.15, '#9ccbf0');  // mid sky
  g.addColorStop(0.30, '#bdddf8');  // light blue
  g.addColorStop(0.45, '#d8eef9');  // very pale blue
  g.addColorStop(0.55, '#eef6fd');  // near white horizon
  g.addColorStop(0.65, '#f8fbfe');  // white
  g.addColorStop(0.80, '#f5f5f5');  // light gray floor
  g.addColorStop(1.00, '#e8e8e8');  // slightly darker ground
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Bright sun area — upper right
  const sun = ctx.createRadialGradient(w * 0.65, h * 0.12, 0, w * 0.65, h * 0.12, w * 0.4);
  sun.addColorStop(0.0, 'rgba(255, 252, 240, 0.95)');
  sun.addColorStop(0.15, 'rgba(255, 248, 225, 0.55)');
  sun.addColorStop(0.40, 'rgba(255, 240, 210, 0.2)');
  sun.addColorStop(1.0, 'rgba(255, 235, 200, 0)');
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);

  // Secondary cool light source — left side
  const leftGlow = ctx.createRadialGradient(w * 0.1, h * 0.3, 0, w * 0.1, h * 0.3, w * 0.35);
  leftGlow.addColorStop(0.0, 'rgba(200, 225, 255, 0.4)');
  leftGlow.addColorStop(1.0, 'rgba(180, 210, 255, 0)');
  ctx.fillStyle = leftGlow;
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'source-over';

  return c;
}

export default GlassScene;
