import { useEffect, useMemo, useRef, useState, type FC, type MutableRefObject } from 'react';
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

/** Earth surface-ish start for rulers (avoid z-fight with sphere center). */
const RULER_X0 = LINE_LEFT + 1.05;
/** Rest ghost star center at LINE_RIGHT; pull line end slightly inward. */
const RULER_X1_REST = LINE_RIGHT - 1.2;

const Earth = () => {
  const base = import.meta.env.BASE_URL;
  const [day, bump] = useTexture([
    `${base}textures/planets/earth_day_4096.jpg`,
    `${base}textures/planets/earth_bump_roughness_clouds_4096.jpg`,
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

/** Rest-frame destination (lab distance): dim “shadow” star. */
const RestFrameGhostTarget = () => (
  <group position={[LINE_RIGHT, 0, 0]}>
    <mesh>
      <sphereGeometry args={[1.2, 32, 32]} />
      <meshBasicMaterial color="#334" transparent opacity={0.28} depthWrite={false} />
    </mesh>
  </group>
);

const TravelerTargetStar = () => (
  <mesh>
    <sphereGeometry args={[1.2, 64, 64]} />
    <meshBasicMaterial color={[2, 1.5, 1]} toneMapped={false} />
  </mesh>
);

/**
 * Solid orange segment from Earth to traveler star — same span as ship path.
 * Updated imperatively so we do not spam React state each frame.
 */
function TravelerCorridorLine({ liveScaleRef }: { liveScaleRef: MutableRefObject<number> }) {
  const lineObj = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const mat = new THREE.LineBasicMaterial({ color: '#ff9944' });
    return new THREE.Line(geom, mat);
  }, []);

  useFrame(() => {
    const scale = liveScaleRef.current;
    const span = PATH_SPAN * scale;
    const x1 = LINE_LEFT + Math.max(span - 1.15, RULER_X0 + 0.15);
    const geom = lineObj.geometry as THREE.BufferGeometry;
    const arr = geom.attributes.position.array as Float32Array;
    /* eslint-disable react-hooks/immutability -- intentional Three.js buffer mutation in useFrame */
    arr[0] = RULER_X0;
    arr[1] = -0.32;
    arr[2] = 0.04;
    arr[3] = x1;
    arr[4] = -0.32;
    arr[5] = 0.04;
    /* eslint-enable react-hooks/immutability */
    geom.attributes.position.needsUpdate = true;
  });

  useEffect(() => {
    return () => {
      lineObj.geometry.dispose();
      (lineObj.material as THREE.Material).dispose();
    };
  }, [lineObj]);

  return <primitive object={lineObj} />;
}

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
  const travelerTargetRef = useRef<THREE.Group>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const liveScaleRef = useRef(peakContractedScale);
  const progressRef = useRef(0);
  const lastResetGenRef = useRef(resetGen);
  const journeyKeyRef = useRef('');

  const [hudContractedLy, setHudContractedLy] = useState(
    () => distanceLy * peakContractedScale
  );
  const hudFrameCounter = useRef(0);

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
    const peak = peakContractedScale;
    liveScaleRef.current = peak;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync needed to seed HUD before first frame
    setHudContractedLy(distanceLy * peak);
    if (travelerTargetRef.current) {
      travelerTargetRef.current.position.set(LINE_LEFT + PATH_SPAN * peak, 0, 0);
    }
  }, [journeyKey, peakContractedScale, resetGen, distanceLy]);

  useFrame((_state, delta) => {
    if (isPlaying) {
      progressRef.current += delta * 0.055;
      if (progressRef.current >= 1) {
        progressRef.current -= 1;
      }
    }

    const { pathFraction, velocityC } = getTripStateAtProgress(journey, distanceLy, progressRef.current);

    const targetScaleDesired = isPlaying
      ? contractedScaleAtVelocity(velocityC, lorentzFactor)
      : peakContractedScale;

    const liveScale = THREE.MathUtils.lerp(liveScaleRef.current, targetScaleDesired, 0.15);
    liveScaleRef.current = liveScale;

    const travelerSpan = PATH_SPAN * liveScale;
    const targetCenterX = LINE_LEFT + travelerSpan;
    if (travelerTargetRef.current) {
      travelerTargetRef.current.position.set(targetCenterX, 0, 0);
    }
    if (pointLightRef.current) {
      pointLightRef.current.position.set(targetCenterX, 0.5, 0);
    }
    if (shipRef.current) {
      shipRef.current.position.set(LINE_LEFT + pathFraction * travelerSpan, 0, 0);
    }

    hudFrameCounter.current += 1;
    if (hudFrameCounter.current % 12 === 0) {
      setHudContractedLy(distanceLy * liveScale);
    }
  });

  const peakLy = distanceLy * peakContractedScale;

  return (
    <>
      <Earth />
      <RestFrameGhostTarget />

      <group ref={travelerTargetRef} position={[LINE_LEFT + PATH_SPAN * peakContractedScale, 0, 0]}>
        <TravelerTargetStar />
      </group>

      <pointLight
        ref={pointLightRef}
        position={[LINE_RIGHT, 0.5, 0]}
        intensity={5}
        color="#ffccaa"
        distance={80}
      />

      {/* One dashed rest ruler: Earth to shadow destination (full lab distance). */}
      <Line
        points={[
          [RULER_X0, -0.52, 0.02],
          [RULER_X1_REST, -0.52, 0.02],
        ]}
        color="#7eb8ff"
        lineWidth={2}
        dashed
        dashScale={2}
        dashSize={0.45}
        gapSize={0.35}
      />

      {/* One solid traveler ruler: Earth to hi-fi star (length-contracted span). */}
      <TravelerCorridorLine liveScaleRef={liveScaleRef} />

      <Text position={[0, 3.9, 0]} fontSize={0.36} color="#94a3b8" anchorY="bottom" maxWidth={32}>
        Orange line: traveler distance to the bright star. Blue dashed: rest distance to the faint star.
      </Text>
      <Text position={[0, 3.45, 0]} fontSize={0.34} color="#cbd5e1" anchorY="bottom">
        Contracted: {hudContractedLy.toPrecision(3)} ly
        {!isPlaying ? ` (peak ${peakLy.toPrecision(3)} ly)` : ''} — Rest: {distanceLy.toLocaleString()} ly
      </Text>

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
        camera={{ position: [0, 6, 38], fov: 40, near: 0.1, far: 200 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#050510']} />

        <ambientLight intensity={0.2} />
        <directionalLight position={[-5, 8, 8]} intensity={2} />

        <SceneRig simulator={simulator} visualization={visualization} />

        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

        <OrbitControls
          makeDefault
          target={[0, 0.2, 0]}
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
