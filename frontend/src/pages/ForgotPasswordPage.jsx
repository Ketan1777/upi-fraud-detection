import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#080E1E] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">FRAUDGUARD AI</span>
          </Link>
          <h2 className="text-2xl font-bold text-white tracking-tight">Reset Password</h2>
          <p className="text-xs text-slate-400 mt-1">We will send security recovery instructions to your email</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0D1527]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {submitted ? (
            <div className="text-center py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Reset Link Dispatched</h3>
              <p className="mt-2 text-xs text-slate-400">
                Instructions have been sent to <span className="text-cyan-300 font-mono">{email}</span>. Check your inbox and follow the secure verification link.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/80 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition"
              >
                Send Password Reset Link
              </button>

              <div className="text-center mt-4">
                <Link to="/login" className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
