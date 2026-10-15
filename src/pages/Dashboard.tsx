import React, { useEffect, useState } from 'react';
import type { Client, PipelineStage } from '../types/credit';
import { PIPELINE_STAGES } from '../types/credit';
import type { Page } from '../App';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Users, 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  UserPlus, 
  Search, 
  RefreshCw, 
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Filter,
  Sparkles,
  ArrowUpRight,
  X,
  FileSpreadsheet,
  Shield,
  Award
} from 'lucide-react';

const API = '/api';

const STAGE_ORDER: PipelineStage[] = ['NEW', 'DOCS_VERIFIED', 'SUBMITTED', 'APPROVED', 'INVOICE_SENT', 'PAID', 'DISPUTE_ACTIVE', 'POST_CARE'];

const STAGE_COLOR: Record<string, string> = {
  blue: 'border-blue-500/30 bg-blue-500/5',
  indigo: 'border-indigo-500/30 bg-indigo-500/5',
  purple: 'border-purple-500/30 bg-purple-500/5',
  emerald: 'border-emerald-500/30 bg-emerald-500/5',
  yellow: 'border-amber-500/30 bg-amber-500/5',
  green: 'border-emerald-500/30 bg-emerald-500/5',
  orange: 'border-orange-500/30 bg-orange-500/5',
  teal: 'border-teal-500/30 bg-teal-500/5',
  gray: 'border-slate-700/60 bg-slate-900/40',
};

const STAGE_BADGE: Record<string, string> = {
  blue: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  yellow: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  orange: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  teal: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  gray: 'bg-slate-800 text-slate-300 border-slate-700',
};

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#14b8a6', '#f97316', '#3b82f6'];

interface Props { navigate: (p: Page) => void; }

export function Dashboard({ navigate }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<PipelineStage | 'ALL'>('ALL');
  const [showLedger, setShowLedger] = useState(false);

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

  const [ledgerSearch, setLedgerSearch] = useState('');

  const exportLedgerCSV = () => {
    const approvedClients = clients.filter(c => ['APPROVED', 'INVOICE_SENT', 'PAID', 'POST_CARE'].includes(c.stage));
    const headers = ['Client Name', 'Company', 'Plan', 'Stage', 'Invoice Amount', 'Invoice Status', 'Email', 'Phone'];
    const rows = approvedClients.map(c => [
      `"${c.firstName} ${c.lastName}"`,
      `"${c.companyName || ''}"`,
      `"Tier ${c.plan}"`,
      `"${c.stage}"`,
      c.invoice?.amount || 0,
      `"${c.invoice?.status || 'PENDING'}"`,
      `"${c.email}"`,
      `"${c.phone}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TrueBuild_Executive_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto"
    >
      
      {/* Modern Hero Header Banner */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-surface-subtle/90 backdrop-blur-lux p-8 border border-white/[0.08] shadow-lux-lg lux-bevel"
      >
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 rounded-full bg-gradient-to-br from-amber-500/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-[#d9b779] text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Autonomous Credit Repair Intelligence · Dual-Threat Engine</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Overseer Operations
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Live tracking of underwriting pipelines, automated FCRA dispute engines, and client personal guarantor portfolios.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={load}
              className="p-3 rounded-xl bg-surface-elevated/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/[0.08] transition-all shadow-lux-sm"
              title="Refresh Pipeline"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate({ name: 'new-client' })}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-extrabold px-5 py-3 rounded-xl text-sm shadow-lux-md shadow-amber-500/20 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Onboard New Client</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Luxury Executive Suite Portfolio Card */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-surface-subtle/85 backdrop-blur-lux border border-border-hairline p-6 shadow-lux-md transition-all duration-300 hover:border-border-gold hover:shadow-glow-gold lux-bevel"
      >
        {/* Subtle ambient top gradient */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.04] to-transparent"></div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-lux-gold flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            Executive Suite
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-lux-gold/10 text-lux-gold border border-border-gold">
            Private Client Reserve
          </span>
        </div>

        <h3 className="mt-2 text-xl font-medium text-lux-primary">
          Portfolio Performance
        </h3>
        <p className="mt-1 text-sm text-lux-secondary">
          Real-time multi-asset aggregation and predictive margin forecasts across active guarantor credit facilities.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border-hairline pt-4">
          <span className="text-xs text-lux-tertiary">Live Underwriting Sync · Multi-Asset Aggregation</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setStageFilter(stageFilter === 'ALL' ? 'APPROVED' : 'ALL')}
              className="rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:text-white hover:border-slate-700"
            >
              {stageFilter === 'APPROVED' ? 'Reset Filter' : 'Filter Approved (Kanban)'}
            </button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowLedger(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border-gold bg-lux-gold/10 px-4 py-1.5 text-xs font-semibold text-lux-gold transition-all hover:bg-lux-gold hover:text-canvas-base shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Open Executive Ledger</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* EXECUTIVE LEDGER MODAL DRAWER */}
      {showLedger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl bg-surface-elevated/95 backdrop-blur-lux border border-border-gold shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-border-hairline flex items-center justify-between bg-surface-subtle/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-lux-gold/10 border border-border-gold text-lux-gold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-lux-gold">Executive Reserve</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Audited</span>
                  </div>
                  <h2 className="text-xl font-bold text-lux-primary mt-0.5">Private Client Reserve Ledger</h2>
                </div>
              </div>
              <button 
                onClick={() => setShowLedger(false)}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Metrics Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-canvas-base/40 border-b border-border-hairline">
              <div className="p-4 rounded-xl bg-surface-subtle border border-border-hairline">
                <div className="text-[11px] font-semibold text-lux-secondary uppercase tracking-wider">Approved Exposure</div>
                <div className="text-2xl font-bold text-lux-gold mt-1">${(approved * 50000).toLocaleString()}</div>
                <div className="text-[10px] text-lux-tertiary mt-0.5">Aggregated credit facilities</div>
              </div>
              <div className="p-4 rounded-xl bg-surface-subtle border border-border-hairline">
                <div className="text-[11px] font-semibold text-lux-secondary uppercase tracking-wider">Success Fee Yield</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">${(totalRevenue + pendingRevenue).toLocaleString()}</div>
                <div className="text-[10px] text-lux-tertiary mt-0.5">Collected & accrued fees</div>
              </div>
              <div className="p-4 rounded-xl bg-surface-subtle border border-border-hairline">
                <div className="text-[11px] font-semibold text-lux-secondary uppercase tracking-wider">Client Facility Count</div>
                <div className="text-2xl font-bold text-lux-primary mt-1">{approved} Accounts</div>
                <div className="text-[10px] text-lux-tertiary mt-0.5">Active underwritten portfolios</div>
              </div>
            </div>

            {/* Ledger In-Modal Search Toolbar */}
            <div className="px-6 py-3 border-b border-border-hairline bg-surface-subtle/40 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                <input 
                  value={ledgerSearch}
                  onChange={e => setLedgerSearch(e.target.value)}
                  placeholder="Filter ledger by name, entity, or status..."
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-border-gold transition-all"
                />
              </div>
              <button 
                onClick={exportLedgerCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-gold/40 bg-lux-gold/10 text-lux-gold hover:bg-lux-gold hover:text-canvas-base text-xs font-semibold transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Modal Table Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border-hairline text-lux-secondary uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-semibold">Guarantor</th>
                    <th className="pb-3 font-semibold">Commercial Entity</th>
                    <th className="pb-3 font-semibold">Program Plan</th>
                    <th className="pb-3 font-semibold">Facility Status</th>
                    <th className="pb-3 font-semibold">Success Fee</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-hairline/60">
                  {clients
                    .filter(c => ['APPROVED', 'INVOICE_SENT', 'PAID', 'POST_CARE'].includes(c.stage))
                    .filter(c => ledgerSearch === '' || `${c.firstName} ${c.lastName} ${c.companyName} ${c.stage}`.toLowerCase().includes(ledgerSearch.toLowerCase()))
                    .map(c => (
                      <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 font-bold text-lux-primary">{c.firstName} {c.lastName}</td>
                        <td className="py-3.5 text-lux-secondary">{c.companyName || 'Private Asset'}</td>
                        <td className="py-3.5 font-mono text-lux-gold">Tier {c.plan}</td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {c.stage}
                          </span>
                        </td>
                        <td className="py-3.5 font-bold text-emerald-400">${(c.invoice?.amount ?? 0).toLocaleString()}</td>
                        <td className="py-3.5 text-right">
                          <button 
                            onClick={() => { setShowLedger(false); navigate({ name: 'client', id: c.id }); }}
                            className="px-3 py-1 rounded-lg border border-border-gold bg-lux-gold/10 text-lux-gold hover:bg-lux-gold hover:text-canvas-base text-[11px] font-semibold transition-all"
                          >
                            Inspect Docket
                          </button>
                        </td>
                      </tr>
                    ))}
                  {approved === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-lux-tertiary">
                        No facilities currently in approved reserve status. Advance client pipelines to populate ledger.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-surface-subtle/80 border-t border-border-hairline flex items-center justify-between">
              <span className="text-[11px] text-lux-tertiary font-mono">ENCRYPTED FCRA AUDIT TRAIL #0087-B</span>
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-lux-primary hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                Print Ledger Summary
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* KPI Cards Grid with Staggered Fade-in */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5"
      >
        {[
          { 
            label: 'Total Active Files', 
            value: clients.length, 
            icon: Users, 
            gradient: 'from-amber-500/20 to-indigo-600/10',
            textColor: 'text-white',
            badge: 'FCRA Portfolios',
            iconColor: 'text-amber-400' 
          },
          { 
            label: 'Approved Facilities', 
            value: approved, 
            icon: CheckCircle2, 
            gradient: 'from-emerald-600/20 to-teal-600/10',
            textColor: 'text-emerald-400',
            badge: 'Guarantor Reserve',
            iconColor: 'text-emerald-400' 
          },
          { 
            label: 'Collected Revenue', 
            value: `$${totalRevenue.toLocaleString()}`, 
            icon: DollarSign, 
            gradient: 'from-amber-600/25 to-yellow-600/10',
            textColor: 'text-lux-gold',
            badge: 'Paid Invoices',
            iconColor: 'text-amber-300' 
          },
          { 
            label: 'Pending Success Fees', 
            value: `$${pendingRevenue.toLocaleString()}`, 
            icon: Clock, 
            gradient: 'from-indigo-600/20 to-violet-600/10',
            textColor: 'text-indigo-300',
            badge: 'In Processing',
            iconColor: 'text-indigo-400' 
          },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="relative overflow-hidden rounded-2xl bg-surface-subtle/80 backdrop-blur-lux border border-border-hairline p-5 shadow-lux-md hover:border-border-gold hover:shadow-glow-gold transition-all duration-300 lux-bevel group"
            >
              <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${kpi.gradient} blur-xl rounded-full -mr-8 -mt-8 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`} />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-slate-400 text-[11px] font-bold tracking-wider uppercase">{kpi.label}</span>
                <div className="p-2 rounded-xl bg-surface-elevated/90 border border-white/[0.08] shadow-inner">
                  <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
                </div>
              </div>
              <div className={`text-3xl font-extrabold tracking-tight ${kpi.textColor} relative z-10`}>{kpi.value}</div>
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border-hairline relative z-10">
                <span className="text-[10px] font-semibold text-lux-tertiary">{kpi.badge}</span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <TrendingUp className="w-3 h-3" />
                  <span>Synchronized</span>
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Analytics Charts with Executive Aesthetic */}
      {clients.length > 0 && (
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="md:col-span-2 rounded-2xl bg-surface-subtle/85 backdrop-blur-lux border border-border-hairline p-6 shadow-lux-md lux-bevel">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-lux-gold">Underwriting Velocity</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Telemetry Live</span>
                </div>
                <h3 className="text-sm font-bold text-white tracking-wide mt-1">Pipeline Stage Distribution</h3>
              </div>
              <span className="text-xs font-semibold text-lux-gold bg-lux-gold/10 border border-border-gold px-3 py-1 rounded-xl">Dual Engine</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(218, 185, 122, 0.06)' }}
                    contentStyle={{ 
                      backgroundColor: 'rgba(17, 17, 21, 0.95)', 
                      border: '1px solid rgba(218, 185, 122, 0.3)', 
                      borderRadius: '14px', 
                      boxShadow: '0 16px 40px rgba(0,0,0,0.8)',
                      backdropFilter: 'blur(16px)',
                      color: '#f5f5f7'
                    }} 
                  />
                  <Bar dataKey="count" fill="url(#barGradientLux)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="barGradientLux" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d9b779" />
                      <stop offset="60%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="rounded-2xl bg-surface-subtle/85 backdrop-blur-lux border border-border-hairline p-6 shadow-lux-md lux-bevel flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-lux-gold">Tier Breakdown</span>
                <span className="text-[10px] text-slate-400 font-mono">Retainer Models</span>
              </div>
              <div className="h-52 relative">
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
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#d9b779'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(17, 17, 21, 0.95)', 
                        border: '1px solid rgba(218, 185, 122, 0.3)', 
                        borderRadius: '12px',
                        color: '#f5f5f7'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border-hairline">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-elevated/80 border border-white/[0.06]">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" />
                <div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Plan A</div>
                  <div className="text-xs font-bold text-white">$1,250</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-elevated/80 border border-white/[0.06]">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm" />
                <div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Plan B</div>
                  <div className="text-xs font-bold text-lux-gold">$1,500</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Overdue alert banner */}
      {overdue > 0 && (
        <motion.div 
          variants={itemVariants}
          className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-5 flex items-center gap-4 text-rose-200 shadow-xl lux-bevel"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm text-white">{overdue} client(s) with overdue success fees detected</div>
            <div className="text-xs text-rose-300/80 mt-0.5">Automated 48-hour recovery notifications are queued. Review below.</div>
          </div>
        </motion.div>
      )}

      {/* Search & Filter Toolbar */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface-subtle/90 backdrop-blur-lux p-3.5 rounded-2xl border border-white/[0.08] shadow-lux-md lux-bevel"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by client name, commercial entity, or email..."
            className="w-full bg-surface-elevated/90 border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-border-gold focus:ring-1 focus:ring-border-gold transition-all" 
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-elevated/90 border border-white/[0.08] rounded-xl px-3.5 py-2">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <select 
              value={stageFilter} 
              onChange={e => setStageFilter(e.target.value as any)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#12121A]">All Pipeline Stages ({clients.length})</option>
              {STAGE_ORDER.map(s => <option key={s} value={s} className="bg-[#12121A]">{PIPELINE_STAGES[s].label} ({grouped[s]?.length || 0})</option>)}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Kanban Board with Executive Glass Cards */}
      {stageFilter === 'ALL' ? (
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-lux-gold">Underwriting Kanban</span>
              <span className="text-[10px] text-slate-400 font-mono">Stage Transition Protocol</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Scroll horizontally to view full lifecycle</span>
          </div>
          
          <div className="overflow-x-auto pb-4 scrollbar-thin">
            <div className="flex gap-4 min-w-max">
              {STAGE_ORDER.map(stage => {
                const meta = PIPELINE_STAGES[stage];
                const stageClients = grouped[stage] || [];
                return (
                  <div key={stage} className={`w-64 border rounded-2xl p-3.5 flex flex-col ${STAGE_COLOR[meta.color]} backdrop-blur-sm shadow-lux-sm lux-bevel`}>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">{meta.label}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${STAGE_BADGE[meta.color]}`}>
                        {stageClients.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 flex-1 min-h-[160px]">
                      {stageClients.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center p-6 border border-dashed border-white/[0.06] rounded-xl text-center">
                          <p className="text-slate-500 text-[11px] font-medium">No active files</p>
                          <button 
                            onClick={() => navigate({ name: 'new-client' })}
                            className="mt-2 text-[10px] font-semibold text-lux-gold hover:underline"
                          >
                            + Onboard Client
                          </button>
                        </div>
                      )}
                      {stageClients.map(c => (
                        <motion.button 
                          key={c.id} 
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate({ name: 'client', id: c.id })}
                          className="w-full text-left rounded-xl p-3.5 bg-surface-elevated/90 hover:bg-surface-overlay/90 border border-white/[0.08] hover:border-border-gold transition-all duration-200 group shadow-lux-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-bold text-xs text-white group-hover:text-amber-200 transition-colors truncate">
                              {c.firstName} {c.lastName}
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">{c.companyName || 'Private Asset'}</div>
                          
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {c.agentOutputs?.['BIZ_FUNDING_READINESS']?.verdict === 'READY' && (
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                5P: READY
                              </span>
                            )}
                            {c.agentOutputs?.['BIZ_FUNDING_READINESS']?.verdict === 'NEEDS_ATTENTION' && (
                              <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                5P: ATTN
                              </span>
                            )}
                            {c.agentOutputs?.['BIZ_FUNDING_READINESS']?.verdict === 'FIX_BEFORE_APPLYING' && (
                              <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                5P: FIX FIRST
                              </span>
                            )}
                            {c.truebuildProfile?.metrics?.paydexScore ? (
                              <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                Paydex {c.truebuildProfile.metrics.paydexScore}
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.06]">
                            <span className="text-[10px] font-semibold text-lux-gold px-1.5 py-0.5 rounded bg-amber-500/10 border border-border-gold">
                              Tier {c.plan}
                            </span>
                            <span className={`text-xs font-bold ${c.invoice?.status === 'PAID' ? 'text-emerald-400' : c.invoice?.status === 'OVERDUE' ? 'text-rose-400' : 'text-amber-400'}`}>
                              ${(c.invoice?.amount ?? 0).toLocaleString()}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      ) : (
        /* List View */
        <motion.div variants={itemVariants} className="space-y-3">
          {loading && <p className="text-slate-400 text-xs py-4 text-center">Loading client profiles...</p>}
          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl p-8 text-center text-slate-500 text-sm bg-surface-subtle/80 border border-border-hairline">
              <p>No matching client records found.</p>
              <button 
                onClick={() => navigate({ name: 'new-client' })}
                className="mt-3 px-4 py-2 rounded-xl border border-border-gold bg-lux-gold/10 text-lux-gold text-xs font-semibold"
              >
                + Onboard New Client File
              </button>
            </div>
          )}
          {filtered.map(c => {
            const meta = PIPELINE_STAGES[c.stage];
            return (
              <motion.button 
                key={c.id} 
                whileHover={{ scale: 1.008, y: -1 }}
                onClick={() => navigate({ name: 'client', id: c.id })}
                className="w-full text-left rounded-2xl p-4.5 transition-all flex items-center justify-between gap-4 group bg-surface-subtle/90 hover:bg-surface-elevated/95 border border-white/[0.08] hover:border-border-gold shadow-lux-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white group-hover:text-amber-200 transition-colors">
                    {c.firstName} {c.lastName} 
                    <span className="text-slate-400 font-normal text-xs ml-2">· {c.companyName || 'Private Asset'}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{c.email} · {c.phone}</div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {c.agentOutputs?.['BIZ_FUNDING_READINESS']?.verdict === 'READY' && (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        5P: READY
                      </span>
                    )}
                    {c.agentOutputs?.['BIZ_FUNDING_READINESS']?.verdict === 'NEEDS_ATTENTION' && (
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        5P: ATTN
                      </span>
                    )}
                    {c.agentOutputs?.['BIZ_FUNDING_READINESS']?.verdict === 'FIX_BEFORE_APPLYING' && (
                      <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        5P: FIX FIRST
                      </span>
                    )}
                    {c.truebuildProfile?.metrics?.paydexScore ? (
                      <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        Paydex {c.truebuildProfile.metrics.paydexScore}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${STAGE_BADGE[meta.color]}`}>
                    {meta.label}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    ${(c.invoice?.amount ?? 0).toLocaleString()}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}

    </motion.div>
  );
}
