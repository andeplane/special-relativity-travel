import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useSimulatorViewModel } from './useSimulatorViewModel';
import type { SimulatorContextType } from './SimulatorContext';
import { SimulatorProvider } from './SimulatorContext';
import type { ReactNode } from 'react';

describe('useSimulatorViewModel', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useSimulatorViewModel());
    
    expect(result.current.distanceLy).toBe(4.24);
    expect(result.current.maxSpeedC).toBe(0.9);
    expect(result.current.accelerationG).toBe(1);
    expect(result.current.presets.length).toBeGreaterThan(0);
  });

  it('updates distance and applies preset', () => {
    const { result } = renderHook(() => useSimulatorViewModel());
    
    act(() => {
      result.current.setDistanceLy(10);
    });
    
    expect(result.current.distanceLy).toBe(10);

    act(() => {
      result.current.applyPreset({ name: 'Test', distance: 100 });
    });
    
    expect(result.current.distanceLy).toBe(100);
  });

  it('calls injected physics service', () => {
    const mockCalculateJourney = vi.fn().mockReturnValue({
      earthTime: 10,
      shipTime: 5,
      timeSaved: 5,
      maxLorentzFactor: 2,
      contractedDistance: 2,
      peakVelocity: 0.9,
      phases: {
        accel: { distance: 1, shipTime: 1, earthTime: 1 },
        coast: null,
        decel: { distance: 1, shipTime: 1, earthTime: 1 },
      }
    });

    const mockFuelRequirements = vi.fn().mockReturnValue({
      antimatterMass: 100,
      antimatterCost: 100,
      chemicalMass: 100,
    });

    const mockPhysicsService = {
      calculateJourney: mockCalculateJourney,
      fuelRequirements: mockFuelRequirements,
      lorentzFactor: vi.fn((v: number) => 1 / Math.sqrt(1 - v * v)),
      contractedDistance: vi.fn(),
    };

    const mockContext: Partial<SimulatorContextType> = {
      physicsService: mockPhysicsService,
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <SimulatorProvider overrides={mockContext}>{children}</SimulatorProvider>
    );

    const { result } = renderHook(() => useSimulatorViewModel(), { wrapper });

    expect(mockCalculateJourney).toHaveBeenCalledWith(4.24, 0.9, 1);
    expect(mockFuelRequirements).toHaveBeenCalledWith(0.9, 1000);
    
    expect(result.current.journeyResult.earthTime).toBe(10);
    expect(result.current.fuelResult.antimatterMass).toBe(100);
    expect(result.current.lorentzFactor(0)).toBe(1);
    expect(mockPhysicsService.lorentzFactor).toHaveBeenCalledWith(0);
  });
});
