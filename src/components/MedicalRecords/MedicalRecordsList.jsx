import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, FileText, FlaskConical, Pill, FileImage, Syringe, Building2 } from 'lucide-react';
import RecordFilters from './RecordFilters';
import RecordViewerModal from './RecordViewerModal';
import ShareModal from './ShareModal';
import WhoHasAccessModal from './WhoHasAccessModal';
import UploadModal from '../Patient/UploadModal';
import DocumentPreview from '../Patient/DocumentPreview';
import MedicalDocumentCard from '../Patient/MedicalDocumentCard';
import { getActiveShares } from '../../services/shareService';

const VAULT_CATEGORIES = [
  { id: 'all', label: 'All Records', Icon: FileText },
  { id: 'Prescriptions', label: 'Prescriptions', Icon: Pill },
  { id: 'Lab Reports', label: 'Lab Reports', Icon: FlaskConical },
  { id: 'Scans & X-Rays', label: 'Scans & X-Rays', Icon: FileImage },
  { id: 'Vaccination', label: 'Vaccinations', Icon: Syringe },
  { id: 'Hospital Discharge', label: 'Hospital Records', Icon: Building2 },
];

export default function MedicalRecordsList({
  records = [],
  initialSelectedRecordId = null,
  patient = {},
  onRecordUploaded = null
}) {
  const { isDemoMode, demoDataEnabled } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(() => {
    if (initialSelectedRecordId) {
      return records.find((r) => r.id === initialSelectedRecordId) || null;
    }
    return null;
  });

  const [localRecords, setLocalRecords] = useState(records);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Sharing & Access Management Modals
  const [showShareModal, setShowShareModal] = useState(false);
  const [showWhoHasAccess, setShowWhoHasAccess] = useState(false);
  const [activeSharesCount, setActiveSharesCount] = useState(0);

  useEffect(() => {
    setLocalRecords(records);
  }, [records]);

  // Refresh active shares count
  const refreshSharesCount = async () => {
    try {
      const active = await getActiveShares(patient.id || 'PAT-89210', isDemoMode && demoDataEnabled);
      setActiveSharesCount(active.length);
    } catch (e) {
      console.warn('Could not fetch active shares count:', e);
    }
  };

  useEffect(() => {
    refreshSharesCount();
  }, [showShareModal, showWhoHasAccess]);

  const handleUploadSuccess = (newRecord) => {
    setLocalRecords(prev => [newRecord, ...prev]);
    if (onRecordUploaded) onRecordUploaded(newRecord);
  };

  const filteredRecords = useMemo(() => {
    return localRecords.filter((rec) => {
      const recCategory = rec.report?.category || rec.bodyRegion || rec.modality || 'Other';
      
      let matchesCategory = activeCategory === 'all';
      if (activeCategory === 'Prescriptions') {
        matchesCategory = recCategory === 'Prescriptions' || rec.title?.toLowerCase().includes('prescription') || rec.modality === 'Rx';
      } else if (activeCategory === 'Lab Reports') {
        matchesCategory = recCategory === 'Lab Reports' || rec.modality === 'LAB' || rec.title?.toLowerCase().includes('lab') || rec.title?.toLowerCase().includes('blood');
      } else if (activeCategory === 'Scans & X-Rays') {
        matchesCategory = recCategory === 'Scans & X-Rays' || ['XR', 'CT', 'MRI', 'US'].includes(rec.modality);
      } else if (activeCategory === 'Vaccination') {
        matchesCategory = recCategory === 'Vaccination' || rec.title?.toLowerCase().includes('vaccin');
      } else if (activeCategory === 'Hospital Discharge') {
        matchesCategory = recCategory === 'Hospital Discharge' || rec.title?.toLowerCase().includes('hospital') || rec.title?.toLowerCase().includes('discharge');
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (rec.title || '').toLowerCase().includes(q) ||
        (rec.bodyRegion || '').toLowerCase().includes(q) ||
        (rec.doctor || rec.doctor_name || '').toLowerCase().includes(q) ||
        (rec.facility || rec.facility_name || '').toLowerCase().includes(q) ||
        (rec.report?.impression && rec.report.impression.toLowerCase().includes(q)) ||
        (rec.report?.notes && rec.report.notes.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [localRecords, activeCategory, searchQuery]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* ── Doctor Consent & Upload Action Bar ── */}
      <div className="p-4 sm:p-5 bg-white border-2 border-slate-200 rounded-3xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-[#008080]/30 text-[#008080] flex items-center justify-center font-black text-lg">
            🔒
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm">
              Patient-Controlled Doctor Access
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {activeSharesCount === 1
                ? '1 doctor currently authorized to view records'
                : `${activeSharesCount} doctors currently authorized`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowWhoHasAccess(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Who Has Access ({activeSharesCount})
          </button>

          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            + Share Records
          </button>

          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-[#008080] hover:bg-[#006666] text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" /> Upload Document
          </button>
        </div>
      </div>

      {/* ── Search Bar & Category Filter Chips ── */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records by title, doctor, facility, or clinical impressions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-slate-200 focus:border-[#008080] rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none shadow-xs"
          />
        </div>

        {/* Category Chips */}
        <div className="flex overflow-x-auto gap-2 scrollbar-hide pb-1">
          {VAULT_CATEGORIES.map((cat) => {
            const Icon = cat.Icon;
            const isSelected = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#008080] text-white shadow-sm border border-[#008080]'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Record Count Bar ── */}
      <div className="flex justify-between items-center px-1 text-xs text-slate-500 font-bold">
        <span>
          Showing <strong>{filteredRecords.length}</strong> medical {filteredRecords.length === 1 ? 'record' : 'records'}
        </span>
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-[#008080] hover:underline cursor-pointer"
          >
            ✕ Clear search
          </button>
        )}
      </div>

      {/* ── Records Grid ── */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center shadow-xs space-y-3">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-7 h-7" />
          </div>
          <h4 className="font-black text-slate-800 text-base">No Matching Records Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No documents matched your filters. You can upload prescriptions, scan reports, or lab results directly to your vault.
          </p>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-2.5 bg-[#008080] hover:bg-[#006666] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Upload Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((rec) => (
            <MedicalDocumentCard
              key={rec.id}
              doc={rec}
              onView={(doc) => setPreviewDoc(doc)}
            />
          ))}
        </div>
      )}

      {/* ── Document Preview Modal (Image & PDF with AI Explainer) ── */}
      {previewDoc && (
        <DocumentPreview
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* ── Radiological Scan Detail Viewer Modal ── */}
      {selectedRecord && (
        <RecordViewerModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          patient={patient}
          onOpenWhoHasAccess={() => setShowWhoHasAccess(true)}
        />
      )}

      {/* ── Document Upload Modal ── */}
      {showUploadModal && (
        <UploadModal
          patient={patient}
          onClose={() => setShowUploadModal(false)}
          onUploaded={handleUploadSuccess}
          isDemoMode={isDemoMode}
        />
      )}

      {/* ── Direct Share Modal (from header) ── */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            refreshSharesCount();
          }}
          patient={patient}
          onViewAccess={() => {
            setShowShareModal(false);
            setShowWhoHasAccess(true);
          }}
        />
      )}

      {/* ── Who Has Access & Revocation Modal ── */}
      {showWhoHasAccess && (
        <WhoHasAccessModal
          isOpen={showWhoHasAccess}
          onClose={() => {
            setShowWhoHasAccess(false);
            refreshSharesCount();
          }}
          patient={patient}
          onOpenShareNew={() => setShowShareModal(true)}
        />
      )}

    </div>
  );
}
