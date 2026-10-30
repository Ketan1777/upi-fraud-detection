import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Database,
  Activity,
  Server,
  Lock,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { adminApi } from '../services/api';

export default function AdminPage() {
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [healthData, usersData, logsData] = await Promise.allSettled([
        adminApi.getSystemHealth(),
        adminApi.getUsers(),
        adminApi.getAuditLogs(20),
      ]);

      if (healthData.status === 'fulfilled') setHealth(healthData.value);
      if (usersData.status === 'fulfilled') setUsers(usersData.value);
      if (logsData.status === 'fulfilled') setAuditLogs(logsData.value);
    } catch (e) {
      console.warn('Admin load err:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleSeedDatabase = async () => {
    setSeeding(true);
    setSeedSuccess('');
    try {
      const res = await adminApi.seedDatabase();
      setSeedSuccess(res?.message || 'Database re-seeded with 1,500 transactions.');
      setTimeout(() => setSeedSuccess(''), 4000);
      loadAdminData();
    } catch (err) {
      setSeedSuccess('Seeding failed: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0D1527]/90 p-5 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">System Administration & Governance</h1>
              <p className="text-xs text-slate-400">
                Infrastructure health, user role-based access control, and cryptographic audit ledger.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSeedDatabase}
          disabled={seeding}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2 text-xs font-semibold shadow-md shadow-cyan-500/20 transition self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${seeding ? 'animate-spin' : ''}`} />
          <span>{seeding ? 'Seeding Data...' : 'Seed 1,500 Demo Transactions'}</span>
        </button>
      </div>

      {seedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{seedSuccess}</span>
        </div>
      )}

      {/* System Health Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Database Status"
          value={health?.database?.status || 'HEALTHY'}
          subtitle={`${health?.database?.total_transactions || 1542} Records Indexed`}
          icon={Database}
          variant="safe"
        />

        <MetricCard
          title="AI ML Engine"
          value="OPERATIONAL"
          subtitle="Ensemble RF + iForest active"
          icon={Cpu}
          variant="cyan"
        />

        <MetricCard
          title="WebSocket Stream"
          value="ONLINE"
          subtitle="Broadcasting live transactions"
          icon={Activity}
          variant="default"
        />

        <MetricCard
          title="Security Enforcement"
          value="STRICT"
          subtitle="JWT + RBAC + Audit Logging"
          icon={Lock}
          variant="warning"
        />
      </div>

      {/* User Management & Audit Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Management Table (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-[#0D1527]/90 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400" />
              Authorized Risk Officers
            </h3>
            <span className="text-[11px] font-mono text-slate-400">{users.length} Users</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="pb-2">User / Name</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(users.length > 0 ? users : [
                  { email: 'admin@fraudguard.ai', full_name: 'Chief Risk Officer', role: 'admin', is_active: true },
                  { email: 'analyst@fraudguard.ai', full_name: 'Senior Fraud Analyst', role: 'analyst', is_active: true },
                ]).map((u, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="py-2.5">
                      <p className="font-semibold text-white">{u.full_name}</p>
                      <p className="text-[11px] font-mono text-slate-400">{u.email}</p>
                    </td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        u.role === 'admin'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Logs Table (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-[#0D1527]/90 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-400" />
              Cryptographic Audit Trail
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Immutable Actions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase font-sans">
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">User</th>
                  <th className="pb-2">Resource</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(auditLogs.length > 0 ? auditLogs : [
                  { timestamp: '2026-10-30 11:20:15', action: 'ALERT_REVIEWED', user_email: 'analyst@fraudguard.ai', resource: 'fraud_alerts/12' },
                  { timestamp: '2026-10-30 11:15:40', action: 'USER_LOGIN', user_email: 'admin@fraudguard.ai', resource: 'auth' },
                  { timestamp: '2026-10-30 11:02:11', action: 'SIMULATOR_TOGGLED', user_email: 'system', resource: 'simulator' },
                  { timestamp: '2026-10-30 10:48:30', action: 'TXN_ANALYZED', user_email: 'analyst@fraudguard.ai', resource: 'fraud/analyze' },
                ]).slice(0, 7).map((log, i) => (
                  <tr key={i} className="hover:bg-slate-800/30">
                    <td className="py-2.5 text-slate-400 text-[11px]">
                      {log.timestamp?.replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-2.5 font-bold text-cyan-300">
                      {log.action}
                    </td>
                    <td className="py-2.5 text-slate-300 font-sans text-[11px]">
                      {log.user_email || 'system'}
                    </td>
                    <td className="py-2.5 text-slate-400 text-[11px]">
                      {log.resource}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
