import React, { useState } from "react";
import "../styles/patientModules.css";

import {
  mockPatient,
  mockVitals,
  mockAllergies,
  mockConditions,
  mockMedications,
  mockTimelineEvents,
  mockMedicalRecords
} from "../data/mockPatientData";

import PatientProfileCard from "../components/PatientProfile/PatientProfileCard";
import PatientVitals from "../components/PatientProfile/PatientVitals";
import PatientConditions from "../components/PatientProfile/PatientConditions";
import HealthTimeline from "../components/HealthTimeline/HealthTimeline";
import MedicalRecordsList from "../components/MedicalRecords/MedicalRecordsList";

export default function PatientPortalPage({ onTriggerEmergencyQR }) {
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'timeline' | 'records'
  const [targetRecordId, setTargetRecordId] = useState(null);

  // Jump from timeline to medical records modal
  const handleViewRecordFromTimeline = (recordId) => {
    setTargetRecordId(recordId);
    setActiveTab("records");
  };

  const handleTriggerEmergency = () => {
    if (onTriggerEmergencyQR) {
      onTriggerEmergencyQR();
    } else {
      alert("🚨 Emergency Break-Glass QR Triggered: This feature connects with the Emergency QR module to generate one-time emergency clinical access credentials.");
    }
  };

  return (
    <div className="rv-portal-container">
      {/* Patient Quick Header Bar */}
      <div className="rv-quick-header">
        <div className="rv-quick-user">
          <div className="rv-avatar">
            {mockPatient.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>

          <div className="rv-user-meta">
            <h2>
              {mockPatient.fullName}
              <span className="rv-chip rv-chip-highlight" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                ABHA: {mockPatient.abhaId}
              </span>
            </h2>

            <div className="rv-meta-chips">
              <span className="rv-chip">🎂 {mockPatient.age} yrs • {mockPatient.gender}</span>
              <span className="rv-chip" style={{ color: "var(--rv-rose)", fontWeight: 700 }}>
                🩸 Blood: {mockPatient.bloodGroup}
              </span>
              <span className="rv-chip">🛡️ {mockPatient.insurance.provider}</span>
            </div>
          </div>
        </div>

        <div className="rv-quick-actions">
          <button
            className="rv-emergency-btn"
            onClick={handleTriggerEmergency}
            title="Trigger Emergency QR Break-Glass Protocol"
          >
            <span>🚨</span> Emergency QR Access
          </button>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="rv-tabs-nav">
        <button
          className={`rv-tab-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("profile");
            setTargetRecordId(null);
          }}
        >
          <span>📇</span> Patient Profile & Vitals
        </button>

        <button
          className={`rv-tab-btn ${activeTab === "timeline" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("timeline");
            setTargetRecordId(null);
          }}
        >
          <span>⏱️</span> Health Timeline
          <span className="rv-tab-count">{mockTimelineEvents.length}</span>
        </button>

        <button
          className={`rv-tab-btn ${activeTab === "records" ? "active" : ""}`}
          onClick={() => setActiveTab("records")}
        >
          <span>📁</span> Medical Records Vault
          <span className="rv-tab-count">{mockMedicalRecords.length}</span>
        </button>
      </div>

      {/* Module Content Views */}
      <div className="rv-tab-content">
        {activeTab === "profile" && (
          <div className="rv-profile-layout">
            <div className="rv-profile-top-grid">
              <PatientProfileCard
                patient={mockPatient}
                onTriggerEmergencyQR={handleTriggerEmergency}
              />
              <PatientVitals vitals={mockVitals} />
            </div>

            <PatientConditions
              allergies={mockAllergies}
              conditions={mockConditions}
              medications={mockMedications}
            />
          </div>
        )}

        {activeTab === "timeline" && (
          <HealthTimeline
            events={mockTimelineEvents}
            onViewRecord={handleViewRecordFromTimeline}
          />
        )}

        {activeTab === "records" && (
          <MedicalRecordsList
            records={mockMedicalRecords}
            initialSelectedRecordId={targetRecordId}
          />
        )}
      </div>
    </div>
  );
}
