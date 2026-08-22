import React, { useState, useMemo } from "react";
import TimelineFilter from "./TimelineFilter";
import TimelineItem from "./TimelineItem";

export default function HealthTimeline({ events = [], onViewRecord }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  const filteredEvents = useMemo(() => {
    return events
      .filter((evt) => {
        const matchesCategory =
          activeCategory === "all" || evt.category === activeCategory;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          evt.title.toLowerCase().includes(q) ||
          evt.summary.toLowerCase().includes(q) ||
          evt.doctor.toLowerCase().includes(q) ||
          evt.facility.toLowerCase().includes(q);

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time || "00:00"}`).getTime();
        const dateB = new Date(`${b.date} ${b.time || "00:00"}`).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [events, activeCategory, searchQuery, sortOrder]);

  return (
    <div className="rv-timeline-container">
      <TimelineFilter
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOrder={sortOrder}
        onToggleSort={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0.5rem" }}>
        <span style={{ fontSize: "0.875rem", color: "var(--rv-text-muted)" }}>
          Showing <strong>{filteredEvents.length}</strong> timeline {filteredEvents.length === 1 ? "entry" : "entries"}
        </span>
        {searchQuery && (
          <button
            className="rv-btn-link"
            onClick={() => setSearchQuery("")}
            style={{ fontSize: "0.8rem" }}
          >
            ✕ Clear search
          </button>
        )}
      </div>

      {filteredEvents.length === 0 ? (
        <div className="rv-card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔍</div>
          <h4 style={{ color: "#fff", marginBottom: "0.5rem" }}>No timeline events found</h4>
          <p style={{ color: "var(--rv-text-muted)", fontSize: "0.9rem" }}>
            No records matched your current filter criteria. Try selecting "All Events" or clearing the search query.
          </p>
        </div>
      ) : (
        <div className="rv-timeline-track">
          {filteredEvents.map((evt) => (
            <TimelineItem
              key={evt.id}
              event={evt}
              onViewRecord={onViewRecord}
            />
          ))}
        </div>
      )}
    </div>
  );
}
