import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Building,
  Zap,
  Wifi,
  Phone,
  Flame,
  Droplet,
  Tv,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Sliders,
  Sparkles,
  ShieldCheck,
  Calendar,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Award,
  Layers,
  ArrowUpRight,
  Info
} from 'lucide-react';
import type {
  Client,
  PositiveTradeline,
  PositiveTradelineType,
  RentReportingProfile,
  MonthlyScoreProjectionPoint,
  CreditFactorDiagnostic,
  CreditBuilderProductRecommendation,
  PositiveReportingSuite
} from '../../shared/types/credit.js';
import { DEFAULT_CREDIT_BUILDER_PRODUCTS } from '../../shared/types/credit.js';

const API = 'http://localhost:3002/api';

interface Props {
  client: Client;
  onUpdate: (updatedClient: Client) => void;
}

export function PositiveTradelinesEngine({ client, onUpdate }: Props) {
  const [suite, setSuite] = useState<PositiveReportingSuite | null>(client.positiveReportingSuite || null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Simulator controls state
  const rentTradeline = suite?.tradelines.find(t => t.type === 'RENT');
  const [sliderRent, setSliderRent] = useState<number>(rentTradeline?.monthlyAmount || 1450);
  const [sliderUtilities, setSliderUtilities] = useState<number>(240);
  const [sliderBackdatedMonths, setSliderBackdatedMonths] = useState<number>(24);
  const [sliderSituation, setSliderSituation] = useState<'THIN_FILE' | 'REBUILDING' | 'ERRORS_ONLY' | 'OPTIMIZING'>('REBUILDING');

  // Add Tradeline Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState<PositiveTradelineType>('ELECTRIC');
  const [newProvider, setNewProvider] = useState('');
  const [newAmount, setNewAmount] = useState('85');
  const [newBackdatedMonths, setNewBackdatedMonths] = useState('12');
  const [newMaskedAcct, setNewMaskedAcct] = useState('');
  const [savingTradeline, setSavingTradeline] = useState(false);

  // Edit Rent Modal
  const [showRentModal, setShowRentModal] = useState(false);
  const [rentLandlord, setRentLandlord] = useState(suite?.rentProfile?.landlordName || 'Highland Ridge Residential');
  const [rentAmount, setRentAmount] = useState(String(suite?.rentProfile?.monthlyRent || 1450));
  const [rentBackdated, setRentBackdated] = useState(String(suite?.rentProfile?.backdatedMonths || 24));
  const [rentMethod, setRentMethod] = useState<'BANK_PLAID' | 'PROPERTY_PORTAL' | 'LEASE_LEDGER' | 'CASH_RECEIPTS'>(
    suite?.rentProfile?.verificationMethod || 'BANK_PLAID'
  );
  const [savingRent, setSavingRent] = useState(false);

  // Load suite from backend
  const fetchSuite = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/clients/${client.id}/positive-reporting`);
      const json = await res.json();
      if (json.success && json.data) {
        setSuite(json.data);
      }
    } catch (e) {
      console.error('Failed to load positive reporting suite', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!suite) {
      fetchSuite();
    }
  }, [client.id]);

  // Recalculate simulation with slider changes
  const runSimulation = async () => {
    try {
      setSimulating(true);
      const res = await fetch(`${API}/clients/${client.id}/positive-reporting/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyRent: sliderRent,
          monthlyUtilities: sliderUtilities,
          backdatedRentMonths: sliderBackdatedMonths,
          profileSituation: sliderSituation,
          creditUtilizationPercent: client.creditProfile.currentUtilization || 50
        })
      });
      const json = await res.json();
      if (json.success && json.data && suite) {
        setSuite({
          ...suite,
          projection: json.data.projection,
          projected6MonthGain: json.data.projected6MonthGain
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  const handleAddTradeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvider.trim()) return;

    try {
      setSavingTradeline(true);
      const res = await fetch(`${API}/clients/${client.id}/positive-reporting/tradelines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newType,
          providerName: newProvider.trim(),
          accountNumberMasked: newMaskedAcct ? `****${newMaskedAcct}` : undefined,
          monthlyAmount: Number(newAmount) || 75,
          backdatedMonths: Number(newBackdatedMonths) || 12,
          reportingBureaus: ['Equifax', 'Experian', 'TransUnion']
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSuite(json.data.suite);
        onUpdate(json.data.client);
        setShowAddModal(false);
        setNewProvider('');
        setNewAmount('85');
        setNewMaskedAcct('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingTradeline(false);
    }
  };

  const handleDeleteTradeline = async (id: string) => {
    try {
      const res = await fetch(`${API}/clients/${client.id}/positive-reporting/tradelines/${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSuite(json.data.suite);
        onUpdate(json.data.client);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveRentProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingRent(false);
      const res = await fetch(`${API}/clients/${client.id}/positive-reporting/rent-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landlordName: rentLandlord.trim() || 'Highland Ridge Residential',
          monthlyRent: Number(rentAmount) || 1450,
          backdatedMonths: Number(rentBackdated) || 24,
          verificationMethod: rentMethod,
          backdatingRequested: true
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSuite(json.data.suite);
        onUpdate(json.data.client);
        setShowRentModal(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingRent(false);
    }
  };

  const getTypeIcon = (type: PositiveTradelineType) => {
    switch (type) {
      case 'RENT': return <Building className="w-4 h-4 text-lux-gold" />;
      case 'ELECTRIC': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'INTERNET': return <Wifi className="w-4 h-4 text-blue-400" />;
      case 'MOBILE': return <Phone className="w-4 h-4 text-emerald-400" />;
      case 'GAS': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'WATER': return <Droplet className="w-4 h-4 text-cyan-400" />;
      case 'STREAMING': return <Tv className="w-4 h-4 text-purple-400" />;
      default: return <Layers className="w-4 h-4 text-indigo-400" />;
    }
  };

  const projection = suite?.projection || [];
  const finalPoint = projection[projection.length - 1];
  const maxProjected = finalPoint?.projectedScore || 710;
  const startingScore = projection[0]?.baselineScore || 545;

  return (
    <div className="space-y-6">
      {/* ── Section 1: Executive Dual-Action Hero Banner ──────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-subtle/80 backdrop-blur-lux border border-border-hairline p-6 shadow-lux-md hover:border-border-gold transition-all duration-300">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/[0.04] to-transparent" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-lux-gold">
                Positive Tradeline & Score Acceleration Engine
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Ryezing 10x Architectural Model
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Dual-Action Credit Acceleration: Negative Removal + Positive Addition
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Traditional credit repair only attacks negative tradelines. TrueBuild pairs aggressive <strong>FCRA § 1681i statutory dispute deletions</strong> with <strong>24-month retroactive rent and utility reporting</strong> to season files, generate instant positive payment velocity, and leapfrog into prime tiers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowRentModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-gold bg-lux-gold/15 hover:bg-lux-gold hover:text-canvas-base text-lux-gold text-xs font-bold shadow-lux-sm transition-all"
            >
              <Building className="w-3.5 h-3.5" />
              <span>Configure 24-Mo Rent Reporting</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Link Utility / Recurring Bill</span>
            </button>
          </div>
        </div>

        {/* Real-Time Metrics Strip */}
        <div className="mt-6 pt-6 border-t border-border-hairline grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          <div className="p-3.5 rounded-xl bg-surface-elevated/80 border border-slate-800 text-center">
            <div className="text-2xl font-black text-lux-gold">
              ${(suite?.totalMonthlyReportingAmount || 1725).toLocaleString()}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
              Monthly Positive Volume
            </div>
            <span className="text-[9px] text-slate-500 font-medium block mt-0.5">
              Reported to 3 Bureaus
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-elevated/80 border border-slate-800 text-center">
            <div className="text-2xl font-black text-emerald-400">
              {suite?.totalSeasonedMonthsAdded || 78} Mo.
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
              Seasoned Payment Ledger
            </div>
            <span className="text-[9px] text-slate-500 font-medium block mt-0.5">
              Retroactive Backdating Active
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-elevated/80 border border-slate-800 text-center">
            <div className="text-2xl font-black text-blue-400">
              +{suite?.projected6MonthGain || 163} Pts
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
              6-Month Projected Gain
            </div>
            <span className="text-[9px] text-slate-500 font-medium block mt-0.5">
              Target: {maxProjected} FICO
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-elevated/80 border border-slate-800 text-center">
            <div className="text-2xl font-black text-purple-400">
              {suite?.tradelines.length || 4} Lines
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
              Primary Tradelines Active
            </div>
            <span className="text-[9px] text-slate-500 font-medium block mt-0.5">
              Zero Hard Inquiries
            </span>
          </div>
        </div>
      </div>

      {/* ── Section 2: Interactive 6-Month Dual-Action Simulator ─────── */}
      <div className="rounded-2xl border border-border-hairline bg-surface-subtle/80 p-6 shadow-lux-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-lux-gold" />
              <h3 className="text-sm font-bold text-white">
                Interactive 6-Month Score Trajectory Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Adjust monthly rent, recurring utilities, and client starting situation to calculate the dual-action compounding trajectory.
            </p>
          </div>

          <button
            onClick={runSimulation}
            disabled={simulating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border-gold bg-lux-gold text-canvas-base text-xs font-bold shadow-lux-sm hover:brightness-110 disabled:opacity-50 transition-all self-start sm:self-auto"
          >
            {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {simulating ? 'Calculating...' : 'Recalculate Trajectory'}
          </button>
        </div>

        {/* Sliders & Situation Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-xl bg-slate-950/80 border border-slate-800">
          {/* Rent Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Monthly Rent Payment</label>
              <span className="text-xs font-mono font-bold text-lux-gold">${sliderRent.toLocaleString()}/mo</span>
            </div>
            <input
              type="range"
              min={600}
              max={3500}
              step={50}
              value={sliderRent}
              onChange={e => setSliderRent(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>$600</span>
              <span>$2,000</span>
              <span>$3,500</span>
            </div>
          </div>

          {/* Utilities Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Recurring Utilities & Telecom</label>
              <span className="text-xs font-mono font-bold text-blue-400">${sliderUtilities.toLocaleString()}/mo</span>
            </div>
            <input
              type="range"
              min={50}
              max={600}
              step={10}
              value={sliderUtilities}
              onChange={e => setSliderUtilities(Number(e.target.value))}
              className="w-full accent-blue-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>$50</span>
              <span>$300</span>
              <span>$600</span>
            </div>
          </div>

          {/* Situation Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Starting Credit Profile</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'THIN_FILE', label: 'Thin File' },
                { id: 'REBUILDING', label: 'Rebuilding' },
                { id: 'ERRORS_ONLY', label: 'Errors Only' },
                { id: 'OPTIMIZING', label: 'Prime Scaling' }
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSliderSituation(s.id as any)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sliderSituation === s.id
                      ? 'bg-lux-gold text-canvas-base shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Month-by-Month Trajectory Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              6-Month Compounding Progression Timeline
            </span>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                Free Monitoring (Flat: +{finalPoint ? finalPoint.baselineScore - startingScore : 0} pts)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                TrueBuild Dual-Action (+{suite?.projected6MonthGain || 163} pts)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {projection.map((point) => {
              const isFinal = point.month === 6;
              const isStart = point.month === 0;

              return (
                <div
                  key={point.month}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                    isFinal
                      ? 'border-border-gold bg-lux-gold/10 shadow-lux-sm ring-1 ring-lux-gold/30'
                      : isStart
                      ? 'border-slate-800 bg-slate-950/70'
                      : 'border-slate-800/80 bg-surface-elevated/70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>{point.label}</span>
                      {point.scoreGain > 0 && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          +{point.scoreGain}
                        </span>
                      )}
                    </div>

                    <div className="my-2.5 text-center">
                      <div className={`text-xl font-black ${isFinal ? 'text-lux-gold' : 'text-white'}`}>
                        {point.projectedScore}
                      </div>
                      <span className="text-[9px] text-slate-500 line-through">
                        Base: {point.baselineScore}
                      </span>
                    </div>

                    {point.milestoneReached && (
                      <span className={`text-[9px] font-bold block text-center px-1.5 py-0.5 rounded truncate ${
                        isFinal
                          ? 'bg-lux-gold text-canvas-base'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {point.milestoneReached}
                      </span>
                    )}
                  </div>

                  <p className="text-[9px] text-slate-400 mt-2 line-clamp-3 leading-snug">
                    {point.keyDrivers[0]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Section 3: Verified Tradelines Manager ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Tradelines List */}
        <div className="lg:col-span-2 rounded-2xl border border-border-hairline bg-surface-subtle/80 p-6 shadow-lux-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-lux-gold" />
                Active Verified Primary Tradelines ({suite?.tradelines.length || 0})
              </h3>
              <p className="text-xs text-slate-400">
                Recurring living expenses reported directly to Equifax, Experian, and TransUnion.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-gold bg-lux-gold/10 text-xs font-semibold text-lux-gold hover:bg-lux-gold hover:text-canvas-base transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Tradeline
            </button>
          </div>

          <div className="space-y-3">
            {suite?.tradelines.map(t => (
              <div
                key={t.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    {getTypeIcon(t.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{t.providerName}</span>
                      <span className="text-[10px] font-mono text-slate-400">{t.accountNumberMasked}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {t.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                      <span className="font-semibold text-lux-gold">${t.monthlyAmount}/month</span>
                      <span>•</span>
                      <span>{t.backdatedMonths} Months Backdated Ledger</span>
                      <span>•</span>
                      <span className="text-emerald-300 font-medium">
                        {t.onTimePaymentCount} On-Time Payments
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {t.reportingBureaus.map(b => (
                        <span key={b} className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleDeleteTradeline(t.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove Tradeline"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Rent Reporting Card */}
        <div className="rounded-2xl border border-border-hairline bg-surface-subtle/80 p-6 shadow-lux-md flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-lux-gold">
                Anchor Tradeline
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                24-Mo Retroactive
              </span>
            </div>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-lux-gold" />
              Verified Rent Reporting
            </h3>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Landlord / Entity:</span>
                <span className="font-semibold text-white">{suite?.rentProfile?.landlordName || 'Highland Ridge'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monthly Rent:</span>
                <span className="font-bold text-lux-gold font-mono">${suite?.rentProfile?.monthlyRent || 1450}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verification Channel:</span>
                <span className="font-semibold text-slate-300">{suite?.rentProfile?.verificationMethod?.replace(/_/g, ' ') || 'Bank Plaid'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Backdated History:</span>
                <span className="font-bold text-emerald-400">{suite?.rentProfile?.backdatedMonths || 24} Months Seasoning</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Rent is typically a client's largest monthly expenditure. Reporting it adds up to 24 seasoned on-time marks and 2 years of account age without opening a credit card.
            </p>
          </div>

          <button
            onClick={() => setShowRentModal(true)}
            className="w-full py-2.5 px-4 rounded-xl border border-border-gold bg-lux-gold/10 hover:bg-lux-gold hover:text-canvas-base text-xs font-bold text-lux-gold transition-colors text-center"
          >
            Update Lease & Landlord Details
          </button>
        </div>
      </div>

      {/* ── Section 4: FICO 5-Factor Diagnostic Center ─────────────── */}
      <div className="rounded-2xl border border-border-hairline bg-surface-subtle/80 p-6 shadow-lux-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" />
              FICO 5-Factor Diagnostic & Acceleration Roadmap
            </h3>
            <p className="text-xs text-slate-400">
              Live algorithmic breakdown showing how positive tradelines and FCRA disputes directly address the 5 mathematical pillars.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            FICO 8 / 9 Weighting Matrix
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            suite?.factorDiagnostic?.paymentHistory,
            suite?.factorDiagnostic?.creditUtilization,
            suite?.factorDiagnostic?.accountAge,
            suite?.factorDiagnostic?.creditMix,
            suite?.factorDiagnostic?.newCredit
          ].filter(Boolean).map((f, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{f!.name}</span>
                  <span className="text-[10px] font-mono text-lux-gold font-extrabold">{f!.weight}%</span>
                </div>

                <div className="my-2.5">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Factor Health</span>
                    <span className={`font-bold ${
                      f!.rating === 'EXCELLENT' ? 'text-emerald-400' :
                      f!.rating === 'GOOD' ? 'text-blue-400' :
                      f!.rating === 'FAIR' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {f!.rating} ({f!.score}/100)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        f!.rating === 'EXCELLENT' ? 'bg-emerald-400' :
                        f!.rating === 'GOOD' ? 'bg-blue-400' :
                        f!.rating === 'FAIR' ? 'bg-amber-400' : 'bg-rose-400'
                      }`}
                      style={{ width: `${f!.score}%` }}
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 line-clamp-3 leading-snug">
                  {f!.detail}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-900">
                <span className="text-[9px] font-bold text-lux-gold block mb-0.5 uppercase tracking-wider">TrueBuild Action:</span>
                <p className="text-[10px] text-slate-300 leading-snug italic">
                  {f!.actionRecommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 5: Primary Credit-Builder Product Marketplace ────── */}
      <div className="rounded-2xl border border-border-hairline bg-surface-subtle/80 p-6 shadow-lux-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Primary Credit-Builder Product Marketplace
            </h3>
            <p className="text-xs text-slate-400">
              Curated, non-predatory credit builder tools to stack positive tradelines with zero hard-inquiry denial risks.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Pre-Screened Lenders
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(suite?.recommendedProducts || DEFAULT_CREDIT_BUILDER_PRODUCTS).map(prod => (
            <div
              key={prod.id}
              className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    prod.approvalOdds === 'GUARANTEED'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}>
                    {prod.approvalOdds} APPROVAL
                  </span>
                  {prod.noHardPull && (
                    <span className="text-[9px] font-mono text-slate-400">No Hard Pull</span>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white">{prod.name}</h4>
                  <span className="text-[10px] text-slate-400 block">{prod.provider}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-elevated/70 border border-slate-800/80 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Terms / Fee:</span>
                    <span className="font-semibold text-slate-200">{prod.minDepositOrFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reports To:</span>
                    <span className="font-semibold text-emerald-400">{prod.reportsTo}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug">
                  {prod.highlightBenefit}
                </p>
              </div>

              <a
                href={prod.applicationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-colors"
              >
                <span>Apply Direct</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-lux-gold" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* ── Add Utility Modal ────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-hairline bg-surface-base p-6 shadow-lux-lg space-y-4">
            <div className="flex items-center justify-between border-b border-border-hairline pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Link Recurring Utility / Telecom Tradeline
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddTradeline} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Tradeline Category</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as any)}
                  className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                >
                  <option value="ELECTRIC">Electric Utility (FPL, Duke, ConEd)</option>
                  <option value="GAS">Natural Gas (National Grid, Atmos)</option>
                  <option value="WATER">Municipal Water / Sewer</option>
                  <option value="INTERNET">High-Speed Internet (Comcast, AT&T, Spectrum)</option>
                  <option value="MOBILE">Mobile Phone Telecom (Verizon, T-Mobile)</option>
                  <option value="STREAMING">Digital Subscriptions (Netflix, Spotify)</option>
                  <option value="CREDIT_BUILDER">Credit Builder Account</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Provider / Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Duke Energy, Comcast Xfinity"
                  value={newProvider}
                  onChange={e => setNewProvider(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Monthly Amount ($)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Backdated Months</label>
                  <select
                    value={newBackdatedMonths}
                    onChange={e => setNewBackdatedMonths(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                  >
                    <option value="6">6 Months</option>
                    <option value="12">12 Months (1 Year)</option>
                    <option value="18">18 Months</option>
                    <option value="24">24 Months (2 Years)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Last 4 Digits of Account Number</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. 7419"
                  value={newMaskedAcct}
                  onChange={e => setNewMaskedAcct(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTradeline}
                  className="px-4 py-2 rounded-xl border border-border-gold bg-lux-gold text-canvas-base text-xs font-bold shadow-lux-sm hover:brightness-110 disabled:opacity-50"
                >
                  {savingTradeline ? 'Connecting...' : 'Link & Verify Tradeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Rent Profile Modal ──────────────────────────────────── */}
      {showRentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-hairline bg-surface-base p-6 shadow-lux-lg space-y-4">
            <div className="flex items-center justify-between border-b border-border-hairline pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-lux-gold" />
                Configure Rent Reporting & 24-Mo Backdating
              </h3>
              <button onClick={() => setShowRentModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveRentProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Landlord or Property Management</label>
                <input
                  type="text"
                  required
                  value={rentLandlord}
                  onChange={e => setRentLandlord(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Monthly Rent ($)</label>
                  <input
                    type="number"
                    value={rentAmount}
                    onChange={e => setRentAmount(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Backdating Period</label>
                  <select
                    value={rentBackdated}
                    onChange={e => setRentBackdated(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                  >
                    <option value="12">12 Months (1 Year)</option>
                    <option value="24">24 Months (Maximum 2 Years)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Verification Channel</label>
                <select
                  value={rentMethod}
                  onChange={e => setRentMethod(e.target.value as any)}
                  className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white"
                >
                  <option value="BANK_PLAID">Bank Transfer Plaid Integration</option>
                  <option value="PROPERTY_PORTAL">Resident Portal (AppFolio, Buildium, Yardi)</option>
                  <option value="LEASE_LEDGER">Signed Lease + Bank Statements Ledger</option>
                  <option value="CASH_RECEIPTS">Landlord Written Receipts</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-lux-gold/10 border border-border-gold text-[11px] text-lux-gold">
                ✨ 24-month backdating will immediately inject 24 consecutive on-time marks across Equifax, Experian, and TransUnion.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRent}
                  className="px-4 py-2 rounded-xl border border-border-gold bg-lux-gold text-canvas-base text-xs font-bold shadow-lux-sm hover:brightness-110 disabled:opacity-50"
                >
                  {savingRent ? 'Saving...' : 'Save & Verify Rent Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
