import React, { useState } from 'react';
import { Menu, Bell, Play, Pause, RefreshCw, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { fraudApi } from '../services/api';

export default function Navbar({ onToggleSidebar, isSimulatorActive, onToggleSimulator, alertCount = 0 }) {
  const [isInjecting, setIsInjecting] = useState(false);
  const [injectSuccess, setInjectSuccess] = useState(false);

  const handleInjectFraud = async (scenario) => {
    setIsInjecting(true);
    try {
      await fraudApi.generateSimulatedTxn(scenario);
      setInjectSuccess(true);
      setTimeout(() => setInjectSuccess(false), 2000);
    } catch (err) {
      console.warn('Simulation trigger error', err);
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-[#0B132B]/90 px-4 md:px-6 backdrop-blur-md">
      {/* Left side: Hamburger + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            UPI Stream: <span className="text-emerald-400 font-mono">ACTIVE</span>
          </span>
        </div>
      </div>

      {/* Right side: Simulator Controls & Alerts */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Simulator Toggle Button */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900/80 p-1">
          <button
            onClick={() => onToggleSimulator(!isSimulatorActive)}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold transition ${
              isSimulatorActive
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle live synthetic transaction stream"
          >
            {isSimulatorActive ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Simulating</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>Start Sim</span>
              </>
            )}
          </button>

          {/* Quick Scenario Injection Dropdown */}
          <button
            disabled={isInjecting}
            onClick={() => handleInjectFraud('money_mule')}
            className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition ${
              injectSuccess
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30'
            }`}
            title="Instantly inject a Money Mule Hub transaction attack"
          >
            {injectSuccess ? <CheckCircle2 className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
            <span className="hidden sm:inline">Inject Mule Attack</span>
          </button>
        </div>

        {/* High Risk Alert Icon */}
        <div className="relative">
          <a
            href="/alerts"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800/60 text-slate-300 hover:border-slate-600 hover:text-white transition"
          >
            <Bell className="h-4 w-4" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
          </a>
        </div>
      </div>
    </header>
  );
}
