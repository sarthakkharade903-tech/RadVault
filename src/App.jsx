import React from "react";
import PatientPortalPage from "./pages/PatientPortalPage";

function App() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc" }}>
      {/* Top Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          backgroundColor: "#1e293b",
          borderBottom: "1px solid #334155"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.75rem" }}>🏥</span>
          <div>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#38bdf8", margin: 0, letterSpacing: "-0.02em" }}>
              RadVault
            </h1>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
              Intelligent Radiology & Health Data Vault
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              padding: "0.25rem 0.75rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 600
            }}
          >
            ● Patient Portal Active
          </span>
        </div>
      </header>

      {/* Main Content Area hosting Patient Profile, Timeline, & Records */}
      <main style={{ padding: "1rem 0" }}>
        <PatientPortalPage />
      </main>
    </div>
  );
}

export default App;
