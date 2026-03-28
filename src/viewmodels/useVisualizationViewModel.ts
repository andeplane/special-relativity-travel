import { useMemo, useState } from 'react';
import type { JourneyResult } from '../types/physics';

export interface VisualizationViewModel {
  isPlaying: boolean;
  togglePlay: () => void;
  resetAnimation: () => void;
  
  // Scene derived parameters
  contractedDistanceScale: number; // 0 to 1 ratio compared to rest frame
  /** Increments on resetAnimation so the canvas can zero ref-based playback. */
  playbackResetGeneration: number;
  animationProgress: number; // 0 to 1 (for tests / optional UI; scene uses refs while playing)
  setAnimationProgress: (progress: number) => void;
}

export function useVisualizationViewModel(
  journeyResult: JourneyResult,
  distanceLy: number
): VisualizationViewModel {
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [playbackResetGeneration, setPlaybackResetGeneration] = useState(0);

  const togglePlay = () => setIsPlaying((p) => !p);
  const resetAnimation = () => {
    setIsPlaying(false);
    setAnimationProgress(0);
    setPlaybackResetGeneration((g) => g + 1);
  };

  const contractedDistanceScale = useMemo(() => {
    if (distanceLy <= 0) return 1;
    return journeyResult.contractedDistance / distanceLy;
  }, [journeyResult.contractedDistance, distanceLy]);

  return {
    isPlaying,
    togglePlay,
    resetAnimation,
    contractedDistanceScale,
    playbackResetGeneration,
    animationProgress,
    setAnimationProgress,
  };
}
