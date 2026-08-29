import React from 'react';
import {
  Building2, Clock, User, CheckCircle2, AlertCircle,
  ChevronRight, Plus, Handshake, Stethoscope, ArrowLeft,
  Volume2, ShieldAlert, Trash2
} from 'lucide-react';

// ─── Single-Language Dictionaries (No Mixed Text) ─────────
const LIST_TRANSLATIONS = {
  en: {
    title: "Specialist & Hospital Referrals",
    subtitlePending: "referrals awaiting hospital doctor review",
    subtitleAllClear: "All referrals are up to date with hospital",
    emergency: "Emergency",
    urgent: "Urgent",
    routine: "Routine",
    createNewBtn: "Create New Referral (ASHA Triage)",
    noReferralsTitle: "No Referrals Yet",
    noReferralsSub: "Create your first ASHA triage referral above to send a patient to PHC or Civil Hospital.",
    allReferrals: "Active Hospital Referrals",
    aiTriageNote: "Clinical Triage Note",
    backHome: "Back",
    deleteBtn: "Delete",
    confirmDelete: "Are you sure you want to remove this referral?"
  },
  mr: {
    title: "रुग्णालय व तज्ज्ञ रेफरल यादी",
    subtitlePending: "रेफरल डॉक्टरांच्या तपासणीच्या प्रतीक्षेत आहेत",
    subtitleAllClear: "सर्व रेफरल अद्ययावत आहेत",
    emergency: "अति तातडीचे",
    urgent: "तातडीचे",
    routine: "सर्वसाधारण",
    createNewBtn: "नवीन रेफरल तयार करा",
    noReferralsTitle: "अद्याप रेफरल नाहीत",
    noReferralsSub: "रुग्णास प्राथमिक आरोग्य केंद्र किंवा रुग्णालयात पाठवण्यासाठी वरील बटणावर टॅप करा.",
    allReferrals: "सक्रिय रेफरल यादी",
    aiTriageNote: "लक्षणे व वैद्यकीय माहिती",
    backHome: "मागे",
    deleteBtn: "रद्द करा",
    confirmDelete: "तुम्हाला हे रेफरल खरोखर काढून टाकायचे आहे का?"
  },
  hi: {
    title: "अस्पताल एवं विशेषज्ञ रेफरल सूची",
    subtitlePending: "रेफरल डॉक्टर की जांच हेतु लंबित हैं",
    subtitleAllClear: "सभी रेफरल अद्यतित हैं",
    emergency: "अति आवश्यक",
    urgent: "आवश्यक",
    routine: "सामान्य",
    createNewBtn: "नया रेफरल बनाएं",
    noReferralsTitle: "कोई रेफरल नहीं",
    noReferralsSub: "मरीज को पीएचसी या अस्पताल भेजने के लिए ऊपर दिए गए बटन पर टैप करें।",
    allReferrals: "सक्रिय रेफरल सूची",
    aiTriageNote: "लक्षण एवं डॉक्टर नोट",
    backHome: "पीछे",
    deleteBtn: "हटाएं",
    confirmDelete: "क्या आप वाकई यह रेफरल हटाना चाहते हैं?"
  }
};

const PRIORITY_CONFIG = {
  RED: {
    labelEn: 'Emergency',
    badgeBg: 'bg-[#D32F2F]',
    badgeText: 'text-white',
    cardBorder: 'border-l-4 border-l-[#D32F2F] border-slate-200',
    cardBg: 'bg-white',
    emoji: '🔴',
  },
  ORANGE: {
    labelEn: 'Urgent',
    badgeBg: 'bg-[#FF9933]',
    badgeText: 'text-slate-900',
    cardBorder: 'border-l-4 border-l-[#FF9933] border-slate-200',
    cardBg: 'bg-white',
    emoji: '🟡',
  },
  GREEN: {
    labelEn: 'Routine',
    badgeBg: 'bg-[#008F83]',
    badgeText: 'text-white',
    cardBorder: 'border-l-4 border-l-[#008F83] border-slate-200',
    cardBg: 'bg-white',
    emoji: '🟢',
  },
};

const STATUS_CONFIG = {
  Pending: { icon: Clock, color: 'text-amber-700', bg: 'bg-amber-50 border border-amber-200' },
  Accepted: { icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200' },
  Completed: { icon: CheckCircle2, color: 'text-teal-800', bg: 'bg-teal-50 border border-teal-200' },
};

function ReferralCard({ referral, lang, onDelete }) {
  const priority = PRIORITY_CONFIG[referral.priority] || PRIORITY_CONFIG.GREEN;
  const statusConf = STATUS_CONFIG[referral.status] || STATUS_CONFIG.Pending;
  const StatusIcon = statusConf.icon;
  const t = LIST_TRANSLATIONS[lang] || LIST_TRANSLATIONS.en;

  const priorityLabel = referral.priority === 'RED' ? t.emergency : referral.priority === 'ORANGE' ? t.urgent : t.routine;

  const handleDelete = () => {
    if (window.confirm(t.confirmDelete)) {
      onDelete(referral.id);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm ${priority.cardBorder} ${priority.cardBg}`}
    >
      {/* Top Row */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full ${priority.badgeBg} ${priority.badgeText}`}
          >
            {priority.emoji} {priorityLabel}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${statusConf.bg} ${statusConf.color}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {referral.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-semibold">{referral.createdAt}</span>
          {onDelete && (
            <button
              onClick={handleDelete}
              title={t.deleteBtn}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Patient Info */}
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-9 h-9 rounded-xl bg-[#E8F7F3] text-[#008F83] flex items-center justify-center shrink-0 font-bold">
          <User className="w-5 h-5" />
        </div>
        <div>
          <p className="font-black text-slate-900 text-base leading-tight">{referral.patientName}</p>
          <p className="text-[11px] text-teal-800 font-mono font-bold">{referral.patientId}</p>
        </div>
      </div>

      {/* Hospital & Department */}
      <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Building2 className="w-4 h-4 text-[#008F83] shrink-0" />
          <span className="font-bold">{referral.hospital}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Stethoscope className="w-4 h-4 text-teal-700 shrink-0" />
          <span className="font-semibold">{referral.department} • {referral.doctor}</span>
        </div>
      </div>

      {/* AI / Clinical Note */}
      {referral.aiNote && (
        <div className="mt-3 p-3 bg-[#F5FBF9] border border-teal-100 rounded-xl">
          <p className="text-xs text-slate-700 leading-relaxed">
            <strong className="text-[#008F83] font-black">{t.aiTriageNote}: </strong>
            {referral.aiNote}
          </p>
        </div>
      )}
    </div>
  );
}

function StatsBar({ referrals, lang }) {
  const t = LIST_TRANSLATIONS[lang] || LIST_TRANSLATIONS.en;
  const counts = { RED: 0, ORANGE: 0, GREEN: 0 };
  referrals.forEach((r) => {
    if (counts[r.priority] !== undefined) counts[r.priority]++;
    else counts.GREEN++;
  });

  return (
    <div className="grid grid-cols-3 gap-3 mb-5">
      {[
        { key: 'RED', label: t.emergency, emoji: '🔴', color: 'text-red-700', border: 'border-red-200', bg: 'bg-red-50/70' },
        { key: 'ORANGE', label: t.urgent, emoji: '🟡', color: 'text-amber-800', border: 'border-amber-200', bg: 'bg-amber-50/70' },
        { key: 'GREEN', label: t.routine, emoji: '🟢', color: 'text-teal-800', border: 'border-teal-200', bg: 'bg-[#E8F7F3]' },
      ].map(({ key, label, emoji, color, border, bg }) => (
        <div key={key} className={`rounded-2xl border p-3 text-center ${border} ${bg}`}>
          <p className={`text-2xl font-black ${color}`}>{counts[key]}</p>
          <p className="text-[10px] text-slate-600 font-extrabold mt-0.5">{emoji} {label}</p>
        </div>
      ))}
    </div>
  );
}

export default function ReferralList({ referrals, onCreateNew, onDeleteReferral, onBack }) {
  const lang = localStorage.getItem("radvault_asha_lang") || "en";
  const t = LIST_TRANSLATIONS[lang] || LIST_TRANSLATIONS.en;
  const pendingCount = referrals.filter((r) => r.status === 'Pending').length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#16324F] flex items-center gap-2">
            <Handshake className="w-6 h-6 text-[#008F83]" />
            {t.title}
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            {pendingCount > 0
              ? `${pendingCount} ${t.subtitlePending}`
              : t.subtitleAllClear}
          </p>
        </div>
        
        {onBack && (
          <button
            onClick={onBack}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.backHome}</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <StatsBar referrals={referrals} lang={lang} />

      {/* Create New Button */}
      <button
        onClick={onCreateNew}
        className="w-full mb-5 py-4 bg-[#008F83] hover:bg-[#007A70] active:bg-[#006E65] text-white font-extrabold rounded-2xl text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>{t.createNewBtn}</span>
      </button>

      {/* Referral List */}
      {referrals.length === 0 ? (
        <div className="text-center py-12 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
          <Handshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-[#16324F] mb-1">{t.noReferralsTitle}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{t.noReferralsSub}</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
            <AlertCircle className="w-3.5 h-3.5 text-teal-600" />
            {t.allReferrals} ({referrals.length})
          </h3>
          {referrals.map((referral) => (
            <ReferralCard
              key={referral.id}
              referral={referral}
              lang={lang}
              onDelete={onDeleteReferral}
            />
          ))}
        </div>
      )}

    </div>
  );
}
