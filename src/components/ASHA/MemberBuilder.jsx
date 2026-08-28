import React, { useState } from "react";
import { ChevronLeft, Loader2, AlertCircle, UserPlus } from "lucide-react";
import { addPatient, updatePatient } from "../../services/ashaService";
import { Label, TextInput, DatePicker, Chip, Toggle, buildDate } from "./FormHelpers";

const RELATIONSHIPS = ["Self", "Spouse", "Son", "Daughter", "Mother", "Father", "Brother", "Sister", "Daughter-in-law", "Son-in-law", "Grandchild", "Other"];
const MARITAL_STATUS = ["Unmarried", "Married", "Widowed", "Separated"];
const CHRONIC_LIST = ["Diabetes", "Hypertension", "Heart Disease", "Asthma", "Epilepsy", "Cancer"];
const BLOOD_GROUPS = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];

function calcEDD(lmp) {
  if (!lmp) return "";
  const d = new Date(lmp); d.setDate(d.getDate() + 280);
  return d.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}

export default function MemberBuilder({ family, member: existing, onBack, onSaved }) {
  const isEdit = !!existing;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [f, setF] = useState({
    name: existing?.name || "",
    relationship_to_head: existing?.relationship_to_head || "",
    dob: existing?.dob || "",
    age_years: existing?.age_years || "",
    gender: existing?.gender || "",
    marital_status: existing?.marital_status || "",
    mobile: existing?.mobile || "",
    blood_group: existing?.blood_group || "",
    
    // Health flags
    is_pregnant: existing?.is_pregnant || false,
    is_child: existing?.is_child || false,
    
    // CBAC
    tobacco_user: existing?.tobacco_user || false,
    alcohol_user: existing?.alcohol_user || false,
    tb_symptoms: existing?.tb_symptoms || false,
    has_chronic: existing?.has_chronic || false,
    chronic_conditions: existing?.chronic_conditions || [],
    status: existing?.status || "green",
    
    // Maternal
    lmp_date: existing?.lmp_date || "",
    anc_visits_done: existing?.anc_visits_done || 0,
    ifa_given: existing?.ifa_given || false,
    tt_dose1: existing?.tt_dose1 || false,
    tt_dose2: existing?.tt_dose2 || false,
    institutional_delivery: existing?.institutional_delivery || false,
    
    // Child
    vaccine_bcg: existing?.vaccine_bcg || false,
    vaccine_opv: existing?.vaccine_opv || false,
    vaccine_dpt: existing?.vaccine_dpt || false,
    vaccine_hep_b: existing?.vaccine_hep_b || false,
    vaccine_measles: existing?.vaccine_measles || false,
    vaccine_mr: existing?.vaccine_mr || false,
    muac_zone: existing?.muac_zone || null,
    weight_kg: existing?.weight_kg || "",
  });

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const toggleChip = (arr, val) => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  // Dynamic blocks
  const BLOCKS = ["A", "B"];
  if (f.gender === "Female" && (f.marital_status === "Married" || f.is_pregnant)) BLOCKS.push("C");
  if (f.age_years !== "" && parseInt(f.age_years) < 5) BLOCKS.push("D");
  
  const BLOCK_LABELS = { A: "Identity", B: "CBAC Screening", C: "Maternal Care", D: "Child Care" };
  const [blockIdx, setBlockIdx] = useState(0);
  const block = BLOCKS[blockIdx];
  const isLast = blockIdx === BLOCKS.length - 1;

  const handleSave = async () => {
    if (!f.name.trim()) { setError("Name is required."); return; }
    if (!f.gender) { setError("Gender is required."); return; }
    if (!f.relationship_to_head) { setError("Relationship to Head is required."); return; }
    
    setSaving(true); setError("");
    
    const payload = {
      ...f,
      family_id: family.id,
      village: family.village,
      asha_name: family.asha_name,
      dob: f.dob || null,
      lmp_date: f.lmp_date || null,
      muac_zone: f.muac_zone || null,
      age_years: f.age_years ? parseInt(f.age_years) : null,
      weight_kg: f.weight_kg ? parseFloat(f.weight_kg) : null,
      anc_visits_done: parseInt(f.anc_visits_done) || 0,
      edd: f.lmp_date ? (() => { const d = new Date(f.lmp_date); d.setDate(d.getDate()+280); return d.toISOString().split("T")[0]; })() : null,
      is_child: (f.age_years !== "" && parseInt(f.age_years) < 5)
    };

    const { error: saveErr } = isEdit ? await updatePatient(existing.id, payload) : await addPatient(payload);
    setSaving(false);
    
    if (saveErr) {
      setError(saveErr.message || "Failed to save member.");
      return;
    }
    onSaved();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="text-gray-500 bg-gray-100 hover:bg-gray-200 p-2 rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-black text-gray-900">{isEdit ? "Edit Member" : "Add Member"}</h1>
            <p className="text-xs font-bold text-teal-600">Family: {family.family_name} · Block {block}: {BLOCK_LABELS[block]}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {BLOCKS.map((b, i) => (
            <div key={b} className={"h-2 flex-1 rounded-full transition-all " + (i <= blockIdx ? "bg-teal-500" : "bg-gray-200")} />
          ))}
        </div>
      </div>

      <div className="px-4 pt-6 max-w-lg mx-auto">
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-bold text-red-800">{error}</p>
          </div>
        )}

        {block === "A" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Member Identity</h2>
            
            <Label required>Full Name</Label>
            <TextInput placeholder="e.g. Sujata Patil" value={f.name} onChange={e => set("name", e.target.value)} className="mb-5" />
            
            <Label required>Relationship to Head of Family ({family.head_of_family})</Label>
            <select value={f.relationship_to_head} onChange={e => set("relationship_to_head", e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-teal-500 bg-white mb-5 cursor-pointer">
              <option value="">Select relationship...</option>
              {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <DatePicker label="Date of Birth" value={f.dob} maxYear={2026} minYear={1924}
              onChange={(iso, age) => { set("dob", iso); if (age !== undefined) set("age_years", age); }} />

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <Label>Age (Years)</Label>
                <TextInput type="number" value={f.age_years} onChange={e => set("age_years", e.target.value)} className="mb-0" />
              </div>
              <div>
                <Label>Blood Group</Label>
                <select value={f.blood_group} onChange={e => set("blood_group", e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm text-gray-900 focus:outline-none focus:border-teal-500 bg-white cursor-pointer">
                  <option value="">Select...</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
            </div>

            <Label required>Gender</Label>
            <div className="flex gap-2 mb-5">
              {["Female","Male","Other"].map(g => <Chip key={g} active={f.gender===g} onClick={() => set("gender",g)}>{g}</Chip>)}
            </div>

            <Label>Marital Status</Label>
            <div className="flex flex-wrap gap-2 mb-5">
              {MARITAL_STATUS.map(ms => <Chip key={ms} active={f.marital_status===ms} onClick={() => set("marital_status",ms)}>{ms}</Chip>)}
            </div>

            <Label>Personal Mobile (Optional)</Label>
            <TextInput type="tel" placeholder="10-digit number" value={f.mobile} onChange={e => set("mobile", e.target.value)} />
          </div>
        )}

        {block === "B" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-1">CBAC Screening</h2>
            <p className="text-sm text-gray-500 mb-6">NCD screening checklist</p>

            <h3 className="text-sm font-bold text-gray-800 mb-3">Risk Behaviours & Symptoms</h3>
            <Toggle checked={f.tobacco_user} onChange={v => set("tobacco_user",v)} label="Consumes Tobacco / Gutkha" sublabel="Smoking or chewing" color="red" />
            <Toggle checked={f.alcohol_user} onChange={v => set("alcohol_user",v)} label="Consumes Alcohol" sublabel="Daily or frequent use" color="red" />
            <Toggle checked={f.tb_symptoms}  onChange={v => set("tb_symptoms",v)}  label="TB Suspect" sublabel="Cough > 14 days, blood in sputum, or weight loss" color="red" />

            <h3 className="text-sm font-bold text-gray-800 mt-6 mb-3">Chronic Diseases</h3>
            <Toggle checked={f.has_chronic} onChange={v => set("has_chronic",v)} label="Patient has known chronic diseases" color="amber" />
            {f.has_chronic && (
              <div className="flex flex-wrap gap-2 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                {CHRONIC_LIST.map(c => (
                  <Chip key={c} active={f.chronic_conditions.includes(c)} onClick={() => set("chronic_conditions", toggleChip(f.chronic_conditions,c))} color="amber">{c}</Chip>
                ))}
              </div>
            )}

            <h3 className="text-sm font-bold text-gray-800 mt-6 mb-3">Triage Priority</h3>
            <div className="space-y-2.5">
              {[{v:"green",l:"Healthy",s:"Routine monitoring"},{v:"yellow",l:"Moderate",s:"Needs follow up next month"},{v:"red",l:"High Risk",s:"Immediate medical attention needed"}].map(({v,l,s}) => (
                <button key={v} type="button" onClick={() => set("status",v)}
                  className={"w-full p-4 rounded-xl border-2 text-left transition-all " + (f.status===v ? (v==="red"?"bg-red-50 border-red-500 text-red-900 shadow-sm":v==="yellow"?"bg-amber-50 border-amber-500 text-amber-900 shadow-sm":"bg-green-50 border-green-500 text-green-900 shadow-sm") : "bg-white border-gray-200 text-gray-600")}>
                  <p className="font-bold text-[15px]">{v==="red"?"🔴 ":v==="yellow"?"🟡 ":"🟢 "}{l}</p>
                  <p className={"text-xs mt-1 " + (f.status===v ? "opacity-80" : "text-gray-400")}>{s}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {block === "C" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Maternal Care (RCH)</h2>
            <Toggle checked={f.is_pregnant} onChange={v => set("is_pregnant",v)} label="Currently Pregnant" color="teal" />
            
            {f.is_pregnant && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <DatePicker label="Last Menstrual Period (LMP)" value={f.lmp_date} maxYear={2026} minYear={2025}
                  onChange={(iso) => set("lmp_date", iso)} />
                {f.lmp_date && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 shadow-sm">
                    <p className="text-sm font-bold text-rose-800">Expected Delivery: {calcEDD(f.lmp_date)}</p>
                  </div>
                )}
                
                <Label>ANC Visits Completed</Label>
                <div className="flex gap-3 mb-6">
                  {[0,1,2,3,4].map(n => (
                    <button key={n} type="button" onClick={() => set("anc_visits_done",n)}
                      className={"w-12 h-12 rounded-full border-2 text-base font-bold transition-all " + (f.anc_visits_done===n ? "bg-teal-600 border-teal-600 text-white shadow-md" : "bg-white border-gray-300 text-gray-600")}>
                      {n}
                    </button>
                  ))}
                </div>
                
                <Label>Services Given</Label>
                <Toggle checked={f.ifa_given} onChange={v => set("ifa_given",v)} label="IFA Tablets Given" />
                <Toggle checked={f.tt_dose1} onChange={v => set("tt_dose1",v)} label="TT Vaccination — Dose 1" />
                <Toggle checked={f.tt_dose2} onChange={v => set("tt_dose2",v)} label="TT Vaccination — Dose 2" />
                <Toggle checked={f.institutional_delivery} onChange={v => set("institutional_delivery",v)} label="Institutional Delivery Planned" />
              </div>
            )}
          </div>
        )}

        {block === "D" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Child Health & Nutrition</h2>
            <p className="text-sm text-gray-500 mb-6">Under-5 screening</p>
            
            <Label>Immunization Record</Label>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[["vaccine_bcg","BCG"],["vaccine_opv","OPV"],["vaccine_dpt","DPT"],["vaccine_hep_b","Hep B"],["vaccine_measles","Measles"],["vaccine_mr","MR"]].map(([key,label]) => (
                <button key={key} type="button" onClick={() => set(key,!f[key])}
                  className={"flex items-center justify-between p-3.5 rounded-xl border-2 transition-all " + (f[key] ? "bg-teal-50 border-teal-500 shadow-sm" : "bg-white border-gray-200")}>
                  <span className={"text-sm font-bold " + (f[key] ? "text-teal-800" : "text-gray-600")}>{label}</span>
                  <div className={"w-5 h-5 rounded-full border-2 flex items-center justify-center " + (f[key] ? "bg-teal-600 border-teal-600" : "border-gray-300")}>
                    {f[key] && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>
            
            <Label>Nutritional Status (MUAC Tape)</Label>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[{v:"red",l:"Red Zone\n< 11.5cm",bg:"bg-red-50 border-red-400 text-red-800"},{v:"yellow",l:"Yellow Zone\n11.5–12.4cm",bg:"bg-amber-50 border-amber-400 text-amber-800"},{v:"green",l:"Green Zone\n> 12.5cm",bg:"bg-green-50 border-green-400 text-green-800"}].map(({v,l,bg}) => (
                <button key={v} type="button" onClick={() => set("muac_zone", f.muac_zone===v ? null : v)}
                  className={"p-3 rounded-xl border-2 text-center text-xs font-bold transition-all whitespace-pre-wrap leading-relaxed " + (f.muac_zone===v ? bg + " shadow-sm" : "bg-white border-gray-200 text-gray-600")}>
                  {l}
                </button>
              ))}
            </div>
            
            <Label>Weight (kg)</Label>
            <TextInput type="number" placeholder="e.g. 7.5" value={f.weight_kg} onChange={e => set("weight_kg", e.target.value)} />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 z-20">
        <div className="flex gap-3 max-w-lg mx-auto">
          {blockIdx > 0 && (
            <button onClick={() => setBlockIdx(i => i-1)} className="w-1/3 bg-gray-100 border border-gray-300 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors shadow-sm">
              Back
            </button>
          )}
          <button onClick={() => isLast ? handleSave() : setBlockIdx(i => i+1)} disabled={saving}
            className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-bold text-base py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all">
            {saving && <Loader2 className="w-5 h-5 animate-spin" />}
            {isLast ? (saving ? "Saving..." : (isEdit ? "Save Member" : "Add Member to Family")) : "Next Step →"}
          </button>
        </div>
      </div>
    </div>
  );
}