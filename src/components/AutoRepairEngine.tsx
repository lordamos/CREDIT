import React, { useState } from 'react';
import type { Client } from '../types/credit';

const API = 'http://localhost:3002/api';

interface Props {
  client: Client;
  onComplete: (updatedClient: Client) => void;
}

interface ParseSummary {
  scoresFound: number;
  negativeItems: number;
  debtAccounts: number;
  inquiries: number;
  lettersGenerated: number;
  agentsCompleted: number;
}

type Step = 'PASTE' | 'PROCESSING' | 'RESULTS';

export function AutoRepairEngine({ client, onComplete }: Props) {
  const [step, setStep] = useState<Step>('PASTE');
  const [reportText, setReportText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [summary, setSummary] = useState<ParseSummary | null>(null);
  const [parseNotes, setParseNotes] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleRun = async () => {
    if (reportText.trim().length < 50) {
      setError('Please paste the full credit report text (at least a few paragraphs).');
      return;
    }
    setError('');
    setProcessing(true);
    setStep('PROCESSING');

    try {
      const res = await fetch(`${API}/clients/${client.id}/parse-and-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportText }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Parse failed');

      setSummary(json.data.summary);
      setParseNotes(json.data.parseNotes ?? []);
      setStep('RESULTS');
      onComplete(json.data.client);
    } catch (e: any) {
      setError(e.message ?? 'An error occurred');
      setStep('PASTE');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-xl">🤖</div>
        <div>
          <h2 className="text-lg font-bold text-white">Automated Credit Repair Engine</h2>
          <p className="text-slate-400 text-sm">Paste the credit report → AI parses → 8 agents run → letters generated. Zero manual work.</p>
        </div>
      </div>

      {/* Flow diagram */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { icon: '📋', label: 'Paste Report' },
          { icon: '🔍', label: 'AI Parses' },
          { icon: '🤖', label: '8 Agents Run' },
          { icon: '⚖️', label: 'Letters Generated' },
          { icon: '📬', label: 'Ready to Mail' },
        ].map((item, i, arr) => (
          <React.Fragment key={item.label}>
            <div className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium shrink-0 ${
              step === 'PASTE' && i === 0 ? 'bg-blue-600 text-white' :
              step === 'PROCESSING' && i <= 2 ? 'bg-purple-600 text-white' :
              step === 'RESULTS' ? 'bg-green-700 text-white' :
              'bg-slate-800 text-slate-500'
            }`}>
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </div>
            {i < arr.length - 1 && <span className="text-slate-600 shrink-0">→</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Step: PASTE */}
      {step === 'PASTE' && (
        <div className="space-y-4">
          <div className="bg-blue-950 border border-blue-800 rounded-xl p-4">
            <h3 className="text-blue-300 font-semibold text-sm mb-2">📋 How to get your credit report text:</h3>
            <div className="space-y-1 text-xs text-blue-200">
              <p><strong>Credit Karma:</strong> Go to creditkarma.com → Credit Reports → Click each bureau → Select All text (Ctrl+A) → Copy → Paste below</p>
              <p><strong>AnnualCreditReport.com:</strong> Open your report → Ctrl+A → Ctrl+C → Paste below</p>
              <p><strong>Experian/Equifax/TransUnion app:</strong> Export or copy the report text and paste below</p>
              <p><strong>IdentityIQ / SmartCredit:</strong> Copy the full report page text and paste below</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
              Paste Full Credit Report Here *
            </label>
            <textarea
              value={reportText}
              onChange={e => setReportText(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono resize-y h-56"
              placeholder={`Paste the full text of the credit report here...\n\nExample:\nEquifax Credit Score: 612\nExperian: 605 | TransUnion: 618\n\nMidland Credit Management\nStatus: In Collections\nBalance: $2,450\nDate: 03/2022\nBureau: Equifax\n\nCapital One Auto Finance\nStatus: Charge-Off\nBalance: $8,200\n...(continue pasting the rest of the report)`}
            />
            <p className="text-slate-600 text-xs mt-1">{reportText.length.toLocaleString()} characters pasted{reportText.length > 500 ? ' ✅' : ' (paste more for best results)'}</p>
          </div>

          {error && (
            <div className="bg-red-950 border border-red-700 rounded-lg p-3 text-red-300 text-sm">⚠️ {error}</div>
          )}

          <button
            onClick={handleRun}
            disabled={reportText.trim().length < 50}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3">
            <span className="text-2xl">⚡</span>
            Launch Full Automation — Parse Report + Run All 8 Agents
          </button>
        </div>
      )}

      {/* Step: PROCESSING */}
      {step === 'PROCESSING' && (
        <div className="bg-slate-900 border border-purple-800 rounded-xl p-8 text-center space-y-6">
          <div className="text-6xl animate-pulse">⚡</div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Running Full Automation...</h3>
            <p className="text-slate-400 text-sm">This takes 5–15 seconds. Do not close this tab.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-left">
            {[
              { icon: '🔍', label: 'Parsing credit report...', done: true },
              { icon: '📊', label: 'Extracting negative items...', done: true },
              { icon: '🤖', label: 'Running 8 specialist agents...', done: false },
              { icon: '⚖️', label: 'Generating dispute letters...', done: false },
              { icon: '🤝', label: 'Drafting goodwill letters...', done: false },
              { icon: '📈', label: 'Building credit roadmap...', done: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span>{item.icon}</span>
                <span className={item.done ? 'text-green-400' : 'text-slate-400 animate-pulse'}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step: RESULTS */}
      {step === 'RESULTS' && summary && (
        <div className="space-y-4">
          {/* Success banner */}
          <div className="bg-green-950 border border-green-700 rounded-xl p-5 text-center">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="text-xl font-bold text-green-300">Full Automation Complete!</h3>
            <p className="text-green-400 text-sm mt-1">All 8 agents finished. Your dispute package is ready.</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Bureaus Found', value: summary.scoresFound, icon: '📊', color: 'text-blue-400' },
              { label: 'Negative Items', value: summary.negativeItems, icon: '⚠️', color: 'text-red-400' },
              { label: 'Debt Accounts', value: summary.debtAccounts, icon: '💳', color: 'text-yellow-400' },
              { label: 'Hard Inquiries', value: summary.inquiries, icon: '🔍', color: 'text-orange-400' },
              { label: 'Letters Generated', value: summary.lettersGenerated, icon: '⚖️', color: 'text-purple-400' },
              { label: 'Agents Completed', value: `${summary.agentsCompleted}/8`, icon: '🤖', color: 'text-green-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-center">
                <div className="text-xl">{stat.icon}</div>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Parse notes */}
          {parseNotes.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">🔬 Parser Notes</h4>
              <ul className="space-y-1">
                {parseNotes.map((note, i) => (
                  <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">•</span>{note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next steps */}
          <div className="bg-blue-950 border border-blue-800 rounded-xl p-4 space-y-2">
            <h4 className="text-blue-300 font-semibold text-sm">🎯 Next Steps</h4>
            <div className="space-y-1 text-xs text-blue-200">
              <p>1. 🔍 Click the <strong>Agents</strong> tab to review the full audit and 90-day roadmap</p>
              <p>2. ⚖️ Click the <strong>Letters</strong> tab to preview and print your dispute letters</p>
              <p>3. 🖨️ Print each letter and mail via USPS Certified Mail with Return Receipt</p>
              <p>4. 📅 Mark your calendar 30 days from mailing — bureaus must respond by then</p>
              <p>5. 💳 Execute the AZEO utilization strategy NOW for an immediate score boost</p>
            </div>
          </div>

          <button
            onClick={() => setStep('PASTE')}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors">
            🔄 Re-run with Updated Report
          </button>
        </div>
      )}
    </div>
  );
}
