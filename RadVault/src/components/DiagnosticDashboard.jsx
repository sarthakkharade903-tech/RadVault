import React, { useState, useRef } from 'react';
import {
  UploadCloud, FileText, CheckCircle2, RefreshCw, X,
  Search, Calendar, User, Clock, AlertCircle, Eye,
  Download, Filter, ChevronDown, Layers, Activity,
  Building2, Phone, MapPin, Tag, ArrowRight, Zap, Printer,
  Cpu, Check, AlertTriangle, Shield, Sliders, Play, HardDrive,
  FileCheck, Sparkles, Plus, ExternalLink, Camera, Image,
  Microscope, Stethoscope
} from 'lucide-react';
import { SAMPLE_PATIENTS } from './radvault/SampleData';

// ─── Simple Requisitions (Doctor's Requested Tests) ─────────────────────────
const INITIAL_REQUISITIONS = [
  {
    id: 'REQ-101',
    patientId: 'MH-P-10482',
    patientName: 'Ramesh Patil',
    age: 54,
    gender: 'Male',
    village: 'Koregaon, Satara',
    testRequested: 'Chest X-Ray (छातीचा एक्स-रे) & Blood CBC',
    requestedBy: 'Dr. Medical Officer (PHC Shirwal)',
    requestedAt: 'Today 08:30 AM',
    urgency: 'urgent',
    clinicalReason: 'High fever 104°F, crackles in right lung, SpO2 92%',
    status: 'pending' // 'pending' -> 'sample_taken' -> 'done'
  },
  {
    id: 'REQ-102',
    patientId: 'MH-P-10492',
    patientName: 'Anil Deshmukh',
    age: 28,
    gender: 'Male',
    village: 'Patan, Satara',
    testRequested: 'Right Wrist X-Ray (हात/मनगटाचा एक्स-रे)',
    requestedBy: 'Dr. Ortho Specialist (Patan Emergency)',
    requestedAt: 'Today 09:15 AM',
    urgency: 'emergency',
    clinicalReason: 'Tractor fall injury, gross wrist deformity and swelling',
    status: 'sample_taken'
  },
  {
    id: 'REQ-103',
    patientId: 'MH-P-10495',
    patientName: 'Meera Kulkarni',
    age: 48,
    gender: 'Female',
    village: 'Mahabaleshwar',
    testRequested: 'Blood Test - CBC & CRP (रक्ताची तपासणी)',
    requestedBy: 'Dr. Rekha Deshmukh',
    requestedAt: 'Today 10:00 AM',
    urgency: 'urgent',
    clinicalReason: 'Severe joint stiffness and pain in fingers, suspected arthritis flare',
    status: 'pending'
  },
  {
    id: 'REQ-104',
    patientId: 'MH-P-10485',
    patientName: 'Sunita Shinde',
    age: 42,
    gender: 'Female',
    village: 'Wai, Satara',
    testRequested: 'Brain MRI (डोक्याचे एम.आर.आय.)',
    requestedBy: 'Dr. Vivek Kulkarni',
    requestedAt: 'Yesterday 02:00 PM',
    urgency: 'normal',
    clinicalReason: 'Severe recurring migraines with visual aura',
    status: 'done'
  }
];

// ─── Simple Completed Reports ───────────────────────────────────────────────
const INITIAL_REPORTS = [
  {
    id: 'RPT-2026-01',
    patientId: 'MH-P-10482',
    patientName: 'Ramesh Patil',
    age: 54,
    gender: 'Male',
    village: 'Koregaon, Satara',
    reportName: 'Chest X-Ray PA View (छातीचा एक्स-रे)',
    category: 'Radiology (X-Ray)',
    lab: 'Satara District Public Health Diagnostics Center',
    uploadedAt: 'Today 10:15 AM',
    urgency: 'urgent',
    status: 'reviewed', // 'pending', 'reviewed'
    fileName: 'Chest_XRay_Ramesh_Patil.dcm',
    summary: 'Dense consolidation in right lower lung zone. Air bronchograms present. Lobar pneumonia confirmed.',
    doctorComment: 'Bacterial lobar pneumonia confirmed. Antibiotic course + oxygen support started.',
    testValues: [
      { test: 'Right Lung Field', result: 'Lobar Consolidation (निमोनिया)', status: 'critical' },
      { test: 'Left Lung Field', result: 'Clear & Normal', status: 'normal' },
      { test: 'Heart Size (CTR)', result: '48% (Normal < 50%)', status: 'normal' }
    ]
  },
  {
    id: 'RPT-2026-02',
    patientId: 'MH-P-10492',
    patientName: 'Anil Deshmukh',
    age: 28,
    gender: 'Male',
    village: 'Patan, Satara',
    reportName: 'Right Wrist X-Ray (मनगटाचा एक्स-रे)',
    category: 'Radiology (X-Ray)',
    lab: 'Patan Emergency Care Radiology Lab',
    uploadedAt: 'Today 09:45 AM',
    urgency: 'emergency',
    status: 'reviewed',
    fileName: 'Wrist_Fracture_Anil.dcm',
    summary: 'Transverse displaced fracture of distal radius (Colles type). Ulnar styloid intact.',
    doctorComment: 'Closed reduction performed. Plaster slab applied. Follow-up in 1 week.',
    testValues: [
      { test: 'Distal Radius Bone', result: 'Displaced Fracture (हाड मोडले आहे)', status: 'critical' },
      { test: 'Dorsal Tilt', result: '15 degrees', status: 'critical' },
      { test: 'Joint Alignment', result: 'Reduced under local block', status: 'normal' }
    ]
  },
  {
    id: 'RPT-2026-03',
    patientId: 'MH-P-10495',
    patientName: 'Meera Kulkarni',
    age: 48,
    gender: 'Female',
    village: 'Mahabaleshwar',
    reportName: 'Complete Blood Count (CBC) & CRP (रक्त तपासणी)',
    category: 'Pathology / Blood Test',
    lab: 'Rural Public Health Laboratory Karad',
    uploadedAt: 'Today 11:30 AM',
    urgency: 'urgent',
    status: 'pending',
    fileName: 'CBC_CRP_Meera_Kulkarni.pdf',
    summary: 'High WBC count (16,400) and elevated CRP (58.4 mg/L) showing high inflammation.',
    doctorComment: '',
    testValues: [
      { test: 'WBC White Blood Cells', result: '16,400 /uL (High ↑)', status: 'critical' },
      { test: 'CRP Inflammatory Marker', result: '58.4 mg/L (High ↑)', status: 'critical' },
      { test: 'Hemoglobin (Hb)', result: '12.4 g/dL (Normal)', status: 'normal' },
      { test: 'Platelets', result: '2.4 Lakhs (Normal)', status: 'normal' }
    ]
  }
];

export default function DiagnosticDashboard({ onBack, onNavigateToDoctor }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'requests' | 'reports' | 'machines'
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [requisitions, setRequisitions] = useState(INITIAL_REQUISITIONS);

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState(SAMPLE_PATIENTS[0].id);
  const [testCategory, setTestCategory] = useState('X-Ray');
  const [testName, setTestName] = useState('Chest X-Ray PA View (छातीचा एक्स-रे)');
  const [testResultSummary, setTestResultSummary] = useState('');
  const [testUrgency, setTestUrgency] = useState('urgent');
  const [labName, setLabName] = useState('Satara District Diagnostic Center');
  const [pickedFile, setPickedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Report Slip Modal
  const [viewingReport, setViewingReport] = useState(null);

  const fileInputRef = useRef();

  const selectedPatient = SAMPLE_PATIENTS.find(p => p.id === selectedPatientId) || SAMPLE_PATIENTS[0];

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (uploading) return;
    setUploading(true);
    setProgress(30);
    await new Promise(r => setTimeout(r, 200));
    setProgress(70);
    await new Promise(r => setTimeout(r, 250));
    setProgress(100);

    const newRpt = {
      id: `RPT-2026-${Math.floor(100 + Math.random() * 900)}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      age: selectedPatient.age,
      gender: selectedPatient.gender,
      village: selectedPatient.village,
      reportName: testName,
      category: testCategory,
      lab: labName,
      uploadedAt: 'Just Now',
      urgency: testUrgency,
      status: 'pending',
      fileName: pickedFile?.name || `${testName.split(' ')[0]}_Report.pdf`,
      summary: testResultSummary || 'Investigation completed by laboratory technician. Dispatched to doctor for clinical review.',
      doctorComment: '',
      testValues: [
        { test: 'Test Status', result: 'Completed & Processed', status: 'normal' },
        { test: 'Preliminary Finding', result: testUrgency !== 'normal' ? 'Needs Doctor Attention' : 'Normal Range', status: testUrgency !== 'normal' ? 'critical' : 'normal' }
      ]
    };

    setReports(prev => [newRpt, ...prev]);
    setUploading(false);
    setUploadSuccess(true);

    // Also mark requisition done if exists
    setRequisitions(prev => prev.map(r => r.patientId === selectedPatient.id ? { ...r, status: 'done' } : r));

    setTimeout(() => {
      setUploadSuccess(false);
      setPickedFile(null);
      setTestResultSummary('');
      setProgress(0);
      setActiveTab('reports');
    }, 1500);
  };

  const handleUpdateReq = (reqId, newStatus) => {
    setRequisitions(prev => prev.map(r => r.id === reqId ? { ...r, status: newStatus } : r));
  };

  const filteredReports = reports.filter(r =>
    r.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reportName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.village.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const emergencyCount = reports.filter(r => r.urgency === 'emergency').length;
  const pendingReqCount = requisitions.filter(r => r.status !== 'done').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">

      {/* ── Top Header ── */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white text-xl shadow-sm">
            🔬
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-slate-900 text-base tracking-tight">Diagnostic Centre &amp; Lab Portal (तपासणी केंद्र)</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md border border-teal-200">
                Simple &amp; Easy Upload
              </span>
            </div>
            <p className="text-xs text-slate-400">Upload Scans &amp; Blood Tests • Notify Doctor Instantly</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToDoctor && (
            <button
              onClick={onNavigateToDoctor}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors"
            >
              🩺 Doctor Dashboard →
            </button>
          )}
          <button
            onClick={onBack}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            ← Portals Home
          </button>
        </div>
      </header>

      {/* ── Top Action & Summary Bar ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4 w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Doctor Requests</p>
            <p className="text-2xl font-black text-teal-700 mt-0.5">{pendingReqCount} <span className="text-xs text-teal-600 font-bold">To Do</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-lg font-bold">
            📥
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reports Ready</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{reports.length} <span className="text-xs text-slate-500 font-bold">Total</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
            📄
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Waiting for Doctor</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{pendingCount} <span className="text-xs text-amber-500 font-bold">Pending</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-bold">
            ⏳
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Emergency Cases</p>
            <p className="text-2xl font-black text-red-600 mt-0.5">{emergencyCount} <span className="text-xs text-red-500 font-bold">Urgent</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-lg font-bold">
            🚨
          </div>
        </div>
      </section>

      {/* ── Main Tab Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 w-full flex-1">

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 mb-5 bg-white rounded-2xl p-1 shadow-xs gap-1 overflow-x-auto">
          {[
            { key: 'upload', label: '📤 Upload Test Result / Scan (तपासणी निकाल पाठवा)' },
            { key: 'requests', label: `📥 Doctor Test Orders (${pendingReqCount} नवीन मागण्या)` },
            { key: 'reports', label: `📄 View Patient Reports (${reports.length} अहवाल)` },
            { key: 'machines', label: '⚙️ Machine Status (मशीन स्थिती)' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === tab.key
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── TAB 1: SIMPLE UPLOAD FORM ── */}
        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-teal-600" />
                  <span>Send Test Result to Doctor (तपासणी रिपोर्ट पाठवा)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Select the patient, pick test type, attach file or photo, and click Send.</p>
              </div>

              {uploadSuccess ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-emerald-600 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-base text-slate-800">Report Successfully Sent to Doctor!</p>
                    <p className="text-xs text-slate-500 mt-0.5">Doctor will see the report immediately in their inbox.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFileUpload} className="space-y-4">

                  {/* Step 1: Select Patient */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <label className="text-xs font-black text-slate-800 block">
                      1. Select Patient / रुग्ण निवडा
                    </label>
                    <select
                      value={selectedPatientId}
                      onChange={e => setSelectedPatientId(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none bg-white font-bold"
                    >
                      {SAMPLE_PATIENTS.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.gender}, {p.age}y) — Village: {p.village} • ID: {p.id}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700">Current Complaint:</span>
                      <span className="text-amber-700 font-bold">{selectedPatient.criticalAlert}</span>
                    </div>
                  </div>

                  {/* Step 2: Choose Test Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        2. Test Category / तपासणीचा प्रकार
                      </label>
                      <select
                        value={testCategory}
                        onChange={e => {
                          const cat = e.target.value;
                          setTestCategory(cat);
                          if (cat === 'X-Ray') setTestName('Chest X-Ray PA View (छातीचा एक्स-रे)');
                          else if (cat === 'Blood') setTestName('Blood CBC & CRP (रक्ताची तपासणी)');
                          else if (cat === 'MRI') setTestName('Brain MRI Scan (डोक्याचे एम.आर.आय.)');
                          else if (cat === 'Urine') setTestName('Routine Urine Analysis (लघवी तपासणी)');
                        }}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none bg-white"
                      >
                        <option value="X-Ray">🩻 X-Ray (एक्स-रे)</option>
                        <option value="Blood">🩸 Blood Test / CBC (रक्ताची तपासणी)</option>
                        <option value="MRI">🧲 MRI Scan (एम.आर.आय.)</option>
                        <option value="Urine">🧪 Urine Test (लघवी तपासणी)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Test Name / तपासणीचे नाव
                      </label>
                      <input
                        value={testName}
                        onChange={e => setTestName(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none bg-white font-medium"
                      />
                    </div>
                  </div>

                  {/* Step 3: Priority */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Priority Level / तातडीचे आहे का?
                      </label>
                      <select
                        value={testUrgency}
                        onChange={e => setTestUrgency(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none bg-white font-bold"
                      >
                        <option value="normal">🟢 Normal (नेहमीसारखे)</option>
                        <option value="urgent">🟠 Urgent (तातडीचे - 2 तासात बघा)</option>
                        <option value="emergency">🔴 Emergency (अति-तातडीचे - आत्ताच बघा)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Lab Center Name / लॅबचे नाव
                      </label>
                      <input
                        value={labName}
                        onChange={e => setLabName(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none bg-white"
                      />
                    </div>
                  </div>

                  {/* Step 4: Attach File or Photo */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      3. Attach Scan Image or Report PDF / फोटो किंवा फाईल जोडा
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                        pickedFile ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-300 hover:border-teal-500 bg-slate-50'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.dcm,.jpg,.png,.jpeg"
                        onChange={e => { if (e.target.files?.[0]) setPickedFile(e.target.files[0]); }}
                      />

                      {pickedFile ? (
                        <div className="flex flex-col items-center gap-1">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                          <p className="text-xs font-black text-emerald-800">{pickedFile.name}</p>
                          <p className="text-[10px] text-slate-400">Size: {(pickedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to Send</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2">
                            <UploadCloud className="w-8 h-8 text-teal-600" />
                            <Camera className="w-7 h-7 text-slate-400" />
                          </div>
                          <p className="text-xs font-bold text-slate-700">Click to choose PDF, X-Ray photo, or Scan file</p>
                          <p className="text-[10px] text-slate-400">Supports PDF, Image (JPG/PNG), or DICOM</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 5: Simple Findings Notes */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      4. Short Notes / निष्कर्ष (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={testResultSummary}
                      onChange={e => setTestResultSummary(e.target.value)}
                      placeholder="Type short finding (e.g. Infection seen, bone fracture identified, normal blood count...)"
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500 bg-white placeholder-slate-400"
                    />
                  </div>

                  {uploading && (
                    <div className="space-y-1 bg-teal-50 p-2.5 rounded-xl border border-teal-200">
                      <div className="flex justify-between text-xs text-teal-800 font-bold">
                        <span>Uploading report to Doctor...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 bg-teal-200 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-extrabold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 text-xs"
                  >
                    {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    <span>{uploading ? 'Sending Report...' : '✅ Send Report to Doctor Now'}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Quick Helper Sidebar */}
            <div className="space-y-4">
              <div className="bg-gradient-to-b from-teal-800 to-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
                <h4 className="font-extrabold text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-teal-400" />
                  <span>Simple Instructions (मार्गदर्शक सूचना)</span>
                </h4>
                <div className="space-y-2 text-xs text-teal-100">
                  <p>1. <strong>Select Patient</strong> from the list.</p>
                  <p>2. <strong>Attach Scan or PDF</strong> from computer/phone.</p>
                  <p>3. Click <strong>Send</strong> — Doctor receives it in live queue.</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Pending Doctor Orders</h4>
                {requisitions.slice(0, 3).map(req => (
                  <div key={req.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{req.patientName}</span>
                      <span className={`text-[10px] uppercase font-bold ${req.urgency === 'emergency' ? 'text-red-600' : 'text-amber-600'}`}>
                        {req.urgency}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{req.testRequested}</p>
                    <button
                      onClick={() => {
                        setSelectedPatientId(req.patientId);
                        setTestName(req.testRequested);
                        setActiveTab('upload');
                      }}
                      className="mt-1.5 text-[10px] font-bold text-teal-700 hover:underline flex items-center gap-1"
                    >
                      Fill this report →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: DOCTOR TEST REQUESTS ── */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Tests Ordered by Doctors (डॉक्टरांनी मागवलेल्या तपासण्या)</h3>
                <p className="text-xs text-slate-400">Click on any request to collect sample or upload report</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-200">
                {requisitions.length} Total Requests
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requisitions.map(req => (
                <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">{req.id}</span>
                      <h4 className="font-bold text-slate-900 text-base mt-0.5">{req.patientName} ({req.age}y, {req.gender})</h4>
                      <p className="text-xs text-slate-400">{req.village}</p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase border ${
                      req.urgency === 'emergency' ? 'bg-red-50 text-red-700 border-red-200' :
                      req.urgency === 'urgent' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {req.urgency}
                    </span>
                  </div>

                  <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs space-y-1">
                    <p className="font-extrabold text-teal-950 text-sm">{req.testRequested}</p>
                    <p className="text-slate-600 text-xs mt-0.5">Reason: <em>"{req.clinicalReason}"</em></p>
                    <p className="text-[10px] text-slate-400 mt-1">Ordered by: <strong>{req.requestedBy}</strong> • {req.requestedAt}</p>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-600 font-bold">
                      Status: <strong className={req.status === 'done' ? 'text-emerald-600' : 'text-amber-600'}>
                        {req.status === 'done' ? '✅ Completed' : req.status === 'sample_taken' ? '🟡 Sample Taken' : '⏳ Pending'}
                      </strong>
                    </span>
                    <div className="flex gap-2">
                      {req.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateReq(req.id, 'sample_taken')}
                          className="px-3 py-1 bg-amber-50 text-amber-700 font-bold text-xs rounded-lg hover:bg-amber-100 border border-amber-200"
                        >
                          Mark Sample Taken
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedPatientId(req.patientId);
                          setTestName(req.testRequested);
                          setActiveTab('upload');
                        }}
                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs"
                      >
                        <UploadCloud className="w-3.5 h-3.5" /> Upload Result
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: PATIENT REPORTS LIST ── */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by patient name, village, or test..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-slate-800 font-medium"
                />
              </div>
              <span className="text-xs font-bold text-slate-500">
                {filteredReports.length} Reports Found
              </span>
            </div>

            <div className="space-y-3">
              {filteredReports.map(rpt => (
                <div
                  key={rpt.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-teal-300 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xl flex-shrink-0">
                      {rpt.category.includes('X-Ray') ? '🩻' : rpt.category.includes('Blood') ? '🩸' : '📄'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-extrabold text-slate-900 text-base">{rpt.patientName}</h4>
                        <span className="text-xs font-mono font-bold text-slate-400">{rpt.patientId}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase border ${
                          rpt.urgency === 'emergency' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {rpt.urgency}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          rpt.status === 'reviewed' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {rpt.status === 'reviewed' ? '✅ Doctor Checked' : '⏳ Awaiting Doctor'}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-700">{rpt.reportName} — <span className="font-normal text-slate-500">{rpt.fileName}</span></p>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rpt.summary}</p>

                      {rpt.doctorComment && (
                        <div className="mt-2.5 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs">
                          <p className="font-bold text-blue-900 mb-0.5">🩺 Doctor's Assessment:</p>
                          <p className="text-blue-800">{rpt.doctorComment}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end justify-between gap-2 flex-shrink-0">
                    <p className="text-[11px] text-slate-400">{rpt.uploadedAt}</p>
                    <button
                      onClick={() => setViewingReport(rpt)}
                      className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-teal-200"
                    >
                      <Eye className="w-3.5 h-3.5" /> View / Print Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: MACHINES STATUS ── */}
        {activeTab === 'machines' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Diagnostic Equipment Status (मशीन स्थिती)</h3>
                <p className="text-xs text-slate-400">Status of X-Ray, Blood Analyzers, and MRI machines</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: 'Siemens Digital X-Ray Machine', loc: 'Room 1', status: 'Online & Ready 🟢', uptime: '100%' },
                { name: 'Sysmex Blood Testing Machine (CBC)', loc: 'Pathology Lab', status: 'Online & Ready 🟢', uptime: '99.5%' },
                { name: 'GE 1.5T MRI Scanner', loc: 'MRI Suite', status: 'Online & Ready 🟢', uptime: '98.8%' },
                { name: 'Biochemistry Analyzer', loc: 'Pathology Lab', status: 'Under Routine QC 🟡', uptime: '95%' }
              ].map((m, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900 text-sm">{m.name}</h4>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{m.status}</span>
                  </div>
                  <p className="text-xs text-slate-500">Location: {m.loc} • Uptime: {m.uptime}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ── REPORT PRINT SLIP MODAL ── */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-teal-700 to-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-black text-base">🏥 Official Diagnostic Test Report</h3>
                <p className="text-xs text-teal-200">Directorate of Health Services • Government of Maharashtra</p>
              </div>
              <button onClick={() => setViewingReport(null)} className="p-1 hover:bg-white/10 rounded-lg text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div><span className="text-slate-400 font-bold block">Patient Name</span><span className="font-extrabold text-sm text-slate-900">{viewingReport.patientName}</span></div>
                <div><span className="text-slate-400 font-bold block">Patient ID</span><span className="font-mono font-bold text-teal-700">{viewingReport.patientId}</span></div>
                <div><span className="text-slate-400 font-bold block">Age / Gender</span><span className="font-bold">{viewingReport.age}y / {viewingReport.gender}</span></div>
                <div><span className="text-slate-400 font-bold block">Village</span><span className="font-bold">{viewingReport.village}</span></div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Investigation Conducted</p>
                <p className="text-sm font-black text-slate-900">{viewingReport.reportName}</p>
                <p className="text-xs text-slate-500">Center: {viewingReport.lab} • Date: {viewingReport.uploadedAt}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Test Finding Summary</p>
                <p className="text-xs leading-relaxed text-slate-800 font-medium">{viewingReport.summary}</p>
              </div>

              {viewingReport.testValues && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold">
                      <tr>
                        <th className="text-left p-2.5">Test Parameter</th>
                        <th className="text-left p-2.5">Result</th>
                        <th className="text-right p-2.5">Evaluation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingReport.testValues.map((tv, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-semibold text-slate-800">{tv.test}</td>
                          <td className="p-2.5 font-bold">{tv.result}</td>
                          <td className="p-2.5 text-right font-black uppercase text-[10px]">
                            <span className={tv.status === 'critical' ? 'text-red-600' : 'text-emerald-600'}>
                              {tv.status === 'critical' ? '⚠️ Attention Needed' : '✅ Normal'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {viewingReport.doctorComment && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="font-bold text-blue-900 mb-0.5">🩺 Doctor's Review &amp; Instructions:</p>
                  <p className="text-blue-800">{viewingReport.doctorComment}</p>
                </div>
              )}
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-2">
              <button onClick={() => setViewingReport(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-xl">
                Close
              </button>
              <button onClick={() => window.print()} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Print Official Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
