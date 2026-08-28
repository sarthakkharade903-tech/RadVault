import React, { useState, useEffect } from "react";
import { ChevronLeft, Check, Loader2, AlertCircle } from "lucide-react";
import { addPatient, updatePatient, generateMockABHA } from "../../services/ashaService";

// ─── Shared primitives ────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const BLOOD_GROUPS = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];
const RELATIONS = ["Head of Family","Wife","Husband","Son","Daughter","Father","Mother","Brother","Sister","Grandfather","Grandmother","Other"];
const CHRONIC_LIST = ["Diabetes","Hypertension","Heart Disease","Asthma","Epilepsy","CKD","COPD","TB"];

const TI = (props) => (
  <input {...props} className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#16324F] placeholder-gray-400 focus:outline-none focus:border-[#008F83] focus:ring-1 focus:ring-[#008F83] bg-white" />
);
const L = ({ children, sub, req }) => (
  <div className="mb-1.5">
    <label className="block text-sm font-semibold text-gray-700">{children}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
    {sub && <p className="text-xs text-[#94A3B8] mt-0.5">{sub}</p>}
  </div>
);
const Chip = ({ active, onClick, color = "teal", children }) => {
  const ac = color === "red" ? "bg-red-100 border-red-400 text-red-800" : color === "amber" ? "bg-amber-100 border-amber-400 text-amber-800" : "bg-teal-100 border-[#008F83] text-teal-800";
  return (
    <button type="button" onClick={onClick} className={"px-4.5 py-3.5 rounded-xl border-2 text-sm font-semibold transition-all " + (active ? ac : "bg-white border-[#E2E8F0] text-gray-600 hover:border-gray-400")}>{children}</button>
  );
};
const Tog = ({ checked, onChange, label, sub, color = "teal" }) => {
  const ac = color === "red" ? "bg-red-50 border-red-400" : "bg-[#E8F7F3] border-teal-400";
  const tc = color === "red" ? "bg-red-600 border-red-600" : "bg-[#008F83] border-teal-600";
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={"w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all mb-2.5 " + (checked ? ac : "bg-white border-[#E2E8F0] hover:border-[#E2E8F0]")}>
      <div className="text-left">
        <p className={"text-sm font-semibold " + (checked ? (color === "red" ? "text-red-800" : "text-teal-800") : "text-gray-700")}>{label}</p>
        {sub && <p className="text-xs text-[#94A3B8] mt-0.5">{sub}</p>}
      </div>
      <div className={"w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 " + (checked ? tc : "border-[#E2E8F0]")}>
        {checked && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
    </button>
  );
};

function DateDropdowns({ value, onChange, maxYear = 2026, minYear = 1920 }) {
  const parts = value ? value.split("-") : [];
  const [y, setY] = useState(parts[0] || "");
  const [m, setM] = useState(parts[1] ? parseInt(parts[1]) : "");
  const [d, setD] = useState(parts[2] ? parseInt(parts[2]) : "");
  const emit = (ny, nm, nd) => { if (ny && nm && nd) onChange(ny + "-" + String(nm).padStart(2,"0") + "-" + String(nd).padStart(2,"0")); else onChange(""); };
  const days = (m && y) ? new Date(y, m, 0).getDate() : 31;
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  const cls = "flex-1 border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#16324F] focus:outline-none focus:border-[#008F83] bg-white appearance-none cursor-pointer";
  return (
    <div className="flex gap-2 mb-4">
      <select value={d} onChange={e => { setD(e.target.value); emit(y, m, e.target.value); }} className={cls}>
        <option value="">Day</option>
        {Array.from({ length: days }, (_, i) => i+1).map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <select value={m} onChange={e => { setM(e.target.value); emit(y, e.target.value, d); }} className={cls}>
        <option value="">Month</option>
        {MONTHS.map((mn, i) => <option key={i} value={i+1}>{mn}</option>)}
      </select>
      <select value={y} onChange={e => { setY(e.target.value); emit(e.target.value, m, d); }} className={cls + " flex-[1.6]"}>
        <option value="">Year</option>
        {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
      </select>
    </div>
  );
}

const BLOCK_LABELS = { A: "Identity", B: "Health Status", C: "Maternal Care", D: "Child Care", E: "Clinical" };

export default function PatientProfileBuilder({ patient: existing, family, onBack, onSaved }) {
  const isEdit = !!existing;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [f, setF] = useState({
    relation_to_head:       existing?.relation_to_head       || "",
    name:                   existing?.name                   || "",
    dob:                    existing?.dob                    || "",
    age_years:              existing?.age_years              || "",
    gender:                 existing?.gender                 || "",
    mobile:                 existing?.mobile                 || "",
    blood_group:            existing?.blood_group            || "",
    disability:             existing?.disability             || "",
    abha_id:                existing?.abha_id                || "",
    emergency_contact_name: existing?.emergency_contact_name || "",
    emergency_contact_phone:existing?.emergency_contact_phone|| "",
    asha_worker_name:       existing?.asha_worker_name       || "Priya Deshmukh",
    is_pregnant:            existing?.is_pregnant            || false,
    is_child:               existing?.is_child               || false,
    has_chronic:            existing?.has_chronic            || false,
    tobacco_user:           existing?.tobacco_user           || false,
    alcohol_user:           existing?.alcohol_user           || false,
    tb_symptoms:            existing?.tb_symptoms            || false,
    lmp_date:               existing?.lmp_date               || "",
    anc_visits_done:        existing?.anc_visits_done        || 0,
    ifa_given:              existing?.ifa_given              || false,
    tt_dose1:               existing?.tt_dose1              || false,
    tt_dose2:               existing?.tt_dose2              || false,
    high_risk_pregnancy:    existing?.high_risk_pregnancy    || false,
    delivery_count:         existing?.delivery_count         || 0,
    institutional_delivery: existing?.institutional_delivery || false,
    vaccine_bcg:            existing?.vaccine_bcg            || false,
    vaccine_opv:            existing?.vaccine_opv            || false,
    vaccine_dpt:            existing?.vaccine_dpt            || false,
    vaccine_hep_b:          existing?.vaccine_hep_b          || false,
    vaccine_measles:        existing?.vaccine_measles        || false,
    vaccine_mr:             existing?.vaccine_mr             || false,
    muac_zone:              existing?.muac_zone              || null,
    weight_kg:              existing?.weight_kg              || "",
    height_cm:              existing?.height_cm              || "",
    vitamin_a_given:        existing?.vitamin_a_given        || false,
    developmental_concerns: existing?.developmental_concerns || false,
    chronic_conditions:     existing?.chronic_conditions     || [],
    current_medications:    existing?.current_medications    || "",
    allergies:              existing?.allergies              || "",
    bp_systolic:            existing?.bp_systolic            || "",
    bp_diastolic:           existing?.bp_diastolic           || "",
    blood_glucose:          existing?.blood_glucose          || "",
    status:                 existing?.status                 || "green",
    asha_name:              "Priya Deshmukh",
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const toggle = (arr, val) => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  // Auto-generate ABHA ID for new patients on mount
  useEffect(() => {
    if (!isEdit && !f.abha_id) {
      set('abha_id', generateMockABHA());
    }
  }, []);

  const showClinical = f.has_chronic || f.tobacco_user || f.alcohol_user || f.tb_symptoms || parseInt(f.age_years) >= 40;

  const BLOCKS = ["A", "B", ...(f.is_pregnant ? ["C"] : []), ...(f.is_child ? ["D"] : []), ...(showClinical ? ["E"] : [])];
  const [blockIdx, setBlockIdx] = useState(0);
  const block = BLOCKS[blockIdx];
  const isLast = blockIdx === BLOCKS.length - 1;

  const calcEDD = (lmp) => { if (!lmp) return ""; const d = new Date(lmp); d.setDate(d.getDate()+280); return d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}); };
  const calcWeeks = (lmp) => { if (!lmp) return 0; return Math.floor((new Date()-new Date(lmp))/(7*24*60*60*1000)); };

  const handleSave = async () => {
    if (!f.name.trim()) { setError("Full name is required."); return; }
    if (!f.gender) { setError("Please select gender."); return; }
    if (!f.relation_to_head) { setError("Please select relation to head of family."); return; }
    setSaving(true); setError("");
    const payload = {
      ...f,
      family_id: family?.id || existing?.family_id || null,
      village: family?.village || existing?.village || "Vadgaon",
      dob: f.dob || null,
      lmp_date: f.lmp_date || null,
      muac_zone: f.muac_zone || null,
      age_years: f.age_years ? parseInt(f.age_years) : null,
      weight_kg: f.weight_kg ? parseFloat(f.weight_kg) : null,
      height_cm: f.height_cm ? parseFloat(f.height_cm) : null,
      anc_visits_done: parseInt(f.anc_visits_done) || 0,
      delivery_count: parseInt(f.delivery_count) || 0,
      bp_systolic: f.bp_systolic ? parseInt(f.bp_systolic) : null,
      bp_diastolic: f.bp_diastolic ? parseInt(f.bp_diastolic) : null,
      blood_glucose: f.blood_glucose ? parseFloat(f.blood_glucose) : null,
      edd: f.lmp_date ? (() => { const d = new Date(f.lmp_date); d.setDate(d.getDate()+280); return d.toISOString().split("T")[0]; })() : null,
      last_visit_date: new Date().toISOString().split("T")[0],
    };
    const { data, error: saveErr } = isEdit ? await updatePatient(existing.id, payload) : await addPatient(payload);
    setSaving(false);
    if (saveErr) { setError(saveErr.message || "Save failed."); console.error(saveErr); return; }
    setDone(true);
  };

  const handleNext = () => { if (isLast) handleSave(); else setBlockIdx(i => i + 1); };

  // ─── Done Screen ─────────────────────────────────────────────────────────
  if (done) {
    const famDisplayName = family ? (family.family_name + (family.family_pin ? " #" + family.family_pin : "")) : "";
    return (
      <div className="min-h-screen bg-[#F5FBF9] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-teal-100 border-2 border-teal-400 flex items-center justify-center text-4xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-[#16324F] mb-1">{f.name} registered!</h2>
        {famDisplayName && <p className="text-sm text-[#64748B] mb-6">Added to {famDisplayName}</p>}
        <div className="flex gap-3 w-full max-w-sm">
          <button onClick={() => { setDone(false); setBlockIdx(0); setF(p => ({ ...p, name:"", dob:"", age_years:"", gender:"", mobile:"", relation_to_head:"", is_pregnant:false, is_child:false, has_chronic:false, tobacco_user:false, alcohol_user:false, tb_symptoms:false, status:"green" })); }}
            className="flex-1 border-2 border-teal-600 text-[#009E8E] font-bold py-3.5 rounded-xl hover:bg-[#E8F7F3] transition-colors text-sm">
            + Add Another Member
          </button>
          <button onClick={onSaved} className="flex-1 bg-[#008F83] hover:bg-[#009E8E] text-white font-bold py-3.5 rounded-xl shadow-md text-sm">
            Done
          </button>
        </div>
      </div>
    );
  }

  const famDisplay = family ? (family.family_name + (family.family_pin ? " #" + family.family_pin : "")) : "";

  return (
    <div className="min-h-screen bg-[#F5FBF9] pb-32">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-base font-bold text-[#16324F]">{isEdit ? "Edit — " + existing.name : "Add Member"}</h1>
            <p className="text-xs text-[#008F83] font-semibold">
              {famDisplay && <span className="text-[#64748B]">to {famDisplay} · </span>}
              Step {blockIdx+1}/{BLOCKS.length}: {BLOCK_LABELS[block]}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {BLOCKS.map((b, i) => (
            <button key={b} onClick={() => setBlockIdx(i)}
              className={"h-1.5 flex-1 rounded-full transition-all " + (i < blockIdx ? "bg-[#E8F7F3]0" : i === blockIdx ? "bg-teal-400" : "bg-gray-200")} />
          ))}
        </div>
      </div>

      <div className="px-4 pt-5 max-w-lg mx-auto">
        {error && (
          <div className="flex gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-red-800">{error}</p>
          </div>
        )}

        {/* ── BLOCK A: Identity ── */}
        {block === "A" && (
          <div>
            <h2 className="text-lg font-bold text-[#16324F] mb-1">Member Identity</h2>
            <p className="text-sm text-[#64748B] mb-5">Personal details and family relation</p>

            <L req>Relation to Head of Family</L>
            <p className="text-xs text-[#94A3B8] mb-3">Select how this person relates to {family?.head_of_family || "the head"}</p>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {RELATIONS.map(r => (
                <button key={r} type="button" onClick={() => set("relation_to_head", r)}
                  className={"py-3.5 px-2 rounded-xl border-2 text-xs font-bold text-center transition-all " + (f.relation_to_head === r ? "bg-[#008F83] border-teal-600 text-white" : "bg-white border-[#E2E8F0] text-gray-600 hover:border-[#E2E8F0]")}>
                  {r}
                </button>
              ))}
            </div>

            <L req>Full Name</L>
            <TI value={f.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Sunita Bai Patil" className="mb-4" />

            <L sub="Day / Month / Year dropdowns — much faster than a calendar">Date of Birth</L>
            <DateDropdowns value={f.dob} maxYear={2026} minYear={1920}
              onChange={(iso) => { set("dob", iso); if (iso) { const age = Math.floor((new Date() - new Date(iso)) / (365.25*24*60*60*1000)); if (age > 0 && age < 120) set("age_years", age); } }} />

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <L>Age (Years)</L>
                <TI type="number" placeholder="28" value={f.age_years} onChange={e => set("age_years", e.target.value)} />
              </div>
              <div>
                <L>Blood Group</L>
                <select value={f.blood_group} onChange={e => set("blood_group", e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#16324F] focus:outline-none focus:border-[#008F83] bg-white appearance-none">
                  <option value="">Unknown</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg}>{bg}</option>)}
                </select>
              </div>
            </div>

            <L req>Gender</L>
            <div className="flex gap-2 mb-4">
              {["Female","Male","Other"].map(g => <Chip key={g} active={f.gender === g} onClick={() => set("gender", g)}>{g}</Chip>)}
            </div>

            <L>Mobile Number</L>
            <TI type="tel" placeholder="10-digit number" value={f.mobile} onChange={e => set("mobile", e.target.value)} className="mb-4" />

            <L sub="Physical or mental disability (leave blank if none)">Disability</L>
            <TI placeholder="e.g. Visually impaired, Hearing loss" value={f.disability} onChange={e => set("disability", e.target.value)} />

            {/* ABHA ID (auto-generated, read-only for ASHA) */}
            <div className="mt-4 mb-1">
              <L sub="Auto-generated Ayushman Bharat Health Account ID">ABHA Health ID</L>
              <div className="w-full border-2 border-[#008F83]/30 rounded-xl px-4 py-3 bg-[#F5FBF9] flex items-center justify-between">
                <span className="text-sm font-black text-[#008F83] tracking-widest font-mono">{f.abha_id || "Generating…"}</span>
                <span className="text-[9px] font-bold text-[#008F83] bg-white border border-[#008F83]/20 px-2 py-0.5 rounded-full uppercase tracking-wide">Auto-assigned</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <L>Emergency Contact Name</L>
                <TI placeholder="e.g. Rahul Patil" value={f.emergency_contact_name} onChange={e => set("emergency_contact_name", e.target.value)} />
              </div>
              <div>
                <L>Emergency Contact Phone</L>
                <TI type="tel" placeholder="10-digit number" value={f.emergency_contact_phone} onChange={e => set("emergency_contact_phone", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* ── BLOCK B: Health Flags ── */}
        {block === "B" && (
          <div>
            <h2 className="text-lg font-bold text-[#16324F] mb-1">Health Status</h2>
            <p className="text-sm text-[#64748B] mb-5">Check all that apply. These unlock the correct tracking sections.</p>

            <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Care Categories</h3>
            <Tog checked={f.is_pregnant} onChange={v => set("is_pregnant", v)} label="Currently Pregnant" sub="Unlocks ANC / maternal tracking" />
            <Tog checked={f.is_child}    onChange={v => set("is_child", v)}    label="Child under 5 years" sub="Unlocks immunization and nutrition tracking" />
            <Tog checked={f.has_chronic} onChange={v => set("has_chronic", v)} label="Known Chronic Disease / NCD" sub="Unlocks NCD screening section" color="amber" />

            <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mt-5 mb-3">Risk Flags (CBAC)</h3>
            <Tog checked={f.tobacco_user} onChange={v => set("tobacco_user", v)} label="Uses Tobacco / Gutkha / Bidi" color="red" />
            <Tog checked={f.alcohol_user} onChange={v => set("alcohol_user", v)} label="Daily Alcohol Use" color="red" />
            <Tog checked={f.tb_symptoms}  onChange={v => set("tb_symptoms", v)}  label="Cough for more than 2 weeks" sub="Possible TB — flag for follow-up" color="red" />

            <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mt-5 mb-3">Triage Status</h3>
            <div className="space-y-2">
              {[{v:"green",l:"🟢 Healthy — Routine monitoring"},{v:"yellow",l:"🟡 Moderate — Follow up next month"},{v:"red",l:"🔴 High Risk — Immediate attention"}].map(({v,l}) => (
                <button key={v} type="button" onClick={() => set("status", v)}
                  className={"w-full p-4 rounded-xl border-2 text-sm font-bold text-left transition-all " + (f.status === v ? (v === "red" ? "bg-red-50 border-red-500 text-red-800" : v === "yellow" ? "bg-amber-50 border-amber-500 text-amber-800" : "bg-green-50 border-green-500 text-green-800") : "bg-white border-[#E2E8F0] text-gray-600")}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── BLOCK C: Maternal / ANC ── */}
        {block === "C" && (
          <div>
            <h2 className="text-lg font-bold text-[#16324F] mb-1">Maternal Care</h2>
            <p className="text-sm text-[#64748B] mb-5">Antenatal care tracking</p>

            <L>Last Menstrual Period (LMP)</L>
            <DateDropdowns value={f.lmp_date} maxYear={2026} minYear={2020} onChange={iso => set("lmp_date", iso)} />
            {f.lmp_date && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-bold text-rose-800">EDD: {calcEDD(f.lmp_date)}</p>
                <p className="text-sm text-rose-600">{calcWeeks(f.lmp_date)} weeks pregnant</p>
              </div>
            )}

            <L>ANC Visits Completed</L>
            <div className="flex gap-3 mb-5">
              {[0,1,2,3,4].map(n => (
                <button key={n} type="button" onClick={() => set("anc_visits_done", n)}
                  className={"w-12 h-12 rounded-full border-2 text-base font-bold transition-all " + (f.anc_visits_done === n ? "bg-[#008F83] border-teal-600 text-white shadow-md" : "bg-white border-[#E2E8F0] text-gray-600")}>
                  {n}
                </button>
              ))}
            </div>

            <L>Previous Deliveries</L>
            <div className="flex gap-3 mb-5">
              {[0,1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => set("delivery_count", n)}
                  className={"w-10 h-10 rounded-full border-2 text-sm font-bold transition-all " + (f.delivery_count === n ? "bg-gray-700 border-gray-700 text-white" : "bg-white border-[#E2E8F0] text-gray-600")}>
                  {n}
                </button>
              ))}
            </div>

            <L>Services Given</L>
            <Tog checked={f.ifa_given}              onChange={v => set("ifa_given", v)}              label="IFA Tablets Given" />
            <Tog checked={f.tt_dose1}               onChange={v => set("tt_dose1", v)}               label="Td/TT — Dose 1" />
            <Tog checked={f.tt_dose2}               onChange={v => set("tt_dose2", v)}               label="Td/TT — Dose 2" />
            <Tog checked={f.institutional_delivery} onChange={v => set("institutional_delivery", v)} label="Institutional Delivery Registered" />
            <Tog checked={f.high_risk_pregnancy}    onChange={v => set("high_risk_pregnancy", v)}    label="High-Risk Pregnancy" sub="Age <18 / >35, BP, previous C-section, twins etc." color="red" />
          </div>
        )}

        {/* ── BLOCK D: Child Care ── */}
        {block === "D" && (
          <div>
            <h2 className="text-lg font-bold text-[#16324F] mb-1">Child Health</h2>
            <p className="text-sm text-[#64748B] mb-5">Immunization, nutrition and growth</p>

            <L>Immunization Card</L>
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {[["vaccine_bcg","BCG"],["vaccine_opv","OPV (Polio)"],["vaccine_dpt","DPT"],["vaccine_hep_b","Hep B"],["vaccine_measles","Measles"],["vaccine_mr","MR"]].map(([key,label]) => (
                <button key={key} type="button" onClick={() => set(key, !f[key])}
                  className={"flex items-center justify-between p-4 rounded-xl border-2 transition-all " + (f[key] ? "bg-[#E8F7F3] border-[#008F83]" : "bg-white border-[#E2E8F0]")}>
                  <span className={"text-sm font-bold " + (f[key] ? "text-teal-800" : "text-gray-600")}>{label}</span>
                  <div className={"w-5 h-5 rounded-full border-2 flex items-center justify-center " + (f[key] ? "bg-[#008F83] border-teal-600" : "border-[#E2E8F0]")}>
                    {f[key] && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>

            <L sub="Tape colour — malnutrition screening">MUAC Reading</L>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[{v:"red",l:"Red < 11.5cm",c:"bg-red-50 border-red-400 text-red-800"},{v:"yellow",l:"Yellow 11.5–12.4",c:"bg-amber-50 border-amber-400 text-amber-800"},{v:"green",l:"Green ≥ 12.5cm",c:"bg-green-50 border-green-400 text-green-800"}].map(({v,l,c}) => (
                <button key={v} type="button" onClick={() => set("muac_zone", f.muac_zone === v ? null : v)}
                  className={"p-3 rounded-xl border-2 text-xs font-bold text-center transition-all " + (f.muac_zone === v ? c : "bg-white border-[#E2E8F0] text-gray-600")}>
                  {l}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div><L>Weight (kg)</L><TI type="number" placeholder="e.g. 7.5" value={f.weight_kg} onChange={e => set("weight_kg", e.target.value)} /></div>
              <div><L>Height / Length (cm)</L><TI type="number" placeholder="e.g. 70" value={f.height_cm} onChange={e => set("height_cm", e.target.value)} /></div>
            </div>

            <Tog checked={f.vitamin_a_given}        onChange={v => set("vitamin_a_given", v)}        label="Vitamin A Given" />
            <Tog checked={f.developmental_concerns} onChange={v => set("developmental_concerns", v)} label="Developmental Concerns" sub="Delayed milestones, speech, motor skills" color="amber" />
          </div>
        )}

        {/* ── BLOCK E: Clinical / NCD ── */}
        {block === "E" && (
          <div>
            <h2 className="text-lg font-bold text-[#16324F] mb-1">Clinical Screening</h2>
            <p className="text-sm text-[#64748B] mb-5">NCD risk assessment and vitals</p>

            {f.has_chronic && (
              <>
                <L>Known Chronic Conditions</L>
                <div className="flex flex-wrap gap-2 mb-5">
                  {CHRONIC_LIST.map(c => (
                    <Chip key={c} active={f.chronic_conditions.includes(c)} onClick={() => set("chronic_conditions", toggle(f.chronic_conditions, c))} color="amber">{c}</Chip>
                  ))}
                </div>
                <L sub="List of medicines regularly taken">Current Medications</L>
                <TI placeholder="e.g. Metformin 500mg, Amlodipine 5mg" value={f.current_medications} onChange={e => set("current_medications", e.target.value)} className="mb-4" />
                <L>Known Allergies</L>
                <TI placeholder="e.g. Penicillin, Dust" value={f.allergies} onChange={e => set("allergies", e.target.value)} className="mb-4" />
              </>
            )}

            <L sub="Systolic / Diastolic in mmHg">Blood Pressure</L>
            <div className="flex gap-2 items-center mb-4">
              <TI type="number" placeholder="Sys (e.g. 120)" value={f.bp_systolic} onChange={e => set("bp_systolic", e.target.value)} />
              <span className="text-[#94A3B8] font-bold text-lg">/</span>
              <TI type="number" placeholder="Dia (e.g. 80)" value={f.bp_diastolic} onChange={e => set("bp_diastolic", e.target.value)} />
            </div>

            <L sub="mg/dL — Random or Fasting">Blood Glucose</L>
            <TI type="number" placeholder="e.g. 110" value={f.blood_glucose} onChange={e => set("blood_glucose", e.target.value)} />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] px-4 py-4 z-20">
        <div className="flex gap-3 max-w-lg mx-auto">
          {blockIdx > 0 && (
            <button onClick={() => setBlockIdx(i => i - 1)} className="w-1/3 bg-gray-100 border border-[#E2E8F0] text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors">
              Back
            </button>
          )}
          <button onClick={handleNext} disabled={saving}
            className="flex-1 bg-[#008F83] hover:bg-[#009E8E] disabled:bg-teal-400 text-white font-bold text-[15px] py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all">
            {saving && <Loader2 className="w-5 h-5 animate-spin" />}
            {isLast ? (saving ? "Saving..." : isEdit ? "Save Profile" : "Register Member ✓") : "Next Step →"}
          </button>
        </div>
      </div>
    </div>
  );
}