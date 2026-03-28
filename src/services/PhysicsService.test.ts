import { describe, it, expect } from 'vitest';
import { DefaultPhysicsService } from './PhysicsService';

describe('PhysicsService', () => {
  const physicsService = new DefaultPhysicsService();

  describe('lorentzFactor', () => {
    it('calculates correctly for v = 0', () => {
      expect(physicsService.lorentzFactor(0)).toBeCloseTo(1, 5);
    });

    it('calculates correctly for v = 0.9c', () => {
      expect(physicsService.lorentzFactor(0.9)).toBeCloseTo(2.294, 3);
    });

    it('approaches infinity as v approaches c', () => {
      expect(physicsService.lorentzFactor(0.9999)).toBeGreaterThan(70);
    });

    it('returns infinity for v >= c', () => {
      expect(physicsService.lorentzFactor(1)).toBe(Infinity);
      expect(physicsService.lorentzFactor(1.1)).toBe(Infinity);
    });
  });

  describe('contractedDistance', () => {
    it('calculates correctly for 0.9c over 4.24 ly', () => {
      // 4.24 / 2.294157 = 1.848 ly
      expect(physicsService.contractedDistance(4.24, 0.9)).toBeCloseTo(1.848, 3);
    });
  });

  describe('fuelRequirements', () => {
    it('calculates fuel requirements correctly for relativistic speeds', () => {
      // deltaV = 0.9c
      const result = physicsService.fuelRequirements(0.9, 1000); // 1 tonne payload
      expect(result.antimatterMass).toBeGreaterThan(0);
      expect(result.chemicalMass).toBe(Infinity);
    });

    it('calculates chemical mass correctly for low speeds', () => {
      // deltaV = 0.001c (approx 300 km/s)
      const result = physicsService.fuelRequirements(0.001, 1000);
      expect(result.chemicalMass).toBeGreaterThan(0);
      expect(result.chemicalMass).toBeLessThan(Infinity);
    });
  });

  describe('calculateJourney', () => {
    it('calculates journey with coast phase (long distance)', () => {
      // Proxima Centauri: 4.24 ly, 0.9c, 1g
      const result = physicsService.calculateJourney(4.24, 0.9, 1);
      
      expect(result.peakVelocity).toBeCloseTo(0.9, 3);
      expect(result.maxLorentzFactor).toBeCloseTo(2.294, 3);
      expect(result.contractedDistance).toBeCloseTo(1.848, 3);
      
      expect(result.phases.coast).not.toBeNull();
      
      expect(result.shipTime).toBeLessThan(result.earthTime);
      expect(result.timeSaved).toBeCloseTo(result.earthTime - result.shipTime, 5);
      
      // According to standard relativistic rocket equations for 1g to 0.9c:
      // accel time (ship) ~ 1.43 years
      // accel time (earth) ~ 1.94 years
      // accel distance ~ 1.25 ly
      expect(result.phases.accel.distance).toBeCloseTo(1.25, 1);
    });

    it('calculates journey without coast phase (short distance)', () => {
      // Short trip: 0.1 ly, 0.99c, 1g (will never reach 0.99c)
      const result = physicsService.calculateJourney(0.1, 0.99, 1);
      
      expect(result.peakVelocity).toBeLessThan(0.99);
      expect(result.phases.coast).toBeNull();
      
      // Total distance should be split exactly in half for accel and decel
      expect(result.phases.accel.distance).toBeCloseTo(0.05, 5);
      expect(result.phases.decel.distance).toBeCloseTo(0.05, 5);
    });
  });
});
