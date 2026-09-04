import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePatient } from '../../context/PatientContext';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Users,
  Clock,
  Building2,
  Settings,
  UserCheck,
  Menu,
  X,
  LogOut,
  Pill,
  MapPin,
  ClipboardList,
  BarChart2
} from 'lucide-react';

import AshaDashboard from '../asha/AshaDashboard';
import AshaPatientsView from '../asha/AshaPatientsView';
import AshaFollowUpsView from '../asha/AshaFollowUpsView';
import AshaReferralsView from '../asha/AshaReferralsView';
import AshaAlertsView from '../asha/AshaAlertsView';
import AshaCommunityView from '../asha/AshaCommunityView';
import AshaVillageView from '../asha/AshaVillageView';
import AshaVillageSurveyView from '../asha/AshaVillageSurveyView';
import PatientContextView from '../asha/PatientContextView';
import EncounterWizard from '../asha/EncounterWizard';
import MedicineKitManager from '../asha/MedicineKitManager';
import VillageSurveyModal from '../asha/VillageSurveyModal';
import PatientSearchModal from '../asha/PatientSearchModal';
import PatientRegistrationModal from '../asha/PatientRegistrationModal';
import ReferralCreationModal from '../asha/ReferralCreationModal';

import {
  getAshaDashboardStats,
  getAllRecentEncounters,
  getFollowUpTasks,
  completeFollowUp,
  getTrackedReferrals,
  syncPendingEncounters
} from '../../services/encounterService';

export default function AshaWorkspace({ onNavigateToPatientView }) {
  const { patients, refreshPatients, addPatient } = usePatient();
  const { user, logout, isDemoMode, demoDataEnabled, ashaProfile, ashaVillages, ashaArea } = useAuth();

  // Scope patients list to ASHA worker's assigned villages (supporting relational & legacy string matching)
  const scopedPatients = useMemo(() => {
    if (!patients) return [];
    if (!ashaVillages || ashaVillages.length === 0) return patients;

    return patients.filter((patient) => {
      if (patient.village_id) {
        return ashaVillages.some((v) => v.id === patient.village_id);
      }
      const patientVillage = (patient.address || patient.village || '').toLowerCase().trim();
      return ashaVillages.some((v) => 
        patientVillage.includes(v.name.toLowerCase().trim()) || 
        v.name.toLowerCase().trim().includes(patientVillage)
      );
    });
  }, [patients, ashaVillages]);

  // Navigation State: 'today' | 'patients' | 'village' | 'survey' | 'community' | 'followups' | 'referrals' | 'medicine_kit' | 'settings'
  const [activeTab, setActiveTab] = useState('today');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeSubView, setActiveSubView] = useState(null); // null | 'patient_context' | 'encounter_wizard'
  const [villageFilterForPatients, setVillageFilterForPatients] = useState('ALL');

  // Modals
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerInitialName, setRegisterInitialName] = useState('');
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveyInitialMode, setSurveyInitialMode] = useState('MANUAL_SURVEY');
  const [encounterForReferral, setEncounterForReferral] = useState(null);

  // Responsive Sidebar (Tablet / Mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Operational Data
  const [stats, setStats] = useState(() => (isDemoMode && demoDataEnabled ? getAshaDashboardStats() : { totalScreened: 0, pendingFollowUps: 0, highRiskWatchlist: 0, syncPending: 0, emergencyTransfers: 0, totalFollowUps: 0, completedFollowUps: 0, overdues: 0 }));
  const [recentEncounters, setRecentEncounters] = useState(() => (isDemoMode && demoDataEnabled ? getAllRecentEncounters() : []));
  const [followUpTasks, setFollowUpTasks] = useState(() => (isDemoMode && demoDataEnabled ? getFollowUpTasks() : []));
  const [trackedReferrals, setTrackedReferrals] = useState([]);
  const [successBanner, setSuccessBanner] = useState(null);

  // Network & Sync State
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshAllData = useCallback(async () => {
    if (isDemoMode && demoDataEnabled) {
      setStats(getAshaDashboardStats());
      setRecentEncounters(getAllRecentEncounters());
      setFollowUpTasks(getFollowUpTasks());
    } else {
      setStats({ totalScreened: scopedPatients.length, pendingFollowUps: 0, highRiskWatchlist: 0, syncPending: 0, emergencyTransfers: 0, totalFollowUps: 0, completedFollowUps: 0, overdues: 0 });
      setRecentEncounters([]);
      setFollowUpTasks([]);
    }
    try {
      const scopedIds = scopedPatients.map((p) => p.id);
      const refs = await getTrackedReferrals(scopedIds, isDemoMode && demoDataEnabled);
      setTrackedReferrals(refs);
    } catch {
      // Handled gracefully in service
    }
  }, [scopedPatients, isDemoMode, demoDataEnabled]);

  const handleManualSync = useCallback(async () => {
    if (isDemoMode) {
      setSuccessBanner('✓ Demo Mode sync complete (no cloud requests generated).');
      setTimeout(() => setSuccessBanner(null), 4000);
      return;
    }

    if (!isOnline) {
      setSuccessBanner('⚠️ Network offline. Pending records are stored securely on this device.');
      setTimeout(() => setSuccessBanner(null), 4000);
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncPendingEncounters(isDemoMode);
      await refreshAllData();
      if (result.syncedCount > 0) {
        setSuccessBanner(`✓ Successfully synchronized ${result.syncedCount} offline records.`);
      } else {
        setSuccessBanner('✓ All offline records are up to date.');
      }
    } catch (err) {
      console.error('Sync failed:', err);
      setSuccessBanner('⚠️ Cloud sync encountered an issue. Will retry automatically.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSuccessBanner(null), 4000);
    }
  }, [isOnline, isDemoMode, refreshAllData]);

  // Network event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleManualSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleManualSync]);

  useEffect(() => {
    refreshAllData();
  }, [activeTab, activeSubView, refreshAllData]);

  // Handlers
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setActiveSubView('patient_context');
    setIsSidebarOpen(false);
  };

  const handlePatientRegistered = (newPatient) => {
    if (isDemoMode) {
      addPatient(newPatient);
    } else {
      refreshPatients();
    }
    setSelectedPatient(newPatient);
    setActiveSubView('patient_context');
    setSuccessBanner(`✓ Patient "${newPatient.full_name}" registered successfully.`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  const handleSurveyCompleted = (onboardedList) => {
    if (isDemoMode) {
      onboardedList.forEach(p => addPatient(p));
    } else {
      refreshPatients();
    }
    refreshAllData();
    setSuccessBanner(`✓ Onboarded ${onboardedList.length} beneficiaries from village survey.`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  const handleStartEncounter = () => {
    setActiveSubView('encounter_wizard');
  };

  const handleEncounterCompleted = (encounter) => {
    refreshAllData();
    setActiveSubView('patient_context');
    setSuccessBanner(`✓ Encounter recorded for ${encounter.patientName}. Priority: ${encounter.priorityLabel}`);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  const handleRequestReferral = (encounterContext) => {
    setEncounterForReferral(encounterContext);
    setShowReferralModal(true);
  };

  const handleReferralSuccess = (encounter) => {
    refreshAllData();
    setActiveSubView('patient_context');
    setSuccessBanner(`✓ Hospital consultation requested for ${encounter.patientName} → ${encounter.hospital}`);
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  const handleCompleteFollowUpTask = async (encounterId, resolutionData) => {
    if (typeof resolutionData === 'object' && resolutionData !== null) {
      await completeFollowUp(encounterId, resolutionData.note, resolutionData.outcome, resolutionData.nextFollowUpDate, isDemoMode);
    } else {
      await completeFollowUp(encounterId, 'Verified in frontline visit', 'COMPLETED', null, isDemoMode);
    }
    refreshAllData();
    setSuccessBanner('✓ Follow-up record updated.');
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  const navItems = [
    { key: 'today',        label: 'Today',          icon: Home,          badge: null },
    { key: 'patients',     label: 'Patients',        icon: Users,         badge: null },
    { key: 'village',      label: 'My Village',      icon: MapPin,        badge: null },
    { key: 'survey',       label: 'Village Survey',  icon: ClipboardList, badge: null },
    { key: 'community',    label: 'Community',       icon: BarChart2,     badge: null },
    { key: 'followups',    label: 'Follow-ups',      icon: Clock,         badge: stats.followupsDue || null, badgeColor: 'bg-amber-100 text-amber-900' },
    { key: 'referrals',    label: 'Referrals',       icon: Building2,     badge: stats.pendingReferrals || null, badgeColor: 'bg-sky-100 text-sky-900' },
    { key: 'medicine_kit', label: 'Medicine Kit',    icon: Pill,          badge: null }
  ];

  const workerName = user?.email ? user.email.split('@')[0] : 'Sunita Deshmukh';

  // ─── RENDER ACTIVE CONTENT ───
  const renderMainContent = () => {
    if (activeSubView === 'encounter_wizard' && selectedPatient) {
      return (
        <EncounterWizard
          patient={selectedPatient}
          onCancel={() => setActiveSubView('patient_context')}
          onEncounterCompleted={handleEncounterCompleted}
          onRequestReferral={handleRequestReferral}
          isDemoMode={isDemoMode}
          ashaProfile={ashaProfile}
        />
      );
    }

    if (activeSubView === 'patient_context' && selectedPatient) {
      return (
        <PatientContextView
          patient={selectedPatient}
          onBack={() => {
            setSelectedPatient(null);
            setActiveSubView(null);
          }}
          onStartEncounter={handleStartEncounter}
          onOpenPatientPortal={onNavigateToPatientView}
          onCompleteFollowUp={handleCompleteFollowUpTask}
          isDemoMode={isDemoMode}
        />
      );
    }

    switch (activeTab) {
      case 'patients':
        return (
          <AshaPatientsView
            patients={scopedPatients}
            encounters={recentEncounters}
            onSelectPatient={handleSelectPatient}
            initialVillageFilter={villageFilterForPatients}
            onOpenRegister={(query) => {
              setRegisterInitialName(query || '');
              setShowRegisterModal(true);
            }}
            onOpenSurvey={() => {
              setSurveyInitialMode('MANUAL_SURVEY');
              setShowSurveyModal(true);
            }}
          />
        );

      case 'referrals':
        return (
          <AshaReferralsView
            referrals={trackedReferrals}
            patients={scopedPatients}
            onSelectPatient={handleSelectPatient}
            onRefresh={refreshAllData}
          />
        );

      case 'followups':
        return (
          <AshaFollowUpsView
            followUpTasks={followUpTasks}
            patients={scopedPatients}
            onSelectPatient={handleSelectPatient}
            onCompleteTask={handleCompleteFollowUpTask}
          />
        );

      case 'emergencies':
        return (
          <AshaAlertsView
            encounters={recentEncounters}
            patients={scopedPatients}
            onSelectPatient={handleSelectPatient}
          />
        );

      case 'medicine_kit':
        return (
          <MedicineKitManager
            ashaId={ashaProfile?.id || user?.id}
            ashaName={ashaProfile?.name || 'Sunita Deshmukh'}
            phcName={ashaProfile?.phc_name || 'Shrirampur Primary Health Centre'}
          />
        );

      case 'village':
        return (
          <AshaVillageView
            patients={scopedPatients}
            loading={false}
            onRefresh={refreshAllData}
            onSelectPatient={handleSelectPatient}
            onStartEncounter={(patient) => {
              setSelectedPatient(patient);
              setActiveSubView('encounter_wizard');
            }}
            onOpenRegister={(query) => {
              setRegisterInitialName(query || '');
              setShowRegisterModal(true);
            }}
            assignedVillages={ashaVillages || []}
          />
        );

      case 'survey':
        return (
          <AshaVillageSurveyView
            patients={scopedPatients}
            assignedVillages={ashaVillages || []}
            onOpenSurvey={(mode) => {
              setSurveyInitialMode(mode || 'MANUAL_SURVEY');
              setShowSurveyModal(true);
            }}
            onSelectPatient={handleSelectPatient}
            onRefresh={refreshAllData}
          />
        );

      case 'community':
        return (
          <AshaCommunityView
            patients={scopedPatients}
            encounters={recentEncounters}
            referrals={trackedReferrals}
            followups={followUpTasks}
            ashaProfile={ashaProfile}
            onSelectVillage={(vName) => {
              setVillageFilterForPatients(vName);
              setActiveTab('patients');
            }}
            onSelectPatient={handleSelectPatient}
            onOpenSurvey={() => setShowSurveyModal(true)}
          />
        );

      case 'settings':
        return (
          <div className="max-w-xl mx-auto p-6 bg-white border border-slate-200 rounded-3xl shadow-2xs space-y-5">
            <h2 className="text-xl font-black text-slate-900">ASHA Frontline Preferences</h2>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold block text-slate-900">Frontline Worker ID</span>
                  <span className="text-slate-500">
                    {ashaProfile?.worker_id || 'ASHA-MH-7042'} ({ashaArea?.name || 'Sector 4'})
                  </span>
                </div>
                <UserCheck className="w-5 h-5 text-[#008080]" />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="font-bold block text-slate-900 mb-1.5">Assigned Villages</span>
                <div className="flex flex-wrap gap-1.5">
                  {ashaVillages && ashaVillages.length > 0 ? (
                    ashaVillages.map((v) => (
                      <span key={v.id} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg font-mono text-[10px] font-bold text-slate-700">
                        {v.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">No assigned villages loaded</span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold block text-slate-900">Local Offline Cache</span>
                  <span className="text-slate-500">{recentEncounters.length} encounters cached</span>
                </div>
                <button
                  type="button"
                  onClick={handleManualSync}
                  className="px-3 py-1.5 bg-[#008080] text-white font-bold rounded-xl shadow-2xs cursor-pointer"
                >
                  Force Sync
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold block text-slate-900">System Mode</span>
                  <span className="text-slate-500">{isDemoMode ? 'Prototype Demo Mode' : 'Production Authenticated'}</span>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                  Active
                </span>
              </div>
            </div>
          </div>
        );

      case 'today':
      case 'home':
      default:
        return (
          <AshaDashboard
            user={user}
            stats={stats}
            patients={scopedPatients}
            recentEncounters={recentEncounters}
            followUpTasks={followUpTasks}
            isOnline={isOnline}
            isSyncing={isSyncing}
            onManualSync={handleManualSync}
            onOpenSearch={() => setShowSearchModal(true)}
            onOpenRegister={() => {
              setRegisterInitialName('');
              setShowRegisterModal(true);
            }}
            onOpenSurvey={() => setShowSurveyModal(true)}
            onSelectPatient={handleSelectPatient}
            onNavigateToTab={(tab) => {
              setActiveSubView(null);
              setActiveTab(tab);
            }}
            ashaProfile={ashaProfile}
            ashaArea={ashaArea}
            ashaVillages={ashaVillages}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800 antialiased">
      {/* ── TOP APP BAR FOR TABLET / MOBILE ── */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm text-[#008080]">RadVault</span>
            <span className="text-[10px] font-extrabold bg-[#FFF5EB] text-[#b35900] px-1.5 py-0.2 rounded border border-[#FF9933]/40">
              ASHA
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></span>
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100"></span>
          )}
          <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">
            {workerName}
          </span>
        </div>
      </header>

      {/* ── PERSISTENT / COLLAPSIBLE SIDEBAR ── */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between z-40 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 space-y-6">
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#008080] text-white flex items-center justify-center font-black text-base shadow-xs">
                R
              </div>
              <div>
                <div className="font-black text-base leading-tight text-slate-900">RadVault</div>
                <div className="text-[10px] font-extrabold text-[#b35900] uppercase tracking-wider">
                  ASHA Care Workspace
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Navigation Menu */}
          <nav className="space-y-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key && activeSubView === null;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setActiveSubView(null);
                    setSelectedPatient(null);
                    setActiveTab(item.key);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#008080] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white text-[#008080]' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Worker Profile & Logout */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#FFF5EB] border border-[#FF9933]/50 flex items-center justify-center text-sm font-bold text-[#b35900] shrink-0">
              👩‍⚕️
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 truncate">{workerName}</div>
              <div className="text-[10px] text-slate-400 font-medium truncate">Sector 4 · ASHA</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setActiveSubView(null);
                setActiveTab('settings');
                setIsSidebarOpen(false);
              }}
              className="py-1.5 px-2 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="py-1.5 px-2 rounded-lg text-[11px] font-bold text-rose-700 hover:bg-rose-50 flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for Mobile/Tablet drawer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      {/* ── MAIN CONTENT WORKSPACE ── */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full pb-20 md:pb-8">
        {/* Global Notification Banner */}
        {successBanner && (
          <div className="mb-5 p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-between shadow-2xs animate-in fade-in duration-150">
            <span>{successBanner}</span>
            <button onClick={() => setSuccessBanner(null)} className="text-emerald-600 hover:text-emerald-900">✕</button>
          </div>
        )}

        {renderMainContent()}
      </main>

      {/* ── MOBILE BOTTOM NAVIGATION ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-1 py-1.5 flex items-center gap-0.5 overflow-x-auto z-30 shadow-lg scrollbar-none"
        aria-label="Mobile Bottom Navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key && activeSubView === null;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setActiveSubView(null);
                setSelectedPatient(null);
                setActiveTab(item.key);
              }}
              className={`flex-shrink-0 flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl font-bold text-[9px] transition-all relative ${
                isActive ? 'text-[#008080]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge !== null && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-600 text-white font-black text-[9px] flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── GLOBAL MODALS ── */}
      {showSearchModal && (
        <PatientSearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          patients={scopedPatients}
          onSelectPatient={handleSelectPatient}
          onOpenRegisterNew={(query) => {
            setRegisterInitialName(query || '');
            setShowRegisterModal(true);
          }}
        />
      )}

      {showRegisterModal && (
        <PatientRegistrationModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          initialName={registerInitialName}
          patients={scopedPatients}
          onSelectExistingPatient={handleSelectPatient}
          onPatientCreated={handlePatientRegistered}
        />
      )}

      {showReferralModal && (
        <ReferralCreationModal
          isOpen={showReferralModal}
          onClose={() => setShowReferralModal(false)}
          encounterContext={encounterForReferral}
          onReferralSuccess={handleReferralSuccess}
          isDemoMode={isDemoMode}
          ashaProfile={ashaProfile}
        />
      )}

      {showSurveyModal && (
        <VillageSurveyModal
          isOpen={showSurveyModal}
          onClose={() => setShowSurveyModal(false)}
          assignedVillages={ashaVillages}
          existingPatients={patients}
          onSurveyCompleted={handleSurveyCompleted}
          initialMode={surveyInitialMode}
        />
      )}
    </div>
  );
}
