import React, { useState } from 'react';
import { PatientHome } from './components/dashboard/PatientHome';
import {
  HeartPulse,
  Home,
  User,
  FileText,
  Share2,
  QrCode,
  ExternalLink,
  Calendar,
} from 'lucide-react';

// ─── Placeholder screens for teammate modules ─────────────────────────────────

function PlaceholderScreen({ icon: Icon, title, description, color = 'text-teal-400', onBack }) {
  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center bg-[#162238] border border-[#26364D]`}>
        <Icon className={`w-8 h-8 ${color}`} aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold text-slate-100 mb-2">{title}</h2>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">{description}</p>
      <button
        onClick={onBack}
        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-semibold transition-colors"
      >
        ← Back to Home
      </button>
    </div>
  );
}

// ─── Bottom navigation config ─────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'home',      label: 'Home',       Icon: Home,    activeColor: 'text-teal-400' },
  { key: 'records',   label: 'Records',    Icon: FileText, activeColor: 'text-teal-400' },
  { key: 'referrals', label: 'Referrals',  Icon: Share2,  activeColor: 'text-teal-400' },
  { key: 'emergency', label: 'Emergency',  Icon: QrCode,  activeColor: 'text-red-400'  },
  { key: 'profile',   label: 'Profile',    Icon: User,    activeColor: 'text-teal-400' },
];

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [activeTab, setActiveTab]               = useState('home');
  const [showPortalPicker, setShowPortalPicker] = useState(false);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-50 flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-[#26364D] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">

          {/* Branding */}
          <button
            onClick={() => setShowPortalPicker(!showPortalPicker)}
            className="flex items-center gap-2.5 group"
            title="Switch portal"
            aria-expanded={showPortalPicker}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 bg-teal-500/10 border border-teal-500/25 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <HeartPulse className="w-4 h-4 text-teal-400" aria-hidden="true" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-100 tracking-tight">RadVault</span>
                <span className="text-[10px] font-semibold bg-teal-500/15 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/25">
                  Patient
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">One Connected Health Journey</p>
            </div>
          </button>

          {/* Right side: portal switcher toggle */}
          <button
            onClick={() => setShowPortalPicker(!showPortalPicker)}
            className="px-2.5 py-1.5 bg-[#162238] hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-[#26364D] transition-colors flex items-center gap-1.5"
            aria-label="Switch system portal"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" aria-hidden="true" />
            Portals
          </button>
        </div>

        {/* Portal picker dropdown */}
        {showPortalPicker && (
          <div className="max-w-2xl mx-auto mt-3 p-4 bg-[#162238] border border-[#26364D] rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Switch Portal
              </span>
              <button
                onClick={() => setShowPortalPicker(false)}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                ✕ Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setShowPortalPicker(false)}
                role="button"
                tabIndex={0}
                className="p-3 bg-teal-950/30 border-2 border-teal-500/40 rounded-xl cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base" aria-hidden="true">📱</span>
                  <span className="font-bold text-sm text-teal-300">Frontline Patient Portal</span>
                  <span className="text-[10px] bg-teal-500/20 text-teal-200 px-1.5 py-0.5 rounded ml-auto">Active</span>
                </div>
                <p className="text-xs text-slate-400">Patient records, vitals, referrals, and emergency ID.</p>
              </div>
              <div
                onClick={() => {
                  alert('The Doctor / Clinical Portal is managed by Team B.');
                  setShowPortalPicker(false);
                }}
                role="button"
                tabIndex={0}
                className="p-3 bg-[#111C31] border border-[#26364D] hover:border-sky-500/40 rounded-xl cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base" aria-hidden="true">💻</span>
                  <span className="font-bold text-sm text-slate-200 group-hover:text-sky-300">Doctor / Clinical Portal</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 ml-auto" aria-hidden="true" />
                </div>
                <p className="text-xs text-slate-400">Team B's clinical and diagnostic workspace.</p>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1" id="main-content">
        {activeTab === 'home' && (
          <PatientHome onNavigate={setActiveTab} />
        )}

        {activeTab === 'records' && (
          <PlaceholderScreen
            icon={FileText}
            title="Medical Records & Vault"
            description="Your X-rays, MRI/CT scans, lab reports, and prescriptions are managed here. This module is being built by Team A Member 3."
            color="text-teal-400"
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'referrals' && (
          <PlaceholderScreen
            icon={Share2}
            title="Referrals & Appointments"
            description="Your specialist referrals, appointments, and follow-up schedules are managed here. This module is being built by Team A Member 2."
            color="text-teal-400"
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'emergency' && (
          <PlaceholderScreen
            icon={QrCode}
            title="Emergency Break-Glass ID"
            description="Your emergency QR code with critical health information for first responders. This module is being built by Team A Member 2."
            color="text-red-400"
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'profile' && (
          <PlaceholderScreen
            icon={User}
            title="Patient Profile"
            description="Your complete personal health profile, past medical data, and health history. This module is being built by Team A Member 3."
            color="text-teal-400"
            onBack={() => setActiveTab('home')}
          />
        )}
      </main>

      {/* ── Bottom Navigation ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F172A]/95 backdrop-blur-lg border-t border-[#26364D] px-2 py-2"
        aria-label="Patient portal navigation"
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          {NAV_ITEMS.map(({ key, label, Icon, activeColor }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[56px] ${
                  isActive ? `${activeColor} font-semibold` : 'text-slate-500 hover:text-slate-300'
                }`}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[10px] leading-none">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default App;
