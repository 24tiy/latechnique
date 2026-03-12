import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Center, Text3D, Environment } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const BASE = import.meta.env.BASE_URL;

function FooterGlassText({ progress }: { progress: React.MutableRefObject<{ v: number }> }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const p = progress.current.v;

    const sp = p * p * (3 - 2 * p);

    const rotP = Math.min(sp / 0.8, 1);
    groupRef.current.rotation.y = (1 - rotP) * Math.PI * 4;
    
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.15, 1, sp));
    
    groupRef.current.position.y = THREE.MathUtils.lerp(3.5, 0, sp);
    
    groupRef.current.position.z = THREE.MathUtils.lerp(-20, 0, sp);
  });

  return (
    <group ref={groupRef}>
      <Center>
        <Text3D
          font={`${BASE}fonts/great_vibes.typeface.json`}
          size={1.3}
          height={0.05}
          bevelEnabled
          bevelThickness={0.12}
          bevelSize={0.06}
          bevelSegments={16}
          curveSegments={48}
          letterSpacing={-0.02}
        >
          LaTechNique
          <meshPhysicalMaterial
            transmission={1}
            roughness={0.05}
            thickness={1.5}
            ior={1.5}
            envMapIntensity={2}
            clearcoat={1}
            clearcoatRoughness={0}
            transparent
            opacity={1}
            color="#ffffff"
            attenuationDistance={2}
            attenuationColor="#c8e8ff"
            side={THREE.DoubleSide}
            specularIntensity={1}
            specularColor="#ffffff"
          />
        </Text3D>
      </Center>
    </group>
  );
}

function FooterScrollController({ progress }: { progress: React.MutableRefObject<{ v: number }> }) {
  const { camera } = useThree();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(progress.current, {
        v: 1,
        ease: 'power2.inOut',
        scrollTrigger: {
          trigger: 'footer',
          start: 'top 80%',
          end: 'center center',
          scrub: 1.5,
        },
      });
    });
    return () => ctx.revert();
  }, [progress]);

  useFrame(() => {
    camera.position.set(0, 0.3, 8.5);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function FooterCanvas() {
  const progress = useRef({ v: 0 });

  return (
    <div id="footer-3d-section" className="w-full h-[70vh]">
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
          <Environment
            preset="dawn"
            environmentIntensity={1.5}
          />
          <ambientLight intensity={1} color="#d0e8ff" />
          <directionalLight position={[5, 10, 5]} intensity={2.5} color="#ffffff" />
          <directionalLight position={[-3, 6, -2]} intensity={1} color="#a0d0ff" />
          <pointLight position={[0, 2, 6]} intensity={1.5} color="#ffffff" />

          <FooterGlassText progress={progress} />
          <FooterScrollController progress={progress} />
        </Suspense>
      </Canvas>
    </div>
  );
}
