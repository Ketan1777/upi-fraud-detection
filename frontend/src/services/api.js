/**
 * API Service for UPI FraudGuard AI
 * Seamlessly interfaces with FastAPI backend endpoints:
 * - REST APIs for auth, transactions, fraud, dashboard, network, reports, admin
 * - WebSocket connection for real-time live transaction feed
 * - Built-in fallback demo dataset for resilient offline presentations
 */

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000/api';
const WS_BASE_URL = import.meta.env?.VITE_WS_BASE_URL || 'ws://localhost:8000/ws/live-transactions';

// Token storage helpers
export const getToken = () => localStorage.getItem('fraudguard_token');
export const setToken = (token) => localStorage.setItem('fraudguard_token', token);
export const removeToken = () => localStorage.removeItem('fraudguard_token');
export const getUser = () => {
  const u = localStorage.getItem('fraudguard_user');
  try {
    return u ? JSON.parse(u) : null;
  } catch (e) {
    return null;
  }
};
export const setUser = (user) => localStorage.setItem('fraudguard_user', JSON.stringify(user));

// Base fetch wrapper with auth header & error handling
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Token expired or invalid
      removeToken();
      localStorage.removeItem('fraudguard_user');
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: 'API Error' }));
      throw new Error(errData.detail || `Request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn(`[API] Fallback/Error on ${endpoint}:`, err.message);
    throw err;
  }
}

// ---------------- AUTH API ----------------
export const authApi = {
  login: async (email, password) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  demoLogin: async (role = 'analyst') => {
    return request(`/auth/demo-login/${role}`, {
      method: 'POST',
    });
  },
  register: async (userData) => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  getMe: async () => {
    return request('/auth/me');
  },
  logout: () => {
    removeToken();
    localStorage.removeItem('fraudguard_user');
  },
};

// ---------------- DASHBOARD & STATS API ----------------
export const dashboardApi = {
  getStats: async () => {
    try {
      return await request('/dashboard/stats');
    } catch {
      // Resilient fallback for standalone demo
      return {
        total_transactions: 1542,
        safe_transactions: 1284,
        suspicious_transactions: 148,
        fraudulent_transactions: 110,
        total_volume_amount: 8492030.50,
        fraud_amount_detected: 1420950.00,
        fraud_percentage: 7.13,
        high_risk_alerts_count: 38,
        active_mule_nodes: 6,
      };
    }
  },
  getLiveFeed: async (limit = 25) => {
    return request(`/dashboard/live-feed?limit=${limit}`);
  },
  getAnalytics: async () => {
    try {
      return await request('/dashboard/analytics');
    } catch {
      return {
        categories: [
          { category: 'P2P', count: 850, volume: 4200000 },
          { category: 'P2M', count: 420, volume: 1800000 },
          { category: 'INVESTMENT', count: 120, volume: 1500000 },
          { category: 'BILL_PAYMENT', count: 152, volume: 992030 },
        ],
        payment_methods: [
          { method: 'PHONEPE', count: 520 },
          { method: 'GOOGLE_PAY', count: 480 },
          { method: 'PAYTM', count: 310 },
          { method: 'CRED', count: 140 },
          { method: 'BHIM', count: 92 },
        ],
        weekly_trends: [
          { date: 'Oct 24', total_txns: 180, fraud_txns: 12, safe_txns: 168, volume_lakhs: 3.5 },
          { date: 'Oct 25', total_txns: 210, fraud_txns: 14, safe_txns: 196, volume_lakhs: 4.1 },
          { date: 'Oct 26', total_txns: 195, fraud_txns: 11, safe_txns: 184, volume_lakhs: 3.8 },
          { date: 'Oct 27', total_txns: 240, fraud_txns: 19, safe_txns: 221, volume_lakhs: 4.9 },
          { date: 'Oct 28', total_txns: 260, fraud_txns: 22, safe_txns: 238, volume_lakhs: 5.3 },
          { date: 'Oct 29', total_txns: 225, fraud_txns: 16, safe_txns: 209, volume_lakhs: 4.7 },
          { date: 'Oct 30', total_txns: 232, fraud_txns: 16, safe_txns: 216, volume_lakhs: 4.8 },
        ],
        hourly_distribution: [
          { hour: '00:00', safe: 12, fraud: 8, suspicious: 4 },
          { hour: '02:00', safe: 6, fraud: 14, suspicious: 7 },
          { hour: '04:00', safe: 8, fraud: 12, suspicious: 5 },
          { hour: '06:00', safe: 24, fraud: 3, suspicious: 2 },
          { hour: '08:00', safe: 84, fraud: 4, suspicious: 6 },
          { hour: '10:00', safe: 145, fraud: 8, suspicious: 12 },
          { hour: '12:00', safe: 160, fraud: 9, suspicious: 14 },
          { hour: '14:00', safe: 130, fraud: 11, suspicious: 15 },
          { hour: '16:00', safe: 175, fraud: 12, suspicious: 16 },
          { hour: '18:00', safe: 190, fraud: 15, suspicious: 18 },
          { hour: '20:00', safe: 210, fraud: 18, suspicious: 22 },
          { hour: '22:00', safe: 110, fraud: 14, suspicious: 16 },
        ]
      };
    }
  },
};

// ---------------- TRANSACTIONS API ----------------
export const transactionsApi = {
  list: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    return request(`/transactions?${query.toString()}`);
  },
  getById: async (idOrTxnId) => {
    return request(`/transactions/${idOrTxnId}`);
  },
  create: async (data) => {
    return request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ---------------- FRAUD DETECTION ENGINE API ----------------
export const fraudApi = {
  analyze: async (txnData) => {
    return request('/fraud/analyze', {
      method: 'POST',
      body: JSON.stringify(txnData),
    });
  },
  getAlerts: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    return request(`/fraud/alerts?${query.toString()}`);
  },
  reviewAlert: async (alertId, status, notes) => {
    return request(`/fraud/alerts/${alertId}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  },
  toggleSimulator: async (active, interval = 3.0) => {
    return request(`/fraud/simulator/toggle?active=${active}&interval=${interval}`, {
      method: 'POST',
    });
  },
  generateSimulatedTxn: async (scenario = 'random') => {
    return request(`/fraud/simulator/generate?scenario=${scenario}`, {
      method: 'POST',
    });
  },
};

// ---------------- NETWORK ANALYSIS API ----------------
export const networkApi = {
  getAnalysis: async (limit = 150) => {
    return request(`/network/analysis?limit=${limit}`);
  },
};

// ---------------- REPORTS API ----------------
export const reportsApi = {
  exportCsvUrl: (filters = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) query.append(k, v);
    });
    return `${API_BASE_URL}/reports/export?${query.toString()}`;
  },
};

// ---------------- ADMIN API ----------------
export const adminApi = {
  getUsers: async () => request('/admin/users'),
  getAuditLogs: async (limit = 50) => request(`/admin/audit-logs?limit=${limit}`),
  getSystemHealth: async () => request('/admin/system-health'),
  seedDatabase: async () => request('/admin/seed', { method: 'POST' }),
};

// ---------------- WEBSOCKET CLIENT ----------------
export class LiveTransactionSocket {
  constructor(onTransaction, onAlert, onStats) {
    this.onTransaction = onTransaction;
    this.onAlert = onAlert;
    this.onStats = onStats;
    this.ws = null;
    this.reconnectTimer = null;
    this.isDestroyed = false;
  }

  connect() {
    if (this.isDestroyed) return;
    try {
      this.ws = new WebSocket(WS_BASE_URL);

      this.ws.onopen = () => {
        console.log('[WebSocket] Live stream connected to UPI transaction bus');
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NEW_TRANSACTION' && this.onTransaction) {
            this.onTransaction(payload.data);
          } else if (payload.type === 'NEW_ALERT' && this.onAlert) {
            this.onAlert(payload.data);
          } else if (payload.type === 'STATS_UPDATE' && this.onStats) {
            this.onStats(payload.data);
          }
        } catch (e) {
          console.warn('[WebSocket] Malformed message', e);
        }
      };

      this.ws.onclose = () => {
        if (!this.isDestroyed) {
          this.reconnectTimer = setTimeout(() => this.connect(), 3000);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[WebSocket] Connection error, will retry...', err);
        if (this.ws) this.ws.close();
      };
    } catch (e) {
      console.warn('[WebSocket] Failed to instantiate WebSocket:', e);
    }
  }

  disconnect() {
    this.isDestroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
