import React, { useState } from "react";
import { Phone, ClipboardList, CheckCircle2, AlertTriangle, Check } from "lucide-react";
import { computeDueList } from "../../services/ashaService";

export default function FollowUpTracker({ patients, onEditPatient }) {
  const [completedSet, setCompletedSet] = useState(() => {
    try {
      const saved = localStorage.getItem("radvault_completed_tasks");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const rawItems = computeDueList(patients).filter(d => d.urgent);

  // Fallback high risk tasks if db is empty
  const defaultItems = [
    {
      patientId: 'P002',
      patientName: 'Rekha Bai (रेखा बाई)',
      label: 'Severe Anemia (Hb 8.2) & Swollen Feet',
      detail: '28 Weeks Pregnant • Needs urgent ANC follow-up',
      mobile: '+91 98451-88310'
    },
    {
      patientId: 'P001',
      patientName: 'Ramesh Patil (रमेश पाटील)',
      label: 'High Fever, Cough & SpO2 92%',
      detail: 'Suspected Chest Infection • Home visit required',
      mobile: '+91 97123-45678'
    }
  ];

  const items = rawItems.length > 0 ? rawItems : defaultItems;

  const handleMarkVisited = (patientId) => {
    setCompletedSet(prev => {
      const next = new Set(prev);
      if (patientId) {
        next.add(patientId);
        next.add(`task-${patientId}`);
        next.add(`db-task-${patientId}`);
      }
      localStorage.setItem("radvault_completed_tasks", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F5FBF9] pb-24 font-sans text-slate-800">
      <div className="bg-white border-b border-[#E2E8F0] px-5 py-4">
        <h1 className="text-xl font-black text-[#16324F]">High-Risk Follow-Up Register</h1>
        <p className="text-xs text-[#64748B] mt-0.5">Critical patients requiring urgent home visit or hospital referral</p>
      </div>

      <div className="px-4 pt-5 space-y-3 max-w-2xl mx-auto">
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto mb-3" />
            <p className="font-extrabold text-[#16324F] text-base">All clear!</p>
            <p className="text-xs text-[#64748B] mt-1">No urgent high-risk cases pending right now.</p>
          </div>
        ) : (
          items.map((item, i) => {
            const patient = patients.find(p => p.id === item.patientId);
            const isVisited = completedSet.has(item.patientId) || completedSet.has(`task-${item.patientId}`);

            return (
              <div
                key={i}
                className={`bg-white rounded-2xl border p-4 shadow-xs transition-all ${
                  isVisited
                    ? 'border-slate-200 opacity-60 bg-slate-50'
                    : 'border-l-4 border-l-red-500 border-[#E2E8F0]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${isVisited ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-black text-[#16324F] text-sm">{item.patientName}</p>
                      {isVisited ? (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Visited
                        </span>
                      ) : (
                        <span className="text-[9px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase">
                          High Risk
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-red-600 mt-1">{item.label}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">{item.detail}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-3.5">
                      {!isVisited ? (
                        <>
                          <button
                            onClick={() => {
                              if (patient) onEditPatient(patient);
                              else handleMarkVisited(item.patientId);
                            }}
                            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                          >
                            <ClipboardList className="w-3.5 h-3.5" /> Log Visit
                          </button>
                          
                          <button
                            onClick={() => handleMarkVisited(item.patientId)}
                            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-2 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Mark Visited
                          </button>

                          {(patient?.mobile || item.mobile) && (
                            <a
                              href={`tel:${patient?.mobile || item.mobile}`}
                              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" /> Call
                            </a>
                          )}
                        </>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          ✓ Home visit completed &amp; recorded
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}