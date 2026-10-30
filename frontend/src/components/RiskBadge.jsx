import React from 'react';

export default function RiskBadge({ classification, score }) {
  const norm = (classification || '').toUpperCase();

  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let dotColor = 'bg-emerald-400';
  let label = 'SAFE';

  if (norm === 'FRAUDULENT' || norm === 'FRAUD' || (score !== undefined && score >= 70)) {
    badgeColor = 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse';
    dotColor = 'bg-rose-500';
    label = 'FRAUDULENT';
  } else if (norm === 'SUSPICIOUS' || (score !== undefined && score >= 30)) {
    badgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    dotColor = 'bg-amber-400';
    label = 'SUSPICIOUS';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {label}
      {score !== undefined && <span className="opacity-75 font-mono text-[11px]">({Number(score).toFixed(0)})</span>}
    </span>
  );
}
