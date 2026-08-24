import React, { useState } from 'react';
import RadVaultManager from './components/radvault/RadVaultManager';
import DiagnosticDashboard from './components/DiagnosticDashboard';
import DoctorTerminal from './components/DoctorTerminal';
import PharmacyDashboard from './components/PharmacyDashboard';
import {
  Stethoscope, Activity, CheckCircle2, Heart, ArrowRight,
  Users, MessageSquare, Package, Microscope, Sparkles
} from 'lucide-react';

// ─── Frontline Placeholder for Team A ────────────────────────────────────
function FrontlinePortalPlaceholder({ onBack }) {
  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-5xl">📱</div>
      <div>
        <h1 className="text-3xl font-black text-emerald-800 mb-2">Frontline Portal</h1>
        <p className="text-emerald-700 font-medium text-base max-w-md">
          Patient & ASHA Worker Dashboard — built by <strong>Team A</strong>.<br />
          Replace this component with your own in App.jsx.
        </p>
      </div>
      <div className="bg-white border border-emerald-200 rounded-2xl p-5 text-sm text-left max-w-sm w-full space-y-2 shadow-sm">
        <p className="font-bold text-slate-700 mb-3">📋 Team A: integrate here:</p>
        {['Village Triage (Red / Orange / Green)', 'Patient Registration & ABHA ID', 'ASHA Worker Referral & Emergency QR', 'Offline Local Storage & Health Timeline'].map(f => (
          <div key={f} className="flex items-center gap-2 text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>
      <button onClick={onBack} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2">
        ← Back to Home
      </button>
    </div>
  );
}

// ─── Portal Card Component ────────────────────────────────────────────────
function PortalCard({ icon, emoji, badge, title, subtitle, description, features, accentClass, borderClass, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`group p-6 bg-gradient-to-b from-slate-900 to-slate-950 border-2 ${borderClass} rounded-3xl cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 p-5 opacity-8 pointer-events-none text-7xl">{emoji}</div>

      <div className="relative z-10 space-y-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border ${accentClass}`}>
          {emoji}
        </div>

        <div>
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mb-1 ${accentClass}`}>{badge}</span>
          <h3 className="text-lg font-bold text-white group-hover:text-white/90 transition-colors">{title}</h3>
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

        <div className={`pt-2 flex items-center gap-2 font-bold text-xs ${accentClass.includes('sky') ? 'text-sky-400' : accentClass.includes('emerald') ? 'text-emerald-400' : accentClass.includes('teal') ? 'text-teal-400' : accentClass.includes('purple') ? 'text-purple-400' : accentClass.includes('blue') ? 'text-blue-400' : 'text-amber-400'} group-hover:translate-x-1.5 transition-transform`}>
          <span>Enter Portal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}

// ─── Home / Landing Page ──────────────────────────────────────────────────
function HomePage({ onSelectPortal }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-50 flex flex-col">

      {/* Navbar */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Heart className="w-6 h-6 text-blue-400" strokeWidth={2.5} />
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              RadVault
            </span>
            <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 uppercase tracking-wider">
              ABDM Live
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Supabase Cloud Connected</span>
          </div>
        </div>
      </header>

      {/* Hero */}
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
          Connecting ASHA workers, doctors, diagnostic labs, and pharmacies through a unified Ayushman Bharat Digital Mission (ABDM) platform.
        </p>

        {/* 5-Portal Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl text-left">

          {/* 1. Frontline / Patient & ASHA (Team A) */}
          <PortalCard
            emoji="📱" badge="Team A — Frontline"
            title="Patient & ASHA Worker Hub"
            subtitle="Village Triage & Referral"
            description="Digital triage intake, ABHA ID generation, emergency QR codes, and personal health journey timelines."
            features={['Digital Village Triage (Red/Orange/Green)', 'Patient ABHA Registration', 'Break-Glass Emergency QR', 'Offline Sync & Health History']}
            accentClass="bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
            borderClass="border-slate-800 hover:border-emerald-500/60"
            onClick={() => onSelectPortal('frontline')}
          />

          {/* 2. Doctor Clinical / RadVault (Team B — user's) */}
          <PortalCard
            emoji="💻" badge="Team B — Clinical Portal"
            title="Doctor & RadVault Workstation"
            subtitle="PACS Viewer & ABHA Timeline"
            description="PACS medical image viewer, DICOM ingestion, caliper measurements, AI anomaly detection, and ABHA patient health records."
            features={['Doctor PACS Viewer (Caliper, AI CADx)', 'Upload & Manage Diagnostic Scans', 'ABHA Clinical Timeline', 'AI Clinical Summary']}
            accentClass="bg-sky-500/10 text-sky-300 border-sky-500/30"
            borderClass="border-sky-500/40 hover:border-sky-400"
            onClick={() => onSelectPortal('clinical')}
          />

          {/* 3. Diagnostic Centre — NEW */}
          <PortalCard
            emoji="🔬" badge="Diagnostic Centre"
            title="Diagnostic Lab Portal"
            subtitle="Upload Reports & Notify Doctors"
            description="Diagnostic centre staff can upload blood tests, X-ray, MRI, CT scan results and dispatch them instantly to the doctor's review queue."
            features={['Upload Lab & Radiology Reports', 'Track Report Review Status', 'Emergency Priority Dispatch', 'Doctor Review Comments']}
            accentClass="bg-teal-500/10 text-teal-300 border-teal-500/30"
            borderClass="border-slate-800 hover:border-teal-500/60"
            onClick={() => onSelectPortal('diagnostic')}
          />

          {/* 4. Doctor Terminal — NEW */}
          <PortalCard
            emoji="💬" badge="Doctor Terminal"
            title="Consultation & Prescription"
            subtitle="Chat • Advise • Prescribe"
            description="Secure doctor-patient messaging, review diagnostic reports, write digital prescriptions with drug autocomplete and generate official prescription slips."
            features={['Secure Patient Messaging (ASHA/PHC)', 'Digital Prescription Builder', 'Printable Official Prescription Slip', 'Prescription History per Patient']}
            accentClass="bg-blue-500/10 text-blue-300 border-blue-500/30"
            borderClass="border-slate-800 hover:border-blue-500/60"
            onClick={() => onSelectPortal('terminal')}
          />

          {/* 5. Pharmacy — NEW */}
          <PortalCard
            emoji="💊" badge="Pharmacy & Druggist"
            title="Pharmacy Stock & Orders"
            subtitle="Inventory • Dispense • Restock"
            description="Pharmacy staff manage medicine stock levels, fulfill prescription orders from doctors, get low-stock alerts, and track dispensed medicines online."
            features={['Live Medicine Stock Table', 'Online Prescription Order Queue', 'Low Stock Alerts & Restock', 'Dispense & Deduct Inventory']}
            accentClass="bg-purple-500/10 text-purple-300 border-purple-500/30"
            borderClass="border-slate-800 hover:border-purple-500/60"
            onClick={() => onSelectPortal('pharmacy')}
          />

          {/* Coming Soon Card (Team B expansion) */}
          <div className="p-6 bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center gap-3 min-h-[220px]">
            <span className="text-4xl">🚀</span>
            <div>
              <p className="font-bold text-slate-500 text-sm">Coming Soon</p>
              <p className="text-xs text-slate-600 mt-1">Ambulance Dispatch, AI CADx Reports & NHA Integration</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl">
          {[
            { icon: '🏥', label: 'PHC Centres', value: '240+' },
            { icon: '👥', label: 'Patients Served', value: '12,400+' },
            { icon: '🩻', label: 'Scans Uploaded', value: '4,800+' },
            { icon: '💊', label: 'Prescriptions', value: '3,200+' },
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
        RadVault Healthcare Platform • Hackathon Edition • Ayushman Bharat Digital Mission (ABDM) • NHA India
      </footer>
    </main>
  );
}

// ─── Root Router ─────────────────────────────────────────────────────────
function App() {
  const [activePortal, setActivePortal] = useState('home');

  const goHome = () => setActivePortal('home');
  const goToClinical = () => setActivePortal('clinical');
  const goToPharmacy = () => setActivePortal('pharmacy');
  const goToDiagnostic = () => setActivePortal('diagnostic');
  const goToTerminal = () => setActivePortal('terminal');

  if (activePortal === 'clinical') {
    return (
      <RadVaultManager
        onBackToHome={goHome}
        onNavigateToPharmacy={goToPharmacy}
        onNavigateToDiagnostic={goToDiagnostic}
      />
    );
  }
  if (activePortal === 'frontline') {
    return <FrontlinePortalPlaceholder onBack={goHome} />;
  }
  if (activePortal === 'diagnostic') {
    return (
      <DiagnosticDashboard
        onBack={goHome}
        onNavigateToDoctor={goToClinical}
      />
    );
  }
  if (activePortal === 'terminal') {
    return <DoctorTerminal onBack={goHome} />;
  }
  if (activePortal === 'pharmacy') {
    return (
      <PharmacyDashboard
        onBack={goHome}
        onNavigateToDoctor={goToClinical}
      />
    );
  }

  return <HomePage onSelectPortal={setActivePortal} />;
}

export default App;
