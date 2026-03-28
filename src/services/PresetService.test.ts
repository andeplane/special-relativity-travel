import { describe, it, expect } from 'vitest';
import { DefaultPresetService } from './PhysicsService';

describe('PresetService', () => {
  it('returns predefined presets', () => {
    const service = new DefaultPresetService();
    const presets = service.getPresets();
    expect(presets.length).toBeGreaterThan(0);
    expect(presets.find(p => p.name === 'Proxima Centauri')?.distance).toBe(4.24);
  });
});
