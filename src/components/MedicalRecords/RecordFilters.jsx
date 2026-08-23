import React from "react";

export const RECORD_MODALITIES = [
  { id: "all", label: "All Vault Records", icon: "📁" },
  { id: "MRI", label: "MRI Scans", icon: "🧠" },
  { id: "CT Scan", label: "CT Scans", icon: "🔄" },
  { id: "X-Ray", label: "X-Rays", icon: "🩻" },
  { id: "Ultrasound", label: "Ultrasound", icon: "🌊" },
  { id: "Lab Report", label: "Lab Pathology", icon: "🧪" }
];

export default function RecordFilters({
  activeModality,
  onSelectModality,
  searchQuery,
  onSearchChange
}) {
  return (
    <div className="rv-timeline-toolbar">
      <div className="rv-filter-chips">
        {RECORD_MODALITIES.map((mod) => (
          <button
            key={mod.id}
            className={`rv-filter-btn ${activeModality === mod.id ? "active" : ""}`}
            onClick={() => onSelectModality(mod.id)}
          >
            <span>{mod.icon}</span> {mod.label}
          </button>
        ))}
      </div>

      <div className="rv-search-box">
        <input
          type="text"
          className="rv-input"
          placeholder="Search scans, body parts, doctors..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
