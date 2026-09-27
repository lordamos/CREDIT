import React, { useEffect, useState } from 'react';
import type { Client, AgentId, PipelineStage, EmailStage } from '../types/credit';
import { PIPELINE_STAGES, AGENT_META, EMAIL_STAGE_META } from '../types/credit';
import type { Page } from '../App';
import { AutoRepairEngine } from '../components/AutoRepairEngine';

const API = 'http://localhost:3002/api';

const STAGE_ORDER: PipelineStage[] = ['NEW', 'DOCS_VERIFIED', 'SUBMITTED', 'APPROVED', 'INVOICE_SENT', 'PAID', 'DISPUTE_ACTIVE', 'POST_CARE'];
const AGENT_ORDER: AgentId[] = ['COMPREHENSIVE_AUDIT', 'ROADMAP_90_DAY', 'DEBT_OPTIMIZER', 'DISPUTE_LETTER', 'GOODWILL_LETTER', 'INQUIRY_MINIMIZER', 'SECONDARY_FREEZE', 'CREDIT_GROWTH'];
const EMAIL_STAGES: EmailStage[] = ['WELCOME', 'DOCS_VERIFIED', 'SUBMITTED', 'APPROVED', 'PAYMENT_CONFIRMED', 'OVERDUE_48H', 'POST_CARE_45DAY'];

interface Props { clientId: string; navigate: (p: Page) => void; }

type Tab = 'overview' | 'repair' | 'agents' | 'emails' | 'disputes' | 'agreement';

// Simple markdown → HTML renderer (headings, bold, italic, code, tables, lists, hr)
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

// Agreement HTML
function buildAgreement(client: Client): string {
  const today = new Date().toLocaleDateString('en-US', { weekday: undefined, year: 'numeric', month: 'long', day: 'numeric' });
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
           <strong>✅ OPTION A – STANDARD PLAN</strong><br>
           Upfront Retainer: <strong>$250.00 USD</strong> (non-refundable, due upon signing)<br>
           Success Fee: <strong>$1,000.00 USD</strong> upon first credit approval<br>
           <strong>Total: $1,250.00 USD</strong>
         </div>`
    : `<div style="background:#f5f0ff;border-left:4px solid #7c3aed;padding:16px;border-radius:4px;">
           <strong>✅ OPTION B – DEFERRED PLAN</strong><br>
           Upfront Retainer: <strong>$0.00 USD</strong><br>
           Success Fee: <strong>$1,500.00 USD</strong> ($1,000 base + $500 deferred surcharge) upon first credit approval<br>
           <strong>Total: $1,500.00 USD</strong>
         </div>`}
      <h2 style="font-size:16px; color:#1d4ed8; margin-top:24px;">3. PAYMENT TERMS</h2>
      <p>Success Fee becomes due immediately upon receipt of credit approval notification and must be remitted within <strong>three (3) business days</strong> of card activation via ACH, wire transfer, or certified bank draft. Unpaid balances accrue interest under Florida Statutes Chapter 687. Non-payment authorizes Provider to request immediate account suspension with the issuing institution.</p>
      <h2 style="font-size:16px; color:#1d4ed8;">4. CLIENT RESPONSIBILITY & INDEMNIFICATION</h2>
      <p>Client assumes <strong>100% sole liability</strong> for all balances, charges, interest, and fees on any account. Client agrees to indemnify, defend, and hold harmless Provider from all claims, losses, and attorney's fees arising from Client's use of secured credit facilities.</p>
      <h2 style="font-size:16px; color:#1d4ed8;">5. AUTOMATED COMMUNICATIONS CONSENT</h2>
      <p>Client expressly consents to receive automated electronic status updates, approval alerts, invoice notices, and compliance notifications via email and SMS at contact information provided during onboarding.</p>
      <h2 style="font-size:16px; color:#1d4ed8;">6. GOVERNING LAW & JURISDICTION</h2>
      <p>This Agreement is governed by the laws of the <strong>State of Florida</strong>. All disputes shall be resolved exclusively in <strong>Brevard County, Florida</strong>, or through binding AAA arbitration in Brevard County. Prevailing party is entitled to full legal fee recovery.</p>
      <hr style="border:none;border-top:1px solid #ddd;margin:32px 0;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;">
        <div>
          <p><strong>PROVIDER / GUARANTOR:</strong></p>
          <p style="border-bottom:1px solid #333;padding-bottom:8px;margin-bottom:4px;">&nbsp;</p>
          <p style="font-size:12px;color:#666;">Signature / Date</p>
          <p>Credit Acceleration Services<br>Palm Bay, FL 32905</p>
        </div>
        <div>
          <p><strong>CLIENT / COMPANY REPRESENTATIVE:</strong></p>
          <p style="border-bottom:1px solid #333;padding-bottom:8px;margin-bottom:4px;">&nbsp;</p>
          <p style="font-size:12px;color:#666;">Signature / Date</p>
          <p>${client.firstName} ${client.lastName}<br>${client.companyName || ''}<br>${client.email}</p>
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
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/clients/${clientId}`);
      const json = await res.json();
      setClient(json.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [clientId]);

  const runAgents = async () => {
    setRunningAgents(true);
    await fetch(`${API}/clients/${clientId}/run-agents`, { method: 'POST' });
    await load();
    setRunningAgents(false);
    setTab('agents');
  };

  const advanceStage = async () => {
    setAdvancingStage(true);
    await fetch(`${API}/clients/${clientId}/advance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    await load();
    setAdvancingStage(false);
  };

  const sendEmail = async (stage: EmailStage) => {
    setSendingEmail(stage);
    await fetch(`${API}/clients/${clientId}/send-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage }) });
    await load();
    setSendingEmail(null);
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

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;
  if (!client) return <div className="flex items-center justify-center h-64 text-red-400">Client not found.</div>;

  const currentStageIdx = STAGE_ORDER.indexOf(client.stage);
  const nextStage = STAGE_ORDER[currentStageIdx + 1];
  const agentsDone = Object.keys(client.agentOutputs).length;
  const stageInfo = PIPELINE_STAGES[client.stage];
  const intakeUrl = `${window.location.origin}/intake/${client.intakeToken}`;

  const tabCls = (t: Tab) => `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-white'}`;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button onClick={() => navigate({ name: 'dashboard' })} className="text-slate-500 hover:text-white text-sm mb-2 flex items-center gap-1">← Dashboard</button>
          <h1 className="text-2xl font-bold text-white">{client.firstName} {client.lastName}</h1>
          <p className="text-slate-400 text-sm">{client.companyName} · {client.email} · {client.phone}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
            stageInfo.color === 'green' || stageInfo.color === 'emerald' ? 'bg-green-500/20 text-green-300' :
            stageInfo.color === 'blue' ? 'bg-blue-500/20 text-blue-300' :
            stageInfo.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-300' :
            stageInfo.color === 'red' ? 'bg-red-500/20 text-red-300' :
            'bg-slate-700 text-slate-300'}`}>
            {stageInfo.label}
          </span>
          {nextStage && (
            <button onClick={advanceStage} disabled={advancingStage}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              {advancingStage ? '⏳' : '→'} {advancingStage ? 'Advancing...' : `Move to ${PIPELINE_STAGES[nextStage].label}`}
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400">Plan</div>
          <div className="font-bold text-white">Option {client.plan}</div>
          <div className="text-xs text-slate-500">${client.plan === 'A' ? '1,250' : '1,500'} total</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400">Invoice</div>
          <div className={`font-bold ${client.invoice?.status === 'PAID' ? 'text-green-400' : client.invoice?.status === 'OVERDUE' ? 'text-red-400' : 'text-yellow-400'}`}>
            ${(client.invoice?.amount ?? 0).toLocaleString()} — {client.invoice?.status ?? 'N/A'}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400">Agents Run</div>
          <div className="font-bold text-white">{agentsDone}/8</div>
          <div className="text-xs text-slate-500">{client.disputes.length} letters generated</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400">Emails Sent</div>
          <div className="font-bold text-white">{client.emailLog.filter(e => e.status === 'SENT').length}</div>
          <div className="text-xs text-slate-500">of {client.emailLog.length} total</div>
        </div>
      </div>

      {/* Scores */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-6 justify-between">
          <div className="flex gap-6">
            {[
              { bureau: 'Equifax', score: client.creditProfile.currentScores.equifax, color: 'text-red-400' },
              { bureau: 'Experian', score: client.creditProfile.currentScores.experian, color: 'text-blue-400' },
              { bureau: 'TransUnion', score: client.creditProfile.currentScores.transunion, color: 'text-purple-400' },
            ].map(b => (
              <div key={b.bureau} className="text-center">
                <div className={`text-2xl font-bold ${b.color}`}>{b.score ?? '—'}</div>
                <div className="text-xs text-slate-500">{b.bureau}</div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{client.creditProfile.targetScore}</div>
            <div className="text-xs text-slate-500">Target Score</div>
          </div>
          <button onClick={runAgents} disabled={runningAgents}
            className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors">
            {runningAgents ? '⏳ Running All 8 Agents...' : '🤖 Run All 8 Agents'}
          </button>
        </div>
      </div>

      {/* Intake Link */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-400 mb-1">🔗 Client Intake Link (share with client to submit their credit report)</div>
          <div className="text-sm text-blue-400 font-mono truncate">{intakeUrl}</div>
        </div>
        <button onClick={() => navigator.clipboard.writeText(intakeUrl)} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm transition-colors shrink-0">
          📋 Copy Link
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 flex gap-1 overflow-x-auto">
        {([['repair', '⚡ Auto Repair'], ['overview', '📋 Overview'], ['agents', `🤖 Agents (${agentsDone}/8)`], ['emails', `📧 Emails (${client.emailLog.length})`], ['disputes', `⚖️ Letters (${client.disputes.length})`], ['agreement', '📄 Agreement']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={tabCls(t)}>{label}</button>
        ))}
      </div>

      {/* Tab: Auto Repair Engine */}
      {tab === 'repair' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <AutoRepairEngine client={client} onComplete={(updated) => setClient(updated)} />
        </div>
      )}

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4">Pipeline Progress</h3>
            <div className="space-y-3">
              {STAGE_ORDER.map((stage, i) => {
                const done = i <= currentStageIdx;
                const current = i === currentStageIdx;
                const meta = PIPELINE_STAGES[stage];
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${done ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'} ${current ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900' : ''}`}>
                      {done && !current ? '✓' : i + 1}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${current ? 'text-blue-300' : done ? 'text-white' : 'text-slate-500'}`}>{meta.label}</div>
                      <div className="text-xs text-slate-600">{meta.description}</div>
                    </div>
                    {current && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Current</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes + Negative Items Preview */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-3">Notes</h3>
              <p className="text-slate-400 text-sm whitespace-pre-wrap">{client.notes || 'No notes added.'}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-3">Negative Items ({client.creditProfile.negativeItems.length})</h3>
              {client.creditProfile.negativeItems.length === 0
                ? <p className="text-slate-500 text-sm">No negative items entered. Run agents after uploading the credit report.</p>
                : client.creditProfile.negativeItems.slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div>
                      <div className="text-sm text-white">{item.creditor}</div>
                      <div className="text-xs text-slate-500">{item.type.replace(/_/g, ' ')} · {item.bureau}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-400">{'⭐'.repeat(item.impactScore)}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Tab: Agents */}
      {tab === 'agents' && (
        <div className="grid md:grid-cols-3 gap-4">
          {AGENT_ORDER.map(agentId => {
            const meta = AGENT_META[agentId];
            const result = client.agentOutputs[agentId];
            const isSelected = selectedAgent === agentId;
            return (
              <div key={agentId} onClick={() => setSelectedAgent(isSelected ? null : agentId)}
                className={`cursor-pointer bg-slate-900 border rounded-xl p-4 transition-all ${isSelected ? 'border-blue-500 col-span-full' : result ? 'border-slate-700 hover:border-blue-600' : 'border-slate-800 opacity-60'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-white">{meta.title}</div>
                    <div className="text-xs text-slate-500 truncate">{meta.description}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${result?.status === 'COMPLETE' ? 'bg-green-500/20 text-green-400' : result?.status === 'RUNNING' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-500'}`}>
                    {result?.status ?? 'PENDING'}
                  </span>
                </div>
                {isSelected && result && (
                  <div className="mt-4 border-t border-slate-700 pt-4">
                    <div className="prose-crm max-h-[600px] overflow-y-auto scrollbar-thin" dangerouslySetInnerHTML={{ __html: renderMarkdown(result.output) }} />
                    {(result.letters?.length ?? 0) > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {result.letters!.map(l => (
                          <button key={l.id} onClick={(e) => { e.stopPropagation(); printLetter(l.content, `${l.type} – ${l.bureau || l.creditor}`); }}
                            className="bg-blue-700 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg">
                            🖨️ Print {l.bureau || l.creditor} Letter
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {agentsDone === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">
              <div className="text-4xl mb-3">🤖</div>
              <p>No agent outputs yet.</p>
              <button onClick={runAgents} className="mt-4 bg-purple-700 hover:bg-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm">
                Run All 8 Agents Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Emails */}
      {tab === 'emails' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-white">Automated Email Sequence</h3>
          <div className="space-y-3">
            {EMAIL_STAGES.map(stage => {
              const meta = EMAIL_STAGE_META[stage];
              const sent = client.emailLog.find(e => e.stage === stage && e.status === 'SENT');
              const isSending = sendingEmail === stage;
              return (
                <div key={stage} className={`bg-slate-900 border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 ${sent ? 'border-green-800' : 'border-slate-800'}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl shrink-0">{meta.icon}</span>
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-white truncate">{meta.subject}</div>
                      <div className="text-xs text-slate-500">{meta.trigger}</div>
                      {sent && <div className="text-xs text-green-400 mt-0.5">✅ Sent {new Date(sent.sentAt!).toLocaleString()}</div>}
                    </div>
                  </div>
                  <button onClick={() => sendEmail(stage)} disabled={isSending}
                    className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors shrink-0 ${sent ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-blue-700 hover:bg-blue-600 text-white'} disabled:opacity-50`}>
                    {isSending ? '⏳ Sending...' : sent ? '🔁 Resend' : '📤 Send Now'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Email Log */}
          {client.emailLog.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-white mb-3">Email Log</h3>
              <div className="space-y-2">
                {[...client.emailLog].reverse().map(log => (
                  <div key={log.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${log.status === 'SENT' ? 'bg-green-500/20 text-green-400' : log.status === 'FAILED' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {log.status}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{log.subject}</div>
                      <div className="text-xs text-slate-500">{log.sentAt ? new Date(log.sentAt).toLocaleString() : 'Pending'} {log.mailjetMessageId && log.mailjetMessageId !== 'PREVIEW_MODE' ? `· MJ ID: ${log.mailjetMessageId}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Disputes */}
      {tab === 'disputes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">{client.disputes.length} Dispute / Goodwill Letters</h3>
            <div className="flex gap-3">
              {client.disputes.length > 0 && (
                <button onClick={() => {
                  const win = window.open('', '_blank');
                  if (!win) return;
                  win.document.write(`<!DOCTYPE html><html><head><title>All Letters – ${client.firstName} ${client.lastName}</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:40px;line-height:1.6;white-space:pre-wrap;} .page-break { page-break-before: always; }</style></head><body>`);
                  client.disputes.forEach((l, i) => {
                    win.document.write(`<div>${l.content}</div>`);
                    if (i < client.disputes.length - 1) win.document.write('<div class="page-break"></div>');
                  });
                  win.document.write(`</body><script>window.print();</script></html>`);
                  win.document.close();
                }} className="bg-slate-700 hover:bg-slate-600 text-white text-sm px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors">
                  🖨️ Print All
                </button>
              )}
              {client.disputes.length === 0 && (
                <button onClick={runAgents} className="bg-purple-700 hover:bg-purple-600 text-white text-sm px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors">
                  🤖 Generate Letters
                </button>
              )}
            </div>
          </div>
          {client.disputes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-3">⚖️</div>
              <p>No letters generated yet. Run the agents to produce FCRA dispute and goodwill letters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {client.disputes.map(letter => (
                <div key={letter.id} className={`bg-slate-900 border rounded-xl p-4 ${selectedDispute === letter.id ? 'border-blue-500' : 'border-slate-700'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="font-semibold text-white">{letter.type.replace(/_/g, ' ')} — {letter.bureau || letter.creditor}</div>
                      <div className="text-xs text-slate-500">
                        {letter.deadline && `📅 30-Day Deadline: ${new Date(letter.deadline).toLocaleDateString()} · `}
                        Status: <span className={letter.status === 'SENT' ? 'text-green-400' : 'text-yellow-400'}>{letter.status}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedDispute(selectedDispute === letter.id ? null : letter.id)} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-lg">
                        {selectedDispute === letter.id ? '▲ Collapse' : '▼ Preview'}
                      </button>
                      <button onClick={() => printLetter(letter.content, `${letter.type} – ${letter.bureau || letter.creditor}`)} className="bg-blue-700 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg">
                        🖨️ Print
                      </button>
                      <button onClick={() => navigator.clipboard.writeText(letter.content)} className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-lg">
                        📋 Copy
                      </button>
                    </div>
                  </div>
                  {selectedDispute === letter.id && (
                    <pre className="bg-slate-950 rounded-lg p-4 text-xs text-slate-300 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto scrollbar-thin">
                      {letter.content}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Agreement */}
      {tab === 'agreement' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Personal Guarantor & Consulting Agreement</h3>
            <button onClick={printAgreement} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
              🖨️ Print / Download PDF
            </button>
          </div>
          <div className="bg-white rounded-xl overflow-hidden" dangerouslySetInnerHTML={{ __html: buildAgreement(client) }} />
        </div>
      )}
    </div>
  );
}
