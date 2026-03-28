import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useVisualizationViewModel } from './useVisualizationViewModel';
import type { JourneyResult } from '../types/physics';

const mockJourneyResult: JourneyResult = {
  earthTime: 10,
  shipTime: 5,
  timeSaved: 5,
  maxLorentzFactor: 2,
  contractedDistance: 2.12, // Half of 4.24
  peakVelocity: 0.866,
  phases: {
    accel: { distance: 1, shipTime: 1, earthTime: 1 },
    coast: null,
    decel: { distance: 1, shipTime: 1, earthTime: 1 },
  }
};

describe('useVisualizationViewModel', () => {
  it('calculates contracted scale correctly', () => {
    const { result } = renderHook(() => 
      useVisualizationViewModel(mockJourneyResult, 4.24)
    );
    
    expect(result.current.contractedDistanceScale).toBeCloseTo(0.5);
  });

  it('handles play/pause state', () => {
    const { result } = renderHook(() => 
      useVisualizationViewModel(mockJourneyResult, 4.24)
    );
    
    expect(result.current.isPlaying).toBe(false);
    
    act(() => {
      result.current.togglePlay();
    });
    
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.resetAnimation();
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.animationProgress).toBe(0);
  });
});
