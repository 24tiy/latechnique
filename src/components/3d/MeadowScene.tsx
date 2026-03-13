import { useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Suspense } from 'react';

/* ═══════════════════════════════════════════════════════
   RESPONSIVE
   ═══════════════════════════════════════════════════════ */
function getDeviceTier(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1200) return 'tablet';
  return 'desktop';
}

/* ═══════════════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════════════ */
function getCfg() {
  const tier = getDeviceTier();
  const d = tier === 'mobile' ? 0.35 : tier === 'tablet' ? 0.6 : 1.0;

  return {
    grass: {
      foreCount: Math.floor(8000 * d),
      foreWidth: 30, foreDepthMin: -2, foreDepthMax: 4,
      foreHMin: 0.15, foreHMax: 0.45, foreBladeW: 0.012,

      midCount: Math.floor(5000 * d),
      midWidth: 34, midDepthMin: -6, midDepthMax: -2,
      midHMin: 0.1, midHMax: 0.3, midBladeW: 0.01,

      farCount: Math.floor(3000 * d),
      farWidth: 38, farDepthMin: -12, farDepthMax: -6,
      farHMin: 0.06, farHMax: 0.2, farBladeW: 0.008,
    },
    wind: { strength: 0.6, speed: 0.5, gustInterval: 7, gustDuration: 3 },
    mushroom: { count: tier === 'mobile' ? 3 : 5, spawnInterval: 4, growDur: 2.5, visibleDur: 6, shrinkDur: 3 },
    butterfly: { count: tier === 'mobile' ? 1 : tier === 'tablet' ? 2 : 3, speed: 0.25, flapSpeed: 5, radius: 1.2, push: 0.3 },
    pollen: { count: tier === 'mobile' ? 15 : tier === 'tablet' ? 30 : 50, speed: 0.04, spread: { x: 22, y: 2.5, z: 10 } },
  };
}

/* ═══════════════════════════════════════════════════════
   GRASS VERTEX SHADER
   ═══════════════════════════════════════════════════════ */
const grassVS = /* glsl */ `
  uniform float uTime;
  uniform float uWindStr;
  uniform float uWindSpd;
  uniform float uWindMul;
  uniform float uGustPhase;
  uniform vec2 uGustCenter;
  uniform vec3 uBfly[3];
  uniform float uBflyR;
  uniform float uBflyP;

  varying float vH;
  varying float vAO;
  varying vec2 vUv;

  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec2 mod289v2(vec2 x){return x-floor(x*(1./289.))*289.;}
  vec3 perm(vec3 x){return mod289(((x*34.)+1.)*x);}

  float snoise(vec2 v){
    const vec4 C=vec4(.211324865,.366025403,-.577350269,.024390243);
    vec2 i=floor(v+dot(v,C.yy));
    vec2 x0=v-i+dot(i,C.xx);
    vec2 i1=(x0.x>x0.y)?vec2(1,0):vec2(0,1);
    vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
    i=mod289v2(i);
    vec3 p=perm(perm(i.y+vec3(0,i1.y,1))+i.x+vec3(0,i1.x,1));
    vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
    m=m*m;m=m*m;
    vec3 x=2.*fract(p*C.www)-1.;
    vec3 h=abs(x)-.5;
    vec3 ox=floor(x+.5);
    vec3 a0=x-ox;
    m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
    vec3 g;
    g.x=a0.x*x0.x+h.x*x0.y;
    g.yz=a0.yz*x12.xz+h.yz*x12.yw;
    return 130.*dot(m,g);
  }

  vec2 bflyPush(vec3 wp,vec3 bp){
    vec2 dd=wp.xz-bp.xz;
    float dist=length(dd);
    if(dist>uBflyR||dist<.01)return vec2(0);
    float inf=(1.-dist/uBflyR);
    inf=inf*inf*uBflyP;
    float yf=1.-smoothstep(0.,1.,abs(wp.y-bp.y));
    return normalize(dd)*inf*max(yf,0.);
  }

  void main(){
    vUv=uv; vH=uv.y;
    vec3 pos=position;
    float bend=uv.y*uv.y;
    float t=uTime*uWindSpd;
    float w1=snoise(vec2(pos.x*.15+t*.4,pos.z*.15+t*.1))*.5;
    float w2=snoise(vec2(pos.x*.4+t*.7,pos.z*.3+t*.25))*.2;
    float w3=snoise(vec2(pos.x*1.+t*1.5,pos.z*.7))*.08;
    float tw=(w1+w2+w3)*uWindStr*uWindMul;
    float gd=length(pos.xz-uGustCenter);
    float gw=smoothstep(12.,0.,gd)*uGustPhase;
    tw+=gw*uWindStr*1.3;
    pos.x+=tw*bend;
    pos.z+=tw*bend*.15;
    pos.y-=abs(tw)*bend*.06;
    vec2 bp=vec2(0);
    for(int i=0;i<3;i++) bp+=bflyPush(pos,uBfly[i]);
    pos.x+=bp.x*bend;
    pos.z+=bp.y*bend;
    vAO=smoothstep(0.,.25,uv.y);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);
  }
`;

const grassFS = /* glsl */ `
  varying float vH;
  varying float vAO;
  varying vec2 vUv;
  uniform vec3 uCBase;
  uniform vec3 uCMid;
  uniform vec3 uCTip;
  uniform vec3 uCDark;
  uniform float uTime;

  void main(){
    vec3 c=mix(uCDark,uCBase,smoothstep(0.,.12,vH));
    c=mix(c,uCMid,smoothstep(.12,.45,vH));
    c=mix(c,uCTip,smoothstep(.45,1.,vH));
    c*=mix(.4,1.,vAO);
    c+=.01*smoothstep(.7,1.,vH);
    float a=mix(1.,.7,smoothstep(.85,1.,vH));
    gl_FragColor=vec4(c,a);
  }
`;

/* ═══════════════════════════════════════════════════════
   BLADE GEOMETRY — 8 segments, smooth thin tapered curved
   ═══════════════════════════════════════════════════════ */
function makeBlade(w: number): THREE.BufferGeometry {
  const segs = 8;
  const verts: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const hw = w * (1 - t * 0.95) * 0.5;
    const curve = t * t * 0.04;
    const s = Math.sin(t * Math.PI * 0.8) * 0.003;
    verts.push(-hw + s, t, curve);
    verts.push(hw + s, t, curve);
    uvs.push(0, t);
    uvs.push(1, t);
    if (i < segs) { const b = i * 2; idx.push(b, b+1, b+2, b+1, b+3, b+2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* ═══════════════════════════════════════════════════════
   SHARED STATE
   ═══════════════════════════════════════════════════════ */
const bflyPos = [new THREE.Vector3(999,999,999), new THREE.Vector3(999,999,999), new THREE.Vector3(999,999,999)];
const gust = { phase: 0, timer: 0, active: false, center: new THREE.Vector2(0, 0) };

/* ═══════════════════════════════════════════════════════
   GRASS LAYER
   ═══════════════════════════════════════════════════════ */
interface LayerProps {
  count: number; fieldW: number; depthMin: number; depthMax: number;
  hMin: number; hMax: number; bladeW: number;
  colorBase: string; colorMid: string; colorTip: string; colorDark: string;
  windMul: number;
}

function GrassLayer(p: LayerProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const cfg = useMemo(() => getCfg(), []);
  const geo = useMemo(() => makeBlade(p.bladeW), [p.bladeW]);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: grassVS, fragmentShader: grassFS,
    uniforms: {
      uTime: { value: 0 }, uWindStr: { value: cfg.wind.strength }, uWindSpd: { value: cfg.wind.speed },
      uWindMul: { value: p.windMul }, uGustPhase: { value: 0 }, uGustCenter: { value: new THREE.Vector2(0, 0) },
      uBfly: { value: [new THREE.Vector3(999,999,999), new THREE.Vector3(999,999,999), new THREE.Vector3(999,999,999)] },
      uBflyR: { value: cfg.butterfly.radius }, uBflyP: { value: cfg.butterfly.push },
      uCBase: { value: new THREE.Color(p.colorBase) }, uCMid: { value: new THREE.Color(p.colorMid) },
      uCTip: { value: new THREE.Color(p.colorTip) }, uCDark: { value: new THREE.Color(p.colorDark) },
    },
    side: THREE.DoubleSide, transparent: true,
  }), [p, cfg]);

  const inited = useRef(false);
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (!inited.current) {
      const d = new THREE.Object3D();
      for (let i = 0; i < p.count; i++) {
        const x = (Math.random() - 0.5) * p.fieldW;
        const z = p.depthMin + Math.random() * (p.depthMax - p.depthMin);
        const h = p.hMin + Math.random() * (p.hMax - p.hMin);
        d.position.set(x, 0, z);
        d.rotation.set((Math.random() - 0.5) * 0.25, Math.random() * Math.PI, 0);
        d.scale.set(0.6 + Math.random() * 0.8, h, 1);
        d.updateMatrix();
        meshRef.current!.setMatrixAt(i, d.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      inited.current = true;
    }
    const u = mat.uniforms;
    u.uTime.value = clock.elapsedTime;
    u.uGustPhase.value = gust.phase;
    u.uGustCenter.value.copy(gust.center);
    for (let i = 0; i < 3; i++) u.uBfly.value[i].copy(bflyPos[i]);
  });
  return <instancedMesh ref={meshRef} args={[geo, mat, p.count]} frustumCulled={false} />;
}

/* ═══════════════════════════════════════════════════════
   GUST
   ═══════════════════════════════════════════════════════ */
function GustCtrl() {
  const cfg = useMemo(() => getCfg(), []);
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05); gust.timer += d;
    if (!gust.active) {
      if (gust.timer >= cfg.wind.gustInterval) { gust.active = true; gust.timer = 0; gust.center.set((Math.random()-.5)*18, -Math.random()*6); }
    } else {
      const t = gust.timer / cfg.wind.gustDuration;
      if (t >= 1) { gust.active = false; gust.phase = 0; gust.timer = Math.random()*2; }
      else gust.phase = Math.sin(t * Math.PI) * 0.6;
    }
  });
  return null;
}

/* ═══════════════════════════════════════════════════════
   MUSHROOMS
   ═══════════════════════════════════════════════════════ */
interface MushState { pos: THREE.Vector3; phase: 'dormant'|'growing'|'visible'|'shrinking'; timer: number; maxS: number; curS: number; ci: number; }

function Mushrooms() {
  const grp = useRef<THREE.Group>(null);
  const ms = useRef<MushState[]>([]);
  const cfg = useMemo(() => getCfg(), []);
  const { capG, stemG, dotG } = useMemo(() => ({
    capG: new THREE.SphereGeometry(0.06, 10, 8, 0, Math.PI*2, 0, Math.PI*0.55),
    stemG: (() => { const g = new THREE.CylinderGeometry(0.014,0.02,0.07,6); g.translate(0,0.035,0); return g; })(),
    dotG: new THREE.SphereGeometry(0.008, 4, 4),
  }), []);
  const capMs = useMemo(() => [new THREE.MeshLambertMaterial({color:'#b83838'}), new THREE.MeshLambertMaterial({color:'#a86028'}), new THREE.MeshLambertMaterial({color:'#c89830'})], []);
  const stemM = useMemo(() => new THREE.MeshLambertMaterial({color:'#ede8d6'}), []);
  const dotM = useMemo(() => new THREE.MeshLambertMaterial({color:'#f5f0e8'}), []);

  useEffect(() => {
    if (!grp.current) return;
    const pool: MushState[] = [];
    for (let i = 0; i < cfg.mushroom.count; i++) {
      const p = new THREE.Vector3((Math.random()-.5)*14, 0, -Math.random()*2);
      const ci = Math.floor(Math.random()*3);
      pool.push({ pos: p, phase: 'dormant', timer: Math.random()*cfg.mushroom.spawnInterval, maxS: 0.4+Math.random()*0.4, curS: 0, ci });
      const mg = new THREE.Group(); mg.position.copy(p); mg.scale.setScalar(0);
      mg.add(new THREE.Mesh(stemG, stemM));
      const cap = new THREE.Mesh(capG, capMs[ci]); cap.position.y = 0.07; mg.add(cap);
      for (let d = 0; d < 4; d++) {
        const th = (d/4)*Math.PI*2+Math.random()*0.4, ph = 0.2+Math.random()*0.25, r = 0.05;
        const dot = new THREE.Mesh(dotG, dotM);
        dot.position.set(Math.sin(th)*Math.sin(ph)*r, 0.07+Math.cos(ph)*r*0.6, Math.cos(th)*Math.sin(ph)*r);
        dot.scale.setScalar(0.4+Math.random()*0.6); mg.add(dot);
      }
      grp.current.add(mg);
    }
    ms.current = pool;
  }, [capG, stemG, dotG, capMs, stemM, dotM, cfg]);

  useFrame(({ clock }, delta) => {
    if (!grp.current) return;
    const dt = Math.min(delta, 0.05);
    ms.current.forEach((m, i) => {
      const g = grp.current!.children[i] as THREE.Group; if (!g) return;
      m.timer += dt;
      switch (m.phase) {
        case 'dormant':
          if (m.timer >= cfg.mushroom.spawnInterval) { m.phase='growing'; m.timer=0; m.pos.x=(Math.random()-.5)*14; m.pos.z=-Math.random()*2; g.position.copy(m.pos); } break;
        case 'growing': { const t=Math.min(m.timer/cfg.mushroom.growDur,1); m.curS=(1-Math.pow(1-t,3))*m.maxS; g.scale.setScalar(m.curS); if(t>=1){m.phase='visible';m.timer=0;} break; }
        case 'visible': g.rotation.z=Math.sin(clock.elapsedTime*0.7+i*2)*0.025; if(m.timer>=cfg.mushroom.visibleDur){m.phase='shrinking';m.timer=0;} break;
        case 'shrinking': { const t=Math.min(m.timer/cfg.mushroom.shrinkDur,1); m.curS=(1-t*t)*m.maxS; g.scale.setScalar(Math.max(0,m.curS)); g.position.y=m.pos.y-t*0.04; if(t>=1){m.phase='dormant';m.timer=Math.random()*cfg.mushroom.spawnInterval*0.5;g.scale.setScalar(0);g.position.y=m.pos.y;} break; }
      }
    });
  });
  return <group ref={grp} />;
}

/* ═══════════════════════════════════════════════════════
   BUTTERFLIES
   ═══════════════════════════════════════════════════════ */
function Butterflies() {
  const grp = useRef<THREE.Group>(null);
  const cfg = useMemo(() => getCfg(), []);
  const sts = useRef<{t:number;spd:number;pts:THREE.Vector3[];wp:number;sz:number}[]>([]);
  const wGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0,0); s.bezierCurveTo(.05,.06,.1,.14,.06,.22); s.bezierCurveTo(.03,.17,.01,.12,0,.06);
    s.bezierCurveTo(-.01,.12,-.03,.17,-.06,.22); s.bezierCurveTo(-.1,.14,-.05,.06,0,0);
    return new THREE.ShapeGeometry(s, 3);
  }, []);
  const cols = useMemo(() => [new THREE.Color('#7abce0'),new THREE.Color('#daa080'),new THREE.Color('#c8a0d8')], []);
  const genPath = useCallback((): THREE.Vector3[] => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 6; i++) pts.push(new THREE.Vector3((Math.random()-.5)*16, 0.3+Math.random()*0.9, -Math.random()*2));
    return pts;
  }, []);
  const crSpline = useCallback((pts: THREE.Vector3[], t: number): THREE.Vector3 => {
    const n=pts.length,st=t*(n-1),i=Math.floor(st),f=st-i;
    const p0=pts[Math.max(i-1,0)],p1=pts[Math.min(i,n-1)],p2=pts[Math.min(i+1,n-1)],p3=pts[Math.min(i+2,n-1)];
    const f2=f*f,f3=f2*f;
    return new THREE.Vector3(
      .5*(2*p1.x+(-p0.x+p2.x)*f+(2*p0.x-5*p1.x+4*p2.x-p3.x)*f2+(-p0.x+3*p1.x-3*p2.x+p3.x)*f3),
      .5*(2*p1.y+(-p0.y+p2.y)*f+(2*p0.y-5*p1.y+4*p2.y-p3.y)*f2+(-p0.y+3*p1.y-3*p2.y+p3.y)*f3),
      .5*(2*p1.z+(-p0.z+p2.z)*f+(2*p0.z-5*p1.z+4*p2.z-p3.z)*f2+(-p0.z+3*p1.z-3*p2.z+p3.z)*f3)
    );
  }, []);

  useEffect(() => {
    if (!grp.current) return;
    const st: typeof sts.current = [];
    for (let i = 0; i < cfg.butterfly.count; i++) {
      const s = {t:Math.random(),spd:cfg.butterfly.speed*(0.5+Math.random()*1),pts:genPath(),wp:Math.random()*Math.PI*2,sz:0.4+Math.random()*0.3};
      st.push(s);
      const bg = new THREE.Group();
      const wm = new THREE.MeshLambertMaterial({color:cols[i%3],side:THREE.DoubleSide,transparent:true,opacity:0.75});
      const lw = new THREE.Mesh(wGeo,wm); lw.rotation.z=0.2; lw.position.x=0.004; bg.add(lw);
      const rw = new THREE.Mesh(wGeo,wm.clone()); rw.scale.x=-1; rw.rotation.z=-0.2; rw.position.x=-0.004; bg.add(rw);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.004,0.003,0.04,4),new THREE.MeshLambertMaterial({color:'#333'}));
      body.rotation.x=Math.PI/2; body.position.y=0.1; bg.add(body);
      bg.scale.setScalar(s.sz); grp.current.add(bg);
    }
    sts.current = st;
  }, [wGeo,genPath,cols,cfg]);

  useFrame(({ clock }, delta) => {
    if (!grp.current) return;
    const dt = Math.min(delta, 0.05);
    sts.current.forEach((b, i) => {
      const bg = grp.current!.children[i] as THREE.Group; if (!bg) return;
      b.t += b.spd*dt*0.035; if (b.t>=1){b.t=0;b.pts=genPath();}
      const pos = crSpline(b.pts,b.t); pos.y += Math.sin(clock.elapsedTime*1.1+b.wp)*0.05;
      bg.position.copy(pos); bflyPos[i].copy(pos);
      const flap = Math.sin(clock.elapsedTime*cfg.butterfly.flapSpeed+b.wp)*0.55;
      if(bg.children[0])(bg.children[0] as THREE.Mesh).rotation.z=0.2+flap;
      if(bg.children[1])(bg.children[1] as THREE.Mesh).rotation.z=-0.2-flap;
      if(b.t+0.01<1){ const np=crSpline(b.pts,Math.min(b.t+0.01,0.999)); const dir=np.sub(pos).normalize(); if(dir.length()>0.001)bg.rotation.y=Math.atan2(dir.x,dir.z); }
    });
  });
  return <group ref={grp} />;
}

/* ═══════════════════════════════════════════════════════
   POLLEN
   ═══════════════════════════════════════════════════════ */
function Pollen() {
  const ref = useRef<THREE.Points>(null);
  const cfg = useMemo(() => getCfg(), []);
  const { positions, velocities } = useMemo(() => {
    const p = new Float32Array(cfg.pollen.count*3), v = new Float32Array(cfg.pollen.count*3);
    for (let i = 0; i < cfg.pollen.count; i++) {
      p[i*3]=(Math.random()-.5)*cfg.pollen.spread.x; p[i*3+1]=Math.random()*cfg.pollen.spread.y+0.1; p[i*3+2]=(Math.random()-.5)*cfg.pollen.spread.z;
      v[i*3]=(Math.random()-.5)*cfg.pollen.speed; v[i*3+1]=(Math.random()-.3)*cfg.pollen.speed*0.25; v[i*3+2]=(Math.random()-.5)*cfg.pollen.speed*0.15;
    }
    return { positions: p, velocities: v };
  }, [cfg]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const a = ref.current.geometry.attributes.position.array as Float32Array, t = clock.elapsedTime;
    for (let i = 0; i < cfg.pollen.count; i++) {
      const x=i*3; a[x]+=velocities[x]*0.016; a[x+1]+=Math.sin(t*0.15+i*0.4)*0.0002; a[x+2]+=velocities[x+2]*0.016;
      const hx=cfg.pollen.spread.x*0.5;
      if(a[x]>hx)a[x]=-hx; if(a[x]<-hx)a[x]=hx;
      if(a[x+1]>cfg.pollen.spread.y+0.3)a[x+1]=0.1; if(a[x+1]<0)a[x+1]=cfg.pollen.spread.y;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" array={positions} count={cfg.pollen.count} itemSize={3} /></bufferGeometry>
      <pointsMaterial size={0.015} color="#fffce0" transparent opacity={0.4} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ═══════════════════════════════════════════════════════
   GROUND — dark green, grass grows from y=0
   ═══════════════════════════════════════════════════════ */
function Ground() {
  return (
    <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.01, -2]}>
      <planeGeometry args={[50, 24]} />
      <meshLambertMaterial color="#1e4e18" />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════
   CAMERA — looking slightly down at the meadow
   ═══════════════════════════════════════════════════════ */
function Cam() {
  const { camera } = useThree();
  useEffect(() => { camera.position.set(0, 2.0, 6); camera.lookAt(0, 0.2, 0); }, [camera]);
  return null;
}

/* ═══════════════════════════════════════════════════════
   TRANSPARENT BACKGROUND — sky shows through
   ═══════════════════════════════════════════════════════ */
function ClearBg() {
  const { gl, scene } = useThree();
  useEffect(() => { scene.background = null; gl.setClearColor(0x000000, 0); }, [gl, scene]);
  return null;
}

/* ═══════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════ */
export default function MeadowScene() {
  const cfg = useMemo(() => getCfg(), []);
  return (
    <Canvas
      camera={{ position: [0, 2, 6], fov: 45, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, 1.5]}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <ClearBg />
        <fog attach="fog" args={[new THREE.Color('#2a6822'), 6, 18]} />
        <ambientLight intensity={0.55} color="#d0e8c8" />
        <directionalLight position={[4,8,3]} intensity={0.9} color="#fff8e0" />
        <directionalLight position={[-3,5,-2]} intensity={0.25} color="#88c088" />
        <hemisphereLight args={['#c0d8e8','#1e4e18',0.35]} />
        <Ground />
        <GrassLayer count={cfg.grass.foreCount} fieldW={30} depthMin={-2} depthMax={4} hMin={0.15} hMax={0.45} bladeW={0.012} colorBase="#2e6b28" colorMid="#4a8e3e" colorTip="#8cc46a" colorDark="#1a3e16" windMul={1.0} />
        <GrassLayer count={cfg.grass.midCount} fieldW={34} depthMin={-6} depthMax={-2} hMin={0.1} hMax={0.3} bladeW={0.01} colorBase="#3a7832" colorMid="#5c9e4c" colorTip="#9aca78" colorDark="#234a1c" windMul={0.8} />
        <GrassLayer count={cfg.grass.farCount} fieldW={38} depthMin={-12} depthMax={-6} hMin={0.06} hMax={0.2} bladeW={0.008} colorBase="#3a7030" colorMid="#5c9648" colorTip="#90b870" colorDark="#284e1e" windMul={0.55} />
        <GustCtrl />
        <Mushrooms />
        <Butterflies />
        <Pollen />
        <Cam />
      </Suspense>
    </Canvas>
  );
}
