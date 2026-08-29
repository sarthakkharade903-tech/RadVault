import React from 'react';
import { ArrowRight, Sparkles, Heart, Baby, Shield, User, AlertTriangle } from 'lucide-react';

const ALL_PATIENT_TYPES = [
  {
    id: 'pregnant',
    emoji: '🤰',
    labelEn: 'Pregnant Woman (Maternal Care)',
    labelMr: 'गरोदर माता (प्रसूतीपूर्व तपासणी)',
    labelHi: 'गर्भवती महिला (मातृ स्वास्थ्य)',
    subEn: 'ANC check · Maternal danger signs & blood tests',
    subMr: 'प्रसूतीपूर्व तपासणी व गरोदरपणातील धोक्याची लक्षणे',
    subHi: 'प्रसव पूर्व जांच एवं मातृ स्वास्थ्य परीक्षण',
    card: 'border-pink-200 bg-pink-50/70 hover:border-pink-400',
    labelColor: 'text-pink-800',
    genderFilter: 'Female', // ONLY FOR FEMALES
    minAge: 12,             // ONLY AGE 12+
  },
  {
    id: 'child',
    emoji: '👶',
    labelEn: 'Child (Under 5 years)',
    labelMr: '५ वर्षांखालील बाळ',
    labelHi: '5 वर्ष से छोटा बच्चा',
    subEn: 'Growth, immunization, fever & nutrition check',
    subMr: 'वजन, लसीकरण, ताप व पोषण तपासणी',
    subHi: 'वजन, टीकाकरण, बुखार एवं पोषण जांच',
    card: 'border-amber-200 bg-amber-50/70 hover:border-amber-400',
    labelColor: 'text-amber-800',
    maxAge: 5,              // ONLY AGE <= 5
  },
  {
    id: 'elderly',
    emoji: '🧓',
    labelEn: 'Elderly / Chronic Patient (60+ years)',
    labelMr: 'ज्येष्ठ नागरिक / जुनाट आजार (६०+ वर्षे)',
    labelHi: 'बुजुर्ग / पुरानी बीमारी (60+ वर्ष)',
    subEn: 'High BP · Diabetes · Chest pain · Mobility loss',
    subMr: 'रक्तदाब, मधुमेह, छातीत दुखणे किंवा दम लागणे',
    subHi: 'रक्तचाप, मधुमेह, सीने में दर्द या सांस फूलना',
    card: 'border-purple-200 bg-purple-50/70 hover:border-purple-400',
    labelColor: 'text-purple-800',
    minAge: 55,             // ONLY AGE 55+
  },
  {
    id: 'adult',
    emoji: '🧑',
    labelEn: 'General Adult Patient',
    labelMr: 'सर्वसाधारण प्रौढ व्यक्ती',
    labelHi: 'सामान्य वयस्क मरीज',
    subEn: 'Fever, cough, vomiting, body ache or injury',
    subMr: 'ताप, खोकला, उलट्या, अंगदुखी किंवा जखम',
    subHi: 'बुखार, खांसी, उल्टी, बदन दर्द या चोट',
    card: 'border-teal-200 bg-[#E8F7F3] hover:border-teal-400',
    labelColor: 'text-teal-900',
    minAge: 6,              // FOR AGES 6+
  },
  {
    id: 'emergency',
    emoji: '🚨',
    labelEn: 'Emergency — Fast Track',
    labelMr: 'अति तातडीची आपत्कालीन स्थिती',
    labelHi: 'आपातकालीन - तुरंत अस्पताल',
    subEn: 'Severe bleeding, unconscious, acute breathlessness',
    subMr: 'रक्तस्त्राव, बेशुद्ध, तीव्र श्वास घेण्यास त्रास',
    subHi: 'गंभीर रक्तस्राव, बेहोशी, तेज सांस की तकलीफ',
    card: 'border-red-300 bg-red-50 hover:border-red-500',
    labelColor: 'text-red-800',
  },
];

export default function PatientTypeScreen({ patient, onSelect, onSelectType }) {
  const handleSelect = onSelectType || onSelect;
  const lang = localStorage.getItem("radvault_asha_lang") || "en";

  const gender = patient?.gender || 'Other';
  const age = patient?.age_years !== undefined && patient?.age_years !== null ? Number(patient.age_years) : null;

  // ── Smart Gender & Age-Aware Filter ──
  const visibleTypes = ALL_PATIENT_TYPES.filter(type => {
    // 1. STRICT GENDER CHECK: If patient is Male, NEVER show Pregnant Woman!
    if (gender === 'Male' && type.id === 'pregnant') {
      return false;
    }

    // 2. STRICT AGE CHECK: If age is known
    if (age !== null) {
      // Under 12 cannot be pregnant
      if (type.id === 'pregnant' && age < 12) return false;

      // Under 5 child check
      if (type.id === 'child' && age > 5) return false;

      // Elderly check
      if (type.id === 'elderly' && age < 55) return false;

      // If under 5, don't show General Adult (show Child instead)
      if (type.id === 'adult' && age <= 5) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Patient Header Card */}
      {patient && (
        <div className="p-3.5 bg-[#E8F7F3] border border-teal-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-teal-950">{patient.name}</p>
            <p className="text-[11px] font-bold text-teal-700 mt-0.5">
              {gender} • {age !== null ? `${age} yrs` : 'Age not recorded'}
            </p>
          </div>
          <span className="text-[10px] font-bold bg-white text-teal-800 px-2.5 py-1 rounded-md border border-teal-200">
            {gender === 'Male' ? 'Male Patient' : gender === 'Female' ? 'Female Patient' : 'Resident'}
          </span>
        </div>
      )}

      <div>
        <h3 className="text-base sm:text-lg font-black text-[#16324F]">
          {lang === 'mr' ? 'तपासणी विभाग / प्रकार निवडा' : lang === 'hi' ? 'जांच का प्रकार चुनें' : 'Select Referral Assessment Category'}
        </h3>
        <p className="text-xs font-semibold text-slate-500 mt-0.5">
          {lang === 'mr'
            ? 'रुग्णाच्या वय व लिंगानुसार योग्य पर्याय खालीलप्रमाणे आहेत:'
            : lang === 'hi'
            ? 'मरीज की उम्र और लिंग के अनुसार उपलब्ध विकल्प:'
            : 'Relevant options filtered by patient age and gender:'}
        </p>
      </div>

      <div className="space-y-2.5">
        {visibleTypes.map((type) => {
          const label = lang === 'mr' ? type.labelMr : lang === 'hi' ? type.labelHi : type.labelEn;
          const sub = lang === 'mr' ? type.subMr : lang === 'hi' ? type.subHi : type.subEn;

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => handleSelect && handleSelect(type.id)}
              className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border transition-all text-left group cursor-pointer shadow-xs ${type.card}`}
            >
              <span className="text-3xl shrink-0 leading-none">{type.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-extrabold text-sm leading-tight ${type.labelColor}`}>{label}</p>
                <p className="text-[11px] font-medium text-slate-600 mt-0.5 leading-snug">{sub}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-1 transition-all shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
