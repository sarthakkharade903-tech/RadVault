import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getDoctors,
  createShareAccess,
  getHealthHistoryCategories,
} from "../../services/shareService";
import {
  mockMedicalRecords,
  mockTimelineEvents,
  mockMedications,
} from "../../data/mockPatientData";

/**
 * ShareModal.jsx
 * RadVault — Step 5: Patient-Controlled Sharing Modal
 *
 * Implements the 5-step patient authorization journey:
 * 1. Choose Doctor
 * 2. Choose Scope (Health History vs Selected Records)
 * 3. Scope Details (Category Breakdown or Record Checkboxes)
 * 4. Choose Duration & Final Review
 * 5. Success Confirmation
 */
export default function ShareModal({
  isOpen,
  onClose,
  initialRecord = null,
  patient = {},
  onViewAccess,
}) {
  const { isDemoMode, demoDataEnabled } = useAuth();
  // Steps: 'doctor' | 'scope' | 'details' | 'duration' | 'success'
  const [step, setStep] = useState("doctor");
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [customDoctorName, setCustomDoctorName] = useState("");
  const [customDoctorSpecialty, setCustomDoctorSpecialty] = useState("");
  const [customDoctorFacility, setCustomDoctorFacility] = useState("");
  const [showCustomDoctor, setShowCustomDoctor] = useState(false);

  // Scope: 'health_history' | 'selected_records'
  const [shareScope, setShareScope] = useState(
    initialRecord ? "selected_records" : "health_history"
  );

  // Selected records (array of record IDs)
  const [selectedRecordIds, setSelectedRecordIds] = useState(() => {
    if (initialRecord) return [initialRecord.id];
    return isDemoMode && demoDataEnabled ? mockMedicalRecords.slice(0, 2).map((r) => r.id) : [];
  });

  // Duration: '7_days' | '24_hours' | 'until_revoked'
  const [durationType, setDurationType] = useState("7_days");

  // Loading & Result state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdShare, setCreatedShare] = useState(null);

  // Load doctors
  useEffect(() => {
    getDoctors().then((docs) => {
      setDoctorsList(docs);
      if (docs.length > 0 && !selectedDoctor) {
        setSelectedDoctor(docs[0]);
      }
    });
  }, []);

  // Sync initialRecord if provided
  useEffect(() => {
    if (isOpen) {
      setStep("doctor");
      setCreatedShare(null);
      if (initialRecord) {
        setShareScope("selected_records");
        setSelectedRecordIds([initialRecord.id]);
      } else {
        setShareScope("health_history");
      }
    }
  }, [isOpen, initialRecord]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Selected doctor object resolution
  const activeDoctorObj = showCustomDoctor
    ? {
        id: "custom-doc",
        name: customDoctorName.trim() || "Attending Physician",
        specialty: customDoctorSpecialty.trim() || "Consulting Doctor",
        facility: customDoctorFacility.trim() || "Private Clinic",
      }
    : selectedDoctor;

  const categories = getHealthHistoryCategories(
    mockMedicalRecords,
    mockTimelineEvents,
    mockMedications
  );

  const selectedRecordsObjects = mockMedicalRecords.filter((r) =>
    selectedRecordIds.includes(r.id)
  );

  // ── Toggle record selection ───────────────────────────────────────────────
  const handleToggleRecord = (recId) => {
    setSelectedRecordIds((prev) =>
      prev.includes(recId) ? prev.filter((id) => id !== recId) : [...prev, recId]
    );
  };

  const handleSelectAllRecords = () => {
    setSelectedRecordIds(mockMedicalRecords.map((r) => r.id));
  };

  const handleClearAllRecords = () => {
    setSelectedRecordIds([]);
  };

  // ── Submit share ──────────────────────────────────────────────────────────
  const handleConfirmShare = async () => {
    if (!activeDoctorObj || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const share = await createShareAccess({
        patientId: patient.id || "PAT-89210",
        doctor: activeDoctorObj,
        shareScope,
        selectedRecords:
          shareScope === "selected_records" ? selectedRecordsObjects : [],
        durationType,
        isDemoMode
      });
      setCreatedShare(share);
      setStep("success");
    } catch (err) {
      console.error("Failed to authorize share:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rv-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="rv-modal-container rv-share-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rv-share-title"
      >
        {/* ── Modal Header ── */}
        <div className="rv-modal-header">
          <div>
            <h3 id="rv-share-title">
              {step === "success" ? "Access Authorized" : "Share with a doctor"}
            </h3>
            <p className="rv-share-header-sub">
              {step === "success"
                ? "Your authorization has been recorded and is active."
                : "Choose what this doctor can view and for how long."}
            </p>
          </div>
          <button
            className="rv-modal-close-btn"
            onClick={onClose}
            aria-label="Close share dialog"
          >
            ✕
          </button>
        </div>

        {/* ── Modal Body Content ── */}
        <div className="rv-share-modal-body">
          {/* ══════════════════════════════════════════════════════════════════
              STEP 1: CHOOSE DOCTOR
              ══════════════════════════════════════════════════════════════════ */}
          {step === "doctor" && (
            <div className="rv-share-step">
              <div className="rv-share-step-header">
                <span className="rv-share-step-badge">Step 1 of 4</span>
                <h4>Select Doctor</h4>
                <p>Choose the healthcare professional you want to share with.</p>
              </div>

              {/* Doctor Directory Cards */}
              <div className="rv-doctor-list" role="radiogroup" aria-label="Doctors">
                {doctorsList.map((doc) => {
                  const isSelected = !showCustomDoctor && selectedDoctor?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      className={`rv-doctor-card ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedDoctor(doc);
                        setShowCustomDoctor(false);
                      }}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setSelectedDoctor(doc);
                          setShowCustomDoctor(false);
                        }
                      }}
                    >
                      <div className="rv-doctor-avatar">{doc.initials}</div>
                      <div className="rv-doctor-info">
                        <div className="rv-doctor-name">{doc.name}</div>
                        <div className="rv-doctor-spec">{doc.specialty}</div>
                        <div className="rv-doctor-fac">{doc.facility}</div>
                      </div>
                      <div className="rv-selection-radio">
                        <span className={`rv-radio-dot ${isSelected ? "checked" : ""}`} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Optional: Add custom doctor */}
              <div className="rv-custom-doc-box">
                <button
                  type="button"
                  className="rv-link-toggle"
                  onClick={() => setShowCustomDoctor(!showCustomDoctor)}
                >
                  {showCustomDoctor ? "▲ Select from directory" : "+ Don't see your doctor? Enter details"}
                </button>

                {showCustomDoctor && (
                  <div className="rv-custom-doc-inputs">
                    <div>
                      <label className="rv-input-label">Doctor Name *</label>
                      <input
                        type="text"
                        className="rv-text-input"
                        placeholder="e.g. Dr. Anand Joshi"
                        value={customDoctorName}
                        onChange={(e) => setCustomDoctorName(e.target.value)}
                      />
                    </div>
                    <div className="rv-custom-doc-row">
                      <div style={{ flex: 1 }}>
                        <label className="rv-input-label">Specialty</label>
                        <input
                          type="text"
                          className="rv-text-input"
                          placeholder="e.g. Neurology"
                          value={customDoctorSpecialty}
                          onChange={(e) => setCustomDoctorSpecialty(e.target.value)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="rv-input-label">Hospital / Clinic</label>
                        <input
                          type="text"
                          className="rv-text-input"
                          placeholder="e.g. Sancheti Hospital"
                          value={customDoctorFacility}
                          onChange={(e) => setCustomDoctorFacility(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Actions */}
              <div className="rv-share-actions">
                <button
                  className="rv-btn"
                  onClick={() => setStep("scope")}
                  disabled={showCustomDoctor && !customDoctorName.trim()}
                >
                  Continue to Sharing Scope →
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 2: CHOOSE SCOPE (HEALTH HISTORY VS SELECTED RECORDS)
              ══════════════════════════════════════════════════════════════════ */}
          {step === "scope" && (
            <div className="rv-share-step">
              <div className="rv-share-step-header">
                <span className="rv-share-step-badge">Step 2 of 4</span>
                <h4>What do you want to share?</h4>
                <p>
                  Sharing with: <strong>{activeDoctorObj?.name}</strong> ({activeDoctorObj?.specialty})
                </p>
              </div>

              <div className="rv-scope-options">
                {/* OPTION A: Share Health History */}
                <div
                  className={`rv-scope-card ${shareScope === "health_history" ? "selected" : ""}`}
                  onClick={() => setShareScope("health_history")}
                  role="radio"
                  aria-checked={shareScope === "health_history"}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setShareScope("health_history");
                  }}
                >
                  <div className="rv-scope-header">
                    <div className="rv-scope-badge-recommended">Recommended for new doctors</div>
                    <span className={`rv-radio-dot ${shareScope === "health_history" ? "checked" : ""}`} />
                  </div>
                  <div className="rv-scope-title">Share Health History</div>
                  <p className="rv-scope-desc">
                    Give this doctor a broader view of your medical journey, including past imaging, lab reports, medications, and clinical timeline.
                  </p>
                  <div className="rv-scope-pill-row">
                    <span>✓ 5 Imaging Scans</span>
                    <span>✓ 1 Lab Report</span>
                    <span>✓ 3 Prescriptions</span>
                    <span>✓ Consultations</span>
                  </div>
                </div>

                {/* OPTION B: Share Selected Records */}
                <div
                  className={`rv-scope-card ${shareScope === "selected_records" ? "selected" : ""}`}
                  onClick={() => setShareScope("selected_records")}
                  role="radio"
                  aria-checked={shareScope === "selected_records"}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setShareScope("selected_records");
                  }}
                >
                  <div className="rv-scope-header">
                    <div className="rv-scope-badge-specific">Specific Consultations</div>
                    <span className={`rv-radio-dot ${shareScope === "selected_records" ? "checked" : ""}`} />
                  </div>
                  <div className="rv-scope-title">Share Selected Records</div>
                  <p className="rv-scope-desc">
                    Share only the specific records you choose. Best for targeted second opinions or single diagnostic reports.
                  </p>
                  <div className="rv-scope-pill-row">
                    <span>Select 1 or more specific records</span>
                  </div>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="rv-share-actions-split">
                <button
                  type="button"
                  className="rv-btn rv-btn-secondary"
                  onClick={() => setStep("doctor")}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="rv-btn"
                  onClick={() => setStep("details")}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 3: SCOPE DETAILS (CATEGORY BREAKDOWN OR RECORD PICKER)
              ══════════════════════════════════════════════════════════════════ */}
          {step === "details" && (
            <div className="rv-share-step">
              <div className="rv-share-step-header">
                <span className="rv-share-step-badge">Step 3 of 4</span>
                <h4>
                  {shareScope === "health_history"
                    ? "Health history to be shared"
                    : "Select records to share"}
                </h4>
                <p>
                  Review the exact health items that <strong>{activeDoctorObj?.name}</strong> will be authorized to view.
                </p>
              </div>

              {/* ── Case 1: Health History Category Breakdown ── */}
              {shareScope === "health_history" && (
                <div className="rv-category-summary-box">
                  <div className="rv-cat-list">
                    {categories.map((cat) => (
                      <div key={cat.id} className="rv-cat-row">
                        <span className="rv-cat-icon">{cat.icon}</span>
                        <div className="rv-cat-info">
                          <span className="rv-cat-label">{cat.label}</span>
                          <span className="rv-cat-count">
                            {cat.count} {cat.unit}
                          </span>
                        </div>
                        <span className="rv-cat-check">✓ Included</span>
                      </div>
                    ))}
                  </div>
                  <p className="rv-cat-note">
                    🔒 RadVault will generate a secure, read-only consultation view for {activeDoctorObj?.name}. Your identity and allergy alerts are included for medical safety.
                  </p>
                </div>
              )}

              {/* ── Case 2: Selected Records Multi-Picker ── */}
              {shareScope === "selected_records" && (
                <div className="rv-records-picker-box">
                  <div className="rv-picker-header">
                    <span className="rv-picker-counter">
                      <strong>{selectedRecordIds.length}</strong> of {mockMedicalRecords.length} records selected
                    </span>
                    <div className="rv-picker-helpers">
                      <button
                        type="button"
                        className="rv-link-btn"
                        onClick={handleSelectAllRecords}
                      >
                        Select All
                      </button>
                      <span className="rv-sep">·</span>
                      <button
                        type="button"
                        className="rv-link-btn"
                        onClick={handleClearAllRecords}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="rv-records-selection-list">
                    {mockMedicalRecords.map((rec) => {
                      const isChecked = selectedRecordIds.includes(rec.id);
                      return (
                        <div
                          key={rec.id}
                          className={`rv-picker-item ${isChecked ? "checked" : ""}`}
                          onClick={() => handleToggleRecord(rec.id)}
                          role="checkbox"
                          aria-checked={isChecked}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleToggleRecord(rec.id);
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Handled by container
                            className="rv-checkbox-input"
                            aria-label={`Select ${rec.title}`}
                          />
                          <div className="rv-picker-item-details">
                            <div className="rv-picker-item-title">{rec.title}</div>
                            <div className="rv-picker-item-meta">
                              <span className="rv-picker-modality">{rec.modality}</span>
                              <span>📅 {rec.date}</span>
                              <span>🏥 {rec.facility}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation Actions */}
              <div className="rv-share-actions-split">
                <button
                  type="button"
                  className="rv-btn rv-btn-secondary"
                  onClick={() => setStep("scope")}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="rv-btn"
                  onClick={() => setStep("duration")}
                  disabled={
                    shareScope === "selected_records" && selectedRecordIds.length === 0
                  }
                >
                  Continue to Duration →
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 4: ACCESS DURATION & FINAL REVIEW
              ══════════════════════════════════════════════════════════════════ */}
          {step === "duration" && (
            <div className="rv-share-step">
              <div className="rv-share-step-header">
                <span className="rv-share-step-badge">Step 4 of 4</span>
                <h4>Review & Choose Access Duration</h4>
                <p>Specify how long this doctor can view your shared records.</p>
              </div>

              {/* Duration Options */}
              <div className="rv-duration-group" role="radiogroup" aria-label="Access duration">
                {/* 7 Days */}
                <div
                  className={`rv-duration-card ${durationType === "7_days" ? "selected" : ""}`}
                  onClick={() => setDurationType("7_days")}
                  role="radio"
                  aria-checked={durationType === "7_days"}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setDurationType("7_days");
                  }}
                >
                  <div className="rv-duration-main">
                    <span className="rv-duration-title">7 days</span>
                    <span className="rv-duration-badge">Recommended</span>
                  </div>
                  <p className="rv-duration-sub">
                    Sufficient for consultation, follow-up, and report review. Automatically expires.
                  </p>
                  <span className={`rv-radio-dot ${durationType === "7_days" ? "checked" : ""}`} />
                </div>

                {/* 24 Hours */}
                <div
                  className={`rv-duration-card ${durationType === "24_hours" ? "selected" : ""}`}
                  onClick={() => setDurationType("24_hours")}
                  role="radio"
                  aria-checked={durationType === "24_hours"}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setDurationType("24_hours");
                  }}
                >
                  <div className="rv-duration-main">
                    <span className="rv-duration-title">24 hours</span>
                  </div>
                  <p className="rv-duration-sub">
                    Best for one-time second opinions or urgent emergency consultations.
                  </p>
                  <span className={`rv-radio-dot ${durationType === "24_hours" ? "checked" : ""}`} />
                </div>

                {/* Until Revoked */}
                <div
                  className={`rv-duration-card ${durationType === "until_revoked" ? "selected" : ""}`}
                  onClick={() => setDurationType("until_revoked")}
                  role="radio"
                  aria-checked={durationType === "until_revoked"}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setDurationType("until_revoked");
                  }}
                >
                  <div className="rv-duration-main">
                    <span className="rv-duration-title">Until I revoke access</span>
                  </div>
                  <p className="rv-duration-sub">
                    Ongoing access for your primary family doctor. You can revoke it at any time.
                  </p>
                  <span className={`rv-radio-dot ${durationType === "until_revoked" ? "checked" : ""}`} />
                </div>
              </div>

              {/* Review Sharing Summary Card */}
              <div className="rv-review-summary-card">
                <div className="rv-review-title">Review sharing summary</div>

                <div className="rv-review-row">
                  <span className="rv-review-label">Sharing with:</span>
                  <span className="rv-review-val">
                    <strong>{activeDoctorObj?.name}</strong> • {activeDoctorObj?.specialty}
                    <div className="rv-review-sub">{activeDoctorObj?.facility}</div>
                  </span>
                </div>

                <div className="rv-review-row">
                  <span className="rv-review-label">Information:</span>
                  <span className="rv-review-val">
                    <strong>
                      {shareScope === "health_history"
                        ? "Comprehensive Health History"
                        : `${selectedRecordIds.length} Selected Records`}
                    </strong>
                    {shareScope === "selected_records" && (
                      <div className="rv-review-sub">
                        {selectedRecordsObjects.map((r) => r.title).join(", ")}
                      </div>
                    )}
                  </span>
                </div>

                <div className="rv-review-row">
                  <span className="rv-review-label">Access Duration:</span>
                  <span className="rv-review-val">
                    <strong>
                      {durationType === "7_days"
                        ? "7 days"
                        : durationType === "24_hours"
                        ? "24 hours"
                        : "Until I revoke access"}
                    </strong>
                  </span>
                </div>

                <div className="rv-review-disclaimer">
                  🔒 {activeDoctorObj?.name} will be authorized to view the information above until access expires or you revoke it from "Who Has Access".
                </div>
              </div>

              {/* Final Actions */}
              <div className="rv-share-actions-split">
                <button
                  type="button"
                  className="rv-btn rv-btn-secondary"
                  onClick={() => setStep("details")}
                  disabled={isSubmitting}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="rv-btn"
                  onClick={handleConfirmShare}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Authorizing access…" : "Share Securely"}
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 5: SUCCESS STATE
              ══════════════════════════════════════════════════════════════════ */}
          {step === "success" && (
            <div className="rv-share-success-state">
              <div className="rv-success-icon-badge">✓</div>
              <h4 className="rv-success-title">
                {createdShare?.shareScope === "health_history"
                  ? "Health history shared"
                  : `${createdShare?.recordIds?.length || 1} record(s) shared`}
              </h4>
              <p className="rv-success-desc">
                <strong>{createdShare?.doctorName}</strong> can now securely view your shared health information.
              </p>

              <div className="rv-success-meta-box">
                <div className="rv-meta-item">
                  <span className="rv-meta-lbl">Doctor:</span>
                  <span className="rv-meta-val">{createdShare?.doctorName} ({createdShare?.doctorSpecialty})</span>
                </div>
                <div className="rv-meta-item">
                  <span className="rv-meta-lbl">Scope:</span>
                  <span className="rv-meta-val">{createdShare?.scopeLabel}</span>
                </div>
                <div className="rv-meta-item">
                  <span className="rv-meta-lbl">Access expires:</span>
                  <span className="rv-meta-val" style={{ color: "var(--rv-maroon)", fontWeight: 700 }}>
                    {createdShare?.expiresDisplay || "Until revoked"}
                  </span>
                </div>
              </div>

              <div className="rv-success-actions">
                {onViewAccess && (
                  <button
                    type="button"
                    className="rv-btn rv-btn-secondary"
                    onClick={() => {
                      onClose();
                      onViewAccess();
                    }}
                  >
                    🔒 View Who Has Access
                  </button>
                )}
                <button
                  type="button"
                  className="rv-btn"
                  onClick={onClose}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
