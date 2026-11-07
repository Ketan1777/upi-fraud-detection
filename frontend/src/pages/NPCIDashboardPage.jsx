import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend,
} from 'recharts';
import {
  Globe2, TrendingUp, TrendingDown, Banknote, Smartphone,
  ShieldAlert, Activity, Building2, Users, Zap, ArrowUpRight, ArrowDownRight,
  RefreshCw, Info, BarChart3,
} from 'lucide-react';

// ── Synthetic NPCI/UPI ecosystem data ─────────────────────────────────────────

const UPI_APPS = [
  { name: 'PhonePe',  share: 47.8, txns: 7290, color: '#6C3BD5' },
  { name: 'GPay',     share: 36.2, txns: 5520, color: '#4285F4' },
  { name: 'Paytm',    share: 9.1,  txns: 1388, color: '#00BAF2' },
  { name: 'BHIM',     share: 3.4,  txns: 519,  color: '#1A73E8' },
  { name: 'Others',   share: 3.5,  txns: 534,  color: '#94A3B8' },
];

const BANK_FRAUD_RATE = [
  { bank: 'SBI',     fraud: 0.82, vol: 24300, flagged: 199 },
  { bank: 'HDFC',    fraud: 0.54, vol: 19800, flagged: 107 },
  { bank: 'ICICI',   fraud: 0.61, vol: 17200, flagged: 105 },
  { bank: 'Axis',    fraud: 0.78, vol: 11600, flagged: 90  },
  { bank: 'Kotak',   fraud: 0.43, vol: 8900,  flagged: 38  },
  { bank: 'Yes',     fraud: 1.12, vol: 5400,  flagged: 60  },
  { bank: 'PNB',     fraud: 0.95, vol: 7100,  flagged: 67  },
  { bank: 'BoB',     fraud: 0.89, vol: 6400,  flagged: 57  },
];

const STATE_FRAUD = [
  { state: 'Maharashtra', txns: 14200, fraudAmt: 2840000, pct: 2.1 },
  { state: 'Delhi',       txns: 11800, fraudAmt: 2360000, pct: 2.4 },
  { state: 'Karnataka',   txns: 9600,  fraudAmt: 1440000, pct: 1.8 },
  { state: 'Tamil Nadu',  txns: 8900,  fraudAmt: 1335000, pct: 1.9 },
  { state: 'Gujarat',     txns: 7400,  fraudAmt: 1480000, pct: 2.5 },
  { state: 'Rajasthan',   txns: 5800,  fraudAmt: 1392000, pct: 2.8 },
  { state: 'UP',          txns: 10200, fraudAmt: 2244000, pct: 2.9 },
  { state: 'West Bengal', txns: 6900,  fraudAmt: 1173000, pct: 1.7 },
  { state: 'Telangana',   txns: 5300,  fraudAmt: 742000,  pct: 1.4 },
  { state: 'Bihar',       txns: 4100,  fraudAmt: 1066000, pct: 3.2 },
];

const MONTHLY_VOL = [
  { month: 'Jun', volume: 1392, fraudCr: 142 },
  { month: 'Jul', volume: 1456, fraudCr: 128 },
  { month: 'Aug', volume: 1510, fraudCr: 157 },
  { month: 'Sep', volume: 1489, fraudCr: 139 },
  { month: 'Oct', volume: 1601, fraudCr: 161 },
  { month: 'Nov', volume: 1532, fraudCr: 148 },
];

const FRAUD_CATEGORIES = [
  { name: 'Phishing / Vishing', count: 4820, pct: 38.2 },
  { name: 'SIM Swap',           count: 2310, pct: 18.3 },
  { name: 'Fake Collect Req.',  count: 1980, pct: 15.7 },
  { name: 'Money Mule',         count: 1540, pct: 12.2 },
  { name: 'Merchant Fraud',     count: 980,  pct: 7.8  },
  { name: 'Others',             count: 980,  pct: 7.8  },
];

const PIE_COLORS = ['#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

const HOURLY_FRAUD = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h}:00`,
  risk: h >= 0 && h <= 5 ? Math.random() * 40 + 55
      : h >= 10 && h <= 14 ? Math.random() * 20 + 20
      : Math.random() * 25 + 15,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n) { return n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)} L` : `₹${n.toLocaleString('en-IN')}`; }
function fmtB(n) { return n >= 1e9 ? `${(n / 1e9).toFixed(2)} B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)} M` : n.toLocaleString('en-IN'); }

function StatBadge({ label, value, sub, up }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-1">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
      {sub && (
        <p className={`text-xs flex items-center gap-1 ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
          {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {sub}
        </p>
      )}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, sub }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
        <Icon className="w-4 h-4 text-cyan-400" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-white">{title}</h2>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NPCIDashboardPage() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [pulse, setPulse] = useState(false);
  const liveRef = useRef(null);

  // Live-ticker: micro-update every 4s
  const [ticker, setTicker] = useState({
    totalToday: 15251832,
    valueToday: 18420,   // crores
    successRate: 99.14,
    avgLatency: 1.23,
  });

  useEffect(() => {
    const id = setInterval(() => {
      setTicker(t => ({
        totalToday: t.totalToday + Math.floor(Math.random() * 800 + 200),
        valueToday: +(t.valueToday + (Math.random() * 0.5)).toFixed(2),
        successRate: +(99.1 + Math.random() * 0.09).toFixed(2),
        avgLatency: +(1.1 + Math.random() * 0.4).toFixed(2),
      }));
      setPulse(p => !p);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-[#060C1A] text-white px-6 py-6 space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-semibold tracking-widest uppercase">NPCI Live Feed</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">UPI Ecosystem Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Synthetic national-level metrics · refreshes every 4 s</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <RefreshCw className={`w-3 h-3 ${pulse ? 'text-cyan-400 animate-spin' : ''}`} />
          Last sync: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>

      {/* ── Live Ticker Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBadge label="Transactions Today" value={fmtB(ticker.totalToday)} sub="+3.2% vs yesterday" up />
        <StatBadge label="Total Value Today" value={`₹${ticker.valueToday.toLocaleString()} Cr`} sub="+1.8% vs yesterday" up />
        <StatBadge label="Success Rate" value={`${ticker.successRate}%`} sub="-0.02% vs last hour" up={false} />
        <StatBadge label="Avg Settlement Latency" value={`${ticker.avgLatency}s`} sub="+0.1s vs baseline" up={false} />
      </div>

      {/* ── UPI App Share + Monthly Volume ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* App Pie */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5">
          <SectionTitle icon={Smartphone} title="UPI App Market Share" sub="% of total monthly transaction count" />
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={UPI_APPS} dataKey="share" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3}>
                  {UPI_APPS.map((_, i) => <Cell key={i} fill={UPI_APPS[i].color} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 text-xs flex-1 w-full">
              {UPI_APPS.map((app, i) => (
                <div key={app.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: app.color }} />
                    <span className="text-slate-300">{app.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">{app.txns.toLocaleString()} M txns</span>
                    <span className="font-semibold text-white w-12 text-right">{app.share}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly volume area */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5">
          <SectionTitle icon={BarChart3} title="Monthly UPI Volume (Crore txns)" sub="Jun–Nov 2025 — fraud value in ₹ Cr" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MONTHLY_VOL} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gVol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gFraud" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="volume" name="UPI Volume (Cr)" stroke="#06B6D4" fill="url(#gVol)" strokeWidth={2} />
              <Area type="monotone" dataKey="fraudCr" name="Fraud Amount (₹Cr)" stroke="#F43F5E" fill="url(#gFraud)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bank-wise Fraud Rate ── */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5">
        <SectionTitle icon={Building2} title="Bank-wise Fraud Rate (%)" sub="Fraud txns as % of total UPI volume per bank" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={BANK_FRAUD_RATE} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="bank" tick={{ fill: '#94A3B8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} unit="%" />
            <Tooltip
              contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, fontSize: 12 }}
              formatter={(v, name) => [`${v}%`, name === 'fraud' ? 'Fraud Rate' : name]}
            />
            <Bar dataKey="fraud" name="Fraud Rate (%)" radius={[4, 4, 0, 0]}>
              {BANK_FRAUD_RATE.map((entry) => (
                <Cell key={entry.bank} fill={entry.fraud > 1 ? '#F43F5E' : entry.fraud > 0.75 ? '#F59E0B' : '#06B6D4'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {BANK_FRAUD_RATE.map(b => (
            <div key={b.bank} className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-1.5">
              <span className="text-slate-400">{b.bank}</span>
              <span className="font-semibold text-white">{b.flagged} flagged</span>
              <span className={b.fraud > 1 ? 'text-rose-400' : b.fraud > 0.75 ? 'text-amber-400' : 'text-cyan-400'}>
                {b.fraud}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── State Heatmap + Fraud Categories ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* State table */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5">
          <SectionTitle icon={Globe2} title="State-wise Fraud Distribution" sub="Sorted by fraud % — synthetic data" />
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-700/50">
                  <th className="pb-2 font-medium">State</th>
                  <th className="pb-2 font-medium text-right">Txns</th>
                  <th className="pb-2 font-medium text-right">Fraud Amt</th>
                  <th className="pb-2 font-medium text-right">Fraud %</th>
                  <th className="pb-2 font-medium text-right">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {STATE_FRAUD.sort((a, b) => b.pct - a.pct).map(s => (
                  <tr key={s.state} className="hover:bg-slate-800/30 transition">
                    <td className="py-2 text-slate-300">{s.state}</td>
                    <td className="py-2 text-right text-slate-400">{s.txns.toLocaleString()}</td>
                    <td className="py-2 text-right text-slate-300">{fmt(s.fraudAmt)}</td>
                    <td className="py-2 text-right font-semibold text-white">{s.pct}%</td>
                    <td className="py-2 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold
                        ${s.pct > 2.5 ? 'bg-rose-500/20 text-rose-400'
                          : s.pct > 2 ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {s.pct > 2.5 ? 'HIGH' : s.pct > 2 ? 'MED' : 'LOW'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fraud categories */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5">
          <SectionTitle icon={ShieldAlert} title="Fraud Category Breakdown" sub="Types of fraud detected this month" />
          <div className="space-y-3">
            {FRAUD_CATEGORIES.map((cat, i) => (
              <div key={cat.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">{cat.name}</span>
                  <span className="text-slate-400">{cat.count.toLocaleString()} cases · <span className="text-white font-semibold">{cat.pct}%</span></span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${cat.pct}%`, background: PIE_COLORS[i] }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-700/50 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-slate-400">Total Cases</p>
              <p className="text-white font-bold text-base">12,610</p>
            </div>
            <div>
              <p className="text-slate-400">Recovered</p>
              <p className="text-emerald-400 font-bold text-base">₹8.4 Cr</p>
            </div>
            <div>
              <p className="text-slate-400">Pending Review</p>
              <p className="text-amber-400 font-bold text-base">1,284</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hourly Risk Heatmap ── */}
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5">
        <SectionTitle icon={Activity} title="24-Hour Risk Score Heatmap" sub="Average fraud risk score by hour of day — higher at night" />
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={HOURLY_FRAUD} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gRisk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="hour" tick={{ fill: '#94A3B8', fontSize: 10 }} interval={3} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="risk" name="Risk Score" stroke="#F43F5E" fill="url(#gRisk)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
          <Info className="w-3 h-3" /> Late-night transactions (00:00–05:00) carry 2.3× higher fraud risk on average.
        </p>
      </div>

      {/* ── Disclaimer ── */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-xs text-amber-300/80 flex items-start gap-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
        <p>
          All figures on this page are <strong>synthetically generated</strong> for demonstration purposes and are designed to
          reflect realistic UPI ecosystem proportions (based on NPCI public disclosures). They do not represent actual NPCI
          or bank data.
        </p>
      </div>
    </div>
  );
}
