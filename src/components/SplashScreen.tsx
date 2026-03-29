import type { FC } from 'react';
import { Rocket, Orbit, Timer, Ruler } from 'lucide-react';

export const SPLASH_DISMISSED_KEY = 'space-travel-relativity-splash-dismissed';

interface SplashScreenProps {
  onDismiss: () => void;
}

export const SplashScreen: FC<SplashScreenProps> = ({ onDismiss }) => {
  const handleEnter = () => {
    try {
      localStorage.setItem(SPLASH_DISMISSED_KEY, '1');
    } catch {
      /* ignore private mode / quota */
    }
    onDismiss();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-md px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="splash-title"
    >
      <div className="max-w-lg w-full rounded-2xl border border-slate-700 bg-slate-900/90 p-8 shadow-2xl shadow-blue-950/50">
        <div className="flex items-center gap-3 mb-6">
          <Rocket className="text-blue-400 shrink-0" size={40} aria-hidden />
          <h2
            id="splash-title"
            className="text-2xl font-bold tracking-tight text-white"
          >
            Relativistic Space Travel Simulator
          </h2>
        </div>

        <p className="text-slate-300 text-base leading-relaxed mb-6">
          Explore how{' '}
          <strong className="text-slate-100 font-semibold">special relativity</strong> changes
          interstellar trips: time dilation, length contraction, and extreme fuel demands — with
          equations from the PRD, not Newtonian shortcuts.
        </p>

        <ul className="space-y-3 mb-8 text-slate-400 text-sm">
          <li className="flex gap-3">
            <Orbit className="text-orange-400 shrink-0 mt-0.5" size={18} aria-hidden />
            <span>
              Set distance, max speed, and acceleration; see Earth time vs ship time, Lorentz
              factor, and contracted distance update live.
            </span>
          </li>
          <li className="flex gap-3">
            <Ruler className="text-amber-400 shrink-0 mt-0.5" size={18} aria-hidden />
            <span>
              The 3D view shows Earth, your destination, and how the traveler&rsquo;s path lines
              up with length contraction as you play the journey.
            </span>
          </li>
          <li className="flex gap-3">
            <Timer className="text-blue-400 shrink-0 mt-0.5" size={18} aria-hidden />
            <span>
              Compare antimatter vs chemical fuel (with a sanity check when the rocket equation
              goes off the scale).
            </span>
          </li>
        </ul>

        <button
          type="button"
          onClick={handleEnter}
          className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-orange-600 px-4 py-3.5 font-semibold text-white shadow-lg hover:from-blue-500 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
        >
          Enter simulator
        </button>
      </div>
    </div>
  );
};
