import { useEffect, useRef, type FC } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture, Text, Line } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { VisualizationViewModel } from '../viewmodels/useVisualizationViewModel';
import type { SimulatorViewModel } from '../viewmodels/useSimulatorViewModel';
import {
  getTripStateAtProgress,
  contractedScaleAtVelocity,
} from '../services/journeyAnimation';

interface Props {
  visualization: VisualizationViewModel;
  simulator: SimulatorViewModel;
}

const LINE_LEFT = -10;
const LINE_RIGHT = 10;
const PATH_SPAN = LINE_RIGHT - LINE_LEFT;

const Earth = () => {
  const [day, bump] = useTexture([
    '/textures/planets/earth_day_4096.jpg',
    '/textures/planets/earth_bump_roughness_clouds_4096.jpg',
  ]);

  const earthRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={earthRef} position={[LINE_LEFT, 0, 0]}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial map={day} bumpMap={bump} bumpScale={0.05} roughness={0.8} />
      <mesh>
        <sphereGeometry args={[1.05, 32, 32]} />
        <meshBasicMaterial color="#4db2ff" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </mesh>
    </mesh>
  );
};

const TargetStar = () => {
  return (
    <mesh position={[LINE_RIGHT, 0, 0]}>
      <sphereGeometry args={[1.2, 64, 64]} />
      <meshBasicMaterial color={[2, 1.5, 1]} toneMapped={false} />
    </mesh>
  );
};

/** Small bloom-friendly “sun” at the end of the contracted-distance bar. */
const ContractedEndpointSun = () => (
  <mesh position={[20, 0, 0]}>
    <sphereGeometry args={[0.35, 24, 24]} />
    <meshBasicMaterial color={[2.2, 1.4, 0.6]} toneMapped={false} />
  </mesh>
);

interface SceneRigProps {
  simulator: SimulatorViewModel;
  visualization: VisualizationViewModel;
}

function SceneRig({ simulator, visualization }: SceneRigProps) {
  const journey = simulator.journeyResult;
  const distanceLy = simulator.distanceLy;
  const peakContractedScale = visualization.contractedDistanceScale;
  const isPlaying = visualization.isPlaying;
  const resetGen = visualization.playbackResetGeneration;
  const lorentzFactor = simulator.lorentzFactor;

  const shipRef = useRef<THREE.Group>(null);
  const contractedGroupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(0);
  const lastResetGenRef = useRef(resetGen);
  const journeyKeyRef = useRef('');

  const journeyKey = `${journey.earthTime}|${journey.shipTime}|${journey.peakVelocity}|${distanceLy}|${journey.phases.accel.distance}|${journey.phases.coast?.distance ?? 0}|${journey.phases.decel.distance}`;

  useEffect(() => {
    if (resetGen !== lastResetGenRef.current) {
      lastResetGenRef.current = resetGen;
      progressRef.current = 0;
    }
  }, [resetGen]);

  useEffect(() => {
    if (journeyKeyRef.current !== journeyKey) {
      journeyKeyRef.current = journeyKey;
      progressRef.current = 0;
    }
    if (contractedGroupRef.current) {
      contractedGroupRef.current.scale.x = peakContractedScale;
    }
  }, [journeyKey, peakContractedScale, resetGen]);

  useFrame((_state, delta) => {
    if (isPlaying) {
      progressRef.current += delta * 0.055;
      if (progressRef.current >= 1) {
        progressRef.current -= 1;
      }
    }

    const { pathFraction, velocityC } = getTripStateAtProgress(journey, distanceLy, progressRef.current);
    const x = LINE_LEFT + pathFraction * PATH_SPAN;
    if (shipRef.current) {
      shipRef.current.position.set(x, 0, 0);
    }

    const targetScale = isPlaying
      ? contractedScaleAtVelocity(velocityC, lorentzFactor)
      : peakContractedScale;

    if (contractedGroupRef.current) {
      contractedGroupRef.current.scale.x = THREE.MathUtils.lerp(
        contractedGroupRef.current.scale.x,
        targetScale,
        0.15
      );
    }
  });

  const contractedLyDisplay = distanceLy * peakContractedScale;

  return (
    <>
      <Earth />
      <TargetStar />

      <group position={[0, -2, 0]}>
        <Line
          points={[
            [LINE_LEFT, 0, 0],
            [LINE_RIGHT, 0, 0],
          ]}
          color="#7eb8ff"
          lineWidth={2}
          dashed
          dashScale={2}
          dashSize={0.45}
          gapSize={0.35}
        />
        <Text position={[0, 0.55, 0]} fontSize={0.45} color="#7eb8ff" anchorY="bottom">
          Rest frame: {distanceLy.toLocaleString()} ly
        </Text>

        <group position={[LINE_LEFT, -1.1, 0]}>
          <group ref={contractedGroupRef} scale={[peakContractedScale, 1, 1]}>
            <Line points={[[0, 0, 0], [20, 0, 0]]} color="#ffaa44" lineWidth={4} />
            <ContractedEndpointSun />
          </group>
          <Text position={[10, -0.55, 0]} fontSize={0.45} color="#ffaa44" anchorY="top">
            Contracted (at speed): {contractedLyDisplay.toPrecision(3)} ly
          </Text>
        </group>
      </group>

      <group ref={shipRef} position={[LINE_LEFT, 0, 0]}>
        <mesh rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.2, 0.6, 8]} />
          <meshStandardMaterial color="#eeeeee" metalness={0.5} roughness={0.2} />
        </mesh>
        <mesh position={[-0.3, 0, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color={[1, 0.5, 2]} toneMapped={false} />
        </mesh>
      </group>
    </>
  );
}

export const Visualization: FC<Props> = ({ visualization, simulator }) => {
  return (
    <div className="w-full h-full bg-black relative rounded-lg overflow-hidden border border-slate-700">
      <Canvas
        camera={{ position: [0, 7, 38], fov: 40, near: 0.1, far: 200 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#050510']} />

        <ambientLight intensity={0.2} />
        <directionalLight position={[-5, 8, 8]} intensity={2} />
        <pointLight position={[LINE_RIGHT, 0, 0]} intensity={5} color="#ffccaa" distance={80} />

        <SceneRig simulator={simulator} visualization={visualization} />

        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

        <OrbitControls
          makeDefault
          target={[0, -0.5, 0]}
          enablePan
          enableZoom
          enableRotate
          minDistance={18}
          maxDistance={95}
          maxPolarAngle={Math.PI * 0.55}
        />

        <EffectComposer>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
