import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Calendar, User, Hospital, AlertTriangle,
  CheckCircle2, ShieldAlert, Sparkles, Sliders, Move,
  Ruler, MapPin, Download, SplitSquareVertical, Activity,
  FileText, Maximize2, RefreshCw, Stethoscope, Printer,
  X, Plus, Info, Layers, ZoomIn, ZoomOut, RotateCw,
  Sun, Moon, Eye, Shield, Phone, QrCode
} from 'lucide-react';
import { SAMPLE_PATIENTS, GOVT_METADATA } from './SampleData';
import { updateStudyInSupabase } from '../../lib/supabase';

export default function RadVaultViewer({ studies = [], onUpdateStudy, initialPatientId = null }) {
  // State
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || SAMPLE_PATIENTS[0].id);
  const [selectedStudyId, setSelectedStudyId] = useState(null);
  const [activeTab, setActiveTab] = useState('scan'); // 'scan', 'measure', 'ai', 'report'

  // Viewer Controls
  const [activeTool, setActiveTool] = useState('pan'); // 'pan', 'ruler'
  const [windowPreset, setWindowPreset] = useState('default');
  const [zoom, setZoom] = useState(1.0);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [showAiOverlay, setShowAiOverlay] = useState(true);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Caliper Measurements & Notes
  const [isDrawingRuler, setIsDrawingRuler] = useState(false);
  const [rulerStart, setRulerStart] = useState(null);
  const [currentRulerMouse, setCurrentRulerMouse] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const viewportRef = useRef(null);

  // Current Patient & Studies
  const currentPatient = SAMPLE_PATIENTS.find(p => p.id === selectedPatientId) || SAMPLE_PATIENTS[0];
  const patientStudies = studies.filter(s => s.patientId === selectedPatientId);
  const currentStudy = studies.find(s => s.id === selectedStudyId) || patientStudies[0] || studies[0];

  useEffect(() => {
    if (patientStudies.length > 0 && (!selectedStudyId || !patientStudies.some(s => s.id === selectedStudyId))) {
      setSelectedStudyId(patientStudies[0].id);
    }
  }, [selectedPatientId, studies]);

  useEffect(() => {
    if (currentStudy) {
      setMeasurements(currentStudy.measurements || []);
      setDoctorNotes(currentStudy.doctorFindings || '');
      resetViewport();
    }
  }, [currentStudy?.id]);

  const resetViewport = () => {
    setZoom(1.0);
    setPanPos({ x: 0, y: 0 });
    setWindowPreset('default');
  };

  // Caliper Drawing
  const handleMouseDown = (e) => {
    if (activeTool === 'pan') {
      setIsDraggingPan(true);
      setDragStart({ x: e.clientX - panPos.x, y: e.clientY - panPos.y });
    } else if (activeTool === 'ruler') {
      const rect = viewportRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - panPos.x) / zoom;
      const y = (e.clientY - rect.top - panPos.y) / zoom;
      setIsDrawingRuler(true);
      setRulerStart({ x, y });
      setCurrentRulerMouse({ x, y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDraggingPan && activeTool === 'pan') {
      setPanPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (isDrawingRuler && activeTool === 'ruler') {
      const rect = viewportRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - panPos.x) / zoom;
      const y = (e.clientY - rect.top - panPos.y) / zoom;
      setCurrentRulerMouse({ x, y });
    }
  };

  const handleMouseUp = () => {
    if (isDraggingPan) {
      setIsDraggingPan(false);
    } else if (isDrawingRuler && rulerStart && currentRulerMouse) {
      const dx = currentRulerMouse.x - rulerStart.x;
      const dy = currentRulerMouse.y - rulerStart.y;
      const pixelDist = Math.sqrt(dx * dx + dy * dy);
      const distanceMm = (pixelDist * 0.28).toFixed(1);

      if (pixelDist > 12) {
        const newRuler = {
          id: `m_${Date.now()}`,
          p1: rulerStart,
          p2: currentRulerMouse,
          distanceMm: Number(distanceMm),
          label: `${distanceMm} mm`
        };
        const updated = [...measurements, newRuler];
        setMeasurements(updated);
        if (onUpdateStudy && currentStudy) onUpdateStudy(currentStudy.id, { measurements: updated });
        if (currentStudy) updateStudyInSupabase(currentStudy.id, { measurements: updated });
      }
      setIsDrawingRuler(false);
      setRulerStart(null);
      setCurrentRulerMouse(null);
    }
  };

  const handleDeleteMeasurement = (id) => {
    const updated = measurements.filter(m => m.id !== id);
    setMeasurements(updated);
    if (onUpdateStudy && currentStudy) onUpdateStudy(currentStudy.id, { measurements: updated });
    if (currentStudy) updateStudyInSupabase(currentStudy.id, { measurements: updated });
  };

  const handleSaveNotes = () => {
    if (onUpdateStudy && currentStudy) {
      onUpdateStudy(currentStudy.id, { doctorFindings: doctorNotes });
      updateStudyInSupabase(currentStudy.id, { doctorFindings: doctorNotes });
    }
  };

  // Filter styles
  const getFilterStyle = () => {
    let b = 100, c = 100, inv = false;
    if (windowPreset === 'bone') { b = 125; c = 175; }
    if (windowPreset === 'lung') { b = 85; c = 150; }
    if (windowPreset === 'soft_tissue') { b = 110; c = 130; }
    if (windowPreset === 'inverted') { inv = true; }
    return {
      filter: `brightness(${b}%) contrast(${c}%) ${inv ? 'invert(1)' : ''}`,
      transform: `scale(${zoom}) translate(${panPos.x / zoom}px, ${panPos.y / zoom}px)`,
      transition: isDraggingPan ? 'none' : 'transform 0.1s ease-out'
    };
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 font-sans text-slate-100">
      
      {/* 1. Official Government Patient ABHA Health Card Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-700 flex flex-col items-center justify-center font-bold text-white shadow-md border border-sky-400/30">
            <span className="text-xs uppercase font-medium text-sky-200">Patient</span>
            <span className="text-lg leading-none">{currentPatient.name.split(' ')[0][0]}{currentPatient.name.split(' ')[1]?.[0] || ''}</span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-white tracking-tight">{currentPatient.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/30">
                ABHA ID: {currentPatient.abhaId || currentPatient.id}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-semibold">
                {currentPatient.age} Yrs / {currentPatient.gender}
              </span>
            </div>

            <p className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>📍 {currentPatient.village}</span>
              <span>•</span>
              <span>Blood Group: <strong className="text-rose-400">{currentPatient.bloodGroup}</strong></span>
              <span>•</span>
              <span>PHC: <strong className="text-slate-200">{currentPatient.phcCenter || 'District Hospital Satara'}</strong></span>
            </p>
          </div>
        </div>

        {/* Patient Switcher */}
        <div className="flex items-center gap-2 self-end md:self-center">
          <span className="text-xs text-slate-400 font-medium">Select Patient:</span>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:border-sky-500 focus:outline-none shadow-sm"
          >
            {SAMPLE_PATIENTS.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Main Clinical Workstation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: Study Selector (3 Cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-400" />
              Patient Scans & Reports ({patientStudies.length})
            </h3>

            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {patientStudies.map((study) => {
                const isSelected = study.id === currentStudy?.id;
                return (
                  <div
                    key={study.id}
                    onClick={() => setSelectedStudyId(study.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-950/50 border-sky-500 shadow-md shadow-sky-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-xs font-bold text-slate-200">{study.modality} - {study.bodyRegion}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        study.urgency === 'emergency'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : study.urgency === 'urgent'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {study.urgency}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {study.thumbnail ? (
                        <img src={study.thumbnail} alt="thumb" className="w-12 h-12 rounded-lg object-cover bg-black border border-slate-800 flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 flex-shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}
                      <div className="text-xs overflow-hidden">
                        <p className="text-slate-400 text-[11px]">Date: {study.studyDate}</p>
                        <p className="text-slate-500 text-[11px] truncate">{study.facility?.split(' ')[0]} Hub</p>
                        {study.aiAnalysis?.detected && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-purple-400 font-semibold mt-1">
                            <Sparkles className="w-3 h-3" /> AI {study.aiAnalysis.confidence}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Clean Medical Viewport & Simple Toolbar (6 Cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg flex flex-col overflow-hidden">
          
          {/* Simple, Intuitive Toolbar */}
          <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            
            {/* Primary Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTool('pan')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTool === 'pan' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
                title="Pan and Drag Image"
              >
                <Move className="w-3.5 h-3.5" />
                <span>Pan / Zoom</span>
              </button>

              <button
                onClick={() => setActiveTool('ruler')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTool === 'ruler' ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
                title="Click and drag over lesion to measure distance in mm"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Measure (Caliper)</span>
              </button>
            </div>

            {/* Presets & AI */}
            <div className="flex items-center gap-1.5">
              <select
                value={windowPreset}
                onChange={(e) => setWindowPreset(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:border-sky-500 focus:outline-none"
              >
                <option value="default">Default View</option>
                <option value="lung">Lung Window</option>
                <option value="bone">Bone Detail</option>
                <option value="soft_tissue">Soft Tissue</option>
                <option value="inverted">Inverted Film</option>
              </select>

              <button
                onClick={() => setShowAiOverlay(!showAiOverlay)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all ${
                  showAiOverlay ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Assist</span>
              </button>

              <button
                onClick={resetViewport}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-800"
                title="Reset View"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Viewport Canvas */}
          <div
            ref={viewportRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`flex-1 min-h-[460px] max-h-[540px] relative bg-black flex items-center justify-center overflow-hidden select-none ${
              activeTool === 'pan' ? (isDraggingPan ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'
            }`}
          >
            {currentStudy?.modality === 'Lab Report / PDF' ? (
              /* Verified Lab Report Sheet */
              <div className="w-full h-full p-5 overflow-y-auto bg-slate-950 text-slate-200">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{currentStudy.fileName}</h4>
                        <p className="text-[11px] text-slate-400">{currentStudy.facility}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full font-bold border border-emerald-500/30">
                      ABDM Verified Report
                    </span>
                  </div>

                  {currentStudy.labResults && (
                    <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="p-2.5">Test Parameter</th>
                            <th className="p-2.5">Result</th>
                            <th className="p-2.5">Normal Range</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {Object.entries(currentStudy.labResults).map(([key, item]) => (
                            <tr key={key}>
                              <td className="p-2.5 font-medium text-slate-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</td>
                              <td className="p-2.5 font-bold font-mono text-white">{item.value} <span className="text-slate-400 font-normal">{item.unit}</span></td>
                              <td className="p-2.5 text-slate-400 font-mono">{item.ref}</td>
                              <td className="p-2.5">
                                {item.status === 'high' ? (
                                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] border border-rose-500/40">HIGH</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/40">NORMAL</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* High Clarity Image Viewport with SVG Caliper Overlay */
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={currentStudy?.fileUrl}
                  alt="Medical scan"
                  className="max-h-[90%] max-w-[90%] object-contain pointer-events-none"
                  style={getFilterStyle()}
                />

                {/* SVG Overlay for Caliper Rulers and AI Bounding Boxes */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{
                    transform: `translate(${panPos.x}px, ${panPos.y}px) scale(${zoom})`,
                    transformOrigin: 'center center'
                  }}
                >
                  {/* AI CADx Bounding Box */}
                  {showAiOverlay && currentStudy?.aiAnalysis?.detected && currentStudy.aiAnalysis.boundingCoords && (
                    <g>
                      <rect
                        x={currentStudy.aiAnalysis.boundingCoords.x}
                        y={currentStudy.aiAnalysis.boundingCoords.y}
                        width={currentStudy.aiAnalysis.boundingCoords.width}
                        height={currentStudy.aiAnalysis.boundingCoords.height}
                        fill="rgba(168, 85, 247, 0.18)"
                        stroke="#c084fc"
                        strokeWidth="2.5"
                        strokeDasharray="6,4"
                        rx="6"
                      />
                      <rect
                        x={currentStudy.aiAnalysis.boundingCoords.x}
                        y={currentStudy.aiAnalysis.boundingCoords.y - 24}
                        width={180}
                        height={22}
                        fill="rgba(88, 28, 135, 0.9)"
                        rx="4"
                      />
                      <text
                        x={currentStudy.aiAnalysis.boundingCoords.x + 6}
                        y={currentStudy.aiAnalysis.boundingCoords.y - 8}
                        fill="#f3e8ff"
                        fontFamily="sans-serif"
                        fontSize="11"
                        fontWeight="bold"
                      >
                        AI: {currentStudy.aiAnalysis.confidence}% {currentStudy.aiAnalysis.condition.slice(0, 15)}
                      </text>
                    </g>
                  )}

                  {/* Saved Calipers */}
                  {measurements.map((m) => (
                    <g key={m.id}>
                      <line x1={m.p1.x} y1={m.p1.y} x2={m.p2.x} y2={m.p2.y} stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx={m.p1.x} cy={m.p1.y} r="4" fill="#10b981" />
                      <circle cx={m.p2.x} cy={m.p2.y} r="4" fill="#10b981" />
                      <rect x={(m.p1.x + m.p2.x) / 2 - 28} y={(m.p1.y + m.p2.y) / 2 - 16} width="56" height="18" fill="rgba(6, 78, 59, 0.95)" rx="4" />
                      <text x={(m.p1.x + m.p2.x) / 2} y={(m.p1.y + m.p2.y) / 2 - 3} fill="#a7f3d0" fontSize="10" fontWeight="bold" textAnchor="middle">{m.label}</text>
                    </g>
                  ))}

                  {/* Active drawing ruler */}
                  {isDrawingRuler && rulerStart && currentRulerMouse && (
                    <g>
                      <line x1={rulerStart.x} y1={rulerStart.y} x2={currentRulerMouse.x} y2={currentRulerMouse.y} stroke="#38bdf8" strokeWidth="2" strokeDasharray="4,2" />
                      <circle cx={rulerStart.x} cy={rulerStart.y} r="4" fill="#38bdf8" />
                      <circle cx={currentRulerMouse.x} cy={currentRulerMouse.y} r="4" fill="#38bdf8" />
                    </g>
                  )}
                </svg>
              </div>
            )}
          </div>

          {/* Viewport Footer Info */}
          <div className="bg-slate-950/90 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>{currentStudy?.modality} • {currentStudy?.bodyRegion}</span>
            <span>{currentStudy?.facility?.split(' ')[0]} Tele-Radiology</span>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Summary, Calipers, Doctor Findings & Slip Generator (3 Cols) */}
        <div className="lg:col-span-3 space-y-3">
          
          {/* AI CADx Diagnostic Card */}
          {currentStudy?.aiAnalysis?.detected && (
            <div className="bg-gradient-to-b from-purple-950/40 to-slate-900 border border-purple-500/40 rounded-2xl p-4 space-y-2 shadow-md">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" /> AI Diagnostic Summary
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold border border-purple-500/30">
                  {currentStudy.aiAnalysis.confidence}% Accuracy
                </span>
              </div>
              <p className="text-xs font-bold text-white">{currentStudy.aiAnalysis.condition}</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">{currentStudy.aiAnalysis.recommendations}</p>
            </div>
          )}

          {/* Caliper Measurements Box */}
          {measurements.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5" /> Caliper Lesion Measurements
              </span>
              <div className="space-y-1">
                {measurements.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 bg-slate-950 rounded-lg text-xs border border-slate-800">
                    <span className="font-mono font-bold text-emerald-300">{m.distanceMm} mm</span>
                    <button onClick={() => handleDeleteMeasurement(m.id)} className="text-slate-500 hover:text-rose-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctor Interpretation Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-sky-400" /> Radiologist Interpretation
              </span>
              <button
                onClick={handleSaveNotes}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] rounded-lg transition-colors"
              >
                Save
              </button>
            </div>

            <textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              rows={4}
              placeholder="Type official clinical finding & diagnostic notes..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-sky-500 focus:outline-none placeholder-slate-600 leading-relaxed"
            />
          </div>

          {/* Official Govt Consultation Slip Generator */}
          <button
            onClick={() => setShowPrintModal(true)}
            className="w-full py-3 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Printer className="w-4 h-4" />
            <span>Generate Official Tele-Radiology Slip</span>
          </button>
        </div>
      </div>

      {/* 3. Official Government Tele-Radiology Report Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-slate-300 font-sans">
            
            {/* Govt Letterhead Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🏛️</span>
                  <div>
                    <h3 className="text-base font-black uppercase text-slate-900 tracking-tight">
                      Government of Maharashtra • Public Health Department
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      Ayushman Bharat Digital Mission (ABDM) • Tele-Radiology Diagnostic Network
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Credentials Block */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100 p-4 rounded-xl text-xs border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Patient Name</span>
                <span className="font-bold text-slate-900 text-sm">{currentPatient.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">ABHA Health ID</span>
                <span className="font-mono font-bold text-blue-700 text-xs">{currentPatient.abhaId}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Age / Gender</span>
                <span className="font-bold text-slate-800">{currentPatient.age} Yrs / {currentPatient.gender}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Date of Scan</span>
                <span className="font-bold text-slate-800">{currentStudy?.studyDate}</span>
              </div>
            </div>

            {/* Diagnostic Report Content */}
            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-0.5">Examination & Facility:</span>
                <p className="text-slate-900 font-semibold">{currentStudy?.modality} ({currentStudy?.bodyRegion}) — {currentStudy?.facility}</p>
              </div>

              {measurements.length > 0 && (
                <div>
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1">Caliper Lesion Measurements:</span>
                  <ul className="list-disc list-inside text-slate-800 font-mono">
                    {measurements.map(m => (
                      <li key={m.id}>Observed lesion diameter: <strong>{m.distanceMm} mm</strong></li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1">Radiologist Clinical Impression:</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 leading-relaxed font-medium">
                  {doctorNotes || currentStudy?.doctorFindings || 'Diagnostic evaluation completed. Correlation with clinical symptoms recommended.'}
                </div>
              </div>

              {currentStudy?.aiAnalysis?.detected && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-950">
                  <span className="font-bold uppercase text-[10px] block mb-0.5">AI Auxiliary CADx Finding:</span>
                  <p className="text-xs font-semibold">{currentStudy.aiAnalysis.condition} (Confidence: {currentStudy.aiAnalysis.confidence}%)</p>
                </div>
              )}
            </div>

            {/* Official Digital Signature & Verification Block */}
            <div className="pt-4 border-t-2 border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center text-slate-600">
                  <QrCode className="w-8 h-8" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">ABDM Digital Verification Seal</p>
                  <p className="text-[10px] text-slate-500 font-mono">Doc ID: {currentStudy?.id} • Signed Online</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
