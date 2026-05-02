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
MODEL_PATH = os.getenv("MODEL_PATH", "./ml/model/freshness_model.h5")
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


# ════════════════════════════════════════════════════════════
#  FRIDGE MONITOR ROUTES
# ════════════════════════════════════════════════════════════

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

fridge_scans_collection = db["fridge_scans"]

# ─── Helper: Send Alert Email ─────────────────────────────
def send_alert_email(to_email: str, user_name: str, food_name: str, result: str, confidence: float):
    """Sends an email alert when food is detected as spoiled or at risk."""
    smtp_email    = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not smtp_email or not smtp_password:
        print("⚠️  SMTP not configured — skipping email")
        return False

    try:
        subject = f"🚨 FreshScan Alert: {food_name} needs attention!"

        html = f"""
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          <div style="background:linear-gradient(135deg,#166534,#16a34a);padding:32px;text-align:center">
            <div style="font-size:48px">🥬</div>
            <h1 style="color:white;margin:12px 0 4px;font-size:22px">FreshScan Fridge Alert</h1>
            <p style="color:#bbf7d0;margin:0;font-size:14px">Automated Fridge Monitor</p>
          </div>
          <div style="padding:32px">
            <p style="color:#374151;font-size:15px">Hi <strong>{user_name}</strong>,</p>
            <p style="color:#374151;font-size:15px">Your fridge monitor just detected something that needs your attention:</p>

            <div style="background:{'#fef2f2' if result == 'Spoiled' else '#fff7ed'};border:1.5px solid {'#fecaca' if result == 'Spoiled' else '#fed7aa'};border-radius:12px;padding:20px;margin:20px 0;text-align:center">
              <div style="font-size:40px">{'🚨' if result == 'Spoiled' else '⚠️'}</div>
              <div style="font-size:22px;font-weight:800;color:#111;margin:8px 0">{food_name}</div>
              <div style="display:inline-block;background:{'#dc2626' if result == 'Spoiled' else '#f97316'};color:white;padding:6px 18px;border-radius:20px;font-weight:700;font-size:14px">{result}</div>
              <p style="color:#6b7280;font-size:13px;margin:10px 0 0">Confidence: {confidence:.1f}%</p>
            </div>

            <p style="color:#374151;font-size:14px">
              {'This item appears spoiled and should be removed from your fridge immediately.' if result == 'Spoiled' else 'This item is at risk of spoiling soon. Consider using it today.'}
            </p>

            <div style="background:#f0fdf4;border-radius:10px;padding:16px;margin-top:20px">
              <p style="color:#166534;font-size:13px;font-weight:600;margin:0">💡 Quick Tips</p>
              <ul style="color:#374151;font-size:13px;margin:8px 0 0;padding-left:20px">
                <li>Check surrounding items for cross-contamination</li>
                <li>Clean the area where the item was stored</li>
                <li>Check temperature settings of your fridge</li>
              </ul>
            </div>
          </div>
          <div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="color:#9ca3af;font-size:12px;margin:0">Sent by FreshScan Fridge Monitor · {datetime.utcnow().strftime('%d %b %Y, %H:%M')} UTC</p>
          </div>
        </div>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = smtp_email
        msg["To"]      = to_email
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(smtp_email, smtp_password)
            server.sendmail(smtp_email, to_email, msg.as_string())

        print(f"✅ Alert email sent to {to_email}")
        return True

    except Exception as e:
        print(f"❌ Email error: {e}")
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
