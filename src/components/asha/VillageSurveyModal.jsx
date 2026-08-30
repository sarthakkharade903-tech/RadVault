import React, { useState, useMemo } from 'react';
import {
  Upload,
  FileText,
  Download,
  AlertTriangle,
  AlertCircle,
  Home,
  X,
  Loader2,
  UserCheck,
  Plus,
  Trash2,
  Users,
  Sparkles
} from 'lucide-react';
import { parseSurveyCsv, downloadSampleSurveyCsv } from '../../utils/surveyCsvParser';
import { batchRegisterPatients } from '../../services/patientService';
import { useAuth } from '../../context/AuthContext';

const RELATIONS = [
  'Head',
  'Spouse',
  'Son',
  'Daughter',
  'Father',
  'Mother',
  'Grandfather',
  'Grandmother',
  'Grandchild',
  'Brother',
  'Sister',
  'In-Law',
  'Other'
];

const COMMON_CONDITIONS = [
  'Hypertension',
  'Diabetes',
  'Asthma',
  'Arthritis',
  'Heart Disease',
  'TB',
  'Anemia',
  'Thyroid'
];

export default function VillageSurveyModal({
  isOpen,
  onClose,
  assignedVillages = [],
  existingPatients = [],
  onSurveyCompleted
}) {
  const { isDemoMode, ashaProfile } = useAuth();

  // Mode: 'MANUAL_SURVEY' (Primary) | 'CSV_IMPORT' (Secondary)
  const [surveyMode, setSurveyMode] = useState('MANUAL_SURVEY');

  // ─── A. MANUAL HOUSEHOLD SURVEY STATE ──────────────────────────────────────
  const defaultVillage = assignedVillages[0] || { id: null, name: 'Shrirampur Ward 4', area_id: null };
  const [selectedVillageId, setSelectedVillageId] = useState(defaultVillage.id || '');
  const [householdId, setHouseholdId] = useState(() => `HH-MH-${Math.floor(100 + Math.random() * 900)}`);
  const [houseLocation, setHouseLocation] = useState('');
  
  // Interactive Family Members List
  const [members, setMembers] = useState([
    {
      id: 1,
      fullName: '',
      age: '',
      gender: 'Male',
      relationToHead: 'Head',
      phone: '',
      bloodGroup: '',
      conditions: [],
      isPregnant: false,
      pregnancyWeeks: ''
    }
  ]);

  // ─── B. CSV BULK IMPORT STATE ─────────────────────────────────────────────
  const [step, setStep] = useState(1); // 1: Input, 2: Verification & Duplicates, 3: Household Preview, 4: Done
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parseResult, setParseResult] = useState(null);
  const [duplicateDecisions, setDuplicateDecisions] = useState({}); // { [rowIndex]: 'CREATE_NEW' | 'SKIP_EXISTING' }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // ─── MANUAL SURVEY HANDLERS ────────────────────────────────────────────────
  const handleAddMember = () => {
    const headMember = members.find(m => m.relationToHead === 'Head') || members[0];
    setMembers(prev => [
      ...prev,
      {
        id: Date.now(),
        fullName: '',
        age: '',
        gender: 'Female',
        relationToHead: prev.length === 1 ? 'Spouse' : 'Child',
        phone: headMember?.phone || '', // auto-inherit head phone number
        bloodGroup: '',
        conditions: [],
        isPregnant: false,
        pregnancyWeeks: ''
      }
    ]);
  };

  const handleRemoveMember = (id) => {
    if (members.length === 1) return;
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleUpdateMember = (id, field, value) => {
    setMembers(prev =>
      prev.map(m => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleToggleCondition = (id, condition) => {
    setMembers(prev =>
      prev.map(m => {
        if (m.id !== id) return m;
        const exists = m.conditions.includes(condition);
        return {
          ...m,
          conditions: exists
            ? m.conditions.filter(c => c !== condition)
            : [...m.conditions, condition]
        };
      })
    );
  };

  // Check duplicates in manual mode
  const checkDuplicateForManualMember = (member) => {
    if (!member.fullName.trim() || !member.age) return null;
    const nameMatch = existingPatients.find(p =>
      (p.full_name || p.name || '').toLowerCase().trim() === member.fullName.toLowerCase().trim() &&
      parseInt(p.age, 10) === parseInt(member.age, 10)
    );
    return nameMatch;
  };

  const handleSaveManualHousehold = async () => {
    setErrorMessage('');

    // Validation
    const invalidMember = members.find(m => !m.fullName.trim() || !m.age || isNaN(parseInt(m.age, 10)));
    if (invalidMember) {
      setErrorMessage('Please fill in the Full Name and a valid Age for all family members.');
      return;
    }

    const matchedVillage = assignedVillages.find(v => v.id === selectedVillageId) || defaultVillage;

    const beneficiariesPayload = members.map(m => ({
      fullName: m.fullName.trim(),
      age: parseInt(m.age, 10),
      gender: m.gender,
      village: matchedVillage.name,
      villageId: matchedVillage.id || null,
      areaId: matchedVillage.area_id || null,
      householdId: householdId.trim().toUpperCase(),
      relationToHead: m.relationToHead,
      phone: m.phone ? m.phone.replace(/[^0-9]/g, '').slice(-10) : null,
      bloodGroup: m.bloodGroup || null,
      knownConditions: m.conditions,
      isPregnant: m.isPregnant,
      pregnancyNotes: m.isPregnant ? `ANC: ${m.pregnancyWeeks || 'Active pregnancy'}` : null
    }));

    setIsSubmitting(true);
    try {
      const res = await batchRegisterPatients(beneficiariesPayload, isDemoMode);
      setImportSummary({
        totalSubmitted: beneficiariesPayload.length,
        createdCount: res.count,
        skippedDuplicates: 0,
        errors: res.errors || []
      });

      if (onSurveyCompleted) {
        onSurveyCompleted(res.registered);
      }

      setStep(4);
    } catch (err) {
      console.error(err);
      setErrorMessage(`Failed to register household: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── CSV IMPORT HANDLERS ──────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result || '';
      setCsvText(text);
      processCsvContent(text);
    };
    reader.readAsText(file);
  };

  const processCsvContent = (text) => {
    setErrorMessage('');
    const result = parseSurveyCsv(text, assignedVillages, existingPatients);
    if (!result.success) {
      setErrorMessage(result.error);
      return;
    }
    setParseResult(result);
    const initialDecisions = {};
    result.possibleDuplicates.forEach(row => {
      initialDecisions[row.rowIndex] = 'SKIP_EXISTING';
    });
    setDuplicateDecisions(initialDecisions);
    setStep(2);
  };

  const handleManualParse = () => {
    if (!csvText.trim()) {
      setErrorMessage('Please paste survey CSV data or upload a file.');
      return;
    }
    processCsvContent(csvText);
  };

  const candidatesForImport = useMemo(() => {
    if (!parseResult) return [];
    const list = [...parseResult.validRows];

    parseResult.possibleDuplicates.forEach(row => {
      if (duplicateDecisions[row.rowIndex] === 'CREATE_NEW') {
        list.push(row);
      }
    });

    return list;
  }, [parseResult, duplicateDecisions]);

  const handleExecuteImport = async () => {
    if (candidatesForImport.length === 0) {
      setErrorMessage('No new beneficiaries selected for import.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await batchRegisterPatients(candidatesForImport, isDemoMode);
      setImportSummary({
        totalSubmitted: candidatesForImport.length,
        createdCount: res.count,
        skippedDuplicates: (parseResult?.possibleDuplicates.length || 0) + (parseResult?.exactMatches.length || 0) - (candidatesForImport.length - parseResult.validRows.length),
        errors: res.errors || []
      });

      if (onSurveyCompleted) {
        onSurveyCompleted(res.registered);
      }

      setStep(4);
    } catch (err) {
      console.error(err);
      setErrorMessage(`Import failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* ── MODAL HEADER ── */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E6F2F2] border border-[#008080]/30 flex items-center justify-center text-lg shadow-inner">
              📋
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Village Survey & Health Register (गाव आरोग्य सर्वेक्षण)</span>
                <span className="text-[10px] font-black uppercase bg-[#FFF5EB] text-[#b35900] px-2 py-0.5 rounded-full border border-[#FF9933]/30">
                  Phase 4
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {ashaProfile?.phc_name || 'Frontline Sub-Centre'} · Assigned ASHA: {ashaProfile?.name || 'Sunita Deshmukh'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── PRIMARY MODE SWITCHER ── */}
        <div className="px-6 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSurveyMode('MANUAL_SURVEY');
                setStep(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                surveyMode === 'MANUAL_SURVEY'
                  ? 'bg-[#008080] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>📝 Manual Household Visit</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSurveyMode('CSV_IMPORT');
                setStep(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                surveyMode === 'CSV_IMPORT'
                  ? 'bg-[#008080] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>📁 Bulk CSV Import</span>
            </button>
          </div>

          <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
            {surveyMode === 'MANUAL_SURVEY' ? '🏠 Physical Family Visit Mode' : '⚡ Batch Upload Mode'}
          </span>
        </div>

        {/* ── MODAL BODY ── */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              MODE 1: MANUAL HOUSEHOLD SURVEY (PRIMARY WORKFLOW)
          ══════════════════════════════════════════════════════════════════ */}
          {surveyMode === 'MANUAL_SURVEY' && step !== 4 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* 1. Household Location & Scope */}
              <div className="p-4 bg-teal-50/50 border border-teal-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-[#008080]" />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Household Identification
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHouseholdId(`HH-MH-${Math.floor(100 + Math.random() * 900)}`)}
                    className="text-[11px] font-bold text-[#008080] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate New ID</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Village / Ward</label>
                    <select
                      value={selectedVillageId}
                      onChange={(e) => setSelectedVillageId(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                    >
                      {assignedVillages.length > 0 ? (
                        assignedVillages.map(v => (
                          <option key={v.id || v.name} value={v.id || ''}>
                            {v.name}
                          </option>
                        ))
                      ) : (
                        <option value="">Shrirampur Ward 4</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Household ID</label>
                    <input
                      type="text"
                      value={householdId}
                      onChange={(e) => setHouseholdId(e.target.value)}
                      placeholder="e.g. HH-MH-401"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-slate-900 outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Landmark / Locality (Optional)</label>
                    <input
                      type="text"
                      value={houseLocation}
                      onChange={(e) => setHouseLocation(e.target.value)}
                      placeholder="e.g. Near Maruti Temple"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Family Members Form List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#008080]" />
                      <span>Household Family Members ({members.length})</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">Record all individuals residing in this household</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="px-3 py-1.5 bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 font-black text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Family Member</span>
                  </button>
                </div>

                {/* Member Input Cards */}
                <div className="space-y-3">
                  {members.map((member, idx) => {
                    const duplicate = checkDuplicateForManualMember(member);

                    return (
                      <div
                        key={member.id}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative hover:border-[#008080]/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-[#008080] text-white flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <span>{member.fullName || `Family Member #${idx + 1}`}</span>
                            <span className="text-[10px] text-slate-400 font-bold">({member.relationToHead})</span>
                          </span>

                          {members.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                              title="Remove member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Core Demographics */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                          <div className="col-span-2">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Full Name *</label>
                            <input
                              type="text"
                              value={member.fullName}
                              onChange={(e) => handleUpdateMember(member.id, 'fullName', e.target.value)}
                              placeholder="Full Name"
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Age *</label>
                            <input
                              type="number"
                              min="0"
                              max="125"
                              value={member.age}
                              onChange={(e) => handleUpdateMember(member.id, 'age', e.target.value)}
                              placeholder="Age"
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Gender</label>
                            <select
                              value={member.gender}
                              onChange={(e) => handleUpdateMember(member.id, 'gender', e.target.value)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                            >
                              <option value="Male">Male (पुरुष)</option>
                              <option value="Female">Female (स्त्री)</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Relation to Head</label>
                            <select
                              value={member.relationToHead}
                              onChange={(e) => handleUpdateMember(member.id, 'relationToHead', e.target.value)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                            >
                              {RELATIONS.map(rel => (
                                <option key={rel} value={rel}>{rel}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Contact & Health Data */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Mobile Phone</label>
                            <input
                              type="text"
                              value={member.phone}
                              onChange={(e) => handleUpdateMember(member.id, 'phone', e.target.value)}
                              placeholder="10-digit number"
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Blood Group</label>
                            <select
                              value={member.bloodGroup}
                              onChange={(e) => handleUpdateMember(member.id, 'bloodGroup', e.target.value)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                            >
                              <option value="">Unknown</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                            </select>
                          </div>

                          {/* Pregnancy Toggle for Women 12-50 */}
                          {member.gender === 'Female' && parseInt(member.age, 10) >= 12 && parseInt(member.age, 10) <= 50 && (
                            <div className="col-span-2 flex items-center gap-2 pt-4">
                              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200">
                                <input
                                  type="checkbox"
                                  checked={member.isPregnant}
                                  onChange={(e) => handleUpdateMember(member.id, 'isPregnant', e.target.checked)}
                                  className="accent-amber-600 rounded"
                                />
                                <span>🤰 Currently Pregnant (ANC)</span>
                              </label>
                            </div>
                          )}
                        </div>

                        {/* Known Conditions Tags */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 block">Known Health Conditions / NCDs:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {COMMON_CONDITIONS.map(cond => {
                              const isSelected = member.conditions.includes(cond);
                              return (
                                <button
                                  key={cond}
                                  type="button"
                                  onClick={() => handleToggleCondition(member.id, cond)}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-teal-700 text-white border-teal-700'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {cond}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Duplicate Warning */}
                        {duplicate && (
                          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>
                              <strong>Possible duplicate:</strong> Patient "{duplicate.full_name}" ({duplicate.age}y) already exists in {duplicate.address || 'this village'}.
                            </span>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Manual Household */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || members.length === 0}
                  onClick={handleSaveManualHousehold}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Household...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Save & Onboard Household ({members.length} Members)</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              MODE 2: BULK CSV IMPORT (SECONDARY WORKFLOW)
          ══════════════════════════════════════════════════════════════════ */}
          {surveyMode === 'CSV_IMPORT' && step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Template Download Card */}
              <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-[#008080] shrink-0" />
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Standard Survey CSV Format</h4>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Columns: Name, Age, Gender, Village, Household_ID, Relation_to_Head, Mobile, Known_Conditions
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadSampleSurveyCsv}
                  className="px-3 py-1.5 bg-white hover:bg-teal-100 border border-teal-300 text-[#008080] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* File Dropzone */}
              <div className="border-2 border-dashed border-slate-200 hover:border-[#008080] rounded-3xl p-6 text-center space-y-3 bg-slate-50/50 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs mx-auto flex items-center justify-center text-[#008080]">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-900 cursor-pointer hover:underline">
                    <span>Click to upload survey CSV file</span>
                    <input
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5">Supports CSV files exported from Excel or survey devices</p>
                </div>
                {fileName && (
                  <span className="inline-block text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
                    📄 {fileName}
                  </span>
                )}
              </div>

              {/* Or Manual CSV Paste */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Or Paste Raw CSV Data Directly
                  </label>
                  <span className="text-[10px] text-slate-400">Header row required</span>
                </div>
                <textarea
                  rows={4}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Name,Age,Gender,Village,Household_ID,Relation_to_Head,Mobile..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-[#008080] focus:bg-white rounded-2xl text-xs font-mono outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleManualParse}
                  className="px-6 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Verify Survey Records →</span>
                </button>
              </div>

            </div>
          )}

          {/* ── STEP 2: VERIFICATION & DUPLICATE RESOLUTION ── */}
          {surveyMode === 'CSV_IMPORT' && step === 2 && parseResult && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* Summary Metric Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Rows</span>
                  <span className="text-xl font-black text-slate-900">{parseResult.totalRows}</span>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">New & Valid</span>
                  <span className="text-xl font-black text-emerald-800">{parseResult.validRows.length}</span>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">Duplicates</span>
                  <span className="text-xl font-black text-amber-900">{parseResult.possibleDuplicates.length + parseResult.exactMatches.length}</span>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-rose-700 uppercase block">Invalid Rows</span>
                  <span className="text-xl font-black text-rose-800">{parseResult.invalidRows.length}</span>
                </div>
              </div>

              {/* Possible Duplicate Resolution Section */}
              {parseResult.possibleDuplicates.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                      Potential Duplicates Found ({parseResult.possibleDuplicates.length}) — Review Required
                    </h4>
                  </div>
                  <p className="text-[11px] text-amber-900 font-medium">
                    The following surveyed individuals have similar name, age, or contact info to registered patients. Select whether to create a separate record or keep the existing profile.
                  </p>

                  <div className="divide-y divide-amber-200/80 bg-white rounded-xl border border-amber-200 overflow-hidden text-xs">
                    {parseResult.possibleDuplicates.map((row) => (
                      <div key={row.rowIndex} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">
                            {row.fullName} ({row.age}y, {row.gender})
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Surveyed: {row.village} · HH: {row.householdId} · Existing Match: <strong>{row.existingPatient?.full_name} ({row.existingPatient?.age}y)</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setDuplicateDecisions(prev => ({ ...prev, [row.rowIndex]: 'SKIP_EXISTING' }))}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                              duplicateDecisions[row.rowIndex] === 'SKIP_EXISTING'
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            ✓ Use Existing (Skip)
                          </button>

                          <button
                            type="button"
                            onClick={() => setDuplicateDecisions(prev => ({ ...prev, [row.rowIndex]: 'CREATE_NEW' }))}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                              duplicateDecisions[row.rowIndex] === 'CREATE_NEW'
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            + Create New Beneficiary
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  ← Back to Upload
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Preview Households ({candidatesForImport.length} Ready) →</span>
                </button>
              </div>

            </div>
          )}

          {/* ── STEP 3: HOUSEHOLD CLUSTERING PREVIEW ── */}
          {surveyMode === 'CSV_IMPORT' && step === 3 && parseResult && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Surveyed Households ({Object.keys(parseResult.households).length} Clusters)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Beneficiaries grouped by Household ID for family-centered community care.
                </p>
              </div>

              {/* Households List */}
              <div className="space-y-3">
                {Object.values(parseResult.households).map((hh) => (
                  <div key={hh.householdId} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-[#008080]" />
                        <span className="text-xs font-black text-slate-900">
                          {hh.householdId} — {hh.head || 'Household'} Family
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                        {hh.village} · {hh.members.length} Members
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {hh.members.map((m, idx) => (
                        <div key={idx} className="p-2 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800">{m.fullName}</span>
                            <span className="text-[10px] text-slate-400 block">{m.age}y · {m.gender} · {m.relationToHead}</span>
                          </div>
                          {m.isPregnant && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                              ANC
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Confirmation & Commit Button */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  ← Back to Validation
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || candidatesForImport.length === 0}
                  onClick={handleExecuteImport}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Onboarding Beneficiaries...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Confirm & Onboard {candidatesForImport.length} Beneficiaries</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* ── STEP 4: SUCCESS SUMMARY (COMMON TO BOTH MODES) ── */}
          {step === 4 && importSummary && (
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-sm">
                ✓
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">Village Survey & Onboarding Complete!</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Beneficiaries have been safely registered into your village roster.
                </p>
              </div>

              <div className="max-w-sm mx-auto p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Total Beneficiaries Processed:</span>
                  <span className="font-black text-slate-900">{importSummary.totalSubmitted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700 font-bold">Successfully Registered:</span>
                  <span className="font-black text-emerald-700">{importSummary.createdCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Skipped Duplicates:</span>
                  <span className="font-black text-slate-700">{importSummary.skippedDuplicates}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3 bg-[#008080] hover:bg-[#006666] text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
                >
                  View Updated Village Health Roster →
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
