"""
RadVault — Backend API Server
FastAPI server handling RadVault Medical Image & Lab Report Management
"""

import os
import json
from typing import Optional, List, Dict, Any
from datetime import datetime

try:
    from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.staticfiles import StaticFiles
    from pydantic import BaseModel, Field
    import uvicorn
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False

if HAS_FASTAPI:
    app = FastAPI(
        title="RadVault Clinical & Diagnostic API",
        description="Backend services for DICOM/Medical Scan ingestion, PACS Viewer, and Clinical Annotations",
        version="2.0.0"
    )

    # Enable CORS for Frontend (Vite running on localhost:5173 or any port)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Ensure uploads storage directory exists
    UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads", "radvault")
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # In-Memory & Seed Data Store for Hackathon Stability
    STUDIES_STORE: List[Dict[str, Any]] = [
        {
            "id": "RV-2026-0801",
            "patientId": "MH-P-10482",
            "patientName": "Ramesh Patil",
            "patientAge": 54,
            "patientGender": "Male",
            "studyType": "X-Ray",
            "modality": "X-Ray",
            "bodyRegion": "Chest / Thorax",
            "studyDate": "2026-08-20",
            "facility": "Satara District Diagnostic Center",
            "technicianName": "Rajesh Mane (RT)",
            "referringDoctor": "Dr. Anita Joshi (PHC Shirwal)",
            "urgency": "urgent",
            "fileName": "chest_pa_ramesh_patil.dcm",
            "fileSize": "18.4 MB (DICOM)",
            "isMultiSlice": False,
            "dicomMetadata": {
                "patientId": "MH-P-10482",
                "studyUid": "1.2.840.113619.2.55.3.604688.20260820",
                "seriesDescription": "CHEST PA ERECT",
                "modality": "CR",
                "bodyPartExamined": "CHEST",
                "kvp": "120",
                "pixelSpacing": "0.143 \\ 0.143 mm"
            },
            "technicianNotes": "Patient presented with 5 days high fever, severe cough, and dyspnea. Lobar consolidation suspected in RLL.",
            "doctorFindings": "Prominent consolidation in right lower zone consistent with Acute Lobar Pneumonia.",
            "aiAnalysis": {
                "detected": True,
                "condition": "Acute Lobar Pneumonia (Consolidation)",
                "confidence": 94.2,
                "severity": "Moderate to Severe",
                "recommendations": "Initiate empirical antibiotic protocol (Azithromycin + Amoxicillin/Clavulanate) and monitor SpO2."
            },
            "measurements": [
                {"id": "m1", "distanceMm": 48.2, "label": "Consolidation zone"}
            ],
            "pins": [
                {"id": "p1", "title": "Dense Infiltrate", "comment": "Air bronchograms visible in right lower lobe"}
            ]
        },
        {
            "id": "RV-2026-0802",
            "patientId": "MH-P-10485",
            "patientName": "Sunita Shinde",
            "patientAge": 42,
            "patientGender": "Female",
            "studyType": "MRI",
            "modality": "MRI",
            "bodyRegion": "Head / Brain",
            "studyDate": "2026-08-19",
            "facility": "Apollo Tele-Diagnostics Regional Hub",
            "technicianName": "Sanjay Deshpande",
            "referringDoctor": "Dr. Vivek Kulkarni (Neurology)",
            "urgency": "normal",
            "fileName": "brain_mri_flair_axial.dcm",
            "fileSize": "64.2 MB",
            "isMultiSlice": True,
            "dicomMetadata": {
                "patientId": "MH-P-10485",
                "seriesDescription": "BRAIN AXIAL T2 FLAIR",
                "modality": "MR",
                "bodyPartExamined": "BRAIN",
                "magneticFieldStrength": "1.5T",
                "sliceThickness": "4.0 mm"
            },
            "technicianNotes": "Refractory migraine evaluation with unilateral paresthesia.",
            "doctorFindings": "Scattered hyperintense foci in subcortical white matter, non-specific microvascular ischemic changes.",
            "aiAnalysis": {
                "detected": True,
                "condition": "Microvascular White Matter Changes",
                "confidence": 88.7,
                "severity": "Mild (Fazekas Grade 1)",
                "recommendations": "Control vascular risk factors (Blood pressure, Lipid profile)."
            },
            "measurements": [],
            "pins": []
        },
        {
            "id": "RV-2026-0804",
            "patientId": "MH-P-10492",
            "patientName": "Anil Deshmukh",
            "patientAge": 28,
            "patientGender": "Male",
            "studyType": "X-Ray",
            "modality": "X-Ray",
            "bodyRegion": "Extremities / Bone",
            "studyDate": "2026-08-21",
            "facility": "Patan Rural Hospital Radiology Unit",
            "technicianName": "Amit Ghorpade",
            "referringDoctor": "Dr. R. K. Chavan (Trauma/Emergency)",
            "urgency": "emergency",
            "fileName": "wrist_distal_radius_fracture.dcm",
            "fileSize": "14.1 MB",
            "isMultiSlice": False,
            "dicomMetadata": {
                "patientId": "MH-P-10492",
                "seriesDescription": "WRIST AP/LATERAL EMERGENCY",
                "modality": "DX",
                "bodyPartExamined": "WRIST"
            },
            "technicianNotes": "Acute motorcycle trauma with wrist deformity.",
            "doctorFindings": "Complete transverse extra-articular fracture of distal radius with dorsal displacement.",
            "aiAnalysis": {
                "detected": True,
                "condition": "Acute Distal Radius Fracture (Colles type)",
                "confidence": 98.4,
                "severity": "Severe - Orthopedic Reduction Indicated",
                "recommendations": "Immediate closed reduction and splinting."
            },
            "measurements": [
                {"id": "m1", "distanceMm": 24.5, "label": "Fracture width"}
            ],
            "pins": []
        }
    ]

    # Models
    class AnnotationPayload(BaseModel):
        measurements: Optional[List[Dict[str, Any]]] = None
        pins: Optional[List[Dict[str, Any]]] = None
        doctorFindings: Optional[str] = None

    class UploadStudyPayload(BaseModel):
        id: Optional[str] = None
        patientId: str
        patientName: str
        patientAge: Optional[int] = 30
        patientGender: Optional[str] = "Male"
        studyType: str
        modality: str
        bodyRegion: str
        studyDate: Optional[str] = None
        facility: Optional[str] = "Rural Health Center"
        technicianName: Optional[str] = "Lab Technician"
        referringDoctor: Optional[str] = None
        urgency: Optional[str] = "normal"
        technicianNotes: Optional[str] = ""
        doctorFindings: Optional[str] = ""
        dicomMetadata: Optional[Dict[str, Any]] = None
        aiAnalysis: Optional[Dict[str, Any]] = None
        measurements: Optional[List[Dict[str, Any]]] = []
        pins: Optional[List[Dict[str, Any]]] = []

    # API Endpoints
    @app.get("/")
    def read_root():
        return {
            "system": "RadVault Diagnostic PACS & Imaging API",
            "version": "2.0.0",
            "status": "online",
            "endpoints": [
                "/api/radvault/records",
                "/api/radvault/upload",
                "/api/radvault/patient/{patient_id}",
                "/api/radvault/samples"
            ]
        }

    @app.get("/health")
    def health_check():
        return {"status": "healthy", "timestamp": datetime.now().isoformat()}

    @app.get("/api/radvault/records")
    def get_radvault_records(
        patient_id: Optional[str] = Query(None, description="Filter by Patient ID"),
        modality: Optional[str] = Query(None, description="Filter by Scan Modality"),
        urgency: Optional[str] = Query(None, description="Filter by Urgency status")
    ):
        """Retrieve all radiology & lab records with optional query filtering."""
        results = STUDIES_STORE
        if patient_id:
            results = [s for s in results if s.get("patientId") == patient_id]
        if modality and modality.lower() != "all":
            results = [s for s in results if s.get("modality", "").lower() == modality.lower()]
        if urgency:
            results = [s for s in results if s.get("urgency", "").lower() == urgency.lower()]
        return {"count": len(results), "studies": results}

    @app.get("/api/radvault/records/{record_id}")
    def get_study_by_id(record_id: str):
        """Retrieve full study details including DICOM tags and caliper annotations."""
        for study in STUDIES_STORE:
            if study.get("id") == record_id:
                return study
        raise HTTPException(status_code=404, detail="Study not found in RadVault archive")

    @app.post("/api/radvault/upload")
    def upload_study_json(payload: UploadStudyPayload):
        """Ingest new diagnostic study with patient binding and metadata tags."""
        new_id = payload.id or f"RV-{datetime.now().year}-{len(STUDIES_STORE) + 1000}"
        study_dict = payload.model_dump()
        study_dict["id"] = new_id
        if not study_dict.get("studyDate"):
            study_dict["studyDate"] = datetime.now().strftime("%Y-%m-%d")

        STUDIES_STORE.insert(0, study_dict)
        return {"status": "success", "message": "Study tagged and saved to RadVault", "study": study_dict}

    @app.post("/api/radvault/records/{record_id}/annotate")
    def save_study_annotations(record_id: str, payload: AnnotationPayload):
        """Save doctor measurements, pin annotations, and diagnostic interpretation."""
        for study in STUDIES_STORE:
            if study.get("id") == record_id:
                if payload.measurements is not None:
                    study["measurements"] = payload.measurements
                if payload.pins is not None:
                    study["pins"] = payload.pins
                if payload.doctorFindings is not None:
                    study["doctorFindings"] = payload.doctorFindings
                return {"status": "success", "study": study}
        raise HTTPException(status_code=404, detail="Study not found")

    @app.get("/api/radvault/patient/{patient_id}")
    def get_patient_vault(patient_id: str):
        """Retrieve complete diagnostic journey and scan history for a single unified patient."""
        patient_studies = [s for s in STUDIES_STORE if s.get("patientId") == patient_id]
        return {
            "patientId": patient_id,
            "totalStudies": len(patient_studies),
            "studies": patient_studies
        }

    @app.get("/api/radvault/samples")
    def get_demo_samples():
        """Retrieve pre-bundled clinical sample datasets for judge evaluation."""
        return {"samples": STUDIES_STORE}

    if __name__ == "__main__":
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
else:
    def main():
        print("🏥 RadVault Backend API")
        print("To run with FastAPI, run: pip install -r requirements.txt")
        print("Then run: python main.py")

    if __name__ == "__main__":
        main()
