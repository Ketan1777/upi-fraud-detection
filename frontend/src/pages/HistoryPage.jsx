import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Download,
  Filter,
  ArrowUpDown,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { transactionsApi, reportsApi } from '../services/api';

export default function HistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classification, setClassification] = useState('');
  const [status, setStatus] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await transactionsApi.list({
        search,
        classification,
        status,
        min_amount: minAmount ? parseFloat(minAmount) : undefined,
        max_amount: maxAmount ? parseFloat(maxAmount) : undefined,
        limit: 100,
      });
      if (Array.isArray(data)) setTransactions(data);
    } catch (e) {
      console.warn('History fetch err:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [classification, status]);

  const handleDownloadCsv = () => {
    const url = reportsApi.exportCsvUrl({
      classification,
      status,
      min_risk: classification === 'FRAUDULENT' ? 70 : undefined,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0D1527]/90 p-5 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Transaction History & Forensic Search</h1>
              <p className="text-xs text-slate-400">
                Audited ledger of high-volume digital payments with historical risk scores.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 text-xs font-semibold shadow-md shadow-emerald-600/20 transition self-start sm:self-auto"
        >
          <Download className="h-4 w-4" />
          <span>Export Filtered CSV</span>
        </button>
      </div>

      {/* Filter Box */}
      <div className="rounded-2xl border border-slate-800 bg-[#0D1527]/90 p-4 shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search text */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTransactions()}
              placeholder="Search Txn ID, Sender VPA, or Payee..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Classification */}
          <div>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Classifications</option>
              <option value="SAFE">Safe (0-29)</option>
              <option value="SUSPICIOUS">Suspicious (30-69)</option>
              <option value="FRAUDULENT">Fraudulent (70-100)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Actions</option>
              <option value="COMPLETED">Completed</option>
              <option value="BLOCKED">Blocked</option>
              <option value="FLAG_REVIEW">Flagged for Review</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            onClick={fetchTransactions}
            className="rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 py-2 text-xs font-semibold transition"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#0D1527]/90 shadow-xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Sender VPA</th>
                <th className="py-3 px-4">Receiver VPA</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                    No transactions found for the specified criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-cyan-400">
                      {txn.txn_id}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-sans text-[11px]">
                      {txn.timestamp?.replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-sans truncate max-w-[140px]" title={txn.sender_upi}>
                      {txn.sender_upi}
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-sans truncate max-w-[140px]" title={txn.receiver_upi}>
                      {txn.receiver_upi}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      ₹{Number(txn.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400 text-[11px]">
                      {txn.payment_method}
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
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
