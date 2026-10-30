import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from backend.app.database.session import engine, Base, SessionLocal
from backend.app.api.auth import router as auth_router
from backend.app.api.transactions import router as transactions_router
from backend.app.api.fraud import router as fraud_router
from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.network import router as network_router
from backend.app.api.reports import router as reports_router
from backend.app.api.admin import router as admin_router
from backend.app.websocket.connection_manager import manager
from backend.app.services.simulator_service import SimulatorService
from backend.app.ml.fraud_detector import load_model

# Ensure database tables exist
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load ML model
    print("[FraudGuard AI] Initializing AI Fraud Detection Engine...")
    load_model()

    # Automatically seed initial database if empty
    db = SessionLocal()
    try:
        from backend.app.models.models import Transaction, User
        if db.query(Transaction).count() == 0 or db.query(User).count() == 0:
            print("[FraudGuard AI] Seeding initial database with sample data & admin accounts...")
            from backend.app.api.admin import seed_database
            seed_database(db)
    except Exception as e:
        print(f"[FraudGuard AI] Note during auto-seed check: {e}")
    finally:
        db.close()

    # Start live transaction simulator in background
    simulator_task = asyncio.create_task(SimulatorService.start_loop())
    print("[FraudGuard AI] Backend startup complete. Ready to ingest UPI transactions.")

    yield

    # Shutdown
    simulator_task.cancel()
    print("[FraudGuard AI] Background services shutdown.")


app = FastAPI(
    title="UPI FraudGuard AI - Real-Time Digital Payment Fraud Detection API",
    description="High-throughput AI-powered fraud detection system for UPI and digital transactions.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000")
origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router, prefix="/api")
app.include_router(transactions_router, prefix="/api")
app.include_router(fraud_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(network_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


# WebSocket Endpoint for Real-time Transaction Streaming
@app.websocket("/ws/live-transactions")
async def websocket_live_transactions(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection open & handle incoming client messages (e.g. ping)
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


@app.get("/")
def root():
    return {
        "system": "UPI FraudGuard AI Platform",
        "status": "ONLINE",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "api_prefix": "/api",
        "websocket_endpoint": "/ws/live-transactions",
    }
