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
          gender: 'Other',
          age_years: 30,
          village: 'Shirwal',
          phone: '9876543210'
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
        gender: 'Other',
        age_years: 30,
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
    <div className="space-y-4">
      <div>
        <h3 className="text-base sm:text-lg font-black text-[#16324F] tracking-tight">Select Patient for Referral</h3>
        <p className="text-xs font-semibold text-slate-500 mt-0.5 leading-relaxed">
          Tap on a village resident or add a walk-in patient
        </p>
      </div>

      {/* Search & Walk-in Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search registered patient by name..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm font-bold text-[#16324F] placeholder-slate-400 focus:outline-none focus:border-[#008F83] focus:ring-1 focus:ring-[#008F83] transition-all shadow-xs"
        />
      </div>

      {/* Walk-in patient quick bar */}
      <div className="bg-[#E8F7F3] border border-[#008F83]/30 rounded-xl p-3 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <input
            type="text"
            placeholder="Or type walk-in patient name..."
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            className="w-full bg-white border border-teal-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>
        <button
          type="button"
          disabled={!customName.trim() || creatingCustom}
          onClick={handleSelectCustom}
          className="px-3.5 py-2 bg-[#008F83] hover:bg-[#007A70] disabled:bg-slate-300 text-white font-extrabold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
        >
          {creatingCustom ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <UserPlus className="w-3.5 h-3.5" />
          )}
          <span>{creatingCustom ? 'Registering...' : 'Refer'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadPatients}
            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 text-[#008F83] animate-spin" />
        </div>
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-hide">
          {filtered.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelection && handleSelection(p)}
              className="w-full text-left bg-white border border-[#E2E8F0] p-3.5 rounded-xl shadow-xs hover:border-[#008F83] hover:bg-[#F5FBF9] transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#E8F7F3] rounded-xl flex items-center justify-center font-black text-sm text-[#008F83] flex-shrink-0 group-hover:bg-[#008F83] group-hover:text-white transition-colors">
                  {p.name ? p.name[0] : 'P'}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-black text-[#16324F] leading-tight">{p.name}</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                    {p.gender || 'Person'} · {p.age_years || '30'} yrs · {p.relation_to_head || 'Resident'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {p.is_pregnant && (
                  <span className="text-[9px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-0.5">
                    <Heart className="w-2.5 h-2.5" /> ANC
                  </span>
                )}
                {p.age_years <= 5 && (
                  <span className="text-[9px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                    <Baby className="w-2.5 h-2.5" /> CHILD
                  </span>
                )}
                {p.has_chronic && (
                  <span className="text-[9px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    CHRONIC
                  </span>
                )}
                <span className="text-slate-400 group-hover:text-[#008F83] group-hover:translate-x-0.5 transition-all text-xs font-bold ml-1">
                  →
                </span>
              </div>
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs font-bold text-slate-500">No resident found with that name.</p>
              <p className="text-[11px] text-teal-700 font-semibold mt-1">Use the walk-in box above to refer immediately.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}