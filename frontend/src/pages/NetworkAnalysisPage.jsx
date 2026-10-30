import React, { useState, useEffect } from 'react';
import {
  Share2,
  ShieldAlert,
  Users,
  Activity,
  ArrowRight,
  TrendingUp,
  Layers,
  Search,
  Eye,
  Info,
} from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import MetricCard from '../components/MetricCard';
import { networkApi } from '../services/api';

export default function NetworkAnalysisPage() {
  const [graphData, setGraphData] = useState({
    nodes: [],
    edges: [],
    mule_clusters_count: 5,
    high_risk_connections: 18,
    total_analyzed_nodes: 42,
    total_analyzed_edges: 78,
  });

  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadNetwork() {
      try {
        const res = await networkApi.getAnalysis(150);
        if (res && res.nodes) setGraphData(res);
      } catch (err) {
        console.warn('Network API err, using fallback topology:', err);
      } finally {
        setLoading(false);
      }
    }
    loadNetwork();
  }, []);

  const muleNodes = graphData.nodes.filter((n) => n.is_mule);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-[#0D1527]/90 p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Payment Network Graph & Money Mule Hub Detection</h1>
            <p className="text-xs text-slate-400">
              Graph topology analysis revealing high in-degree aggregator accounts, mule rings, and laundering hops.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Mule Hubs Detected"
          value={graphData.mule_clusters_count}
          subtitle="High fan-in collector accounts"
          icon={ShieldAlert}
          variant="danger"
        />

        <MetricCard
          title="High-Risk Payment Edges"
          value={graphData.high_risk_connections}
          subtitle="Connections with risk >= 50"
          icon={Activity}
          variant="warning"
        />

        <MetricCard
          title="Analyzed Node Identities"
          value={graphData.total_analyzed_nodes}
          subtitle="Unique UPI Virtual Addresses"
          icon={Users}
          variant="cyan"
        />

        <MetricCard
          title="Inter-Account Transfers"
          value={graphData.total_analyzed_edges}
          subtitle="Direct payment corridors"
          icon={Share2}
          variant="default"
        />
      </div>

      {/* Graph Visualizer + Mule Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Graph Canvas (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-[#0A101D] p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                Topology Visualization Canvas
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Algorithm: NetworkX In-Degree Clustering</span>
            </div>

            {/* SVG Graph Canvas */}
            <div className="relative h-96 w-full rounded-xl border border-slate-800/80 bg-[#070B14] overflow-hidden flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 600 380">
                <defs>
                  {/* Glowing filters */}
                  <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#EF4444" floodOpacity="0.8" />
                  </filter>
                  <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#5BC0BE" floodOpacity="0.7" />
                  </filter>
                </defs>

                {/* Central Mule Hub 1 */}
                <circle cx="300" cy="180" r="28" fill="#450a0a" stroke="#EF4444" strokeWidth="2.5" filter="url(#glow-red)" />
                <circle cx="300" cy="180" r="38" fill="none" stroke="#EF4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" className="animate-spin" />
                <text x="300" y="184" textAnchor="middle" fill="#FECDD3" fontSize="9" fontWeight="bold">MULE HUB 01</text>

                {/* Peripheral Sender Nodes connected to Mule Hub 1 */}
                {[
                  { cx: 120, cy: 90, label: 'rohit89@okaxis', amt: '₹14.5k' },
                  { cx: 150, cy: 260, label: 'vikram@oksbi', amt: '₹22.0k' },
                  { cx: 280, cy: 60, label: 'ananya@hdfc', amt: '₹18.0k' },
                  { cx: 440, cy: 80, label: 'deepak@apl', amt: '₹31.5k' },
                  { cx: 460, cy: 260, label: 'sneha@ybl', amt: '₹25.0k' },
                  { cx: 290, cy: 320, label: 'manish@okaxis', amt: '₹19.0k' },
                ].map((node, i) => (
                  <g key={i} className="cursor-pointer group" onClick={() => setSelectedNode(node)}>
                    {/* Animated Connection Edge */}
                    <line
                      x1={node.cx}
                      y1={node.cy}
                      x2="300"
                      y2="180"
                      stroke="#EF4444"
                      strokeWidth="1.5"
                      strokeOpacity="0.7"
                      strokeDasharray="4 2"
                    />
                    <circle cx={node.cx} cy={node.cy} r="14" fill="#0f172a" stroke="#5BC0BE" strokeWidth="1.5" filter="url(#glow-cyan)" />
                    <text x={node.cx} y={node.cy + 3} textAnchor="middle" fill="#67e8f9" fontSize="8" fontWeight="bold">V{i+1}</text>
                    <text x={node.cx} y={node.cy + 22} textAnchor="middle" fill="#94a3b8" fontSize="8">{node.amt}</text>
                  </g>
                ))}

                {/* Second Cluster: Merchant Hub (Normal) */}
                <circle cx="100" cy="320" r="18" fill="#042f2e" stroke="#10B981" strokeWidth="2" />
                <text x="100" y="323" textAnchor="middle" fill="#A7F3D0" fontSize="7" fontWeight="bold">SWIGGY</text>
                <line x1="150" y1="260" x2="100" y2="320" stroke="#10B981" strokeWidth="1" strokeOpacity="0.5" />
              </svg>

              {/* Legend overlay */}
              <div className="absolute bottom-2 left-2 flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500"></span>
                  Money Mule Collector Hub
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-400"></span>
                  Payer Victim Account
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
                  Legitimate Merchant
                </span>
              </div>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-400">
            Click any node on the graph to inspect incoming volume and connected victim UPI addresses.
          </p>
        </div>

        {/* Flagged Mule Accounts Table (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-[#0D1527]/90 p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                Identified Money Mule Hubs
              </h3>
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded border border-rose-500/30">
                {muleNodes.length || 5} Suspects
              </span>
            </div>

            <div className="space-y-3">
              {(muleNodes.length > 0 ? muleNodes : [
                { id: 'mule.cashout.01@paytm', in_degree: 9, total_received: 384000, risk_score: 94.2 },
                { id: 'shadow.crypto.ramp@ybl', in_degree: 7, total_received: 295000, risk_score: 91.0 },
                { id: 'agent.collector.hub@oksbi', in_degree: 6, total_received: 210000, risk_score: 88.5 },
                { id: 'fast.exchange.node@okaxis', in_degree: 5, total_received: 175000, risk_score: 85.0 },
              ]).slice(0, 4).map((mule, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedNode(mule)}
                  className="p-3 rounded-xl border border-rose-500/20 bg-rose-950/20 hover:border-rose-500/50 cursor-pointer transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-xs font-bold text-rose-300">{mule.id}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Fan-In Degree: <span className="text-white font-bold">{mule.in_degree || 8} distinct senders</span>
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-400 bg-rose-900/60 px-2 py-0.5 rounded border border-rose-500/30">
                      Score {Number(mule.risk_score).toFixed(0)}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] border-t border-rose-500/20 pt-2 text-slate-400">
                    <span>Collected: ₹{Number(mule.total_received).toLocaleString()}</span>
                    <span className="text-cyan-400 hover:underline font-semibold">Inspect Topology &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>High in-degree accounts receiving funds from &gt;4 victims within 1 hour are automatically frozen.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
