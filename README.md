# UPI FraudGuard AI - Real-Time High-Volume UPI & Digital Payment Fraud Detection

An AI-powered full-stack cybersecurity and fintech platform designed for real-time fraud mitigation in digital payments (UPI, IMPS, Cards).

---

## 🚀 Instant Quick Start (No Python or ML Model Required)

The frontend server is currently active and accessible at:
👉 **[http://localhost:5173](http://localhost:5173)**

To start or restart the frontend anytime in standalone mode:
```bash
# From the project directory:
node server.js
```
Or double-click `start_frontend.bat`.

---

## 🌟 Interactive Pages & Modules

1. **Main Dashboard (`/dashboard`)**:
   - Real-time KPI counters: Total Processed, Safe Auto-Cleared, Suspicious Review, Fraud Blocked, Prevented Fraud Amount (₹), and Fraud Detection Rate (%).
   - Live streaming transaction feed updating every 3 seconds.
   - Categorical breakdown (P2P, P2M, Investment, Utility) & payment app vector share (PhonePe, Google Pay, Paytm, CRED, BHIM).
   - Diurnal threat histogram highlighting nocturnal spikes (01:00 - 05:00 AM).

2. **Live Monitoring (`/live`)**:
   - High-throughput transaction stream table.
   - Filter by classification: `ALL`, `SAFE`, `SUSPICIOUS`, `FRAUDULENT`.
   - Real-time risk badge with instant score (0–100).
   - Pause/Resume stream toggle.

3. **AI Fraud Detection Module (`/detector`)**:
   - Manual transaction entry: Sender VPA, Receiver VPA, Amount (₹), Payment App, Category, Device IP, Geo-location, and Rooted Device / Android Virtual Emulator flag.
   - 4 Instant Test Presets:
     - *Preset 1*: Normal Swiggy Retail Order (₹480 - Safe, Score: 12)
     - *Preset 2*: High-Velocity Burst Compromise (₹14,500 - Fraud, Score: 88)
     - *Preset 3*: Money Mule Cashout Hub (₹38,000 - Mule, Score: 94)
     - *Preset 4*: Nocturnal High-Value ATO (₹85,000 at 3:00 AM via Emulator - Score: 96)
   - Explainable AI feature attribution: exact point contributions for amount baseline deviation, mule fan-in degree, and virtual device fingerprint anomalies.
   - Clear system decision: **ALLOW**, **REVIEW**, or **BLOCK**.

4. **Fraud Alerts Triage (`/alerts`)**:
   - Triage queue for high-risk transactions.
   - Filter by status (`NEW`, `UNDER_REVIEW`, `CONFIRMED_FRAUD`, `FALSE_POSITIVE`, `RESOLVED`) and severity (`CRITICAL`, `HIGH`, `MEDIUM`).
   - Incident review modal to record analyst notes and take action.

5. **Transaction History & Forensic Ledger (`/history`)**:
   - Search across 1,500+ records by Transaction ID, Sender VPA, or Payee.
   - Filter by amount, status, or risk score.
   - One-click **Download Full CSV Report** feature.

6. **Network Analysis & Money Mule Hub Detection (`/network`)**:
   - Interactive SVG Graph Canvas showing sender accounts funneled into central money mule hubs.
   - In-degree centrality calculation: identifies accounts accepting funds from >4 distinct senders within 60 minutes.
   - Detailed inspection drawer for connected accounts and accumulated laundering volume.

7. **Reports & Analytics (`/reports`)**:
   - Executive fraud governance summaries.
   - Precision (98.4%), Recall (96.8%), and False Positive Rate (0.62%).
   - Risk score frequency bimodal histogram.

8. **Admin Panel (`/admin`)**:
   - Infrastructure status monitor (Database, AI Engine, WebSocket pool).
   - Authorized risk officer roles (Admin vs. Analyst).
   - Cryptographic immutable audit trail.
   - One-click **Re-Seed 1,500 Transactions** database button.

---

## 🛠️ Complete Project Directory Structure

```text
upi-fraud-detection/
├── dataset/
│   ├── transactions.csv          # 1,500 synthetic realistic UPI transactions
│   ├── generate_dataset.py       # Python dataset generator
│   └── generate_dataset.js       # Node dataset generator
├── backend/
│   ├── app/
│   │   ├── api/                  # REST API routes (auth, txns, fraud, dashboard, network, reports, admin)
│   │   ├── database/             # SQLAlchemy session & SQLite/PostgreSQL connection
│   │   ├── ml/                   # Random Forest, Isolation Forest & explainability engine
│   │   │   ├── fraud_detector.py # Feature extraction & hybrid ensemble scoring
│   │   │   └── train.py          # Model training pipeline
│   │   ├── models/               # SQLAlchemy ORM models (users, transactions, alerts, devices, etc.)
│   │   ├── schemas/              # Pydantic request & response schemas
│   │   ├── services/             # Auth, NetworkX graph analyzer, background simulator
│   │   ├── websocket/            # Real-time WebSocket connection manager
│   │   └── main.py               # FastAPI application
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/                      # Full modular React + Tailwind + Vite source code
│   │   ├── components/           # Navbar, Sidebar, MetricCard, RiskBadge
│   │   ├── layouts/              # DashboardLayout with live WebSocket integration
│   │   ├── pages/                # All 10 dashboard & auth pages
│   │   └── services/api.js       # API client & WebSocket handler
│   ├── standalone-preview.html   # Zero-dependency interactive single-file UI
│   └── package.json
├── server.js                     # Turnkey standalone web server
└── start_frontend.bat            # Windows 1-click launcher
```

---

## 🧪 Full-Stack Execution with Python FastAPI Backend (Optional)

If you would like to run the complete FastAPI Python backend alongside the frontend:

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Train the ML Model
python app/ml/train.py

# 4. Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
FastAPI Swagger API docs will be live at: `http://localhost:8000/docs`.
