import React from "react";
import { computeStats } from "../../services/ashaService";
import { Users, Heart, Baby, AlertTriangle, Send, CheckCircle2, TrendingUp, Home } from "lucide-react";

export default function ActivityTracker({ patients }) {
  const s = computeStats(patients);
  const referred = patients.filter(p => false).length; // referrals counted separately in future
  const appActive = patients.filter(p => p.patient_email).length;
  const immunComplete = patients.filter(p => p.is_child && p.vaccine_bcg && p.vaccine_opv && p.vaccine_dpt && p.vaccine_hep_b && p.vaccine_measles && p.vaccine_mr).length;

  const stats = [
    { icon: Users, label: "Total Registered", value: s.total, sub: appActive + " with app access", color: "text-blue-600", bg: "bg-blue-50", border: "border-l-blue-500" },
    { icon: Heart, label: "Pregnant Women", value: s.pregnant, sub: "Tracked in ANC register", color: "text-rose-600", bg: "bg-rose-50", border: "border-l-rose-500" },
    { icon: Baby, label: "Children <5", value: s.children, sub: immunComplete + " fully immunized", color: "text-purple-600", bg: "bg-purple-50", border: "border-l-purple-500" },
    { icon: AlertTriangle, label: "High Risk", value: s.highRisk, sub: "Needing close monitoring", color: "text-amber-600", bg: "bg-amber-50", border: "border-l-amber-500" },
    { icon: CheckCircle2, label: "App Activated", value: appActive, sub: "Patients using Patient Portal", color: "text-teal-600", bg: "bg-teal-50", border: "border-l-teal-500" },
    { icon: TrendingUp, label: "Immunization Complete", value: immunComplete, sub: "All 6 vaccines given", color: "text-green-600", bg: "bg-green-50", border: "border-l-green-500" },
  ];

  return (
    <div className="min-h-screen bg-[#F5FBF9] pb-20">
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-4">
        <h1 className="text-lg font-bold text-[#16324F]">My Activity</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Vadgaon · Priya Deshmukh</p>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {stats.map(({ icon: Icon, label, value, sub, color, bg, border }) => (
          <div key={label} className={"bg-white rounded-xl border border-[#E2E8F0] border-l-4 " + border + " p-4 shadow-sm flex items-center gap-4"}>
            <div className={"w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 " + bg}>
              <Icon className={"w-5 h-5 " + color} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">{label}</p>
              {sub && <p className="text-xs text-gray-400">{sub}</p>}
            </div>
            <div className={"text-2xl font-bold " + color}>{value}</div>
          </div>
        ))}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700 leading-relaxed">
          <span className="font-bold">Note:</span> Real ASHAs submit these numbers manually for monthly incentive claims. RadVault generates this automatically from your village data — saving hours of paperwork.
        </div>
      </div>
    </div>
  );
}