# FreshScan — Setup Guide
## What changed in this update
- ✅ MongoDB Atlas login & signup (JWT auth)
- ✅ Every scan is saved to your MongoDB database
- ✅ Recent Scans on Home page are now LIVE (real data, auto-refreshes every 15s)
- ✅ Food name field added to Scanner & Upload pages

---

## STEP 1 — Set up MongoDB Atlas (free)

1. Go to https://www.mongodb.com/cloud/atlas and create a free account
2. Create a free cluster (M0 Sandbox)
3. Under "Database Access" → Add a new user with username + password
4. Under "Network Access" → Add IP Address → Allow from anywhere (0.0.0.0/0)
5. Click "Connect" on your cluster → "Drivers" → Copy the connection string

It looks like:
```
mongodb+srv://yourname:yourpassword@cluster0.xxxxx.mongodb.net/freshscan?retryWrites=true&w=majority
```

---

## STEP 2 — Configure backend

1. Copy the backend files into your project's `backend/` folder
2. Create a file called `.env` in the `backend/` folder (copy from `.env.example`):

```
MONGO_URI=mongodb+srv://yourname:yourpassword@cluster0.xxxxx.mongodb.net/freshscan?retryWrites=true&w=majority
JWT_SECRET=any-long-random-string-you-make-up
MODEL_PATH=../ml/model/freshness_model.h5
```

3. Install the new packages:
```bash
cd backend
pip install -r requirements.txt
```

4. Run the backend:
```bash
uvicorn app:app --reload
```

You should see: `FreshScan API is running ✅` at http://127.0.0.1:8000

---

## STEP 3 — Set up frontend

1. Copy the frontend files into your project's `frontend/src/` folder
2. Run the frontend:
```bash
cd frontend
npm install
npm start
```

The app opens at http://localhost:3000

---

## How it works now

1. Open the app → you'll be redirected to the **Login** page
2. Click **Sign up** to create your account
3. After login, you're taken to the Dashboard
4. Run a scan (Upload or Live Scanner) → name the food → it gets saved
5. The **Recent Scans** section on the Dashboard shows your real predictions, updating every 15 seconds

---

## Files changed

| File | What changed |
|------|-------------|
| `backend/app.py` | Added `/auth/signup`, `/auth/login`, `/auth/me`, `/scans/recent`. `/predict` now requires login + saves scan |
| `backend/requirements.txt` | Added pymongo, PyJWT, bcrypt, python-dotenv |
| `backend/.env.example` | New — template for your secrets |
| `frontend/src/App.js` | Added auth state, protected routes, Login/Signup routes |
| `frontend/src/components/Navbar.js` | Shows user name + logout button |
| `frontend/src/pages/Login.js` | New login page |
| `frontend/src/pages/Signup.js` | New signup page |
| `frontend/src/pages/Home.js` | Recent scans fetched live from MongoDB |
| `frontend/src/pages/Upload.js` | Sends auth token + food name to backend |
| `frontend/src/pages/Scanner.js` | Sends auth token + food name to backend |
