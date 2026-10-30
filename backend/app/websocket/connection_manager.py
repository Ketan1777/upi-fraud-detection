import json
from typing import List
from fastapi import WebSocket


class ConnectionManager:
    """
    Manages active WebSocket connections for real-time live transaction broadcasting.
    """

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WebSocket] Client connected. Total active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WebSocket] Client disconnected. Total active connections: {len(self.active_connections)}")

    async def broadcast_transaction(self, transaction_data: dict):
        """Broadcast newly processed transaction to all connected dashboards."""
        message = {
            "type": "NEW_TRANSACTION",
            "data": transaction_data
        }
        await self._broadcast(message)

    async def broadcast_alert(self, alert_data: dict):
        """Broadcast high-risk fraud alert immediately."""
        message = {
            "type": "NEW_ALERT",
            "data": alert_data
        }
        await self._broadcast(message)

    async def broadcast_stats_update(self, stats_data: dict):
        """Broadcast updated KPI counters to all dashboards."""
        message = {
            "type": "STATS_UPDATE",
            "data": stats_data
        }
        await self._broadcast(message)

    async def _broadcast(self, message: dict):
        payload = json.dumps(message, default=str)
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)


manager = ConnectionManager()
