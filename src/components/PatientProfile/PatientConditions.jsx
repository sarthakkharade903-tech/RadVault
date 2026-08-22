import React from "react";

export default function PatientConditions({
  allergies = [],
  conditions = [],
  medications = []
}) {
  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case "severe":
        return "rv-status-critical";
      case "moderate":
        return "rv-status-warning";
      default:
        return "rv-status-normal";
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
      {/* Allergies Card */}
      <div className="rv-card">
        <div className="rv-card-header">
          <h3 className="rv-card-title">
            <span>⚠️</span> Documented Allergies
          </h3>
          <span className="rv-chip" style={{ background: "rgba(239, 68, 68, 0.15)", color: "var(--rv-rose)" }}>
            {allergies.length} Flagged
          </span>
        </div>

        <div className="rv-allergies-list">
          {allergies.map((alg) => (
            <div key={alg.id} className={`rv-allergy-row ${alg.severity}`}>
              <div>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>
                  {alg.substance}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--rv-text-muted)", marginTop: "0.2rem" }}>
                  Reaction: {alg.reaction}
                </div>
              </div>
              <span className={`rv-status-badge ${getSeverityClass(alg.severity)}`}>
                {alg.severity.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chronic Conditions */}
      <div className="rv-card">
        <div className="rv-card-header">
          <h3 className="rv-card-title">
            <span>📋</span> Chronic Conditions & Diagnoses
          </h3>
          <span className="rv-chip">{conditions.length} Active</span>
        </div>

        <div className="rv-conditions-list">
          {conditions.map((cnd) => (
            <div key={cnd.id} className="rv-condition-item">
              <div className="rv-condition-header">
                <span className="rv-condition-name">{cnd.condition}</span>
                <span className="rv-status-badge rv-status-normal">
                  {cnd.status}
                </span>
              </div>
              <div style={{ fontSize: "0.825rem", color: "var(--rv-text-muted)", marginBottom: "0.3rem" }}>
                Category: {cnd.category} • Diagnosed: {cnd.diagnosedDate}
              </div>
              <div style={{ fontSize: "0.825rem", color: "#cbd5e1", fontStyle: "italic" }}>
                "{cnd.notes}"
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Medications */}
      <div className="rv-card" style={{ gridColumn: "1 / -1" }}>
        <div className="rv-card-header">
          <h3 className="rv-card-title">
            <span>💊</span> Active Prescriptions & Medications
          </h3>
          <span className="rv-chip" style={{ background: "rgba(56, 189, 248, 0.15)", color: "var(--rv-primary)" }}>
            {medications.length} Prescriptions
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          {medications.map((med) => (
            <div key={med.id} className="rv-med-card">
              <div style={{ flex: 1 }}>
                <div className="rv-med-name">{med.name}</div>
                <div className="rv-med-dosage">Dosage: <strong style={{ color: "#fff" }}>{med.dosage}</strong></div>
                <div style={{ fontSize: "0.825rem", color: "#cbd5e1", marginTop: "0.35rem" }}>
                  ⏰ {med.frequency}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--rv-text-dim)", marginTop: "0.4rem" }}>
                  Indication: {med.indication} • By {med.prescribedBy}
                </div>
              </div>
              <span className="rv-chip" style={{ fontSize: "0.75rem" }}>
                {med.refillsLeft} refills
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
