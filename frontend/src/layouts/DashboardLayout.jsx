import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { LiveTransactionSocket, fraudApi } from '../services/api';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSimulatorActive, setIsSimulatorActive] = useState(true);
  const [liveTxnNotification, setLiveTxnNotification] = useState(null);
  const [alertCount, setAlertCount] = useState(3);

  useEffect(() => {
    // Listen to live WebSocket events
    const socket = new LiveTransactionSocket(
      (newTxn) => {
        // Trigger brief visual ping for new live transaction
        setLiveTxnNotification(newTxn);
        setTimeout(() => setLiveTxnNotification(null), 3000);
      },
      (newAlert) => {
        setAlertCount((prev) => prev + 1);
      },
      (statsUpdate) => {
        // Handled in individual views
      }
    );

    socket.connect();
    return () => socket.disconnect();
  }, []);

  const handleToggleSimulator = async (newVal) => {
    setIsSimulatorActive(newVal);
    try {
      await fraudApi.toggleSimulator(newVal);
    } catch (e) {
      console.warn('Failed to toggle simulator:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isSimulatorActive={isSimulatorActive}
          onToggleSimulator={handleToggleSimulator}
          alertCount={alertCount}
        />

        {/* Global Real-time Stream Banner when a new high-risk transaction arrives */}
        {liveTxnNotification && liveTxnNotification.risk_score >= 70 && (
          <div className="bg-rose-500/20 border-b border-rose-500/40 px-4 py-2 flex items-center justify-between text-xs text-rose-300 animate-slide-up">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
              <span className="font-bold">CRITICAL FRAUD ALERT INGESTED:</span>
              <span>{liveTxnNotification.txn_id}</span>
              <span className="text-white font-mono">₹{liveTxnNotification.amount?.toLocaleString()}</span>
              <span>from {liveTxnNotification.sender_upi}</span>
            </div>
            <span className="font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
              Risk {Number(liveTxnNotification.risk_score).toFixed(0)}/100
            </span>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
