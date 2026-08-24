import React from 'react';
import { Shield, Phone, Globe, Database, CheckCircle2, UserCheck } from 'lucide-react';
import { GOVT_METADATA } from './SampleData';

export default function GovtHeader({ supabaseActive, onBackToHome, activeRole, setActiveRole }) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50 select-none shadow-md">
      {/* Official Top Indian Tricolor Stripe */}
      <div className="h-1 w-full flex">
        <div className="h-full w-1/3 bg-[#FF9933]" />
        <div className="h-full w-1/3 bg-white" />
        <div className="h-full w-1/3 bg-[#138808]" />
      </div>

      {/* Top Ministry Bar */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 sm:px-6 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">भारत सरकार | Government of India</span>
          <span className="hidden md:inline">• {GOVT_METADATA.ministry}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <Phone className="w-3 h-3" />
            <span>National Health Helpline: <strong>1075 / 104</strong> (Toll Free)</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[10px]">
            <Globe className="w-3 h-3 text-sky-400" />
            <span className="text-slate-200 font-medium">English</span>
            <span className="text-slate-500">|</span>
            <span className="hover:text-slate-200 cursor-pointer">हिन्दी</span>
            <span className="text-slate-500">|</span>
            <span className="hover:text-slate-200 cursor-pointer">मराठी</span>
          </div>
        </div>
      </div>

      {/* Main Portal Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center gap-1 font-medium"
            >
              &larr; Portal Home
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center font-bold text-white shadow-md text-lg">
              🏥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                  RadVault
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                    National Tele-Radiology Network
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400">
                Ayushman Bharat Digital Mission (ABDM) • Integrated Rural Diagnostic Vault
              </p>
            </div>
          </div>
        </div>

        {/* Right Station Switcher & Supabase Status */}
        <div className="flex items-center gap-3">
          {/* Station Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveRole('doctor')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeRole === 'doctor'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🩺 Doctor Tele-PACS</span>
            </button>

            <button
              onClick={() => setActiveRole('technician')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeRole === 'technician'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>📤 Diagnostic Center Upload</span>
            </button>

            <button
              onClick={() => setActiveRole('records')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeRole === 'records'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>📋 Patient ABHA Records</span>
            </button>
          </div>

          {/* Supabase Status Pill */}
          <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
            supabaseActive
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
              : 'bg-slate-950 text-slate-400 border-slate-800'
          }`}>
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>{supabaseActive ? 'ABDM Cloud Synced' : 'Offline Vault'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
