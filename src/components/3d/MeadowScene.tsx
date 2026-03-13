import { useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Suspense } from 'react';

/* ═══════════════════════════════════════════════════════
   RESPONSIVE HELPER
   ═══════════════════════════════════════════════════════ */
function getDeviceTier(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1200) return 'tablet';
  return 'desktop';
}

/* ═══════════════════════════════════════════════════════
   TUNABLE PARAMETERS
   ═══════════════════════════════════════════════════════ */
function getCfg() {
  const tier = getDeviceTier();

  const densityMult = tier === 'mobile' ? 0.3 : tier === 'tablet' ? 0.6 : 1.0;

  return {
    grassLayers: [
      {
        bladeCount: Math.floor(3000 * densityMult),
        fieldWidth: 28,
        fieldDepthMin: -1.0,
        fieldDepthMax: 3.0,
        heightMin: 0.4,
        heightMax: 1.1,
        bladeWidth: 0.018,
        colorBase: new THREE.Color('#2e6b28'),
        colorMid: new THREE.Color('#4a8e3e'),
        colorTip: new THREE.Color('#8cc46a'),
        colorDark: new THREE.Color('#1a3e16'),
        windMult: 1.0,
        yOffset: -0.6,
      },
      {
        bladeCount: Math.floor(2200 * densityMult),
        fieldWidth: 30,
        fieldDepthMin: -3.5,
        fieldDepthMax: -1.0,
        heightMin: 0.3,
        heightMax: 0.8,
        bladeWidth: 0.015,
        colorBase: new THREE.Color('#3a7832'),
        colorMid: new THREE.Color('#5c9e4c'),
        colorTip: new THREE.Color('#9aca78'),
        colorDark: new THREE.Color('#234a1c'),
        windMult: 0.8,
        yOffset: -0.6,
      },
      {
        bladeCount: Math.floor(1500 * densityMult),
        fieldWidth: 34,
        fieldDepthMin: -7.0,
        fieldDepthMax: -3.5,
        heightMin: 0.2,
        heightMax: 0.55,
        bladeWidth: 0.012,
        colorBase: new THREE.Color('#4a8640'),
        colorMid: new THREE.Color('#6eaa5e'),
        colorTip: new THREE.Color('#a8c890'),
        colorDark: new THREE.Color('#305828'),
        windMult: 0.6,
        yOffset: -0.6,
      },
    ],

    windStrength: 0.8,
    windSpeed: 0.6,
    gustInterval: 7.0,
    gustDuration: 3.0,

    mushroomMaxCount: tier === 'mobile' ? 3 : 5,
    mushroomSpawnInterval: 4.0,
    mushroomGrowDuration: 2.5,
    mushroomVisibleDuration: 6.0,
    mushroomShrinkDuration: 3.0,

    butterflyCount: tier === 'mobile' ? 1 : tier === 'tablet' ? 2 : 3,
    butterflySpeed: 0.3,
    butterflyWingFlapSpeed: 5.0,
    butterflyInfluenceRadius: 1.5,
    butterflyInfluenceStrength: 0.4,

    particleCount: tier === 'mobile' ? 20 : tier === 'tablet' ? 35 : 50,
    particleSpeed: 0.05,
    particleSpread: { x: 20, y: 3.5, z: 8 },

    fogColor: new THREE.Color('#7ab882'),
    fogNear: 5,
    fogFar: 14,
    groundColor: '#2a5c22',
  };
}

/* ═══════════════════════════════════════════════════════
   GRASS SHADERS
   ═══════════════════════════════════════════════════════ */
const grassVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uWindStrength;
  uniform float uWindSpeed;
  uniform float uWindMult;
  uniform float uGustPhase;
  uniform vec2 uGustCenter;
  uniform vec3 uButterflies[3];
  uniform float uButterflyRadius;
  uniform float uButterflyPush;

  varying vec2 vUv;
  varying float vHeight;
  varying float vAO;

  vec3 mod289v(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289v2(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permutev(vec3 x) { return mod289v(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289v2(i);
    vec3 p = permutev(permutev(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  vec2 butterflyPush(vec3 worldPos, vec3 bPos) {
    vec2 delta = worldPos.xz - bPos.xz;
    float dist = length(delta);
    if (dist > uButterflyRadius || dist < 0.01) return vec2(0.0);
    float influence = (1.0 - dist / uButterflyRadius);
    influence = influence * influence * uButterflyPush;
    float yFade = 1.0 - smoothstep(0.0, 1.2, abs(worldPos.y - bPos.y));
    return normalize(delta) * influence * max(yFade, 0.0);
  }

  void main() {
    vUv = uv;
    vHeight = uv.y;

    vec3 pos = position;

    // Quadratic bend factor — bottom stable, tip bends most
    float bendFactor = uv.y * uv.y;

    // Multi-layer wind
    float t = uTime * uWindSpeed;
    float w1 = snoise(vec2(pos.x * 0.2 + t * 0.5, pos.z * 0.2 + t * 0.15)) * 0.55;
    float w2 = snoise(vec2(pos.x * 0.5 + t * 0.9, pos.z * 0.35 + t * 0.3)) * 0.25;
    float w3 = snoise(vec2(pos.x * 1.2 + t * 1.8, pos.z * 0.8 + t * 0.08)) * 0.12;

    float totalWind = (w1 + w2 + w3) * uWindStrength * uWindMult;

    // Gust wave
    float gustDist = length(pos.xz - uGustCenter);
    float gustWave = smoothstep(10.0, 0.0, gustDist) * uGustPhase;
    totalWind += gustWave * uWindStrength * 1.5;

    // Apply bend
    pos.x += totalWind * bendFactor;
    pos.z += totalWind * bendFactor * 0.2;
    pos.y -= abs(totalWind) * bendFactor * 0.08;

    // Butterfly disturbance
    vec2 bPush = vec2(0.0);
    for (int i = 0; i < 3; i++) {
      bPush += butterflyPush(pos, uButterflies[i]);
    }
    pos.x += bPush.x * bendFactor;
    pos.z += bPush.y * bendFactor;

    vAO = smoothstep(0.0, 0.3, uv.y);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const grassFragmentShader = /* glsl */ `
  varying vec2 vUv;
  varying float vHeight;
  varying float vAO;

  uniform vec3 uColorBase;
  uniform vec3 uColorMid;
  uniform vec3 uColorTip;
  uniform vec3 uColorDark;
  uniform float uTime;

  void main() {
    // Natural gradient: dark base → green → bright tip
    vec3 color = mix(uColorDark, uColorBase, smoothstep(0.0, 0.15, vHeight));
    color = mix(color, uColorMid, smoothstep(0.15, 0.5, vHeight));
    color = mix(color, uColorTip, smoothstep(0.5, 1.0, vHeight));

    // AO darken at roots
    color *= mix(0.35, 1.0, vAO);

    // Very subtle tip shimmer
    float shimmer = sin(vUv.x * 50.0 + uTime * 0.3) * 0.015 + 0.015;
    color += shimmer * smoothstep(0.65, 1.0, vHeight);

    // Soft tip transparency for natural look
    float alpha = mix(1.0, 0.75, smoothstep(0.8, 1.0, vHeight));

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════
   GRASS BLADE GEOMETRY — thin, curved, tapered
   ═══════════════════════════════════════════════════════ */
function createBladeGeometry(bladeWidth: number): THREE.BufferGeometry {
  const segments = 6;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Strong taper: full width at base, nearly 0 at tip
    const width = bladeWidth * (1 - t * 0.92);
    // Slight natural curve forward
    const curve = t * t * t * 0.06;
    // Slight S-curve for realism
    const sCurve = Math.sin(t * Math.PI) * 0.008;

    vertices.push(-width + curve + sCurve, t, 0);
    vertices.push(width + curve + sCurve, t, 0);
    uvs.push(0, t);
    uvs.push(1, t);

    if (i < segments) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/* ═══════════════════════════════════════════════════════
   SHARED STATE
   ═══════════════════════════════════════════════════════ */
const butterflyPositions = [
  new THREE.Vector3(999, 999, 999),
  new THREE.Vector3(999, 999, 999),
  new THREE.Vector3(999, 999, 999),
];

const gustState = {
  phase: 0,
  timer: 0,
  active: false,
  center: new THREE.Vector2(0, -2),
};

/* ═══════════════════════════════════════════════════════
   GRASS LAYER
   ═══════════════════════════════════════════════════════ */
function GrassLayer({ layerConfig }: { layerConfig: ReturnType<typeof getCfg>['grassLayers'][0] }) {
  const layer = layerConfig;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const cfg = useMemo(() => getCfg(), []);

  const bladeGeo = useMemo(() => createBladeGeometry(layer.bladeWidth), [layer.bladeWidth]);

  const shaderMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: grassVertexShader,
    fragmentShader: grassFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uWindStrength: { value: cfg.windStrength },
      uWindSpeed: { value: cfg.windSpeed },
      uWindMult: { value: layer.windMult },
      uGustPhase: { value: 0 },
      uGustCenter: { value: new THREE.Vector2(0, -2) },
      uButterflies: { value: [
        new THREE.Vector3(999, 999, 999),
        new THREE.Vector3(999, 999, 999),
        new THREE.Vector3(999, 999, 999),
      ]},
      uButterflyRadius: { value: cfg.butterflyInfluenceRadius },
      uButterflyPush: { value: cfg.butterflyInfluenceStrength },
      uColorBase: { value: layer.colorBase },
      uColorMid: { value: layer.colorMid },
      uColorTip: { value: layer.colorTip },
      uColorDark: { value: layer.colorDark },
    },
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: true,
  }), [layer, cfg]);

  const initialized = useRef(false);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    if (!initialized.current) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < layer.bladeCount; i++) {
        const x = (Math.random() - 0.5) * layer.fieldWidth;
        const z = layer.fieldDepthMin + Math.random() * (layer.fieldDepthMax - layer.fieldDepthMin);
        const height = layer.heightMin + Math.random() * (layer.heightMax - layer.heightMin);
        const rotY = Math.random() * Math.PI;
        const lean = (Math.random() - 0.5) * 0.2;
        const widthScale = 0.7 + Math.random() * 0.6;

        dummy.position.set(x, layer.yOffset, z);
        dummy.rotation.set(lean, rotY, 0);
        dummy.scale.set(widthScale, height, 1);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      initialized.current = true;
    }

    const u = shaderMat.uniforms;
    u.uTime.value = clock.elapsedTime;
    u.uGustPhase.value = gustState.phase;
    u.uGustCenter.value.copy(gustState.center);
    u.uButterflies.value[0].copy(butterflyPositions[0]);
    u.uButterflies.value[1].copy(butterflyPositions[1]);
    u.uButterflies.value[2].copy(butterflyPositions[2]);
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[bladeGeo, shaderMat, layer.bladeCount]}
      frustumCulled={false}
    />
  );
}

/* ═══════════════════════════════════════════════════════
   WIND GUST CONTROLLER
   ═══════════════════════════════════════════════════════ */
function WindGustController() {
  const cfg = useMemo(() => getCfg(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    gustState.timer += dt;

    if (!gustState.active) {
      if (gustState.timer >= cfg.gustInterval) {
        gustState.active = true;
        gustState.timer = 0;
        gustState.center.set(
          (Math.random() - 0.5) * 16,
          -Math.random() * 5 - 1
        );
      }
    } else {
      const t = gustState.timer / cfg.gustDuration;
      if (t >= 1) {
        gustState.active = false;
        gustState.phase = 0;
        gustState.timer = Math.random() * 2;
      } else {
        gustState.phase = Math.sin(t * Math.PI) * 0.7;
      }
    }
  });
  return null;
}

/* ═══════════════════════════════════════════════════════
   MUSHROOM SYSTEM
   ═══════════════════════════════════════════════════════ */
interface MushroomState {
  position: THREE.Vector3;
  phase: 'growing' | 'visible' | 'shrinking' | 'dormant';
  timer: number;
  maxScale: number;
  currentScale: number;
  colorIdx: number;
}

function MushroomSystem() {
  const groupRef = useRef<THREE.Group>(null);
  const mushrooms = useRef<MushroomState[]>([]);
  const cfg = useMemo(() => getCfg(), []);

  const { capGeo, stemGeo, dotGeo } = useMemo(() => {
    const cap = new THREE.SphereGeometry(0.08, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const stem = new THREE.CylinderGeometry(0.018, 0.025, 0.09, 6);
    stem.translate(0, 0.045, 0);
    const dot = new THREE.SphereGeometry(0.012, 4, 4);
    return { capGeo: cap, stemGeo: stem, dotGeo: dot };
  }, []);

  const capMats = useMemo(() => [
    new THREE.MeshLambertMaterial({ color: '#c04040' }),
    new THREE.MeshLambertMaterial({ color: '#b86830' }),
    new THREE.MeshLambertMaterial({ color: '#d4a838' }),
  ], []);
  const stemMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#f0ead8' }), []);
  const dotMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#f5f0e8' }), []);

  useEffect(() => {
    if (!groupRef.current) return;

    const pool: MushroomState[] = [];
    for (let i = 0; i < cfg.mushroomMaxCount; i++) {
      const halfW = cfg.grassLayers[0].fieldWidth * 0.35;
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * halfW * 2,
        cfg.grassLayers[0].yOffset,
        -Math.random() * 2.5 - 0.3
      );

      const colorIdx = Math.floor(Math.random() * 3);
      pool.push({
        position: pos,
        phase: 'dormant',
        timer: Math.random() * cfg.mushroomSpawnInterval,
        maxScale: 0.5 + Math.random() * 0.5,
        currentScale: 0,
        colorIdx,
      });

      const mGroup = new THREE.Group();
      mGroup.position.copy(pos);
      mGroup.scale.setScalar(0);

      // Stem
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      mGroup.add(stemMesh);

      // Cap
      const capMesh = new THREE.Mesh(capGeo, capMats[colorIdx]);
      capMesh.position.y = 0.09;
      mGroup.add(capMesh);

      // White dots on cap
      for (let d = 0; d < 5; d++) {
        const theta = (d / 5) * Math.PI * 2 + Math.random() * 0.5;
        const phi = 0.2 + Math.random() * 0.3;
        const r = 0.065;
        const dotMesh = new THREE.Mesh(dotGeo, dotMat);
        dotMesh.position.set(
          Math.sin(theta) * Math.sin(phi) * r,
          0.09 + Math.cos(phi) * r * 0.7,
          Math.cos(theta) * Math.sin(phi) * r
        );
        dotMesh.scale.setScalar(0.5 + Math.random() * 0.5);
        mGroup.add(dotMesh);
      }

      groupRef.current.add(mGroup);
    }

    mushrooms.current = pool;
  }, [capGeo, stemGeo, dotGeo, capMats, stemMat, dotMat, cfg]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);

    mushrooms.current.forEach((m, i) => {
      const mGroup = groupRef.current!.children[i] as THREE.Group;
      if (!mGroup) return;

      m.timer += dt;

      switch (m.phase) {
        case 'dormant':
          if (m.timer >= cfg.mushroomSpawnInterval) {
            m.phase = 'growing';
            m.timer = 0;
            m.position.x = (Math.random() - 0.5) * cfg.grassLayers[0].fieldWidth * 0.7;
            m.position.z = -Math.random() * 2.5 - 0.3;
            mGroup.position.copy(m.position);
          }
          break;

        case 'growing': {
          const t = Math.min(m.timer / cfg.mushroomGrowDuration, 1);
          // Elastic ease out for charming pop
          const elastic = 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 1.5) * (1 - t);
          m.currentScale = Math.max(0, elastic * m.maxScale);
          mGroup.scale.setScalar(m.currentScale);
          if (t >= 1) { m.phase = 'visible'; m.timer = 0; }
          break;
        }

        case 'visible':
          // Gentle sway
          mGroup.rotation.z = Math.sin(clock.elapsedTime * 0.8 + i * 2.5) * 0.03;
          if (m.timer >= cfg.mushroomVisibleDuration) { m.phase = 'shrinking'; m.timer = 0; }
          break;

        case 'shrinking': {
          const t = Math.min(m.timer / cfg.mushroomShrinkDuration, 1);
          // Smooth sink
          const ease = 1 - t * t;
          m.currentScale = ease * m.maxScale;
          mGroup.scale.setScalar(Math.max(0, m.currentScale));
          mGroup.position.y = m.position.y - t * 0.06;
          if (t >= 1) {
            m.phase = 'dormant';
            m.timer = Math.random() * cfg.mushroomSpawnInterval * 0.5;
            mGroup.scale.setScalar(0);
            mGroup.position.y = m.position.y;
          }
          break;
        }
      }
    });
  });

  return <group ref={groupRef} />;
}

/* ═══════════════════════════════════════════════════════
   BUTTERFLY SYSTEM
   ═══════════════════════════════════════════════════════ */
interface ButterflyState {
  t: number;
  pathSpeed: number;
  pathPoints: THREE.Vector3[];
  wingPhase: number;
  size: number;
}

function ButterflySystem() {
  const groupRef = useRef<THREE.Group>(null);
  const butterflies = useRef<ButterflyState[]>([]);
  const cfg = useMemo(() => getCfg(), []);

  const wingGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.06, 0.08, 0.12, 0.18, 0.07, 0.28);
    shape.bezierCurveTo(0.04, 0.22, 0.01, 0.15, 0, 0.08);
    shape.bezierCurveTo(-0.01, 0.15, -0.04, 0.22, -0.07, 0.28);
    shape.bezierCurveTo(-0.12, 0.18, -0.06, 0.08, 0, 0);
    return new THREE.ShapeGeometry(shape, 4);
  }, []);

  const butterflyColors = useMemo(() => [
    new THREE.Color('#7abce0'),
    new THREE.Color('#daa080'),
    new THREE.Color('#c8a0d8'),
  ], []);

  const generatePath = useCallback((): THREE.Vector3[] => {
    const halfW = cfg.grassLayers[0].fieldWidth * 0.3;
    const yBase = cfg.grassLayers[0].yOffset;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < 6; i++) {
      points.push(new THREE.Vector3(
        (Math.random() - 0.5) * halfW * 2,
        yBase + 0.5 + Math.random() * 1.2,
        -Math.random() * 2.5 - 0.3
      ));
    }
    return points;
  }, [cfg]);

  useEffect(() => {
    if (!groupRef.current) return;

    const states: ButterflyState[] = [];
    for (let i = 0; i < cfg.butterflyCount; i++) {
      const state: ButterflyState = {
        t: Math.random(),
        pathSpeed: cfg.butterflySpeed * (0.6 + Math.random() * 0.8),
        pathPoints: generatePath(),
        wingPhase: Math.random() * Math.PI * 2,
        size: 0.5 + Math.random() * 0.4,
      };
      states.push(state);

      const bGroup = new THREE.Group();

      const wingMat = new THREE.MeshLambertMaterial({
        color: butterflyColors[i % butterflyColors.length],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });

      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.rotation.z = 0.2;
      leftWing.position.x = 0.005;
      bGroup.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeo, wingMat.clone());
      rightWing.scale.x = -1;
      rightWing.rotation.z = -0.2;
      rightWing.position.x = -0.005;
      bGroup.add(rightWing);

      // Tiny body
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.003, 0.06, 4),
        new THREE.MeshLambertMaterial({ color: '#333' })
      );
      body.rotation.x = Math.PI / 2;
      body.position.y = 0.12;
      bGroup.add(body);

      bGroup.scale.setScalar(state.size);
      groupRef.current.add(bGroup);
    }

    butterflies.current = states;
  }, [wingGeo, generatePath, butterflyColors, cfg]);

  const catmullRom = useCallback((points: THREE.Vector3[], t: number): THREE.Vector3 => {
    const n = points.length;
    const scaledT = t * (n - 1);
    const i = Math.floor(scaledT);
    const frac = scaledT - i;

    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[Math.min(i, n - 1)];
    const p2 = points[Math.min(i + 1, n - 1)];
    const p3 = points[Math.min(i + 2, n - 1)];

    const t2 = frac * frac;
    const t3 = t2 * frac;

    return new THREE.Vector3(
      0.5 * (2*p1.x + (-p0.x+p2.x)*frac + (2*p0.x-5*p1.x+4*p2.x-p3.x)*t2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
      0.5 * (2*p1.y + (-p0.y+p2.y)*frac + (2*p0.y-5*p1.y+4*p2.y-p3.y)*t2 + (-p0.y+3*p1.y-3*p2.y+p3.y)*t3),
      0.5 * (2*p1.z + (-p0.z+p2.z)*frac + (2*p0.z-5*p1.z+4*p2.z-p3.z)*t2 + (-p0.z+3*p1.z-3*p2.z+p3.z)*t3)
    );
  }, []);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);

    butterflies.current.forEach((b, i) => {
      const bGroup = groupRef.current!.children[i] as THREE.Group;
      if (!bGroup) return;

      b.t += b.pathSpeed * dt * 0.04;
      if (b.t >= 1) {
        b.t = 0;
        b.pathPoints = generatePath();
      }

      const pos = catmullRom(b.pathPoints, b.t);
      pos.y += Math.sin(clock.elapsedTime * 1.2 + b.wingPhase) * 0.06;
      bGroup.position.copy(pos);
      butterflyPositions[i].copy(pos);

      // Wing flapping
      const flapAngle = Math.sin(clock.elapsedTime * cfg.butterflyWingFlapSpeed + b.wingPhase) * 0.6;
      if (bGroup.children[0]) (bGroup.children[0] as THREE.Mesh).rotation.z = 0.2 + flapAngle;
      if (bGroup.children[1]) (bGroup.children[1] as THREE.Mesh).rotation.z = -0.2 - flapAngle;

      // Face movement direction
      if (b.t + 0.01 < 1) {
        const nextPos = catmullRom(b.pathPoints, Math.min(b.t + 0.01, 0.999));
        const dir = nextPos.sub(pos).normalize();
        if (dir.length() > 0.001) {
          bGroup.rotation.y = Math.atan2(dir.x, dir.z);
        }
      }
    });
  });

  return <group ref={groupRef} />;
}

/* ═══════════════════════════════════════════════════════
   POLLEN PARTICLES
   ═══════════════════════════════════════════════════════ */
function PollenParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const cfg = useMemo(() => getCfg(), []);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(cfg.particleCount * 3);
    const vel = new Float32Array(cfg.particleCount * 3);

    for (let i = 0; i < cfg.particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * cfg.particleSpread.x;
      pos[i * 3 + 1] = cfg.grassLayers[0].yOffset + Math.random() * cfg.particleSpread.y + 0.1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * cfg.particleSpread.z - 1;

      vel[i * 3] = (Math.random() - 0.5) * cfg.particleSpeed;
      vel[i * 3 + 1] = (Math.random() - 0.3) * cfg.particleSpeed * 0.3;
      vel[i * 3 + 2] = (Math.random() - 0.5) * cfg.particleSpeed * 0.2;
    }

    return { positions: pos, velocities: vel };
  }, [cfg]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const arr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const t = clock.elapsedTime;

    for (let i = 0; i < cfg.particleCount; i++) {
      const idx = i * 3;
      arr[idx] += velocities[idx] * 0.016;
      arr[idx + 1] += Math.sin(t * 0.2 + i * 0.5) * 0.0003;
      arr[idx + 2] += velocities[idx + 2] * 0.016;

      const halfX = cfg.particleSpread.x * 0.5;
      if (arr[idx] > halfX) arr[idx] = -halfX;
      if (arr[idx] < -halfX) arr[idx] = halfX;

      const yBase = cfg.grassLayers[0].yOffset;
      if (arr[idx + 1] > yBase + cfg.particleSpread.y + 0.5) arr[idx + 1] = yBase + 0.1;
      if (arr[idx + 1] < yBase) arr[idx + 1] = yBase + cfg.particleSpread.y;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={cfg.particleCount}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        color="#fffce0"
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════
   GROUND PLANE
   ═══════════════════════════════════════════════════════ */
function Ground() {
  const cfg = useMemo(() => getCfg(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, cfg.grassLayers[0].yOffset - 0.02, -1]}>
      <planeGeometry args={[40, 18]} />
      <meshLambertMaterial color={cfg.groundColor} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════
   CAMERA
   ═══════════════════════════════════════════════════════ */
function SceneSetup() {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.set(0, 1.2, 5.5);
    camera.lookAt(0, 0.0, -1);
  });
  return null;
}

/* ═══════════════════════════════════════════════════════
   TRANSPARENT BACKGROUND
   ═══════════════════════════════════════════════════════ */
function ClearBg() {
  const { gl, scene } = useThree();
  scene.background = null;
  gl.setClearColor(0x000000, 0);
  return null;
}

/* ═══════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════ */
export default function MeadowScene() {
  const cfg = useMemo(() => getCfg(), []);

  return (
    <Canvas
      camera={{ position: [0, 1.2, 5.5], fov: 40 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 1.5]}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <ClearBg />

        {/* Fog blends distant grass into soft haze */}
        <fog attach="fog" args={[cfg.fogColor, cfg.fogNear, cfg.fogFar]} />

        {/* Soft daylight lighting */}
        <ambientLight intensity={0.6} color="#d0e8c8" />
        <directionalLight position={[4, 8, 3]} intensity={1.0} color="#fff8e0" />
        <directionalLight position={[-3, 4, -2]} intensity={0.3} color="#90c890" />
        <hemisphereLight args={['#b8d8f0', '#2a5c22', 0.4]} />

        <Ground />

        {cfg.grassLayers.map((layer, i) => (
          <GrassLayer key={i} layerConfig={layer} />
        ))}

        <WindGustController />
        <MushroomSystem />
        <ButterflySystem />
        <PollenParticles />
        <SceneSetup />
      </Suspense>
    </Canvas>
  );
}
