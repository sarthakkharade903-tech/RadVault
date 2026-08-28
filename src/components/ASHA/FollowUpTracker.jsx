import React from "react";
import { Phone, ClipboardList } from "lucide-react";
import { computeDueList } from "../../services/ashaService";

export default function FollowUpTracker({ patients, onEditPatient }) {
  const items = computeDueList(patients).filter(d => d.urgent);

  return (
    <div className="min-h-screen bg-[#F5FBF9] pb-20">
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-4">
        <h1 className="text-lg font-bold text-[#16324F]">High-Risk Follow-Up</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Urgent cases needing your attention</p>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {items.length === 0 && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-10 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-semibold text-[#16324F]">All clear!</p>
            <p className="text-sm text-[#64748B] mt-1">No urgent cases right now.</p>
          </div>
        )}
        {items.map((item, i) => {
          const patient = patients.find(p => p.id === item.patientId);
          return (
            <div key={i} className="bg-white rounded-xl border-l-4 border-l-red-500 border border-[#E2E8F0] shadow-sm p-4">
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                <div className="flex-1">
                  <p className="font-semibold text-[#16324F] text-sm">{item.patientName}</p>
                  <p className="text-xs font-medium text-red-600 mt-0.5">{item.label}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{item.detail}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => patient && onEditPatient(patient)}
                      className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                      <ClipboardList className="w-3.5 h-3.5" /> Visit Today
                    </button>
                    {patient?.mobile && (
                      <a href={"tel:" + patient.mobile}
                        className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}