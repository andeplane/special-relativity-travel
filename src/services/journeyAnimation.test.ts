import { describe, it, expect } from 'vitest';
import { getTripStateAtProgress, contractedScaleAtVelocity } from './journeyAnimation';
import type { JourneyResult } from '../types/physics';

const lorentz = (v: number) => 1 / Math.sqrt(1 - v * v);

describe('getTripStateAtProgress', () => {
  const journeyWithCoast: JourneyResult = {
    earthTime: 10,
    shipTime: 5,
    timeSaved: 5,
    maxLorentzFactor: 2,
    contractedDistance: 2,
    peakVelocity: 0.9,
    phases: {
      accel: { distance: 1, shipTime: 1, earthTime: 2 },
      coast: { distance: 2, shipTime: 1, earthTime: 4 },
      decel: { distance: 1, shipTime: 1, earthTime: 2 },
    },
  };

  it('starts at rest and zero path', () => {
    const s = getTripStateAtProgress(journeyWithCoast, 4, 0);
    expect(s.pathFraction).toBe(0);
    expect(s.velocityC).toBe(0);
  });

  it('ends at rest and full path', () => {
    const s = getTripStateAtProgress(journeyWithCoast, 4, 1);
    expect(s.pathFraction).toBeCloseTo(1, 5);
    expect(s.velocityC).toBeCloseTo(0, 5);
  });

  it('reaches peak speed during coast', () => {
    const s = getTripStateAtProgress(journeyWithCoast, 4, 0.5);
    expect(s.velocityC).toBeCloseTo(0.9, 5);
    expect(s.pathFraction).toBeGreaterThan(0.2);
    expect(s.pathFraction).toBeLessThan(0.8);
  });

  it('handles no-coast journey', () => {
    const noCoast: JourneyResult = {
      ...journeyWithCoast,
      phases: {
        accel: { distance: 2, shipTime: 1, earthTime: 2 },
        coast: null,
        decel: { distance: 2, shipTime: 1, earthTime: 2 },
      },
    };
    const mid = getTripStateAtProgress(noCoast, 4, 0.5);
    expect(mid.velocityC).toBeGreaterThan(0);
    expect(mid.pathFraction).toBeCloseTo(0.5, 1);
  });
});

describe('contractedScaleAtVelocity', () => {
  it('is 1 at rest', () => {
    expect(contractedScaleAtVelocity(0, lorentz)).toBe(1);
  });

  it('decreases with speed', () => {
    const s = contractedScaleAtVelocity(0.9, lorentz);
    expect(s).toBeLessThan(1);
    expect(s).toBeCloseTo(1 / lorentz(0.9), 5);
  });
});
