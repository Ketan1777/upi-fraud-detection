import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  Activity,
  Share2,
  Lock,
  ArrowRight,
  TrendingDown,
  Cpu,
  Database,
  Users,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { authApi } from '../services/api';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleQuickDemo = async (role) => {
    try {
      const res = await authApi.demoLogin(role);
      if (res && res.access_token) {
        localStorage.setItem('fraudguard_token', res.access_token);
        localStorage.setItem('fraudguard_user', JSON.stringify(res.user));
        navigate('/dashboard');
      }
    } catch (err) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#080E1E] text-slate-100 selection:bg-cyan-500/30 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-[#0A101D]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                FRAUDGUARD <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded font-mono">UPI</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              Sign In
            </Link>
            <button
              onClick={() => handleQuickDemo('analyst')}
              className="text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2 rounded-lg shadow-md shadow-cyan-500/20 transition flex items-center gap-1.5"
            >
              <span>Instant Live Demo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24 border-b border-slate-800/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(91,192,190,0.15),rgba(255,255,255,0))]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-medium mb-6">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
              Next-Gen AI Sentinel for High-Volume Digital Payments
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Real-Time Fraud Detection for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500">UPI & Digital Payments</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed">
              Empowering banks, payment aggregators, and fintechs with millisecond-level AI inference.
              Detect money mule networks, velocity attacks, account takeover spikes, and coordinated fraud patterns before settlement.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => handleQuickDemo('analyst')}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition"
              >
                <span>Launch Analyst Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => handleQuickDemo('admin')}
                className="px-6 py-3 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition"
              >
                Admin Control Room
              </button>

              <Link
                to="/detector"
                className="px-6 py-3 rounded-lg border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-950/50 text-cyan-300 font-semibold text-sm transition"
              >
                Manual Risk Simulator
              </Link>
            </div>

            {/* Quick metrics row */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0D1527]/80">
                <p className="text-xs text-slate-400 uppercase font-semibold">Inference Latency</p>
                <p className="text-xl font-bold font-mono text-cyan-400 mt-1">&lt; 15 ms</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Real-time inline scoring</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0D1527]/80">
                <p className="text-xs text-slate-400 uppercase font-semibold">Model Ensemble</p>
                <p className="text-xl font-bold font-mono text-emerald-400 mt-1">RF + iForest</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Supervised & Anomaly</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0D1527]/80">
                <p className="text-xs text-slate-400 uppercase font-semibold">Graph Mule Detection</p>
                <p className="text-xl font-bold font-mono text-blue-400 mt-1">NetworkX</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Fan-in degree clustering</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0D1527]/80">
                <p className="text-xs text-slate-400 uppercase font-semibold">Explainability</p>
                <p className="text-xl font-bold font-mono text-amber-400 mt-1">100% Transparent</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Exact factor contributions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is UPI Fraud Detection Section */}
      <section className="py-16 bg-[#0A101D] border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Combating Digital Payment Fraud Vectors
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              India's Unified Payments Interface (UPI) handles over 400 million transactions daily. High transaction volume demands automated, real-time threat detection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 transition">
              <div className="h-10 w-10 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center mb-4">
                <TrendingDown className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Money Mule Account Networks</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Fraudsters recruit dormant or student accounts to funnel stolen victim funds. Our graph analyzer detects excessive fan-in connections and immediate cash-out hops in seconds.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 transition">
              <div className="h-10 w-10 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center mb-4">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">High-Velocity Burst Transfers</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Compromised UPI pins or cloned devices attempt rapid-fire transactions within a 5-minute window before the victim can freeze their bank account.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 transition">
              <div className="h-10 w-10 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-4">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Account Takeover & Nocturnal Drains</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Sudden large-ticket transactions (₹50,000+) at 3:00 AM from rooted devices or emulator environments deviating drastically from 30-day baseline spend.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How the System Works */}
      <section className="py-16 bg-[#080E1E] border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Intelligent Pipeline Architecture
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              End-to-end processing pipeline from incoming UPI transaction to AI classification and analyst triage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="relative p-5 rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="text-xs font-mono font-bold text-cyan-400 mb-2">STEP 01</div>
              <h4 className="text-sm font-bold text-white">Real-Time Ingestion</h4>
              <p className="mt-2 text-xs text-slate-400">
                Receives transaction payloads via FastAPI REST API or high-throughput WebSocket stream.
              </p>
            </div>

            <div className="relative p-5 rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="text-xs font-mono font-bold text-cyan-400 mb-2">STEP 02</div>
              <h4 className="text-sm font-bold text-white">Feature Engineering</h4>
              <p className="mt-2 text-xs text-slate-400">
                Extracts 5m velocity, historical spending ratio, new receiver indicators, hour anomaly, and device telemetry.
              </p>
            </div>

            <div className="relative p-5 rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="text-xs font-mono font-bold text-cyan-400 mb-2">STEP 03</div>
              <h4 className="text-sm font-bold text-white">Ensemble AI Scoring</h4>
              <p className="mt-2 text-xs text-slate-400">
                Random Forest predicts fraud probability; Isolation Forest detects unseen anomalies; NetworkX identifies mule hubs.
              </p>
            </div>

            <div className="relative p-5 rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="text-xs font-mono font-bold text-cyan-400 mb-2">STEP 04</div>
              <h4 className="text-sm font-bold text-white">Triage & Instant Block</h4>
              <p className="mt-2 text-xs text-slate-400">
                Scores 0–29 (Safe/Allow), 30–69 (Suspicious/Review), 70–100 (Fraudulent/Block) broadcasted to security dashboards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#060A16] text-center text-xs text-slate-500">
        <p>UPI FraudGuard AI Platform &copy; 2026. Built for High-Volume Digital Payments Security.</p>
        <p className="mt-1 text-[11px] text-slate-600">Compliant with NPCI UPI Security Guidelines & RBI Digital Payment Directives.</p>
      </footer>
    </div>
  );
}
