import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture, Text, Line } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { VisualizationViewModel } from '../viewmodels/useVisualizationViewModel';
import type { SimulatorViewModel } from '../viewmodels/useSimulatorViewModel';

interface Props {
  visualization: VisualizationViewModel;
  simulator: SimulatorViewModel;
}

const Earth = () => {
  const [day, bump] = useTexture([
    '/textures/planets/earth_day_4096.jpg',
    '/textures/planets/earth_bump_roughness_clouds_4096.jpg'
  ]);
  
  const earthRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={earthRef} position={[-10, 0, 0]}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial 
        map={day} 
        bumpMap={bump}
        bumpScale={0.05}
        roughness={0.8}
      />
      {/* Atmosphere glow proxy */}
      <mesh>
        <sphereGeometry args={[1.05, 32, 32]} />
        <meshBasicMaterial color="#4db2ff" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </mesh>
    </mesh>
  );
}

const TargetStar = () => {
  return (
    <mesh position={[10, 0, 0]}>
      <sphereGeometry args={[1.2, 64, 64]} />
      {/* High color values for Bloom to pick up (toneMapped=false is default in R3F for raw values) */}
      <meshBasicMaterial color={[2, 1.5, 1]} toneMapped={false} />
    </mesh>
  );
}

const Spaceship = ({ 
  isPlaying, 
  animationProgress, 
  setAnimationProgress 
}: { 
  isPlaying: boolean; 
  animationProgress: number; 
  setAnimationProgress: (p: number) => void; 
}) => {
  const shipRef = useRef<THREE.Group>(null);
  
  useFrame((_state, delta) => {
    if (isPlaying) {
      let nextProgress = animationProgress + delta * 0.2; // 5 seconds for full trip
      if (nextProgress >= 1) {
        nextProgress = 0; // loop
      }
      setAnimationProgress(nextProgress);
    }
    
    if (shipRef.current) {
      // Map progress 0..1 to x: -9..9
      const x = -9 + animationProgress * 18;
      shipRef.current.position.set(x, 0, 0);
    }
  });

  return (
    <group ref={shipRef}>
      <mesh rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.2, 0.6, 8]} />
        <meshStandardMaterial color="#eeeeee" metalness={0.5} roughness={0.2} />
      </mesh>
      <mesh position={[-0.3, 0, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={[1, 0.5, 2]} toneMapped={false} />
      </mesh>
    </group>
  );
}

const DistanceBars = ({ 
  distanceLy, 
  contractedScale 
}: { 
  distanceLy: number; 
  contractedScale: number; 
}) => {
  // Use springs or direct lerp for smooth scaling
  const contractedGroupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (contractedGroupRef.current) {
      // Lerp the scale of the contracted bar
      contractedGroupRef.current.scale.x = THREE.MathUtils.lerp(
        contractedGroupRef.current.scale.x,
        contractedScale,
        0.1
      );
    }
  });

  return (
    <group position={[0, -2, 0]}>
      {/* Rest frame bar */}
      <Line 
        points={[[-10, 0, 0], [10, 0, 0]]} 
        color="#4db2ff" 
        lineWidth={2} 
        dashed={false} 
      />
      <Text position={[0, 0.5, 0]} fontSize={0.5} color="#4db2ff" anchorY="bottom">
        Rest Frame: {distanceLy.toLocaleString()} ly
      </Text>

      {/* Contracted frame bar */}
      <group position={[-10, -1, 0]}>
        <group ref={contractedGroupRef}>
          <Line 
            points={[[0, 0, 0], [20, 0, 0]]} 
            color="#ffaa00" 
            lineWidth={4} 
          />
        </group>
        <Text position={[10, -0.5, 0]} fontSize={0.5} color="#ffaa00" anchorY="top">
          Contracted: {(distanceLy * contractedScale).toPrecision(3)} ly
        </Text>
      </group>
    </group>
  );
}

export const Visualization: React.FC<Props> = ({ visualization, simulator }) => {
  return (
    <div className="w-full h-full bg-black relative rounded-lg overflow-hidden border border-slate-700">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <color attach="background" args={['#050510']} />
        
        <ambientLight intensity={0.2} />
        <directionalLight position={[-5, 5, 5]} intensity={2} />
        <pointLight position={[10, 0, 0]} intensity={5} color="#ffccaa" distance={50} />

        <Earth />
        <TargetStar />
        
        <DistanceBars 
          distanceLy={simulator.distanceLy} 
          contractedScale={visualization.contractedDistanceScale} 
        />
        
        <Spaceship 
          isPlaying={visualization.isPlaying}
          animationProgress={visualization.animationProgress}
          setAnimationProgress={visualization.setAnimationProgress}
        />

        {/* 500+ particles starfield as per PRD */}
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
        
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          maxDistance={50}
          minDistance={2}
        />

        <EffectComposer>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
