import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  Pause,
  Filter,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Search,
  Eye,
  X,
  Clock,
  Layers,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { transactionsApi, LiveTransactionSocket, fraudApi } from '../services/api';

export default function LiveMonitoringPage() {
  const [stream, setStream] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, SAFE, SUSPICIOUS, FRAUDULENT
  const [search, setSearch] = useState('');
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initial load
  useEffect(() => {
    async function loadInitial() {
      try {
        const txns = await transactionsApi.list({ limit: 40 });
        if (Array.isArray(txns)) setStream(txns);
      } catch (err) {
        console.warn('Initial feed load err:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();

    // WebSocket live stream
    const socket = new LiveTransactionSocket(
      (newTxn) => {
        if (!isPaused) {
          setStream((prev) => [newTxn, ...prev.slice(0, 99)]);
        }
      },
      () => {},
      () => {}
    );

    socket.connect();
    return () => socket.disconnect();
  }, [isPaused]);

  // Filtered transactions
  const filtered = stream.filter((item) => {
    if (filter !== 'ALL' && (item.classification || '').toUpperCase() !== filter) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const matchId = (item.txn_id || '').toLowerCase().includes(q);
      const matchSender = (item.sender_upi || '').toLowerCase().includes(q);
      const matchReceiver = (item.receiver_upi || '').toLowerCase().includes(q);
      if (!matchId && !matchSender && !matchReceiver) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0D1527]/90 p-5 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              Live UPI Transaction Monitoring
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className={`h-1.5 w-1.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`}></span>
              {isPaused ? 'STREAM PAUSED' : 'STREAMING 100+ TXN/MIN'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time inspection of high-volume digital payment transfers with millisecond AI risk scoring.
          </p>
        </div>

        {/* Controls: Pause/Resume + Inject */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              isPaused
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            <span>{isPaused ? 'Resume Stream' : 'Pause Stream'}</span>
          </button>

          <button
            onClick={() => fraudApi.generateSimulatedTxn('velocity_spike')}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 px-3 py-2 text-xs font-semibold text-rose-300 transition"
          >
            <Zap className="h-4 w-4" />
            <span>Simulate Burst</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-[#0D1527] p-1 text-xs">
          {['ALL', 'SAFE', 'SUSPICIOUS', 'FRAUDULENT'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                filter === tab
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search VPA or Txn ID..."
            className="w-full rounded-xl border border-slate-800 bg-[#0D1527] pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Stream Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#0D1527]/90 shadow-xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Sender VPA</th>
                <th className="py-3 px-4">Receiver VPA</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">App Vector</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                    No transactions match current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((txn, idx) => (
                  <tr
                    key={txn.txn_id || idx}
                    onClick={() => setSelectedTxn(txn)}
                    className="hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-medium text-slate-300">
                      <span className="text-cyan-400">{txn.txn_id?.slice(0, 10)}</span>
                      <span className="text-slate-500">{txn.txn_id?.slice(10)}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-sans truncate max-w-[140px]" title={txn.sender_upi}>
                      {txn.sender_upi}
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-sans truncate max-w-[140px]" title={txn.receiver_upi}>
                      {txn.receiver_upi}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      ₹{Number(txn.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400 text-[11px]">
                      {txn.payment_method?.replace(/_/g, ' ') || 'UPI APP'}
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge classification={txn.classification} score={txn.risk_score} />
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        txn.status === 'BLOCKED' ? 'bg-rose-500/15 text-rose-400' :
                        txn.status === 'FLAG_REVIEW' ? 'bg-amber-500/15 text-amber-400' :
                        'bg-emerald-500/15 text-emerald-400'
                      }`}>
                        {txn.status || 'COMPLETED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTxn(txn);
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-cyan-400 transition"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#0D1527] p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedTxn(null)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                  {selectedTxn.txn_id}
                </h3>
                <p className="text-xs text-slate-400">Deep AI Risk Evaluation & Telemetry</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Amount</p>
                <p className="text-lg font-bold text-white font-mono mt-0.5">₹{Number(selectedTxn.amount).toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Risk Score</p>
                <p className="text-lg font-bold text-cyan-400 font-mono mt-0.5">{Number(selectedTxn.risk_score || 0).toFixed(1)}/100</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Classification</p>
                <div className="mt-1">
                  <RiskBadge classification={selectedTxn.classification} score={selectedTxn.risk_score} />
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">System Action</p>
                <p className={`text-sm font-bold font-mono mt-1 ${
                  selectedTxn.status === 'BLOCKED' ? 'text-rose-400' :
                  selectedTxn.status === 'FLAG_REVIEW' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {selectedTxn.decision || (selectedTxn.risk_score >= 70 ? 'BLOCK' : selectedTxn.risk_score >= 30 ? 'REVIEW' : 'ALLOW')}
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Sender VPA (Payer):</span>
                <span className="font-mono text-white">{selectedTxn.sender_upi}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Receiver VPA (Payee):</span>
                <span className="font-mono text-white">{selectedTxn.receiver_upi}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Payment Vector / App:</span>
                <span className="text-white">{selectedTxn.payment_method}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Timestamp:</span>
                <span className="font-mono text-slate-300">{selectedTxn.timestamp}</span>
              </div>
            </div>

            {/* AI Explanation factor */}
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4">
              <p className="text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="h-4 w-4" />
                AI Inference Reasoning
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                {selectedTxn.explanations?.length ? (
                  selectedTxn.explanations.map((exp, i) => <li key={i}>{exp}</li>)
                ) : (
                  <li>
                    {selectedTxn.risk_score >= 70
                      ? 'Abnormal transaction velocity spike and mule fan-in degree trigger critical threshold.'
                      : selectedTxn.risk_score >= 30
                      ? 'Transaction amount is elevated compared to historical baseline.'
                      : 'Legitimate regular retail behavior matching standard profile.'}
                  </li>
                )}
              </ul>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedTxn(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
