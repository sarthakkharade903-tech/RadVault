import React, { useState } from 'react';
import { X, Upload, FileText, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { uploadDocument } from '../../services/vaultService';

const CATEGORIES = ['Lab Reports', 'Prescriptions', 'Scans', 'Vaccination', 'Hospital', 'Other'];

const ACCEPT_TYPES = 'image/*,application/pdf';

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function UploadModal({ member, familyId, onClose, onUploaded }) {
  const [file, setFile]           = useState(null);
  const [category, setCategory]   = useState('Other');
  const [title, setTitle]         = useState('');
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState('');

  const handleFile = (f) => {
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) { setError('File must be under 20 MB.'); return; }
    setError('');
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) { setError('Please select a file.'); return; }
    setUploading(true);
    setError('');
    const { error: uploadErr } = await uploadDocument({
      patientId: member.id,
      familyId,
      file,
      category,
      title: title || file.name,
      source: 'Self uploaded',
    });
    setUploading(false);
    if (uploadErr) {
      setError(`Upload failed: ${uploadErr.message || uploadErr.error || 'Unknown error'}`);
      console.error(uploadErr);
    } else {
      setDone(true);
      setTimeout(() => { onUploaded(); onClose(); }, 1400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#16324F]/30 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[16px] font-black text-[#16324F]">Upload Document</h2>
            <p className="text-[11px] font-bold text-[#64748B] mt-0.5">{member.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-bold px-3 py-2.5 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {done ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-[15px] font-black text-[#16324F]">Uploaded!</p>
              <p className="text-[12px] text-slate-500 font-semibold">Your document has been saved to the Vault.</p>
            </div>
          ) : (
            <>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
                  dragging ? 'border-[#008F83] bg-[#E8F7F3]' : file ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
                onClick={() => document.getElementById('vault-file-input').click()}
              >
                <input
                  id="vault-file-input"
                  type="file"
                  accept={ACCEPT_TYPES}
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                {file ? (
                  <>
                    <FileText className="w-8 h-8 text-emerald-500 mb-2" />
                    <p className="text-[13px] font-black text-[#16324F] break-all">{file.name}</p>
                    <p className="text-[11px] text-slate-400 font-bold mt-0.5">{formatBytes(file.size)}</p>
                    <p className="text-[10px] text-[#008F83] font-bold mt-2 uppercase tracking-wide">Tap to change</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-[13px] font-black text-[#16324F]">Tap to select file</p>
                    <p className="text-[11px] text-slate-400 font-semibold mt-1">PDF or Image • Max 20 MB</p>
                  </>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="text-[11px] font-black text-[#64748B] uppercase tracking-widest mb-2 block">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)}
                      className={`px-2 py-2 rounded-xl border text-[11px] font-bold text-center transition-all ${
                        category === cat
                          ? 'border-[#008F83] bg-[#E8F7F3] text-[#008F83]'
                          : 'border-slate-200 bg-white text-[#64748B] hover:border-slate-300'
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-[11px] font-black text-[#64748B] uppercase tracking-widest mb-2 block">Title (optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CBC Blood Test, X-Ray Chest"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-[#16324F] placeholder:text-slate-300 focus:outline-none focus:border-[#008F83] focus:ring-2 focus:ring-[#008F83]/10"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!done && (
          <div className="px-5 pb-6 pt-3 border-t border-slate-100 shrink-0">
            <button
              onClick={handleSubmit}
              disabled={uploading || !file}
              className="w-full bg-[#16324F] text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:bg-slate-800"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Uploading...' : 'Upload to Vault'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
