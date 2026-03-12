import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════
   TUNABLE PARAMETERS
   ═══════════════════════════════════════════════════════ */
const CFG = {
  heroClusters: 30,

  billboardsPerCluster: [10, 16] as [number, number],

  fieldY: 8,

  clusterSpreadX: 4.0,
  clusterSpreadY: 1.6,
  clusterSpreadZ: 2.5,

  sizeMin: 5.0,
  sizeMax: 12.0,

  forwardSpeed: 0.35,
  driftSpeed: 0.10,

  despawnZ: 20,
  respawnZMin: -60,
  respawnZMax: -85,

  fogNear: 35,
  fogFar: 95,

  // Each layer now has its own fieldX based on visible width at that depth
  // Camera z=10, FOV=55 → half-angle=27.5° → tan=0.52
  // visible full width at distance d = 2 * 0.52 * d
  layers: [
    { zRange: [-85, -55] as [number, number], scale: 0.55, opacity: 0.45, speed: 1.1, fieldX: 80 },
    { zRange: [-55, -25] as [number, number], scale: 1.0,  opacity: 0.75, speed: 0.85, fieldX: 55 },
    { zRange: [-25, -5] as [number, number],  scale: 1.5,  opacity: 1.0,  speed: 0.55, fieldX: 32 },
  ],
};

/* ═══════════════════════════════════════════════════════
   SHADERS
   ═══════════════════════════════════════════════════════ */
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying float vFogFactor;
  uniform float uFogNear;
  uniform float uFogFar;

  void main() {
    vUv = uv;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    float fogDist = -mvPos.z;
    vFogFactor = smoothstep(uFogNear, uFogFar, fogDist);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  varying float vFogFactor;

  uniform float uTime;
  uniform float uDensity;
  uniform float uSoftness;
  uniform float uOpacity;
  uniform float uSeed;
  uniform vec3 uLightColor;
  uniform vec3 uBaseColor;
  uniform vec3 uShadowColor;
  uniform vec3 uFogColor;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                              + i.x + vec3(0.0, i1.x, 1.0));
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

  float fbm(vec2 p) {
    float f = 0.0, amp = 0.55, freq = 1.0;
    for (int i = 0; i < 5; i++) {
      f += amp * snoise(p * freq);
      freq *= 1.95;
      amp *= 0.48;
    }
    return f;
  }

  float worleyBreakup(vec2 p) {
    vec2 cell = floor(p);
    vec2 frac_p = fract(p);
    float minDist = 1.0;
    for (int x = -1; x <= 1; x++) {
      for (int y = -1; y <= 1; y++) {
        vec2 neighbor = vec2(float(x), float(y));
        vec2 point = vec2(
          snoise(cell + neighbor) * 0.5 + 0.5,
          snoise((cell + neighbor) * 1.7 + 3.1) * 0.5 + 0.5
        );
        float d = length(neighbor + point - frac_p);
        minDist = min(minDist, d);
      }
    }
    return minDist;
  }

  void main() {
    vec2 centered = vUv * 2.0 - 1.0;
    float dist = length(centered);

    float radial = 1.0 - smoothstep(0.15, 0.85, dist);
    radial = pow(radial, uSoftness);

    vec2 seedOff = vec2(uSeed * 7.31, uSeed * 13.17);
    vec2 nuv = vUv * 3.0 + seedOff;
    float slow = uTime * 0.008;

    float n1 = fbm(nuv * 0.8 + slow);
    float n2 = fbm(nuv * 1.8 + vec2(5.2, 1.3) + slow * 0.7);
    float n3 = fbm(nuv * 3.5 + vec2(-3.1, 7.4) + slow * 0.5);
    float w = worleyBreakup(nuv * 1.2 + seedOff * 0.3);

    float cloud = (n1 * 0.50 + n2 * 0.30 + n3 * 0.15 + w * 0.05) * 0.5 + 0.5;

    float densityLow = 0.38 - uDensity * 0.18;
    float densityHigh = 0.62;
    cloud = smoothstep(densityLow, densityHigh, cloud);

    float alpha = radial * cloud * uOpacity;

    float topLight = smoothstep(-0.5, 0.7, centered.y) * 0.45 + 0.55;
    float coreGlow = pow(max(1.0 - dist * 1.2, 0.0), 2.5) * 0.12;
    float rimDist = abs(dist - 0.5);
    float rim = exp(-rimDist * rimDist * 12.0) * 0.08 * cloud;
    float baseShadow = smoothstep(0.3, -0.6, centered.y) * 0.2;

    vec3 color = mix(uBaseColor, uLightColor, topLight + coreGlow + rim);
    color = mix(color, uShadowColor, baseShadow);

    float topEdge = smoothstep(0.3, 0.8, centered.y) * smoothstep(0.6, 0.3, dist);
    color += vec3(1.0, 0.98, 0.92) * topEdge * 0.06;

    color = mix(color, uFogColor, vFogFactor * 0.35);
    alpha *= (1.0 - vFogFactor * 0.45);

    if (alpha < 0.008) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */
interface Billboard {
  mesh: THREE.Mesh;
  opacityBase: number;
  densityBase: number;
  seed: number;
}

interface CloudCluster {
  group: THREE.Group;
  billboards: Billboard[];
  basePos: THREE.Vector3;
  driftDir: number;
  driftPhaseOffset: number;
  speed: number;
  layerIndex: number;
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
function createCloudMaterial(seed: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uDensity: { value: 0.5 },
      uSoftness: { value: 1.4 },
      uOpacity: { value: 0.5 },
      uSeed: { value: seed },
      uLightColor: { value: new THREE.Color('#ffffff') },
      uBaseColor: { value: new THREE.Color('#f0f5fc') },
      uShadowColor: { value: new THREE.Color('#8aa8c8') },
      uFogColor: { value: new THREE.Color('#8cbce6') },
      uFogNear: { value: CFG.fogNear },
      uFogFar: { value: CFG.fogFar },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
  });
}

function buildCluster(
  planeGeo: THREE.PlaneGeometry,
  layerIndex: number,
  clusterIdx: number,
): CloudCluster {
  const layer = CFG.layers[layerIndex];
  const group = new THREE.Group();
  const billboards: Billboard[] = [];
  const count = THREE.MathUtils.randInt(CFG.billboardsPerCluster[0], CFG.billboardsPerCluster[1]);

  for (let b = 0; b < count; b++) {
    const seed = Math.random() * 100;
    const isCore = b < count * 0.35;

    const opacityBase = isCore
      ? 0.45 + Math.random() * 0.25
      : 0.15 + Math.random() * 0.20;
    const densityBase = isCore
      ? 0.55 + Math.random() * 0.30
      : 0.25 + Math.random() * 0.25;

    const mat = createCloudMaterial(seed);
    mat.uniforms.uOpacity.value = opacityBase * layer.opacity;
    mat.uniforms.uDensity.value = densityBase;
    mat.uniforms.uSoftness.value = isCore ? 1.2 : 1.6 + Math.random() * 0.5;

    const size = THREE.MathUtils.lerp(CFG.sizeMin, CFG.sizeMax, Math.random()) * layer.scale;
    const mesh = new THREE.Mesh(planeGeo, mat);

    const spreadMult = isCore ? 0.5 : 1.0;
    mesh.position.set(
      (Math.random() - 0.5) * CFG.clusterSpreadX * spreadMult,
      (Math.random() - 0.5) * CFG.clusterSpreadY * spreadMult + (isCore ? 0.2 : -0.1),
      (Math.random() - 0.5) * CFG.clusterSpreadZ * spreadMult
    );
    mesh.scale.setScalar(size);
    mesh.renderOrder = 100 + clusterIdx;

    group.add(mesh);
    billboards.push({ mesh, opacityBase, densityBase, seed });
  }

  const zRange = layer.zRange;
  const basePos = new THREE.Vector3(
    (Math.random() - 0.5) * layer.fieldX,
    (Math.random() - 0.5) * CFG.fieldY + 1.5,
    THREE.MathUtils.lerp(zRange[0], zRange[1], Math.random())
  );
  group.position.copy(basePos);

  return {
    group,
    billboards,
    basePos,
    driftDir: Math.random() > 0.5 ? 1 : -1,
    driftPhaseOffset: Math.random() * Math.PI * 2,
    speed: 0.6 + Math.random() * 0.8,
    layerIndex,
  };
}

/* ═══════════════════════════════════════════════════════
   CLOUD SYSTEM
   ═══════════════════════════════════════════════════════ */
function CloudSystem() {
  const { camera, scene } = useThree();
  const clustersRef = useRef<CloudCluster[]>([]);
  const progressRef = useRef(0);
  const planeGeo = useMemo(() => new THREE.PlaneGeometry(1, 1, 1, 1), []);

  useEffect(() => {
    const clusters: CloudCluster[] = [];

    for (let c = 0; c < CFG.heroClusters; c++) {
      const layerIdx = c % CFG.layers.length;
      const cluster = buildCluster(planeGeo, layerIdx, c);
      scene.add(cluster.group);
      clusters.push(cluster);
    }

    clustersRef.current = clusters;

    return () => {
      clusters.forEach((cl) => {
        cl.billboards.forEach((bb) => {
          (bb.mesh.material as THREE.ShaderMaterial).dispose();
        });
        scene.remove(cl.group);
      });
    };
  }, [scene, planeGeo]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    const heroEl = document.getElementById('hero-scroll');
    if (heroEl) {
      const rect = heroEl.getBoundingClientRect();
      const totalScroll = heroEl.offsetHeight - window.innerHeight;
      if (totalScroll > 0) {
        progressRef.current = Math.min(Math.max(-rect.top / totalScroll, 0), 1);
      }
    }

    const p = progressRef.current;
    const forwardPhase = Math.max(1.0 - p / 0.35, 0);
    const driftPhase = Math.min(p / 0.35, 1);

    clustersRef.current.forEach((cluster) => {
      const { group, billboards, basePos, driftDir, driftPhaseOffset, speed, layerIndex } = cluster;
      const layer = CFG.layers[layerIndex];

      const fwd = t * CFG.forwardSpeed * speed * layer.speed * forwardPhase;
      const driftX = driftDir * t * CFG.driftSpeed * speed * driftPhase;
      const yOsc = Math.sin(t * 0.06 + driftPhaseOffset) * 0.25;
      const xOsc = Math.sin(t * 0.04 + driftPhaseOffset * 1.3) * 0.4 * forwardPhase;

      let z = basePos.z + fwd;

      if (z > CFG.despawnZ) {
        cluster.basePos.z = THREE.MathUtils.lerp(CFG.respawnZMin, CFG.respawnZMax, Math.random());
        cluster.basePos.x = (Math.random() - 0.5) * layer.fieldX;
        cluster.basePos.y = (Math.random() - 0.5) * CFG.fieldY + 1.5;
        cluster.driftDir = Math.random() > 0.5 ? 1 : -1;
        cluster.driftPhaseOffset = Math.random() * Math.PI * 2;
        cluster.speed = 0.6 + Math.random() * 0.8;
        billboards.forEach((bb) => {
          const newSeed = Math.random() * 100;
          bb.seed = newSeed;
          (bb.mesh.material as THREE.ShaderMaterial).uniforms.uSeed.value = newSeed;
        });
        z = cluster.basePos.z + fwd;
      }

      group.position.set(basePos.x + driftX + xOsc, basePos.y + yOsc, z);

      // X-wrapping per layer width
      const halfX = layer.fieldX * 0.6;
      if (group.position.x > halfX) {
        group.position.x -= layer.fieldX * 1.2;
        billboards.forEach((bb) => {
          const newSeed = Math.random() * 100;
          bb.seed = newSeed;
          (bb.mesh.material as THREE.ShaderMaterial).uniforms.uSeed.value = newSeed;
        });
      } else if (group.position.x < -halfX) {
        group.position.x += layer.fieldX * 1.2;
        billboards.forEach((bb) => {
          const newSeed = Math.random() * 100;
          bb.seed = newSeed;
          (bb.mesh.material as THREE.ShaderMaterial).uniforms.uSeed.value = newSeed;
        });
      }

      billboards.forEach((bb) => {
        bb.mesh.quaternion.copy(camera.quaternion);
        const mat = bb.mesh.material as THREE.ShaderMaterial;
        mat.uniforms.uTime.value = t + bb.seed * 3.7;
      });
    });
  });

  return null;
}

function ClearBg() {
  const { gl, scene } = useThree();
  scene.background = null;
  gl.setClearColor(0x000000, 0);
  return null;
}

export default function CloudCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 55, near: 0.1, far: 120 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 1.5]}
      style={{ background: 'transparent' }}
    >
      <ClearBg />
      <CloudSystem />
    </Canvas>
  );
}
