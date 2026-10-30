import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, UserCheck, ShieldAlert, AlertCircle } from 'lucide-react';
import { authApi } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      localStorage.setItem('fraudguard_token', res.access_token);
      localStorage.setItem('fraudguard_user', JSON.stringify(res.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    setError('');
    setLoading(true);
    try {
      const res = await authApi.demoLogin(role);
      localStorage.setItem('fraudguard_token', res.access_token);
      localStorage.setItem('fraudguard_user', JSON.stringify(res.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080E1E] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_30%,rgba(91,192,190,0.1),rgba(255,255,255,0))]"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">FRAUDGUARD AI</span>
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign in to Security Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Real-Time UPI Fraud & Risk Monitoring Console</p>
        </div>

        {/* Demo Fast Login Box */}
        <div className="mb-6 rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
            <UserCheck className="h-4 w-4" />
            Quick Demo Access (1-Click)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('analyst')}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/40 bg-slate-900/80 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-900/30 transition"
            >
              <span>Analyst Role</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-blue-500/40 bg-slate-900/80 px-3 py-2 text-xs font-medium text-blue-300 hover:bg-blue-900/30 transition"
            >
              <span>Admin Role</span>
            </button>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#0D1527]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@fraudguard.ai"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-[11px] text-cyan-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-cyan-400 hover:underline">
              Register now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
