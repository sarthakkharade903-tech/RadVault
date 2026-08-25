import React, { useState } from 'react';

// â”€â”€â”€ Samir's Patient Portal Imports (keep everything) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { PatientHome } from './components/dashboard/PatientHome';
import {
  mockPatient,
  mockVitals,
  mockAllergies,
  mockConditions,
  mockMedications,
  mockTimelineEvents,
  mockMedicalRecords,
} from './data/mockPatientData';
import PatientProfileCard from './components/PatientProfile/PatientProfileCard';
import PatientVitals from './components/PatientProfile/PatientVitals';
import PatientConditions from './components/PatientProfile/PatientConditions';
import HealthTimeline from './components/HealthTimeline/HealthTimeline';
import MedicalRecordsList from './components/MedicalRecords/MedicalRecordsList';
import ReferralsDashboard from './components/Referrals/ReferralsDashboard';

import {
  HeartPulse, Home, UserCircle2, BookOpen, Handshake, Shield,
  Plus, ExternalLink, ChevronLeft, Calendar, User, FileText,
  QrCode, Heart, Sparkles, ArrowRight, CheckCircle2,
} from 'lucide-react';

// â”€â”€â”€ NAV ICON HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function NavHomeIcon({ active }) {
  return <Home className={`w-5 h-5 ${active ? 'text-[#800000]' : 'text-[#008080]/80'}`} />;
}
function NavRecordsIcon({ active }) {
  return <FileText className={`w-5 h-5 ${active ? 'text-[#800000]' : 'text-[#008080]/80'}`} />;
}
function NavTimelineIcon({ active }) {
  return <Calendar className={`w-5 h-5 ${active ? 'text-[#800000]' : 'text-[#008080]/80'}`} />;
}
function NavReferralsIcon({ active }) {
  return <Handshake className={`w-5 h-5 ${active ? 'text-[#800000]' : 'text-[#008080]/80'}`} />;
}
function NavEmergencyIcon({ active }) {
  return <Shield className={`w-5 h-5 ${active ? 'text-[#D32F2F]' : 'text-[#008080]/80'}`} />;
}
function NavProfileIcon({ active }) {
  return <User className={`w-5 h-5 ${active ? 'text-[#800000]' : 'text-[#008080]/80'}`} />;
}

const NAV_ITEMS = [
  { key: 'home',      label: 'Home',      CustomIcon: NavHomeIcon },
  { key: 'records',   label: 'Records',   CustomIcon: NavRecordsIcon },
  { key: 'timeline',  label: 'Timeline',  CustomIcon: NavTimelineIcon },
  { key: 'referrals', label: 'Referrals', CustomIcon: NavReferralsIcon },
  { key: 'emergency', label: 'Emergency', CustomIcon: NavEmergencyIcon },
  { key: 'profile',   label: 'Profile',   CustomIcon: NavProfileIcon },
];

function PlaceholderScreen({ icon: Icon, title, description, color, btnColor, ctaText, onCta, onBack }) {
  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center gap-5 p-8 text-center">
      <div className={`w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center ${color}`}>
        <Icon active={true} />
      </div>
      <div>
        <h2 className="text-2xl font-extrabold text-[#212121]">{title}</h2>
        <p className="text-sm text-[#555555] mt-3 max-w-xs mx-auto">{description}</p>
      </div>
      {ctaText && (
        <button onClick={onCta} className={`px-5 py-2.5 ${btnColor} font-bold rounded-xl text-sm`}>
          {ctaText}
        </button>
      )}
      <button onClick={onBack} className="text-sm text-slate-400 underline">â† Back</button>
    </div>
  );
}

// â”€â”€â”€ Ayaz's Dark Hero Landing Page â€” trimmed to 3 portals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PortalCard({ emoji, badge, title, subtitle, description, features, accentClass, borderClass, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`group p-6 bg-gradient-to-b from-slate-900 to-slate-950 border-2 ${borderClass} rounded-3xl cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 p-5 opacity-10 pointer-events-none text-7xl">{emoji}</div>
      <div className="relative z-10 space-y-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border ${accentClass}`}>
          {emoji}
        </div>
        <div>
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mb-1 ${accentClass}`}>{badge}</span>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed">{description}</p>
        <div className="space-y-1.5 pt-1">
          {features.map(f => (
            <div key={f} className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
        <div className={`pt-2 flex items-center gap-2 font-bold text-xs transition-transform group-hover:translate-x-1.5 ${
          accentClass.includes('emerald') ? 'text-emerald-400'
          : accentClass.includes('sky') ? 'text-sky-400'
          : 'text-amber-400'
        }`}>
          <span>Enter Portal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}

function LandingPage({ onSelectPortal }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-50 flex flex-col">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Heart className="w-6 h-6 text-blue-400" strokeWidth={2.5} />
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              RadVault
            </span>
            <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 uppercase tracking-wider">
              ABDM
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Supabase Connected</span>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto px-4 py-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>One Patient. One Connected Health Journey.</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-3xl mb-3 leading-tight">
          Integrated Rural Healthcare Platform
          <br /><span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">for Underserved Communities</span>
        </h1>

        <p className="text-sm text-slate-400 max-w-xl mb-10 leading-relaxed">
          Connecting ASHA workers, patients, and PHC staff through a unified Ayushman Bharat Digital Mission (ABDM) platform â€” built for Maharashtra's rural healthcare.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-5xl text-left">
          <PortalCard
            emoji="ðŸŒ¿" badge="ASHA Worker Portal"
            title="ASHA & Frontline Worker"
            subtitle="Village Triage & Patient Registry"
            description="Register village patients, track pregnancies, manage due lists, and send digital referrals to PHCs â€” replacing paper registers entirely."
            features={['Village Patient Roster & Due Lists', 'Digital Triage (RED/ORANGE/GREEN)', 'ANC & Child Immunization Tracking', 'Closed-Loop Referral Feedback']}
            accentClass="bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
            borderClass="border-slate-800 hover:border-emerald-500/60"
            onClick={() => onSelectPortal('asha')}
          />
          <PortalCard
            emoji="ðŸ‘¤" badge="Patient Portal"
            title="Patient Dashboard"
            subtitle="My Health Journey"
            description="View your ASHA-verified health card, medical records, book appointments at nearby PHCs, and track your referral status end to end."
            features={['ABHA Health ID & QR Code', 'Medical Records & Timeline', 'Book Appointments at PHC', 'Referral Status Tracking']}
            accentClass="bg-sky-500/10 text-sky-300 border-sky-500/30"
            borderClass="border-sky-500/40 hover:border-sky-400"
            onClick={() => onSelectPortal('patient')}
          />
          <PortalCard
            emoji="ðŸ¥" badge="PHC Reception"
            title="Hospital Counter Staff"
            subtitle="Queue & Referral Management"
            description="Manage today's OPD queue, accept digital referrals from ASHA workers, check in patients by ABHA QR, and coordinate doctor assignments."
            features={["Today's OPD Queue Management", 'Referral Inbox (from ASHA Workers)', 'Patient Check-In by ABHA QR', 'Prescription & Report Upload']}
            accentClass="bg-amber-500/10 text-amber-300 border-amber-500/30"
            borderClass="border-slate-800 hover:border-amber-500/60"
            onClick={() => onSelectPortal('reception')}
          />
        </div>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl">
          {[
            { icon: 'ðŸ¥', label: 'PHC Centres',    value: '240+' },
            { icon: 'ðŸ‘¥', label: 'Patients Served', value: '12,400+' },
            { icon: 'ðŸŒ¿', label: 'ASHA Workers',    value: '1,050+' },
            { icon: 'ðŸ“‹', label: 'Referrals Tracked',value: '3,200+' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-lg font-black text-white">{stat.value}</div>
              <div className="text-[11px] text-slate-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
        RadVault Healthcare Platform â€¢ SIH 2026 â€¢ Ayushman Bharat Digital Mission (ABDM) â€¢ Government of Maharashtra
      </footer>
    </main>
  );
}

// â”€â”€â”€ ASHA Portal Placeholder (Phase 1 â€” build next) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AshaPortal({ onBack }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-5xl">ðŸŒ¿</div>
      <div>
        <h1 className="text-3xl font-black text-emerald-300 mb-2">ASHA Worker Portal</h1>
        <p className="text-emerald-200/70 font-medium text-base max-w-md">Village Patient Roster, Digital Referrals, ANC Tracking & Due Lists</p>
      </div>
      <div className="bg-white/5 border border-emerald-500/20 rounded-2xl p-5 text-sm text-left max-w-sm w-full space-y-2">
        <p className="font-bold text-emerald-300 mb-3">ðŸ”¨ Building in Phase 1:</p>
        {['Village Patient Roster with health status', 'Patient Profile Builder (digital RCH Register)', 'ANC & Child Immunization Tracker', 'Auto-generated Daily Due List', 'Closed-Loop Referral Tracking'].map(f => (
          <div key={f} className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>
      <button onClick={onBack} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors">
        â† Back to Home
      </button>
    </div>
  );
}

// â”€â”€â”€ Reception Portal Placeholder (Phase 2) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ReceptionPortal({ onBack }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-5xl">ðŸ¥</div>
      <div>
        <h1 className="text-3xl font-black text-amber-300 mb-2">PHC Reception Portal</h1>
        <p className="text-amber-200/70 font-medium text-base max-w-md">OPD Queue Management, Referral Inbox & Patient Check-In</p>
      </div>
      <div className="bg-white/5 border border-amber-500/20 rounded-2xl p-5 text-sm text-left max-w-sm w-full space-y-2">
        <p className="font-bold text-amber-300 mb-3">ðŸ”¨ Building in Phase 2:</p>
        {["Today's OPD Queue with patient check-in", 'Referral Inbox from ASHA Workers', 'Accept / Assign referrals to doctors', 'Patient lookup by ABHA QR code', "Doctor's micro-view + prescription writer"].map(f => (
          <div key={f} className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>
      <button onClick={onBack} className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors">
        â† Back to Home
      </button>
    </div>
  );
}

// â”€â”€â”€ Full Patient Dashboard (Samir's existing code â€” untouched) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PatientPortal({ onBack }) {
  const [activeTab, setActiveTab] = useState('home');
  const [targetRecordId, setTargetRecordId] = useState(null);

  function handleViewRecordFromTimeline(recordId) {
    setTargetRecordId(recordId);
    setActiveTab('records');
  }
  function handleTriggerEmergency() {
    setActiveTab('emergency');
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-6 h-6 text-[#800000]" strokeWidth={2.5} />
          <span className="text-lg font-black text-[#008080] tracking-tight">RadVault</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF9933]/15 text-[#FF9933] font-bold border border-[#FF9933]/30">Patient Portal</span>
        </div>
        <button onClick={onBack} className="text-xs text-slate-400 flex items-center gap-1 hover:text-slate-600">
          <ChevronLeft className="w-3 h-3" /> Portals
        </button>
      </header>

      <main className="flex-1 pb-24">
        {activeTab === 'home' && (
          <PatientHome patient={mockPatient} vitals={mockVitals} onNavigate={setActiveTab} />
        )}

        {activeTab === 'records' && (
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#008080]">Medical Records</h2>
                <p className="text-sm text-[#555555]">Securely stored health documents and reports.</p>
              </div>
              <button onClick={() => setActiveTab('home')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#212121] font-bold rounded-lg text-xs flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            </div>
            <MedicalRecordsList records={mockMedicalRecords} initialSelectedRecordId={targetRecordId} patient={mockPatient} />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#008080]">Health Timeline</h2>
                <p className="text-sm text-[#555555]">Chronological timeline of consultations and events.</p>
              </div>
              <button onClick={() => setActiveTab('home')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#212121] font-bold rounded-lg text-xs flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            </div>
            <HealthTimeline events={mockTimelineEvents} onViewRecord={handleViewRecordFromTimeline} />
          </div>
        )}

        {activeTab === 'referrals' && (
          <ReferralsDashboard onBack={() => setActiveTab('home')} />
        )}

        {activeTab === 'emergency' && (
          <PlaceholderScreen
            icon={NavEmergencyIcon}
            title="Emergency Break-Glass ID"
            description="Generate emergency QR codes exposing only critical triage info â€” blood group, allergies, emergency contacts â€” with audit logging."
            color="text-[#D32F2F]"
            btnColor="bg-[#FF9933] hover:bg-[#E68A2E] text-slate-950"
            ctaText="Generate One-Time Emergency QR"
            onCta={() => alert('Emergency QR Generated: scan to view critical triage data.')}
            onBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'profile' && (
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-[#008080]">Patient Profile</h2>
                <p className="text-sm text-[#555555]">Demographics, conditions, allergies and vitals.</p>
              </div>
              <button onClick={() => setActiveTab('home')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#212121] font-bold rounded-lg text-xs flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            </div>
            <div className="rv-profile-layout">
              <div className="rv-profile-top-grid">
                <PatientProfileCard patient={mockPatient} onTriggerEmergencyQR={handleTriggerEmergency} />
                <PatientVitals vitals={mockVitals} />
              </div>
              <PatientConditions allergies={mockAllergies} conditions={mockConditions} medications={mockMedications} />
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-2 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {NAV_ITEMS.map(({ key, label, CustomIcon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setTargetRecordId(null); }}
                className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all min-w-[50px] relative group ${
                  isActive ? 'text-[#800000] font-extrabold bg-[#800000]/8 scale-105' : 'text-[#555555] hover:text-[#008080] hover:bg-[#008080]/5'
                }`}
              >
                {isActive && <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-1 bg-[#FF9933] rounded-full" />}
                <CustomIcon active={isActive} />
                <span className="text-[10px] font-bold leading-none tracking-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// â”€â”€â”€ Root App Router â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function App() {
  const [activePortal, setActivePortal] = useState('home');
  const goHome = () => setActivePortal('home');

  if (activePortal === 'asha')      return <AshaPortal onBack={goHome} />;
  if (activePortal === 'patient')   return <PatientPortal onBack={goHome} />;
  if (activePortal === 'reception') return <ReceptionPortal onBack={goHome} />;

  return <LandingPage onSelectPortal={setActivePortal} />;
}

export default App;
