import os
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
import joblib
from pymongo import MongoClient
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI
from gtts import gTTS
import jwt
import bcrypt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Load environment variables
load_dotenv()

# Import helpers
try:
    from utils import generate_report
except ImportError:
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
    allow_origins=[
        "https://ai-legal-system-frontend.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# DATABASE CONNECTION & FALLBACK
# ==============================
MONGO_URI = os.getenv("MONGO_URI")
db_mode = "mongodb"
collection = None
db = None
import json

if not MONGO_URI:
    print("[WARNING] MONGO_URI environment variable is not set. Falling back to local storage (local_history.json).")
    db_mode = "local"

if db_mode == "mongodb":
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

# ==============================
# JWT & SECURITY CONFIGURATION
# ==============================
JWT_SECRET = os.getenv("JWT_SECRET", "als_super_secret_key_12345_d78f")
JWT_ALGORITHM = "HS256"
security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_jwt_token(email: str, name: str) -> str:
    payload = {
        "email": email.lower().strip(),
        "name": name,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception:
        return None

# ==============================
# USER DATABASE FALLBACKS
# ==============================
LOCAL_USERS_PATH = "local_users.json"
users_collection = None

if db_mode == "mongodb" and db is not None:
    users_collection = db["users"]

def save_user(user_data):
    if db_mode == "mongodb" and users_collection is not None:
        try:
            users_collection.insert_one(user_data)
            print("[INFO] Saved user to MongoDB.")
            return
        except Exception as e:
            print(f"[WARNING] MongoDB user save failed: {e}. Saving locally.")
            
    try:
        users = []
        if os.path.exists(LOCAL_USERS_PATH):
            with open(LOCAL_USERS_PATH, "r", encoding="utf-8") as f:
                try:
                    users = json.load(f)
                except Exception:
                    users = []
        users.append(user_data)
        with open(LOCAL_USERS_PATH, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=4, ensure_ascii=False)
        print("[INFO] Saved user to local file successfully.")
    except Exception as io_err:
        print(f"[ERROR] Failed to save user locally: {io_err}")

def get_user_by_email(email):
    email_clean = email.lower().strip()
    if db_mode == "mongodb" and users_collection is not None:
        try:
            u = users_collection.find_one({"email": email_clean})
            if u:
                u["_id"] = str(u["_id"])
            return u
        except Exception as e:
            print(f"[WARNING] MongoDB user query failed: {e}. Checking locally.")
            
    try:
        if os.path.exists(LOCAL_USERS_PATH):
            with open(LOCAL_USERS_PATH, "r", encoding="utf-8") as f:
                try:
                    users = json.load(f)
                    for u in users:
                        if u.get("email", "").lower().strip() == email_clean:
                            return u
                except Exception:
                    return None
    except Exception as io_err:
        print(f"[ERROR] Failed to load local users: {io_err}")
    return None

def update_user(email, updated_fields):
    email_clean = email.lower().strip()
    if db_mode == "mongodb" and users_collection is not None:
        try:
            users_collection.update_one({"email": email_clean}, {"$set": updated_fields})
            return True
        except Exception as e:
            print(f"[WARNING] MongoDB user update failed: {e}. Trying locally.")
            
    # Fallback local file
    try:
        if os.path.exists(LOCAL_USERS_PATH):
            with open(LOCAL_USERS_PATH, "r", encoding="utf-8") as f:
                users = json.load(f)
            
            updated = False
            for u in users:
                if u.get("email", "").lower().strip() == email_clean:
                    for k, v in updated_fields.items():
                        u[k] = v
                    updated = True
                    break
            
            if updated:
                with open(LOCAL_USERS_PATH, "w", encoding="utf-8") as f:
                    json.dump(users, f, indent=4, ensure_ascii=False)
                return True
    except Exception as io_err:
        print(f"[ERROR] Failed to update user locally: {io_err}")
    return False


def save_record(report_data, user_email=None):
    """Save report to MongoDB if available, otherwise write to a local JSON file."""
    report_data["user_email"] = user_email
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

def get_records(limit=10, user_email=None):
    """Fetch reports from MongoDB if available, otherwise load from the local JSON file."""
    if db_mode == "mongodb" and collection is not None:
        try:
            query = {}
            if user_email:
                query = {"user_email": user_email}
            else:
                query = {"user_email": {"$exists": False}}
                
            records = list(
                collection.find(query)
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
                    if user_email:
                        filtered = [r for r in records if r.get("user_email") == user_email]
                    else:
                        filtered = [r for r in records if "user_email" not in r or r.get("user_email") is None]
                    return filtered[:limit]
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

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdateRequest(BaseModel):
    full_name: str
    phone_number: str = ""
    address: str = ""
    current_password: str = None
    new_password: str = None

# ==============================
# SPEECH TO TEXT API (WHISPER)
# ==============================
@app.post("/speech-to-text")
async def speech_to_text(file: UploadFile = File(...)):
    """Transcribe uploaded audio file using OpenAI Whisper (or fallback)."""
    api_key = os.getenv("OPENAI_API_KEY")
    
    suffix = os.path.splitext(file.filename)[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        if api_key:
            openai_client = OpenAI(api_key=api_key)
            with open(tmp_path, "rb") as audio_file:
                transcription = openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            transcript_text = transcription.text
            print(f"[INFO] Whisper API transcription: {transcript_text}")
        else:
            try:
                import speech_recognition as sr
                r = sr.Recognizer()
                with sr.AudioFile(tmp_path) as source:
                    audio_data = r.record(source)
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
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

# ==============================
# TEXT TO SPEECH API (gTTS)
# ==============================
@app.post("/text-to-speech")
def text_to_speech(data: TTSRequest):
    """Convert text to speech using Google Text-to-Speech (gTTS) and return MP3 stream."""
    try:
        tts = gTTS(text=data.text, lang=data.lang, slow=False)
        
        temp_dir = tempfile.gettempdir()
        temp_file_path = os.path.join(temp_dir, "legal_voice.mp3")
        
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
def predict_fir(data: PredictRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Predict category and generate a structured FIR/Remedies report."""
    if not data.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    global pipeline
    if pipeline is None:
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
    
    # Check if user is logged in
    user_email = None
    if credentials:
        payload = decode_jwt_token(credentials.credentials)
        if payload:
            user_email = payload.get("email")
            
    # Save to database (or local fallback)
    save_record(report, user_email)

    return report

# ==============================
# HISTORY API
# ==============================
@app.get("/history")
def get_history(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Retrieve the 10 most recent reports from the database or local fallback."""
    user_email = None
    if credentials:
        payload = decode_jwt_token(credentials.credentials)
        if payload:
            user_email = payload.get("email")
            
    return get_records(10, user_email)

# ==============================
# USER AUTHENTICATION ROUTERS
# ==============================
@app.post("/auth/register")
def register_user(data: RegisterRequest):
    email_clean = data.email.lower().strip()
    if not email_clean or not data.password or not data.full_name:
        raise HTTPException(status_code=400, detail="Missing required registration fields")
        
    existing_user = get_user_by_email(email_clean)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")
        
    hashed_pwd = hash_password(data.password)
    new_user = {
        "email": email_clean,
        "password_hash": hashed_pwd,
        "full_name": data.full_name,
        "phone_number": "",
        "address": "",
        "created_at": datetime.utcnow().isoformat()
    }
    
    save_user(new_user)
    token = create_jwt_token(email_clean, data.full_name)
    return {
        "token": token,
        "user": {
            "email": email_clean,
            "full_name": data.full_name,
            "phone_number": "",
            "address": ""
        }
    }

@app.post("/auth/login")
def login_user(data: LoginRequest):
    email_clean = data.email.lower().strip()
    user = get_user_by_email(email_clean)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
        
    if not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Invalid email or password")
        
    token = create_jwt_token(email_clean, user.get("full_name", "User"))
    return {
        "token": token,
        "user": {
            "email": email_clean,
            "full_name": user.get("full_name", ""),
            "phone_number": user.get("phone_number", ""),
            "address": user.get("address", "")
        }
    }

@app.get("/auth/me")
def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    payload = decode_jwt_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    email = payload.get("email")
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "email": user.get("email"),
        "full_name": user.get("full_name"),
        "phone_number": user.get("phone_number", ""),
        "address": user.get("address", "")
    }

@app.put("/auth/profile")
def update_profile(data: ProfileUpdateRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    payload = decode_jwt_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
        
    email = payload.get("email")
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    clean_phone = "".join([c for c in data.phone_number if c.isdigit()])
    updated_fields = {
        "full_name": data.full_name,
        "phone_number": clean_phone,
        "address": data.address
    }
    
    # If updating password
    if data.new_password:
        if not data.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to set a new password")
        if not verify_password(data.current_password, user.get("password_hash", "")):
            raise HTTPException(status_code=400, detail="Incorrect current password")
        
        # Hash new password
        updated_fields["password_hash"] = hash_password(data.new_password)
        
    success = update_user(email, updated_fields)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update user profile")
        
    # Generate new JWT token with updated name
    new_token = create_jwt_token(email, data.full_name)
    return {
        "token": new_token,
        "user": {
            "email": email,
            "full_name": data.full_name,
            "phone_number": clean_phone,
            "address": data.address
        }
    }
