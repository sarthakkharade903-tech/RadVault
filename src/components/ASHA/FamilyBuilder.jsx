import React, { useState } from "react";
import { ChevronLeft, Loader2, AlertCircle, Home, LogIn } from "lucide-react";
import { addFamily, updateFamily } from "../../services/ashaService";
import { Label, TextInput, Chip, Toggle } from "./FormHelpers";

const BLOCKS = ["A", "B"];
const BLOCK_LABELS = { A: "Household Identity", B: "Socio-Economic & WASH" };

export default function FamilyBuilder({ onBack, onSaved }) {
  const [blockIdx, setBlockIdx] = useState(0);
  const block = BLOCKS[blockIdx];
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [f, setF] = useState({
    family_name: "",
    head_of_family: "",
    village: "Vadgaon",
    address: "",
    family_email: "",
    family_temp_password: "",
    housing_type: "",
    water_source: "",
    sanitation: "",
    cooking_fuel: "",
    ration_card: "",
    electricity: false,
  });

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!f.family_name.trim() || !f.head_of_family.trim()) {
      setError("Family name and Head of Family are required.");
      return;
    }
    setSaving(true); setError("");
    const payload = {
      ...f,
      family_email: f.family_email ? f.family_email.trim().toLowerCase() : null,
      family_temp_password: f.family_temp_password || null,
      asha_name: "Priya Deshmukh"
    };
    
    const { error: saveErr } = await addFamily(payload);
    setSaving(false);
    if (saveErr) {
      setError(saveErr.message || "Failed to save family folder.");
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
            <h1 className="text-lg font-black text-gray-900">New Family Folder</h1>
            <p className="text-xs font-bold text-teal-600">Step {blockIdx+1}: {BLOCK_LABELS[block]}</p>
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
            <div className="flex items-center gap-2 mb-6 text-gray-900">
              <Home className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl font-bold">Household Identity</h2>
            </div>
            
            <Label required>Family Name / Surname</Label>
            <TextInput placeholder="e.g. Patil Family" value={f.family_name} onChange={e => set("family_name", e.target.value)} className="mb-5" />
            
            <Label required>Name of Head of Family</Label>
            <TextInput placeholder="e.g. Ramu Bhaurao Patil" value={f.head_of_family} onChange={e => set("head_of_family", e.target.value)} className="mb-5" />
            
            <Label>Village</Label>
            <TextInput value={f.village} onChange={e => set("village", e.target.value)} className="mb-5" />
            
            <Label>Address / Landmark</Label>
            <TextInput placeholder="House number or landmark" value={f.address} onChange={e => set("address", e.target.value)} className="mb-8" />

            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><LogIn className="w-24 h-24" /></div>
              <h3 className="text-base font-black text-teal-900 mb-1">Family Portal Access</h3>
              <p className="text-sm text-teal-700 mb-5 relative z-10">One shared login for the entire household to view health records.</p>
              
              <Label>Family Email Address</Label>
              <TextInput type="email" placeholder="family@gmail.com" value={f.family_email} onChange={e => set("family_email", e.target.value)} className="mb-4 relative z-10" />
              
              {f.family_email && (
                <>
                  <Label>Create Password</Label>
                  <TextInput type="text" placeholder="Min 6 characters" value={f.family_temp_password} onChange={e => set("family_temp_password", e.target.value)} className="mb-2 relative z-10" />
                </>
              )}
            </div>
          </div>
        )}

        {block === "B" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex items-center gap-2 mb-6 text-gray-900">
              <h2 className="text-xl font-bold">Socio-Economic & WASH Survey</h2>
            </div>
            
            <Label>Housing Type</Label>
            <div className="flex flex-wrap gap-2 mb-6">
              {["Pucca (Solid)", "Semi-Pucca", "Kutcha (Mud/Thatch)"].map(opt => (
                <Chip key={opt} active={f.housing_type===opt} onClick={() => set("housing_type",opt)} color={opt.includes("Kutcha")?"amber":"teal"}>{opt}</Chip>
              ))}
            </div>

            <Label>Primary Drinking Water Source</Label>
            <div className="flex flex-wrap gap-2 mb-6">
              {["Piped / Tap Water", "Handpump / Tube well", "Open Well / River"].map(opt => (
                <Chip key={opt} active={f.water_source===opt} onClick={() => set("water_source",opt)} color={opt.includes("Open")?"red":"teal"}>{opt}</Chip>
              ))}
            </div>

            <Label>Toilet & Sanitation Facility</Label>
            <div className="flex flex-wrap gap-2 mb-6">
              {["In-house Toilet", "Community Toilet", "Open Defecation"].map(opt => (
                <Chip key={opt} active={f.sanitation===opt} onClick={() => set("sanitation",opt)} color={opt==="Open Defecation"?"red":"teal"}>{opt}</Chip>
              ))}
            </div>

            <Label>Primary Cooking Fuel (Assesses Air Pollution Risk)</Label>
            <div className="flex flex-wrap gap-2 mb-6">
              {["LPG / Biogas", "Firewood / Chulha", "Kerosene"].map(opt => (
                <Chip key={opt} active={f.cooking_fuel===opt} onClick={() => set("cooking_fuel",opt)} color={opt==="LPG / Biogas"?"teal":"amber"}>{opt}</Chip>
              ))}
            </div>

            <Label>Ration Card Status</Label>
            <div className="flex flex-wrap gap-2 mb-6">
              {["APL (White)", "BPL (Yellow)", "Antyodaya (Saffron)", "None"].map(opt => (
                <Chip key={opt} active={f.ration_card===opt} onClick={() => set("ration_card",opt)}>{opt}</Chip>
              ))}
            </div>

            <Toggle checked={f.electricity} onChange={v => set("electricity",v)} label="Electricity connection available in house" />
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 z-20">
        <div className="flex gap-3 max-w-lg mx-auto">
          {blockIdx > 0 && (
            <button onClick={() => setBlockIdx(0)} className="w-1/3 bg-gray-100 border border-gray-300 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-colors shadow-sm">
              Back
            </button>
          )}
          <button onClick={() => blockIdx === 1 ? handleSave() : setBlockIdx(1)} disabled={saving}
            className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-bold text-base py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all">
            {saving && <Loader2 className="w-5 h-5 animate-spin" />}
            {blockIdx === 1 ? (saving ? "Saving Folder..." : "Create Family Folder") : "Next: Survey Survey →"}
          </button>
        </div>
      </div>
    </div>
  );
}