import { useState, useCallback } from 'react';
import { SimulatorProvider } from './viewmodels/SimulatorContext';
import { useSimulatorViewModel } from './viewmodels/useSimulatorViewModel';
import { useVisualizationViewModel } from './viewmodels/useVisualizationViewModel';
import { ControlsPanel } from './components/ControlsPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { Visualization } from './components/Visualization';
import { SplashScreen, SPLASH_DISMISSED_KEY } from './components/SplashScreen';
import { Rocket } from 'lucide-react';

const AppContent = () => {
  const simulator = useSimulatorViewModel();
  const visualization = useVisualizationViewModel(
    simulator.journeyResult, 
    simulator.distanceLy
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans">
      <header className="bg-slate-900 border-b border-slate-800 p-4 flex items-center gap-3 shadow-lg z-10">
        <Rocket className="text-blue-500" size={28} />
        <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-orange-400">
          Relativistic Space Travel Simulator
        </h1>
      </header>
      
      <main className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-hidden">
        
        <div className="flex-1 bg-black rounded-lg border border-slate-800 shadow-2xl overflow-hidden min-h-[50vh] lg:min-h-0">
          <Visualization simulator={simulator} visualization={visualization} />
        </div>

        <div className="flex flex-col md:flex-row lg:flex-col gap-4 w-full lg:w-96 shrink-0 h-full overflow-y-auto pr-1">
          <ControlsPanel simulator={simulator} visualization={visualization} />
          <ResultsPanel simulator={simulator} />
        </div>

      </main>
    </div>
  );
};

function readSplashDismissed(): boolean {
  try {
    return localStorage.getItem(SPLASH_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

function App() {
  const [splashOpen, setSplashOpen] = useState(() => !readSplashDismissed());
  const closeSplash = useCallback(() => setSplashOpen(false), []);

  return (
    <SimulatorProvider>
      {splashOpen ? <SplashScreen onDismiss={closeSplash} /> : null}
      <AppContent />
    </SimulatorProvider>
  );
}

export default App;
