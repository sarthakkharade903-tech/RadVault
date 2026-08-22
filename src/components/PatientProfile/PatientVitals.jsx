import React from "react";

export default function PatientVitals({ vitals = [] }) {
  const getStatusClass = (status) => {
    switch (status) {
      case "normal":
        return "rv-status-normal";
      case "warning":
        return "rv-status-warning";
      case "critical":
        return "rv-status-critical";
      default:
        return "rv-status-normal";
    }
  };

  const getVitalIcon = (iconName) => {
    switch (iconName) {
      case "heart":
        return "❤️";
      case "pulse":
        return "⚡";
      case "oxygen":
        return "🫁";
      case "sugar":
        return "🩸";
      case "temp":
        return "🌡️";
      case "bmi":
        return "⚖️";
      default:
        return "📊";
    }
  };

  return (
    <div className="rv-card">
      <div className="rv-card-header">
        <h3 className="rv-card-title">
          <span>🩺</span> Recorded Vitals & Biometrics
        </h3>
        <span style={{ fontSize: "0.8rem", color: "var(--rv-text-muted)" }}>
          Latest update: Today, 09:30 AM
        </span>
      </div>

      <div className="rv-vitals-grid">
        {vitals.map((v) => (
          <div key={v.id} className="rv-vital-card">
            <div className="rv-vital-header">
              <span className="rv-vital-name">{v.name}</span>
              <span className="rv-vital-icon">{getVitalIcon(v.icon)}</span>
            </div>

            <div className="rv-vital-reading">
              <span className="rv-vital-val">{v.value}</span>
              <span className="rv-vital-unit">{v.unit}</span>
            </div>

            <div className="rv-vital-footer">
              <span className={`rv-status-badge ${getStatusClass(v.status)}`}>
                ● {v.statusLabel}
              </span>
            </div>

            <div style={{ fontSize: "0.7rem", color: "var(--rv-text-dim)", marginTop: "0.4rem" }}>
              Normal: {v.normalRange}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
