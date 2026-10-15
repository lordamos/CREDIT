import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  ShieldAlert,
  FileText,
  Clock,
  Archive,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Mail,
  Building,
  Gavel,
  RefreshCw,
  Plus,
  Send,
  Calendar,
  Check,
  Info
} from 'lucide-react';
import type {
  Client,
  FcraWalkthroughSession,
  CrossBureauAccountAudit,
  FcraEvidenceFile,
  BureauInvestigationDeadline
} from '../../shared/types/credit.js';

const API = 'http://localhost:3002/api';

interface Props {
  client: Client;
  onUpdate: (updatedClient: Client) => void;
}

export function FcraWalkthroughEngine({ client, onUpdate }: Props) {
  const [session, setSession] = useState<FcraWalkthroughSession | null>(client.fcraSession || null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(session?.currentStep || 1);
  const [selectedBureau, setSelectedBureau] = useState<'Equifax' | 'Experian' | 'TransUnion'>('Experian');
  const [selectedAccountIdx, setSelectedAccountIdx] = useState<number>(0);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Step 3 Delivery Date state
  const [inputDeliveryDate, setInputDeliveryDate] = useState<string>('');
  const [inputTrackingNum, setInputTrackingNum] = useState<string>('');
  const [savingDeadline, setSavingDeadline] = useState(false);

  // Step 4 Evidence Form state
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [evTitle, setEvTitle] = useState('');
  const [evType, setEvType] = useState<FcraEvidenceFile['type']>('CERTIFIED_MAIL_RECEIPT');
  const [evTracking, setEvTracking] = useState('');
  const [evNotes, setEvNotes] = useState('');

  // Step 5 Drafts state
  const [generatingCfpb, setGeneratingCfpb] = useState(false);
  const [generatingSuit, setGeneratingSuit] = useState(false);
  const [cfpbDraft, setCfpbDraft] = useState<string>(session?.cfpbComplaintDraft || '');
  const [intentToSueDraft, setIntentToSueDraft] = useState<string>(session?.intentToSueDraft || '');
  const [escalationTab, setEscalationTab] = useState<'CFPB' | 'INTENT_TO_SUE' | 'SMALL_CLAIMS'>('CFPB');

  // Load session from backend
  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/clients/${client.id}/fcra-session`);
      const json = await res.json();
      if (json.success && json.data.session) {
        setSession(json.data.session);
        setActiveStep(json.data.session.currentStep);
        if (json.data.session.cfpbComplaintDraft) setCfpbDraft(json.data.session.cfpbComplaintDraft);
        if (json.data.session.intentToSueDraft) setIntentToSueDraft(json.data.session.intentToSueDraft);
      }
    } catch (e) {
      console.error('Failed to load FCRA session', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) {
      fetchSession();
    }
  }, [client.id]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleStepChange = async (step: 1 | 2 | 3 | 4 | 5) => {
    setActiveStep(step);
    try {
      const res = await fetch(`${API}/clients/${client.id}/fcra-session/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step })
      });
      const json = await res.json();
      if (json.success) {
        setSession(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveDeadline = async (bureau: 'Equifax' | 'Experian' | 'TransUnion') => {
    setSavingDeadline(true);
    try {
      const res = await fetch(`${API}/clients/${client.id}/fcra-session/deadline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bureau,
          deliveredDate: inputDeliveryDate || undefined,
          trackingNumber: inputTrackingNum || undefined,
          status: 'UNDER_INVESTIGATION',
          outcomeNotes: `USPS Delivery Recorded on ${inputDeliveryDate || new Date().toISOString().split('T')[0]}`
        })
      });
      const json = await res.json();
      if (json.success) {
        setSession(json.data);
        setInputDeliveryDate('');
        setInputTrackingNum('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingDeadline(false);
    }
  };

  const handleUpdateStatus = async (
    bureau: 'Equifax' | 'Experian' | 'TransUnion',
    status: BureauInvestigationDeadline['status'],
    notes?: string
  ) => {
    try {
      const res = await fetch(`${API}/clients/${client.id}/fcra-session/deadline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bureau, status, outcomeNotes: notes })
      });
      const json = await res.json();
      if (json.success) setSession(json.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle) return;
    try {
      const res = await fetch(`${API}/clients/${client.id}/fcra-session/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: evTitle,
          type: evType,
          bureau: selectedBureau,
          trackingNumber: evTracking || undefined,
          fileNotes: evNotes || undefined,
          verified: true
        })
      });
      const json = await res.json();
      if (json.success) {
        setSession(json.data);
        setShowAddEvidence(false);
        setEvTitle('');
        setEvTracking('');
        setEvNotes('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateCfpb = async () => {
    setGeneratingCfpb(true);
    try {
      const deadline = session?.investigationDeadlines.find(d => d.bureau === selectedBureau);
      const res = await fetch(`${API}/clients/${client.id}/fcra-session/generate-cfpb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bureau: selectedBureau,
          trackingNumber: deadline?.trackingNumber || 'USPS-TRACKING-REQUIRED',
          deliveryDate: deadline?.deliveredDate || 'Confirmed 30+ Days Ago'
        })
      });
      const json = await res.json();
      if (json.success) {
        setCfpbDraft(json.data.draft);
        setSession(json.data.session);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingCfpb(false);
    }
  };

  const handleGenerateIntentToSue = async () => {
    setGeneratingSuit(true);
    try {
      const deadline = session?.investigationDeadlines.find(d => d.bureau === selectedBureau);
      const res = await fetch(`${API}/clients/${client.id}/fcra-session/generate-intent-to-sue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bureau: selectedBureau,
          trackingNumber: deadline?.trackingNumber || 'USPS-TRACKING-CONFIRMED',
          deliveryDate: deadline?.deliveredDate || '30+ Days Expired'
        })
      });
      const json = await res.json();
      if (json.success) {
        setIntentToSueDraft(json.data.draft);
        setSession(json.data.session);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingSuit(false);
    }
  };

  const discrepancies = session?.discrepanciesAudited || [];
  const currentAudit = discrepancies[selectedAccountIdx] || null;

  // Compute days left on 30-day clock for a bureau
  const getDaysRemaining = (deadlineDateStr?: string) => {
    if (!deadlineDateStr) return null;
    const target = new Date(deadlineDateStr).getTime();
    const now = Date.now();
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-8">
      {/* ── Top Executive Hero Banner ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-surface-subtle/80 backdrop-blur-lux border border-border-hairline p-6 md:p-8 shadow-lux-md"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/[0.04] to-transparent" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-lux-gold">
                Federal Statutory Framework
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-lux-gold/10 text-lux-gold border border-border-gold">
                15 U.S.C. § 1681 Jurisprudence
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-bold text-lux-primary tracking-tight">
              FCRA 5-Step Deletion & Compensation Engine
            </h2>
            <p className="mt-1 text-sm text-lux-secondary max-w-3xl">
              Leverage federal reinvestigation mandates, the Maximum Possible Accuracy standard, and strict evidentiary burdens to eliminate unverified derogatory accounts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSession}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync Session
            </button>
          </div>
        </div>

        {/* ── Foundational Doctrine Cards ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border-hairline">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 text-lux-gold text-xs font-bold uppercase tracking-wider">
              <Building className="w-4 h-4" />
              Private For-Profit Entities, Not Government Bodies
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Equifax, Experian, and TransUnion are publicly traded, for-profit data corporations subject to strict federal oversight. They hold zero judicial or law enforcement authority. They are strictly regulated by the FTC, CFPB, and federal courts.
            </p>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Scale className="w-4 h-4" />
              Debt Placement vs. Debt Ownership Doctrine
            </div>
            <p className="text-xs text-amber-200/90 mt-2 leading-relaxed">
              Disputes do <strong>not</strong> depend on whether you originally owed the debt. Bureaus and furnishers must prove strict procedural accuracy, chain-of-title, and timeliness (7-year limit). If unverified or contradictory, federal law commands mandatory deletion.
            </p>
          </div>
        </div>

        {/* ── 5-Step Progress Stepper ──────────────────────────────────── */}
        <div className="mt-8 pt-6 border-t border-border-hairline">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wider">
            <span>5-Step Procedural Roadmap</span>
            <span className="text-lux-gold">
              Step {activeStep} of 5 · {session?.completedSteps.length || 1} Completed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {[
              { num: 1, label: '1. Identify Errors', desc: '15-Field Tri-Bureau Matrix' },
              { num: 2, label: '2. Document Dispute', desc: 'Anti-Template & Statutes' },
              { num: 3, label: '3. 30-Day Clock', desc: 'Reinvestigation Window' },
              { num: 4, label: '4. Evidence File', desc: '4-Pillar Paper Trail' },
              { num: 5, label: '5. Escalate Claims', desc: 'CFPB & Intent to Sue' }
            ].map(step => {
              const isCurrent = activeStep === step.num;
              const isComplete = session?.completedSteps.includes(step.num);
              return (
                <button
                  key={step.num}
                  onClick={() => handleStepChange(step.num as any)}
                  className={`text-left p-3 rounded-xl border transition-all duration-200 ${
                    isCurrent
                      ? 'border-border-gold bg-lux-gold/10 shadow-glow-gold'
                      : isComplete
                      ? 'border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-500/50'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isCurrent ? 'text-lux-gold' : isComplete ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    {isComplete ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">{step.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Key Statutory Authority Bar ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            statute: '15 U.S.C. § 1681i',
            section: 'FCRA § 611',
            title: 'Reinvestigation Mandate',
            summary: 'Mandatory 30-day investigation. CFPB prohibits superficial automated e-OSCAR dismissals.'
          },
          {
            statute: '15 U.S.C. § 1681e(b)',
            section: 'FCRA § 607(b)',
            title: 'Maximum Possible Accuracy',
            summary: 'Cross-bureau discrepancies prove reasonable procedures were not maintained.'
          },
          {
            statute: '15 U.S.C. § 1681n',
            section: 'FCRA § 616',
            title: 'Willful Non-Compliance',
            summary: 'Statutory damages of $100 to $1,000 per violation, plus punitive damages & attorney fees.'
          },
          {
            statute: '15 U.S.C. § 1681o',
            section: 'FCRA § 617',
            title: 'Negligent Non-Compliance',
            summary: 'Civil recovery for actual damages incurred (higher interest rates, loan denials).'
          }
        ].map((s, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-800 bg-surface-subtle/60 p-4 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-lux-gold">
              <span>{s.statute}</span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">{s.section}</span>
            </div>
            <h4 className="text-xs font-semibold text-white mt-1.5">{s.title}</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{s.summary}</p>
          </div>
        ))}
      </div>

      {/* ── STEP 1: Identify Report Errors (15-Field Matrix) ────────── */}
      {activeStep === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-subtle/80 border border-border-hairline">
            <div>
              <span className="text-xs font-bold text-lux-gold uppercase tracking-wider">
                Step 1 · Line-by-Line Cross-Bureau Comparison
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                Cross-Bureau Discrepancy Matrix (15 Metro 2 Fields)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                When reporting details disagree across Equifax, Experian, or TransUnion, the information directly violates <strong>15 U.S.C. § 1681e(b)</strong>.
              </p>
            </div>

            {/* Account Selector */}
            {discrepancies.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Tradeline:</span>
                <select
                  value={selectedAccountIdx}
                  onChange={e => setSelectedAccountIdx(Number(e.target.value))}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-lux-gold"
                >
                  {discrepancies.map((d, i) => (
                    <option key={d.id} value={i}>
                      {d.creditor} ({d.accountNumberMasked}) {d.hasDiscrepancy ? '⚠️ [CONFLICT]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {currentAudit ? (
            <div className="rounded-2xl border border-border-hairline bg-surface-subtle/80 overflow-hidden shadow-lux-md">
              <div className="p-4 bg-slate-950/70 border-b border-border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{currentAudit.creditor}</span>
                    <span className="text-xs font-mono text-lux-gold">({currentAudit.accountNumberMasked})</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      {currentAudit.accountType}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Evaluated across all nationwide consumer reporting agencies for metric synchronicity.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {currentAudit.hasDiscrepancy ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Section 607(b) Accuracy Violation Proven
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Metrics Match
                    </span>
                  )}
                </div>
              </div>

              {/* 15-Field Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-border-hairline">
                    <tr>
                      <th className="py-3 px-4">Reporting Field</th>
                      <th className="py-3 px-4">Equifax</th>
                      <th className="py-3 px-4">Experian</th>
                      <th className="py-3 px-4">TransUnion</th>
                      <th className="py-3 px-4">Statutory Discrepancy Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-hairline text-slate-300">
                    {currentAudit.fields.map((f, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-800/30 transition-colors ${
                          f.isDiscrepancy ? 'bg-amber-500/[0.03]' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-white flex items-center gap-2">
                          {f.isDiscrepancy && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          )}
                          {f.fieldName}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">{f.equifaxValue || '-'}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{f.experianValue || '-'}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{f.transunionValue || '-'}</td>
                        <td className="py-3 px-4">
                          {f.isDiscrepancy ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                ⚠️ Fatal Contradiction (§ 1681e(b))
                              </span>
                              {f.legalViolationNote && (
                                <p className="text-[10px] text-slate-400 italic">{f.legalViolationNote}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-medium">Consistent</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-slate-950/80 border-t border-border-hairline flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {currentAudit.fields.filter(f => f.isDiscrepancy).length} cross-bureau discrepancies identified on this tradeline.
                </span>
                <button
                  onClick={() => handleStepChange(2)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border-gold bg-lux-gold/10 px-4 py-2 text-xs font-semibold text-lux-gold hover:bg-lux-gold hover:text-canvas-base transition-colors"
                >
                  Proceed to Step 2: Draft Documented Dispute
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40">
              <p className="text-sm text-slate-400">
                No negative items found on this client profile. Import or paste a credit report to run the 15-field comparison.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── STEP 2: Submit a Documented Dispute (Anti-Template & Statutes) */}
      {activeStep === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Warning banner: e-OSCAR OCR Defense */}
          <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0 text-red-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-300">
                  CRITICAL: Avoid Templates and AI Generators (e-OSCAR OCR Defense)
                </h4>
                <p className="text-xs text-red-200/80 mt-1 leading-relaxed">
                  Credit reporting agencies use automated optical character recognition (OCR) and computer scanners to detect form templates, standardized internet dispute letters, and raw ChatGPT outputs. When detected, they trigger automated "frivolous" dismissals under 15 U.S.C. § 1681i(a)(3).
                  <br />
                  <strong>Our Engine:</strong> Generates personalized, factual, consumer-voice disputes citing specific cross-bureau metric contradictions that mandate human verification.
                </p>
              </div>
            </div>
          </div>

          {/* Bureau Picker & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-subtle/80 border border-border-hairline">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">Target Bureau:</span>
              <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950 p-1">
                {(['Equifax', 'Experian', 'TransUnion'] as const).map(b => (
                  <button
                    key={b}
                    onClick={() => setSelectedBureau(b)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedBureau === b
                        ? 'bg-lux-gold text-canvas-base'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const letter = client.disputes.find(l => l.bureau === selectedBureau);
                  if (letter) copyToClipboard(letter.content, 'letter');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-medium text-slate-300 hover:text-white hover:border-lux-gold transition-colors"
              >
                {copiedText === 'letter' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedText === 'letter' ? 'Copied!' : 'Copy Letter'}
              </button>
              <button
                onClick={() => handleStepChange(3)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-border-gold bg-lux-gold/10 text-xs font-semibold text-lux-gold hover:bg-lux-gold hover:text-canvas-base transition-colors"
              >
                Proceed to Step 3: Track 30-Day Clock
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Dispute Letter Viewer */}
          {(() => {
            const letter = client.disputes.find(l => l.bureau === selectedBureau);
            if (!letter) {
              return (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40">
                  <p className="text-xs text-slate-400">
                    No generated dispute letter found for {selectedBureau}. Run the Auto Repair engine or AI Agents to generate letters.
                  </p>
                </div>
              );
            }
            return (
              <div className="rounded-2xl border border-border-hairline bg-surface-subtle/80 p-6 shadow-lux-md space-y-4">
                <div className="flex items-center justify-between border-b border-border-hairline pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Documented Consumer-Voice Dispute · {selectedBureau}
                    </h4>
                    <p className="text-xs text-slate-400">
                      Includes 15 U.S.C. § 1681i, § 1681e(b), § 1681n, § 1681o, and Debt Placement vs. Ownership Notice.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-lux-gold/10 text-lux-gold border border-border-gold">
                    Certified Mail Format
                  </span>
                </div>

                <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap bg-slate-950/80 p-6 rounded-xl border border-slate-800 max-h-[500px] overflow-y-auto leading-relaxed">
                  {letter.content}
                </pre>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* ── STEP 3: Review Investigation Results (30-Day Clock) ───────── */}
      {activeStep === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="p-5 rounded-2xl bg-surface-subtle/80 border border-border-hairline">
            <span className="text-xs font-bold text-lux-gold uppercase tracking-wider">
              Step 3 · Statutory Investigation Monitoring
            </span>
            <h3 className="text-lg font-bold text-white mt-1">
              30-Day Statutory Reinvestigation Countdown (15 U.S.C. § 1681i)
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Under FCRA Section 611, the credit bureau has exactly <strong>30 calendar days</strong> from confirmed USPS postal delivery to investigate. If they fail to provide the Method of Verification or respond in time, <strong>they are legally commanded to delete the item permanently</strong> under 15 U.S.C. § 1681i(a)(5)(A).
            </p>
          </div>

          {/* Clock Cards per Bureau */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['Equifax', 'Experian', 'TransUnion'] as const).map(bureau => {
              const deadline = session?.investigationDeadlines.find(d => d.bureau === bureau);
              const daysLeft = getDaysRemaining(deadline?.day30Deadline);
              const isExpired = daysLeft !== null && daysLeft <= 0;

              return (
                <div
                  key={bureau}
                  className="rounded-2xl border border-border-hairline bg-surface-subtle/80 p-5 shadow-lux-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{bureau}</h4>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          deadline?.status === 'DELETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : deadline?.status === '30_DAYS_EXPIRED'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : deadline?.status === 'UNDER_INVESTIGATION'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {deadline?.status?.replace(/_/g, ' ') || 'PENDING DELIVERY'}
                      </span>
                    </div>

                    {/* Clock Display */}
                    <div className="my-5 text-center p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                      {daysLeft !== null ? (
                        <div>
                          <div
                            className={`text-3xl font-extrabold font-mono ${
                              isExpired ? 'text-red-400' : 'text-lux-gold'
                            }`}
                          >
                            {isExpired ? '0 DAYS' : `${daysLeft}d LEFT`}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {isExpired
                              ? '🚨 Statutory 30-Day Window Has Lapsed!'
                              : `30-Day Deadline: ${deadline?.day30Deadline}`}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Clock className="w-7 h-7 mx-auto text-slate-600 mb-1" />
                          <p className="text-xs text-slate-400">Delivery date not logged yet</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-slate-400">
                      <p>
                        <strong>Tracking #:</strong> {deadline?.trackingNumber || 'Unrecorded'}
                      </p>
                      <p>
                        <strong>Delivered:</strong> {deadline?.deliveredDate || 'Pending'}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Status Updater */}
                  <div className="mt-5 pt-4 border-t border-border-hairline space-y-2">
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => handleUpdateStatus(bureau, 'DELETED', 'Verified deletion from consumer file')}
                        className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-colors"
                      >
                        Mark Deleted
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            bureau,
                            'VERIFIED_WITHOUT_METHOD',
                            'Bureau verified without sending Method of Verification'
                          )
                        }
                        className="px-2 py-1 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500 hover:text-white transition-colors"
                      >
                        Verified w/o Method
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            bureau,
                            '30_DAYS_EXPIRED',
                            '30 days elapsed without response. Mandatory deletion required.'
                          )
                        }
                        className="px-2 py-1 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        Expired & Unresolved
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Delivery Logger Form */}
          <div className="rounded-2xl border border-border-hairline bg-surface-subtle/80 p-6 shadow-lux-md">
            <h4 className="text-sm font-bold text-white mb-3">
              Record USPS Certified Mail Delivery Date
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Bureau</label>
                <select
                  value={selectedBureau}
                  onChange={e => setSelectedBureau(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  <option value="Equifax">Equifax</option>
                  <option value="Experian">Experian</option>
                  <option value="TransUnion">TransUnion</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">USPS Tracking #</label>
                <input
                  type="text"
                  placeholder="7021 0950 0001 ..."
                  value={inputTrackingNum}
                  onChange={e => setInputTrackingNum(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">USPS Confirmed Delivered Date</label>
                <input
                  type="date"
                  value={inputDeliveryDate}
                  onChange={e => setInputDeliveryDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => handleSaveDeadline(selectedBureau)}
                  disabled={savingDeadline || !inputDeliveryDate}
                  className="w-full rounded-xl border border-border-gold bg-lux-gold/10 px-4 py-2 text-xs font-semibold text-lux-gold hover:bg-lux-gold hover:text-canvas-base transition-colors disabled:opacity-50"
                >
                  {savingDeadline ? 'Saving...' : 'Start 30-Day Clock'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── STEP 4: Build an Evidence File (4-Pillar Paper Trail) ─────── */}
      {activeStep === 4 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-surface-subtle/80 border border-border-hairline">
            <div>
              <span className="text-xs font-bold text-lux-gold uppercase tracking-wider">
                Step 4 · Certified Evidentiary Preservation
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                4-Pillar Evidence File (Paper Trail Vault)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Maintain airtight legal documentation required for CFPB enforcement and civil damages under 15 U.S.C. § 1681n.
              </p>
            </div>

            <button
              onClick={() => setShowAddEvidence(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-border-gold bg-lux-gold/10 px-4 py-2 text-xs font-semibold text-lux-gold hover:bg-lux-gold hover:text-canvas-base transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Evidence Item
            </button>
          </div>

          {/* 4 Pillars Checklist Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                title: '1. Initial Reports',
                desc: 'Copies of initial reports proving the baseline cross-bureau discrepancies.',
                icon: FileText
              },
              {
                title: '2. Signed Disputes',
                desc: 'Copies of physical letters signed by consumer with IDs attached.',
                icon: Mail
              },
              {
                title: '3. USPS Certified Mail',
                desc: 'Postal receipts & electronic delivery confirmations showing delivery date.',
                icon: Archive
              },
              {
                title: '4. Bureau Responses',
                desc: 'Response letters, envelopes, or proof of 30-day non-response.',
                icon: Gavel
              }
            ].map((p, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-800 bg-slate-950/50">
                <div className="w-8 h-8 rounded-lg bg-lux-gold/10 flex items-center justify-center text-lux-gold mb-2">
                  <p.icon className="w-4 h-4" />
                </div>
                <h5 className="text-xs font-bold text-white">{p.title}</h5>
                <p className="text-[11px] text-slate-400 mt-1">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Evidence Ledger */}
          <div className="rounded-2xl border border-border-hairline bg-surface-subtle/80 overflow-hidden shadow-lux-md">
            <div className="p-4 bg-slate-950/70 border-b border-border-hairline flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Logged Evidence Records ({session?.evidenceFiles.length || 0})
              </span>
            </div>

            <div className="divide-y divide-border-hairline">
              {session?.evidenceFiles.map(ev => (
                <div key={ev.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white flex items-center gap-2">
                        {ev.title}
                        {ev.bureau && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {ev.bureau}
                          </span>
                        )}
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Type: {ev.type.replace(/_/g, ' ')}
                        {ev.trackingNumber ? ` · USPS Tracking: ${ev.trackingNumber}` : ''}
                        {ev.fileNotes ? ` · ${ev.fileNotes}` : ''}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400">
                    {new Date(ev.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Add Evidence Modal */}
          {showAddEvidence && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-2xl bg-canvas-base border border-border-gold p-6 shadow-2xl">
                <h4 className="text-sm font-bold text-white mb-4">Add Document to Evidence Vault</h4>
                <form onSubmit={handleAddEvidence} className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Document Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. USPS Certified Mail Receipt - Experian"
                      value={evTitle}
                      onChange={e => setEvTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Evidence Category</label>
                    <select
                      value={evType}
                      onChange={e => setEvType(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                    >
                      <option value="INITIAL_REPORT">Initial Tri-Merge Report</option>
                      <option value="SIGNED_DISPUTE">Signed Dispute Copy</option>
                      <option value="CERTIFIED_MAIL_RECEIPT">Certified Mail Green Card / Receipt</option>
                      <option value="USPS_DELIVERY_CONFIRMATION">USPS Delivery Confirmation</option>
                      <option value="BUREAU_RESPONSE">Bureau Response Letter / Notice</option>
                      <option value="CFPB_CONFIRMATION">CFPB Complaint Confirmation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">USPS Tracking Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="7021 0000 0000 0000"
                      value={evTracking}
                      onChange={e => setEvTracking(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Notes / Evidence Description</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Delivered to Allen TX, signed by agent."
                      value={evNotes}
                      onChange={e => setEvNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddEvidence(false)}
                      className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl border border-border-gold bg-lux-gold text-canvas-base text-xs font-bold hover:bg-lux-gold-light"
                    >
                      Save Evidence
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── STEP 5: Escalate Valid Claims (CFPB & Willful Notice) ─────── */}
      {activeStep === 5 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="p-5 rounded-2xl bg-surface-subtle/80 border border-border-hairline">
            <span className="text-xs font-bold text-lux-gold uppercase tracking-wider">
              Step 5 · Regulatory & Legal Escalation
            </span>
            <h3 className="text-lg font-bold text-white mt-1">
              Escalate Valid Claims (CFPB & Willful Non-Compliance)
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              If the credit bureau failed to complete a substantive reinvestigation within 30 days, verified without providing the Method of Verification, or dismissed the dispute as frivolous, you now possess actionable legal leverage under <strong>15 U.S.C. § 1681n</strong> ($100–$1,000 statutory damages per violation).
            </p>
          </div>

          {/* Escalation Pathways Tabs */}
          <div className="flex items-center gap-2 border-b border-border-hairline pb-2">
            {[
              { id: 'CFPB', label: 'CFPB Regulatory Complaint', icon: AlertTriangle },
              { id: 'INTENT_TO_SUE', label: 'Notice of Intent to Sue (15-Day Cure)', icon: Gavel },
              { id: 'SMALL_CLAIMS', label: 'Small Claims & Arbitration Playbook', icon: Scale }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setEscalationTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  escalationTab === tab.id
                    ? 'border border-border-gold bg-lux-gold/10 text-lux-gold shadow-glow-gold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: CFPB Complaint Generator */}
          {escalationTab === 'CFPB' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border-hairline bg-slate-950/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Submit Formal Complaint at consumerfinance.gov
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Target Bureau: <strong className="text-lux-gold">{selectedBureau}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateCfpb}
                    disabled={generatingCfpb}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${generatingCfpb ? 'animate-spin' : ''}`} />
                    Regenerate Narrative
                  </button>
                  <a
                    href="https://www.consumerfinance.gov/complaint/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-border-gold bg-lux-gold text-canvas-base text-xs font-bold hover:bg-lux-gold-light transition-colors"
                  >
                    Open CFPB Portal
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="relative rounded-2xl border border-border-hairline bg-surface-subtle/80 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Official CFPB Complaint Narrative (Ready to Paste)
                  </span>
                  <button
                    onClick={() => copyToClipboard(cfpbDraft, 'cfpb')}
                    className="inline-flex items-center gap-1.5 text-xs text-lux-gold hover:underline"
                  >
                    {copiedText === 'cfpb' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedText === 'cfpb' ? 'Copied to Clipboard!' : 'Copy Narrative'}
                  </button>
                </div>
                <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap bg-slate-950/80 p-5 rounded-xl border border-slate-800 max-h-[420px] overflow-y-auto leading-relaxed">
                  {cfpbDraft || 'Click Regenerate to build the tailored CFPB complaint narrative.'}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: Intent to Sue Demand */}
          {escalationTab === 'INTENT_TO_SUE' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border-hairline bg-slate-950/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Formal Notice of Willful Non-Compliance & 15-Day Demand to Cure
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Cites 15 U.S.C. § 1681n ($1,000 statutory damages per violation) + § 1681o
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateIntentToSue}
                    disabled={generatingSuit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${generatingSuit ? 'animate-spin' : ''}`} />
                    Regenerate Demand
                  </button>
                  <button
                    onClick={() => copyToClipboard(intentToSueDraft, 'suit')}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-border-gold bg-lux-gold text-canvas-base text-xs font-bold hover:bg-lux-gold-light transition-colors"
                  >
                    {copiedText === 'suit' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedText === 'suit' ? 'Copied!' : 'Copy Notice'}
                  </button>
                </div>
              </div>

              <div className="relative rounded-2xl border border-border-hairline bg-surface-subtle/80 p-5">
                <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap bg-slate-950/80 p-5 rounded-xl border border-slate-800 max-h-[460px] overflow-y-auto leading-relaxed">
                  {intentToSueDraft || 'Click Regenerate to build the formal Pre-Litigation Intent to Sue demand.'}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: Small Claims Action Guide */}
          {escalationTab === 'SMALL_CLAIMS' && (
            <div className="rounded-2xl border border-border-hairline bg-surface-subtle/80 p-6 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-lux-gold" />
                Small Claims & Arbitration Action Roadmap
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                If the bureau does not cure within 15 days, you have the right to file an action in your local municipal/county Small Claims Court or submit an arbitration demand.
              </p>

              <div className="space-y-3 pt-2 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <strong className="text-lux-gold block mb-1">1. Identify the Registered Agent</strong>
                  Each bureau maintains a registered corporate agent in your state (e.g., CT Corporation System or Corporation Trust Company). Check your Secretary of State business registry for service of process.
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <strong className="text-lux-gold block mb-1">2. Calculate Statutory & Actual Damages</strong>
                  Claim $100 to $1,000 per willful violation under 15 U.S.C. § 1681n(a)(1)(A). For example, 3 uninvestigated tradelines across 2 bureaus can represent $6,000+ in statutory damages, plus filing fees.
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <strong className="text-lux-gold block mb-1">3. Present the 4-Pillar Evidence File</strong>
                  Judges examine physical documentation: (1) Baseline report; (2) Certified dispute; (3) Postal tracking showing 30+ days expired; (4) Lack of substantive reinvestigation.
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
