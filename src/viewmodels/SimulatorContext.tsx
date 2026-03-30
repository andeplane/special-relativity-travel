import { createContext } from 'react';
import type { ReactNode } from 'react';
import type { PhysicsService, PresetService } from '../types/physics';
import { DefaultPhysicsService, DefaultPresetService } from '../services/PhysicsService';

export interface SimulatorContextType {
  physicsService: PhysicsService;
  presetService: PresetService;
}

// eslint-disable-next-line react-refresh/only-export-components
export const defaultSimulatorContext: SimulatorContextType = {
  physicsService: new DefaultPhysicsService(),
  presetService: new DefaultPresetService(),
};

// eslint-disable-next-line react-refresh/only-export-components
export const SimulatorContext = createContext<SimulatorContextType>(defaultSimulatorContext);

export const SimulatorProvider = ({ 
  children, 
  overrides 
}: { 
  children: ReactNode, 
  overrides?: Partial<SimulatorContextType> 
}) => {
  return (
    <SimulatorContext.Provider value={{ ...defaultSimulatorContext, ...overrides }}>
      {children}
    </SimulatorContext.Provider>
  );
};
