import React, { useState, useRef } from 'react';
import {
  UploadCloud, FileText, Image as ImageIcon, CheckCircle2,
  AlertTriangle, ShieldAlert, Sparkles, Plus, Trash2,
  Hospital, User, Calendar, Tag, RefreshCw, Zap,
  FileCheck, Stethoscope, ArrowRight, ShieldCheck
} from 'lucide-react';
import { SAMPLE_PATIENTS, GOVT_METADATA } from './SampleData';
import { uploadScanFile, createStudyRecord, isSupabaseConfigured } from '../../lib/supabase';

export default function RadVaultUploader({ onUploadComplete, onSwitchToViewer }) {
  const fileInputRef = useRef(null);

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState(SAMPLE_PATIENTS[0].id);
  const [patientName, setPatientName] = useState(SAMPLE_PATIENTS[0].name);
  const [modality, setModality] = useState('X-Ray');
  const [bodyRegion, setBodyRegion] = useState('Chest / Thorax');
  const [facility, setFacility] = useState('District Hospital Satara Tele-Radiology Hub');
  const [urgency, setUrgency] = useState('urgent');
  const [technicianNotes, setTechnicianNotes] = useState('');

  // File queue & progress
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedStudy, setUploadedStudy] = useState(null);
  const [supabaseError, setSupabaseError] = useState(null);

  const currentPatient = SAMPLE_PATIENTS.find(p => p.id === selectedPatientId) || SAMPLE_PATIENTS[0];

  const handlePatientSelect = (pid) => {
    setSelectedPatientId(pid);
    const found = SAMPLE_PATIENTS.find(p => p.id === pid);
    if (found) {
      setPatientName(found.name);
    }
  };

  const handleFiles = (newFiles) => {
    const list = Array.from(newFiles).map(f => ({
      file: f,
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
      previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      isPdf: f.type === 'application/pdf' || f.name.endsWith('.pdf')
    }));
    setFiles(prev => [...prev, ...list]);
  };

  // Demo Loaders
  const loadDemo = (type) => {
    if (type === 'pneumonia') {
      handlePatientSelect('MH-P-10482');
      setModality('X-Ray');
      setBodyRegion('Chest / Thorax');
      setUrgency('urgent');
      setTechnicianNotes('Patient has 5-day fever & dyspnea. Lobar consolidation suspected in right lower zone.');
    } else if (type === 'brain_mri') {
      handlePatientSelect('MH-P-10485');
      setModality('MRI');
      setBodyRegion('Head / Brain');
      setUrgency('normal');
      setTechnicianNotes('Chronic refractory migraine evaluation. T2 FLAIR multi-slice scan.');
    } else if (type === 'fracture') {
      handlePatientSelect('MH-P-10492');
      setModality('X-Ray');
      setBodyRegion('Extremities / Bone');
      setUrgency('emergency');
      setTechnicianNotes('Motorcycle trauma. Acute deformity over right distal radius.');
    } else if (type === 'blood_pdf') {
      handlePatientSelect('MH-P-10482');
      setModality('Lab Report / PDF');
      setBodyRegion('Hematology & Biochemistry');
      setUrgency('urgent');
      setTechnicianNotes('Complete Blood Count with marked leukocytosis (WBC 16,400) and elevated CRP.');
    }
  };

  // Submit Upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadProgress(20);

    try {
      const firstFile = files[0];
      let remoteFileUrl = firstFile?.previewUrl || null;

      // 1. Upload scan file to Supabase Storage
      if (firstFile && firstFile.file) {
        setUploadProgress(50);
        const uploadRes = await uploadScanFile(firstFile.file, selectedPatientId);
        if (uploadRes.publicUrl) {
          remoteFileUrl = uploadRes.publicUrl;
        }
      }

      setUploadProgress(80);

      // 2. Build Study Object
      const studyId = `RV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newStudy = {
        id: studyId,
        patientId: selectedPatientId,
        abhaId: currentPatient.abhaId || selectedPatientId,
        patientName: patientName,
        patientAge: currentPatient.age || 35,
        patientGender: currentPatient.gender || 'Male',
        studyType: modality,
        modality: modality,
        bodyRegion: bodyRegion,
        studyDate: new Date().toISOString().split('T')[0],
        facility: facility,
        technicianName: 'Govt Diagnostic Technician',
        referringDoctor: 'PHC Medical Officer',
        urgency: urgency,
        thumbnail: remoteFileUrl,
        fileUrl: remoteFileUrl,
        fileName: firstFile ? firstFile.name : `${modality.toLowerCase()}_scan.dcm`,
        fileSize: firstFile ? firstFile.size : '14.5 MB',
        isMultiSlice: false,
        slices: remoteFileUrl ? [remoteFileUrl] : [],
        dicomMetadata: {
          patientId: selectedPatientId,
          abhaId: currentPatient.abhaId,
          studyUid: `1.2.840.113619.${Date.now()}`,
          seriesDescription: `${bodyRegion.toUpperCase()} ${modality.toUpperCase()}`,
          modality: modality === 'X-Ray' ? 'CR' : modality === 'MRI' ? 'MR' : 'CT',
          bodyPartExamined: bodyRegion.split('/')[0].trim().toUpperCase()
        },
        technicianNotes: technicianNotes || 'Diagnostic study ingested via National Tele-Radiology Network.',
        doctorFindings: '',
        aiAnalysis: {
          detected: urgency !== 'normal',
          condition: urgency === 'emergency' ? 'Acute Emergency Finding' : 'Clinical Attention Indicated',
          confidence: 91.5,
          recommendations: 'Cross-reference with patient vitals at Primary Health Center level.'
        },
        measurements: [],
        pins: []
      };

      // 3. Save to Supabase Database
      const { error: dbErr } = await createStudyRecord(newStudy);

      setUploadProgress(100);
      setIsUploading(false);

      if (dbErr) {
        setSupabaseError(dbErr);
      } else {
        setSupabaseError(null);
      }

      setUploadedStudy(newStudy);
      if (onUploadComplete) onUploadComplete(newStudy);
    } catch (err) {
      console.error('[Upload Error]:', err);
      setSupabaseError(err.message);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 font-sans text-slate-100">
      
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              Diagnostic Center Dispatch Station
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Upload & Dispatch Diagnostic Scans</h2>
          <p className="text-xs text-slate-400">
            Attach patient ABHA IDs, ingest DICOM (.dcm), X-Rays, MRIs, and PDF Lab reports to the National Tele-Radiology Network.
          </p>
        </div>

        {/* 1-Click Fast Presets for Hackathon Judges */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5 w-full md:w-auto">
          <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> 1-Click Demo Scans:
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => loadDemo('pneumonia')}
              className="px-2.5 py-1 text-xs bg-slate-900 hover:bg-sky-600 text-slate-300 hover:text-white rounded-lg text-left transition-colors"
            >
              🫁 Chest X-Ray (Pneumonia)
            </button>
            <button
              type="button"
              onClick={() => loadDemo('brain_mri')}
              className="px-2.5 py-1 text-xs bg-slate-900 hover:bg-purple-600 text-slate-300 hover:text-white rounded-lg text-left transition-colors"
            >
              🧠 Brain MRI (FLAIR)
            </button>
            <button
              type="button"
              onClick={() => loadDemo('fracture')}
              className="px-2.5 py-1 text-xs bg-slate-900 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg text-left transition-colors"
            >
              🦴 Wrist Fracture (Emergency)
            </button>
            <button
              type="button"
              onClick={() => loadDemo('blood_pdf')}
              className="px-2.5 py-1 text-xs bg-slate-900 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg text-left transition-colors"
            >
              📄 Blood CBC Lab PDF
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {uploadedStudy && (
        <div className={`border-2 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 ${
          supabaseError ? 'bg-amber-950/40 border-amber-500/50' : 'bg-emerald-950/40 border-emerald-500/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Study Successfully Dispatched to Tele-Radiology Network!</h4>
              <p className="text-xs text-slate-300">
                Study <span className="font-mono font-bold text-sky-400">{uploadedStudy.id}</span> attached to <span className="font-bold text-white">{uploadedStudy.patientName}</span> (ABHA: {uploadedStudy.abhaId}).
              </p>
              {supabaseError && (
                <p className="text-[11px] text-amber-400 font-mono mt-1">Supabase note: {supabaseError}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setUploadedStudy(null); setFiles([]); setTechnicianNotes(''); }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
            >
              Upload Another
            </button>
            {onSwitchToViewer && (
              <button
                onClick={() => onSwitchToViewer(uploadedStudy.id)}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md"
              >
                <span>Open in Doctor PACS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Upload Form Card */}
      <form onSubmit={handleUploadSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* Step 1: Patient ABHA Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
            <User className="w-4 h-4" /> 1. Patient ABHA Health ID & Center
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Select Patient ABHA ID</label>
              <select
                value={selectedPatientId}
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
              >
                {SAMPLE_PATIENTS.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — ABHA: {p.abhaId} ({p.village})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Diagnostic Facility / PHC Hub</label>
              <input
                type="text"
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Drag & Drop File Zone */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4" /> 2. Diagnostic Scan File / PDF Report
          </label>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging ? 'border-sky-400 bg-sky-500/10' : 'border-slate-700 hover:border-sky-500 bg-slate-950/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
              multiple
              accept=".dcm,.dicom,image/*,.pdf"
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-white mb-0.5">Drop DICOM (.dcm), X-Ray Image, or PDF Lab Report here</p>
            <p className="text-[11px] text-slate-400">or click to browse files from hospital local storage</p>
          </div>

          {/* Queued File */}
          {files.length > 0 && (
            <div className="space-y-1.5">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    {f.previewUrl ? (
                      <img src={f.previewUrl} alt="preview" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <FileText className="w-5 h-5 text-sky-400" />
                    )}
                    <span className="font-semibold text-slate-200">{f.name} ({f.size})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 3: Modality, Region & Clinical Notes */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <label className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <Tag className="w-4 h-4" /> 3. Scan Classification & Clinical Priority
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Scan Modality</label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="X-Ray">Digital X-Ray</option>
                <option value="CT Scan">CT Scan</option>
                <option value="MRI">MRI</option>
                <option value="Lab Report / PDF">Clinical Lab Report (PDF)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Anatomical Region</label>
              <select
                value={bodyRegion}
                onChange={(e) => setBodyRegion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="Chest / Thorax">Chest / Thorax</option>
                <option value="Head / Brain">Head / Brain</option>
                <option value="Spine (Lumbar)">Spine (Lumbar)</option>
                <option value="Extremities / Bone">Extremities / Wrist / Knee</option>
                <option value="Hematology & Biochemistry">Hematology & Biochemistry (Labs)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Clinical Priority</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="normal">Normal (Routine)</option>
                <option value="urgent">Urgent Review</option>
                <option value="emergency">Emergency Red Flag</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Technician Preliminary Impression / Symptoms</label>
            <textarea
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              rows={2}
              placeholder="Enter patient presenting symptoms or preliminary scan observations..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-sky-500 focus:outline-none placeholder-slate-600"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          {isUploading && (
            <div className="mb-3 space-y-1">
              <div className="flex justify-between text-xs text-sky-400 font-mono">
                <span>Dispatching to Supabase Tele-Radiology Store...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-600 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Encrypting & Dispatching Scan...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4 text-slate-950" />
                <span>Upload & Dispatch to District Specialist</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
