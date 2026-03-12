import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Suspense } from 'react';

/* ═══════════════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════════════ */
const CFG = {
  grassCount: 5000,
  fieldWidth: 28,
  fieldDepth: 5,
  heightMin: 0.4,
  heightMax: 1.1,

  // Gentle wind
  windStrength: 0.5,
  windSpeed: 0.5,

  // Mushrooms
  mushroomMax: 5,
  mushroomSpawnTime: 4.0,
  mushroomGrowTime: 2.5,
  mushroomShowTime: 6.0,
  mushroomHideTime: 3.0,

  // Butterflies
  butterflyCount: 3,

  // Pollen
  particleCount: 40,
};

/* ═══════════════════════════════════════════════════════
   SEEDED RANDOM
   ═══════════════════════════════════════════════════════ */
function seeded(s: number) {
  let v = s;
  return () => { v = (v * 16807) % 2147483647; return (v - 1) / 2147483646; };
}

/* ═══════════════════════════════════════════════════════
   GRASS SHADERS
   ═══════════════════════════════════════════════════════ */
const gVert = /* glsl */ `
  uniform float uTime;
  uniform float uWind;
  uniform float uSpeed;
  varying float vH;

  vec3 m289(vec3 x){return x-floor(x/289.0)*289.0;}
  vec2 m289v(vec2 x){return x-floor(x/289.0)*289.0;}
  vec3 perm(vec3 x){return m289(((x*34.0)+1.0)*x);}

  float snoise(vec2 v){
    const vec4 C=vec4(0.211324865,0.366025404,-0.577350269,0.024390244);
    vec2 i=floor(v+dot(v,C.yy)),x0=v-i+dot(i,C.xx);
    vec2 i1=x0.x>x0.y?vec2(1,0):vec2(0,1);
    vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=m289v(i);
    vec3 p=perm(perm(i.y+vec3(0,i1.y,1))+i.x+vec3(0,i1.x,1));
    vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
    m=m*m; m=m*m;
    vec3 x=2.0*fract(p*C.www)-1.0, h=abs(x)-.5, ox=floor(x+.5), a0=x-ox;
    m*=1.79284291-.85373472*(a0*a0+h*h);
    vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
    return 130.0*dot(m,g);
  }

  void main(){
    vH = uv.y;
    vec3 pos = position;

    // Wind only at top half of blade, very gentle
    float influence = smoothstep(0.3, 1.0, uv.y);
    influence *= influence; // quadratic = gentle at base, stronger at tips

    vec4 wp = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float t = uTime * uSpeed;

    // Slow, smooth, large-scale waves
    float w1 = snoise(vec2(wp.x * 0.15 + t * 0.4, wp.z * 0.15 + t * 0.1)) * 0.5;
    float w2 = snoise(vec2(wp.x * 0.4 + t * 0.7, wp.z * 0.3 + t * 0.2)) * 0.2;
    float wind = (w1 + w2) * uWind;

    pos.x += wind * influence;
    pos.y -= abs(wind) * influence * 0.06;

    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
  }
`;

const gFrag = /* glsl */ `
  varying float vH;
  uniform vec3 uC1; // dark base
  uniform vec3 uC2; // mid green
  uniform vec3 uC3; // bright tip

  void main(){
    vec3 c = mix(uC1, uC2, smoothstep(0.0, 0.4, vH));
    c = mix(c, uC3, smoothstep(0.4, 1.0, vH));

    // Darken at very base (AO)
    c *= smoothstep(0.0, 0.15, vH) * 0.55 + 0.45;

    // Bright tip highlight
    c += vec3(0.04, 0.06, 0.01) * smoothstep(0.7, 1.0, vH);

    float a = mix(1.0, 0.8, smoothstep(0.85, 1.0, vH));
    gl_FragColor = vec4(c, a);
  }
`;

/* ═══════════════════════════════════════════════════════
   BLADE GEOMETRY (5-segment tapered quad)
   ═══════════════════════════════════════════════════════ */
function makeBladeGeo(): THREE.BufferGeometry {
  const segs = 5;
  const v: number[] = [], u: number[] = [], ix: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const w = 0.035 * (1 - t * 0.75);
    v.push(-w, t, 0, w, t, 0);
    u.push(0, t, 1, t);
    if (i < segs) { const b = i*2; ix.push(b,b+1,b+2, b+1,b+3,b+2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2));
  g.setIndex(ix);
  g.computeVertexNormals();
  return g;
}

/* ═══════════════════════════════════════════════════════
   GRASS FIELD
   ═══════════════════════════════════════════════════════ */
function GrassField() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => makeBladeGeo(), []);

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: gVert,
    fragmentShader: gFrag,
    uniforms: {
      uTime: { value: 0 },
      uWind: { value: CFG.windStrength },
      uSpeed: { value: CFG.windSpeed },
      uC1: { value: new THREE.Color('#1a4a18') },
      uC2: { value: new THREE.Color('#3d8a35') },
      uC3: { value: new THREE.Color('#7acc42') },
    },
    side: THREE.DoubleSide,
    transparent: true,
  }), []);

  // Stable pre-computed matrices
  const matrices = useMemo(() => {
    const r = seeded(42);
    const d = new THREE.Object3D();
    const arr = new Float32Array(CFG.grassCount * 16);

    for (let i = 0; i < CFG.grassCount; i++) {
      const x = (r() - 0.5) * CFG.fieldWidth;
      // All grass at z = -3 to -8 — a strip behind camera's ground line
      const z = -3 - r() * CFG.fieldDepth;
      const h = CFG.heightMin + r() * (CFG.heightMax - CFG.heightMin);
      const rotY = r() * Math.PI;
      const lean = (r() - 0.5) * 0.1;
      const wScale = 0.8 + r() * 0.5;

      d.position.set(x, 0, z);
      d.rotation.set(lean, rotY, 0);
      d.scale.set(wScale, h, 1);
      d.updateMatrix();
      d.matrix.toArray(arr, i * 16);
    }
    return arr;
  }, []);

  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    const tmp = new THREE.Matrix4();
    for (let i = 0; i < CFG.grassCount; i++) {
      tmp.fromArray(matrices, i * 16);
      m.setMatrixAt(i, tmp);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [matrices]);

  useFrame(({ clock }) => { mat.uniforms.uTime.value = clock.elapsedTime; });

  return <instancedMesh ref={meshRef} args={[geo, mat, CFG.grassCount]} frustumCulled={false} />;
}

/* ═══════════════════════════════════════════════════════
   MUSHROOM
   ═══════════════════════════════════════════════════════ */
function Mushroom({ idx }: { idx: number }) {
  const ref = useRef<THREE.Group>(null);
  const s = useRef({
    phase: 'dormant' as string,
    timer: idx * 1.5 + Math.random() * 2,
    max: 0.4 + Math.random() * 0.4,
    px: (Math.random() - 0.5) * CFG.fieldWidth * 0.6,
    pz: -3.5 - Math.random() * 3,
  });
  const col = ['#d44040','#c87030','#e8c840','#d06898','#40a0d0'][idx % 5];

  useFrame((_, dt) => {
    const g = ref.current; if (!g) return;
    const o = s.current;
    const d = Math.min(dt, 0.05);
    o.timer += d;

    if (o.phase === 'dormant') {
      g.visible = false;
      if (o.timer >= CFG.mushroomSpawnTime) {
        o.phase = 'grow'; o.timer = 0;
        o.px = (Math.random()-0.5) * CFG.fieldWidth * 0.6;
        o.pz = -3.5 - Math.random() * 3;
        o.max = 0.35 + Math.random() * 0.4;
        g.position.set(o.px, 0, o.pz);
        g.visible = true;
      }
    } else if (o.phase === 'grow') {
      const t = Math.min(o.timer / CFG.mushroomGrowTime, 1);
      const e = 1 - (1-t)*(1-t)*(1-t);
      g.scale.setScalar(e * o.max);
      g.position.y = -0.02 + e * 0.02;
      if (t >= 1) { o.phase = 'show'; o.timer = 0; }
    } else if (o.phase === 'show') {
      g.rotation.z = Math.sin(o.timer * 0.8 + idx) * 0.02;
      if (o.timer >= CFG.mushroomShowTime) { o.phase = 'hide'; o.timer = 0; }
    } else if (o.phase === 'hide') {
      const t = Math.min(o.timer / CFG.mushroomHideTime, 1);
      g.scale.setScalar((1 - t*t) * o.max);
      g.position.y = -t * 0.08;
      if (t >= 1) { o.phase = 'dormant'; o.timer = Math.random()*2; g.visible = false; }
    }
  });

  return (
    <group ref={ref} visible={false} scale={0}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.10, 6]} />
        <meshLambertMaterial color="#f0ead0" />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.08, 8, 6, 0, Math.PI*2, 0, Math.PI*0.55]} />
        <meshLambertMaterial color={col} />
      </mesh>
      {[0, 1.3, 2.6, 4.0].map((a, i) => (
        <mesh key={i} position={[Math.cos(a)*0.045, 0.14, Math.sin(a)*0.045]}>
          <sphereGeometry args={[0.01, 4, 4]} />
          <meshLambertMaterial color="#fff8f0" />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   BUTTERFLY
   ═══════════════════════════════════════════════════════ */
function Butterfly({ idx }: { idx: number }) {
  const ref = useRef<THREE.Group>(null);
  const lw = useRef<THREE.Mesh>(null);
  const rw = useRef<THREE.Mesh>(null);
  const st = useRef({
    t: Math.random(),
    sp: 0.3 + Math.random() * 0.3,
    ph: Math.random() * 6.28,
    path: makePath(),
  });
  const col = ['#6ab4e8','#e8a06a','#c890e0'][idx % 3];

  useFrame(({ clock }, dt) => {
    const g = ref.current; if (!g) return;
    const o = st.current;
    o.t += o.sp * Math.min(dt, 0.05) * 0.03;
    if (o.t >= 1) { o.t = 0; o.path = makePath(); }

    const p = crPoint(o.path, o.t);
    p.y += Math.sin(clock.elapsedTime * 1.2 + o.ph) * 0.05;
    g.position.copy(p);

    const flap = Math.sin(clock.elapsedTime * 5.5 + o.ph) * 0.55;
    if (lw.current) lw.current.rotation.y = flap;
    if (rw.current) rw.current.rotation.y = -flap;

    if (o.t + 0.02 < 1) {
      const nx = crPoint(o.path, o.t + 0.02);
      const d = nx.sub(p);
      if (d.length() > 0.001) g.rotation.y = Math.atan2(d.x, d.z);
    }
  });

  return (
    <group ref={ref} scale={0.3}>
      <mesh ref={lw} position={[0.02, 0, 0]}>
        <planeGeometry args={[0.22, 0.16]} />
        <meshLambertMaterial color={col} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
      <mesh ref={rw} position={[-0.02, 0, 0]}>
        <planeGeometry args={[0.22, 0.16]} />
        <meshLambertMaterial color={col} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.007, 0.1, 4]} />
        <meshLambertMaterial color="#333" />
      </mesh>
    </group>
  );
}

function makePath(): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < 6; i++) {
    pts.push(new THREE.Vector3(
      (Math.random()-0.5) * CFG.fieldWidth * 0.5,
      0.5 + Math.random() * 1.2,
      -3 - Math.random() * 3
    ));
  }
  return pts;
}

function crPoint(pts: THREE.Vector3[], t: number): THREE.Vector3 {
  const n = pts.length, st = t*(n-1), i = Math.floor(st), f = st-i;
  const p0=pts[Math.max(i-1,0)], p1=pts[Math.min(i,n-1)],
        p2=pts[Math.min(i+1,n-1)], p3=pts[Math.min(i+2,n-1)];
  const f2=f*f, f3=f2*f;
  return new THREE.Vector3(
    .5*(2*p1.x+(-p0.x+p2.x)*f+(2*p0.x-5*p1.x+4*p2.x-p3.x)*f2+(-p0.x+3*p1.x-3*p2.x+p3.x)*f3),
    .5*(2*p1.y+(-p0.y+p2.y)*f+(2*p0.y-5*p1.y+4*p2.y-p3.y)*f2+(-p0.y+3*p1.y-3*p2.y+p3.y)*f3),
    .5*(2*p1.z+(-p0.z+p2.z)*f+(2*p0.z-5*p1.z+4*p2.z-p3.z)*f2+(-p0.z+3*p1.z-3*p2.z+p3.z)*f3)
  );
}

/* ═══════════════════════════════════════════════════════
   POLLEN
   ═══════════════════════════════════════════════════════ */
function Pollen() {
  const ref = useRef<THREE.Points>(null);
  const { pos, vel } = useMemo(() => {
    const p = new Float32Array(CFG.particleCount * 3);
    const v = new Float32Array(CFG.particleCount * 3);
    for (let i = 0; i < CFG.particleCount; i++) {
      p[i*3]=(Math.random()-.5)*14; p[i*3+1]=0.3+Math.random()*2; p[i*3+2]=-3-Math.random()*4;
      v[i*3]=(Math.random()-.5)*.04; v[i*3+1]=(Math.random()-.3)*.015; v[i*3+2]=(Math.random()-.5)*.02;
    }
    return { pos: p, vel: v };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const a = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < CFG.particleCount; i++) {
      const x = i*3;
      a[x] += vel[x]*.016; a[x+2] += vel[x+2]*.016;
      a[x+1] += Math.sin(clock.elapsedTime*.25+i*.7)*.0003;
      if (a[x]>7) a[x]=-7; if (a[x]<-7) a[x]=7;
      if (a[x+1]>2.5) a[x+1]=0.3;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={pos} count={CFG.particleCount} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.018} color="#fffde0" transparent opacity={0.4} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════
   GROUND (hidden below grass)
   ═══════════════════════════════════════════════════════ */
function Ground() {
  return (
    <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.02, -5]}>
      <planeGeometry args={[CFG.fieldWidth + 10, CFG.fieldDepth + 12]} />
      <meshLambertMaterial color="#1e5518" />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════
   CAMERA — looking slightly down at grass tips
   Grass base is below the viewport bottom edge
   ═══════════════════════════════════════════════════════ */
function Cam() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 1.4, 0);
    camera.lookAt(0, 0.3, -6);
  }, [camera]);
  return null;
}

/* ═══════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════ */
export default function MeadowScene() {
  return (
    <Canvas
      camera={{ position: [0, 1.4, 0], fov: 50, near: 0.1, far: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, 1.5]}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <color attach="background" args={['#2a6e22']} />
        <fog attach="fog" args={['#2a6e22', 4, 12]} />

        <ambientLight intensity={0.6} color="#d0ecc0" />
        <directionalLight position={[4, 6, 2]} intensity={1.2} color="#fff8e0" />
        <directionalLight position={[-3, 3, -2]} intensity={0.3} color="#80c880" />
        <hemisphereLight args={['#90d0f0', '#1e5518', 0.4]} />

        <Ground />
        <GrassField />
        {Array.from({ length: CFG.mushroomMax }, (_, i) => <Mushroom key={i} idx={i} />)}
        {Array.from({ length: CFG.butterflyCount }, (_, i) => <Butterfly key={i} idx={i} />)}
        <Pollen />
        <Cam />
      </Suspense>
    </Canvas>
  );
}
