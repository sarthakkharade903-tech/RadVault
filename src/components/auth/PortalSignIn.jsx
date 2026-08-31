import React, { useState } from 'react';
import {
  HeartPulse,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_CONFIG } from '../../constants/roles';
import { PORTAL_ITEMS } from '../landing/LandingPage';

const ROLE_DEFAULT_CREDENTIALS = {
  [ROLES.ASHA]: 'somu5243d@gmail.com',
  [ROLES.HOSPITAL_STAFF]: 'myanawar5243d@gmail.com',
  [ROLES.DOCTOR]: 'samir5243d@gmail.com',
  [ROLES.PATIENT]: ''
};

export default function PortalSignIn({ portalKey, onBack, onLoginSuccess, onSwitchPortal, onEnterDemoPatient }) {
  const { login, logout } = useAuth();
  
  const portalConfig = PORTAL_ITEMS.find((p) => p.key === portalKey) || PORTAL_ITEMS[0];
  const expectedRole = portalConfig.role;

  const [email, setEmail] = useState(() => ROLE_DEFAULT_CREDENTIALS[expectedRole] || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mismatchRole, setMismatchRole] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your healthcare account email.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setMismatchRole(null);

    try {
      const res = await login(email.trim(), password);
      if (res.success) {
        const authenticatedUser = res.data?.user;
        const serverRole =
          authenticatedUser?.app_metadata?.role ||
          authenticatedUser?.user_metadata?.role;

        // Role Mismatch Verification: Ensure account matches selected portal
        if (serverRole && serverRole !== expectedRole) {
          await logout();
          setMismatchRole(serverRole);
          setErrorMessage(
            `Role Mismatch: This account is registered as "${ROLE_CONFIG[serverRole]?.label || serverRole}", not "${portalConfig.label}".`
          );
          setLoading(false);
          return;
        }

        if (onLoginSuccess) {
          onLoginSuccess(res.data);
        }
      } else {
        const rawErr = res.error || '';
        if (rawErr.toLowerCase().includes('invalid login credentials')) {
          setErrorMessage('Email or password is incorrect. Please verify your credentials.');
        } else if (rawErr.toLowerCase().includes('network')) {
          setErrorMessage('Unable to connect to Supabase service. Please check your connectivity.');
        } else {
          setErrorMessage(rawErr || 'Authentication failed. Please check your account details.');
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (testEmail) => {
    setEmail(testEmail);
    setErrorMessage('');
    setMismatchRole(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFCFB] flex flex-col justify-between font-sans relative selection:bg-[#008F83]/20 selection:text-[#008F83]">
      
      {/* ── Top Bar with Back to Portals button ── */}
      <header className="px-6 py-4 flex items-center justify-between z-10">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-[#008F83] transition-colors bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-slate-200 shadow-2xs cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Portals</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: portalConfig.theme.accent }} />
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 hidden sm:inline">
            {portalConfig.label}
          </span>
        </div>
      </header>

      {/* ── Center Login Form ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm sm:max-w-md">

          {/* Portal Brand Header */}
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-3"
              style={{ backgroundColor: portalConfig.theme.accent }}
            >
              <HeartPulse className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black text-[#16324F] tracking-tight">RadVault</h1>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              {portalConfig.label} · {portalConfig.marathi}
            </p>
          </div>

          {/* Elevated Login Card */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-6 sm:p-8 space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-black text-slate-900">
                  {portalConfig.label} Sign In
                </h2>
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full border uppercase"
                  style={{
                    backgroundColor: portalConfig.theme.iconBg,
                    color: portalConfig.theme.accent,
                    borderColor: portalConfig.theme.accent,
                  }}
                >
                  Verified Role
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {portalConfig.fullDesc}
              </p>
            </div>

            {/* Error & Mismatch Alert */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border-2 border-rose-200 rounded-2xl text-rose-900 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold leading-snug">{errorMessage}</p>
                </div>

                {/* Direct switch suggestion if role mismatch */}
                {mismatchRole && onSwitchPortal && (
                  <div className="pt-1 border-t border-rose-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const targetKey =
                          mismatchRole === ROLES.ASHA
                            ? 'asha'
                            : mismatchRole === ROLES.HOSPITAL_STAFF
                            ? 'hospital'
                            : mismatchRole === ROLES.DOCTOR
                            ? 'doctor'
                            : 'patient';
                        onSwitchPortal(targetKey);
                      }}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black rounded-lg transition-colors cursor-pointer"
                    >
                      Switch to {ROLE_CONFIG[mismatchRole]?.label} Portal →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Healthcare Email ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@health.gov.in"
                    autoComplete="email"
                    className="w-full border border-slate-300 focus:border-[#008F83] focus:ring-1 focus:ring-[#008F83] rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-900 placeholder:text-slate-400 bg-white transition-all shadow-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Account password"
                    autoComplete="current-password"
                    className="w-full border border-slate-300 focus:border-[#008F83] focus:ring-1 focus:ring-[#008F83] rounded-xl pl-10 pr-10 py-3 text-xs font-bold text-slate-900 placeholder:text-slate-400 bg-white transition-all shadow-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all mt-3 cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: portalConfig.theme.accent }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'Authenticating Session...' : `Sign In to ${portalConfig.label}`}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Quick-fill Helper for Testing / SIH Judging */}
            {ROLE_DEFAULT_CREDENTIALS[expectedRole] && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Test credential:</span>
                <button
                  type="button"
                  onClick={() => handleQuickFill(ROLE_DEFAULT_CREDENTIALS[expectedRole])}
                  className="font-mono font-bold hover:underline cursor-pointer"
                  style={{ color: portalConfig.theme.accent }}
                >
                  {ROLE_DEFAULT_CREDENTIALS[expectedRole]}
                </button>
              </div>
            )}

            {/* Direct Demo Access for Patient Portal (SIH Prototype Mode) */}
            {expectedRole === ROLES.PATIENT && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onEnterDemoPatient) {
                      onEnterDemoPatient();
                    }
                  }}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider"
                >
                  <span>👤 Continue as Demo Patient (Prototype View) →</span>
                </button>
                <p className="text-[10px] text-center text-slate-400 font-semibold">
                  Explore longitudinal vault, ABHA sandbox & health schemes without email login.
                </p>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-5 font-semibold leading-relaxed">
            Protected by Supabase Auth & PostgreSQL Row Level Security (RLS)
          </p>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="py-4 text-center text-xs text-slate-400 font-medium">
        RadVault Connected Health Network
      </footer>

    </div>
  );
}
