import React, { useState } from 'react';
import { X, Upload, FileText, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../services/supabase';

const CATEGORIES = [
  'Prescriptions',
  'Lab Reports',
  'Scans & X-Rays',
  'Vaccination',
  'Hospital Discharge',
  'Other Document'
];

const ACCEPT_TYPES = 'image/*,application/pdf';

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadModal({ patient, onClose, onUploaded, isDemoMode = false }) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('Prescriptions');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const patientId = patient?.id || 'PAT-89210';
  const patientName = patient?.full_name || patient?.name || patient?.fullName || 'Beneficiary';

  const handleFile = (f) => {
    if (!f) return;
    if (f.size > 15 * 1024 * 1024) {
      setError('File must be under 15 MB.');
      return;
    }
    setError('');
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const base64Data = await fileToBase64(file);
      const isImage = file.type.startsWith('image/');
      const modality = category === 'Scans & X-Rays' ? 'XR' : category === 'Lab Reports' ? 'LAB' : 'DOC';

      const newRecord = {
        id: `rec-${Date.now()}`,
        patient_id: patientId,
        title: title || file.name,
        modality: modality,
        body_region: category,
        facility_name: 'Patient Self-Upload',
        doctor_name: 'Self Cataloged',
        record_url: isImage ? base64Data : null,
        created_at: new Date().toISOString(),
        report: {
          category: category,
          fileName: file.name,
          fileType: file.type,
          fileSize: formatBytes(file.size),
          fileData: base64Data,
          notes: notes,
          source: 'Patient Upload',
          patientFriendlySummary: notes || `Patient-uploaded ${category} document cataloged in personal health vault.`
        }
      };

      if (!isDemoMode && patientId && !patientId.startsWith('PAT-')) {
        const { error: dbErr } = await supabase
          .from('medical_records')
          .insert([{
            patient_id: patientId,
            title: newRecord.title,
            modality: newRecord.modality,
            body_region: newRecord.body_region,
            facility_name: newRecord.facility_name,
            doctor_name: newRecord.doctor_name,
            record_url: newRecord.record_url,
            report: newRecord.report
          }]);

        if (dbErr) {
          console.warn('Database insert warning, saving locally to session:', dbErr.message);
        }
      }

      setDone(true);
      setTimeout(() => {
        if (onUploaded) onUploaded(newRecord);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Upload processing error:', err);
      setError(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-md rounded-3xl border-2 border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
          <div>
            <h2 className="text-base font-black text-slate-900">Upload Health Document</h2>
            <p className="text-xs font-bold text-slate-500 mt-0.5">Vault for: {patientName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {done ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-bounce" />
              </div>
              <h3 className="text-base font-black text-slate-900">Document Vaulted!</h3>
              <p className="text-xs text-slate-500 font-semibold max-w-xs">
                Your medical record has been securely saved to your RadVault locker.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('radvault-vault-file-input').click()}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
                  dragging ? 'border-[#008080] bg-[#E6F2F2]' : file ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:border-[#008080]'
                }`}
              >
                <input
                  id="radvault-vault-file-input"
                  type="file"
                  accept={ACCEPT_TYPES}
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                {file ? (
                  <>
                    <FileText className="w-8 h-8 text-emerald-600 mb-1.5" />
                    <p className="font-extrabold text-slate-900 break-all">{file.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">{formatBytes(file.size)}</p>
                    <span className="text-[10px] text-[#008080] font-black mt-2 uppercase tracking-wide">
                      Tap to change file
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="font-extrabold text-slate-900">Select Document or Photo</p>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1">PDF or Image (Max 15 MB)</p>
                  </>
                )}
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                  Document Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                        category === cat
                          ? 'border-[#008080] bg-[#E6F2F2] text-[#008080] shadow-2xs font-extrabold'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                  Document Title / Description
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chest X-Ray Scan, Blood Test Report, Hospital Discharge Summary"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#008080]"
                />
              </div>

              {/* Notes input */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                  Doctor Notes / Observations (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Prescribed by Dr. Samir at Shirwal PHC for 5-day course."
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-700 focus:outline-none focus:border-[#008080]"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="w-full bg-[#008080] hover:bg-[#006666] text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 transition-all shadow-md cursor-pointer uppercase tracking-wider"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? 'Vaulting Document...' : 'Save to Medical Vault'}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
