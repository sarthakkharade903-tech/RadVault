import React, { useState, useMemo } from "react";
import RecordFilters from "./RecordFilters";
import RecordCard from "./RecordCard";
import RecordViewerModal from "./RecordViewerModal";

export default function MedicalRecordsList({ records = [], initialSelectedRecordId = null }) {
  const [activeModality, setActiveModality] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(() => {
    if (initialSelectedRecordId) {
      return records.find((r) => r.id === initialSelectedRecordId) || null;
    }
    return null;
  });

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchesModality =
        activeModality === "all" || rec.modality === activeModality;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        rec.title.toLowerCase().includes(q) ||
        rec.bodyRegion.toLowerCase().includes(q) ||
        rec.doctor.toLowerCase().includes(q) ||
        rec.facility.toLowerCase().includes(q) ||
        (rec.report?.impression && rec.report.impression.toLowerCase().includes(q));

      return matchesModality && matchesSearch;
    });
  }, [records, activeModality, searchQuery]);

  return (
    <div className="rv-records-container">
      <RecordFilters
        activeModality={activeModality}
        onSelectModality={setActiveModality}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0.5rem" }}>
        <span style={{ fontSize: "0.875rem", color: "var(--rv-text-muted)" }}>
          Showing <strong>{filteredRecords.length}</strong> medical {filteredRecords.length === 1 ? "record" : "records"}
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

      {filteredRecords.length === 0 ? (
        <div className="rv-card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📂</div>
          <h4 style={{ color: "#fff", marginBottom: "0.5rem" }}>No matching records found</h4>
          <p style={{ color: "var(--rv-text-muted)", fontSize: "0.9rem" }}>
            No documents matched your filters. Try selecting "All Vault Records" or changing your search terms.
          </p>
        </div>
      ) : (
        <div className="rv-records-grid">
          {filteredRecords.map((rec) => (
            <RecordCard
              key={rec.id}
              record={rec}
              onSelect={(r) => setSelectedRecord(r)}
            />
          ))}
        </div>
      )}

      {/* Detail Viewer Modal */}
      {selectedRecord && (
        <RecordViewerModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}
