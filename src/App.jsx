import React, { useState } from 'react';
import { PatientHome } from './components/dashboard/PatientHome';
import {
  HeartPulse,
  Home,
  UserCircle2,
  BookOpen,
  Handshake,
  Shield,
  Plus,
  ExternalLink,
  ChevronLeft,
  Calendar,
  Sparkles,
} from 'lucide-react';

// ─── Indian-Friendly Cultural Emergency Shield Icon ─────────────────────────

function NavEmergencyIcon({ active = false }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <Shield className={`w-5 h-5 ${active ? 'text-[#D32F2F] fill-[#D32F2F]/20' : 'text-[#D32F2F]'}`} />
      <Plus className="w-3 h-3 text-[#D32F2F] absolute stroke-[3.5]" />
    </div>
  );
}

// ─── Placeholder screen for teammate modules (Light Theme) ───────────────────

function PlaceholderScreen({ icon: Icon, title, member, description, color = 'text-[#008080]', onBack }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-12 text-center">
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center bg-slate-50 border border-slate-200">
          <Icon className={`w-9 h-9 ${color}`} aria-hidden="true" />
        </div>
        <span className="inline-block text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[#FFF5EB] text-[#b35900] border border-[#FF9933]/50 mb-3">
          {member}
        </span>
        <h2 className="text-2xl font-extrabold text-[#212121] mb-2">{title}</h2>
        <p className="text-sm sm:text-base text-[#555555] mb-6 leading-relaxed">
          {description}
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>
    </div>
  );
}

// ─── Bottom Navigation Configuration with Culturally Familiar Icons ───────────

const NAV_ITEMS = [
  {
    key: 'home',
    label: 'Home',
    Icon: Home, // Sloping-roof house
    description: 'Home Dashboard',
  },
  {
    key: 'records',
    label: 'Records',
    Icon: BookOpen, // Medical Notebook / Folder
    description: 'Medical Vault',
  },
  {
    key: 'referrals',
    label: 'Referrals',
    Icon: Handshake, // Doctor–Patient Handshake
    description: 'Hospital Care',
  },
  {
    key: 'emergency',
    label: 'Emergency',
    CustomIcon: NavEmergencyIcon, // Saffron Shield with Red Cross
    description: 'Emergency ID',
  },
  {
    key: 'profile',
    label: 'Profile',
    Icon: UserCircle2, // Circular Avatar Silhouette
    description: 'Patient Profile',
  },
];

// ─── Main App Shell ───────────────────────────────────────────────────────────

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showPortalPicker, setShowPortalPicker] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#212121] flex flex-col font-sans selection:bg-[#FF9933]/30 selection:text-[#800000]">

      {/* ── Top Header (Light Theme with Teal & Saffron Accents) ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">

          {/* Branding */}
          <button
            onClick={() => setShowPortalPicker(!showPortalPicker)}
            className="flex items-center gap-3 group text-left"
            title="Switch system portal"
            aria-expanded={showPortalPicker}
            aria-haspopup="true"
          >
            <div className="w-10 h-10 bg-[#008080]/10 border-2 border-[#008080]/30 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <HeartPulse className="w-6 h-6 text-[#008080]" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-[#008080] tracking-tight">RadVault</span>
                <span className="text-[11px] font-extrabold bg-[#FFF5EB] text-[#b35900] px-2 py-0.5 rounded-md border border-[#FF9933]/50">
                  Patient Portal
                </span>
              </div>
              <p className="text-[11px] text-[#555555] font-medium leading-none mt-0.5">
                One Connected Health Journey
              </p>
            </div>
          </button>

          {/* Right Side Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPortalPicker(!showPortalPicker)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#212121] rounded-xl text-xs font-bold border border-slate-300 transition-colors flex items-center gap-1.5"
              aria-label="Switch system portal"
            >
              <span className="w-2 h-2 rounded-full bg-[#008080] animate-pulse" aria-hidden="true" />
              Portals
            </button>
          </div>
        </div>

        {/* Portal Switcher Dropdown */}
        {showPortalPicker && (
          <div className="max-w-3xl mx-auto mt-3 p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#555555] uppercase tracking-wider">
                Select Portal View
              </span>
              <button
                onClick={() => setShowPortalPicker(false)}
                className="text-xs text-[#555555] hover:text-[#212121] font-bold"
              >
                ✕ Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setShowPortalPicker(false)}
                role="button"
                tabIndex={0}
                className="p-3.5 bg-[#E6F2F2] border-2 border-[#008080] rounded-xl cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg" aria-hidden="true">📱</span>
                  <span className="font-extrabold text-sm text-[#008080]">Frontline Patient Portal</span>
                  <span className="text-[10px] bg-[#008080] text-white font-bold px-1.5 py-0.5 rounded ml-auto">
                    Active
                  </span>
                </div>
                <p className="text-xs text-[#555555]">
                  Patient identity, live vitals telemetry, referrals, and emergency QR.
                </p>
              </div>
              <div
                onClick={() => {
                  alert('The Doctor / Clinical Portal is managed by Team B.');
                  setShowPortalPicker(false);
                }}
                role="button"
                tabIndex={0}
                className="p-3.5 bg-slate-50 border border-slate-200 hover:border-[#008080]/50 rounded-xl cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg" aria-hidden="true">💻</span>
                  <span className="font-bold text-sm text-[#212121] group-hover:text-[#008080]">
                    Doctor / Clinical Portal
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#555555] ml-auto" aria-hidden="true" />
                </div>
                <p className="text-xs text-[#555555]">Team B's clinical diagnostic workspace.</p>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1" id="main-content">
        {activeTab === 'home' && (
          <PatientHome onNavigate={setActiveTab} />
        )}

        {activeTab === 'records' && (
          <PlaceholderScreen
            icon={BookOpen}
            title="Medical Records & Vault"
            member="Team A Member 2 · Module"
            description="Your digitized X-rays, MRI/CT scans, doctor prescriptions, and laboratory reports in one secure vault."
            color="text-[#008080]"
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'referrals' && (
          <PlaceholderScreen
            icon={Handshake}
            title="Specialist Referrals & Appointments"
            member="Team A Member 3 · Module"
            description="Manage hospital referrals from your village health center to district specialist doctors with appointment tracking."
            color="text-[#800000]"
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'emergency' && (
          <PlaceholderScreen
            icon={NavEmergencyIcon}
            title="Emergency Break-Glass ID"
            member="Team A Member 3 · Module"
            description="Generate emergency QR codes exposing only critical triage info (Blood group, allergies, emergency contacts) with audit logging."
            color="text-[#D32F2F]"
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'profile' && (
          <PlaceholderScreen
            icon={UserCircle2}
            title="Complete Patient Profile"
            member="Team A Member 2 · Module"
            description="Comprehensive demographic data, village/ASHA links, past chronic condition records, and family health history."
            color="text-[#008080]"
            onBack={() => setActiveTab('home')}
          />
        )}
      </main>

      {/* ── Bottom Navigation Bar (Indian Palette: Teal, Maroon, Saffron) ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-2 shadow-lg"
        aria-label="Patient portal navigation"
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          {NAV_ITEMS.map(({ key, label, Icon, CustomIcon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[56px] relative group ${
                  isActive
                    ? 'text-[#800000] font-extrabold bg-[#800000]/8 scale-105'
                    : 'text-[#555555] hover:text-[#008080] hover:bg-[#008080]/5'
                }`}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator top bar */}
                {isActive && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-1 bg-[#FF9933] rounded-full" />
                )}

                {CustomIcon ? (
                  <CustomIcon active={isActive} />
                ) : (
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#800000]' : 'text-[#008080]/80 group-hover:text-[#008080]'}`} aria-hidden="true" />
                )}
                <span className="text-[11px] font-bold leading-none tracking-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default App;
