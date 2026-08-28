import React, { useState, useEffect } from 'react';
import { UserCircle2, Search, Loader2 } from 'lucide-react';
import { getVillagePatients } from '../../../services/ashaService';

export default function PatientSelectScreen({ onSelect }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await getVillagePatients();
      setPatients(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
      <div>
        <h3 className="text-[17px] font-black text-[#16324F] tracking-tight">Select Patient</h3>
        <p className="text-xs font-semibold text-[#64748B] mt-1 leading-relaxed">
          Who needs a referral today?
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
        <input 
          type="text" 
          placeholder="Search by name..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-4 py-3 text-sm font-semibold text-[#16324F] focus:outline-none focus:border-[#008F83] focus:ring-2 focus:ring-[#008F83]/20 transition-all shadow-sm"
        />
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 text-[#008F83] animate-spin" /></div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
          {filtered.map(p => (
            <button key={p.id} onClick={() => onSelect(p)}
              className="w-full text-left bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-sm hover:border-[#008F83] hover:shadow-md transition-all flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F5FBF9] rounded-full flex items-center justify-center border border-[#E2E8F0] group-hover:bg-[#008F83]/10 group-hover:border-[#008F83]/30 transition-colors">
                  <UserCircle2 className="w-5 h-5 text-[#008F83]" />
                </div>
                <div>
                  <p className="text-sm font-black text-[#16324F]">{p.name}</p>
                  <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mt-0.5">
                    {p.gender} · {p.age_years} yrs
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {p.is_pregnant && <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">MATERNAL</span>}
                {p.age_years <= 5 && <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">CHILD</span>}
                {p.has_chronic && <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">CHRONIC</span>}
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-center text-sm font-bold text-[#94A3B8] py-8">No patients found</p>}
        </div>
      )}
    </div>
  );
}