import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAllShares,
  revokeShareAccess,
  formatDisplayDate,
} from "../../services/shareService";

/**
 * WhoHasAccessModal.jsx
 * RadVault — Step 5: Patient Access Management & Revocation
 *
 * Answers the fundamental patient question:
 * "Who can see my medical information?"
 *
 * Allows viewing all active and past authorizations, examining exactly
 * what each doctor can view, and revoking access at any time.
 */
export default function WhoHasAccessModal({
  isOpen,
  onClose,
  patient = {},
  onOpenShareNew,
}) {
  const { isDemoMode, demoDataEnabled } = useAuth();
  const [shares, setShares] = useState([]);
  const [selectedShare, setSelectedShare] = useState(null);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [revokeSuccessMessage, setRevokeSuccessMessage] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState("active"); // 'active' | 'all'

  // Load shares
  const refreshShares = async () => {
    try {
      const list = await getAllShares(patient.id || "PAT-89210", isDemoMode && demoDataEnabled);
      setShares(list);
    } catch (err) {
      console.warn("Could not load shares list:", err.message);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshShares();
      setSelectedShare(null);
      setShowRevokeConfirm(false);
      setRevokeSuccessMessage(null);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showRevokeConfirm) {
          setShowRevokeConfirm(false);
        } else if (selectedShare) {
          setSelectedShare(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showRevokeConfirm, selectedShare, onClose]);

  if (!isOpen) return null;

  const activeShares = shares.filter((s) => s.status === "active");
  const pastShares = shares.filter((s) => s.status !== "active");
  const displayedShares = activeFilterTab === "active" ? activeShares : shares;

  // Handle Revoke
  const handleConfirmRevoke = async () => {
    if (!selectedShare || isRevoking) return;
    setIsRevoking(true);
    try {
      const updated = await revokeShareAccess(selectedShare.id, isDemoMode);
      await refreshShares();
      setSelectedShare(updated);
      setShowRevokeConfirm(false);
      setRevokeSuccessMessage(
        `✓ Access revoked: ${updated.doctorName || 'Doctor'} can no longer view this shared information.`
      );
    } catch (err) {
      console.error("Failed to revoke access:", err);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="rv-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="rv-modal-container rv-access-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rv-access-title"
      >
        {/* ── Modal Header ── */}
        <div className="rv-modal-header">
          <div>
            <h3 id="rv-access-title">🔒 Who Has Access</h3>
            <p className="rv-share-header-sub">
              Doctors and clinics currently authorized to view your health records.
            </p>
          </div>
          <button
            className="rv-modal-close-btn"
            onClick={onClose}
            aria-label="Close access manager"
          >
            ✕
          </button>
        </div>

        {/* ── Success Alert if Revoked ── */}
        {revokeSuccessMessage && (
          <div className="rv-revoke-alert-banner">
            <span>{revokeSuccessMessage}</span>
            <button
              className="rv-revoke-alert-dismiss"
              onClick={() => setRevokeSuccessMessage(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Modal Body ── */}
        <div className="rv-share-modal-body">
          {/* ══════════════════════════════════════════════════════════════════
              VIEW 1: LIST OF SHARES (ACTIVE / ALL)
              ══════════════════════════════════════════════════════════════════ */}
          {!selectedShare && (
            <div>
              {/* Tab Selector & Share New Button */}
              <div className="rv-access-top-bar">
                <div className="rv-access-tabs">
                  <button
                    className={`rv-access-tab ${activeFilterTab === "active" ? "active" : ""}`}
                    onClick={() => setActiveFilterTab("active")}
                  >
                    Active Authorizations ({activeShares.length})
                  </button>
                  <button
                    className={`rv-access-tab ${activeFilterTab === "all" ? "active" : ""}`}
                    onClick={() => setActiveFilterTab("all")}
                  >
                    All History ({shares.length})
                  </button>
                </div>

                {onOpenShareNew && (
                  <button
                    className="rv-btn rv-btn-sm"
                    onClick={() => {
                      onClose();
                      onOpenShareNew();
                    }}
                  >
                    + Share with New Doctor
                  </button>
                )}
              </div>

              {/* Shares List */}
              {displayedShares.length === 0 ? (
                <div className="rv-access-empty-state">
                  <div className="rv-access-empty-icon">🛡️</div>
                  <h4>No active doctor authorizations</h4>
                  <p>
                    You have not shared your medical records with any external doctors yet, or all previous authorizations have expired.
                  </p>
                  {onOpenShareNew && (
                    <button
                      className="rv-btn"
                      style={{ marginTop: "1rem" }}
                      onClick={() => {
                        onClose();
                        onOpenShareNew();
                      }}
                    >
                      Share Records with a Doctor
                    </button>
                  )}
                </div>
              ) : (
                <div className="rv-access-list">
                  {displayedShares.map((item) => {
                    const isActive = item.status === "active";
                    return (
                      <div
                        key={item.id}
                        className={`rv-access-card ${isActive ? "active-card" : "revoked-card"}`}
                      >
                        <div className="rv-access-card-left">
                          <div className="rv-access-doc-row">
                            <span className="rv-access-doc-name">{item.doctorName}</span>
                            <span
                              className={`rv-status-badge ${
                                isActive ? "rv-status-normal" : "rv-status-muted"
                              }`}
                            >
                              ● {isActive ? "Access Active" : "Access Revoked"}
                            </span>
                          </div>

                          <div className="rv-access-meta-text">
                            <span>🩺 {item.doctorSpecialty}</span>
                            <span>🏥 {item.doctorFacility}</span>
                          </div>

                          <div className="rv-access-scope-tag">
                            <span className="rv-scope-pill">
                              {item.shareScope === "health_history"
                                ? "📁 Health History"
                                : `📄 ${item.scopeLabel}`}
                            </span>
                            <span className="rv-access-expiry">
                              {isActive
                                ? `Expires: ${item.expiresDisplay || "Until revoked"}`
                                : `Revoked: ${formatDisplayDate(item.revokedAt)}`}
                            </span>
                          </div>
                        </div>

                        <div className="rv-access-card-actions">
                          <button
                            className="rv-btn rv-btn-secondary rv-btn-sm"
                            onClick={() => setSelectedShare(item)}
                          >
                            View Details →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 2: SHARE DETAIL VIEW & REVOCATION
              ══════════════════════════════════════════════════════════════════ */}
          {selectedShare && !showRevokeConfirm && (
            <div className="rv-access-detail-view">
              <button
                className="rv-link-btn"
                onClick={() => setSelectedShare(null)}
                style={{ marginBottom: "1rem" }}
              >
                ← Back to Who Has Access
              </button>

              <div className="rv-detail-header-card">
                <div className="rv-detail-status-row">
                  <span
                    className={`rv-status-badge ${
                      selectedShare.status === "active"
                        ? "rv-status-normal"
                        : "rv-status-muted"
                    }`}
                  >
                    ● {selectedShare.status === "active" ? "Access Active" : "Access Revoked"}
                  </span>
                  <span className="rv-detail-id">Authorization ID: {selectedShare.id}</span>
                </div>

                <h4 className="rv-detail-doctor">{selectedShare.doctorName}</h4>
                <div className="rv-detail-sub">
                  {selectedShare.doctorSpecialty} • {selectedShare.doctorFacility}
                </div>
              </div>

              {/* What they can view */}
              <div className="rv-detail-section">
                <div className="rv-detail-section-title">What this doctor can view:</div>
                <div className="rv-detail-scope-box">
                  <div className="rv-detail-scope-heading">
                    {selectedShare.shareScope === "health_history"
                      ? "Full Health History"
                      : selectedShare.scopeLabel}
                  </div>
                  <p className="rv-detail-scope-desc">{selectedShare.recordsSummary}</p>

                  {selectedShare.selectedRecordTitles &&
                    selectedShare.selectedRecordTitles.length > 0 && (
                      <ul className="rv-detail-records-list">
                        {selectedShare.selectedRecordTitles.map((t, i) => (
                          <li key={i}>📄 {t}</li>
                        ))}
                      </ul>
                    )}
                </div>
              </div>

              {/* Timeline Metadata */}
              <div className="rv-detail-meta-grid">
                <div className="rv-detail-meta-item">
                  <span className="rv-lbl">Access granted:</span>
                  <span className="rv-val">{formatDisplayDate(selectedShare.createdAt)}</span>
                </div>
                <div className="rv-detail-meta-item">
                  <span className="rv-lbl">Access duration:</span>
                  <span className="rv-val">{selectedShare.durationLabel || "7 days"}</span>
                </div>
                <div className="rv-detail-meta-item">
                  <span className="rv-lbl">Access expires:</span>
                  <span className="rv-val" style={{ color: "var(--rv-maroon)", fontWeight: 700 }}>
                    {selectedShare.expiresDisplay || "Until revoked"}
                  </span>
                </div>
                {selectedShare.revokedAt && (
                  <div className="rv-detail-meta-item">
                    <span className="rv-lbl">Revoked on:</span>
                    <span className="rv-val" style={{ color: "var(--rv-rose)" }}>
                      {formatDisplayDate(selectedShare.revokedAt)}
                    </span>
                  </div>
                )}
              </div>

              {/* Revoke Action */}
              <div className="rv-detail-footer">
                {selectedShare.status === "active" ? (
                  <div className="rv-detail-revoke-box">
                    <div>
                      <div className="rv-revoke-note-title">Patient Consent Control</div>
                      <div className="rv-revoke-note-desc">
                        You can immediately revoke this doctor's ability to view your shared health records.
                      </div>
                    </div>
                    <button
                      className="rv-btn rv-btn-danger"
                      onClick={() => setShowRevokeConfirm(true)}
                    >
                      Revoke Access
                    </button>
                  </div>
                ) : (
                  <div className="rv-revoked-banner">
                    🔒 Access is revoked. This doctor can no longer view your health records.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 3: REVOCATION CONFIRMATION DIALOG
              ══════════════════════════════════════════════════════════════════ */}
          {showRevokeConfirm && selectedShare && (
            <div className="rv-revoke-confirm-card">
              <div className="rv-revoke-warn-icon">⚠️</div>
              <h4 className="rv-revoke-confirm-title">Revoke access?</h4>
              <p className="rv-revoke-confirm-desc">
                <strong>{selectedShare.doctorName}</strong> ({selectedShare.doctorSpecialty}) will no longer be able to view your shared {selectedShare.scopeLabel.toLowerCase()}.
              </p>

              <div className="rv-revoke-confirm-actions">
                <button
                  type="button"
                  className="rv-btn rv-btn-secondary"
                  onClick={() => setShowRevokeConfirm(false)}
                  disabled={isRevoking}
                >
                  Keep Access
                </button>
                <button
                  type="button"
                  className="rv-btn rv-btn-danger"
                  onClick={handleConfirmRevoke}
                  disabled={isRevoking}
                >
                  {isRevoking ? "Revoking access…" : "Yes, Revoke Access"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
