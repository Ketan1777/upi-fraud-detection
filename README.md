# 🛡️ UPI FraudGuard AI — Real-Time Digital Payment Fraud Detection & Reversal Platform

[![Live Demo on Vercel](https://img.shields.io/badge/Vercel-Live%20Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://upi-fraud-detection-flax-three.vercel.app/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.6+-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![NetworkX](https://img.shields.io/badge/NetworkX-3.4+-blue?style=for-the-badge)](https://networkx.org/)

An enterprise-grade, full-stack cybersecurity and fintech platform designed for **real-time fraud detection, money mule ring interception, and instant transaction reversal** in high-volume digital payment networks (UPI, IMPS, Cards).

---

## 🌐 Live Deployment

* 🚀 **Production Application URL**: **[https://upi-fraud-detection-flax-three.vercel.app/](https://upi-fraud-detection-flax-three.vercel.app/)**
* 📊 **Direct Security Operations Dashboard**: **[https://upi-fraud-detection-flax-three.vercel.app/dashboard](https://upi-fraud-detection-flax-three.vercel.app/dashboard)**
* 🎛️ **AI Evaluator & Instant Reversal Console**: **[https://upi-fraud-detection-flax-three.vercel.app/detector](https://upi-fraud-detection-flax-three.vercel.app/detector)**
* 🕸️ **Mule Network Visualizer**: **[https://upi-fraud-detection-flax-three.vercel.app/network](https://upi-fraud-detection-flax-three.vercel.app/network)**

---

## 🌟 Key Highlights & Innovations

### 1. ⚡ Smart Escrow Cooldown & 30-Second Immediate Reversal Window
* **The Problem**: Standard UPI protocols settle immediately with instant finality, making scam recovery almost impossible once authenticated.
* **The Solution**: A configurable **30-second security buffer window** for high-risk or novel transfers:
  * **"Cancel & Undo Immediately"**: Intercepts in-flight transactions and simulates an immediate refund back to the remitter's balance.
  * **"Modify Details Before Settlement"**: Correct recipient VPA or transaction amounts in-flight before final banking ledger commitment.
  * **"Emergency Mule Freeze"**: Instantly locks the beneficiary VPA across partner nodes, preventing cashout at ATMs.

### 2. 🧠 Hybrid Machine Learning Ensemble
* **Random Forest Classifier**: Calibrated supervised detection trained on historical spending deviation, burst frequency, and nocturnal hour indicators.
* **Isolation Forest**: Unsupervised anomaly detection detecting zero-day laundering and novel fraud variants without labeled precedent.
* **Explainable AI (XAI)**: Feature-level point attribution breakdown (e.g. `+30 pts Android Emulator Detected`, `+40 pts High In-Degree Mule Hub`).

### 3. 🕸️ Graph Topology & Money Mule Hub Detection
* Powered by **NetworkX**: Models payment flows as directed graphs.
* Analyzes **in-degree centrality** in real time: flags collector accounts accepting rapid inbound funds from $>4$ distinct payers within a 60-minute sliding window.

### 4. 🔐 Step-Up Multi-Factor Authentication (MFA)
* Ambiguous transactions with risk scores between 40–74 (`REVIEW` state) trigger an interactive **two-factor biometric / simulated SMS OTP challenge** (Demo OTP: `123456`) before settlement.

### 5. 📡 Dual-Mode Architecture (Cloud Edge + Local FastAPI)
* **Cloud Mode (Vercel)**: Runs an in-browser synthetic transaction bus streaming realistic payment traffic and alerts every 3.2 seconds without requiring local setup.
* **Full-Stack Mode**: Connects directly to a **FastAPI backend (port 8000)** with SQLite/PostgreSQL, SQLAlchemy, JWT auth, and live WebSockets (`/ws/live-transactions`).

---

## 🏗️ Architecture & Workflow

```mermaid
flowchart TD
    A["UPI Payment Ingestion\n(REST API / Live WebSocket Simulator)"] --> B["Feature Engineering Engine"]
    
    B --> C1["Behavioral Velocity\n- txns in last 5m\n- amount vs 30d avg\n- seconds since last txn"]
    B --> C2["Device & Telemetry\n- Rooted / Emulator Flag\n- Geo / IP Anomaly\n- Nocturnal Hour Spike"]
    B --> C3["Graph Topology Engine\n- NetworkX In-degree Centrality\n- Mule Fan-in Detection"]
    
    C1 --> D["Hybrid AI Scorer\n(Random Forest + Isolation Forest)"]
    C2 --> D
    C3 --> D
    
    D --> E{"Risk Score Evaluation (0 - 100)"}
    
    E -- "Score 0 - 39" --> F["ALLOW (Safe Auto-Cleared)"]
    E -- "Score 40 - 74" --> G["REVIEW (Step-Up MFA Challenge)"]
    E -- "Score 75 - 100" --> H["BLOCK (Immediate Interception)"]
    
    F --> I["30-Second Smart Cooldown Window"]
    G --> I
    H --> I
    
    I -- "User clicks Undo" --> J["TRANSACTION REVERTED & REFUNDED"]
    I -- "Cooldown clears" --> K["Final Banking Settlement & Ledger Commit"]
    
    K --> L["Real-Time Broadcast (/ws/live-transactions)"]
    L --> M["Security Operations Center Dashboard"]
```

---

## 🖥️ Interactive Modules & Pages

| Module | Route | Capabilities |
| :--- | :--- | :--- |
| **Executive Dashboard** | `/dashboard` | Real-time KPI counters (Safe, Suspicious, Blocked, ₹ Saved), payment app share (PhonePe, GPay, Paytm, CRED, BHIM), diurnal threat histogram, live transaction ticker. |
| **Live Stream Monitor** | `/live` | High-throughput live transaction table with instant classification filters (`ALL`, `SAFE`, `SUSPICIOUS`, `FRAUDULENT`) and risk badges (0–100). |
| **AI Fraud Evaluator & Reversal** | `/detector` | Interactive testing sandbox with 4 realistic presets (Swiggy retail, Compromised burst, Money mule, 3 AM emulator ATO), instant 30s cancellation window, in-flight editing, and XAI attribution. |
| **Fraud Alerts Triage** | `/alerts` | Incident investigation queue filtered by severity (`CRITICAL`, `HIGH`, `MEDIUM`) and status with reviewer notes modal. |
| **Forensic Transaction Ledger** | `/history` | Search across 1,500+ records by Txn ID, VPA, or amount range with one-click **CSV Report Export**. |
| **Money Mule Network Graph** | `/network` | Interactive SVG graph visualizing laundering flows, in-degree centrality, and mule aggregator nodes. |
| **Governance & Analytics** | `/reports` | Executive performance summaries, ROC-AUC metrics, confusion matrices, and bimodal risk score distribution. |
| **Admin Operations** | `/admin` | Infrastructure health monitor (DB, AI Engine, WebSocket pool), role delegation (Admin vs. Analyst), and immutable cryptographic audit trail. |

---

## 📁 Directory Structure

```text
upi-fraud-detection/
├── dataset/
│   ├── transactions.csv             # 1,500 synthetic realistic UPI transactions
│   ├── generate_dataset.py          # Python dataset generator
│   └── generate_dataset.js          # Node dataset generator
├── backend/
│   ├── app/
│   │   ├── api/                     # REST API endpoints (auth, fraud, txns, dashboard, network, reports, admin)
│   │   ├── database/                # SQLAlchemy session & SQLite/Postgres connection
│   │   ├── ml/                      # ML ensemble engine
│   │   │   ├── fraud_detector.py    # Feature extraction & hybrid scoring
│   │   │   └── train.py             # Random Forest & Isolation Forest training pipeline
│   │   ├── models/                  # SQLAlchemy ORM models (Transaction, User, FraudAlert, etc.)
│   │   ├── schemas/                 # Pydantic validation schemas
│   │   ├── services/                # NetworkX graph service & simulator
│   │   ├── websocket/               # Real-time WebSocket connection manager
│   │   └── main.py                  # FastAPI application entrypoint
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/              # MetricCard, RiskBadge, Navbar, Sidebar
│   │   ├── layouts/                 # DashboardLayout with live WebSocket integration
│   │   ├── pages/                   # All 10 application views (Dashboard, Detector, Alerts, Network, etc.)
│   │   └── services/api.js          # Resilient dual-mode API & in-browser streaming client
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── vercel.json                  # SPA routing configuration for Vercel
├── ml_models/
│   └── fraud_model.pkl              # Trained scikit-learn ensemble artifact
├── start_all.bat                    # 1-Click launcher: Backend (:8000) + Frontend (:5173)
├── start_backend.bat                # 1-Click launcher: FastAPI backend
├── start_frontend.bat               # 1-Click launcher: Frontend web console
├── server.js                        # Zero-dependency standalone Node server
├── vercel.json                      # Root Vercel build & SPA rewrite configuration
└── README.md
```

---

## ⚡ Quick Start Guide

### Option 1: Live Cloud Demo (Zero Installation Required)
Simply open **[https://upi-fraud-detection-flax-three.vercel.app/](https://upi-fraud-detection-flax-three.vercel.app/)** in any browser. Click **"Instant Live Demo"** or **"Analyst Role"** to explore all features immediately.

---

### Option 2: 1-Click Windows Launch (Full-Stack)
Double-click `start_all.bat` in the project root. This automatically:
1. Starts the FastAPI backend with trained ML models on **`http://127.0.0.1:8000`** (Swagger docs at `/docs`).
2. Starts the frontend console on **`http://localhost:5173`**.

---

### Option 3: Manual Step-by-Step Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/Ketan1777/upi-fraud-detection.git
cd upi-fraud-detection
```

#### 2. Start the Backend (Python FastAPI)
```bash
# Navigate to backend and install requirements
cd backend
pip install -r requirements.txt

# (Optional) Re-train the ML model
python app/ml/train.py

# Start FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API docs will be available at: **`http://127.0.0.1:8000/docs`**.

#### 3. Start the Frontend (Vite + React)
```bash
# In a separate terminal, from the project root:
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Model Performance & Evaluation

The ensemble was evaluated using stratified cross-validation on 1,500 labeled transactions:

| Metric | Score | Details |
| :--- | :--- | :--- |
| **ROC-AUC Score** | **1.0000** | Supervised separation on benchmark test split |
| **Precision (Safe)** | **100%** | Zero false alarms on verified regular transactions |
| **Recall (Fraud)** | **100%** | Comprehensive interception of burst attacks & money mules |
| **Inference Latency** | **< 15 ms** | Sub-millisecond evaluation suitable for real-time payment switches |

### Top Feature Importance Ranking:
1. `amt_to_avg_ratio` (29.4%) — Transaction amount compared against 30-day baseline.
2. `amount` (23.5%) — Absolute transaction value.
3. `seconds_since_last` (21.1%) — Time delta since previous transaction.
4. `txns_last_5m` (9.5%) — Velocity spike indicator.
5. `is_new_receiver` (7.9%) — Payee first-time interaction flag.
6. `receiver_fan_in_1h` (4.9%) — In-degree centrality (money mule aggregator degree).
7. `is_emulator` (2.1%) — Rooted device / Android virtual machine detection.
8. `hour_of_day` (1.6%) — Nocturnal threat window (01:00 AM – 05:00 AM).

---

## 🚀 Deploying to Vercel

1. Fork or push this repository to your GitHub account.
2. In [Vercel](https://vercel.com):
   * Select **`upi-fraud-detection`**.
   * **Root Directory**: `frontend` *(or leave as root; `vercel.json` will route automatically)*.
   * **Framework Preset**: `Vite`.
   * **Build Command**: `npm run build`.
   * **Output Directory**: `dist`.
3. Click **Deploy**. The `vercel.json` SPA configuration ensures all sub-routes (`/dashboard`, `/detector`, `/alerts`, etc.) resolve seamlessly without 404 errors.

---

## 👤 Author & Maintainer

* **Author**: Ketan Tiwari
* **GitHub**: [@Ketan1777](https://github.com/Ketan1777)
* **Repository**: [https://github.com/Ketan1777/upi-fraud-detection](https://github.com/Ketan1777/upi-fraud-detection)

---

## 📄 License

This project is licensed under the MIT License — feel free to use it for research, hackathons, academic demonstrations, and fintech prototyping.
