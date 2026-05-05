from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
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
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── MongoDB Atlas Connection ─────────────────────────────
MONGO_URI = os.getenv("MONGO_URI")  # Set this in your .env file
client = MongoClient(MONGO_URI)
db = client["freshscan"]
users_collection = db["users"]
scans_collection = db["scans"]

# ─── JWT Config ───────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-key-change-this")
JWT_EXPIRE_HOURS = 24

security = HTTPBearer()

# ─── Load ML Model ───────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "ml", "model", "freshness_model.h5")

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

import random
import string

# OTP temporary storage in MongoDB
otp_collection = db["otps"]

# ─── Helper: Generate 6-digit OTP ────────────────────────
def generate_otp():
    return "".join(random.choices(string.digits, k=6))

# ─── Helper: Send OTP Email ──────────────────────────────
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

def send_otp_email(to_email: str, otp: str, purpose: str = "verify"):
    SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
    FROM_EMAIL = os.getenv("FROM_EMAIL")

    if not SENDGRID_API_KEY or not FROM_EMAIL:
        print("❌ SendGrid not configured properly")
        return False

    try:
        action = "create your account" if purpose == "signup" else "log in"

        message = Mail(
            from_email=FROM_EMAIL,
            to_emails=to_email,
            subject=f"FreshScan OTP: {otp}",
            plain_text_content=f"Your OTP is {otp}",
            html_content=f"""
            <div style="font-family:Arial;">
                <h2>🥬 FreshScan Verification</h2>
                <p>Your OTP is:</p>
                <h1 style="letter-spacing:5px;">{otp}</h1>
                <p>Use this to {action}</p>
                <p><small>Expires in 10 minutes</small></p>
            </div>
            """
        )

        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)

        print("✅ OTP sent:", response.status_code)
        return True

    except Exception as e:
        print("❌ SendGrid OTP error:", str(e))
        return False

# ════════════════════════════════════════════════════════════
#  STEP 1 — SIGNUP: save pending user, send OTP
# ════════════════════════════════════════════════════════════
@app.post("/auth/signup")
async def signup(data: dict):
    name     = data.get("name", "").strip()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="Name, email, and password are required.")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    # Check duplicate
    existing = users_collection.find_one({"email": email, "verified": True})
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    # Hash password
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    # Save as unverified user (overwrite any previous unverified attempt)
    users_collection.update_one(
        {"email": email, "verified": {"$ne": True}},
        {"$set": {
            "name": name, "email": email,
            "password": hashed,
            "verified": False,
            "created_at": datetime.utcnow()
        }},
        upsert=True
    )

    # Generate & store OTP
    otp = generate_otp()
    otp_collection.update_one(
        {"email": email, "purpose": "signup"},
        {"$set": {
            "email": email, "purpose": "signup",
            "otp": otp,
            "expires_at": datetime.utcnow() + timedelta(minutes=10),
            "attempts": 0
        }},
        upsert=True
    )

    sent = send_otp_email(email, otp, purpose="signup")

    return {
        "message": f"OTP sent to {email}. Please check your inbox.",
        "email": email,
        "otp_required": True
    }


# ════════════════════════════════════════════════════════════
#  STEP 2 — VERIFY SIGNUP OTP → create account
# ════════════════════════════════════════════════════════════
@app.post("/auth/verify-signup")
async def verify_signup(data: dict):
    email = data.get("email", "").strip().lower()
    otp   = data.get("otp", "").strip()

    if not email or not otp:
        raise HTTPException(status_code=400, detail="Email and OTP are required.")

    record = otp_collection.find_one({"email": email, "purpose": "signup"})
    if not record:
        raise HTTPException(status_code=400, detail="No OTP found. Please signup again.")

    if datetime.utcnow() > record["expires_at"]:
        otp_collection.delete_one({"email": email, "purpose": "signup"})
        raise HTTPException(status_code=400, detail="OTP has expired. Please signup again.")

    if record.get("attempts", 0) >= 5:
        raise HTTPException(status_code=429, detail="Too many wrong attempts. Please signup again.")

    if record["otp"] != otp:
        otp_collection.update_one(
            {"email": email, "purpose": "signup"},
            {"$inc": {"attempts": 1}}
        )
        remaining = 4 - record.get("attempts", 0)
        raise HTTPException(status_code=400, detail=f"Wrong OTP. {remaining} attempts remaining.")

    # OTP correct — mark user as verified
    user = users_collection.find_one_and_update(
        {"email": email},
        {"$set": {"verified": True}},
        return_document=True
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please signup again.")

    # Clean up OTP
    otp_collection.delete_one({"email": email, "purpose": "signup"})

    user_id = str(user["_id"])
    token   = create_token(user_id, email)

    return {
        "message": "Account verified and created successfully!",
        "token": token,
        "user": {"id": user_id, "name": user["name"], "email": email}
    }


# ════════════════════════════════════════════════════════════
#  LOGIN — direct email + password, no OTP needed
#  (email already verified during signup)
# ════════════════════════════════════════════════════════════
@app.post("/auth/login")
async def login(data: dict):
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    user = users_collection.find_one({"email": email, "verified": True})
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


# ─── Resend OTP ───────────────────────────────────────────
@app.post("/auth/resend-otp")
async def resend_otp(data: dict):
    email   = data.get("email", "").strip().lower()
    purpose = data.get("purpose", "login")  # "login" or "signup"

    if not email:
        raise HTTPException(status_code=400, detail="Email is required.")

    otp = generate_otp()
    otp_collection.update_one(
        {"email": email, "purpose": purpose},
        {"$set": {
            "otp": otp,
            "expires_at": datetime.utcnow() + timedelta(minutes=10),
            "attempts": 0
        }},
        upsert=True
    )

    send_otp_email(email, otp, purpose=purpose)
    return {"message": f"New OTP sent to {email}."}


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


# ════════════════════════════════════════════════════════════
#  FRIDGE MONITOR ROUTES
# ════════════════════════════════════════════════════════════

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

fridge_scans_collection = db["fridge_scans"]

# ─── Helper: Send Alert Email ─────────────────────────────
def send_alert_email(to_email, user_name, food_name, result, confidence):
    SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
    FROM_EMAIL = os.getenv("FROM_EMAIL")

    if not SENDGRID_API_KEY or not FROM_EMAIL:
        print("❌ SendGrid not configured properly")
        return False

    try:
        message = Mail(
            from_email=FROM_EMAIL,
            to_emails=to_email,
            subject=f"FreshScan Alert: {food_name}",
            plain_text_content=f"{food_name} is {result}",
            html_content=f"""
            <div style="font-family:Arial;">
                <h2>🥬 FreshScan Alert</h2>
                <p>Hi <b>{user_name}</b>,</p>
                <p><b>{food_name}</b> is detected as:</p>
                <h2>{result}</h2>
                <p>Confidence: {confidence}%</p>
            </div>
            """
        )

        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)

        print("✅ Alert sent:", response.status_code)
        return True

    except Exception as e:
        print("❌ SendGrid alert error:", str(e))
        return False


@app.post("/fridge/scan")
async def fridge_scan(
    file: UploadFile = File(...),
    food_name: str = Form(default="Unknown Item"),
    temperature: float = Form(default=4.0),
    humidity: float = Form(default=60.0),
    storage_hours: float = Form(default=24.0),
    current_user: dict = Depends(verify_token)
):
    """
    Auto-scan endpoint for fridge monitor.
    Runs prediction and sends email alert if spoiled/at risk.
    """
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

        # ─── Risk Calculation ─────────────────────────────
        risk_score = 0
        if temperature > 8:   risk_score += 0.15   # fridge should be < 8°C
        if humidity > 70:     risk_score += 0.15
        if storage_hours > 48: risk_score += 0.25

        adjusted_confidence = confidence - risk_score

        if result == "Fresh":
            if adjusted_confidence < 0.5:
                final_result = "At Risk"
                explanation  = "Appears fresh but conditions suggest risk."
            else:
                final_result = "Fresh"
                explanation  = "Looks good! Safe to consume."
        else:
            final_result = "Spoiled"
            explanation  = "Spoilage detected. Remove from fridge."

        latency = round((time.time() - start_time) * 1000, 2)

        # ─── Save to MongoDB ──────────────────────────────
        scan_doc = {
            "user_id":    current_user["user_id"],
            "food_name":  food_name,
            "result":     final_result,
            "confidence": round(confidence * 100, 1),
            "temperature": temperature,
            "humidity":   humidity,
            "storage_hours": storage_hours,
            "explanation": explanation,
            "scanned_at": datetime.utcnow(),
            "source":     "fridge_monitor"
        }
        fridge_scans_collection.insert_one(scan_doc)

        # ─── Send Email Alert if Spoiled/At Risk ──────────
        email_sent = False
        if final_result in ["Spoiled", "At Risk"]:
            user = users_collection.find_one({"_id": ObjectId(current_user["user_id"])})
            if user:
                email_sent = send_alert_email(
                    to_email   = user["email"],
                    user_name  = user["name"],
                    food_name  = food_name,
                    result     = final_result,
                    confidence = round(confidence * 100, 1)
                )

        return {
            "result":             final_result,
            "confidence":         round(confidence * 100, 1),
            "adjusted_confidence": round(adjusted_confidence, 3),
            "explanation":        explanation,
            "latency_ms":         latency,
            "email_sent":         email_sent,
            "scanned_at":         datetime.utcnow().isoformat() + "Z"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/fridge/history")
async def get_fridge_history(
    limit: int = 20,
    current_user: dict = Depends(verify_token)
):
    """Returns fridge scan history for the logged-in user."""
    scans = list(
        fridge_scans_collection
        .find({"user_id": current_user["user_id"]})
        .sort("scanned_at", -1)
        .limit(limit)
    )
    return [{
        "id":         str(s["_id"]),
        "food_name":  s.get("food_name", "Unknown"),
        "result":     s["result"],
        "confidence": s["confidence"],
        "explanation": s.get("explanation", ""),
        "scanned_at": s["scanned_at"].isoformat() + "Z"
    } for s in scans]