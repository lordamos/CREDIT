import React, { useEffect, useState } from 'react';
import type { Client, PipelineStage } from '../types/credit';
import { PIPELINE_STAGES } from '../types/credit';
import type { Page } from '../App';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API = 'http://localhost:3002/api';

const STAGE_ORDER: PipelineStage[] = ['NEW', 'DOCS_VERIFIED', 'SUBMITTED', 'APPROVED', 'INVOICE_SENT', 'PAID', 'DISPUTE_ACTIVE', 'POST_CARE'];

const STAGE_COLOR: Record<string, string> = {
  blue: 'border-blue-500 bg-blue-500/10',
  indigo: 'border-indigo-500 bg-indigo-500/10',
  purple: 'border-purple-500 bg-purple-500/10',
  emerald: 'border-emerald-500 bg-emerald-500/10',
  yellow: 'border-yellow-500 bg-yellow-500/10',
  green: 'border-green-500 bg-green-500/10',
  orange: 'border-orange-500 bg-orange-500/10',
  teal: 'border-teal-500 bg-teal-500/10',
  gray: 'border-slate-600 bg-slate-800',
};

const STAGE_BADGE: Record<string, string> = {
  blue: 'bg-blue-500/20 text-blue-300',
  indigo: 'bg-indigo-500/20 text-indigo-300',
  purple: 'bg-purple-500/20 text-purple-300',
  emerald: 'bg-emerald-500/20 text-emerald-300',
  yellow: 'bg-yellow-500/20 text-yellow-300',
  green: 'bg-green-500/20 text-green-300',
  orange: 'bg-orange-500/20 text-orange-300',
  teal: 'bg-teal-500/20 text-teal-300',
  gray: 'bg-slate-700 text-slate-400',
};

// Colors for the charts
const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#14b8a6', '#f97316', '#6366f1'];

interface Props { navigate: (p: Page) => void; }

export function Dashboard({ navigate }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<PipelineStage | 'ALL'>('ALL');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/clients`);
      const json = await res.json();
      setClients(json.data ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = clients.filter(c => {
    const matchSearch = search === '' || `${c.firstName} ${c.lastName} ${c.companyName} ${c.email}`.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'ALL' || c.stage === stageFilter;
    return matchSearch && matchStage;
  });

  // KPIs
  const totalRevenue = clients.filter(c => c.invoice?.status === 'PAID').reduce((s, c) => s + (c.invoice?.amount ?? 0), 0);
  const pendingRevenue = clients.filter(c => c.invoice?.status === 'PENDING').reduce((s, c) => s + (c.invoice?.amount ?? 0), 0);
  const approved = clients.filter(c => ['APPROVED', 'INVOICE_SENT', 'PAID', 'POST_CARE'].includes(c.stage)).length;
  const overdue = clients.filter(c => c.invoice?.status === 'OVERDUE').length;

  // Group by stage for Kanban
  const grouped = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = clients.filter(c => c.stage === stage);
    return acc;
  }, {} as Record<PipelineStage, Client[]>);

  // Chart Data
  const pipelineData = STAGE_ORDER.map(stage => ({
    name: PIPELINE_STAGES[stage].label,
    count: grouped[stage]?.length || 0
  }));

  const planData = [
    { name: 'Plan A ($1,250)', value: clients.filter(c => c.plan === 'A').length },
    { name: 'Plan B ($1,500)', value: clients.filter(c => c.plan === 'B').length },
  ];

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Overseer Dashboard</h1>
          <p className="text-slate-400 text-sm">Credit Acceleration CRM · Brevard County, Florida</p>
        </div>
        <button onClick={() => navigate({ name: 'new-client' })}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
          ➕ New Client
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: clients.length, icon: '👥', color: 'text-blue-400' },
          { label: 'Approvals', value: approved, icon: '✅', color: 'text-emerald-400' },
          { label: 'Revenue Collected', value: `$${totalRevenue.toLocaleString()}`, icon: '💰', color: 'text-green-400' },
          { label: 'Pending Fees', value: `$${pendingRevenue.toLocaleString()}`, icon: '⏳', color: 'text-yellow-400' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg shadow-black/20"
          >
            <div className="text-2xl mb-1">{kpi.icon}</div>
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-slate-400 text-xs mt-1">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Analytics Charts */}
      {clients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20"
          >
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Pipeline Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#334155', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} 
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg shadow-black/20"
          >
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Plan Distribution</h3>
            <div className="h-64 relative">
              {clients.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={planData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {planData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">No data</div>
              )}
              
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-2 text-xs text-slate-300"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Plan A</div>
                <div className="flex items-center gap-2 text-xs text-slate-300"><div className="w-3 h-3 rounded-full bg-purple-500"></div> Plan B</div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Overdue alert banner */}
      {overdue > 0 && (
        <div className="bg-red-950 border border-red-700 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="font-semibold text-red-300">{overdue} client(s) with overdue success fees</div>
            <div className="text-red-400 text-sm">Automated overdue alerts are queued. Review below.</div>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search clients, companies, emails..."
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 w-72 focus:outline-none focus:border-blue-500" />
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value as any)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
          <option value="ALL">All Stages</option>
          {STAGE_ORDER.map(s => <option key={s} value={s}>{PIPELINE_STAGES[s].label}</option>)}
        </select>
        <button onClick={load} className="bg-slate-800 border border-slate-700 hover:border-blue-500 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors">
          🔄 Refresh
        </button>
      </div>

      {/* Kanban Board */}
      {stageFilter === 'ALL' ? (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Pipeline View</h2>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {STAGE_ORDER.map(stage => {
                const meta = PIPELINE_STAGES[stage];
                const stageClients = grouped[stage];
                return (
                  <div key={stage} className={`w-60 border rounded-xl p-3 ${STAGE_COLOR[meta.color]}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-white">{meta.label}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STAGE_BADGE[meta.color]}`}>
                        {stageClients.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {stageClients.length === 0 && (
                        <p className="text-slate-600 text-xs text-center py-4">No clients</p>
                      )}
                      {stageClients.map(c => (
                        <button key={c.id} onClick={() => navigate({ name: 'client', id: c.id })}
                          className="w-full text-left bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-lg p-3 transition-colors group">
                          <div className="font-semibold text-sm text-white group-hover:text-blue-300 truncate">
                            {c.firstName} {c.lastName}
                          </div>
                          <div className="text-xs text-slate-400 truncate">{c.companyName}</div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-500">Plan {c.plan}</span>
                            <span className={`text-xs font-semibold ${c.invoice?.status === 'PAID' ? 'text-green-400' : c.invoice?.status === 'OVERDUE' ? 'text-red-400' : 'text-yellow-400'}`}>
                              ${(c.invoice?.amount ?? 0).toLocaleString()}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        // List view when filtered
        <div className="space-y-2">
          {loading && <p className="text-slate-400 text-sm">Loading...</p>}
          {!loading && filtered.length === 0 && <p className="text-slate-500 text-sm">No clients found.</p>}
          {filtered.map(c => {
            const meta = PIPELINE_STAGES[c.stage];
            return (
              <button key={c.id} onClick={() => navigate({ name: 'client', id: c.id })}
                className="w-full text-left bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-600 rounded-xl p-4 transition-colors flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white">{c.firstName} {c.lastName} <span className="text-slate-500 font-normal text-sm">· {c.companyName}</span></div>
                  <div className="text-sm text-slate-400">{c.email} · {c.phone}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STAGE_BADGE[meta.color]}`}>{meta.label}</span>
                  <span className="text-sm font-semibold text-green-400">${(c.invoice?.amount ?? 0).toLocaleString()}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
