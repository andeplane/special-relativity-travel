import type { JourneyResult } from '../types/physics';

function accelPositionUnit(u: number): number {
  return u - Math.sin(Math.PI * u) / Math.PI;
}

function accelVelocityUnit(u: number): number {
  return (1 - Math.cos(Math.PI * u)) / 2;
}

function decelPositionUnit(u: number): number {
  const integ = (w: number): number => w / 2 + Math.sin(Math.PI * w) / (2 * Math.PI);
  const end = integ(1) - integ(0);
  return end > 0 ? (integ(u) - integ(0)) / end : u;
}

function decelVelocityUnit(u: number): number {
  return (1 + Math.cos(Math.PI * u)) / 2;
}

export function getTripStateAtProgress(
  journey: JourneyResult,
  distanceLy: number,
  p: number
): { pathFraction: number; velocityC: number } {
  const dA = journey.phases.accel.distance;
  const dC = journey.phases.coast?.distance ?? 0;
  const dD = journey.phases.decel.distance;
  const tA = journey.phases.accel.earthTime;
  const tC = journey.phases.coast?.earthTime ?? 0;
  const tD = journey.phases.decel.earthTime;
  const T = tA + tC + tD;
  const peak = journey.peakVelocity;

  if (T <= 0 || distanceLy <= 0) {
    return { pathFraction: 0, velocityC: 0 };
  }

  const te = Math.min(1, Math.max(0, p)) * T;
  let dist = 0;
  let v = 0;

  if (te <= tA) {
    const u = tA > 1e-12 ? te / tA : 1;
    dist = dA * accelPositionUnit(u);
    v = peak * accelVelocityUnit(u);
  } else if (te <= tA + tC) {
    const teC = te - tA;
    const u = tC > 1e-12 ? teC / tC : 1;
    dist = dA + dC * u;
    v = peak;
  } else {
    const teD = te - tA - tC;
    const u = tD > 1e-12 ? teD / tD : 1;
    dist = dA + dC + dD * decelPositionUnit(u);
    v = peak * decelVelocityUnit(u);
  }

  return {
    pathFraction: Math.min(1, dist / distanceLy),
    velocityC: Math.min(0.9999, Math.max(0, v)),
  };
}

export function contractedScaleAtVelocity(velocityC: number, lorentzFactor: (v: number) => number): number {
  if (velocityC <= 0) return 1;
  return 1 / lorentzFactor(velocityC);
}
