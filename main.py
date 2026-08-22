"""
RadVault — Backend API Server
"""

try:
    from fastapi import FastAPI
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

    @app.get("/")
    def read_root():
        return {"status": "online", "message": "Welcome to RadVault API"}

    @app.get("/health")
    def health_check():
        return {"status": "healthy"}

    if __name__ == "__main__":
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
else:
    # Basic fallback if FastAPI is not installed yet
    def main():
        print("🏥 RadVault Backend Starter")
        print("To run with FastAPI, run: pip install -r requirements.txt")
        print("Then run: python main.py")

    if __name__ == "__main__":
        main()
