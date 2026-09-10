import React, { useState, useEffect } from 'react';
import { UserCircle2, Search, Loader2, Plus, UserPlus, Heart, Baby, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { getVillagePatients, addPatient } from '../../../services/ashaService';

const FALLBACK_PATIENTS = [
  { id: 'b6f81101-46d0-4b4d-8df0-9d9ce11a6a70', name: 'Rekha Bai', gender: 'Female', age_years: 22, is_pregnant: true, relation_to_head: 'Wife', village: 'Shirwal' },
  { id: 'c7a91102-46d0-4b4d-8df0-9d9ce11a6a71', name: 'Aarav Patil', gender: 'Male', age_years: 3, is_child: true, relation_to_head: 'Son', village: 'Shirwal' },
  { id: 'd8b01103-46d0-4b4d-8df0-9d9ce11a6a72', name: 'Gangubai Shinde', gender: 'Female', age_years: 68, has_chronic: true, relation_to_head: 'Mother', village: 'Shirwal' },
  { id: 'e9c11104-46d0-4b4d-8df0-9d9ce11a6a73', name: 'Ramesh Patil', gender: 'Male', age_years: 42, relation_to_head: 'Self', village: 'Shirwal' }
];

export default function PatientSelectScreen({ onSelect, onSelectPatient, demoMode = false }) {
  const handleSelection = onSelectPatient || onSelect;

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [customName, setCustomName] = useState('');
  const [creatingCustom, setCreatingCustom] = useState(false);

  const loadPatients = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchErr } = await getVillagePatients();
      if (fetchErr) throw fetchErr;
      if (data && data.length > 0) {
        setPatients(data);
      } else if (demoMode) {
        setPatients(FALLBACK_PATIENTS);
      } else {
        setPatients([]);
      }
    } catch (e) {
      console.error("Error loading village patients:", e);
      if (demoMode) {
        setPatients(FALLBACK_PATIENTS);
      } else {
        setError(`Failed to load registered patients: ${e.message || 'Database error'}`);
        setPatients([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [demoMode]);

  const filtered = patients.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  const handleSelectCustom = async () => {
    if (!customName.trim() || creatingCustom) return;
    try {
      setCreatingCustom(true);
      setError('');
      if (!demoMode) {
        const { data, error: addErr } = await addPatient({
          name: customName.trim(),
          gender: null,
          age_years: null,
          village: 'Shirwal',
          mobile: null
        });
        if (addErr) throw addErr;
        if (data && handleSelection) {
          handleSelection(data);
          return;
        }
      }
      const newPat = {
        id: crypto.randomUUID(),
        name: customName.trim(),
        gender: null,
        age_years: null,
        village: 'Shirwal'
      };
      if (handleSelection) handleSelection(newPat);
    } catch (err) {
      console.error("Failed to register walk-in patient:", err);
      setError(`Failed to register walk-in: ${err.message || 'Database error'}`);
    } finally {
      setCreatingCustom(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base sm:text-lg font-black text-[#16324F] tracking-tight">Select Patient for Referral</h3>
        <p className="text-xs font-semibold text-slate-500 mt-0.5 leading-relaxed">
          Select a registered village resident or register a walk-in patient
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search registered patient by name or ID..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm font-bold text-[#16324F] placeholder-slate-400 focus:outline-none focus:border-[#008F83] focus:ring-1 focus:ring-[#008F83] transition-all shadow-2xs"
        />
      </div>

      {/* Walk-in patient quick registration box */}
      <div className="bg-emerald-50/60 border border-teal-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-2xs">
        <div className="min-w-0 flex-1">
          <label className="block text-[10px] font-black uppercase tracking-wider text-teal-900 mb-1">
            Walk-in Patient / Unregistered Resident
          </label>
          <input
            type="text"
            placeholder="Type full patient name..."
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            className="w-full bg-white border border-teal-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#008F83]"
          />
        </div>
        <button
          type="button"
          disabled={!customName.trim() || creatingCustom}
          onClick={handleSelectCustom}
          className="px-4 py-2.5 bg-[#008F83] hover:bg-[#007A70] disabled:bg-slate-300 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap self-end sm:self-auto sm:mt-5"
        >
          {creatingCustom ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <UserPlus className="w-3.5 h-3.5" />
          )}
          <span>{creatingCustom ? 'Registering...' : 'Refer Walk-in'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadPatients}
            className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-10 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 text-[#008F83] animate-spin" />
          <span className="text-xs font-bold text-slate-400">Loading registered village residents...</span>
        </div>
      ) : (
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-hide">
          {filtered.map(p => {
            const hasAbha = p.abha_id && p.abha_id !== "PENDING" && p.abha_id !== "Not linked yet";
            const abhaStorage = p.id ? localStorage.getItem(`radvault_abha_${p.id}`) : null;
            const effectiveAbha = hasAbha ? p.abha_id : (abhaStorage || null);

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelection && handleSelection(p)}
                className="w-full text-left bg-white border border-slate-200 hover:border-[#008F83] hover:shadow-xs p-4 rounded-2xl shadow-2xs transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 bg-teal-50 text-[#008F83] rounded-2xl flex items-center justify-center font-black text-base flex-shrink-0 group-hover:bg-[#008F83] group-hover:text-white transition-colors">
                    {p.name ? p.name[0] : 'P'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black text-slate-900 leading-tight truncate">{p.name}</p>
                      {effectiveAbha ? (
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          ✓ ABHA Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          ⏳ Pending ABHA
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-500 mt-1">
                      {p.gender || 'Person'} · {p.age_years !== null && p.age_years !== undefined ? `${p.age_years} yrs` : 'Age N/A'} · {p.relation_to_head || 'Resident'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap pl-2">
                  {p.is_pregnant && (
                    <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-0.5">
                      <Heart className="w-3 h-3" /> ANC
                    </span>
                  )}
                  {p.age_years !== null && p.age_years !== undefined && p.age_years <= 5 && (
                    <span className="text-[10px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-0.5">
                      <Baby className="w-3 h-3" /> CHILD
                    </span>
                  )}
                  {p.has_chronic && (
                    <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      CHRONIC
                    </span>
                  )}
                  <span className="text-slate-400 group-hover:text-[#008F83] group-hover:translate-x-1 transition-all text-sm font-black ml-1">
                    →
                  </span>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4">
              <p className="text-xs font-bold text-slate-500">No resident found with that name.</p>
              <p className="text-[11px] text-teal-700 font-bold mt-1">You can enter the patient's name in the walk-in box above to refer immediately.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}