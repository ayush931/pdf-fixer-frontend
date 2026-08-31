import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FileCheck2,
  Lock,
  User as UserIcon,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register, error, clearError } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!username.trim() || !password) {
      setLocalError('Please enter all required fields.');
      return;
    }

    if (mode === 'register' && !email.trim()) {
      setLocalError('Please provide a valid email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (mode === 'login') {
        await login({ username: username.trim(), password });
      } else {
        await register({
          username: username.trim(),
          email: email.trim(),
          password,
          full_name: fullName.trim()
        });
      }
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAdminLogin = async () => {
    setLocalError(null);
    clearError();
    setUsername('admin');
    setPassword('admin123');
    try {
      setIsSubmitting(true);
      await login({ username: 'admin', password: 'admin123' });
    } catch (err: any) {
      setLocalError(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-orange-600 selection:text-white select-none">
      {/* Top Branding Header */}
      <div className="max-w-md w-full text-center mb-6">
        <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-500/25 mb-3.5 ring-4 ring-orange-500/10">
          <FileCheck2 className="w-8 h-8" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Nexografix
          </h1>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
            Remediation Studio
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1.5 font-medium">
          PDF/UA Accessibility Remediation & Structure Tag Inspector
        </p>
      </div>

      {/* Main Form Container */}
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden">
        {/* Mode Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 border-b border-slate-200/80 m-3 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setLocalError(null);
              clearError();
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-orange-600 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setLocalError(null);
              clearError();
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-orange-600 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
          {(localError || error) && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{localError || error}</span>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Full Name (Optional)
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ayush Sharma"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              {mode === 'login' ? 'Username or Email' : 'Username'}
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={mode === 'login' ? 'Enter username or email' : 'Choose a username'}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Studio' : 'Create Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex flex-col items-center gap-2.5 text-center">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Fast Quick Access & Testing</span>
          </div>
          <button
            type="button"
            onClick={handleDemoAdminLogin}
            disabled={isSubmitting}
            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 hover:border-slate-300 border border-slate-200 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-orange-600" />
            <span>1-Click Demo Login (admin / admin123)</span>
          </button>
        </div>
      </div>

      {/* Feature Highlights Footer */}
      <div className="mt-8 grid grid-cols-3 gap-6 max-w-lg text-center text-slate-500">
        <div className="flex flex-col items-center gap-1">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 mb-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-slate-800">PDF/UA & WCAG</span>
          <span className="text-[10px] text-slate-400 font-medium">ISO 14289-1 Standard</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 mb-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-slate-800">Auto Remediation</span>
          <span className="text-[10px] text-slate-400 font-medium">Note IDs & Tag Trees</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 mb-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-slate-800">Celery Workers</span>
          <span className="text-[10px] text-slate-400 font-medium">Real-Time Job Queue</span>
        </div>
      </div>
    </div>
  );
};
