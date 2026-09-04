import sys
import os
import requests
import json
from dotenv import load_dotenv

# Load env file
load_dotenv()
load_dotenv(".env.local")

def run_tests():
    print("=== TESTING FASTAPI GEMINI PROXY ENDPOINT ===")
    
    url = "http://127.0.0.1:8000/api/triage"
    
    payload = {
        "symptoms": "Mild cough and slightly runny nose since yesterday.",
        "bp": "118/78",
        "spo2": "98",
        "temp": "98.6",
        "pulse": "72",
        "respRate": "16",
        "weight": "62",
        "dangerSigns": [],
        "patientAge": 28,
        "patientGender": "Female"
    }
    
    print("\n--- Test Case A: Missing key or service validation ---")
    # Backup GEMINI_API_KEY
    orig_key = os.environ.get("GEMINI_API_KEY")
    if "GEMINI_API_KEY" in os.environ:
        del os.environ["GEMINI_API_KEY"]
        
    try:
        # Note: server process needs to be restarted for os.environ changes, so we will test the endpoint live
        # assuming the key is either configured or not. Let's make the HTTP request.
        res = requests.post(url, json=payload, timeout=15)
        print(f"Status Code: {res.status_code}")
        print(f"Response: {res.text}")
    except Exception as e:
        print(f"Connection failed (FastAPI server not running): {e}")
        
    # Restore key if set
    if orig_key:
        os.environ["GEMINI_API_KEY"] = orig_key

if __name__ == "__main__":
    run_tests()
