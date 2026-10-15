import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  RefreshCw,
  Zap
} from 'lucide-react';

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
      setError('Please paste your full credit report text dump to allow parsing.');
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
      setError(e.message ?? 'An error occurred during submission');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all";
  const labelCls = "block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider";

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="glass-card rounded-3xl p-10 max-w-lg border border-emerald-500/30 shadow-2xl space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white">Credit File Successfully Received</h1>
          <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
            Our autonomous AI engines have ingested your report. Your case strategist is reviewing the Metro 2 dispute package and will reach out with your 90-day trajectory.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 py-12">
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.3 }}
        className="glass-card rounded-3xl p-8 md:p-10 max-w-2xl w-full border border-slate-800 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        {/* Hero Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/30 text-white">
            <Zap className="w-6 h-6 fill-white/20" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Secure Client Intake Portal</h1>
          <p className="text-slate-400 text-xs mt-1">Sumthin3lse Global Solutions · Autonomous Credit Ingestion</p>
        </div>

        <div className="space-y-5 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>First Name</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} placeholder="John" />
            </div>
            <div>
              <label className={labelCls}>Last Name</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} placeholder="Smith" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Credit Report Text Dump *</label>
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs mb-3 leading-relaxed">
              <strong>Instructions:</strong> Open your report on Credit Karma, AnnualCreditReport, or Experian. Press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-indigo-500/30 font-mono text-[10px]">Ctrl+A</kbd> to copy all text, then paste it directly below.
            </div>
            <textarea
              value={reportText}
              onChange={e => setReportText(e.target.value)}
              className={`${inputCls} font-mono text-[11px] h-60 resize-y`}
              placeholder="Paste entire text dump from credit monitoring report here..."
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={submit}
            disabled={submitting || reportText.trim().length < 50}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>{submitting ? 'Enciphering & Ingesting...' : 'Submit Credit File Securely'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
