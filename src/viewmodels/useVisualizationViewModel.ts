import { useMemo, useState } from 'react';
import type { JourneyResult } from '../types/physics';

export interface VisualizationViewModel {
  isPlaying: boolean;
  togglePlay: () => void;
  resetAnimation: () => void;
  
  // Scene derived parameters
  contractedDistanceScale: number; // 0 to 1 ratio compared to rest frame
  animationProgress: number; // 0 to 1
  setAnimationProgress: (progress: number) => void;
}

export function useVisualizationViewModel(
  journeyResult: JourneyResult,
  distanceLy: number
): VisualizationViewModel {
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);

  const togglePlay = () => setIsPlaying((p) => !p);
  const resetAnimation = () => {
    setIsPlaying(false);
    setAnimationProgress(0);
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
    animationProgress,
    setAnimationProgress,
  };
}
