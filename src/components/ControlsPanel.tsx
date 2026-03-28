import React from 'react';
import type { SimulatorViewModel } from '../viewmodels/useSimulatorViewModel';
import type { VisualizationViewModel } from '../viewmodels/useVisualizationViewModel';
import { Play, Square } from 'lucide-react';

interface ControlsPanelProps {
  simulator: SimulatorViewModel;
  visualization: VisualizationViewModel;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({ simulator, visualization }) => {
  return (
    <div className="flex flex-col gap-6 p-6 bg-slate-900 text-white rounded-lg border border-slate-700 w-full max-w-md">
      <h2 className="text-xl font-bold text-blue-400 border-b border-slate-700 pb-2">Journey Parameters</h2>
      
      {/* Destination Preset */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-300">Destination Preset</label>
        <select 
          className="bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-blue-500 focus:outline-none"
          onChange={(e) => {
            const preset = simulator.presets.find(p => p.name === e.target.value);
            if (preset) simulator.applyPreset(preset);
          }}
          value={simulator.presets.find(p => p.distance === simulator.distanceLy)?.name || ''}
        >
          <option value="" disabled>Custom Distance</option>
          {simulator.presets.map((p) => (
            <option key={p.name} value={p.name}>{p.name} ({p.distance.toLocaleString()} ly)</option>
          ))}
        </select>
      </div>

      {/* Distance */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <label className="text-sm font-medium text-slate-300">Distance (ly)</label>
          <input 
            type="number" 
            min="0.001" max="100000" step="0.001"
            className="bg-slate-800 border border-slate-600 rounded px-2 py-1 w-24 text-right"
            value={simulator.distanceLy}
            onChange={(e) => simulator.setDistanceLy(Math.max(0.001, Math.min(100000, Number(e.target.value))))}
          />
        </div>
        <input 
          type="range" 
          min="0.001" max="100" step="0.001"
          className="w-full accent-blue-500"
          value={simulator.distanceLy > 100 ? 100 : simulator.distanceLy}
          onChange={(e) => simulator.setDistanceLy(Number(e.target.value))}
        />
        {simulator.distanceLy > 100 && <span className="text-xs text-orange-400">Slider maxes at 100 ly. Use input for larger values.</span>}
      </div>

      {/* Max Speed */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <label className="text-sm font-medium text-slate-300">Max Speed (c)</label>
          <input 
            type="number" 
            min="0.01" max="0.9999" step="0.01"
            className="bg-slate-800 border border-slate-600 rounded px-2 py-1 w-24 text-right"
            value={simulator.maxSpeedC}
            onChange={(e) => simulator.setMaxSpeedC(Math.max(0.01, Math.min(0.9999, Number(e.target.value))))}
          />
        </div>
        <input 
          type="range" 
          min="0.01" max="0.9999" step="0.0001"
          className="w-full accent-blue-500"
          value={simulator.maxSpeedC}
          onChange={(e) => simulator.setMaxSpeedC(Number(e.target.value))}
        />
      </div>

      {/* Acceleration */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <label className="text-sm font-medium text-slate-300">Acceleration (g)</label>
          <input 
            type="number" 
            min="0.1" max="10" step="0.1"
            className="bg-slate-800 border border-slate-600 rounded px-2 py-1 w-24 text-right"
            value={simulator.accelerationG}
            onChange={(e) => simulator.setAccelerationG(Math.max(0.1, Math.min(10, Number(e.target.value))))}
          />
        </div>
        <input 
          type="range" 
          min="0.1" max="10" step="0.1"
          className="w-full accent-blue-500"
          value={simulator.accelerationG}
          onChange={(e) => simulator.setAccelerationG(Number(e.target.value))}
        />
      </div>

      {/* Animation Controls */}
      <div className="mt-4 pt-4 border-t border-slate-700 flex justify-center">
        <button 
          onClick={visualization.togglePlay}
          className={`flex items-center gap-2 px-6 py-3 rounded font-bold transition-colors ${
            visualization.isPlaying 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {visualization.isPlaying ? <><Square size={20} /> Stop Animation</> : <><Play size={20} /> Play Animation</>}
        </button>
      </div>
    </div>
  );
};
