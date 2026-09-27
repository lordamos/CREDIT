import React, { useState } from 'react';
import type { Page } from '../App';

const API = 'http://localhost:3002/api';

interface Props { navigate: (p: Page) => void; }

const STEPS = ['Client Info', 'Business & Plan', 'Credit Profile', 'Review & Sign'];

export function NewClient({ navigate }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    // Step 1
    firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '', zip: '',
    // Step 2
    companyName: '', ein: '', businessType: '', plan: 'A' as 'A' | 'B',
    // Step 3
    equifax: '', experian: '', transunion: '', targetScore: '750', reportText: '',
    notes: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const canNext = () => {
    if (step === 0) return form.firstName && form.lastName && form.email && form.phone;
    if (step === 1) return form.companyName && form.plan;
    return true;
  };

  const submit = async () => {
    setLoading(true); setError('');
    try {
      const payload = {
        ...form,
        creditProfile: {
          currentScores: {
            equifax: form.equifax ? parseInt(form.equifax) : undefined,
            experian: form.experian ? parseInt(form.experian) : undefined,
            transunion: form.transunion ? parseInt(form.transunion) : undefined,
          },
          targetScore: parseInt(form.targetScore) || 750,
          reportText: form.reportText,
          negativeItems: [],
          debtAccounts: [],
        },
      };
      const res = await fetch(`${API}/clients`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      navigate({ name: 'client', id: json.data.id });
    } catch (e: any) {
      setError(e.message ?? 'Failed to create client');
    } finally { setLoading(false); }
  };

  const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500";
  const labelCls = "block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide";

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => navigate({ name: 'dashboard' })} className="text-slate-500 hover:text-white text-sm mb-4 flex items-center gap-1">← Back to Dashboard</button>
        <h1 className="text-2xl font-bold text-white">➕ New Client Onboarding</h1>
        <p className="text-slate-400 text-sm mt-1">Complete all steps to activate the client and send the welcome email.</p>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 text-sm font-medium ${i === step ? 'text-blue-400' : i < step ? 'text-green-400' : 'text-slate-600'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === step ? 'bg-blue-600 text-white' : i < step ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {i < step ? '✓' : i + 1}
              </span>
              <span className="hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-green-600' : 'bg-slate-800'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        {/* Step 0: Contact Info */}
        {step === 0 && (
          <>
            <h2 className="text-lg font-semibold text-white">Client Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>First Name *</label><input className={inputCls} placeholder="John" value={form.firstName} onChange={set('firstName')} /></div>
              <div><label className={labelCls}>Last Name *</label><input className={inputCls} placeholder="Smith" value={form.lastName} onChange={set('lastName')} /></div>
            </div>
            <div><label className={labelCls}>Email Address *</label><input type="email" className={inputCls} placeholder="john@company.com" value={form.email} onChange={set('email')} /></div>
            <div><label className={labelCls}>Phone Number *</label><input className={inputCls} placeholder="(321) 555-0100" value={form.phone} onChange={set('phone')} /></div>
            <div><label className={labelCls}>Street Address</label><input className={inputCls} placeholder="123 Main Street" value={form.address} onChange={set('address')} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelCls}>City</label><input className={inputCls} placeholder="Orlando" value={form.city} onChange={set('city')} /></div>
              <div><label className={labelCls}>State</label><input className={inputCls} placeholder="FL" value={form.state} onChange={set('state')} /></div>
              <div><label className={labelCls}>ZIP</label><input className={inputCls} placeholder="32801" value={form.zip} onChange={set('zip')} /></div>
            </div>
          </>
        )}

        {/* Step 1: Business & Plan */}
        {step === 1 && (
          <>
            <h2 className="text-lg font-semibold text-white">Business Information & Plan Selection</h2>
            <div><label className={labelCls}>Company / Business Name *</label><input className={inputCls} placeholder="Smith Enterprises LLC" value={form.companyName} onChange={set('companyName')} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>EIN (optional)</label><input className={inputCls} placeholder="XX-XXXXXXX" value={form.ein} onChange={set('ein')} /></div>
              <div><label className={labelCls}>Business Type</label>
                <select className={inputCls} value={form.businessType} onChange={set('businessType')}>
                  <option value="">Select...</option>
                  <option value="LLC">LLC</option>
                  <option value="S-Corp">S-Corp</option>
                  <option value="C-Corp">C-Corp</option>
                  <option value="Sole Prop">Sole Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Pricing Plan *</label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {(['A', 'B'] as const).map(plan => (
                  <button key={plan} onClick={() => setForm(f => ({ ...f, plan }))}
                    className={`p-4 rounded-xl border-2 text-left transition-colors ${form.plan === plan ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                    <div className="font-bold text-white text-sm">Option {plan}</div>
                    {plan === 'A'
                      ? <><div className="text-blue-400 font-semibold mt-1">$250 Upfront + $1,000 on Approval</div><div className="text-slate-400 text-xs mt-1">Total: $1,250 · Standard Plan</div></>
                      : <><div className="text-purple-400 font-semibold mt-1">$0 Upfront + $1,500 on Approval</div><div className="text-slate-400 text-xs mt-1">Total: $1,500 · Deferred Plan</div></>}
                  </button>
                ))}
              </div>
            </div>
            <div><label className={labelCls}>Internal Notes</label><textarea className={`${inputCls} h-20 resize-none`} placeholder="Any special instructions or notes about this client..." value={form.notes} onChange={set('notes')} /></div>
          </>
        )}

        {/* Step 2: Credit Profile */}
        {step === 2 && (
          <>
            <h2 className="text-lg font-semibold text-white">Credit Profile (Optional — Add Now or Later)</h2>
            <p className="text-slate-400 text-sm">You can add this now, or the client can submit it through their personal intake link after signing.</p>
            <div className="grid grid-cols-3 gap-4">
              <div><label className={labelCls}>Equifax Score</label><input type="number" className={inputCls} placeholder="620" value={form.equifax} onChange={set('equifax')} /></div>
              <div><label className={labelCls}>Experian Score</label><input type="number" className={inputCls} placeholder="615" value={form.experian} onChange={set('experian')} /></div>
              <div><label className={labelCls}>TransUnion Score</label><input type="number" className={inputCls} placeholder="608" value={form.transunion} onChange={set('transunion')} /></div>
            </div>
            <div><label className={labelCls}>Target Score</label><input type="number" className={inputCls} placeholder="750" value={form.targetScore} onChange={set('targetScore')} /></div>
            <div><label className={labelCls}>Paste Credit Report Text (optional)</label>
              <textarea className={`${inputCls} h-40 resize-y font-mono text-xs`}
                placeholder="Paste credit report text here... (negative items, account details, etc.)" value={form.reportText} onChange={set('reportText')} />
            </div>
          </>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <>
            <h2 className="text-lg font-semibold text-white">Review & Activate Client</h2>
            <div className="space-y-3 text-sm">
              {[
                ['Client', `${form.firstName} ${form.lastName}`],
                ['Email', form.email],
                ['Phone', form.phone],
                ['Company', form.companyName || '—'],
                ['Plan', form.plan === 'A' ? 'Option A — $250 Upfront + $1,000 on Approval' : 'Option B — $0 Upfront + $1,500 on Approval'],
                ['Scores', [form.equifax && `EQ: ${form.equifax}`, form.experian && `EX: ${form.experian}`, form.transunion && `TU: ${form.transunion}`].filter(Boolean).join(' · ') || 'Not entered'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-4 py-2 border-b border-slate-800">
                  <span className="text-slate-400 shrink-0">{k}</span>
                  <span className="text-white text-right">{v}</span>
                </div>
              ))}
            </div>
            <div className="bg-blue-950 border border-blue-800 rounded-lg p-4 mt-4">
              <p className="text-blue-300 text-sm">✅ <strong>On activation:</strong></p>
              <ul className="text-blue-200 text-xs mt-2 space-y-1 list-disc pl-4">
                <li>Client record will be created and set to "New" stage</li>
                <li>Welcome email will be sent via Mailjet immediately</li>
                <li>Unique client intake link will be generated</li>
                <li>Automated email sequence will arm based on pipeline triggers</li>
                <li>You will be redirected to the client's full profile</li>
              </ul>
            </div>
            {error && <div className="bg-red-950 border border-red-700 rounded-lg p-3 text-red-300 text-sm">⚠️ {error}</div>}
          </>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
          className="px-4 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-40 transition-colors">
          ← Back
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors">
            Continue →
          </button>
        ) : (
          <button onClick={submit} disabled={loading}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-2">
            {loading ? '⏳ Activating...' : '⚡ Activate Client & Send Welcome Email'}
          </button>
        )}
      </div>
    </div>
  );
}
