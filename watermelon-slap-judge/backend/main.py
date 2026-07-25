import os
import shutil
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from services.audio_processing import extract_features
from services.prediction import WatermelonJudge

app = FastAPI(title="Watermelon Slap Judge API")

# Enable CORS for your Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Allow your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Judge
judge = WatermelonJudge()

# Directory to save temporary uploads
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class JudgmentResponse(BaseModel):
    score: int
    label: str
    confidence: float
    explanation: list[str]
    audioFeatures: dict

# Added this to fix the 404 Not Found error on the root URL
@app.get("/")
def read_root():
    return {"message": "Watermelon Slap Judge API is running. Go to /docs for API documentation."}

@app.post("/api/judge", response_model=JudgmentResponse)
async def judge_slap(audio: UploadFile = File(...)):
    """
    Accepts an audio file, extracts features, and returns ripeness judgment.
    """
    if not audio.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Validate file type
    if not audio.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File must be an audio format")

    # Save file temporarily
    file_path = os.path.join(UPLOAD_DIR, audio.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
        
        # 1. Extract Features
        features = extract_features(file_path)
        
        # 2. Predict Ripeness 
        # ✅ CHANGED HERE: Now uses the unified .predict() method 
        # which automatically uses your trained ML model if available, 
        # or falls back to rules if not.
        result = judge.predict(features)
        
        # Add features to response for debugging/frontend visualization
        result['audioFeatures'] = features
        
        return result

    except Exception as e:
        import traceback
        print("--- API ERROR ---")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Clean up uploaded file
        if os.path.exists(file_path):
            os.remove(file_path)

@app.get("/api/health")
def health_check():
    return {"status": "ok"}