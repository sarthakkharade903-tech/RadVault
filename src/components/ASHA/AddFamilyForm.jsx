import React, { useState } from "react";
import {
  ChevronLeft, Loader2, AlertCircle, Check, Home, Droplet,
  Shield, Smartphone, ArrowRight, ArrowLeft, Save, Sparkles,
  Building2, Flame, Zap, User, MapPin
} from "lucide-react";
import { addFamily, updateFamily } from "../../services/ashaService";

// ─── Single Language Dictionaries (No Mixed Text) ─────────
const FORM_TRANSLATIONS = {
  en: {
    registerTitle: "Register Family",
    editTitle: "Edit Family",
    subtitle: "Household health registration",
    step1: "Household Info",
    step1Desc: "Basic family & head details",
    step2: "WASH & Amenities",
    step2Desc: "Water, sanitation & housing",
    step3: "Vulnerability",
    step3Desc: "Elderly, disability & risk",
    step4: "Digital Access",
    step4Desc: "Family portal smartphone login",
    familyName: "Family Name / Surname",
    familyNamePlaceholder: "e.g. Patil Family",
    headOfFamily: "Head of Household",
    headPlaceholder: "e.g. Ramu Bhaurao Patil",
    village: "Village / Ward",
    villagePlaceholder: "e.g. Vadgaon",
    address: "House Address / Landmark",
    addressPlaceholder: "e.g. House No. 14, Near Hanuman Temple",
    notes: "Field Notes (Optional)",
    notesPlaceholder: "Any additional notes for this household...",
    waterSource: "Drinking Water Source",
    sanitation: "Sanitation & Toilet Facility",
    cookingFuel: "Cooking Fuel Used",
    electricity: "Electricity Available",
    housingType: "Housing Type",
    hasElderly: "Household has elderly member (60+ years)",
    hasDisabled: "Household has person with disability",
    highRisk: "Mark as High-Risk Household",
    migration: "Migration Status",
    portalTitle: "Family Digital Health App Access",
    portalDesc: "Enables family to view medical records and prescriptions on their smartphone. Leave empty if family has no smartphone.",
    familyEmail: "Family Login Email",
    familyPassword: "Set Portal Password",
    nextStep: "Next Step",
    prevStep: "Previous Step",
    saveFamily: "Save Family Record",
    saving: "Saving...",
    yes: "Yes",
    no: "No",
    requiredErr: "Please fill in Family Name and Village.",
    pwdErr: "Please set a password if family email is provided."
  },
  mr: {
    registerTitle: "कुटुंब नोंदणी",
    editTitle: "कुटुंब माहिती बदला",
    subtitle: "कुटुंब आरोग्य नोंदणी",
    step1: "कुटुंब माहिती",
    step1Desc: "कुटुंब व कुटुंबप्रमुख तपशील",
    step2: "सुविधा व पाणी",
    step2Desc: "पाणी, शौचालय व घर",
    step3: "आरोग्य जोखीम",
    step3Desc: "ज्येष्ठ नागरिक व दिव्यांग",
    step4: "डिजिटल ॲप",
    step4Desc: "मोबाईल आरोग्य पोर्टल",
    familyName: "कुटुंबाचे आडनाव / नाव",
    familyNamePlaceholder: "उदा. पाटील कुटुंब",
    headOfFamily: "कुटुंबप्रमुखाचे नाव",
    headPlaceholder: "उदा. रामू भाऊराव पाटील",
    village: "गाव / प्रभाग",
    villagePlaceholder: "उदा. वडगाव",
    address: "घराचा पत्ता / खूण",
    addressPlaceholder: "उदा. घर क्र. १४, मारुती मंदिराजवळ",
    notes: "टीप (ऐच्छिक)",
    notesPlaceholder: "या कुटुंबाबद्दल अधिक माहिती...",
    waterSource: "पिण्याच्या पाण्याचा स्त्रोत",
    sanitation: "शौचालय सुविधा",
    cookingFuel: "इंधनाचा प्रकार",
    electricity: "विद्युत पुरवठा उपलब्ध",
    housingType: "घराचा प्रकार",
    hasElderly: "कुटुंबात ६० वर्षांवरील ज्येष्ठ नागरिक आहेत",
    hasDisabled: "कुटुंबात दिव्यांग व्यक्ती आहेत",
    highRisk: "धोकादायक कुटुंब म्हणून चिन्हांकित करा",
    migration: "स्थलांतर स्थिती",
    portalTitle: "कुटुंब डिजिटल आरोग्य ॲप सुविधा",
    portalDesc: "कुटुंबाला त्यांच्या मोबाईलवर आरोग्य नोंदी व प्रिस्क्रिप्शन पाहता येतील. स्मार्टफोन नसल्यास रिकामे ठेवा.",
    familyEmail: "कुटुंबाचा ईमेल आयडी",
    familyPassword: "पोर्टल पासवर्ड सेट करा",
    nextStep: "पुढील पायरी",
    prevStep: "मागील पायरी",
    saveFamily: "कुटुंब नोंद सेव्ह करा",
    saving: "नोंद होत आहे...",
    yes: "होय",
    no: "नाही",
    requiredErr: "कृपया कुटुंबाचे नाव आणि गाव प्रविष्ट करा.",
    pwdErr: "ईमेल टाकल्यास पासवर्ड सेट करणे आवश्यक आहे."
  },
  hi: {
    registerTitle: "परिवार पंजीकरण",
    editTitle: "परिवार विवरण बदलें",
    subtitle: "परिवार स्वास्थ्य पंजीकरण",
    step1: "परिवार विवरण",
    step1Desc: "परिवार और मुखिया की जानकारी",
    step2: "सुविधाएं एवं जल",
    step2Desc: "पेयजल, स्वच्छता और आवास",
    step3: "जोखिम आकलन",
    step3Desc: "बुजुर्ग, दिव्यांग एवं स्वास्थ्य स्थिति",
    step4: "डिजिटल पोर्टल",
    step4Desc: "मोबाइल स्वास्थ्य पोर्टल",
    familyName: "परिवार का उपनाम / नाम",
    familyNamePlaceholder: "उदा. पाटिल परिवार",
    headOfFamily: "परिवार के मुखिया का नाम",
    headPlaceholder: "उदा. रामू भाऊराव पाटिल",
    village: "गांव / वार्ड",
    villagePlaceholder: "उदा. वडगांव",
    address: "घर का पता / पहचान",
    addressPlaceholder: "उदा. मकान नं. 14, मंदिर के पास",
    notes: "नोट (वैकल्पिक)",
    notesPlaceholder: "इस परिवार से जुड़ी जानकारी...",
    waterSource: "पीने के पानी का साधन",
    sanitation: "शौचालय सुविधा",
    cookingFuel: "रसोई ईंधन",
    electricity: "बिजली उपलब्ध",
    housingType: "मकान का प्रकार",
    hasElderly: "परिवार में 60+ वर्ष के बुजुर्ग हैं",
    hasDisabled: "परिवार में दिव्यांग सदस्य हैं",
    highRisk: "उच्च जोखिम परिवार के रूप में दर्ज करें",
    migration: "प्रवास की स्थिति",
    portalTitle: "परिवार डिजिटल स्वास्थ्य ऐप",
    portalDesc: "परिवार अपने मोबाइल पर स्वास्थ्य रिकॉर्ड और पर्चे देख सकते हैं। स्मार्टफोन न होने पर खाली छोड़ें।",
    familyEmail: "परिवार का ईमेल",
    familyPassword: "पोर्टल पासवर्ड दर्ज करें",
    nextStep: "अगला चरण",
    prevStep: "पिछला चरण",
    saveFamily: "परिवार रिकॉर्ड सुरक्षित करें",
    saving: "सुरक्षित हो रहा है...",
    yes: "हाँ",
    no: "नहीं",
    requiredErr: "कृपया परिवार का नाम और गांव भरें।",
    pwdErr: "ईमेल दर्ज करने पर पासवर्ड अनिवार्य है।"
  }
};

const STEP_ICONS = [Home, Droplet, Shield, Smartphone];

export default function AddFamilyForm({ family: existing, onBack, onSaved }) {
  const lang = localStorage.getItem("radvault_asha_lang") || "en";
  const t = FORM_TRANSLATIONS[lang] || FORM_TRANSLATIONS.en;

  const isEdit = !!existing;
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [f, setF] = useState({
    family_name:          existing?.family_name          || "",
    head_of_family:       existing?.head_of_family       || "",
    village:              existing?.village              || "Vadgaon",
    address:              existing?.address              || "",
    asha_name:            existing?.asha_name            || "Priya Deshmukh",
    notes:                existing?.notes                || "",
    water_source:         existing?.water_source         || "Piped Tap Water",
    sanitation:           existing?.sanitation           || "Individual Latrine",
    cooking_fuel:         existing?.cooking_fuel         || "LPG",
    electricity:          existing?.electricity === true ? "Yes" : existing?.electricity === false ? "No" : "Yes",
    housing_type:         existing?.housing_type         || "Pucca",
    has_elderly:          existing?.has_elderly          || false,
    has_disabled:         existing?.has_disabled         || false,
    high_risk_household:  existing?.high_risk_household || false,
    migration_status:     existing?.migration_status     || "No Migration",
    family_email:         existing?.family_email         || "",
    family_temp_password: existing?.family_temp_password || "",
  });

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!f.family_name.trim()) {
      setError(t.requiredErr);
      setCurrentStep(0);
      return;
    }
    if (!f.village.trim()) {
      setError(t.requiredErr);
      setCurrentStep(0);
      return;
    }
    if (f.family_email.trim() && !f.family_temp_password.trim()) {
      setError(t.pwdErr);
      setCurrentStep(3);
      return;
    }

    setSaving(true);
    setError("");

    const payload = {
      ...f,
      electricity: f.electricity === "Yes" || f.electricity === true,
      family_name: f.family_name.trim(),
      family_email: f.family_email ? f.family_email.trim().toLowerCase() : null,
      family_temp_password: f.family_temp_password || null,
      ...(!isEdit && { family_pin: String(Math.floor(1000 + Math.random() * 9000)) }),
    };

    const { data, error: saveErr } = isEdit
      ? await updateFamily(existing.id, payload)
      : await addFamily(payload);

    setSaving(false);
    if (saveErr) {
      setError(saveErr.message);
      return;
    }
    onSaved(data);
  };

  const stepsList = [
    { title: t.step1, desc: t.step1Desc, icon: Home },
    { title: t.step2, desc: t.step2Desc, icon: Droplet },
    { title: t.step3, desc: t.step3Desc, icon: Shield },
    { title: t.step4, desc: t.step4Desc, icon: Smartphone }
  ];

  return (
    <div className="min-h-screen bg-[#F5FBF9] pb-32 font-sans text-slate-800">
      
      {/* ── Top Header ── */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-[#16324F]">
                {isEdit ? t.editTitle : t.registerTitle}
              </h1>
              <p className="text-xs text-teal-700 font-bold">
                {isEdit ? `${existing.family_name} #${existing.family_pin}` : t.subtitle}
              </p>
            </div>
          </div>

          <span className="text-xs font-bold bg-[#E8F7F3] text-[#008F83] px-3 py-1 rounded-full border border-[#008F83]/20">
            Step {currentStep + 1} of 4
          </span>
        </div>
      </div>

      {error && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-bold text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* ── Main Form Layout: Vertical Steps on Left, Active Form Card on Right ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* ── Vertical Step Navigator (Tactile & Eye-Catching) ── */}
          <div className="md:col-span-4 bg-white border border-[#E2E8F0] rounded-2xl p-3 shadow-xs space-y-2">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-3 pt-2">
              Registration Steps
            </p>

            <div className="flex flex-row md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
              {stepsList.map((step, idx) => {
                const Icon = step.icon;
                const isActive = currentStep === idx;
                const isPassed = currentStep > idx;

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                      isActive
                        ? "bg-[#008F83] text-white border-[#008F83] shadow-xs"
                        : isPassed
                        ? "bg-[#E8F7F3] text-[#008F83] border-teal-200"
                        : "bg-white text-slate-600 border-transparent hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                      isActive ? "bg-white/20 text-white" : isPassed ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      {isPassed ? <Check className="w-4 h-4" /> : idx + 1}
                    </div>

                    <div className="min-w-0 hidden sm:block">
                      <p className="font-extrabold text-xs leading-tight truncate">{step.title}</p>
                      <p className={`text-[10px] mt-0.5 truncate ${isActive ? "text-teal-100" : "text-slate-400"}`}>
                        {step.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Active Form Step Section ── */}
          <div className="md:col-span-8 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-5">
            
            {/* Step 0: Household Info */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-[#E8F7F3] text-[#008F83] flex items-center justify-center font-bold">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#16324F]">{t.step1}</h2>
                    <p className="text-xs text-slate-400">{t.step1Desc}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t.familyName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={f.family_name}
                    onChange={e => set("family_name", e.target.value)}
                    placeholder={t.familyNamePlaceholder}
                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#16324F] focus:outline-none focus:border-[#008F83] focus:ring-1 focus:ring-[#008F83] bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t.headOfFamily} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={f.head_of_family}
                    onChange={e => set("head_of_family", e.target.value)}
                    placeholder={t.headPlaceholder}
                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#16324F] focus:outline-none focus:border-[#008F83] focus:ring-1 focus:ring-[#008F83] bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t.village} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={f.village}
                    onChange={e => set("village", e.target.value)}
                    placeholder={t.villagePlaceholder}
                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#16324F] focus:outline-none focus:border-[#008F83] focus:ring-1 focus:ring-[#008F83] bg-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t.address}
                  </label>
                  <input
                    type="text"
                    value={f.address}
                    onChange={e => set("address", e.target.value)}
                    placeholder={t.addressPlaceholder}
                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#16324F] focus:outline-none focus:border-[#008F83] focus:ring-1 focus:ring-[#008F83] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t.notes}
                  </label>
                  <textarea
                    rows={2}
                    value={f.notes}
                    onChange={e => set("notes", e.target.value)}
                    placeholder={t.notesPlaceholder}
                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs text-[#16324F] focus:outline-none focus:border-[#008F83] bg-white resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 1: WASH & Amenities */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Droplet className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#16324F]">{t.step2}</h2>
                    <p className="text-xs text-slate-400">{t.step2Desc}</p>
                  </div>
                </div>

                {/* Water Source Chips */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    {t.waterSource}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Piped Tap Water", "Handpump", "Protected Well", "Unprotected Well", "Tanker"].map(item => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => set("water_source", item)}
                        className={`px-3.5 py-2.5 rounded-xl border-2 text-xs font-extrabold transition-all cursor-pointer ${
                          f.water_source === item
                            ? "bg-[#008F83] text-white border-[#008F83] shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sanitation Facility Chips */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    {t.sanitation}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Individual Latrine", "Community Toilet", "Open Defecation"].map(item => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => set("sanitation", item)}
                        className={`px-3.5 py-2.5 rounded-xl border-2 text-xs font-extrabold transition-all cursor-pointer ${
                          f.sanitation === item
                            ? "bg-[#008F83] text-white border-[#008F83] shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cooking Fuel Chips */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    {t.cookingFuel}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["LPG", "Firewood / Chulha", "Kerosene", "Biogas"].map(item => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => set("cooking_fuel", item)}
                        className={`px-3.5 py-2.5 rounded-xl border-2 text-xs font-extrabold transition-all cursor-pointer ${
                          f.cooking_fuel === item
                            ? "bg-[#008F83] text-white border-[#008F83] shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Housing Type Chips */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    {t.housingType}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["Pucca", "Semi-Pucca", "Kutcha"].map(item => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => set("housing_type", item)}
                        className={`px-3.5 py-2.5 rounded-xl border-2 text-xs font-extrabold transition-all cursor-pointer ${
                          f.housing_type === item
                            ? "bg-[#008F83] text-white border-[#008F83] shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Vulnerability (Caste Category REMOVED) */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#16324F]">{t.step3}</h2>
                    <p className="text-xs text-slate-400">{t.step3Desc}</p>
                  </div>
                </div>

                {/* Interactive Toggles */}
                <button
                  type="button"
                  onClick={() => set("has_elderly", !f.has_elderly)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                    f.has_elderly ? "bg-teal-50 border-[#008F83]" : "bg-white border-[#E2E8F0]"
                  }`}
                >
                  <span className="font-extrabold text-xs text-slate-800">{t.hasElderly}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                    f.has_elderly ? "bg-[#008F83] text-white border-[#008F83]" : "border-slate-300"
                  }`}>
                    {f.has_elderly && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => set("has_disabled", !f.has_disabled)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                    f.has_disabled ? "bg-teal-50 border-[#008F83]" : "bg-white border-[#E2E8F0]"
                  }`}
                >
                  <span className="font-extrabold text-xs text-slate-800">{t.hasDisabled}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                    f.has_disabled ? "bg-[#008F83] text-white border-[#008F83]" : "border-slate-300"
                  }`}>
                    {f.has_disabled && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => set("high_risk_household", !f.high_risk_household)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                    f.high_risk_household ? "bg-red-50 border-red-400" : "bg-white border-[#E2E8F0]"
                  }`}
                >
                  <div>
                    <span className="font-extrabold text-xs text-red-900 block">{t.highRisk}</span>
                    <span className="text-[10px] text-red-700">Flag for priority ASHA visits &amp; doctor checkups</span>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                    f.high_risk_household ? "bg-red-600 text-white border-red-600" : "border-slate-300"
                  }`}>
                    {f.high_risk_household && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {/* Migration Status Chips */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 mt-2">
                    {t.migration}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["No Migration", "Seasonal Migrant", "Permanent Migrant"].map(item => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => set("migration_status", item)}
                        className={`px-3.5 py-2.5 rounded-xl border-2 text-xs font-extrabold transition-all cursor-pointer ${
                          f.migration_status === item
                            ? "bg-[#008F83] text-white border-[#008F83] shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Portal Access */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-[#16324F]">{t.step4}</h2>
                    <p className="text-xs text-slate-400">{t.step4Desc}</p>
                  </div>
                </div>

                <div className="bg-[#E8F7F3] border border-[#008F83]/30 rounded-2xl p-4">
                  <p className="text-xs font-extrabold text-teal-950">{t.portalTitle}</p>
                  <p className="text-[11px] text-teal-800 mt-1 leading-relaxed">{t.portalDesc}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t.familyEmail}
                  </label>
                  <input
                    type="email"
                    value={f.family_email}
                    onChange={e => set("family_email", e.target.value)}
                    placeholder="patil.family@gmail.com"
                    className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#16324F] focus:outline-none focus:border-[#008F83] bg-white font-medium"
                  />
                </div>

                {f.family_email.trim() && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t.familyPassword}
                    </label>
                    <input
                      type="text"
                      value={f.family_temp_password}
                      onChange={e => set("family_temp_password", e.target.value)}
                      placeholder="e.g. Patil@1234"
                      className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#16324F] focus:outline-none focus:border-[#008F83] bg-white font-medium"
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── Form Navigation Buttons ── */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t.prevStep}</span>
                </button>
              ) : <div />}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="px-5 py-2.5 bg-[#008F83] hover:bg-[#007A70] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>{t.nextStep}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="px-6 py-3 bg-[#008F83] hover:bg-[#007A70] text-white font-black text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:bg-slate-300"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saving ? t.saving : t.saveFamily}</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}