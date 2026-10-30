import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Filter,
  Search,
  Check,
  X,
  FileText,
  User,
  Clock,
  ExternalLink,
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { fraudApi } from '../services/api';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState('CONFIRMED_FRAUD');
  const [submitting, setSubmitting] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await fraudApi.getAlerts({
        status: statusFilter,
        severity: severityFilter,
        limit: 50,
      });
      if (Array.isArray(data)) setAlerts(data);
    } catch (e) {
      console.warn('Alerts fetch err:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setSubmitting(true);
    try {
      await fraudApi.reviewAlert(selectedAlert.id, reviewStatus, reviewNotes);
      // Update local state
      setAlerts((prev) =>
        prev.map((a) => (a.id === selectedAlert.id ? { ...a, status: reviewStatus, reviewer_notes: reviewNotes } : a))
      );
      setSelectedAlert(null);
      setReviewNotes('');
    } catch (err) {
      console.warn('Failed to review alert:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-[#0D1527]/90 p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Security Alerts & Incident Triage</h1>
            <p className="text-xs text-slate-400">
              Manage high-risk transaction flags, mule account activations, and rapid fraud outbreaks.
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New (Unreviewed)</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="CONFIRMED_FRAUD">Confirmed Fraud</option>
              <option value="FALSE_POSITIVE">False Positive</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical (Score 80+)</option>
              <option value="HIGH">High (Score 60-79)</option>
              <option value="MEDIUM">Medium (Score 30-59)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#0D1527]/90 shadow-xl backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Alert Type</th>
                <th className="py-3 px-4">Txn ID</th>
                <th className="py-3 px-4">Risk Reason</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No alerts match the chosen filters.
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        alert.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {alert.alert_type?.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-400 text-[11px]">
                      {alert.txn_id}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-sm truncate" title={alert.reason}>
                      {alert.reason}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {Number(alert.risk_score || 0).toFixed(0)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        alert.status === 'NEW' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        alert.status === 'CONFIRMED_FRAUD' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        alert.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-slate-700/50 text-slate-300'
                      }`}>
                        {alert.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedAlert(alert);
                          setReviewNotes(alert.reviewer_notes || '');
                          setReviewStatus(alert.status === 'NEW' ? 'CONFIRMED_FRAUD' : alert.status);
                        }}
                        className="rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-3 py-1 text-xs font-semibold transition"
                      >
                        Triage / Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0D1527] p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedAlert(null)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">
              Review Fraud Incident #{selectedAlert.id}
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Txn: {selectedAlert.txn_id} | Score: {Number(selectedAlert.risk_score).toFixed(0)}
            </p>

            <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
              <span className="font-semibold text-white">Detection Reason: </span>
              {selectedAlert.reason}
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Update Status</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="CONFIRMED_FRAUD">CONFIRMED FRAUD (Freeze Account / Reversal)</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW (Escalated to Cyber Cell)</option>
                  <option value="FALSE_POSITIVE">FALSE POSITIVE (Legitimate User Activity)</option>
                  <option value="RESOLVED">RESOLVED (Resolved / Cleared)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Analyst Notes & Audit Reason</label>
                <textarea
                  rows={3}
                  required
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Explain resolution findings (e.g., Confirmed stolen device; initiated UPI lien hold with issuing bank)..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500"
                >
                  {submitting ? 'Saving...' : 'Save Audit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
