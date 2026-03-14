import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

const LightStreaks = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 200;
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const speeds = useMemo(() => new Float32Array(count), []);

  useMemo(() => {
    for (let i = 0; i < count; i++) {
      speeds[i] = Math.random() * 2 + 1;
    }
  }, [count, speeds]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    for (let i = 0; i < count; i++) {
      meshRef.current.getMatrixAt(i, dummy.matrix);
      dummy.position.setFromMatrixPosition(dummy.matrix);
      
      // Move closer to camera
      dummy.position.z += speeds[i] * delta * 50;
      
      // Reset position if passed camera
      if (dummy.position.z > 10) {
        dummy.position.z = -200;
        dummy.position.x = (Math.random() - 0.5) * 100;
        dummy.position.y = (Math.random() - 0.5) * 100;
      }
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, count]} position={[0, 0, -50]}>
      <boxGeometry args={[0.2, 0.2, 15]} />
      <meshBasicMaterial color="#ff2800" transparent opacity={0.6} />
    </instancedMesh>
  );
};

const SpeedParticles = () => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = 500;
    
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const speeds = useMemo(() => new Float32Array(count), []);
  
    useMemo(() => {
      for (let i = 0; i < count; i++) {
        speeds[i] = Math.random() * 1.5 + 0.5;
      }
    }, [count, speeds]);
  
    useFrame((state, delta) => {
      if (!meshRef.current) return;
      
      for (let i = 0; i < count; i++) {
        meshRef.current.getMatrixAt(i, dummy.matrix);
        dummy.position.setFromMatrixPosition(dummy.matrix);
        
        dummy.position.z += speeds[i] * delta * 40;
        
        if (dummy.position.z > 5) {
          dummy.position.z = -150;
          dummy.position.x = (Math.random() - 0.5) * 80;
          dummy.position.y = (Math.random() - 0.5) * 80;
        }
        
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    });
  
    return (
      <instancedMesh ref={meshRef} args={[null as any, null as any, count]} position={[0, 0, -50]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color="#00d2ff" transparent opacity={0.8} />
      </instancedMesh>
    );
};

const Scene3D: React.FC<{ isIntro?: boolean }> = ({ isIntro = false }) => {
    const cameraRef = useRef<any>(null);

    // Intro Animation
    React.useEffect(() => {
        if (isIntro && cameraRef.current) {
            // Initial position far back and moving fast
            cameraRef.current.position.set(0, 0, 100);
            
            gsap.to(cameraRef.current.position, {
                z: 5,
                duration: 2.5,
                ease: 'power3.inOut',
            });
        }
    }, [isIntro]);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
            <Canvas>
                 <PerspectiveCamera makeDefault ref={cameraRef} position={[0, 0, 5]} fov={75} />
                 <ambientLight intensity={0.5} />
                 <LightStreaks />
                 <SpeedParticles />
                 <Stars radius={100} depth={50} count={2000} factor={4} saturation={1} fade speed={2} />
                 
                 {/* Track Floor Grid */}
                 <gridHelper args={[200, 50, '#ff2800', '#222222']} position={[0, -10, 0]} />
            </Canvas>
        </div>
    );
};

export default Scene3D;
