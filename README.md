<div align="center">

# 🥬 FreshScan — Food Freshness Detection System

An AI-powered full-stack web application that detects whether food is **Fresh or Rotten** using deep learning and real-time image analysis.

---

**🚀 Live Demo:**

👉 Frontend: https://freshscan-nine.vercel.app/

👉 Backend: https://sem-project-production.up.railway.app/

⚠️ *Important: Please open the backend link once before using the app (it may sleep on free hosting).*

</div>

---

## 📌 Overview

FreshScan solves a real-world problem — identifying food freshness quickly and reliably. Traditional inspection methods are manual and subjective, which can lead to food waste and health risks. This system automates freshness detection using a trained deep learning model and provides instant predictions with confidence scores.

The project follows a **modular full-stack architecture** integrating a React frontend, a Node.js backend, and a Flask-based ML microservice.

---

## ⚙️ Tech Stack

### 🖥️ Frontend

* React.js
* HTML5, CSS3, JavaScript
* Fetch API / Axios

### 🔧 Backend

* Node.js
* Express.js
* Multer (file upload handling)
* JWT Authentication

### 🤖 Machine Learning

* Python
* Flask
* TensorFlow / Keras
* MobileNetV2 (Transfer Learning)

### 🗄️ Database

* MongoDB Atlas

### 📩 Additional Services

* SendGrid (Email & OTP verification)

---

## 📊 Model Details

| Parameter         | Value                             |
| ----------------- | --------------------------------- |
| Dataset           | Kaggle Fresh & Rotten Food Images |
| Model             | MobileNetV2 (Transfer Learning)   |
| Optimizer         | Adam                              |
| Loss Function     | Categorical Cross-Entropy         |
| Epochs            | 20–30                             |
| Batch Size        | 32                                |
| Accuracy          | **88–92%**                        |
| Data Augmentation | Flip, rotation, zoom, brightness  |

---

## 🔄 System Workflow

1. User uploads image or captures via camera
2. React frontend sends image to Node.js backend
3. Backend validates and forwards image to Flask ML service
4. Flask preprocesses image and runs CNN inference
5. Model returns prediction (Fresh/Rotten + confidence)
6. Backend stores result in MongoDB
7. Frontend displays result and updates scan history

---

## 🔌 API Endpoints

### Backend (Node.js + Express)

| Method | Endpoint              | Description                   |
| ------ | --------------------- | ----------------------------- |
| `POST` | `/predict`            | Upload image & get prediction |
| `GET`  | `/scans/recent`       | Fetch recent scans            |
| `POST` | `/auth/signup`        | Register user                 |
| `POST` | `/auth/login`         | Login user                    |
| `POST` | `/auth/verify-signup` | Verify OTP                    |
| `POST` | `/auth/resend-otp`    | Resend OTP                    |

---

### ML Microservice (Flask)

| Method | Endpoint    | Description                           |
| ------ | ----------- | ------------------------------------- |
| `POST` | `/classify` | Image preprocessing + model inference |

---

## 📤 Example Response

```json
{
  "label": "Fresh",
  "confidence": 98.9,
  "analyzed_in_ms": 3613
}
```

---

## ✨ Features

* 📷 Upload or scan food images
* 🤖 AI-based freshness detection
* 📊 Confidence score visualization
* 🔐 Secure authentication using JWT
* 🕐 Scan history tracking (MongoDB)
* 📩 OTP-based email verification (SendGrid)
* ⚡ Fast and responsive UI

---

## 🧠 Key Concepts Used

* Transfer Learning (MobileNetV2)
* REST API Architecture
* JWT Authentication
* Microservice Architecture (Flask ML service)
* MongoDB NoSQL Database

---

## 🛠️ Local Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2️⃣ Setup Frontend

```bash
cd frontend
npm install
npm start
```

### 3️⃣ Setup Backend

```bash
cd backend
npm install
npm run dev
```

### 4️⃣ Setup ML Service

```bash
cd ml-service
pip install -r requirements.txt
python app.py
```

---

## 🌐 Deployment

* **Frontend (Vercel):** https://freshscan-nine.vercel.app/
* **Backend (Railway):** https://sem-project-production.up.railway.app/
* **Database:** MongoDB Atlas

---

## 👩‍💻 Team

| Name            |
| --------------- |
| Ishika Garg (Team Leader)   |
| Vanshika Gupta  |
| Kajal Chaudhary |

---

## 📄 License

This project is developed for academic purposes at GLA University (2026).

---

<div align="center">

Made with 💚 by Team FreshScan 🚀

🌿 **Try it Live → https://freshscan-nine.vercel.app/**

</div>


