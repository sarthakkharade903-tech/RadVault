import React from "react";

export const TIMELINE_CATEGORIES = [
  { id: "all", label: "All Events", icon: "🌐" },
  { id: "radiology", label: "Radiology & Scans", icon: "🩻" },
  { id: "consultation", label: "Consultations", icon: "🩺" },
  { id: "labs", label: "Lab Reports", icon: "🧪" }
];

export default function TimelineFilter({
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortOrder,
  onToggleSort
}) {
  return (
    <div className="rv-timeline-toolbar">
      <div className="rv-filter-chips">
        {TIMELINE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`rv-filter-btn ${activeCategory === cat.id ? "active" : ""}`}
            onClick={() => onSelectCategory(cat.id)}
          >
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
        <div className="rv-search-box">
          <input
            type="text"
            className="rv-input"
            placeholder="Search timeline (e.g. Spine, MRI, Apollo)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <button
          className="rv-filter-btn"
          onClick={onToggleSort}
          title="Toggle date sorting order"
          style={{ whiteSpace: "nowrap" }}
        >
          {sortOrder === "desc" ? "⏳ Newest First" : "⌛ Oldest First"}
        </button>
      </div>
    </div>
  );
}
