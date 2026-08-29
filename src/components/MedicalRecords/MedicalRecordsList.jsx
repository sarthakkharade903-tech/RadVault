import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import RecordFilters from "./RecordFilters";
import RecordCard from "./RecordCard";
import RecordViewerModal from "./RecordViewerModal";
import ShareModal from "./ShareModal";
import WhoHasAccessModal from "./WhoHasAccessModal";
import { getActiveShares } from "../../services/shareService";

/**
 * MedicalRecordsList.jsx
 * RadVault — Medical Records & Patient-Controlled Sharing Hub
 */
export default function MedicalRecordsList({
  records = [],
  initialSelectedRecordId = null,
  patient = {},
}) {
  const { isDemoMode, demoDataEnabled } = useAuth();
  const [activeModality, setActiveModality] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(() => {
    if (initialSelectedRecordId) {
      return records.find((r) => r.id === initialSelectedRecordId) || null;
    }
    return null;
  });

  // Step 5: Sharing & Access Management Modals
  const [showShareModal, setShowShareModal] = useState(false);
  const [showWhoHasAccess, setShowWhoHasAccess] = useState(false);
  const [activeSharesCount, setActiveSharesCount] = useState(0);

  // Refresh active shares count
  const refreshSharesCount = async () => {
    try {
      const active = await getActiveShares(patient.id || "PAT-89210", isDemoMode && demoDataEnabled);
      setActiveSharesCount(active.length);
    } catch (e) {
      console.warn("Could not fetch active shares count:", e);
    }
  };

  useEffect(() => {
    refreshSharesCount();
  }, [showShareModal, showWhoHasAccess]);

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
      {/* ── Step 5: Patient Consent & Doctor Sharing Hub ── */}
      <div className="rv-records-access-bar">
        <div className="rv-access-bar-left">
          <span className="rv-access-bar-icon" aria-hidden="true">🔒</span>
          <div>
            <div className="rv-access-bar-title">Patient-Controlled Doctor Access</div>
            <div className="rv-access-bar-sub">
              {activeSharesCount === 1
                ? "1 doctor currently authorized to view your records"
                : `${activeSharesCount} doctors currently authorized`}
            </div>
          </div>
        </div>

        <div className="rv-access-bar-actions">
          <button
            type="button"
            className="rv-btn rv-btn-sm rv-btn-secondary"
            onClick={() => setShowWhoHasAccess(true)}
            aria-label="View who currently has access to your health records"
          >
            Who Has Access ({activeSharesCount})
          </button>
          <button
            type="button"
            className="rv-btn rv-btn-sm"
            onClick={() => setShowShareModal(true)}
            aria-label="Share medical records with a new doctor"
          >
            + Share Records
          </button>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <RecordFilters
        activeModality={activeModality}
        onSelectModality={setActiveModality}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* ── Record Count Bar ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0.5rem" }}>
        <span style={{ fontSize: "0.875rem", color: "var(--rv-text-muted)" }}>
          Showing <strong>{filteredRecords.length}</strong> medical {filteredRecords.length === 1 ? "record" : "records"}
        </span>
        {searchQuery && (
          <button
            type="button"
            className="rv-btn-link"
            onClick={() => setSearchQuery("")}
            style={{ fontSize: "0.8rem" }}
          >
            ✕ Clear search
          </button>
        )}
      </div>

      {/* ── Records Grid ── */}
      {filteredRecords.length === 0 ? (
        <div className="rv-card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📂</div>
          <h4 style={{ color: "var(--rv-maroon)", marginBottom: "0.5rem" }}>No matching records found</h4>
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

      {/* ── Detail Viewer Modal (with Share action) ── */}
      {selectedRecord && (
        <RecordViewerModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          patient={patient}
          onOpenWhoHasAccess={() => setShowWhoHasAccess(true)}
        />
      )}

      {/* ── Step 5: Direct Share Modal (from header) ── */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            refreshSharesCount();
          }}
          patient={patient}
          onViewAccess={() => {
            setShowShareModal(false);
            setShowWhoHasAccess(true);
          }}
        />
      )}

      {/* ── Step 5: Who Has Access & Revocation Modal ── */}
      {showWhoHasAccess && (
        <WhoHasAccessModal
          isOpen={showWhoHasAccess}
          onClose={() => {
            setShowWhoHasAccess(false);
            refreshSharesCount();
          }}
          patient={patient}
          onOpenShareNew={() => setShowShareModal(true)}
        />
      )}
    </div>
  );
}
