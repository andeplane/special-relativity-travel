import React, { createContext, ReactNode } from 'react';
import { PhysicsService, PresetService } from '../types/physics';
import { DefaultPhysicsService, DefaultPresetService } from '../services/PhysicsService';

export interface SimulatorContextType {
  physicsService: PhysicsService;
  presetService: PresetService;
}

export const defaultSimulatorContext: SimulatorContextType = {
  physicsService: new DefaultPhysicsService(),
  presetService: new DefaultPresetService(),
};

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
