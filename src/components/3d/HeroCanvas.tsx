import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Center,
  Text3D,
  Environment,
} from '@react-three/drei';
import * as THREE from 'three';

const BASE = import.meta.env.BASE_URL;

type ProgressRef = React.MutableRefObject<{ v: number }>;

function ClearBackground() {
  const { gl, scene } = useThree();
  scene.background = null;
  gl.setClearColor(0x000000, 0);
  return null;
}

/* ---- Glass Text with glass→white transition ---- */
function GlassText({ progress }: { progress: ProgressRef }) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const p = progress.current.v;

    const rotP = Math.min(p / 0.8, 1);
    const easedRot = rotP * rotP * (3 - 2 * rotP);
    groupRef.current.rotation.y = easedRot * Math.PI * 2;

    const cappedP = Math.min(p, 1);
    const scale = THREE.MathUtils.lerp(1, 0.14, cappedP);
    groupRef.current.scale.setScalar(scale);

    groupRef.current.position.set(0, cappedP * 2.7, 0);

    const whiteP = THREE.MathUtils.clamp((p - 0.4) / 0.4, 0, 1);
    const easedWhite = whiteP * whiteP * (3 - 2 * whiteP);

    if (matRef.current) {
      matRef.current.transmission = THREE.MathUtils.lerp(0.97, 0, easedWhite);
      matRef.current.roughness = THREE.MathUtils.lerp(0, 0.5, easedWhite);
      matRef.current.envMapIntensity = THREE.MathUtils.lerp(1.8, 0, easedWhite);
      matRef.current.clearcoat = THREE.MathUtils.lerp(1, 0, easedWhite);
      matRef.current.ior = THREE.MathUtils.lerp(1.45, 1, easedWhite);
      matRef.current.thickness = THREE.MathUtils.lerp(2.5, 0, easedWhite);
    }

    window.dispatchEvent(new CustomEvent('hero-progress', { detail: p }));
  });

  return (
    <group ref={groupRef}>
      <Center>
        <Text3D
          font={`${BASE}fonts/dancing_script.typeface.json`}
          size={1.5}
          height={0.18}
          bevelEnabled
          bevelThickness={0.18}
          bevelSize={0.18}
          bevelSegments={32}
          curveSegments={64}
          letterSpacing={-0.08}
        >
          La
          <meshPhysicalMaterial
            ref={matRef}
            transmission={0.97}
            roughness={0.0}
            thickness={2.5}
            ior={1.45}
            envMapIntensity={1.8}
            clearcoat={1}
            clearcoatRoughness={0}
            transparent
            opacity={1}
            color="#ffffff"
            attenuationDistance={8}
            attenuationColor="#90c8ff"
            side={THREE.FrontSide}
            specularIntensity={1}
            specularColor="#ffffff"
            metalness={0}
            reflectivity={0.5}
          />
        </Text3D>
      </Center>
    </group>
  );
}

/* ---- Edge glow (follows same transform) ---- */
function GlassEdge({ progress }: { progress: ProgressRef }) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const p = progress.current.v;

    const rotP = Math.min(p / 0.8, 1);
    const easedRot = rotP * rotP * (3 - 2 * rotP);
    groupRef.current.rotation.y = easedRot * Math.PI * 2;

    const cappedP = Math.min(p, 1);
    const scale = THREE.MathUtils.lerp(1, 0.14, cappedP);
    groupRef.current.scale.setScalar(scale);
    groupRef.current.position.set(0, cappedP * 2.7, 0);

    const whiteP = THREE.MathUtils.clamp((p - 0.4) / 0.4, 0, 1);
    if (matRef.current) {
      matRef.current.opacity = THREE.MathUtils.lerp(0.08, 0, whiteP);
    }
  });

  return (
    <group ref={groupRef}>
      <Center>
        <Text3D
          font={`${BASE}fonts/dancing_script.typeface.json`}
          size={1.5}
          height={0.18}
          bevelEnabled
          bevelThickness={0.18}
          bevelSize={0.18}
          bevelSegments={32}
          curveSegments={64}
          letterSpacing={-0.08}
        >
          La
          <meshBasicMaterial
            ref={matRef}
            color="#c0e0ff"
            transparent
            opacity={0.08}
            side={THREE.BackSide}
          />
        </Text3D>
      </Center>
    </group>
  );
}

/* ---- Sparkles ---- */
function Sparkles({ progress }: { progress: ProgressRef }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 30;
  const positions = useMemo(
    () => Float32Array.from(Array.from({ length: count * 3 }, (_, i) =>
      i % 3 === 2 ? (Math.random() - 0.5) * 20 - 5 : (Math.random() - 0.5) * 18
    )),
    []
  );

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const arr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += Math.sin(clock.elapsedTime * 0.5 + i * 0.7) * 0.001;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = THREE.MathUtils.lerp(0.4, 0, Math.min(progress.current.v * 2, 1));
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#ffffff" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

function ScrollController({ progress }: { progress: ProgressRef }) {
  const { camera } = useThree();

  useFrame(() => {
    const heroEl = document.getElementById('hero-scroll');
    if (heroEl) {
      const rect = heroEl.getBoundingClientRect();
      const totalScroll = heroEl.offsetHeight - window.innerHeight;
      if (totalScroll > 0) {
        const scrolled = -rect.top;
        const raw = scrolled / totalScroll;
        progress.current.v = Math.min(Math.max(raw, 0), 1);
      }
    }

    camera.position.set(0, 0.3, 8.5);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function HeroCanvas() {
  const progress = useRef({ v: 0 });

  return (
    <Canvas
      camera={{ position: [0, 0.3, 8.5], fov: 40 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.6,
      }}
      dpr={[1, 2]}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <ClearBackground />
        <Environment
          preset="city"
          environmentIntensity={1.0}
        />

        <ambientLight intensity={1.5} color="#ffffff" />
        <directionalLight position={[5, 10, 5]} intensity={3.5} color="#ffffff" />
        <directionalLight position={[-3, 6, -2]} intensity={1.5} color="#c0e0ff" />
        <pointLight position={[0, 1, 8]} intensity={2} color="#ffffff" />
        <pointLight position={[2, -1, -3]} intensity={1.5} color="#80c0ff" />

        <GlassEdge progress={progress} />
        <GlassText progress={progress} />
        <Sparkles progress={progress} />
        <ScrollController progress={progress} />
      </Suspense>
    </Canvas>
  );
}
