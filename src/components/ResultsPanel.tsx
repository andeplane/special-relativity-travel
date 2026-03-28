import React from 'react';
import type { SimulatorViewModel } from '../viewmodels/useSimulatorViewModel';

interface ResultsPanelProps {
  simulator: SimulatorViewModel;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ simulator }) => {
  const { journeyResult: r, fuelResult: f } = simulator;

  const formatNumber = (num: number, sigFigs: number = 3) => {
    if (num === Infinity) return "∞";
    if (num < 0.001) return num.toExponential(2);
    if (num >= 1e9) return num.toExponential(2);
    return Number(num.toPrecision(sigFigs)).toLocaleString();
  };

  const formatTime = (years: number) => {
    if (years < 1) {
      const days = years * 365.25;
      if (days < 1) {
        return `${formatNumber(days * 24)} hours`;
      }
      return `${formatNumber(days)} days`;
    }
    return `${formatNumber(years)} years`;
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-slate-900 text-white rounded-lg border border-slate-700 w-full max-w-md h-full overflow-y-auto">
      <h2 className="text-xl font-bold text-blue-400 border-b border-slate-700 pb-2">Journey Results</h2>
      
      {/* Time Results */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 p-3 rounded border border-slate-700">
          <div className="text-xs text-slate-400 mb-1">Earth Time</div>
          <div className="text-lg font-mono text-blue-300">{formatTime(r.earthTime)}</div>
        </div>
        <div className="bg-slate-800 p-3 rounded border border-slate-700">
          <div className="text-xs text-slate-400 mb-1">Ship Time</div>
          <div className="text-lg font-mono text-orange-300">{formatTime(r.shipTime)}</div>
        </div>
        <div className="bg-slate-800 p-3 rounded border border-slate-700 col-span-2">
          <div className="text-xs text-slate-400 mb-1">Time Saved</div>
          <div className="text-xl font-mono text-green-400">{formatTime(r.timeSaved)}</div>
        </div>
      </div>

      {/* Relativistic Results */}
      <div className="flex flex-col gap-2 bg-slate-800 p-4 rounded border border-slate-700">
        <h3 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Physics</h3>
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <span className="text-sm text-slate-400">Lorentz Factor (γ)</span>
          <span className="font-mono text-white">{formatNumber(r.maxLorentzFactor)}</span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <span className="text-sm text-slate-400">Contracted Dist.</span>
          <span className="font-mono text-orange-300">{formatNumber(r.contractedDistance)} ly</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400">Peak Velocity</span>
          <span className="font-mono text-white">{formatNumber(r.peakVelocity, 4)}c</span>
        </div>
      </div>

      {/* Fuel Results */}
      <div className="flex flex-col gap-2 bg-slate-800 p-4 rounded border border-slate-700">
        <h3 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Fuel (1-Tonne Payload)</h3>
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <span className="text-sm text-slate-400">Antimatter Mass</span>
          <span className="font-mono text-purple-300">{formatNumber(f.antimatterMass)} kg</span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <span className="text-sm text-slate-400">Antimatter Cost</span>
          <span className="font-mono text-green-400">${formatNumber(f.antimatterCost)}</span>
        </div>
        <div className="flex justify-between items-center pt-2">
          <span className="text-sm text-slate-400">Chemical Fuel</span>
          <span className="font-mono text-red-400 text-right max-w-[150px]">
            {f.chemicalMass === Infinity || f.chemicalMass > 1e53 ? 'Exceeds observable universe mass' : `${formatNumber(f.chemicalMass)} kg`}
          </span>
        </div>
      </div>

      {/* Phase Breakdown */}
      <div className="flex flex-col gap-2 bg-slate-800 p-4 rounded border border-slate-700">
        <h3 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Phase Breakdown (Earth / Ship)</h3>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Acceleration</span>
          <span className="font-mono">{formatTime(r.phases.accel.earthTime)} / {formatTime(r.phases.accel.shipTime)}</span>
        </div>
        {r.phases.coast && (
          <div className="flex justify-between text-sm border-t border-slate-700 pt-1 mt-1">
            <span className="text-slate-400">Coast</span>
            <span className="font-mono">{formatTime(r.phases.coast.earthTime)} / {formatTime(r.phases.coast.shipTime)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm border-t border-slate-700 pt-1 mt-1">
          <span className="text-slate-400">Deceleration</span>
          <span className="font-mono">{formatTime(r.phases.decel.earthTime)} / {formatTime(r.phases.decel.shipTime)}</span>
        </div>
      </div>

    </div>
  );
};
