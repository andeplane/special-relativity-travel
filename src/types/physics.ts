export interface JourneyResult {
  earthTime: number; // in years
  shipTime: number; // in years
  timeSaved: number; // earthTime - shipTime
  maxLorentzFactor: number;
  contractedDistance: number; // in ly
  peakVelocity: number; // as fraction of c
  phases: {
    accel: JourneyPhase;
    coast: JourneyPhase | null;
    decel: JourneyPhase;
  };
}

export interface JourneyPhase {
  earthTime: number; // years
  shipTime: number; // years
  distance: number; // ly
}

export interface FuelResult {
  antimatterMass: number; // kg
  antimatterCost: number; // USD
  chemicalMass: number; // kg
}

export interface PhysicsService {
  calculateJourney(distanceLy: number, maxSpeedC: number, accelerationG: number): JourneyResult;
  lorentzFactor(velocityC: number): number;
  contractedDistance(distanceLy: number, velocityC: number): number;
  fuelRequirements(deltaV: number, payloadMassKg: number): FuelResult;
}

export interface Preset {
  name: string;
  distance: number;
}

export interface PresetService {
  getPresets(): Preset[];
}
