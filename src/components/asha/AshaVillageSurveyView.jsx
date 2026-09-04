/**
 * AshaVillageSurveyView - Village Survey landing page / workspace
 *
 * This is the dedicated page for the Village Survey feature.
 * It is SEPARATE from My Village (AshaVillageView).
 *
 * Provides:
 * - Survey overview and stats
 * - Launch Manual Survey (opens VillageSurveyModal)
 * - CSV Import (opens VillageSurveyModal in CSV mode)
 * - Recently registered patients via survey
 * - Survey instructions and guidance
 *
 * Uses RadVault public.patients data.
 * Does NOT use families, village_patients, or mock auth.
 */

import React, { useState, useMemo } from 'react';
import {
  ClipboardList, Upload, FileText, Users, Home, RefreshCw,
  Plus, Download, CheckCircle2, AlertTriangle, MapPin,
  ChevronRight, Sparkles, Info, ArrowRight
} from 'lucide-react';

export default function AshaVillageSurveyView({
  patients = [],
  assignedVillages = [],
  onOpenSurvey,
  onSelectPatient,
  onRefresh
}) {
  const [showGuide, setShowGuide] = useState(false);

  // Compute survey-related stats from public.patients
  const stats = useMemo(() => {
    const total = patients.length;
    const withHousehold = patients.filter(p => p.household_id).length;
    const pregnant = patients.filter(p =>
      p.is_pregnant || p.vitals?.is_pregnant || p.vitals?.pregnancy_trimester
    ).length;
    const children = patients.filter(p => {
      const age = Number(p.age ?? p.age_years ?? p.vitals?.age);
      return !isNaN(age) && age < 5;
    }).length;
    const elderly = patients.filter(p => {
      const age = Number(p.age ?? p.age_years ?? p.vitals?.age);
      return !isNaN(age) && age >= 60;
    }).length;
    const ncd = patients.filter(p =>
      p.vitals?.has_ncd || p.vitals?.has_chronic || p.vitals?.hypertension || p.vitals?.diabetes
    ).length;
    const villages = new Set(
      patients.map(p => p.village_name || p.address || '').filter(Boolean)
    ).size;
    const households = new Set(
      patients.map(p => p.household_id || '').filter(Boolean)
    ).size;

    return { total, withHousehold, pregnant, children, elderly, ncd, villages, households };
  }, [patients]);

  // Recent patients (last 10, rough approximation using array order)
  const recentPatients = useMemo(() => {
    return [...patients]
      .sort((a, b) => {
        const da = new Date(a.created_at || 0);
        const db = new Date(b.created_at || 0);
        return db - da;
      })
      .slice(0, 8);
  }, [patients]);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#b35900]" />
            Village Survey
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Register new households and beneficiaries into RadVault
          </p>
        </div>
        <button type="button" onClick={onRefresh}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Data
        </button>
      </div>

      {/* ── Primary Actions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Manual Survey */}
        <button type="button" onClick={() => onOpenSurvey?.('MANUAL_SURVEY')}
          className="group p-5 bg-gradient-to-br from-[#008080] to-[#006666] text-white rounded-2xl shadow-md hover:shadow-lg transition-all text-left flex flex-col gap-3 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
          </div>
          <div>
            <p className="font-black text-base">Manual Household Survey</p>
            <p className="text-xs text-white/80 font-medium mt-0.5">
              Add family members one by one. Enter name, age, gender, vitals, and health conditions for each member.
            </p>
          </div>
          <span className="text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-lg self-start uppercase tracking-wider">
            Primary Method
          </span>
        </button>

        {/* CSV Import */}
        <button type="button" onClick={() => onOpenSurvey?.('CSV_IMPORT')}
          className="group p-5 bg-white border-2 border-[#b35900]/30 hover:border-[#b35900] rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-3 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#FFF5EB] flex items-center justify-center">
              <Upload className="w-5 h-5 text-[#b35900]" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div>
            <p className="font-black text-base text-slate-900">CSV Bulk Import</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Upload a pre-filled survey spreadsheet. Validates all vitals using WHO/MoHFW clinical thresholds.
            </p>
          </div>
          <span className="text-[10px] font-bold bg-[#FFF5EB] text-[#b35900] border border-[#b35900]/20 px-2.5 py-1 rounded-lg self-start uppercase tracking-wider">
            Bulk Upload
          </span>
        </button>
      </div>

      {/* ── Survey Coverage Stats ── */}
      <div>
        <h2 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#008080]" />
          Survey Coverage &mdash; Registered in RadVault
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Beneficiaries</span>
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Households Covered</span>
            <span className="text-2xl font-black text-[#008080]">{stats.households}</span>
          </div>
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase text-rose-400 block">Maternal / ANC</span>
            <span className="text-2xl font-black text-rose-700">{stats.pregnant}</span>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase text-amber-500 block">Under-5 Children</span>
            <span className="text-2xl font-black text-amber-700">{stats.children}</span>
          </div>
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase text-indigo-400 block">Elderly (60+)</span>
            <span className="text-2xl font-black text-indigo-700">{stats.elderly}</span>
          </div>
          <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase text-teal-500 block">NCD / Chronic</span>
            <span className="text-2xl font-black text-teal-700">{stats.ncd}</span>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Villages Covered</span>
            <span className="text-2xl font-black text-slate-900">{stats.villages}</span>
          </div>
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase text-emerald-400 block">With Household ID</span>
            <span className="text-2xl font-black text-emerald-700">{stats.withHousehold}</span>
          </div>
        </div>
      </div>

      {/* ── Assigned Villages ── */}
      {assignedVillages && assignedVillages.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#008080]" />
            Your Assigned Survey Area
          </h2>
          <div className="flex flex-wrap gap-2">
            {assignedVillages.map((v) => (
              <span key={v.id || v.name}
                className="flex items-center gap-1 bg-[#E8F7F3] text-[#008080] border border-[#008080]/20 px-3 py-1.5 rounded-xl text-xs font-bold">
                <MapPin className="w-3 h-3" />
                {v.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Survey Guide ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
        <button type="button" onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between p-4 text-left cursor-pointer">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-black text-amber-800">Survey Guide &amp; Field Instructions</span>
          </div>
          <ChevronRight className={'w-4 h-4 text-amber-600 transition-transform ' + (showGuide ? 'rotate-90' : '')} />
        </button>
        {showGuide && (
          <div className="px-4 pb-4 space-y-2 text-xs text-amber-900 border-t border-amber-200">
            <div className="pt-3 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#008080] flex-shrink-0 mt-0.5" />
                <p><strong>Household-first approach:</strong> Register the head of household first, then add all members under the same household.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#008080] flex-shrink-0 mt-0.5" />
                <p><strong>Clinical validation:</strong> All vitals (BP, SpO2, Pulse, Temperature, Glucose) are validated using WHO/MoHFW thresholds before saving.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#008080] flex-shrink-0 mt-0.5" />
                <p><strong>CSV import:</strong> Download the sample CSV template, fill it in Excel/Sheets, and upload. The system validates each row before registering.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#008080] flex-shrink-0 mt-0.5" />
                <p><strong>Pregnancy flag:</strong> Mark pregnant women accurately. They will receive ANC follow-up reminders and pregnancy-specific BP monitoring.</p>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <p><strong>Offline mode:</strong> Surveys can be completed offline. Data will sync automatically when connectivity is restored.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Recently Registered Beneficiaries ── */}
      {recentPatients.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <h2 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#008080]" />
              Recently Registered Beneficiaries
            </h2>
            <span className="text-[10px] font-bold text-slate-400">{patients.length} total</span>
          </div>
          <div className="divide-y divide-slate-100">
            {recentPatients.map((p) => {
              const name = p.full_name || p.name;
              const age = p.age ?? p.age_years ?? p.vitals?.age;
              const village = p.village_name || p.address || 'Unknown village';
              const phone = p.phone_number || p.mobile;
              return (
                <div key={p.id || p.unified_id}
                  onClick={() => onSelectPatient?.(p)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#E8F7F3] text-[#008080] flex items-center justify-center font-black text-sm flex-shrink-0">
                      {name?.[0] ?? 'P'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate">{name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {p.unified_id} &bull; {age != null ? age + 'y' : '?y'} &bull; {p.gender || ''} &bull; {village}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </div>
              );
            })}
          </div>
          {patients.length > 8 && (
            <div className="p-3 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400 font-medium">
                + {patients.length - 8} more beneficiaries. Use <strong>My Village</strong> or <strong>Patients</strong> tab to browse all.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {patients.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
          <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="font-black text-slate-700 text-base">No Beneficiaries Registered Yet</h3>
          <p className="text-xs text-slate-400 mt-1">Start by conducting a household survey in your assigned villages.</p>
          <button type="button" onClick={() => onOpenSurvey?.('MANUAL_SURVEY')}
            className="mt-5 px-5 py-2.5 bg-[#008080] hover:bg-[#006666] text-white font-black text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" />
            Start Village Survey
          </button>
        </div>
      )}

      {/* Data attribution */}
      <div className="flex items-center gap-1 pt-1">
        <Sparkles className="w-3 h-3 text-[#008080]" />
        <p className="text-[11px] text-slate-400 font-medium">
          Beneficiary data from RadVault &bull; public.patients &bull; Clinical validation: WHO / MoHFW / NHM
        </p>
      </div>
    </div>
  );
}