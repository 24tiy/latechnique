import { useRef, useMemo, useEffect, useCallback, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Suspense } from 'react';

/* ═══════════════════════════════════════════════════════
   TUNABLE PARAMETERS
   ═══════════════════════════════════════════════════════ */
const CFG = {
  grassBladeCount: 4500,
  grassFieldWidth: 22,
  grassFieldDepth: 7,
  grassHeightMin: 0.5,
  grassHeightMax: 1.3,

  windStrength: 1.0,
  windSpeed: 0.8,

  mushroomMaxCount: 5,
  mushroomSpawnInterval: 3.5,
  mushroomGrowDuration: 2.0,
  mushroomVisibleDuration: 5.0,
  mushroomShrinkDuration: 2.5,

  butterflyCount: 3,
  butterflySpeed: 0.4,
  butterflyWingFlapSpeed: 6.0,

  particleCount: 50,
};

/* ═══════════════════════════════════════════════════════
   SEEDED RANDOM — stable positions per blade
   ═══════════════════════════════════════════════════════ */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ═══════════════════════════════════════════════════════
   GRASS SHADERS
   ═══════════════════════════════════════════════════════ */
const grassVert = /* glsl */ `
  uniform float uTime;
  uniform float uWindStrength;
  uniform float uWindSpeed;
  varying float vHeight;
  varying float vAO;

  vec3 mod289v(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec2 mod289v2(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec3 permutev(vec3 x){return mod289v(((x*34.0)+1.0)*x);}

  float snoise(vec2 v){
    const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
    vec2 i=floor(v+dot(v,C.yy));
    vec2 x0=v-i+dot(i,C.xx);
    vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
    vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;
    i=mod289v2(i);
    vec3 p=permutev(permutev(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
    vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
    m=m*m;m=m*m;
    vec3 x=2.0*fract(p*C.www)-1.0;
    vec3 h=abs(x)-0.5;
    vec3 ox=floor(x+0.5);
    vec3 a0=x-ox;
    m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
    vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;
    return 130.0*dot(m,g);
  }

  void main(){
    vHeight = uv.y;
    vec3 pos = position;

    float windInfluence = pow(uv.y, 2.0);
    float t = uTime * uWindSpeed;

    // World position for noise sampling (use instance transform)
    vec4 worldPos = instanceMatrix * vec4(pos, 1.0);

    float w1 = snoise(vec2(worldPos.x*0.25+t*0.7, worldPos.z*0.25+t*0.15))*0.6;
    float w2 = snoise(vec2(worldPos.x*0.6+t*1.1, worldPos.z*0.4+t*0.3))*0.25;
    float w3 = snoise(vec2(worldPos.x*1.3+t*2.0, worldPos.z*1.0))*0.10;

    float totalWind = (w1+w2+w3) * uWindStrength;

    pos.x += totalWind * windInfluence;
    pos.z += totalWind * windInfluence * 0.2;
    pos.y -= abs(totalWind) * windInfluence * 0.1;

    vAO = smoothstep(0.0, 0.25, uv.y);

    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
  }
`;

const grassFrag = /* glsl */ `
  varying float vHeight;
  varying float vAO;

  uniform vec3 uColorBase;
  uniform vec3 uColorMid;
  uniform vec3 uColorTip;
  uniform vec3 uColorDark;

  void main(){
    vec3 color = mix(uColorDark, uColorBase, smoothstep(0.0, 0.2, vHeight));
    color = mix(color, uColorMid, smoothstep(0.2, 0.5, vHeight));
    color = mix(color, uColorTip, smoothstep(0.5, 1.0, vHeight));
    color *= mix(0.45, 1.0, vAO);

    // Subtle bright tip
    color += vec3(0.06, 0.08, 0.02) * smoothstep(0.75, 1.0, vHeight);

    float alpha = mix(1.0, 0.85, smoothstep(0.8, 1.0, vHeight));
    gl_FragColor = vec4(color, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════
   GRASS BLADE GEOMETRY
   ═══════════════════════════════════════════════════════ */
function makeBladeGeo(): THREE.BufferGeometry {
  const segs = 5;
  const verts: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const w = 0.04 * (1 - t * 0.7);
    verts.push(-w, t, 0);
    verts.push(w, t, 0);
    uvs.push(0, t);
    uvs.push(1, t);
    if (i < segs) {
      const b = i * 2;
      idx.push(b, b+1, b+2, b+1, b+3, b+2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/* ═══════════════════════════════════════════════════════
   GRASS FIELD
   ═══════════════════════════════════════════════════════ */
function GrassField() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const bladeGeo = useMemo(() => makeBladeGeo(), []);

  const shaderMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: grassVert,
    fragmentShader: grassFrag,
    uniforms: {
      uTime: { value: 0 },
      uWindStrength: { value: CFG.windStrength },
      uWindSpeed: { value: CFG.windSpeed },
      uColorBase: { value: new THREE.Color('#3d8a35') },
      uColorMid: { value: new THREE.Color('#5aad4e') },
      uColorTip: { value: new THREE.Color('#8fd44a') },
      uColorDark: { value: new THREE.Color('#1e4a1a') },
    },
    side: THREE.DoubleSide,
    transparent: true,
  }), []);

  // Pre-compute all instance matrices once with stable seed
  const matrices = useMemo(() => {
    const rand = seededRandom(42);
    const dummy = new THREE.Object3D();
    const result = new Float32Array(CFG.grassBladeCount * 16);

    for (let i = 0; i < CFG.grassBladeCount; i++) {
      const x = (rand() - 0.5) * CFG.grassFieldWidth;
      const z = -rand() * CFG.grassFieldDepth - 0.5;
      const height = CFG.grassHeightMin + rand() * (CFG.grassHeightMax - CFG.grassHeightMin);
      const rotY = rand() * Math.PI;
      const lean = (rand() - 0.5) * 0.15;
      const widthScale = 0.8 + rand() * 0.4;

      dummy.position.set(x, 0, z);
      dummy.rotation.set(lean, rotY, 0);
      dummy.scale.set(widthScale, height, 1);
      dummy.updateMatrix();
      dummy.matrix.toArray(result, i * 16);
    }

    return result;
  }, []);

  // Apply matrices when mesh mounts
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < CFG.grassBladeCount; i++) {
      const m = new THREE.Matrix4();
      m.fromArray(matrices, i * 16);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  useFrame(({ clock }) => {
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
   SINGLE MUSHROOM COMPONENT
   ═══════════════════════════════════════════════════════ */
function Mushroom({ index }: { index: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const state = useRef({
    phase: 'dormant' as 'dormant' | 'growing' | 'visible' | 'shrinking',
    timer: Math.random() * CFG.mushroomSpawnInterval * 2,
    maxScale: 0.5 + Math.random() * 0.5,
    posX: (Math.random() - 0.5) * CFG.grassFieldWidth * 0.7,
    posZ: -Math.random() * CFG.grassFieldDepth * 0.5 - 1,
  });

  const capColor = useMemo(() => {
    const colors = ['#d44040', '#c87030', '#e8c840', '#d06898'];
    return colors[index % colors.length];
  }, [index]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const s = state.current;
    const dt = Math.min(delta, 0.05);
    s.timer += dt;

    switch (s.phase) {
      case 'dormant':
        g.scale.setScalar(0);
        if (s.timer >= CFG.mushroomSpawnInterval) {
          s.phase = 'growing';
          s.timer = 0;
          s.posX = (Math.random() - 0.5) * CFG.grassFieldWidth * 0.7;
          s.posZ = -Math.random() * CFG.grassFieldDepth * 0.5 - 1;
          s.maxScale = 0.4 + Math.random() * 0.5;
          g.position.set(s.posX, 0, s.posZ);
        }
        break;

      case 'growing': {
        const t = Math.min(s.timer / CFG.mushroomGrowDuration, 1);
        const e = 1 - Math.pow(1 - t, 3);
        g.scale.setScalar(e * s.maxScale);
        g.position.y = -0.03 + e * 0.03;
        if (t >= 1) { s.phase = 'visible'; s.timer = 0; }
        break;
      }

      case 'visible':
        g.rotation.z = Math.sin(s.timer * 1.2 + index * 2) * 0.03;
        if (s.timer >= CFG.mushroomVisibleDuration) { s.phase = 'shrinking'; s.timer = 0; }
        break;

      case 'shrinking': {
        const t = Math.min(s.timer / CFG.mushroomShrinkDuration, 1);
        g.scale.setScalar((1 - t * t) * s.maxScale);
        g.position.y = -t * 0.1;
        if (t >= 1) {
          s.phase = 'dormant';
          s.timer = Math.random() * CFG.mushroomSpawnInterval;
          g.scale.setScalar(0);
        }
        break;
      }
    }
  });

  return (
    <group ref={groupRef} position={[state.current.posX, 0, state.current.posZ]} scale={0}>
      {/* Stem */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.12, 6]} />
        <meshLambertMaterial color="#f5f0e0" />
      </mesh>
      {/* Cap */}
      <mesh position={[0, 0.14, 0]}>
        <sphereGeometry args={[0.09, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshLambertMaterial color={capColor} />
      </mesh>
      {/* Spots on cap */}
      {[0, 1.2, 2.5, 3.8, 5.2].map((angle, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(angle) * 0.055,
            0.16 + Math.sin(i * 1.3) * 0.01,
            Math.sin(angle) * 0.055
          ]}
        >
          <sphereGeometry args={[0.012, 4, 4]} />
          <meshLambertMaterial color="#f8f4e8" />
        </mesh>
      ))}
    </group>
  );
}

function MushroomSystem() {
  return (
    <group>
      {Array.from({ length: CFG.mushroomMaxCount }, (_, i) => (
        <Mushroom key={i} index={i} />
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   BUTTERFLY
   ═══════════════════════════════════════════════════════ */
function Butterfly({ index }: { index: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);

  const state = useRef({
    t: Math.random(),
    speed: CFG.butterflySpeed * (0.6 + Math.random() * 0.6),
    wingPhase: Math.random() * Math.PI * 2,
    path: generateButterflyPath(),
  });

  const color = useMemo(() => {
    const colors = ['#6ab4e8', '#e8a06a', '#c890e0'];
    return colors[index % colors.length];
  }, [index]);

  useFrame(({ clock }, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const s = state.current;
    const dt = Math.min(delta, 0.05);

    s.t += s.speed * dt * 0.04;
    if (s.t >= 1) {
      s.t = 0;
      s.path = generateButterflyPath();
    }

    const pos = catmullRomPoint(s.path, s.t);
    pos.y += Math.sin(clock.elapsedTime * 1.5 + s.wingPhase) * 0.06;
    g.position.copy(pos);

    // Wing flap
    const flap = Math.sin(clock.elapsedTime * CFG.butterflyWingFlapSpeed + s.wingPhase) * 0.6;
    if (leftWingRef.current) leftWingRef.current.rotation.y = flap;
    if (rightWingRef.current) rightWingRef.current.rotation.y = -flap;

    // Face direction
    if (s.t + 0.01 < 1) {
      const next = catmullRomPoint(s.path, s.t + 0.01);
      const dir = next.sub(pos);
      if (dir.length() > 0.001) {
        g.rotation.y = Math.atan2(dir.x, dir.z);
      }
    }
  });

  return (
    <group ref={groupRef} scale={0.35}>
      {/* Left wing */}
      <mesh ref={leftWingRef} position={[0.02, 0, 0]}>
        <planeGeometry args={[0.25, 0.18]} />
        <meshLambertMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.82} />
      </mesh>
      {/* Right wing */}
      <mesh ref={rightWingRef} position={[-0.02, 0, 0]}>
        <planeGeometry args={[0.25, 0.18]} />
        <meshLambertMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.82} />
      </mesh>
      {/* Body */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.008, 0.12, 4]} />
        <meshLambertMaterial color="#333" />
      </mesh>
    </group>
  );
}

function generateButterflyPath(): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < 6; i++) {
    pts.push(new THREE.Vector3(
      (Math.random() - 0.5) * CFG.grassFieldWidth * 0.6,
      0.6 + Math.random() * 1.6,
      -Math.random() * CFG.grassFieldDepth * 0.5 - 0.5
    ));
  }
  return pts;
}

function catmullRomPoint(pts: THREE.Vector3[], t: number): THREE.Vector3 {
  const n = pts.length;
  const st = t * (n - 1);
  const i = Math.floor(st);
  const f = st - i;
  const p0 = pts[Math.max(i - 1, 0)];
  const p1 = pts[Math.min(i, n - 1)];
  const p2 = pts[Math.min(i + 1, n - 1)];
  const p3 = pts[Math.min(i + 2, n - 1)];
  const f2 = f * f, f3 = f2 * f;
  return new THREE.Vector3(
    0.5*(2*p1.x+(-p0.x+p2.x)*f+(2*p0.x-5*p1.x+4*p2.x-p3.x)*f2+(-p0.x+3*p1.x-3*p2.x+p3.x)*f3),
    0.5*(2*p1.y+(-p0.y+p2.y)*f+(2*p0.y-5*p1.y+4*p2.y-p3.y)*f2+(-p0.y+3*p1.y-3*p2.y+p3.y)*f3),
    0.5*(2*p1.z+(-p0.z+p2.z)*f+(2*p0.z-5*p1.z+4*p2.z-p3.z)*f2+(-p0.z+3*p1.z-3*p2.z+p3.z)*f3)
  );
}

function ButterflySystem() {
  return (
    <group>
      {Array.from({ length: CFG.butterflyCount }, (_, i) => (
        <Butterfly key={i} index={i} />
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   POLLEN PARTICLES
   ═══════════════════════════════════════════════════════ */
function PollenParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(CFG.particleCount * 3);
    const vel = new Float32Array(CFG.particleCount * 3);
    for (let i = 0; i < CFG.particleCount; i++) {
      pos[i*3]   = (Math.random()-0.5) * 16;
      pos[i*3+1] = 0.2 + Math.random() * 3;
      pos[i*3+2] = (Math.random()-0.5) * 6 - 1;
      vel[i*3]   = (Math.random()-0.5) * 0.06;
      vel[i*3+1] = (Math.random()-0.3) * 0.02;
      vel[i*3+2] = (Math.random()-0.5) * 0.03;
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const arr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const t = clock.elapsedTime;
    for (let i = 0; i < CFG.particleCount; i++) {
      const ix = i * 3;
      arr[ix]   += velocities[ix] * 0.016;
      arr[ix+1] += Math.sin(t * 0.3 + i * 0.7) * 0.0004;
      arr[ix+2] += velocities[ix+2] * 0.016;
      if (arr[ix] > 8) arr[ix] = -8;
      if (arr[ix] < -8) arr[ix] = 8;
      if (arr[ix+1] > 3.5) arr[ix+1] = 0.2;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={CFG.particleCount} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#fff8d0" transparent opacity={0.45} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════
   GROUND
   ═══════════════════════════════════════════════════════ */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -2]}>
      <planeGeometry args={[CFG.grassFieldWidth + 8, CFG.grassFieldDepth + 10]} />
      <meshLambertMaterial color="#2a6622" />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════
   SCENE SETUP
   ═══════════════════════════════════════════════════════ */
function SceneSetup() {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.set(0, 1.6, 4.5);
    camera.lookAt(0, 0.4, -1.5);
  });
  return null;
}

/* ═══════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════ */
export default function MeadowScene() {
  return (
    <Canvas
      camera={{ position: [0, 1.6, 4.5], fov: 38 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 1.5]}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <color attach="background" args={['#357a2c']} />
        <fog attach="fog" args={['#357a2c', 5, 14]} />

        <ambientLight intensity={0.65} color="#c8e8c0" />
        <directionalLight position={[5, 8, 3]} intensity={1.3} color="#fff8e0" />
        <directionalLight position={[-3, 4, -2]} intensity={0.35} color="#90c890" />
        <hemisphereLight args={['#87ceeb', '#2a6622', 0.45]} />

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
