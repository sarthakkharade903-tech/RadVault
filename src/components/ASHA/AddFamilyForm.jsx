import React, { useState } from "react";
import { ChevronLeft, Loader2, AlertCircle, Check } from "lucide-react";
import { addFamily, updateFamily } from "../../services/ashaService";

const I = ({ ...p }) => (
  <input {...p} className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#16324F] placeholder-gray-400 focus:outline-none focus:border-[#008F83] focus:ring-1 focus:ring-[#008F83] bg-white" />
);
const L = ({ children, sub }) => (
  <div className="mb-1.5">
    <label className="block text-sm font-semibold text-gray-700">{children}</label>
    {sub && <p className="text-xs text-[#94A3B8] mt-0.5">{sub}</p>}
  </div>
);
const Chip = ({ active, onClick, children, color = "teal" }) => {
  const ac = color === "red" ? "bg-red-100 border-red-400 text-red-800" : color === "amber" ? "bg-amber-100 border-amber-400 text-amber-800" : "bg-teal-100 border-[#008F83] text-teal-800";
  return (
    <button type="button" onClick={onClick}
      className={"px-4.5 py-3.5 rounded-xl border-2 text-sm font-semibold transition-all " + (active ? ac : "bg-white border-[#E2E8F0] text-gray-600 hover:border-gray-400")}>
      {children}
    </button>
  );
};
const Tog = ({ checked, onChange, label }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className={"w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all mb-2 " + (checked ? "bg-[#E8F7F3] border-teal-400" : "bg-white border-[#E2E8F0] hover:border-[#E2E8F0]")}>
    <span className={"text-sm font-semibold " + (checked ? "text-teal-800" : "text-gray-700")}>{label}</span>
    <div className={"w-6 h-6 rounded-full border-2 flex items-center justify-center " + (checked ? "bg-[#008F83] border-teal-600" : "border-[#E2E8F0]")}>
      {checked && <Check className="w-3.5 h-3.5 text-white" />}
    </div>
  </button>
);

const TABS = ["Household", "WASH Survey", "Vulnerability", "Portal Access"];

export default function AddFamilyForm({ family: existing, onBack, onSaved }) {
  const isEdit = !!existing;
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [f, setF] = useState({
    family_name:      existing?.family_name       || "",
    head_of_family:   existing?.head_of_family    || "",
    village:          existing?.village            || "Vadgaon",
    address:          existing?.address            || "",
    asha_name:        existing?.asha_name          || "Priya Deshmukh",
    notes:            existing?.notes              || "",
    ration_card:      existing?.ration_card        || "",
    water_source:     existing?.water_source       || "",
    sanitation:       existing?.sanitation         || "",
    cooking_fuel:     existing?.cooking_fuel       || "",
    electricity:      existing?.electricity === true ? "Yes" : existing?.electricity === false ? "No" : "",
    housing_type:     existing?.housing_type       || "",
    has_elderly:      existing?.has_elderly        || false,
    has_disabled:     existing?.has_disabled       || false,
    high_risk_household: existing?.high_risk_household || false,
    migration_status: existing?.migration_status   || "",
    social_category:  existing?.social_category    || "",
    family_email:     existing?.family_email       || "",
    family_temp_password: existing?.family_temp_password || "",
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!f.family_name.trim()) { setError("Family name is required."); setTab(0); return; }
    if (!f.village.trim()) { setError("Village is required."); setTab(0); return; }
    if (f.family_email.trim() && !f.family_temp_password.trim()) {
      setError("Set a password if you enter an email."); setTab(3); return;
    }
    setSaving(true); setError("");

    const payload = {
      ...f,
      electricity: f.electricity === "Yes" ? true : f.electricity === "No" ? false : null,
      family_name: f.family_name.trim(),
      family_email: f.family_email ? f.family_email.trim().toLowerCase() : null,
      family_temp_password: f.family_temp_password || null,
      ...(!isEdit && { family_pin: String(Math.floor(1000 + Math.random() * 9000)) }),
    };

    const { data, error: saveErr } = isEdit
      ? await updateFamily(existing.id, payload)
      : await addFamily(payload);
    setSaving(false);
    if (saveErr) { setError(saveErr.message); return; }
    onSaved(data);
  };

  const tabBtn = (i, label) => (
    <button key={i} onClick={() => setTab(i)}
      className={"flex-1 py-3.5 text-xs font-bold border-b-2 transition-all " + (tab === i ? "border-teal-600 text-[#009E8E]" : "border-transparent text-[#94A3B8] hover:text-gray-600")}>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F5FBF9] pb-32">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-base font-bold text-[#16324F]">{isEdit ? "Edit Family" : "Register Family"}</h1>
            <p className="text-xs text-[#64748B]">{isEdit ? (existing.family_name + " #" + existing.family_pin) : "Step 1 of 2 — Household details"}</p>
          </div>
        </div>
        <div className="flex border-b border-[#E2E8F0]">
          {TABS.map((l, i) => tabBtn(i, l))}
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 flex gap-2 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-red-800">{error}</p>
        </div>
      )}

      <div className="px-4 pt-5 max-w-lg mx-auto">

        {/* ── Tab 0: Household ── */}
        {tab === 0 && (
          <div className="space-y-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
            <div>
              <L>Family Name / Surname <span className="text-red-500">*</span></L>
              <I value={f.family_name} onChange={e => set("family_name", e.target.value)} placeholder="e.g. Patil" />
              <p className="text-xs text-[#94A3B8] mt-1">A 4-digit PIN will auto-generate to tell apart families with the same surname (e.g. Patil #4832).</p>
            </div>
            <div>
              <L>Head of Household</L>
              <I value={f.head_of_family} onChange={e => set("head_of_family", e.target.value)} placeholder="e.g. Ramu Bhaurao Patil" />
            </div>
            <div>
              <L>Village <span className="text-red-500">*</span></L>
              <I value={f.village} onChange={e => set("village", e.target.value)} placeholder="e.g. Vadgaon" />
            </div>
            <div>
              <L sub="Wada/house no., landmark, hamlet">House Address</L>
              <I value={f.address} onChange={e => set("address", e.target.value)} placeholder="e.g. House No. 14, Near Hanuman Mandir" />
            </div>
            <div>
              <L>Notes (optional)</L>
              <textarea value={f.notes} onChange={e => set("notes", e.target.value)} rows={2} placeholder="Any additional notes..."
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#16324F] placeholder-gray-400 focus:outline-none focus:border-[#008F83] resize-none bg-white" />
            </div>
          </div>
        )}

        {/* ── Tab 1: WASH Survey ── */}
        {tab === 1 && (
          <div className="space-y-5 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
            <div>
              <L sub="Government ration card type">Ration Card</L>
              <div className="flex flex-wrap gap-2">
                {["APL (White)","BPL (Yellow)","Antyodaya (AAY)","None"].map(r => (
                  <Chip key={r} active={f.ration_card === r} onClick={() => set("ration_card", f.ration_card === r ? "" : r)}>{r}</Chip>
                ))}
              </div>
            </div>
            <div>
              <L sub="Primary drinking water source">Water Source</L>
              <div className="flex flex-wrap gap-2">
                {["Tap / Piped","Hand Pump","Borewell","Well","River / Nala","Other"].map(w => (
                  <Chip key={w} active={f.water_source === w} onClick={() => set("water_source", f.water_source === w ? "" : w)}>{w}</Chip>
                ))}
              </div>
            </div>
            <div>
              <L sub="Sanitation facility used">Toilet</L>
              <div className="flex flex-wrap gap-2">
                {["In-house Toilet","Community Toilet","Open Defecation"].map(s => (
                  <Chip key={s} active={f.sanitation === s} onClick={() => set("sanitation", f.sanitation === s ? "" : s)} color={s === "Open Defecation" ? "red" : "teal"}>{s}</Chip>
                ))}
              </div>
            </div>
            <div>
              <L sub="Indoor air pollution risk">Cooking Fuel</L>
              <div className="flex flex-wrap gap-2">
                {["LPG / PNG","Firewood / Chulha","Kerosene","Biogas"].map(c => (
                  <Chip key={c} active={f.cooking_fuel === c} onClick={() => set("cooking_fuel", f.cooking_fuel === c ? "" : c)} color={c === "Firewood / Chulha" ? "amber" : "teal"}>{c}</Chip>
                ))}
              </div>
            </div>
            <div>
              <L>Electricity</L>
              <div className="flex gap-2">
                {["Yes","No"].map(e => (
                  <Chip key={e} active={f.electricity === e} onClick={() => set("electricity", f.electricity === e ? "" : e)}>{e}</Chip>
                ))}
              </div>
            </div>
            <div>
              <L sub="Construction type of house">Housing Type</L>
              <div className="flex flex-wrap gap-2">
                {["Pucca","Semi-Pucca","Kutcha"].map(h => (
                  <Chip key={h} active={f.housing_type === h} onClick={() => set("housing_type", f.housing_type === h ? "" : h)}>{h}</Chip>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 2: Vulnerability ── */}
        {tab === 2 && (
          <div className="space-y-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
            <div>
              <L sub="Helps prioritise government schemes">Social / Caste Category</L>
              <div className="flex flex-wrap gap-2 mb-4">
                {["General","OBC","SC","ST","NT/VJNT"].map(sc => (
                  <Chip key={sc} active={f.social_category === sc} onClick={() => set("social_category", f.social_category === sc ? "" : sc)}>{sc}</Chip>
                ))}
              </div>
            </div>
            <Tog checked={f.has_elderly}      onChange={v => set("has_elderly", v)}      label="Household has elderly person (60+)" />
            <Tog checked={f.has_disabled}     onChange={v => set("has_disabled", v)}     label="Household has person with disability" />
            <Tog checked={f.high_risk_household} onChange={v => set("high_risk_household", v)} label="Mark as High-Risk Household" />
            <div>
              <L sub="Are any members seasonal migrants?">Migration Status</L>
              <div className="flex flex-wrap gap-2">
                {["No Migration","Seasonal","Permanent"].map(m => (
                  <Chip key={m} active={f.migration_status === m} onClick={() => set("migration_status", f.migration_status === m ? "" : m)}>{m}</Chip>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 3: Portal Access ── */}
        {tab === 3 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
            <div className="bg-[#E8F7F3] border border-[#008F83]/30 rounded-xl p-4 mb-5">
              <p className="text-sm font-bold text-teal-900 mb-1">Family Patient Portal</p>
              <p className="text-sm text-[#009E8E]">One email + password gives the whole family access to view their health records in the patient app. Leave blank if the family has no smartphone.</p>
            </div>
            <div className="space-y-4">
              <div>
                <L>Family Email</L>
                <I type="email" value={f.family_email} onChange={e => set("family_email", e.target.value)} placeholder="family@gmail.com" />
              </div>
              {f.family_email.trim() && (
                <div>
                  <L sub="Min 6 characters">Set Password</L>
                  <I type="text" value={f.family_temp_password} onChange={e => set("family_temp_password", e.target.value)} placeholder="e.g. Patil@1234" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] px-4 py-4 z-20">
        <div className="flex gap-3 max-w-lg mx-auto">
          {tab > 0 && (
            <button onClick={() => setTab(t => t - 1)} className="w-1/3 bg-gray-100 border border-[#E2E8F0] text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors">
              Back
            </button>
          )}
          {tab < 3 ? (
            <button onClick={() => setTab(t => t + 1)} className="flex-1 bg-[#008F83] hover:bg-[#009E8E] text-white font-bold py-3.5 rounded-xl shadow-md transition-all">
              Next →
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-[#008F83] hover:bg-[#009E8E] disabled:bg-teal-400 text-white font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all">
              {saving && <Loader2 className="w-5 h-5 animate-spin" />}
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Register Family →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}