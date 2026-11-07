import React, { useState } from 'react';
import {
  Store, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Search, Filter, ExternalLink, ShieldAlert, Info, Banknote,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts';

// ── Synthetic Data ────────────────────────────────────────────────────────────

const MERCHANT_CATEGORIES = [
  { cat: 'Groceries',     fraud: 0.8,  vol: 42000, color: '#10B981' },
  { cat: 'Electronics',   fraud: 2.4,  vol: 18000, color: '#F59E0B' },
  { cat: 'Travel',        fraud: 1.9,  vol: 24000, color: '#3B82F6' },
  { cat: 'Food Delivery', fraud: 0.6,  vol: 56000, color: '#10B981' },
  { cat: 'Crypto/Inv.',   fraud: 8.3,  vol: 4200,  color: '#F43F5E' },
  { cat: 'Recharge',      fraud: 3.1,  vol: 11000, color: '#F59E0B' },
  { cat: 'Education',     fraud: 0.4,  vol: 9800,  color: '#10B981' },
  { cat: 'Healthcare',    fraud: 0.5,  vol: 7600,  color: '#10B981' },
  { cat: 'Gaming',        fraud: 5.6,  vol: 3900,  color: '#F43F5E' },
  { cat: 'Clothing',      fraud: 1.2,  vol: 14000, color: '#3B82F6' },
];

const HIGH_RISK_MERCHANTS = [
  { id: 'MER-9871', name: 'QuickCoin Exchange',  upi: 'quickcoin@ybl',   cat: 'Crypto',      riskScore: 94, flagged: 42, vol: '₹18.4 L', trend: 'up',   lastActivity: '2 min ago' },
  { id: 'MER-6624', name: 'BetKing Fantasy',     upi: 'betking@paytm',   cat: 'Gaming',      riskScore: 87, flagged: 31, vol: '₹9.2 L',  trend: 'up',   lastActivity: '15 min ago' },
  { id: 'MER-5531', name: 'ElectraStore',        upi: 'electra@okaxis',  cat: 'Electronics', riskScore: 71, flagged: 18, vol: '₹24.1 L', trend: 'down', lastActivity: '1 hr ago' },
  { id: 'MER-4489', name: 'Recharge4U',          upi: 'rcharge@ibl',     cat: 'Recharge',    riskScore: 68, flagged: 14, vol: '₹6.7 L',  trend: 'flat', lastActivity: '32 min ago' },
  { id: 'MER-3301', name: 'TripEasy Holidays',   upi: 'tripeasy@ybl',    cat: 'Travel',      riskScore: 62, flagged: 11, vol: '₹31.8 L', trend: 'down', lastActivity: '3 hr ago' },
];

const RADAR_DATA = [
  { metric: 'Velocity', A: 85, B: 40 },
  { metric: 'Chargeback', A: 92, B: 20 },
  { metric: 'Refund Rate', A: 78, B: 30 },
  { metric: 'New Accounts', A: 70, B: 25 },
  { metric: 'Night Txns', A: 88, B: 15 },
  { metric: 'Geo Anomaly', A: 65, B: 10 },
];

function RiskPill({ score }) {
  const cls = score >= 85 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            : score >= 65 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  const label = score >= 85 ? 'CRITICAL' : score >= 65 ? 'HIGH' : 'MEDIUM';
  return (
    <span className={`inline-flex items-center gap-1 border rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      {label} · {score}
    </span>
  );
}

export default function MerchantRiskPage() {
  const [search, setSearch] = useState('');
  const filtered = HIGH_RISK_MERCHANTS.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.cat.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#060C1A] text-white px-6 py-6 space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Store className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-purple-400 font-semibold tracking-widest uppercase">Intelligence</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Merchant Risk Intelligence</h1>
        <p className="text-xs text-slate-400 mt-0.5">Category-level fraud rates · high-risk merchant watchlist · behavioral radar</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Merchants', val: '1,24,841', sub: '+312 this week', up: true },
          { label: 'High-Risk Flagged', val: '248', sub: 'Needs review', up: false },
          { label: 'Avg Category Fraud', val: '2.48%', sub: 'Crypto & Gaming outliers', up: false },
          { label: 'Frozen Merchants', val: '17', sub: 'Pending FIU clearance', up: false },
        ].map(k => (
          <div key={k.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <p className="text-xs text-slate-400">{k.label}</p>
            <p className="text-xl font-bold text-white mt-1">{k.val}</p>
            <p className={`text-xs mt-0.5 ${k.up ? 'text-emerald-400' : 'text-rose-400'}`}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Category bar + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Category fraud rate */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" /> Fraud Rate by Merchant Category (%)
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={MERCHANT_CATEGORIES} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 10 }} unit="%" />
              <YAxis type="category" dataKey="cat" tick={{ fill: '#94A3B8', fontSize: 10 }} width={80} />
              <Tooltip
                contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`${v}%`, 'Fraud Rate']}
              />
              <Bar dataKey="fraud" radius={[0, 4, 4, 0]}>
                {MERCHANT_CATEGORIES.map((m) => <Cell key={m.cat} fill={m.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Behavioral radar */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" /> Behavioral Risk Radar
          </h2>
          <p className="text-xs text-slate-400 mb-4">High-risk merchant vs. average benchmark</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="#1E293B" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 9 }} />
              <Radar name="High-Risk" dataKey="A" stroke="#F43F5E" fill="#F43F5E" fillOpacity={0.25} />
              <Radar name="Benchmark" dataKey="B" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.15} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* High-risk watchlist */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" /> High-Risk Merchant Watchlist
          </h2>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search merchant…"
              className="bg-slate-800/60 border border-slate-700/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-52"
            />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-800/60">
              <tr className="text-left text-slate-500 border-b border-slate-700/50">
                <th className="px-4 py-3 font-medium">Merchant</th>
                <th className="px-4 py-3 font-medium">UPI ID</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium text-right">Volume</th>
                <th className="px-4 py-3 font-medium text-right">Flagged</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium">Trend</th>
                <th className="px-4 py-3 font-medium">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{m.name}</p>
                    <p className="text-slate-500 font-mono text-[10px]">{m.id}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono">{m.upi}</td>
                  <td className="px-4 py-3 text-slate-300">{m.cat}</td>
                  <td className="px-4 py-3 text-right font-semibold text-white">{m.vol}</td>
                  <td className="px-4 py-3 text-right text-rose-400 font-bold">{m.flagged}</td>
                  <td className="px-4 py-3"><RiskPill score={m.riskScore} /></td>
                  <td className="px-4 py-3">
                    {m.trend === 'up'   && <TrendingUp   className="w-4 h-4 text-rose-400" />}
                    {m.trend === 'down' && <TrendingDown  className="w-4 h-4 text-emerald-400" />}
                    {m.trend === 'flat' && <span className="text-slate-500">─</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{m.lastActivity}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No merchants match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-xs text-amber-300/80 flex items-start gap-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
        <p>All merchant names, UPI IDs, risk scores, and category data are <strong>synthetic</strong>. Fraud rates are illustrative and inspired by industry reports.</p>
      </div>
    </div>
  );
}
