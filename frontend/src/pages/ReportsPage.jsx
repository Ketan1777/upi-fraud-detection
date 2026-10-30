import React, { useState, useEffect } from 'react';
import {
  FileBarChart2,
  Download,
  Calendar,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  Layers,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { dashboardApi, reportsApi } from '../services/api';

export default function ReportsPage() {
  const [period, setPeriod] = useState('7d');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await dashboardApi.getAnalytics();
        if (data) setAnalytics(data);
      } catch (e) {
        console.warn('Analytics err:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [period]);

  const handleExport = (type) => {
    const url = reportsApi.exportCsvUrl({ classification: type === 'fraud' ? 'FRAUDULENT' : undefined });
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0D1527]/90 p-5 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <FileBarChart2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Fraud Analytics & Executive Reporting</h1>
              <p className="text-xs text-slate-400">
                Performance metrics, false-positive ratios, and compliance summaries for cyber risk governance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 p-1 text-xs">
            {['today', '7d', '30d', 'quarter'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded px-2.5 py-1 font-medium uppercase transition ${
                  period === p ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleExport('all')}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Intercepted Fraud"
          value="₹14.21 Lakhs"
          subtitle="99.4% settlement hold success"
          icon={ShieldAlert}
          variant="danger"
        />

        <MetricCard
          title="Model Precision"
          value="98.4%"
          subtitle="True positives / flagged txns"
          icon={ShieldCheck}
          variant="safe"
        />

        <MetricCard
          title="False Positive Rate"
          value="0.62%"
          subtitle="Minimizing user checkout friction"
          icon={TrendingDown}
          variant="cyan"
        />

        <MetricCard
          title="Average Investigation Time"
          value="4.2 mins"
          subtitle="Analyst triage response SLA"
          icon={Calendar}
          variant="default"
        />
      </div>

      {/* Weekly Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend Chart Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#0D1527]/90 p-5 shadow-xl backdrop-blur-md">
          <h3 className="text-sm font-bold text-white mb-1">Weekly Transaction & Fraud Incident Trend</h3>
          <p className="text-[11px] text-slate-400 mb-4">Daily transaction load vs blocked fraudulent payments</p>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
            {(analytics?.weekly_trends || [
              { date: 'Oct 24', total_txns: 180, fraud_txns: 12, safe_txns: 168 },
              { date: 'Oct 25', total_txns: 210, fraud_txns: 14, safe_txns: 196 },
              { date: 'Oct 26', total_txns: 195, fraud_txns: 11, safe_txns: 184 },
              { date: 'Oct 27', total_txns: 240, fraud_txns: 19, safe_txns: 221 },
              { date: 'Oct 28', total_txns: 260, fraud_txns: 22, safe_txns: 238 },
              { date: 'Oct 29', total_txns: 225, fraud_txns: 16, safe_txns: 209 },
              { date: 'Oct 30', total_txns: 232, fraud_txns: 16, safe_txns: 216 },
            ]).map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                {/* Total bar with nested fraud bar */}
                <div className="w-full flex flex-col justify-end bg-slate-800/80 rounded-t h-36 overflow-hidden">
                  <div
                    className="w-full bg-cyan-500/70 group-hover:bg-cyan-400 transition"
                    style={{ height: `${(d.safe_txns / 300) * 100}%` }}
                  ></div>
                  <div
                    className="w-full bg-rose-500 shadow-sm shadow-rose-500/40"
                    style={{ height: `${(d.fraud_txns / 300) * 100}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{d.date}</span>

                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 rounded bg-slate-900 border border-slate-700 p-2 text-[10px] text-white whitespace-nowrap shadow-xl">
                  <p className="font-bold text-white">{d.date}</p>
                  <p className="text-cyan-400">Total: {d.total_txns} txns</p>
                  <p className="text-rose-400 font-bold">Fraud: {d.fraud_txns} txns</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-500"></span>
              Legitimate Processed Volume
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
              Intercepted Fraud Events
            </span>
          </div>
        </div>

        {/* Risk Score Frequency Distribution */}
        <div className="rounded-2xl border border-slate-800 bg-[#0D1527]/90 p-5 shadow-xl backdrop-blur-md">
          <h3 className="text-sm font-bold text-white mb-1">AI Risk Score Frequency Histogram</h3>
          <p className="text-[11px] text-slate-400 mb-4">Bimodal distribution showing distinct separation between safe and fraudulent txns</p>

          <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2">
            {[
              { bin: '0-10', count: 940, label: 'Safe', color: 'bg-emerald-500' },
              { bin: '10-20', count: 210, label: 'Safe', color: 'bg-emerald-500' },
              { bin: '20-30', count: 134, label: 'Safe', color: 'bg-emerald-500' },
              { bin: '30-40', count: 48, label: 'Suspicious', color: 'bg-amber-500' },
              { bin: '40-50', count: 36, label: 'Suspicious', color: 'bg-amber-500' },
              { bin: '50-60', count: 32, label: 'Suspicious', color: 'bg-amber-500' },
              { bin: '60-70', count: 32, label: 'Suspicious', color: 'bg-amber-500' },
              { bin: '70-80', count: 42, label: 'Fraud', color: 'bg-rose-500' },
              { bin: '80-90', count: 48, label: 'Fraud', color: 'bg-rose-500' },
              { bin: '90-100', count: 20, label: 'Fraud', color: 'bg-rose-500' },
            ].map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                <div
                  className={`w-full rounded-t transition-all ${b.color} opacity-85 group-hover:opacity-100`}
                  style={{ height: `${Math.max(6, (b.count / 950) * 100)}%` }}
                ></div>
                <span className="text-[9px] text-slate-500 font-mono -rotate-45 sm:rotate-0">{b.bin}</span>

                <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 rounded bg-slate-900 border border-slate-700 p-1.5 text-[10px] text-white whitespace-nowrap shadow-xl">
                  <span>Score {b.bin}: </span>
                  <span className="font-bold">{b.count} txns</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-3">
            <span className="text-emerald-400 font-semibold">0-29: Safe (83.3%)</span>
            <span className="text-amber-400 font-semibold">30-69: Suspicious (9.6%)</span>
            <span className="text-rose-400 font-semibold">70-100: Fraudulent (7.1%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
