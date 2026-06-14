import os
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import joblib
from pymongo import MongoClient
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI
from gtts import gTTS

# Load environment variables
load_dotenv()

# Import helpers
from .utils import generate_report

app = FastAPI(
    title="AI Legal System Backend",
    description="AI-powered FIR Analysis and Legal Assistance Platform",
    version="1.0.0"
)

@app.get("/")
def home():
    return {
        "status": "running",
        "message": "AI Legal System Backend is live"
    }

# ==============================
# CORS (Frontend connection)
# ==============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# DATABASE CONNECTION & FALLBACK
# ==============================
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise Exception("MONGO_URI environment variable is not set")
db_mode = "mongodb"
collection = None
import json

try:
    # Set connection timeout to 2 seconds to fail fast if DNS or internet is down
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    # Trigger connection check
    client.admin.command('ping')
    db = client["fir_database"]
    collection = db["fir_records"]
    print("[SUCCESS] Connected to MongoDB Atlas!")
except Exception as db_init_err:
    print(f"[WARNING] MongoDB Atlas connection failed: {db_init_err}. Falling back to local storage (local_history.json).")
    db_mode = "local"

LOCAL_DB_PATH = "local_history.json"

def save_record(report_data):
    """Save report to MongoDB if available, otherwise write to a local JSON file."""
    if db_mode == "mongodb" and collection is not None:
        try:
            inserted_report = dict(report_data)
            collection.insert_one(inserted_report)
            print("[INFO] Saved report to MongoDB Atlas.")
            return
        except Exception as db_err:
            print(f"[WARNING] MongoDB write failed: {db_err}. Saving locally.")
            
    # Fallback local file storage
    try:
        records = []
        if os.path.exists(LOCAL_DB_PATH):
            with open(LOCAL_DB_PATH, "r", encoding="utf-8") as f:
                try:
                    records = json.load(f)
                except Exception:
                    records = []
        
        # Insert new record at the start
        records.insert(0, report_data)
        with open(LOCAL_DB_PATH, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=4, ensure_ascii=False)
        print("[INFO] Saved report to local file system successfully.")
    except Exception as io_err:
        print(f"[ERROR] Failed to save report locally: {io_err}")

def get_records(limit=10):
    """Fetch reports from MongoDB if available, otherwise load from the local JSON file."""
    if db_mode == "mongodb" and collection is not None:
        try:
            records = list(
                collection.find()
                .sort("timestamp", -1)
                .limit(limit)
            )
            for r in records:
                r["_id"] = str(r["_id"])
            return records
        except Exception as db_err:
            print(f"[WARNING] MongoDB query failed: {db_err}. Reading local storage.")
            
    # Fallback local file storage
    try:
        if os.path.exists(LOCAL_DB_PATH):
            with open(LOCAL_DB_PATH, "r", encoding="utf-8") as f:
                try:
                    records = json.load(f)
                    return records[:limit]
                except Exception:
                    return []
    except Exception as io_err:
        print(f"[ERROR] Failed to load local reports: {io_err}")
    return []


# ==============================
# LOAD MODEL PIPELINE
# ==============================
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(CURRENT_DIR, "model.pkl")

try:
    pipeline = joblib.load(MODEL_PATH)
    print("[SUCCESS] Model pipeline loaded successfully!")
except Exception as e:
    print(f"[ERROR] Error loading model.pkl at {MODEL_PATH}: {e}. Please run ml_model.py first.")
    pipeline = None

# ==============================
# REQUEST SCHEMA
# ==============================
class PredictRequest(BaseModel):
    text: str

class TTSRequest(BaseModel):
    text: str
    lang: str = "en"

# ==============================
# SPEECH TO TEXT API (WHISPER)
# ==============================
@app.post("/speech-to-text")
async def speech_to_text(file: UploadFile = File(...)):
    """Transcribe uploaded audio file using OpenAI Whisper (or fallback)."""
    api_key = os.getenv("OPENAI_API_KEY")
    
    # Save UploadFile to a temporary file
    suffix = os.path.splitext(file.filename)[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        if api_key:
            # Call OpenAI Whisper API
            openai_client = OpenAI(api_key=api_key)
            with open(tmp_path, "rb") as audio_file:
                transcription = openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            transcript_text = transcription.text
            print(f"[INFO] Whisper API transcription: {transcript_text}")
        else:
            # Fallback if no OpenAI API key is present: Try local transcription or return error
            # To avoid dependency overload on standard systems, we can check if SpeechRecognition is installed.
            try:
                import speech_recognition as sr
                r = sr.Recognizer()
                with sr.AudioFile(tmp_path) as source:
                    audio_data = r.record(source)
                    # Use Google Speech Recognition (free, multilingual)
                    transcript_text = r.recognize_google(audio_data, language="hi-IN")
                    print(f"[INFO] Google Speech Recognition fallback: {transcript_text}")
            except Exception as sr_err:
                print(f"Fallback speech recognition failed: {sr_err}")
                raise HTTPException(
                    status_code=400,
                    detail="Speech-to-Text failed. Please configure 'OPENAI_API_KEY' in .env or use browser voice typing."
                )
        
        return {"transcript": transcript_text}

    finally:
        # Clean up temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

# ==============================
# TEXT TO SPEECH API (gTTS)
# ==============================
@app.post("/text-to-speech")
def text_to_speech(data: TTSRequest):
    """Convert text to speech using Google Text-to-Speech (gTTS) and return MP3 stream."""
    try:
        # Create gTTS object
        # Note: lang can be 'en' or 'hi'
        tts = gTTS(text=data.text, lang=data.lang, slow=False)
        
        # Save to temp file
        temp_dir = tempfile.gettempdir()
        temp_file_path = os.path.join(temp_dir, "legal_voice.mp3")
        
        # Overwrite if exists
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass
                
        tts.save(temp_file_path)
        
        return FileResponse(
            path=temp_file_path,
            media_type="audio/mpeg",
            filename="legal_remedy.mp3"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text-to-Speech conversion failed: {str(e)}")

# ==============================
# PREDICT & REPORT GENERATION API
# ==============================
@app.post("/predict")
def predict_fir(data: PredictRequest):
    """Predict category and generate a structured FIR/Remedies report."""
    if not data.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    global pipeline
    if pipeline is None:
        # Try reloading the model if it wasn't loaded on startup
        try:
            pipeline = joblib.load(MODEL_PATH)
        except Exception:
            raise HTTPException(status_code=500, detail=f"ML Model pipeline is not loaded from {MODEL_PATH}.")

    # Predict category
    predicted_category = pipeline.predict([data.text])[0]
    
    # Generate structured legal report
    api_key = os.getenv("OPENAI_API_KEY")
    report = generate_report(data.text, predicted_category, api_key)
    
    # Enrich report with raw text and predictions info
    report["input_text"] = data.text
    report["category"] = predicted_category
    report["timestamp"] = datetime.now().isoformat()
    
    # Save to database (or local fallback)
    save_record(report)

    return report

# ==============================
# HISTORY API
# ==============================
@app.get("/history")
def get_history():
    """Retrieve the 10 most recent reports from the database or local fallback."""
    return get_records(10)