import React, { useState, useMemo } from 'react';
import { Search, X, UserPlus, ArrowRight, User, Phone } from 'lucide-react';

export default function PatientSearchModal({
  isOpen,
  onClose,
  patients = [],
  onSelectPatient,
  onOpenRegisterNew
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return patients.slice(0, 10);

    return patients.filter((p) => {
      const name = (p.full_name || p.name || '').toLowerCase();
      const id = (p.unified_id || p.id || '').toLowerCase();
      const phone = (p.phone_number || p.phone || '').toLowerCase();
      const village = (p.address || p.village || '').toLowerCase();
      return name.includes(q) || id.includes(q) || phone.includes(q) || village.includes(q);
    });
  }, [patients, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white border-2 border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#008080] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Find Village Patient</h2>
              <p className="text-xs text-white/80">Search by Name, Unified Patient ID, or Phone Number</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-6 pb-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type name (e.g. Rajesh), ID (e.g. MH-P-10482), or phone..."
              className="w-full pl-11 pr-10 py-3 bg-slate-50 border-2 border-slate-200 focus:border-[#008080] focus:bg-white rounded-2xl text-sm font-medium text-[#212121] outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Results List */}
        <div className="p-6 max-h-[380px] overflow-y-auto space-y-2.5">
          {/* Result Count Indicator */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-1 px-1">
            <span>
              {filteredPatients.length === 0
                ? 'No matching beneficiaries'
                : filteredPatients.length === 1
                ? '1 matching beneficiary'
                : `${filteredPatients.length} matching beneficiaries`}
            </span>
            {searchQuery && (
              <span className="text-[11px] font-normal text-slate-400">
                Filtered by "{searchQuery}"
              </span>
            )}
          </div>

          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => {
              const patientId = patient.unified_id || patient.id;
              const name = patient.full_name || patient.name || 'Beneficiary';
              const age = patient.age;
              const gender = patient.gender;
              const phone = patient.phone_number || patient.phone;
              const bloodGroup = patient.blood_group || patient.bloodGroup;

              return (
                <div
                  key={patient.id}
                  onClick={() => {
                    onSelectPatient(patient);
                    onClose();
                  }}
                  role="button"
                  tabIndex={0}
                  className="p-4 rounded-2xl bg-white border-2 border-slate-100 hover:border-[#008080] hover:bg-[#E6F2F2]/30 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-[#008080]/15 flex items-center justify-center text-slate-600 group-hover:text-[#008080] shrink-0 font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-[#212121] group-hover:text-[#008080] transition-colors">
                          {name}
                        </span>
                        {bloodGroup && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            🩸 {bloodGroup}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                        <span className="font-mono text-[11px] text-[#008080] font-bold">
                          ID: {patientId}
                        </span>
                        {age && <span>{age} yrs{gender ? `, ${gender}` : ''}</span>}
                        {phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-[#008080] group-hover:translate-x-1 transition-transform shrink-0">
                    <span>Select</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 px-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 mb-1">No matching patient found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                No beneficiary matching "{searchQuery}" was found in the village registry.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenRegisterNew(searchQuery);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 text-xs font-extrabold rounded-xl transition-colors shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                Register "{searchQuery}" as New Patient
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredPatients.length} registered beneficiaries
          </span>
          <button
            onClick={() => {
              onClose();
              onOpenRegisterNew('');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#008080] hover:text-[#006666] transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            + Register New Patient
          </button>
        </div>
      </div>
    </div>
  );
}
