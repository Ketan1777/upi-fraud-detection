import React from 'react';

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }) {
  const variantStyles = {
    default: 'from-slate-800/80 to-slate-900/80 border-slate-700/60 text-slate-100',
    safe: 'from-emerald-950/40 to-slate-900/80 border-emerald-500/30 text-emerald-300',
    warning: 'from-amber-950/40 to-slate-900/80 border-amber-500/30 text-amber-300',
    danger: 'from-rose-950/40 to-slate-900/80 border-rose-500/30 text-rose-300',
    cyan: 'from-cyan-950/40 to-slate-900/80 border-cyan-500/30 text-cyan-300',
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 shadow-lg backdrop-blur-md transition-all duration-200 hover:border-opacity-60 hover:shadow-cyan-500/5 ${variantStyles[variant] || variantStyles.default}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="rounded-lg bg-slate-800/70 p-2.5 text-slate-300 border border-slate-700/50">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className={trend.isPositive ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
            {trend.value}
          </span>
          <span className="text-slate-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
