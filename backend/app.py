from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
import io
import time
import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# ─── CORS ────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── MongoDB Atlas Connection ─────────────────────────────
MONGO_URI = os.getenv("MONGO_URI")  # Set this in your .env file
if MONGO_URI:
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
        db = client["freshscan"]
        users_collection = db["users"]
        scans_collection = db["scans"]
    except Exception as e:
        print(f"✗ MongoDB connection warning: {e}")
        db = None
        users_collection = None
        scans_collection = None
else:
    print("✗ MONGO_URI not set in environment variables")
    db = None
    users_collection = None
    scans_collection = None

# ─── JWT Config ───────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-key-change-this")
JWT_EXPIRE_HOURS = 24

security = HTTPBearer()

# ─── Load ML Model ───────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(BASE_DIR, "ml", "model", "freshness_model.h5"))
model = load_model(MODEL_PATH)
class_labels = ["Fresh", "Spoiled"]


# ─── Helper: Create JWT Token ────────────────────────────
def create_token(user_id: str, email: str):
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


# ─── Helper: Verify JWT Token ────────────────────────────
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired. Please login again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token. Please login again.")


# ════════════════════════════════════════════════════════════
#  AUTH ROUTES
# ════════════════════════════════════════════════════════════

@app.post("/auth/signup")
async def signup(data: dict):
    """
    Expects: { "name": "...", "email": "...", "password": "..." }
    """
    try:
        name     = data.get("name", "").strip()
        email    = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not name or not email or not password:
            raise HTTPException(status_code=400, detail="Name, email, and password are required.")

        if len(password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

        # Check if user already exists
        existing = users_collection.find_one({"email": email})
        if existing:
            raise HTTPException(status_code=409, detail="An account with this email already exists.")

        # Hash password
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

        # Save user to MongoDB
        user = {
            "name": name,
            "email": email,
            "password": hashed,
            "created_at": datetime.utcnow()
        }
        result = users_collection.insert_one(user)
        user_id = str(result.inserted_id)

        token = create_token(user_id, email)

        return {
            "message": "Account created successfully!",
            "token": token,
            "user": {"id": user_id, "name": name, "email": email}
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.post("/auth/login")
async def login(data: dict):
    """
    Expects: { "email": "...", "password": "..." }
    """
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user_id = str(user["_id"])
    token   = create_token(user_id, email)

    return {
        "message": "Login successful!",
        "token": token,
        "user": {"id": user_id, "name": user["name"], "email": email}
    }


@app.get("/auth/me")
async def get_me(current_user: dict = Depends(verify_token)):
    """Returns the logged-in user's profile."""
    user = users_collection.find_one({"_id": ObjectId(current_user["user_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"]
    }


# ════════════════════════════════════════════════════════════
#  SCAN ROUTES
# ════════════════════════════════════════════════════════════

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    temperature: float = Form(...),
    humidity: float = Form(...),
    storage_hours: float = Form(...),
    food_name: str = Form(default="Unknown"),
    current_user: dict = Depends(verify_token)   # <-- requires login
):
    start_time = time.time()

    try:
        # ─── Image Processing ─────────────────────────────
        img_bytes = await file.read()
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        prediction = model.predict(img_array)[0]
        predicted_index = int(np.argmax(prediction))
        result = class_labels[predicted_index]
        confidence = float(prediction[predicted_index])

        # ─── Sensor Risk Calculation ──────────────────────
        risk_score = 0
        if temperature > 25:
            risk_score += 0.15
        if humidity > 70:
            risk_score += 0.15
        if storage_hours > 48:
            risk_score += 0.25

        adjusted_confidence = confidence - risk_score

        # ─── Final Decision ───────────────────────────────
        if result == "Fresh":
            if adjusted_confidence < 0.5:
                final_result = "At Risk"
                explanation = (
                    "Visually appears fresh, but environmental conditions "
                    "increase spoilage risk."
                )
            else:
                final_result = "Fresh"
                explanation = "Visual and environmental analysis indicate safe freshness."
        else:
            final_result = "Spoiled"
            explanation = "Visual spoilage detected. Item is not recommended for consumption."

        latency = round((time.time() - start_time) * 1000, 2)

        response_data = {
            "result": final_result,
            "visual_confidence": round(confidence * 100, 1),
            "adjusted_confidence": round(adjusted_confidence, 3),
            "temperature": temperature,
            "humidity": humidity,
            "storage_hours": storage_hours,
            "latency_ms": latency,
            "model_used": "MobileNetV2 + Environmental Risk Adjustment",
            "explanation": explanation
        }

        # ─── Save Scan to MongoDB ─────────────────────────
        scan_doc = {
            "user_id": current_user["user_id"],
            "food_name": food_name,
            "result": final_result,
            "confidence": round(confidence * 100, 1),
            "temperature": temperature,
            "humidity": humidity,
            "storage_hours": storage_hours,
            "explanation": explanation,
            "scanned_at": datetime.utcnow()
        }
        scans_collection.insert_one(scan_doc)

        return response_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/scans/recent")
async def get_recent_scans(
    limit: int = 10,
    current_user: dict = Depends(verify_token)
):
    """
    Returns the most recent scans for the logged-in user.
    """
    scans = list(
        scans_collection
        .find({"user_id": current_user["user_id"]})
        .sort("scanned_at", -1)
        .limit(limit)
    )

    result = []
    for s in scans:
        result.append({
            "id": str(s["_id"]),
            "food_name": s.get("food_name", "Unknown"),
            "result": s["result"],
            "confidence": s["confidence"],
            "scanned_at": s["scanned_at"].isoformat() + "Z"
        })

    return result


@app.get("/")
def root():
    return {"message": "FreshScan API is running ✅"}
