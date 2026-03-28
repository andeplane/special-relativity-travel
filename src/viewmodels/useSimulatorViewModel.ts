import { useState, useContext, useMemo, useCallback } from 'react';
import { SimulatorContext } from './SimulatorContext';
import type { JourneyResult, FuelResult, Preset } from '../types/physics';

export interface SimulatorViewModel {
  // Inputs
  distanceLy: number;
  maxSpeedC: number;
  accelerationG: number;
  
  // Setters
  setDistanceLy: (val: number) => void;
  setMaxSpeedC: (val: number) => void;
  setAccelerationG: (val: number) => void;
  applyPreset: (preset: Preset) => void;
  
  // Derived Outputs
  journeyResult: JourneyResult;
  fuelResult: FuelResult;
  presets: Preset[];
  /** For visualization: same Lorentz factor as physics engine (no duplicated SR math). */
  lorentzFactor: (velocityC: number) => number;
}

export function useSimulatorViewModel(): SimulatorViewModel {
  const { physicsService, presetService } = useContext(SimulatorContext);
  
  // Default to Proxima Centauri per PRD
  const [distanceLy, setDistanceLy] = useState(4.24);
  const [maxSpeedC, setMaxSpeedC] = useState(0.9);
  const [accelerationG, setAccelerationG] = useState(1);

  const applyPreset = useCallback((preset: Preset) => {
    setDistanceLy(preset.distance);
  }, []);

  const journeyResult = useMemo(() => {
    return physicsService.calculateJourney(distanceLy, maxSpeedC, accelerationG);
  }, [physicsService, distanceLy, maxSpeedC, accelerationG]);

  const fuelResult = useMemo(() => {
    // 1 tonne payload = 1000 kg
    return physicsService.fuelRequirements(journeyResult.peakVelocity, 1000);
  }, [physicsService, journeyResult.peakVelocity]);

  const presets = useMemo(() => presetService.getPresets(), [presetService]);

  const lorentzFactor = useCallback(
    (velocityC: number) => physicsService.lorentzFactor(velocityC),
    [physicsService]
  );

  return {
    distanceLy,
    maxSpeedC,
    accelerationG,
    setDistanceLy,
    setMaxSpeedC,
    setAccelerationG,
    applyPreset,
    journeyResult,
    fuelResult,
    presets,
    lorentzFactor,
  };
}
