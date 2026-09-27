import React, { useState } from 'react';
import { motion } from 'framer-motion';

const API = 'http://localhost:3002/api';

interface Props { token: string }

export function IntakeForm({ token }: Props) {
  const [reportText, setReportText] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!reportText || reportText.trim().length < 50) {
      setError('Please paste your full credit report text.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API}/clients/intake/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportText, firstName, lastName }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Submission failed');
      setSuccess(true);
    } catch (e: any) {
      setError(e.message ?? 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-green-800 rounded-2xl p-10 max-w-lg shadow-xl shadow-black/40">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-green-400 mb-2">Credit Report Received</h1>
          <p className="text-slate-400">Our automated system is analyzing your file right now. Your strategist will contact you shortly with your personalized action plan.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-2xl w-full shadow-xl shadow-black/40">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-blue-500/20">⚡</div>
          <h1 className="text-2xl font-bold text-white mb-2">Secure Client Intake</h1>
          <p className="text-slate-400 text-sm">Please provide your details and paste your credit report below.</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">First Name (Optional)</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" placeholder="John" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Last Name (Optional)</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" placeholder="Smith" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Paste Credit Report Text *</label>
            <div className="bg-blue-950/50 border border-blue-900/50 rounded-lg p-3 mb-3 text-blue-200 text-xs leading-relaxed">
              <strong>Instructions:</strong> Go to Credit Karma, AnnualCreditReport, Experian, etc. Press <code>Ctrl+A</code> to select everything, then <code>Ctrl+C</code> to copy. Come back here and press <code>Ctrl+V</code> to paste.
            </div>
            <textarea
              value={reportText}
              onChange={e => setReportText(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono resize-y h-64"
              placeholder="Paste your full credit report text here..."
            />
          </div>

          {error && <div className="bg-red-950 border border-red-700 rounded-lg p-3 text-red-300 text-sm">⚠️ {error}</div>}

          <button
            onClick={submit}
            disabled={submitting || reportText.trim().length < 50}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {submitting ? '⏳ Submitting securely...' : '🔒 Submit Securely'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
