import React, { useState } from 'react';
import { PatientHome } from './components/dashboard/PatientHome';
import { 
  HeartPulse, 
  Home, 
  User, 
  FileText, 
  Calendar, 
  Share2, 
  QrCode, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showPortalPicker, setShowPortalPicker] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Mobile-First Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowPortalPicker(!showPortalPicker)}
              className="flex items-center gap-2 text-left group"
              title="Click to switch portal"
            >
              <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 font-bold group-hover:scale-105 transition-transform">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-slate-100 tracking-tight">RadVault</span>
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                    Patient
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">One Connected Health Journey</p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPortalPicker(!showPortalPicker)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Portals</span>
            </button>
          </div>
        </div>

        {/* Portal Switcher Modal / Dropdown */}
        {showPortalPicker && (
          <div className="max-w-4xl mx-auto mt-3 p-4 bg-slate-850 border border-slate-700 rounded-2xl shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Switch System Portal</span>
              <button 
                onClick={() => setShowPortalPicker(false)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                ✕ Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div 
                onClick={() => setShowPortalPicker(false)}
                className="p-3 bg-emerald-950/30 border-2 border-emerald-500/50 rounded-xl cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">📱</span>
                  <span className="font-bold text-sm text-emerald-300">Frontline Patient Portal</span>
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.5 rounded ml-auto">Active</span>
                </div>
                <p className="text-xs text-slate-400">Patient identity, live vitals telemetry, upcoming appointments.</p>
              </div>

              <div 
                onClick={() => {
                  alert('Clinical / Doctor Portal is managed by Team B.');
                  setShowPortalPicker(false);
                }}
                className="p-3 bg-slate-800/60 border border-slate-700 hover:border-sky-500/50 rounded-xl cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">💻</span>
                  <span className="font-bold text-sm text-slate-200 group-hover:text-sky-300">Doctor / Clinical Portal</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 ml-auto" />
                </div>
                <p className="text-xs text-slate-400">Team B's clinical diagnostic and referral management workspace.</p>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'home' && <PatientHome />}

        {activeTab === 'profile' && (
          <div className="max-w-4xl mx-auto px-4 py-8 text-center">
            <div className="p-8 bg-slate-800/70 border border-slate-700 rounded-2xl">
              <User className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-slate-100 mb-2">Patient Profile Module</h2>
              <p className="text-sm text-slate-400 mb-4">Assigned to Team A Member 2 (Profile, Blood Group, Allergies, Critical Conditions).</p>
              <button onClick={() => setActiveTab('home')} className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold">
                Back to Home
              </button>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="max-w-4xl mx-auto px-4 py-8 text-center">
            <div className="p-8 bg-slate-800/70 border border-slate-700 rounded-2xl">
              <FileText className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-slate-100 mb-2">Medical Records & Vault</h2>
              <p className="text-sm text-slate-400 mb-4">Assigned to Team A Member 2 (Lab reports, X-rays, MRI/CT, Prescriptions).</p>
              <button onClick={() => setActiveTab('home')} className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold">
                Back to Home
              </button>
            </div>
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="max-w-4xl mx-auto px-4 py-8 text-center">
            <div className="p-8 bg-slate-800/70 border border-slate-700 rounded-2xl">
              <Share2 className="w-12 h-12 text-sky-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-slate-100 mb-2">Referrals & Appointments</h2>
              <p className="text-sm text-slate-400 mb-4">Assigned to Team A Member 3 (Referrals, Appointments, Follow-ups).</p>
              <button onClick={() => setActiveTab('home')} className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold">
                Back to Home
              </button>
            </div>
          </div>
        )}

        {activeTab === 'emergency' && (
          <div className="max-w-4xl mx-auto px-4 py-8 text-center">
            <div className="p-8 bg-red-950/40 border border-red-800/60 rounded-2xl">
              <QrCode className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-red-200 mb-2">Emergency Break-Glass QR</h2>
              <p className="text-sm text-red-300/80 mb-4">Assigned to Team A Member 3 (Emergency QR code with minimal critical data & audit log).</p>
              <button onClick={() => setActiveTab('home')} className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold">
                Back to Home
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-3 py-2">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'home' 
                ? 'text-emerald-400 font-semibold scale-105' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[11px]">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'records' 
                ? 'text-emerald-400 font-semibold scale-105' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[11px]">Records</span>
          </button>

          <button
            onClick={() => setActiveTab('referrals')}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'referrals' 
                ? 'text-emerald-400 font-semibold scale-105' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[11px]">Care</span>
          </button>

          <button
            onClick={() => setActiveTab('emergency')}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'emergency' 
                ? 'text-red-400 font-semibold scale-105' 
                : 'text-slate-400 hover:text-red-400'
            }`}
          >
            <QrCode className="w-5 h-5" />
            <span className="text-[11px]">QR Alert</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
