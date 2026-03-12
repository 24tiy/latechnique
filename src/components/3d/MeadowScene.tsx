import { useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Suspense } from 'react';

/* ═══════════════════════════════════════════════════════
   TUNABLE PARAMETERS
   ═══════════════════════════════════════════════════════ */
const CFG = {
  // Grass
  grassBladeCount: 5000,
  grassFieldWidth: 24,
  grassFieldDepth: 8,
  grassHeightMin: 0.5,
  grassHeightMax: 1.4,
  grassBladeWidth: 0.04,

  // Wind
  windStrength: 1.2,
  windSpeed: 0.8,

  // Mushrooms
  mushroomMaxCount: 6,
  mushroomSpawnInterval: 3.0, // seconds between spawn attempts
  mushroomGrowDuration: 2.0,
  mushroomVisibleDuration: 5.0,
  mushroomShrinkDuration: 2.5,

  // Butterflies
  butterflyCount: 3,
  butterflySpeed: 0.4,
  butterflyWingFlapSpeed: 6.0,

  // Particles (pollen)
  particleCount: 60,
  particleSpeed: 0.08,
  particleSpread: { x: 16, y: 4, z: 6 },
};

/* ═══════════════════════════════════════════════════════
   GRASS SHADERS
   ═══════════════════════════════════════════════════════ */
const grassVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uWindStrength;
  uniform float uWindSpeed;
  varying vec2 vUv;
  varying float vHeight;
  varying float vAO;

  // Simplex noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
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

  void main() {
    vUv = uv;
    vHeight = uv.y;

    vec3 pos = position;

    // Wind — stronger toward blade tips
    float windInfluence = pow(uv.y, 2.2);

    // Multi-frequency wind waves
    float t = uTime * uWindSpeed;
    float wind1 = snoise(vec2(pos.x * 0.25 + t * 0.7, pos.z * 0.25 + t * 0.2)) * 0.65;
    float wind2 = snoise(vec2(pos.x * 0.6 + t * 1.1, pos.z * 0.4 + t * 0.4)) * 0.25;
    float wind3 = snoise(vec2(pos.x * 1.4 + t * 2.2, pos.z * 1.0 + t * 0.1)) * 0.10;

    float totalWind = (wind1 + wind2 + wind3) * uWindStrength;

    // Displacement
    pos.x += totalWind * windInfluence;
    pos.z += totalWind * windInfluence * 0.25;
    pos.y -= abs(totalWind) * windInfluence * 0.12;

    // AO: darker at base
    vAO = smoothstep(0.0, 0.25, uv.y);

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
    // Rich gradient from dark base → green mid → bright tip
    vec3 color = mix(uColorDark, uColorBase, smoothstep(0.0, 0.2, vHeight));
    color = mix(color, uColorMid, smoothstep(0.2, 0.55, vHeight));
    color = mix(color, uColorTip, smoothstep(0.55, 1.0, vHeight));

    // AO darken at base
    color *= mix(0.4, 1.0, vAO);

    // Subtle tip highlight shimmer
    float shimmer = sin(vUv.x * 40.0 + uTime * 0.5) * 0.03 + 0.03;
    color += shimmer * smoothstep(0.7, 1.0, vHeight);

    // Slight transparency at tips
    float alpha = mix(1.0, 0.88, smoothstep(0.75, 1.0, vHeight));

    gl_FragColor = vec4(color, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════
   GRASS BLADE GEOMETRY
   ═══════════════════════════════════════════════════════ */
function createBladeGeometry(): THREE.BufferGeometry {
  const segments = 5;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const width = CFG.grassBladeWidth * (1 - t * 0.75);
    // Slight curve
    const curve = t * t * 0.08;

    vertices.push(-width + curve, t, 0);
    vertices.push(width + curve, t, 0);
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
   GRASS FIELD
   ═══════════════════════════════════════════════════════ */
function GrassField() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const bladeGeo = useMemo(() => createBladeGeometry(), []);

  const shaderMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: grassVertexShader,
    fragmentShader: grassFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uWindStrength: { value: CFG.windStrength },
      uWindSpeed: { value: CFG.windSpeed },
      uColorBase: { value: new THREE.Color('#3d8a35') },
      uColorMid: { value: new THREE.Color('#5aad4e') },
      uColorTip: { value: new THREE.Color('#96d44a') },
      uColorDark: { value: new THREE.Color('#1e4a1a') },
    },
    side: THREE.DoubleSide,
    transparent: true,
  }), []);

  const initialized = useRef(false);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    if (!initialized.current) {
      const dummy = new THREE.Object3D();
      const halfW = CFG.grassFieldWidth / 2;
      const halfD = CFG.grassFieldDepth / 2;

      for (let i = 0; i < CFG.grassBladeCount; i++) {
        const x = (Math.random() - 0.5) * CFG.grassFieldWidth;
        // Denser toward center-front
        const zRaw = Math.random();
        const z = -halfD + zRaw * CFG.grassFieldDepth - 1;
        const height = CFG.grassHeightMin + Math.random() * (CFG.grassHeightMax - CFG.grassHeightMin);
        const rotY = Math.random() * Math.PI;
        const lean = (Math.random() - 0.5) * 0.15;
        const widthScale = 0.8 + Math.random() * 0.4;

        dummy.position.set(x, 0, z);
        dummy.rotation.set(lean, rotY, 0);
        dummy.scale.set(widthScale, height, 1);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      initialized.current = true;
    }

    shaderMat.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[bladeGeo, shaderMat, CFG.grassBladeCount]}
      frustumCulled={false}
    />
  );
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
  colorHue: number; // variation
}

function MushroomSystem() {
  const groupRef = useRef<THREE.Group>(null);
  const mushrooms = useRef<MushroomState[]>([]);
  const spawnTimer = useRef(0);

  // Create mushroom geometry once
  const { capGeo, stemGeo } = useMemo(() => {
    const cap = new THREE.SphereGeometry(0.12, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const stem = new THREE.CylinderGeometry(0.03, 0.04, 0.12, 6);
    stem.translate(0, 0.06, 0);
    return { capGeo: cap, stemGeo: stem };
  }, []);

  // Materials
  const capMats = useMemo(() => [
    new THREE.MeshLambertMaterial({ color: '#d44040' }), // red
    new THREE.MeshLambertMaterial({ color: '#c87030' }), // brown
    new THREE.MeshLambertMaterial({ color: '#e8c840' }), // yellow
  ], []);
  const stemMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#f5f0e0' }), []);

  // Initialize mushroom pool
  useEffect(() => {
    if (!groupRef.current) return;

    const pool: MushroomState[] = [];
    for (let i = 0; i < CFG.mushroomMaxCount; i++) {
      const halfW = CFG.grassFieldWidth * 0.4;
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * halfW * 2,
        0,
        -Math.random() * CFG.grassFieldDepth * 0.6 - 0.5
      );

      pool.push({
        position: pos,
        phase: 'dormant',
        timer: Math.random() * CFG.mushroomSpawnInterval, // stagger
        maxScale: 0.6 + Math.random() * 0.6,
        currentScale: 0,
        colorHue: Math.floor(Math.random() * 3),
      });

      // Create mesh group for this mushroom
      const mGroup = new THREE.Group();
      mGroup.position.copy(pos);
      mGroup.scale.setScalar(0);

      const capMesh = new THREE.Mesh(capGeo, capMats[pool[i].colorHue]);
      capMesh.position.y = 0.12;
      mGroup.add(capMesh);

      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      mGroup.add(stemMesh);

      groupRef.current.add(mGroup);
    }

    mushrooms.current = pool;
  }, [capGeo, stemGeo, capMats, stemMat]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.05);

    mushrooms.current.forEach((m, i) => {
      const mGroup = groupRef.current!.children[i] as THREE.Group;
      if (!mGroup) return;

      m.timer += dt;

      switch (m.phase) {
        case 'dormant':
          if (m.timer >= CFG.mushroomSpawnInterval) {
            m.phase = 'growing';
            m.timer = 0;
            // Randomize position for next appearance
            m.position.x = (Math.random() - 0.5) * CFG.grassFieldWidth * 0.8;
            m.position.z = -Math.random() * CFG.grassFieldDepth * 0.6 - 0.5;
            mGroup.position.copy(m.position);
          }
          break;

        case 'growing': {
          const t = Math.min(m.timer / CFG.mushroomGrowDuration, 1);
          // Ease out
          const eased = 1 - Math.pow(1 - t, 3);
          m.currentScale = eased * m.maxScale;
          mGroup.scale.setScalar(m.currentScale);
          if (t >= 1) {
            m.phase = 'visible';
            m.timer = 0;
          }
          break;
        }

        case 'visible':
          // Gentle sway
          mGroup.rotation.z = Math.sin(clock.elapsedTime * 1.2 + i * 2) * 0.04;
          if (m.timer >= CFG.mushroomVisibleDuration) {
            m.phase = 'shrinking';
            m.timer = 0;
          }
          break;

        case 'shrinking': {
          const t = Math.min(m.timer / CFG.mushroomShrinkDuration, 1);
          const eased = 1 - t * t;
          m.currentScale = eased * m.maxScale;
          mGroup.scale.setScalar(m.currentScale);
          // Sink down
          mGroup.position.y = m.position.y - t * 0.08;
          if (t >= 1) {
            m.phase = 'dormant';
            m.timer = Math.random() * CFG.mushroomSpawnInterval * 0.5;
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
  t: number; // path parameter
  pathSpeed: number;
  pathPoints: THREE.Vector3[]; // control points for curved path
  wingPhase: number;
  size: number;
  color: THREE.Color;
}

function ButterflySystem() {
  const groupRef = useRef<THREE.Group>(null);
  const butterflies = useRef<ButterflyState[]>([]);

  // Wing geometry — simple diamond shape
  const wingGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.12, 0.15, 0.08, 0.3);
    shape.quadraticCurveTo(0.02, 0.2, 0, 0.1);
    shape.quadraticCurveTo(-0.02, 0.2, -0.08, 0.3);
    shape.quadraticCurveTo(-0.12, 0.15, 0, 0);
    const geo = new THREE.ShapeGeometry(shape);
    return geo;
  }, []);

  const generatePath = useCallback((): THREE.Vector3[] => {
    const halfW = CFG.grassFieldWidth * 0.35;
    const points: THREE.Vector3[] = [];
    const numPoints = 5;
    for (let i = 0; i < numPoints; i++) {
      points.push(new THREE.Vector3(
        (Math.random() - 0.5) * halfW * 2,
        0.8 + Math.random() * 1.5,
        -Math.random() * CFG.grassFieldDepth * 0.5 - 0.5
      ));
    }
    return points;
  }, []);

  const butterflyColors = useMemo(() => [
    new THREE.Color('#6ab4e8'),
    new THREE.Color('#e88a6a'),
    new THREE.Color('#d4a0e8'),
  ], []);

  useEffect(() => {
    if (!groupRef.current) return;

    const states: ButterflyState[] = [];
    for (let i = 0; i < CFG.butterflyCount; i++) {
      const state: ButterflyState = {
        t: Math.random(),
        pathSpeed: CFG.butterflySpeed * (0.7 + Math.random() * 0.6),
        pathPoints: generatePath(),
        wingPhase: Math.random() * Math.PI * 2,
        size: 0.7 + Math.random() * 0.5,
        color: butterflyColors[i % butterflyColors.length],
      };
      states.push(state);

      // Build butterfly mesh group
      const bGroup = new THREE.Group();

      // Left wing
      const leftWing = new THREE.Mesh(
        wingGeo,
        new THREE.MeshLambertMaterial({
          color: state.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        })
      );
      leftWing.rotation.z = 0.3;
      leftWing.position.x = 0.01;
      bGroup.add(leftWing);

      // Right wing (mirrored)
      const rightWing = new THREE.Mesh(
        wingGeo,
        new THREE.MeshLambertMaterial({
          color: state.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        })
      );
      rightWing.scale.x = -1;
      rightWing.rotation.z = -0.3;
      rightWing.position.x = -0.01;
      bGroup.add(rightWing);

      // Tiny body
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.006, 0.08, 4),
        new THREE.MeshLambertMaterial({ color: '#2a2a2a' })
      );
      body.rotation.x = Math.PI / 2;
      body.position.y = 0.15;
      bGroup.add(body);

      bGroup.scale.setScalar(state.size);
      groupRef.current.add(bGroup);
    }

    butterflies.current = states;
  }, [wingGeo, generatePath, butterflyColors]);

  // Catmull-Rom interpolation
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

      // Advance along path
      b.t += b.pathSpeed * dt * 0.05;
      if (b.t >= 1) {
        b.t = 0;
        b.pathPoints = generatePath();
      }

      // Position along curve
      const pos = catmullRom(b.pathPoints, b.t);
      // Add gentle bobbing
      pos.y += Math.sin(clock.elapsedTime * 1.5 + b.wingPhase) * 0.08;
      bGroup.position.copy(pos);

      // Wing flapping
      const flapAngle = Math.sin(clock.elapsedTime * CFG.butterflyWingFlapSpeed + b.wingPhase) * 0.5;
      if (bGroup.children[0]) (bGroup.children[0] as THREE.Mesh).rotation.z = 0.3 + flapAngle;
      if (bGroup.children[1]) (bGroup.children[1] as THREE.Mesh).rotation.z = -0.3 - flapAngle;

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
   POLLEN PARTICLE SYSTEM
   ═══════════════════════════════════════════════════════ */
function PollenParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(CFG.particleCount * 3);
    const vel = new Float32Array(CFG.particleCount * 3);

    for (let i = 0; i < CFG.particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * CFG.particleSpread.x;
      pos[i * 3 + 1] = Math.random() * CFG.particleSpread.y + 0.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * CFG.particleSpread.z - 1;

      vel[i * 3] = (Math.random() - 0.5) * CFG.particleSpeed;
      vel[i * 3 + 1] = (Math.random() - 0.3) * CFG.particleSpeed * 0.5;
      vel[i * 3 + 2] = (Math.random() - 0.5) * CFG.particleSpeed * 0.3;
    }

    return { positions: pos, velocities: vel };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const arr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const t = clock.elapsedTime;

    for (let i = 0; i < CFG.particleCount; i++) {
      const idx = i * 3;
      // Gentle drift
      arr[idx] += velocities[idx] * 0.016;
      arr[idx + 1] += Math.sin(t * 0.3 + i * 0.7) * 0.0005;
      arr[idx + 2] += velocities[idx + 2] * 0.016;

      // Wrap around
      const halfX = CFG.particleSpread.x * 0.5;
      if (arr[idx] > halfX) arr[idx] = -halfX;
      if (arr[idx] < -halfX) arr[idx] = halfX;
      if (arr[idx + 1] > CFG.particleSpread.y + 0.5) arr[idx + 1] = 0.2;
      if (arr[idx + 1] < 0) arr[idx + 1] = CFG.particleSpread.y;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={CFG.particleCount}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#fff8d0"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════
   GROUND
   ═══════════════════════════════════════════════════════ */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -1]}>
      <planeGeometry args={[CFG.grassFieldWidth + 6, CFG.grassFieldDepth + 6]} />
      <meshLambertMaterial color="#2d6a25" />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════
   CAMERA CONTROLLER
   ═══════════════════════════════════════════════════════ */
function SceneSetup() {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.set(0, 1.8, 5);
    camera.lookAt(0, 0.5, -1);
  });
  return null;
}

/* ═══════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════ */
export default function MeadowScene() {
  return (
    <Canvas
      camera={{ position: [0, 1.8, 5], fov: 35 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 1.5]}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <color attach="background" args={['#3a8e30']} />
        <fog attach="fog" args={['#3a8e30', 6, 15]} />

        {/* Lighting — soft daylight */}
        <ambientLight intensity={0.7} color="#c8e8c0" />
        <directionalLight position={[5, 8, 3]} intensity={1.4} color="#fff8e0" />
        <directionalLight position={[-3, 4, -2]} intensity={0.4} color="#90c890" />
        <hemisphereLight args={['#87ceeb', '#2d6a25', 0.5]} />

        <Ground />
        <GrassField />
        <MushroomSystem />
        <ButterflySystem />
        <PollenParticles />
        <SceneSetup />
      </Suspense>
    </Canvas>
  );
}
