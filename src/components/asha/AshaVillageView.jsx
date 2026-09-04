import React, { useState, useMemo } from 'react';
import {
  Users, Search, Plus, Heart, Baby, ChevronDown, ChevronUp,
  Phone, MapPin, FolderOpen, ArrowRight,
  Home, Sparkles, X, Activity, User, RefreshCw,
  UserPlus, ActivitySquare, ChevronLeft
} from 'lucide-react';

const TRANSLATIONS = {
  en: {
    title: 'My Village',
    subtitle: 'Household and Beneficiary Health Register',
    totalBeneficiaries: 'Beneficiaries',
    totalHouseholds: 'Households',
    maternalCare: 'Maternal / ANC',
    childCare: 'Under-5 Children',
    registerBtn: 'Register Beneficiary',
    surveyBtn: 'Village Survey',
    communityBtn: 'Community Report',
    searchPlaceholder: 'Search by name, household, village or phone...',
    filterAll: 'All',
    filterHigh: 'High Risk',
    filterPregnant: 'Pregnant / ANC',
    filterChildren: 'Children < 5',
    filterElderly: 'Elderly 60+',
    filterNCD: 'NCD / Chronic',
    noHouseholdsFound: 'No households found',
    noHouseholdsDesc: 'Try a different search or clear filters.',
    headOfHousehold: 'Head of Household',
    registeredMembers: 'Members',
    openFolder: 'Open Household',
    membersTitle: 'Members',
    noMembersYet: 'No members registered. Use Register Beneficiary to add members.',
    addMemberBtn: '+ Add Beneficiary to Household',
    ancTag: 'ANC',
    childTag: '< 5y',
    elderlyTag: '60+',
    ncdTag: 'NCD',
    urgentTag: 'HIGH RISK',
    callBtn: 'Call',
    openRecord: 'Open Record',
    loading: 'Loading village data...',
    unknownHousehold: 'Unassigned',
    householdsLabel: 'Household',
  },
};

function isPatientPregnant(p) {
  return !!(p.is_pregnant || p.vitals?.is_pregnant || p.vitals?.pregnancy_trimester || p.vitals?.anc_trimester);
}
function isPatientChild(p) {
  const age = Number(p.age ?? p.age_years ?? p.vitals?.age);
  return !isNaN(age) && age < 5;
}
function isPatientElderly(p) {
  const age = Number(p.age ?? p.age_years ?? p.vitals?.age);
  return !isNaN(age) && age >= 60;
}
function isPatientNCD(p) {
  return !!(
    p.vitals?.has_ncd || p.vitals?.has_chronic || p.vitals?.hypertension ||
    p.vitals?.diabetes || p.vitals?.tb_symptoms || (p.vitals?.conditions?.length > 0)
  );
}
function isPatientHighRisk(p) {
  return isPatientNCD(p) || !!(p.vitals?.high_risk) || p.status === 'red';
}
function getPatientAge(p) {
  return p.age ?? p.age_years ?? p.vitals?.age ?? null;
}

function groupIntoHouseholds(patients) {
  const map = new Map();
  for (const patient of patients) {
    const hid = patient.household_id || 'unassigned';
    if (!map.has(hid)) {
      map.set(hid, {
        id: hid,
        isUnassigned: hid === 'unassigned',
        headName: null,
        village: patient.village_name || patient.address || '',
        members: []
      });
    }
    const h = map.get(hid);
    h.members.push(patient);
    if (patient.relation_to_head === 'Head' || patient.relation_to_head === 'Self') {
      h.headName = patient.full_name || patient.name;
    }
    if (!h.headName) h.headName = patient.full_name || patient.name;
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.isUnassigned) return 1;
    if (b.isUnassigned) return -1;
    return (a.headName || '').localeCompare(b.headName || '');
  });
}

function MemberRow({ p, t, onSelectPatient, onStartEncounter }) {
  const name = p.full_name || p.name;
  const age = getPatientAge(p);
  const pregnant = isPatientPregnant(p);
  const child = isPatientChild(p);
  const elderly = isPatientElderly(p);
  const ncd = isPatientNCD(p);
  const highRisk = isPatientHighRisk(p);
  const phone = p.phone_number || p.mobile || p.vitals?.phone;

  return (
    <div className="bg-white rounded-xl p-3 border border-[#E2E8F0] flex items-center justify-between text-xs gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-extrabold text-slate-900">{name}</p>
          {p.unified_id && <span className="font-mono text-[10px] text-slate-400">{p.unified_id}</span>}
          {pregnant && <span className="bg-rose-50 border border-rose-200 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-bold">{t.ancTag}</span>}
          {child && <span className="bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-bold">{t.childTag}</span>}
          {elderly && !child && <span className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded text-[10px] font-bold">{t.elderlyTag}</span>}
          {ncd && <span className="bg-teal-50 border border-teal-200 text-teal-800 px-1.5 py-0.5 rounded text-[10px] font-bold">{t.ncdTag}</span>}
          {highRisk && <span className="bg-red-50 border border-red-200 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold">{t.urgentTag}</span>}
        </div>
        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
          {p.relation_to_head || 'Member'} {age != null ? String.fromCharCode(8226) + ' ' + age + 'y' : ''} {p.gender ? String.fromCharCode(8226) + ' ' + p.gender : ''}
        </p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {phone && (
          <a href={'tel:' + phone}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
            title={t.callBtn} onClick={(e) => e.stopPropagation()}>
            <Phone className="w-3.5 h-3.5" />
          </a>
        )}
        {onStartEncounter && (
          <button type="button" onClick={() => onStartEncounter(p)}
            className="px-2.5 py-1.5 bg-[#16324F] hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
            title="Log Visit / Start Encounter">
            <ActivitySquare className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Log Visit</span>
          </button>
        )}
        <button type="button" onClick={() => onSelectPatient(p)}
          className="px-3 py-1.5 bg-[#008080] hover:bg-[#006666] text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1">
          {t.openRecord} <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function HouseholdCard({ household, t, onOpenFolder, onSelectPatient, onStartEncounter, onRegisterBeneficiary, isExpanded, onToggleExpand }) {
  const { members } = household;
  const pregnantCount = members.filter(isPatientPregnant).length;
  const childCount = members.filter(isPatientChild).length;
  const elderlyCount = members.filter(isPatientElderly).length;
  const hasHighRisk = members.some(isPatientHighRisk);
  const borderColor = hasHighRisk ? 'border-l-red-500' : 'border-l-[#008080]';

  return (
    <div className={'bg-white rounded-2xl shadow-sm border border-[#E2E8F0] border-l-4 ' + borderColor + ' overflow-hidden transition-all'}>
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className={'w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base flex-shrink-0 ' + (hasHighRisk ? 'bg-red-50 text-red-600' : 'bg-[#E8F7F3] text-[#008080]')}>
              {household.isUnassigned ? <User className="w-5 h-5" /> : (household.headName?.[0] ?? 'H')}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {household.isUnassigned ? t.unknownHousehold : (household.headName + ' ' + t.householdsLabel)}
                </h3>
                {!household.isUnassigned && (
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                    #{(household.id || '').slice(0, 8)}
                  </span>
                )}
                {hasHighRisk && (
                  <span className="text-[9px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase">{t.urgentTag}</span>
                )}
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                {t.headOfHousehold}: <strong className="text-slate-800">{household.headName}</strong>
              </p>
              {household.village && (
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-teal-600" />
                  <span>{household.village}</span>
                  <span className="font-bold text-teal-800">{members.length} {t.registeredMembers}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
            <button type="button" onClick={() => onOpenFolder(household)}
              className="px-4 py-2.5 bg-[#008080] hover:bg-[#006666] text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer">
              <FolderOpen className="w-4 h-4" />
              <span>{t.openFolder}</span>
            </button>
            <button type="button" onClick={onToggleExpand}
              className="p-2.5 rounded-xl bg-[#F5FBF9] hover:bg-[#E8F7F3] text-[#008080] border border-[#E2E8F0] transition-colors cursor-pointer"
              title="Expand preview">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {(pregnantCount > 0 || childCount > 0 || elderlyCount > 0) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
            {pregnantCount > 0 && (
              <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-500" /> {pregnantCount} {t.ancTag}
              </span>
            )}
            {childCount > 0 && (
              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                <Baby className="w-3 h-3 text-amber-600" /> {childCount} {t.childTag}
              </span>
            )}
            {elderlyCount > 0 && (
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                <Activity className="w-3 h-3 text-indigo-600" /> {elderlyCount} {t.elderlyTag}
              </span>
            )}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="bg-[#F5FBF9] border-t border-[#E2E8F0] px-4 py-4 space-y-3">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
            {t.membersTitle} ({members.length}):
          </p>
          {members.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">{t.noMembersYet}</p>
          ) : (
            <div className="space-y-2">
              {members.map((p) => (
                <MemberRow
                  key={p.id || p.unified_id || p.full_name}
                  p={p}
                  t={t}
                  onSelectPatient={onSelectPatient}
                  onStartEncounter={onStartEncounter}
                />
              ))}
            </div>
          )}
          <button type="button" onClick={onRegisterBeneficiary}
            className="w-full bg-white border border-dashed border-[#008080]/40 hover:border-[#008080] text-[#008080] hover:bg-[#E8F7F3] font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t.addMemberBtn}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function AshaVillageView({
  patients,
  loading,
  onRefresh,
  onSelectPatient,
  onStartEncounter,
  onOpenRegister,
  assignedVillages = []
}) {
  const lang = localStorage.getItem('radvault_asha_lang') || 'en';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedVillage, setSelectedVillage] = useState('ALL');
  const [expandedHouseholdId, setExpandedHouseholdId] = useState(null);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const pats = patients || [];

  const availableVillages = useMemo(() => {
    const set = new Set();
    assignedVillages.forEach(v => { if (v?.name) set.add(v.name); });
    pats.forEach(p => {
      if (p.village_name) set.add(p.village_name);
    });
    return Array.from(set).sort();
  }, [pats, assignedVillages]);

  const villageFiltered = useMemo(() => {
    if (selectedVillage === 'ALL') return pats;
    const vLower = selectedVillage.toLowerCase().trim();
    return pats.filter(p => (p.village_name || p.address || '').toLowerCase().includes(vLower));
  }, [pats, selectedVillage]);

  const stats = useMemo(() => ({
    total: villageFiltered.length,
    anc: villageFiltered.filter(isPatientPregnant).length,
    child: villageFiltered.filter(isPatientChild).length,
    elderly: villageFiltered.filter(isPatientElderly).length,
    ncd: villageFiltered.filter(isPatientNCD).length,
    highRisk: villageFiltered.filter(isPatientHighRisk).length,
    households: new Set(villageFiltered.map(p => p.household_id || 'unassigned')).size
  }), [villageFiltered]);

  const categoryFiltered = useMemo(() => {
    if (activeFilter === 'ANC') return villageFiltered.filter(isPatientPregnant);
    if (activeFilter === 'CHILD') return villageFiltered.filter(isPatientChild);
    if (activeFilter === 'ELDERLY') return villageFiltered.filter(isPatientElderly);
    if (activeFilter === 'NCD') return villageFiltered.filter(isPatientNCD);
    if (activeFilter === 'HIGH') return villageFiltered.filter(isPatientHighRisk);
    return villageFiltered;
  }, [villageFiltered, activeFilter]);

  const allHouseholds = useMemo(() => groupIntoHouseholds(categoryFiltered), [categoryFiltered]);

  const filteredHouseholds = useMemo(() => {
    if (!searchQuery.trim()) return allHouseholds;
    const q = searchQuery.toLowerCase().trim();
    return allHouseholds.filter(h =>
      (h.headName || '').toLowerCase().includes(q) ||
      (h.village || '').toLowerCase().includes(q) ||
      (h.id || '').toLowerCase().includes(q) ||
      h.members.some(m =>
        (m.full_name || m.name || '').toLowerCase().includes(q) ||
        (m.phone_number || m.mobile || '').toLowerCase().includes(q) ||
        (m.village_name || m.address || '').toLowerCase().includes(q)
      )
    );
  }, [allHouseholds, searchQuery]);

  const filterTabs = [
    { key: 'ALL', label: t.filterAll, count: villageFiltered.length },
    { key: 'HIGH', label: t.filterHigh, count: stats.highRisk, color: 'text-red-700 bg-red-50 border-red-200' },
    { key: 'ANC', label: t.filterPregnant, count: stats.anc, color: 'text-rose-700 bg-rose-50 border-rose-200' },
    { key: 'CHILD', label: t.filterChildren, count: stats.child, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { key: 'ELDERLY', label: t.filterElderly, count: stats.elderly, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    { key: 'NCD', label: t.filterNCD, count: stats.ncd, color: 'text-teal-700 bg-teal-50 border-teal-200' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#008080]" />
          <p className="text-sm font-bold">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (selectedHousehold) {
    const currentH = allHouseholds.find(h => h.id === selectedHousehold.id) || selectedHousehold;
    return (
      <div className="space-y-5 animate-in fade-in duration-150">
        <button
          type="button"
          onClick={() => setSelectedHousehold(null)}
          className="inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:text-[#008080] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Village Directory</span>
        </button>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className={'absolute top-0 left-0 w-1.5 h-full ' + (currentH.members.some(isPatientHighRisk) ? 'bg-red-500' : 'bg-[#008080]')} />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {currentH.isUnassigned ? t.unknownHousehold : (currentH.headName + ' ' + t.householdsLabel)}
                </h2>
                {!currentH.isUnassigned && (
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md border border-slate-200">
                    #{currentH.id}
                  </span>
                )}
                {currentH.members.some(isPatientHighRisk) && (
                  <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase">
                    {t.urgentTag}
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#008080]" />
                <span>{currentH.village || 'Village Area'}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenRegister?.(currentH.headName || '')}
              className="px-4 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t.addMemberBtn}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-slate-900">{currentH.members.length}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t.registeredMembers}</p>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-rose-700">{currentH.members.filter(isPatientPregnant).length}</p>
              <p className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">{t.ancTag}</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-amber-700">{currentH.members.filter(isPatientChild).length}</p>
              <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">{t.childTag}</p>
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-teal-700">{currentH.members.filter(isPatientNCD).length}</p>
              <p className="text-[9px] font-bold text-teal-500 uppercase tracking-wider">{t.ncdTag}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#008080]" />
            {t.membersTitle} ({currentH.members.length})
          </h3>

          <div className="space-y-2">
            {currentH.members.map((p) => (
              <MemberRow
                key={p.id || p.unified_id || p.full_name}
                p={p}
                t={t}
                onSelectPatient={onSelectPatient}
                onStartEncounter={onStartEncounter}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Home className="w-6 h-6 text-[#008080]" />
            {t.title}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {availableVillages.length > 1 && (
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#008080]/30 shadow-xs cursor-pointer"
            >
              <option value="ALL">All Villages ({availableVillages.length})</option>
              {availableVillages.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          )}
          <button type="button" onClick={() => onOpenRegister?.('')}
            className="px-4 py-2 bg-[#008080] hover:bg-[#006666] text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>{t.registerBtn}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">{t.totalBeneficiaries}</span>
          <span className="text-2xl font-black text-slate-900">{stats.total}</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">{t.totalHouseholds}</span>
          <span className="text-2xl font-black text-[#008080]">{stats.households}</span>
        </div>
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold uppercase text-rose-400 block">{t.maternalCare}</span>
          <span className="text-2xl font-black text-rose-700">{stats.anc}</span>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl shadow-sm">
          <span className="text-[10px] font-bold uppercase text-amber-500 block">{t.childCare}</span>
          <span className="text-2xl font-black text-amber-700">{stats.child}</span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button key={tab.key} type="button" onClick={() => setActiveFilter(tab.key)}
              className={'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ' + (
                isActive
                  ? 'bg-[#008080] text-white border-[#008080] shadow-sm'
                  : tab.color
                    ? tab.color + ' hover:opacity-80'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}>
              <span>{tab.label}</span>
              <span className={'text-[10px] font-black px-1 rounded ' + (isActive ? 'bg-white/20' : 'bg-white/60')}>{tab.count}</span>
            </button>
          );
        })}
        {activeFilter !== 'ALL' && (
          <button type="button" onClick={() => setActiveFilter('ALL')}
            className="flex-shrink-0 flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 px-2 transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input type="search" placeholder={t.searchPlaceholder} value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008080]/30 focus:border-[#008080] font-medium shadow-sm" />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {(searchQuery || activeFilter !== 'ALL') && (
        <p className="text-[11px] text-slate-500 font-bold">
          Showing {filteredHouseholds.length} household{filteredHouseholds.length !== 1 ? 's' : ''}
        </p>
      )}

      {filteredHouseholds.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="font-black text-slate-700 text-base">{t.noHouseholdsFound}</h3>
          <p className="text-xs text-slate-400 mt-1">{t.noHouseholdsDesc}</p>
          {pats.length === 0 && (
            <button type="button" onClick={() => onOpenRegister?.('')}
              className="mt-5 px-5 py-2.5 bg-[#008080] hover:bg-[#006666] text-white font-black text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4" />
              {t.registerBtn}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHouseholds.map((household) => (
            <HouseholdCard
              key={household.id}
              household={household}
              t={t}
              onOpenFolder={(h) => setSelectedHousehold(h)}
              onSelectPatient={onSelectPatient}
              onStartEncounter={onStartEncounter}
              onRegisterBeneficiary={() => onOpenRegister?.(household.headName || '')}
              isExpanded={expandedHouseholdId === household.id}
              onToggleExpand={() => setExpandedHouseholdId(expandedHouseholdId === household.id ? null : household.id)}
            />
          ))}
        </div>
      )}

      {pats.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-medium">
            <Sparkles className="w-3 h-3 inline mr-1 text-[#008080]" />
            RadVault public.patients {stats.households} households
          </p>
          <button type="button" onClick={onRefresh}
            className="flex items-center gap-1 text-[11px] font-bold text-[#008080] hover:text-[#006666] cursor-pointer">
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}