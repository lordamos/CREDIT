import React, { useEffect, useState } from 'react';
import type { 
  Client, 
  AgentId, 
  PipelineStage, 
  EmailStage, 
  BusinessProfile, 
  AddressType, 
  ReadinessVerdict,
  TrueBuildVendor,
  TrueBuildTradeline,
  TrueBuildPaymentRecord,
  TrueBuildMetrics,
  TrueBuildProfile
} from '../types/credit';
import { PIPELINE_STAGES, AGENT_META, EMAIL_STAGE_META, TRUEBUILD_DEFAULT_VENDORS } from '../types/credit';
import type { Page } from '../App';
import { AutoRepairEngine } from '../components/AutoRepairEngine';
import { 
  ArrowLeft, 
  Bot, 
  FileText, 
  Mail, 
  Scale, 
  Wrench, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Copy, 
  ChevronRight, 
  ShieldCheck, 
  DollarSign, 
  Layers, 
  Send, 
  RefreshCw,
  TrendingUp,
  AlertCircle,
  FileCheck2,
  Check,
  Building2,
  AlertTriangle,
  XCircle,
  Sliders,
  Play,
  Award,
  X,
  Briefcase,
  CreditCard,
  Lock,
  Unlock,
  ExternalLink,
  PlusCircle,
  FastForward
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = 'http://localhost:3002/api';

const STAGE_ORDER: PipelineStage[] = ['NEW', 'DOCS_VERIFIED', 'SUBMITTED', 'APPROVED', 'INVOICE_SENT', 'PAID', 'DISPUTE_ACTIVE', 'POST_CARE'];
const AGENT_ORDER: AgentId[] = ['COMPREHENSIVE_AUDIT', 'ROADMAP_90_DAY', 'DEBT_OPTIMIZER', 'DISPUTE_LETTER', 'GOODWILL_LETTER', 'INQUIRY_MINIMIZER', 'SECONDARY_FREEZE', 'CREDIT_GROWTH'];
export const BIZ_AGENT_ORDER: AgentId[] = ['BIZ_FORMATION_EIN', 'BIZ_ADDRESS_FOOTPRINT', 'BIZ_NAICS_CLASSIFICATION', 'BIZ_COMMINGLING_FINANCES', 'BIZ_FUNDING_READINESS'];
const EMAIL_STAGES: EmailStage[] = ['WELCOME', 'DOCS_VERIFIED', 'SUBMITTED', 'APPROVED', 'PAYMENT_CONFIRMED', 'OVERDUE_48H', 'POST_CARE_45DAY'];

interface Props { clientId: string; navigate: (p: Page) => void; }

type Tab = 'overview' | 'repair' | 'business-audit' | 'truebuild' | 'agents' | 'emails' | 'disputes' | 'agreement';

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^---$/gm, '<hr>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (line) => {
      if (line.startsWith('<')) return line;
      return `<p>${line}</p>`;
    });
}

function buildAgreement(client: Client): string {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const planA = client.plan === 'A';
  return `
    <div style="font-family: Georgia, serif; max-width:740px; margin:0 auto; padding:40px; color:#1a1a2e; line-height:1.7; background:#fff;">
      <div style="text-align:center; border-bottom:3px solid #1d4ed8; padding-bottom:24px; margin-bottom:32px;">
        <h1 style="font-size:22px; margin:0; color:#1d4ed8; letter-spacing:-0.5px;">PERSONAL GUARANTOR & CREDIT CONSULTING SERVICES AGREEMENT</h1>
        <p style="margin:8px 0 0; color:#666; font-size:14px;">Credit Acceleration Services · Palm Bay, Brevard County, Florida</p>
      </div>
      <p><strong>Effective Date:</strong> ${today}</p>
      <p><strong>SERVICE PROVIDER / GUARANTOR:</strong> Credit Acceleration Services, Palm Bay, Brevard County, Florida</p>
      <p><strong>CLIENT / COMPANY:</strong> ${client.firstName} ${client.lastName}${client.companyName ? ` / ${client.companyName}` : ''} · ${client.email} · ${client.phone}</p>
      <hr style="border:none;border-top:1px solid #ddd;margin:24px 0;">
      <h2 style="font-size:16px; color:#1d4ed8;">1. SCOPE OF SERVICES</h2>
      <p>Provider agrees to provide personal credit profile authorization, co-signing support, and business credit consulting services required to facilitate commercial credit card and/or credit facility applications.</p>
      <h2 style="font-size:16px; color:#1d4ed8;">2. FEE STRUCTURE (SELECTED PLAN)</h2>
      ${planA
    ? `<div style="background:#f0f7ff;border-left:4px solid #1d4ed8;padding:16px;border-radius:4px;">
           <strong>OPTION A – STANDARD PLAN</strong><br>
           Upfront Retainer: <strong>$250.00 USD</strong> (non-refundable, due upon signing)<br>
           Success Fee: <strong>$1,000.00 USD</strong> upon first credit approval<br>
           <strong>Total: $1,250.00 USD</strong>
         </div>`
    : `<div style="background:#f5f0ff;border-left:4px solid #7c3aed;padding:16px;border-radius:4px;">
           <strong>OPTION B – DEFERRED PLAN</strong><br>
           Upfront Retainer: <strong>$0.00 USD</strong><br>
           Success Fee: <strong>$1,500.00 USD</strong> upon first credit approval<br>
           <strong>Total: $1,500.00 USD</strong>
         </div>`}
      <h2 style="font-size:16px; color:#1d4ed8; margin-top:24px;">3. PAYMENT TERMS</h2>
      <p>Success Fee becomes due immediately upon receipt of credit approval notification and must be remitted within three business days.</p>
      <h2 style="font-size:16px; color:#1d4ed8;">4. JURISDICTION & GOVERNING LAW</h2>
      <p>This Agreement is governed by the laws of the State of Florida with exclusive venue in Brevard County, Florida.</p>
      <hr style="border:none;border-top:1px solid #ddd;margin:32px 0;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;">
        <div>
          <p><strong>PROVIDER / GUARANTOR:</strong></p>
          <p style="border-bottom:1px solid #333;padding-bottom:8px;margin-bottom:4px;">&nbsp;</p>
          <p style="font-size:12px;color:#666;">Authorized Officer</p>
          <p>Credit Acceleration Services<br>Palm Bay, FL 32905</p>
        </div>
        <div>
          <p><strong>CLIENT / GUARANTOR:</strong></p>
          <p style="border-bottom:1px solid #333;padding-bottom:8px;margin-bottom:4px;">&nbsp;</p>
          <p style="font-size:12px;color:#666;">Signature / Date</p>
          <p>${client.firstName} ${client.lastName}<br>${client.companyName || ''}</p>
        </div>
      </div>
    </div>`;
}

export function ClientDetail({ clientId, navigate }: Props) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [runningAgents, setRunningAgents] = useState(false);
  const [advancingStage, setAdvancingStage] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [runningBizAudit, setRunningBizAudit] = useState(false);
  const [runningSingleBiz, setRunningSingleBiz] = useState<AgentId | null>(null);
  const [showBizConfigModal, setShowBizConfigModal] = useState(false);
  const [savingBizProfile, setSavingBizProfile] = useState(false);
  const [bizFormData, setBizFormData] = useState<BusinessProfile>({});

  // TrueBuild Corporate Credit Tradeline State
  const [truebuildData, setTruebuildData] = useState<{ profile?: TrueBuildProfile; vendors?: TrueBuildVendor[]; metrics?: TrueBuildMetrics } | null>(null);
  const [simulatingCycle, setSimulatingCycle] = useState(false);
  const [showLinkTradelineModal, setShowLinkTradelineModal] = useState(false);
  const [linkVendorId, setLinkVendorId] = useState<number>(1);
  const [linkAccountNumber, setLinkAccountNumber] = useState('');
  const [linkCreditLimit, setLinkCreditLimit] = useState<number>(1000);
  const [tierFilter, setTierFilter] = useState<number>(0);

  const loadTrueBuild = async () => {
    try {
      const res = await fetch(`${API}/clients/${clientId}/truebuild`);
      const json = await res.json();
      if (json.success) {
        setTruebuildData(json.data);
      }
    } catch (e) {
      console.error('Error fetching TrueBuild data:', e);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/clients/${clientId}`);
      const json = await res.json();
      setClient(json.data);
      if (json.data?.businessProfile) {
        setBizFormData(json.data.businessProfile);
      }
      await loadTrueBuild();
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [clientId]);

  const simulateCycle = async () => {
    setSimulatingCycle(true);
    try {
      await fetch(`${API}/clients/${clientId}/truebuild/simulate-cycle`, { method: 'POST' });
      await load();
    } finally {
      setSimulatingCycle(false);
    }
  };

  const submitLinkTradeline = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${API}/clients/${clientId}/truebuild/link-tradeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: linkVendorId,
          accountNumber: linkAccountNumber,
          creditLimit: linkCreditLimit
        })
      });
      setShowLinkTradelineModal(false);
      setLinkAccountNumber('');
      await load();
    } catch (e) {
      console.error('Error linking tradeline:', e);
    }
  };

  const runAgents = async () => {
    setRunningAgents(true);
    await fetch(`${API}/clients/${clientId}/run-agents`, { method: 'POST' });
    await load();
    setRunningAgents(false);
    setTab('agents');
  };

  const runBusinessAudit = async (customProfile?: BusinessProfile) => {
    setRunningBizAudit(true);
    try {
      await fetch(`${API}/clients/${clientId}/run-business-audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customProfile || client?.businessProfile || {})
      });
      await load();
      setTab('business-audit');
    } finally {
      setRunningBizAudit(false);
    }
  };

  const runSingleBizPrompt = async (agentId: AgentId) => {
    setRunningSingleBiz(agentId);
    try {
      await fetch(`${API}/clients/${clientId}/run-agent/${agentId}`, {
        method: 'POST'
      });
      await load();
    } finally {
      setRunningSingleBiz(null);
    }
  };

  const saveBusinessProfileAndRerun = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBizProfile(true);
    try {
      await fetch(`${API}/clients/${clientId}/business-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bizFormData)
      });
      setShowBizConfigModal(false);
      await runBusinessAudit(bizFormData);
    } finally {
      setSavingBizProfile(false);
    }
  };

  const advanceStage = async () => {
    setAdvancingStage(true);
    await fetch(`${API}/clients/${clientId}/advance`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({}) 
    });
    await load();
    setAdvancingStage(false);
  };

  const sendEmail = async (stage: EmailStage) => {
    setSendingEmail(stage);
    await fetch(`${API}/clients/${clientId}/send-email`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ stage }) 
    });
    await load();
    setSendingEmail(null);
  };

  const copyIntakeLink = () => {
    if (!client) return;
    const url = `${window.location.origin}/#/intake/${client.intakeToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const printAgreement = () => {
    if (!client) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Agreement – ${client.firstName} ${client.lastName}</title></head><body>${buildAgreement(client)}<script>window.print();<\/script></body></html>`);
    win.document.close();
  };

  const printLetter = (content: string, title: string) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:40px;line-height:1.6;white-space:pre-wrap;}</style></head><body>${content}</body><script>window.print();<\/script></html>`);
    win.document.close();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
        <span className="text-xs font-semibold uppercase tracking-wider">Synchronizing client docket...</span>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-rose-400 gap-3">
        <AlertCircle className="w-8 h-8" />
        <span className="text-sm font-bold">Client record not found.</span>
        <button onClick={() => navigate({ name: 'dashboard' })} className="text-xs text-slate-400 underline mt-2">
          Return to dashboard
        </button>
      </div>
    );
  }

  const currentStageIdx = STAGE_ORDER.indexOf(client.stage);
  const nextStage = STAGE_ORDER[currentStageIdx + 1];
  const agentsDone = AGENT_ORDER.filter(id => client.agentOutputs[id]?.status === 'COMPLETE').length;
  const bizAuditsDone = BIZ_AGENT_ORDER.filter(id => client.agentOutputs[id]?.status === 'COMPLETE').length;
  const stageInfo = PIPELINE_STAGES[client.stage];
  const intakeUrl = `${window.location.origin}/#/intake/${client.intakeToken}`;

  const tabs: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'repair', label: 'Auto Repair', icon: Wrench },
    { id: 'business-audit', label: 'Commercial Audit (5 Prompts)', icon: Building2, count: bizAuditsDone },
    { id: 'truebuild', label: 'Corporate Credit (TrueBuild)', icon: Award, count: truebuildData?.profile?.tradelines?.length ?? client.truebuildProfile?.tradelines?.length ?? 0 },
    { id: 'agents', label: 'AI Agents', icon: Bot, count: agentsDone },
    { id: 'emails', label: 'Emails', icon: Mail, count: client.emailLog.length },
    { id: 'disputes', label: 'Dispute Letters', icon: Scale, count: client.disputes.length },
    { id: 'agreement', label: 'Legal Agreement', icon: FileCheck2 },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-panel p-6 rounded-2xl border border-slate-800/80">
        <div>
          <button 
            onClick={() => navigate({ name: 'dashboard' })} 
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-semibold mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overseer Dashboard</span>
          </button>
          
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              {client.firstName} {client.lastName}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              Plan {client.plan}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            {client.companyName ? `${client.companyName} · ` : ''}{client.email} · {client.phone}
          </p>
        </div>

        {/* Stage Progression Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{stageInfo.label}</span>
          </div>

          {nextStage && (
            <button 
              onClick={advanceStage} 
              disabled={advancingStage}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {advancingStage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>{advancingStage ? 'Advancing...' : `Advance to ${PIPELINE_STAGES[nextStage].label}`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Plan Structure</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-extrabold text-white">Tier {client.plan}</div>
          <div className="text-[11px] text-slate-500 mt-1">${client.plan === 'A' ? '1,250' : '1,500'} engagement value</div>
        </div>

        <div className="glass-card rounded-2xl p-4.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Success Fee Status</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-xl font-extrabold ${client.invoice?.status === 'PAID' ? 'text-emerald-400' : client.invoice?.status === 'OVERDUE' ? 'text-rose-400' : 'text-amber-400'}`}>
            ${(client.invoice?.amount ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 uppercase font-semibold">{client.invoice?.status ?? 'Pending'}</div>
        </div>

        <div className="glass-card rounded-2xl p-4.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AI Agents Executed</span>
            <Bot className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-xl font-extrabold text-white">{agentsDone} / 8</div>
          <div className="text-[11px] text-slate-500 mt-1">{client.disputes.length} legal letters drafted</div>
        </div>

        <div className="glass-card rounded-2xl p-4.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Email Dispatches</span>
            <Mail className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-extrabold text-white">
            {client.emailLog.filter(e => e.status === 'SENT').length} / {client.emailLog.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Audit log tracking active</div>
        </div>
      </div>

      {/* Executive Suite Tri-Merge Bureau Scores Card */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-subtle/80 backdrop-blur-lux border border-border-hairline p-6 shadow-lux-md transition-all duration-300 hover:border-border-gold hover:shadow-glow-gold">
        {/* Subtle ambient top gradient */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.03] to-transparent"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-lux-gold">
                Executive Suite Audit
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-lux-gold/10 text-lux-gold border border-border-gold">
                Tri-Merge Verified
              </span>
            </div>
            <div className="text-lg font-bold text-lux-primary">Live Institutional Bureau Metrics</div>
            <p className="text-xs text-lux-secondary mt-0.5">Real-time credit profile verification across national credit repositories.</p>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            {[
              { bureau: 'Equifax', score: client.creditProfile.currentScores.equifax, color: 'text-rose-400', border: 'border-rose-500/30' },
              { bureau: 'Experian', score: client.creditProfile.currentScores.experian, color: 'text-blue-400', border: 'border-blue-500/30' },
              { bureau: 'TransUnion', score: client.creditProfile.currentScores.transunion, color: 'text-violet-400', border: 'border-violet-500/30' },
            ].map(b => (
              <div key={b.bureau} className={`text-center p-3 rounded-xl bg-surface-elevated/70 border ${b.border} min-w-[85px] shadow-sm`}>
                <div className={`text-2xl font-black ${b.color}`}>{b.score ?? '—'}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-lux-secondary mt-0.5">{b.bureau}</div>
              </div>
            ))}

            <div className="text-center p-3 rounded-xl bg-lux-gold/10 border border-border-gold min-w-[85px] shadow-sm">
              <div className="text-2xl font-black text-lux-gold">{client.creditProfile.targetScore}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-lux-gold mt-0.5">Target</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button 
              onClick={() => runBusinessAudit()} 
              disabled={runningBizAudit}
              className="flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-600/20 px-4 py-3 text-xs font-bold text-indigo-200 shadow-sm transition-all hover:bg-indigo-600 hover:text-white disabled:opacity-50"
            >
              {runningBizAudit ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
              <span>{runningBizAudit ? 'Running 5 Audits...' : 'Run 5-Prompt Biz Audit'}</span>
            </button>

            <button 
              onClick={runAgents} 
              disabled={runningAgents}
              className="flex items-center gap-2 rounded-xl border border-border-gold bg-lux-gold/10 px-5 py-3 text-xs font-bold text-lux-gold shadow-lux-sm transition-all hover:bg-lux-gold hover:text-canvas-base disabled:opacity-50"
            >
              {runningAgents ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{runningAgents ? 'Executing 8 Engines...' : 'Execute 8 AI Agents'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Client Intake Share Banner */}
      <div className="glass-panel p-4.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
            <Copy className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white">Client Self-Service Intake Portal</div>
            <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">{intakeUrl}</div>
          </div>
        </div>

        <button 
          onClick={copyIntakeLink}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all shrink-0 border border-slate-700"
        >
          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedLink ? 'Copied to Clipboard!' : 'Copy Portal URL'}</span>
        </button>
      </div>

      {/* Floating Glassmorphic Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeClientTab"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-md shadow-indigo-600/30"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {t.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {/* Tab: Auto Repair */}
          {tab === 'repair' && (
            <div className="glass-card rounded-2xl p-6">
              <AutoRepairEngine client={client} onComplete={(updated) => setClient(updated)} />
            </div>
          )}

          {/* Tab: Overview */}
          {tab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pipeline Timeline */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>Pipeline Milestone Progression</span>
                </h3>
                <div className="space-y-4">
                  {STAGE_ORDER.map((stage, i) => {
                    const done = i <= currentStageIdx;
                    const current = i === currentStageIdx;
                    const meta = PIPELINE_STAGES[stage];
                    return (
                      <div key={stage} className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          current 
                            ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/40 ring-2 ring-indigo-400/40' 
                            : done 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-slate-900 border border-slate-800 text-slate-500'
                        }`}>
                          {done && !current ? <Check className="w-3.5 h-3.5" /> : i + 1}
                        </div>
                        <div className="flex-1">
                          <div className={`text-xs font-bold ${current ? 'text-indigo-300' : done ? 'text-white' : 'text-slate-500'}`}>
                            {meta.label}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{meta.description}</div>
                        </div>
                        {current && (
                          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                            Current
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes & Negative Items */}
              <div className="space-y-6">
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-400" />
                    <span>Case Consultant Notes</span>
                  </h3>
                  <p className="text-slate-400 text-xs whitespace-pre-wrap leading-relaxed">
                    {client.notes || 'No specialized underwriting or audit notes registered for this profile.'}
                  </p>
                </div>

                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>Audited Derogatory Trade Lines ({client.creditProfile.negativeItems.length})</span>
                    </h3>
                  </div>
                  
                  {client.creditProfile.negativeItems.length === 0 ? (
                    <p className="text-slate-500 text-xs">No derogatory items detected on file. Upload credit report text to execute parser.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {client.creditProfile.negativeItems.slice(0, 5).map(item => (
                        <div key={item.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                          <div>
                            <div className="text-xs font-bold text-white">{item.creditor}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">{item.type.replace(/_/g, ' ')} · {item.bureau}</div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                            Score Impact: {item.impactScore}/5
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Commercial Audit (5 Prompts) */}
          {tab === 'business-audit' && (
            <div className="space-y-6">
              {/* Executive Suite Summary Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-surface-subtle/80 backdrop-blur-lux border border-border-hairline p-6 shadow-lux-md transition-all duration-300 hover:border-border-gold hover:shadow-glow-gold">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.03] to-transparent"></div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-lux-gold">
                        Executive Underwriting Suite
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-lux-gold/10 text-lux-gold border border-border-gold">
                        5-Prompt Commercial Engine
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-lux-primary">
                      Autonomous Commercial Underwriting & Funding Readiness
                    </h2>
                    <p className="text-xs text-lux-secondary max-w-2xl leading-relaxed">
                      Audits legal formation, physical/digital footprint integrity, operational NAICS classification, and commingling risks to ensure zero lender red flags.
                    </p>
                  </div>

                  {/* Readiness Status & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="p-3.5 rounded-xl bg-surface-elevated/80 border border-slate-800 flex items-center gap-3">
                      <div className="text-center px-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Verdict</div>
                        {client.agentOutputs['BIZ_FUNDING_READINESS']?.verdict === 'READY' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> READY
                          </span>
                        ) : client.agentOutputs['BIZ_FUNDING_READINESS']?.verdict === 'NEEDS_ATTENTION' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-black text-amber-400">
                            <AlertTriangle className="w-3.5 h-3.5" /> ATTENTION
                          </span>
                        ) : client.agentOutputs['BIZ_FUNDING_READINESS']?.verdict === 'FIX_BEFORE_APPLYING' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-black text-rose-400">
                            <XCircle className="w-3.5 h-3.5" /> FIX FIRST
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-500">PENDING</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowBizConfigModal(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all shadow-sm"
                      >
                        <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Parameters</span>
                      </button>

                      <button
                        onClick={() => runBusinessAudit()}
                        disabled={runningBizAudit}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border-gold bg-lux-gold/15 hover:bg-lux-gold hover:text-canvas-base text-lux-gold text-xs font-bold shadow-lux-sm transition-all disabled:opacity-50"
                      >
                        {runningBizAudit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>{runningBizAudit ? 'Executing 5 Audits...' : 'Run All 5 Audits'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-parameters preview chips */}
                <div className="mt-5 pt-4 border-t border-border-hairline grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs relative z-10">
                  <div className="bg-surface-elevated/40 border border-border-hairline rounded-lg p-2.5">
                    <span className="text-[10px] text-lux-tertiary uppercase font-bold block">Entity & State</span>
                    <span className="text-lux-primary font-bold">{client.businessProfile?.entityType || 'LLC'} · {client.businessProfile?.formationState || client.state}</span>
                  </div>
                  <div className="bg-surface-elevated/40 border border-border-hairline rounded-lg p-2.5">
                    <span className="text-[10px] text-lux-tertiary uppercase font-bold block">Address Category</span>
                    <span className="text-lux-primary font-bold">{client.businessProfile?.addressType ? client.businessProfile.addressType.replace(/_/g, ' ') : 'UNSPECIFIED'}</span>
                  </div>
                  <div className="bg-surface-elevated/40 border border-border-hairline rounded-lg p-2.5">
                    <span className="text-[10px] text-lux-tertiary uppercase font-bold block">Dedicated Bank</span>
                    <span className={client.businessProfile?.hasDedicatedBusinessBank ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {client.businessProfile?.hasDedicatedBusinessBank ? (client.businessProfile.businessBankName || 'Verified') : 'No Commercial Bank'}
                    </span>
                  </div>
                  <div className="bg-surface-elevated/40 border border-border-hairline rounded-lg p-2.5">
                    <span className="text-[10px] text-lux-tertiary uppercase font-bold block">Commingling Status</span>
                    <span className={client.businessProfile?.comminglingDetected ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {client.businessProfile?.comminglingDetected ? 'Commingling Flagged' : 'Segregated Clean'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sequential 5 Prompts Cards */}
              <div className="space-y-4">
                {BIZ_AGENT_ORDER.map((agentId, index) => {
                  const meta = AGENT_META[agentId];
                  const result = client.agentOutputs[agentId];
                  const isRunningSingle = runningSingleBiz === agentId;
                  const isExpanded = selectedAgent === agentId;

                  return (
                    <motion.div
                      key={agentId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                        isExpanded
                          ? 'border-indigo-500/80 bg-surface-elevated/90 shadow-xl shadow-indigo-600/10'
                          : result?.status === 'COMPLETE'
                            ? 'border-slate-800 bg-surface-subtle/70 hover:border-border-gold/60'
                            : 'border-slate-800/60 bg-surface-subtle/40 opacity-75'
                      }`}
                    >
                      {/* Card Header Bar */}
                      <div 
                        onClick={() => setSelectedAgent(isExpanded ? null : agentId)}
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                      >
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 border border-indigo-500/30 text-indigo-300 font-black text-sm shrink-0">
                            P{index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white tracking-wide">{meta.title}</span>
                              <span className="text-[10px] uppercase font-bold tracking-widest text-lux-gold px-2 py-0.5 rounded-full bg-lux-gold/10 border border-border-gold">
                                Prompt {index + 1}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{meta.description}</p>
                          </div>
                        </div>

                        {/* Status + Actions */}
                        <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                          {result?.verdict === 'READY' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> READY
                            </span>
                          )}
                          {result?.verdict === 'NEEDS_ATTENTION' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3" /> ATTENTION
                            </span>
                          )}
                          {result?.verdict === 'FIX_BEFORE_APPLYING' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              <XCircle className="w-3 h-3" /> FIX BEFORE APPLYING
                            </span>
                          )}

                          <button
                            onClick={() => runSingleBizPrompt(agentId)}
                            disabled={isRunningSingle || runningBizAudit}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all disabled:opacity-50"
                          >
                            {isRunningSingle ? <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" /> : <Play className="w-3 h-3 fill-current text-indigo-400" />}
                            <span>{isRunningSingle ? 'Running...' : result ? 'Re-run Prompt' : 'Run Prompt'}</span>
                          </button>

                          <button
                            onClick={() => setSelectedAgent(isExpanded ? null : agentId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Markdown Body */}
                      <AnimatePresence>
                        {isExpanded && result && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-slate-800/80 p-5 bg-slate-950/70"
                          >
                            <div
                              className="prose-crm max-h-[550px] overflow-y-auto scrollbar-thin p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans"
                              dangerouslySetInnerHTML={{ __html: renderMarkdown(result.output) }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab: TrueBuild Corporate Credit Tradeline Engine */}
          {tab === 'truebuild' && (
            <div className="space-y-6">
              {/* Executive Suite Corporate Tri-Bureau Metrics Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-surface-subtle/80 backdrop-blur-lux border border-border-hairline p-6 shadow-lux-md transition-all duration-300 hover:border-border-gold hover:shadow-glow-gold">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.03] to-transparent"></div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-lux-gold">
                        TrueBuild Corporate Engine
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Autonomous Tradeline Builder
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-lux-primary">
                      Corporate Credit Matrix &amp; Paydex Architecture
                    </h2>
                    <p className="text-xs text-lux-secondary max-w-2xl leading-relaxed">
                      Build corporate credit profiles with verified Net 30, Revolving, and Commercial Bank facilities across D&amp;B, Experian Commercial, and Equifax Business.
                    </p>
                  </div>

                  {/* Actions: Link Tradeline & Simulate Cycle */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setShowLinkTradelineModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all shadow-sm"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Link Tradeline</span>
                    </button>

                    <button
                      onClick={simulateCycle}
                      disabled={simulatingCycle}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border-gold bg-lux-gold/15 hover:bg-lux-gold hover:text-canvas-base text-lux-gold text-xs font-bold shadow-lux-sm transition-all disabled:opacity-50"
                    >
                      {simulatingCycle ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FastForward className="w-3.5 h-3.5 fill-current" />}
                      <span>{simulatingCycle ? 'Simulating Early Payments...' : 'Simulate 30-Day Paydex Cycle'}</span>
                    </button>
                  </div>
                </div>

                {/* Live Corporate Metrics Cards */}
                <div className="mt-6 pt-6 border-t border-border-hairline grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                  <div className="text-center p-3.5 rounded-xl bg-surface-elevated/80 border border-slate-800">
                    <div className="text-2xl font-black text-amber-400">
                      {truebuildData?.metrics?.paydexScore ?? '—'}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">D&amp;B Paydex Score</div>
                    <span className="text-[9px] text-slate-500 font-medium block mt-1">Target: 80+ (Early Payments)</span>
                  </div>

                  <div className="text-center p-3.5 rounded-xl bg-surface-elevated/80 border border-slate-800">
                    <div className="text-2xl font-black text-blue-400">
                      {truebuildData?.metrics?.experianIntelliscore ?? '—'}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Experian Intelliscore</div>
                    <span className="text-[9px] text-slate-500 font-medium block mt-1">Commercial Risk Model</span>
                  </div>

                  <div className="text-center p-3.5 rounded-xl bg-surface-elevated/80 border border-slate-800">
                    <div className="text-2xl font-black text-violet-400">
                      {truebuildData?.metrics?.equifaxCommercial ?? '—'}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Equifax Commercial</div>
                    <span className="text-[9px] text-slate-500 font-medium block mt-1">Small Business Exchange</span>
                  </div>

                  <div className="text-center p-3.5 rounded-xl bg-lux-gold/10 border border-border-gold">
                    <div className="text-2xl font-black text-lux-gold">
                      ${(truebuildData?.metrics?.totalCreditLimit ?? 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-lux-gold mt-0.5">Approved Commercial Lines</div>
                    <span className="text-[9px] text-lux-secondary font-medium block mt-1">Tier {truebuildData?.metrics?.unlockedTier ?? 1} Unlocked</span>
                  </div>
                </div>
              </div>

              {/* Tier Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tier Progression:</span>
                  {[
                    { id: 0, label: 'All Vendors' },
                    { id: 1, label: 'Tier 1 (Net 30 Starter)' },
                    { id: 2, label: 'Tier 2 (Fleet & Retail)' },
                    { id: 3, label: 'Tier 3 (Revolving Business)' },
                    { id: 4, label: 'Tier 4 (Commercial Bank Cards)' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTierFilter(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        tierFilter === t.id
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-slate-400 font-medium">
                  {truebuildData?.vendors?.filter(v => tierFilter === 0 || v.tier === tierFilter).length ?? 0} Available Facilities
                </div>
              </div>

              {/* Vendor Matrix Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(truebuildData?.vendors || TRUEBUILD_DEFAULT_VENDORS)
                  .filter(v => tierFilter === 0 || v.tier === tierFilter)
                  .map(v => {
                    const isLocked = v.locked ?? false;
                    const isApplied = v.applied ?? false;
                    return (
                      <div
                        key={v.id}
                        className={`relative rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 ${
                          isApplied
                            ? 'bg-emerald-950/20 border-emerald-500/40'
                            : isLocked
                              ? 'bg-surface-subtle/50 border-slate-800/60 opacity-60'
                              : 'bg-surface-subtle/80 border-border-hairline hover:border-border-gold'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                              Tier {v.tier} Facility
                            </span>
                            {isApplied ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" /> Reporting
                              </span>
                            ) : isLocked ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                                <Lock className="w-3 h-3" /> Locked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/30">
                                <Unlock className="w-3 h-3" /> Ready
                              </span>
                            )}
                          </div>

                          <h4 className="text-base font-extrabold text-white mt-1">{v.name}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{v.category} · {v.terms}</p>

                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {v.reportsTo.split(',').map(r => (
                              <span key={r.trim()} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-semibold text-slate-300">
                                {r.trim()}
                              </span>
                            ))}
                            {v.pgRequired ? (
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-300">
                                PG Required
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                                No PG
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 mt-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900 leading-relaxed">
                            💡 <span className="font-semibold text-slate-300">Underwriting:</span> {v.underwritingTips}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-slate-400 font-semibold">Min: ${v.minInvoice}</span>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={v.applicationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
                            >
                              <span>Apply</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => {
                                setLinkVendorId(v.id);
                                setShowLinkTradelineModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-indigo-500/40 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold transition-all"
                            >
                              <span>Link</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Verified Commercial Invoices & Proof of Payment */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Commercial Trade Payment Ledger</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Electronically verified invoice settlements powering D&amp;B Paydex early payment indices.</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                    {truebuildData?.profile?.paymentRecords?.length ?? 0} Verified Payments
                  </span>
                </div>

                {(truebuildData?.profile?.paymentRecords?.length ?? 0) === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p className="text-xs">No commercial payment records yet. Click &quot;Simulate 30-Day Paydex Cycle&quot; to generate early payment settlements.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto scrollbar-thin">
                    {truebuildData!.profile!.paymentRecords.map(pmt => (
                      <div key={pmt.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-xs font-bold text-white">{pmt.vendorName} · {pmt.invoiceNumber}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Paid {pmt.paidDate} ({Math.abs(pmt.daysRelativeToDue)} days early)</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-extrabold text-emerald-400">${pmt.invoiceAmount.toFixed(2)}</div>
                          <span className="text-[9px] font-bold uppercase text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            +Paydex Boost
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: AI Agents */}
          {tab === 'agents' && (
            <div className="grid md:grid-cols-2 gap-4">
              {AGENT_ORDER.map(agentId => {
                const meta = AGENT_META[agentId];
                const result = client.agentOutputs[agentId];
                const isSelected = selectedAgent === agentId;
                return (
                  <motion.div 
                    key={agentId} 
                    onClick={() => setSelectedAgent(isSelected ? null : agentId)}
                    className={`cursor-pointer glass-card rounded-2xl p-5 transition-all ${
                      isSelected 
                        ? 'border-indigo-500 md:col-span-2 shadow-xl shadow-indigo-600/15' 
                        : result 
                          ? 'glass-card-hover border-slate-800' 
                          : 'opacity-60 border-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-white">{meta.title}</div>
                          <div className="text-[11px] text-slate-400">{meta.description}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        result?.status === 'COMPLETE' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : result?.status === 'RUNNING' 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                            : 'bg-slate-800 text-slate-500'
                      }`}>
                        {result?.status ?? 'PENDING'}
                      </span>
                    </div>

                    {isSelected && result && (
                      <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                        <div className="prose-crm max-h-[500px] overflow-y-auto scrollbar-thin p-3 rounded-xl bg-slate-950/70 border border-slate-800" dangerouslySetInnerHTML={{ __html: renderMarkdown(result.output) }} />
                        
                        {(result.letters?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {result.letters!.map(l => (
                              <button 
                                key={l.id} 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  printLetter(l.content, `${l.type} – ${l.bureau || l.creditor}`); 
                                }}
                                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-2 rounded-xl font-bold transition-all shadow-md"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Print {l.bureau || l.creditor} Notice</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Tab: Emails */}
          {tab === 'emails' && (
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">Automated Compliance Email Dispatches</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Automated Mailjet triggers based on pipeline stage triggers.</p>
                </div>
              </div>

              <div className="space-y-3">
                {EMAIL_STAGES.map(stage => {
                  const meta = EMAIL_STAGE_META[stage];
                  const sent = client.emailLog.find(e => e.stage === stage && e.status === 'SENT');
                  const isSending = sendingEmail === stage;
                  return (
                    <div key={stage} className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                      sent ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-slate-900/60 border-slate-800'
                    }`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{meta.subject}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{meta.trigger}</div>
                          {sent && (
                            <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Delivered {new Date(sent.sentAt!).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button 
                        onClick={() => sendEmail(stage)} 
                        disabled={isSending}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          sent 
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25'
                        } disabled:opacity-50`}
                      >
                        {isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>{isSending ? 'Sending...' : sent ? 'Resend Copy' : 'Dispatch Email'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab: Dispute Letters */}
          {tab === 'disputes' && (
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">Generated FCRA & Goodwill Letters</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Ready for Certified Mail or online overnight dispatch.</p>
                </div>
              </div>

              {client.disputes.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Scale className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-xs">No dispute letters generated yet. Execute the AI Agents tab to produce letters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {client.disputes.map(letter => (
                    <div key={letter.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Scale className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            {letter.type.replace(/_/g, ' ')} — {letter.bureau || 'Creditor Target'}
                          </span>
                        </div>
                        <button 
                          onClick={() => printLetter(letter.content, `${letter.type} – ${letter.bureau || ''}`)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Certified PDF</span>
                        </button>
                      </div>

                      <pre className="p-4 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap border border-slate-900">
                        {letter.content}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Legal Agreement */}
          {tab === 'agreement' && (
            <div className="relative overflow-hidden rounded-2xl bg-surface-subtle/80 backdrop-blur-lux border border-border-hairline p-6 md:p-8 shadow-lux-md transition-all duration-300 hover:border-border-gold hover:shadow-glow-gold space-y-6">
              {/* Ambient top gradient */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.03] to-transparent"></div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-lux-gold">
                      Executive Protocol
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-lux-gold/10 text-lux-gold border border-border-gold">
                      Binding Accord
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-lux-primary">Personal Guarantor Consulting Agreement</h3>
                  <p className="text-xs text-lux-secondary mt-0.5">Florida Chapter 687 Compliant Statutory Retainer & Success Fee Agreement</p>
                </div>
                <button 
                  onClick={printAgreement}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border-gold bg-lux-gold/10 hover:bg-lux-gold hover:text-canvas-base text-lux-gold text-xs font-bold shadow-lux-sm transition-all shrink-0"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Formal Sovereign Copy</span>
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-border-gold/30 shadow-2xl relative z-10" dangerouslySetInnerHTML={{ __html: buildAgreement(client) }} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Configure Business Parameters Modal */}
      <AnimatePresence>
        {showBizConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-surface-subtle border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-surface-elevated/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Commercial Underwriting Profile</h3>
                    <p className="text-[11px] text-slate-400">Tune parameters verified by the 5-Prompt Institutional Underwriting Engine</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBizConfigModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form Body */}
              <form onSubmit={saveBusinessProfileAndRerun} className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
                {/* Section 1: Formation & EIN */}
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-lux-gold flex items-center gap-2">
                    <span>Prompt 1: LLC Formation & EIN Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">Entity Structure</label>
                      <select
                        value={bizFormData.entityType || 'LLC'}
                        onChange={e => setBizFormData({ ...bizFormData, entityType: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="LLC">LLC</option>
                        <option value="C-Corp">C-Corp</option>
                        <option value="S-Corp">S-Corp</option>
                        <option value="Sole Proprietor">Sole Proprietor</option>
                        <option value="Partnership">Partnership</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">Formation State</label>
                      <input
                        type="text"
                        value={bizFormData.formationState || client?.state || ''}
                        onChange={e => setBizFormData({ ...bizFormData, formationState: e.target.value })}
                        placeholder="FL"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">Formation Year</label>
                      <input
                        type="number"
                        value={bizFormData.formationYear || 2022}
                        onChange={e => setBizFormData({ ...bizFormData, formationYear: parseInt(e.target.value) || 2022 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">EIN Verification Status</label>
                      <select
                        value={bizFormData.einLetterStatus || 'VERIFIED_CP575'}
                        onChange={e => setBizFormData({ ...bizFormData, einLetterStatus: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="VERIFIED_CP575">CP-575 Official IRS Notice</option>
                        <option value="VERIFIED_147C">147C Replacement Letter</option>
                        <option value="ONLINE_CONFIRMATION">Online SS-4 PDF</option>
                        <option value="UNVERIFIED">Unverified / Verbal</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">Ownership Percentage (%)</label>
                      <input
                        type="number"
                        value={bizFormData.ownershipPercentage ?? 100}
                        onChange={e => setBizFormData({ ...bizFormData, ownershipPercentage: parseInt(e.target.value) || 100 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bizFormData.activeGoodStanding ?? true}
                        onChange={e => setBizFormData({ ...bizFormData, activeGoodStanding: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                      />
                      <span>Active SOS Good Standing</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bizFormData.operatingAgreementFiled ?? true}
                        onChange={e => setBizFormData({ ...bizFormData, operatingAgreementFiled: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                      />
                      <span>Operating Agreement Executed</span>
                    </label>
                  </div>
                </div>

                {/* Section 2: Address & Digital Footprint */}
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="text-xs font-bold uppercase tracking-wider text-lux-gold flex items-center gap-2">
                    <span>Prompt 2: Address Suitability & Digital Presence</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">Physical Address Classification</label>
                      <select
                        value={bizFormData.addressType || 'EXECUTIVE_SUITE'}
                        onChange={e => setBizFormData({ ...bizFormData, addressType: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="BRICK_AND_MORTAR">Brick & Mortar Commercial Space</option>
                        <option value="EXECUTIVE_SUITE">Executive Suite / Regus with Dedicated Suite</option>
                        <option value="VIRTUAL_OFFICE">Virtual Office (Co-Working)</option>
                        <option value="HOME_ADDRESS">Residential Home Address</option>
                        <option value="CMRA_UPS_BOX">CMRA / UPS Store / Post Box</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">Dedicated Suite Number</label>
                      <input
                        type="text"
                        value={bizFormData.dedicatedSuiteNumber || ''}
                        onChange={e => setBizFormData({ ...bizFormData, dedicatedSuiteNumber: e.target.value })}
                        placeholder="Suite 300"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">Corporate Domain Email</label>
                      <input
                        type="email"
                        value={bizFormData.businessEmail || ''}
                        onChange={e => setBizFormData({ ...bizFormData, businessEmail: e.target.value })}
                        placeholder="contact@company.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">Business Website</label>
                      <input
                        type="url"
                        value={bizFormData.websiteUrl || ''}
                        onChange={e => setBizFormData({ ...bizFormData, websiteUrl: e.target.value })}
                        placeholder="https://company.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">Dedicated Business Phone</label>
                      <input
                        type="text"
                        value={bizFormData.businessPhone || ''}
                        onChange={e => setBizFormData({ ...bizFormData, businessPhone: e.target.value })}
                        placeholder="(800) 555-0199"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bizFormData.has411Listing ?? true}
                        onChange={e => setBizFormData({ ...bizFormData, has411Listing: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                      />
                      <span>National 411 Directory Listed</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bizFormData.hasGoogleBusinessProfile ?? true}
                        onChange={e => setBizFormData({ ...bizFormData, hasGoogleBusinessProfile: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                      />
                      <span>Google Business Profile Active</span>
                    </label>
                  </div>
                </div>

                {/* Section 3: Operations & NAICS */}
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="text-xs font-bold uppercase tracking-wider text-lux-gold flex items-center gap-2">
                    <span>Prompt 3: Actual Operations & NAICS Code</span>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                      What does the business ACTUALLY do? (Operational Reality)
                    </label>
                    <textarea
                      value={bizFormData.actualOperationsDescription || ''}
                      onChange={e => setBizFormData({ ...bizFormData, actualOperationsDescription: e.target.value })}
                      placeholder="e.g. Provides residential HVAC repair, preventative heating maintenance, and duct installation."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold block mb-1">Registered NAICS Code (if known)</label>
                    <input
                      type="text"
                      value={bizFormData.currentNaicsCode || ''}
                      onChange={e => setBizFormData({ ...bizFormData, currentNaicsCode: e.target.value })}
                      placeholder="238220"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Section 4: Commingling & Banking */}
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="text-xs font-bold uppercase tracking-wider text-lux-gold flex items-center gap-2">
                    <span>Prompt 4: Commingling & Banking Forensic Flags</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">Commercial Bank Name</label>
                      <input
                        type="text"
                        value={bizFormData.businessBankName || 'Chase Business Checking'}
                        onChange={e => setBizFormData({ ...bizFormData, businessBankName: e.target.value })}
                        placeholder="Chase Business"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">Avg Monthly Commercial Revenue ($)</label>
                      <input
                        type="number"
                        value={bizFormData.averageMonthlyRevenue ?? 20000}
                        onChange={e => setBizFormData({ ...bizFormData, averageMonthlyRevenue: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bizFormData.hasDedicatedBusinessBank ?? true}
                        onChange={e => setBizFormData({ ...bizFormData, hasDedicatedBusinessBank: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                      />
                      <span>Dedicated Business Checking Account</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bizFormData.comminglingDetected ?? false}
                        onChange={e => setBizFormData({ ...bizFormData, comminglingDetected: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-900 text-rose-500"
                      />
                      <span className="text-rose-300">Flag Commingling (Personal Card on Biz Expenses)</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBizConfigModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingBizProfile}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                  >
                    {savingBizProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{savingBizProfile ? 'Saving & Auditing...' : 'Save & Execute 5 Audits'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Link Tradeline Modal */}
      <AnimatePresence>
        {showLinkTradelineModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-surface-subtle border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-extrabold text-white">Link Commercial Tradeline</h3>
                </div>
                <button onClick={() => setShowLinkTradelineModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={submitLinkTradeline} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Target Vendor Facility</label>
                  <select
                    value={linkVendorId}
                    onChange={e => setLinkVendorId(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {TRUEBUILD_DEFAULT_VENDORS.map(v => (
                      <option key={v.id} value={v.id}>
                        Tier {v.tier} – {v.name} ({v.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Account Number / Customer ID</label>
                  <input
                    type="text"
                    required
                    value={linkAccountNumber}
                    onChange={e => setLinkAccountNumber(e.target.value)}
                    placeholder="e.g. UL-849201"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Approved Credit Limit ($)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    step={100}
                    value={linkCreditLimit}
                    onChange={e => setLinkCreditLimit(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLinkTradelineModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
                  >
                    Link Tradeline
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
