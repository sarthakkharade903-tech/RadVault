import React from 'react';

const PATIENT_TYPES = [
  {
    id: 'pregnant',
    emoji: '🤰',
    label: 'Pregnant Woman',
    subtitle: 'ANC check · Maternal health screening',
    card: 'border-pink-200 bg-pink-50 hover:border-pink-400',
    label_color: 'text-pink-800',
  },
  {
    id: 'child',
    emoji: '👶',
    label: 'Child (Under 5 years)',
    subtitle: 'IMNCI screening · Growth & nutrition',
    card: 'border-sky-200 bg-sky-50 hover:border-sky-400',
    label_color: 'text-sky-800',
  },
  {
    id: 'elderly',
    emoji: '🧓',
    label: 'Elderly / Chronic Disease',
    subtitle: 'BP · Diabetes · Heart disease',
    card: 'border-amber-200 bg-amber-50 hover:border-amber-400',
    label_color: 'text-amber-800',
  },
  {
    id: 'adult',
    emoji: '🧑',
    label: 'General Adult',
    subtitle: 'Fever · Cough · Any illness',
    card: 'border-[#008080]/30 bg-[#008080]/5 hover:border-[#008080]/60',
    label_color: 'text-[#008080]',
  },
  {
    id: 'emergency',
    emoji: '🚨',
    label: 'Emergency — Fast Track',
    subtitle: 'Immediate danger. Skip all steps.',
    card: 'border-[#D32F2F]/40 bg-[#FFF5F5] hover:border-[#D32F2F]/70',
    label_color: 'text-[#D32F2F]',
  },
];

export default function PatientTypeScreen({ onSelect }) {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-extrabold text-[#212121]">Who is this patient?</h3>
        <p className="text-sm text-[#555555] mt-1">
          Select the category. The app will show the right checks for that patient.
        </p>
      </div>
      <div className="space-y-3">
        {PATIENT_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelect(type.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all group ${type.card}`}
          >
            <span className="text-4xl shrink-0 leading-none">{type.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className={`font-extrabold text-base leading-tight ${type.label_color}`}>{type.label}</p>
              <p className="text-xs text-[#555555] mt-0.5">{type.subtitle}</p>
            </div>
            <span className="text-slate-400 group-hover:translate-x-1 transition-transform shrink-0 font-bold text-lg">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
