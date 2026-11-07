import React, { useState } from 'react';
import {
  ShieldCheck, AlertTriangle, FileCheck2, Clock, CheckCircle2,
  XCircle, ChevronDown, ChevronUp, Gavel, Lock, FileText,
  TrendingUp, Users, RefreshCw, Info,
} from 'lucide-react';

// ── Synthetic AML / Compliance data ──────────────────────────────────────────

const COMPLIANCE_RULES = [
  {
    id: 'RBI-2023-14',
    title: 'RBI Digital Payments Security Controls (2023)',
    status: 'compliant',
    lastAudit: '2025-10-15',
    score: 97,
    items: [
      { label: 'Two-Factor Auth on high-value txns', ok: true },
      { label: 'Device binding for UPI apps', ok: true },
      { label: 'SMS / email alert on every txn', ok: true },
      { label: 'Txn limit controls enforced', ok: true },
      { label: 'Cooling period for new payees', ok: false },
    ],
  },
  {
    id: 'PMLA-2002',
    title: 'Prevention of Money Laundering Act (PMLA)',
    status: 'compliant',
    lastAudit: '2025-09-28',
    score: 94,
    items: [
      { label: 'KYC verified before UPI onboarding', ok: true },
      { label: 'Suspicious Transaction Reports (STRs) filed', ok: true },
      { label: 'High-value cash transaction reporting', ok: true },
      { label: 'PEP / Sanctions screening active', ok: true },
      { label: 'Automated CTR for txns > ₹10 L', ok: false },
    ],
  },
  {
    id: 'NPCI-FRM-V2',
    title: 'NPCI Fraud Risk Management Framework V2',
    status: 'review',
    lastAudit: '2025-11-01',
    score: 82,
    items: [
      { label: 'Real-time transaction scoring (< 300ms)', ok: true },
      { label: 'Velocity checks on UPI IDs', ok: true },
      { label: 'Network-graph ring detection', ok: true },
      { label: 'Automated mule account flagging', ok: false },
      { label: 'Callback API to PSP for block action', ok: false },
    ],
  },
  {
    id: 'DPDP-2023',
    title: 'Digital Personal Data Protection Act (DPDP)',
    status: 'compliant',
    lastAudit: '2025-10-20',
    score: 91,
    items: [
      { label: 'User consent collected at onboarding', ok: true },
      { label: 'Data minimization in ML features', ok: true },
      { label: 'Right-to-erasure endpoint available', ok: true },
      { label: 'Data retained ≤ 5 years policy set', ok: true },
      { label: 'DPO appointed and registered', ok: false },
    ],
  },
];

const SAR_QUEUE = [
  { id: 'SAR-2025-1189', upiId: 'raj.kumar99@oksbi', amount: '₹4,80,000', reason: 'Structuring — 48 txns × ₹10,000', status: 'filed',    priority: 'high',   analyst: 'Meera S.' },
  { id: 'SAR-2025-1190', upiId: 'suresh.p@ybl',      amount: '₹2,25,000', reason: 'Round-trip cycle (5 hops)',       status: 'pending',  priority: 'high',   analyst: 'Ravi K.' },
  { id: 'SAR-2025-1191', upiId: 'xyz.trader@paytm',  amount: '₹88,000',   reason: 'Sudden spike — 3× avg velocity', status: 'review',   priority: 'medium', analyst: 'Priya M.' },
  { id: 'SAR-2025-1192', upiId: 'anon7812@ibl',      amount: '₹15,00,000',reason: 'Cross-border equivalent flow',   status: 'escalated',priority: 'critical',analyst: 'Amit D.' },
  { id: 'SAR-2025-1193', upiId: 'grocery.h@okaxis',  amount: '₹41,500',   reason: 'Merchant — card-not-present alt',status: 'closed',   priority: 'low',    analyst: 'Neha R.' },
];

const statusMeta = {
  filed:     { color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',    label: 'Filed to FIU' },
  pending:   { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'Pending Review' },
  review:    { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',    label: 'Under Review' },
  escalated: { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',   label: 'Escalated to ED' },
  closed:    { color: 'text-slate-400 bg-slate-700/30 border-slate-600/30', label: 'Closed — No Action' },
};

const priorityColor = {
  critical: 'text-rose-400',
  high:     'text-amber-400',
  medium:   'text-blue-400',
  low:      'text-slate-400',
};

const complianceColor = { compliant: 'text-emerald-400', review: 'text-amber-400', breach: 'text-rose-400' };
const complianceBg    = { compliant: 'bg-emerald-500/10 border-emerald-500/20', review: 'bg-amber-500/10 border-amber-500/20', breach: 'bg-rose-500/10 border-rose-500/20' };

function ScoreGauge({ score }) {
  const color = score >= 90 ? '#10B981' : score >= 75 ? '#F59E0B' : '#F43F5E';
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10">
        <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#1E293B" strokeWidth="4" />
          <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={`${(score / 100) * 94.2} 94.2`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

function ComplianceCard({ rule, expanded, onToggle }) {
  const meta = complianceColor[rule.status];
  const bg   = complianceBg[rule.status];
  const passing = rule.items.filter(i => i.ok).length;
  return (
    <div className={`rounded-xl border p-4 ${bg} bg-slate-900/60`}>
      <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-3">
          <ScoreGauge score={rule.score} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-mono">{rule.id}</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${bg} ${meta}`}>
                {rule.status}
              </span>
            </div>
            <p className="text-sm font-semibold text-white mt-0.5">{rule.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Last audit: {rule.lastAudit} · {passing}/{rule.items.length} controls passing
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-1" />}
      </div>

      {expanded && (
        <div className="mt-4 pl-2 space-y-2 border-t border-slate-700/50 pt-4">
          {rule.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {item.ok
                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                : <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
              <span className={item.ok ? 'text-slate-300' : 'text-rose-300'}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AMLCompliancePage() {
  const [expanded, setExpanded] = useState(null);

  const totalControls  = COMPLIANCE_RULES.flatMap(r => r.items).length;
  const passingControls = COMPLIANCE_RULES.flatMap(r => r.items).filter(i => i.ok).length;
  const overallScore   = Math.round(COMPLIANCE_RULES.reduce((s, r) => s + r.score, 0) / COMPLIANCE_RULES.length);

  return (
    <div className="min-h-screen bg-[#060C1A] text-white px-6 py-6 space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Gavel className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-amber-400 font-semibold tracking-widest uppercase">Regulatory</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">AML & Compliance Center</h1>
        <p className="text-xs text-slate-400 mt-0.5">RBI · NPCI · PMLA · DPDP compliance status and SAR queue</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs text-slate-400">Overall Score</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{overallScore}%</p>
          <p className="text-xs text-slate-500 mt-0.5">Across {COMPLIANCE_RULES.length} frameworks</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs text-slate-400">Controls Passing</p>
          <p className="text-2xl font-bold text-white mt-1">{passingControls}/{totalControls}</p>
          <p className="text-xs text-amber-400 mt-0.5">{totalControls - passingControls} gaps need action</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs text-slate-400">SARs This Month</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">{SAR_QUEUE.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">1 escalated to ED</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <p className="text-xs text-slate-400">Frameworks Under Review</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {COMPLIANCE_RULES.filter(r => r.status === 'review').length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">NPCI FRM V2 pending</p>
        </div>
      </div>

      {/* Compliance Framework Cards */}
      <div>
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-cyan-400" /> Regulatory Framework Status
        </h2>
        <div className="space-y-3">
          {COMPLIANCE_RULES.map((rule) => (
            <ComplianceCard
              key={rule.id}
              rule={rule}
              expanded={expanded === rule.id}
              onToggle={() => setExpanded(expanded === rule.id ? null : rule.id)}
            />
          ))}
        </div>
      </div>

      {/* SAR Queue */}
      <div>
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" /> Suspicious Activity Reports (SAR Queue)
        </h2>
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-800/60">
              <tr className="text-left text-slate-500 border-b border-slate-700/50">
                <th className="px-4 py-3 font-medium">SAR ID</th>
                <th className="px-4 py-3 font-medium">UPI ID</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Analyst</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {SAR_QUEUE.map((sar) => {
                const sm = statusMeta[sar.status];
                return (
                  <tr key={sar.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-mono text-cyan-400">{sar.id}</td>
                    <td className="px-4 py-3 text-slate-300">{sar.upiId}</td>
                    <td className="px-4 py-3 font-semibold text-white">{sar.amount}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-[200px]">{sar.reason}</td>
                    <td className={`px-4 py-3 font-bold uppercase tracking-wide ${priorityColor[sar.priority]}`}>
                      {sar.priority}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-semibold ${sm.color}`}>
                        {sm.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{sar.analyst}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-xs text-amber-300/80 flex items-start gap-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
        <p>
          All compliance scores, SAR entries, and control statuses are <strong>synthetic and simulated</strong>.
          They are inspired by real RBI, NPCI, and PMLA frameworks but do not represent actual audit findings.
        </p>
      </div>
    </div>
  );
}
