"""
RadVault — Backend API Server (Secure Gemini Triage Proxy)
"""

import os
import json
import logging
import requests
from dotenv import load_dotenv

# Load env configurations
load_dotenv(override=True)
load_dotenv(".env.local", override=True)

# Configure diagnostic logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("radvault-backend")

try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    from typing import List, Optional
    import uvicorn
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False

if HAS_FASTAPI:
    app = FastAPI(
        title="RadVault API",
        description="Radiology & Medical Image Vault Backend API",
        version="1.0.0"
    )

    # Configure CORS for local development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class TriageRequest(BaseModel):
        symptoms: str
        bp: Optional[str] = None
        spo2: Optional[str] = None
        temp: Optional[str] = None
        pulse: Optional[str] = None
        respRate: Optional[str] = None
        weight: Optional[str] = None
        dangerSigns: Optional[List[str]] = []
        patientAge: Optional[int] = None
        patientGender: Optional[str] = None

    def clean_json_string(s: str) -> str:
        s = s.strip()
        if s.startswith("```"):
            lines = s.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            s = "\n".join(lines).strip()
        return s

    @app.get("/")
    def read_root():
        return {"status": "online", "message": "Welcome to RadVault API"}

    @app.get("/health")
    def health_check():
        return {"status": "healthy"}

    @app.post("/api/triage")
    def triage_patient(req: TriageRequest):
        logger.info("POST /api/triage received.")
        
        # 1. Retrieve Gemini API Key from environment
        gemini_key = os.environ.get("GEMINI_API_KEY")
        logger.info(f"Gemini key present: {bool(gemini_key)}")
        
        if not gemini_key:
            logger.warning("Gemini API key missing in server environment.")
            raise HTTPException(
                status_code=503, 
                detail="Gemini AI service key not configured on server."
            )

        # 2. Extract clinical parameters (Ensuring data minimization: NO PII is sent)
        age_str = f"{req.patientAge} years old" if req.patientAge else "unknown age"
        gender_str = req.patientGender if req.patientGender else "unknown gender"
        vitals_str = (
            f"BP: {req.bp or 'N/A'}, "
            f"SpO2: {req.spo2 or 'N/A'}%, "
            f"Temp: {req.temp or 'N/A'}F, "
            f"Pulse: {req.pulse or 'N/A'}bpm, "
            f"Resp Rate: {req.respRate or 'N/A'}, "
            f"Weight: {req.weight or 'N/A'}kg"
        )
        
        # 3. Formulate the clinical prompt
        prompt = f"""
You are an expert AI Triage assistant for a frontline health worker in rural India.
Analyze the following patient parameters to assign a clinical priority risk level:

Patient: {age_str}, {gender_str}
Symptoms: {req.symptoms}
Vitals: {vitals_str}
Danger Signs Flagged: {', '.join(req.dangerSigns) if req.dangerSigns else 'None'}

Determine the risk priority:
- RED: Immediate emergency (e.g. crushing chest pain, SpO2 < 94%, severe breathing difficulty).
- ORANGE: Urgent evaluation needed within 24 hours (e.g. high fever, severe abdominal pain).
- GREEN: Routine care / local home advice (stable vitals, mild self-limiting symptoms).

You MUST respond with EXACTLY and ONLY a valid JSON object in this format:
{{
  "priority": "RED" | "ORANGE" | "GREEN",
  "explanation": "A 1-2 sentence medical explanation of findings and next step recommendations."
}}
"""

        # 4. Query Gemini API Beta Content Generation
        model = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
        
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        logger.info(f"Gemini request started using model: {model}")
        try:
            res = requests.post(url, json=payload, headers=headers, timeout=15)
            logger.info(f"Gemini response status: {res.status_code}")
            
            if res.status_code != 200:
                logger.error(f"Gemini request failed: {res.status_code}")
                raise HTTPException(
                    status_code=502,
                    detail=f"Gemini API returned status {res.status_code}: {res.text}"
                )
            
            response_data = res.json()
            candidate_text = response_data['candidates'][0]['content']['parts'][0]['text']
            
            # Parse and validate structured output
            cleaned_text = clean_json_string(candidate_text)
            parsed = json.loads(cleaned_text)
            
            priority = parsed.get("priority")
            explanation = parsed.get("explanation")
            
            if priority not in ["RED", "ORANGE", "GREEN"] or not explanation:
                logger.error("Gemini response parsing failure: malformed keys.")
                raise ValueError("Invalid properties returned in Gemini structured output")
            
            logger.info("Gemini response successfully parsed and validated.")
            return {
                "priority": priority,
                "explanation": explanation
            }
            
        except Exception as e:
            logger.error(f"Gemini triage generation failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Triage generation failed: {str(e)}"
            )

    if __name__ == "__main__":
        uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
else:
    def main():
        print("RadVault Backend Starter")
        print("To run with FastAPI, run: pip install -r requirements.txt")
        print("Then run: python main.py")

    if __name__ == "__main__":
        main()
