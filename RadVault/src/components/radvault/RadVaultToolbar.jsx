import React from 'react';
import {
  ZoomIn, ZoomOut, Move, RotateCw, RotateCcw,
  FlipHorizontal, FlipVertical, RefreshCw, Maximize2,
  Sliders, Eye, EyeOff, Sparkles, Layers,
  Ruler, MapPin, Download, SplitSquareVertical,
  Activity, Play, Pause, Sun, Moon, FileText
} from 'lucide-react';

export default function RadVaultToolbar({
  activeTool,
  setActiveTool,
  windowPreset,
  setWindowPreset,
  brightness,
  setBrightness,
  contrast,
  setContrast,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  onRotateCW,
  onRotateCCW,
  onFlipH,
  onFlipV,
  showAiOverlay,
  setShowAiOverlay,
  comparisonMode,
  setComparisonMode,
  hasPriorStudy,
  isMultiSlice,
  isPlayingCine,
  setIsPlayingCine,
  onExportReport,
  activeTab
}) {
  return (
    <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-slate-300 select-none shadow-md">
      {/* Group 1: Navigation & Interaction Tools */}
      <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
        <button
          onClick={() => setActiveTool('pan')}
          title="Pan & Drag (P)"
          className={`p-2 rounded-lg flex items-center gap-1 text-xs font-medium transition-all ${
            activeTool === 'pan' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Move className="w-4 h-4" />
          <span>Pan</span>
        </button>

        <button
          onClick={() => setActiveTool('ruler')}
          title="Caliper / Linear Distance (R)"
          className={`p-2 rounded-lg flex items-center gap-1 text-xs font-medium transition-all ${
            activeTool === 'ruler' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Ruler className="w-4 h-4" />
          <span>Caliper</span>
        </button>

        <button
          onClick={() => setActiveTool('pin')}
          title="Add Clinical Annotation Pin (A)"
          className={`p-2 rounded-lg flex items-center gap-1 text-xs font-medium transition-all ${
            activeTool === 'pin' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Annotate</span>
        </button>
      </div>

      {/* Group 2: Radiology Windowing & LUT Presets */}
      <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 px-2 flex items-center gap-1">
          <Sliders className="w-3 h-3 text-sky-400" /> Presets
        </span>
        
        {['default', 'bone', 'lung', 'soft_tissue', 'inverted'].map((preset) => (
          <button
            key={preset}
            onClick={() => setWindowPreset(preset)}
            className={`px-2.5 py-1 text-xs rounded-md font-medium capitalize transition-all ${
              windowPreset === preset
                ? 'bg-slate-700 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {preset.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Group 3: Fine Adjustment Sliders (Brightness & Contrast) */}
      <div className="hidden lg:flex items-center gap-3 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <input
            type="range"
            min="40"
            max="180"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
            title={`Brightness: ${brightness}%`}
          />
          <span className="text-[10px] w-6">{brightness}%</span>
        </div>

        <div className="w-[1px] h-4 bg-slate-800" />

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
          <input
            type="range"
            min="50"
            max="250"
            value={contrast}
            onChange={(e) => setContrast(Number(e.target.value))}
            className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            title={`Contrast: ${contrast}%`}
          />
          <span className="text-[10px] w-6">{contrast}%</span>
        </div>
      </div>

      {/* Group 4: Transform & Zoom Controls */}
      <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
        <button
          onClick={onZoomIn}
          title="Zoom In (+)"
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono text-slate-400 px-1">{Math.round(zoom * 100)}%</span>
        <button
          onClick={onZoomOut}
          title="Zoom Out (-)"
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />

        <button
          onClick={onRotateCCW}
          title="Rotate 90° Left"
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={onRotateCW}
          title="Rotate 90° Right"
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <button
          onClick={onFlipH}
          title="Flip Horizontal"
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>

        <button
          onClick={onResetView}
          title="Reset View (R)"
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-sky-400 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Group 5: Advanced AI & Comparative Workflows */}
      <div className="flex items-center gap-2">
        {/* AI Detection Toggle */}
        <button
          onClick={() => setShowAiOverlay(!showAiOverlay)}
          title="Toggle AI Anomaly Detection & Heatmap"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            showAiOverlay
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-lg shadow-purple-500/20 animate-pulse'
              : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${showAiOverlay ? 'text-purple-400' : 'text-slate-400'}`} />
          <span>AI CADx</span>
        </button>

        {/* Prior vs Current Comparison */}
        {hasPriorStudy && (
          <button
            onClick={() => setComparisonMode(!comparisonMode)}
            title="Side-by-Side Comparison with Prior Baseline Scan"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              comparisonMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5 text-amber-400" />
            <span>Prior Compare</span>
          </button>
        )}

        {/* Multi-slice Cine loop play */}
        {isMultiSlice && (
          <button
            onClick={() => setIsPlayingCine(!isPlayingCine)}
            title={isPlayingCine ? 'Pause Cine Loop' : 'Play Multi-slice Cine Loop'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isPlayingCine
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {isPlayingCine ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>Cine Loop</span>
          </button>
        )}

        {/* Export / Print Clinical Report */}
        <button
          onClick={onExportReport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/20 transition-all active:scale-95"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Report</span>
        </button>
      </div>
    </div>
  );
}
