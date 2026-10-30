import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Activity,
  Zap,
  ArrowRight,
  ExternalLink,
  Layers,
  Clock,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import RiskBadge from '../components/RiskBadge';
import { dashboardApi, fraudApi, LiveTransactionSocket } from '../services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total_transactions: 1542,
    safe_transactions: 1284,
    suspicious_transactions: 148,
    fraudulent_transactions: 110,
    total_volume_amount: 8492030.50,
    fraud_amount_detected: 1420950.00,
    fraud_percentage: 7.13,
    high_risk_alerts_count: 38,
    active_mule_nodes: 6,
  });

  const [liveTxns, setLiveTxns] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load initial dashboard data
  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, feedData, alertsData, analyticsData] = await Promise.allSettled([
          dashboardApi.getStats(),
          dashboardApi.getLiveFeed(15),
          fraudApi.getAlerts({ limit: 6 }),
          dashboardApi.getAnalytics(),
        ]);

        if (statsData.status === 'fulfilled' && statsData.value) setStats(statsData.value);
        if (feedData.status === 'fulfilled' && feedData.value) setLiveTxns(feedData.value);
        if (alertsData.status === 'fulfilled' && alertsData.value) setRecentAlerts(alertsData.value);
        if (analyticsData.status === 'fulfilled' && analyticsData.value) setAnalytics(analyticsData.value);
      } catch (err) {
        console.warn('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Hook up WebSocket for live updates
    const socket = new LiveTransactionSocket(
      (newTxn) => {
        setLiveTxns((prev) => [newTxn, ...prev.slice(0, 19)]);
        // Dynamically increment counters
        setStats((prev) => {
          const isFraud = newTxn.risk_score >= 70;
          const isSusp = newTxn.risk_score >= 30 && newTxn.risk_score < 70;
          const total = (prev.total_transactions || 0) + 1;
          const fraudCount = (prev.fraudulent_transactions || 0) + (isFraud ? 1 : 0);
          return {
            ...prev,
            total_transactions: total,
            safe_transactions: (prev.safe_transactions || 0) + (!isFraud && !isSusp ? 1 : 0),
            suspicious_transactions: (prev.suspicious_transactions || 0) + (isSusp ? 1 : 0),
            fraudulent_transactions: fraudCount,
            total_volume_amount: (prev.total_volume_amount || 0) + (newTxn.amount || 0),
            fraud_amount_detected: (prev.fraud_amount_detected || 0) + (isFraud ? newTxn.amount : 0),
            fraud_percentage: +( (fraudCount / total) * 100 ).toFixed(2),
          };
        });
      },
      (newAlert) => {
        setRecentAlerts((prev) => [newAlert, ...prev.slice(0, 5)]);
      }
    );

    socket.connect();
    return () => socket.disconnect();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Stat */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0E1A38] to-[#0A1020] p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              UPI Security Operations Center
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live ML Pipeline
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time inference & anomaly detection for National UPI transaction volume.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/detector"
            className="rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Zap className="h-4 w-4" />
            Evaluate Transaction
          </Link>
          <Link
            to="/live"
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-3.5 py-2 text-xs font-semibold shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition"
          >
            <Activity className="h-4 w-4" />
            Live Monitor
          </Link>
        </div>
      </div>

      {/* KPI Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Processed"
          value={stats.total_transactions?.toLocaleString()}
          subtitle="Processed volume"
          icon={Layers}
          trend={{ value: '+14.2%', label: 'vs yesterday', isPositive: true }}
          variant="default"
        />

        <MetricCard
          title="Safe Transactions"
          value={stats.safe_transactions?.toLocaleString()}
          subtitle="Auto-cleared"
          icon={CheckCircle2}
          trend={{ value: '92.8%', label: 'approval rate', isPositive: true }}
          variant="safe"
        />

        <MetricCard
          title="Suspicious / Review"
          value={stats.suspicious_transactions?.toLocaleString()}
          subtitle="Score: 30 - 69"
          icon={AlertTriangle}
          variant="warning"
        />

        <MetricCard
          title="Fraudulent Blocked"
          value={stats.fraudulent_transactions?.toLocaleString()}
          subtitle="Score: 70 - 100"
          icon={ShieldAlert}
          variant="danger"
        />

        <MetricCard
          title="Fraud Amount Prevented"
          value={`₹${(stats.fraud_amount_detected / 100000).toFixed(2)}L`}
          subtitle={`₹${Number(stats.fraud_amount_detected).toLocaleString()}`}
          icon={DollarSign}
          variant="cyan"
        />

        <MetricCard
          title="Fraud Detection Rate"
          value={`${Number(stats.fraud_percentage).toFixed(2)}%`}
          subtitle="Of total transactions"
          icon={TrendingDown}
          variant="danger"
        />
      </div>

      {/* Main Grid: Live Transaction Feed + High-Risk Alert Triage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Transaction Monitoring Feed (2 Columns) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-[#0D1527]/90 p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Live Ingestion Activity</h3>
                  <p className="text-[11px] text-slate-400">Incoming UPI transactions scored in real time</p>
                </div>
              </div>
              <Link
                to="/live"
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                View Full Stream
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-2.5">Txn ID</th>
                    <th className="pb-2.5">Sender VPA</th>
                    <th className="pb-2.5">Receiver VPA</th>
                    <th className="pb-2.5">Amount</th>
                    <th className="pb-2.5">Risk Score</th>
                    <th className="pb-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {liveTxns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Waiting for live transactions stream...
                      </td>
                    </tr>
                  ) : (
                    liveTxns.slice(0, 8).map((txn, idx) => (
                      <tr key={txn.txn_id || idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 font-medium text-slate-300">
                          <span className="text-cyan-400">{txn.txn_id?.slice(0, 10)}</span>
                          <span className="text-slate-500">{txn.txn_id?.slice(10)}</span>
                        </td>
                        <td className="py-2.5 text-slate-300 truncate max-w-[120px] font-sans" title={txn.sender_upi}>
                          {txn.sender_upi}
                        </td>
                        <td className="py-2.5 text-slate-300 truncate max-w-[120px] font-sans" title={txn.receiver_upi}>
                          {txn.receiver_upi}
                        </td>
                        <td className="py-2.5 font-bold text-white">
                          ₹{Number(txn.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5">
                          <RiskBadge classification={txn.classification} score={txn.risk_score} />
                        </td>
                        <td className="py-2.5 font-sans">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            txn.status === 'BLOCKED' ? 'bg-rose-500/15 text-rose-400' :
                            txn.status === 'FLAG_REVIEW' ? 'bg-amber-500/15 text-amber-400' :
                            'bg-emerald-500/15 text-emerald-400'
                          }`}>
                            {txn.status || 'COMPLETED'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-sans">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              WebSocket Feed Active
            </span>
            <span className="font-mono text-slate-500">Auto-refresh: 3000ms</span>
          </div>
        </div>

        {/* Recent High-Risk Alerts (1 Column) */}
        <div className="rounded-2xl border border-slate-800 bg-[#0D1527]/90 p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Recent Security Alerts</h3>
                  <p className="text-[11px] text-slate-400">Urgent analyst triage queue</p>
                </div>
              </div>
              <Link to="/alerts" className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1">
                All Alerts
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentAlerts.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">No open critical alerts.</div>
              ) : (
                recentAlerts.slice(0, 4).map((alert, i) => (
                  <div key={alert.id || i} className="p-3 rounded-xl border border-rose-500/20 bg-rose-950/20 hover:border-rose-500/40 transition">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30">
                        {alert.alert_type?.replace(/_/g, ' ') || 'SUSPICIOUS_VELOCITY'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Score: <span className="font-bold text-rose-300">{Number(alert.risk_score || 85).toFixed(0)}</span>
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-200 line-clamp-2">
                      {alert.reason || 'Multiple high-value outbound transfers within 3 minutes.'}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono text-[10px] text-slate-500">{alert.txn_id?.slice(0, 16)}</span>
                      <Link
                        to="/alerts"
                        className="text-cyan-400 hover:underline font-semibold"
                      >
                        Review Action &rarr;
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
            <Link
              to="/alerts"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              Open Full Alert Center
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#0D1527]/90 p-5 shadow-xl backdrop-blur-md">
          <h4 className="text-sm font-bold text-white mb-1">Transaction Category Distribution</h4>
          <p className="text-[11px] text-slate-400 mb-4">Volume & risk share by UPI payment classification</p>

          <div className="space-y-3">
            {[
              { label: 'P2P (Peer-to-Peer)', pct: 58, color: 'bg-cyan-500', count: '850 txns' },
              { label: 'P2M (Merchant Retail)', pct: 26, color: 'bg-blue-500', count: '420 txns' },
              { label: 'Investment & Crypto', pct: 9, color: 'bg-rose-500', count: '120 txns (High Risk)' },
              { label: 'Utility & Bills', pct: 7, color: 'bg-emerald-500', count: '152 txns' },
            ].map((cat, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">{cat.label}</span>
                  <span className="text-slate-400 font-mono">{cat.pct}% ({cat.count})</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className={`h-full ${cat.color}`} style={{ width: `${cat.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment App Vector Share */}
        <div className="rounded-2xl border border-slate-800 bg-[#0D1527]/90 p-5 shadow-xl backdrop-blur-md">
          <h4 className="text-sm font-bold text-white mb-1">Payment Method Vectors</h4>
          <p className="text-[11px] text-slate-400 mb-4">PSP application breakdown & volume</p>

          <div className="space-y-3">
            {[
              { app: 'PhonePe', share: 38, count: '520 txns', color: 'bg-indigo-500' },
              { app: 'Google Pay', share: 34, count: '480 txns', color: 'bg-cyan-500' },
              { app: 'Paytm UPI', share: 18, count: '310 txns', color: 'bg-blue-600' },
              { app: 'CRED UPI', share: 6, count: '140 txns', color: 'bg-emerald-500' },
              { app: 'BHIM NPCI', share: 4, count: '92 txns', color: 'bg-amber-500' },
            ].map((app, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">{app.app}</span>
                  <span className="text-slate-400 font-mono">{app.share}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className={`h-full ${app.color}`} style={{ width: `${app.share}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Threat Pattern Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#0D1527]/90 p-5 shadow-xl backdrop-blur-md">
          <h4 className="text-sm font-bold text-white mb-1">Diurnal Fraud Pattern</h4>
          <p className="text-[11px] text-slate-400 mb-4">Fraud concentration spikes nocturnal hours (1 AM - 5 AM)</p>

          <div className="h-40 flex items-end justify-between gap-1 pt-6 px-1">
            {[
              { hour: '00', safe: 12, fraud: 8, height: 40 },
              { hour: '02', safe: 6, fraud: 18, height: 70, alert: true },
              { hour: '04', safe: 8, fraud: 15, height: 60, alert: true },
              { hour: '06', safe: 24, fraud: 3, height: 25 },
              { hour: '08', safe: 84, fraud: 4, height: 45 },
              { hour: '10', safe: 140, fraud: 8, height: 65 },
              { hour: '12', safe: 160, fraud: 9, height: 75 },
              { hour: '14', safe: 130, fraud: 11, height: 60 },
              { hour: '16', safe: 175, fraud: 12, height: 80 },
              { hour: '18', safe: 190, fraud: 15, height: 90 },
              { hour: '20', safe: 210, fraud: 18, height: 95 },
              { hour: '22', safe: 110, fraud: 14, height: 55 },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className={`w-full rounded-t transition-all ${
                    bar.alert ? 'bg-rose-500 shadow-md shadow-rose-500/30' : 'bg-cyan-500/60 group-hover:bg-cyan-400'
                  }`}
                  style={{ height: `${bar.height}%` }}
                ></div>
                <span className="text-[9px] text-slate-500 font-mono">{bar.hour}</span>

                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 rounded bg-slate-900 border border-slate-700 p-1.5 text-[10px] text-white whitespace-nowrap shadow-xl">
                  <span>{bar.hour}:00 HRS: </span>
                  <span className="text-rose-400 font-bold">{bar.fraud} frauds</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              Nocturnal Spike Vector (01:00-05:00)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-500"></span>
              Standard Retail Peak
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
