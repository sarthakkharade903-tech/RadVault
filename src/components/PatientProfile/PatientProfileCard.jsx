import React, { useState } from "react";

export default function PatientProfileCard({ patient, onTriggerEmergencyQR }) {
  const [copied, setCopied] = useState(false);

  const handleCopyAbha = () => {
    if (patient?.abhaId) {
      navigator.clipboard.writeText(patient.abhaId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rv-card">
      <div className="rv-card-header">
        <h3 className="rv-card-title">
          <span>👤</span> Patient Demographics & Identification
        </h3>
        <span className="rv-status-badge rv-status-normal">
          ● {patient.consentStatus || "Active Record"}
        </span>
      </div>

      <div className="rv-info-grid">
        <div className="rv-info-item">
          <div className="rv-info-label">Full Name</div>
          <div className="rv-info-value">{patient.fullName}</div>
        </div>

        <div className="rv-info-item">
          <div className="rv-info-label">ABHA ID / Health Number</div>
          <div className="rv-info-value" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>{patient.abhaId}</span>
            <button
              onClick={handleCopyAbha}
              title="Copy ABHA ID"
              style={{
                background: "none",
                border: "none",
                color: "var(--rv-primary)",
                cursor: "pointer",
                padding: "2px",
                fontSize: "0.85rem"
              }}
            >
              {copied ? "✓ Copied" : "📋"}
            </button>
          </div>
        </div>

        <div className="rv-info-item">
          <div className="rv-info-label">Age & Gender</div>
          <div className="rv-info-value">{patient.age} yrs • {patient.gender}</div>
        </div>

        <div className="rv-info-item">
          <div className="rv-info-label">Date of Birth</div>
          <div className="rv-info-value">{patient.dob}</div>
        </div>

        <div className="rv-info-item">
          <div className="rv-info-label">Blood Group</div>
          <div className="rv-info-value" style={{ color: "var(--rv-rose)", fontWeight: 700 }}>
            {patient.bloodGroup}
          </div>
        </div>

        <div className="rv-info-item">
          <div className="rv-info-label">Contact Phone</div>
          <div className="rv-info-value">{patient.phone}</div>
        </div>

        <div className="rv-info-item">
          <div className="rv-info-label">Email Address</div>
          <div className="rv-info-value">{patient.email}</div>
        </div>

        <div className="rv-info-item">
          <div className="rv-info-label">Insurance Provider</div>
          <div className="rv-info-value">
            {patient.insurance?.provider} ({patient.insurance?.status})
          </div>
        </div>
      </div>

      <div style={{ marginTop: "1rem" }} className="rv-info-item">
        <div className="rv-info-label">Residential Address</div>
        <div className="rv-info-value" style={{ fontSize: "0.875rem" }}>
          {patient.address}
        </div>
      </div>

      <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        <div className="rv-info-item" style={{ borderLeft: "3px solid var(--rv-rose)" }}>
          <div className="rv-info-label">Emergency Primary Contact</div>
          <div className="rv-info-value">
            {patient.emergencyContact?.name} ({patient.emergencyContact?.relationship})
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--rv-text-muted)", marginTop: "0.2rem" }}>
            📞 {patient.emergencyContact?.phone}
          </div>
        </div>

        <div className="rv-info-item" style={{ borderLeft: "3px solid var(--rv-primary)" }}>
          <div className="rv-info-label">Insurance Policy No.</div>
          <div className="rv-info-value">{patient.insurance?.policyNumber}</div>
          <div style={{ fontSize: "0.85rem", color: "var(--rv-text-muted)", marginTop: "0.2rem" }}>
            Valid till: {patient.insurance?.validTill}
          </div>
        </div>
      </div>
    </div>
  );
}
