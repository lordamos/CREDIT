import React, { useState } from 'react';
import type { Page } from '../App';
import { 
  ArrowLeft, 
  Check, 
  User, 
  Building2, 
  CreditCard, 
  FileCheck, 
  Sparkles,
  ShieldAlert,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API = 'http://localhost:3002/api';

interface Props { navigate: (p: Page) => void; }

const STEPS = [
  { label: 'Client Identity', icon: User },
  { label: 'Business & Plan', icon: Building2 },
  { label: 'Credit Profile', icon: CreditCard },
  { label: 'Finalize & Onboard', icon: FileCheck },
];

export function NewClient({ navigate }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '', city: '', state: '', zip: '',
    companyName: '', ein: '', businessType: '', plan: 'A' as 'A' | 'B',
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
      const res = await fetch(`${API}/clients`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      navigate({ name: 'client', id: json.data.id });
    } catch (e: any) {
      setError(e.message ?? 'Failed to create client');
    } finally { setLoading(false); }
  };

  const inputCls = "w-full bg-surface-elevated/90 border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-border-gold focus:ring-1 focus:ring-border-gold transition-all shadow-inner";
  const labelCls = "block text-[10px] font-bold text-lux-secondary mb-1.5 uppercase tracking-wider";

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <motion.button 
          whileHover={{ x: -3 }}
          onClick={() => navigate({ name: 'dashboard' })} 
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-semibold mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-lux-gold" />
          <span>Back to Operations Dashboard</span>
        </motion.button>
        
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-border-gold text-lux-gold shadow-lux-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-lux-gold">Intake Protocol</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">FCRA § 609 Docket</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mt-0.5">Guarantor Intake Engine</h1>
          </div>
        </div>
        <p className="text-slate-400 text-xs mt-1">Register new commercial guarantor profile into autonomous tri-merge audit & dispute pipeline.</p>
      </div>

      {/* Modern Executive Stepper */}
      <div className="p-4 rounded-2xl mb-8 bg-surface-subtle/90 backdrop-blur-lux border border-white/[0.08] shadow-lux-md lux-bevel">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isCompleted = i < step;
            const isCurrent = i === step;
            return (
              <React.Fragment key={s.label}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrent 
                      ? 'bg-gradient-to-tr from-amber-500 via-amber-600 to-indigo-600 text-slate-950 font-black shadow-glow-gold' 
                      : isCompleted 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-surface-elevated border border-white/[0.06] text-slate-500'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Stage 0{i + 1}</div>
                    <div className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-slate-400'}`}>{s.label}</div>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 rounded-full transition-colors ${
                    i < step ? 'bg-gradient-to-r from-emerald-500 via-amber-500 to-indigo-500' : 'bg-surface-elevated'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Container Card */}
      <div className="rounded-2xl p-6 md:p-8 space-y-6 bg-surface-subtle/90 backdrop-blur-lux border border-white/[0.08] shadow-lux-lg lux-bevel">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
          >
            {/* Step 0: Contact Info */}
            {step === 0 && (
              <>
                <div className="border-b border-border-hairline pb-4 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-lux-gold">Stage 01</span>
                  <h2 className="text-base font-bold text-white tracking-wide mt-0.5">Personal Identity & Guarantor Record</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Mandatory identity fields for FCRA § 609 certified dispute dispatch.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Legal First Name *</label>
                    <input className={inputCls} placeholder="John" value={form.firstName} onChange={set('firstName')} />
                  </div>
                  <div>
                    <label className={labelCls}>Legal Last Name *</label>
                    <input className={inputCls} placeholder="Smith" value={form.lastName} onChange={set('lastName')} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Direct Email Address *</label>
                    <input type="email" className={inputCls} placeholder="john@domain.com" value={form.email} onChange={set('email')} />
                  </div>
                  <div>
                    <label className={labelCls}>Guarantor Phone *</label>
                    <input className={inputCls} placeholder="(321) 555-0100" value={form.phone} onChange={set('phone')} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Residential Street Address</label>
                  <input className={inputCls} placeholder="123 Ocean Palm Drive" value={form.address} onChange={set('address')} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>City</label>
                    <input className={inputCls} placeholder="Palm Bay" value={form.city} onChange={set('city')} />
                  </div>
                  <div>
                    <label className={labelCls}>State</label>
                    <input className={inputCls} placeholder="FL" value={form.state} onChange={set('state')} />
                  </div>
                  <div>
                    <label className={labelCls}>ZIP Code</label>
                    <input className={inputCls} placeholder="32905" value={form.zip} onChange={set('zip')} />
                  </div>
                </div>
              </>
            )}

            {/* Step 1: Business & Program Plan */}
            {step === 1 && (
              <>
                <div className="border-b border-border-hairline pb-4 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-lux-gold">Stage 02</span>
                  <h2 className="text-base font-bold text-white tracking-wide mt-0.5">Commercial Entity & Underwriting Tier</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Associated business entity and service agreement compensation schedule.</p>
                </div>

                <div>
                  <label className={labelCls}>Commercial Entity Name *</label>
                  <input className={inputCls} placeholder="Apex Ventures LLC" value={form.companyName} onChange={set('companyName')} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Federal EIN</label>
                    <input className={inputCls} placeholder="XX-XXXXXXX" value={form.ein} onChange={set('ein')} />
                  </div>
                  <div>
                    <label className={labelCls}>Entity Structure</label>
                    <select className={inputCls} value={form.businessType} onChange={set('businessType')}>
                      <option value="" className="bg-[#12121A]">Select Structure</option>
                      <option value="LLC" className="bg-[#12121A]">Limited Liability Company (LLC)</option>
                      <option value="C-Corp" className="bg-[#12121A]">C-Corporation</option>
                      <option value="S-Corp" className="bg-[#12121A]">S-Corporation</option>
                      <option value="Sole Proprietor" className="bg-[#12121A]">Sole Proprietorship</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Engagement Plan Tier *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, plan: 'A' }))}
                      className={`p-5 rounded-2xl text-left border transition-all ${
                        form.plan === 'A'
                          ? 'border-border-gold bg-amber-500/10 shadow-glow-gold'
                          : 'border-white/[0.08] bg-surface-elevated/70 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-white">Tier A: Standard Retainer</span>
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-lux-gold border border-border-gold">$1,250 Total</span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-2 font-medium">$250 Initial Retainer + $1,000 on First Facility Approval</div>
                      <div className="text-[10px] text-lux-tertiary mt-1">Recommended for expedited 30-day bureaus</div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, plan: 'B' }))}
                      className={`p-5 rounded-2xl text-left border transition-all ${
                        form.plan === 'B'
                          ? 'border-indigo-500 bg-indigo-500/15 shadow-glow-indigo'
                          : 'border-white/[0.08] bg-surface-elevated/70 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-white">Tier B: Deferred Success</span>
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">$1,500 Total</span>
                      </div>
                      <div className="text-[11px] text-slate-300 mt-2 font-medium">$0 Upfront Retainer + $1,500 100% Deferred on Approval</div>
                      <div className="text-[10px] text-lux-tertiary mt-1">Performance-contingent acceleration</div>
                    </motion.button>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Tri-Merge Credit Profile */}
            {step === 2 && (
              <>
                <div className="border-b border-border-hairline pb-4 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-lux-gold">Stage 03</span>
                  <h2 className="text-base font-bold text-white tracking-wide mt-0.5">Tri-Merge Bureau Audit Input</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Input starting bureau scores and raw report string for autonomous regex extraction.</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-surface-elevated/80 border border-white/[0.06]">
                    <label className={labelCls}>Equifax (EFX)</label>
                    <input type="number" className={inputCls} placeholder="640" value={form.equifax} onChange={set('equifax')} />
                  </div>
                  <div className="p-3 rounded-xl bg-surface-elevated/80 border border-white/[0.06]">
                    <label className={labelCls}>Experian (EXP)</label>
                    <input type="number" className={inputCls} placeholder="655" value={form.experian} onChange={set('experian')} />
                  </div>
                  <div className="p-3 rounded-xl bg-surface-elevated/80 border border-white/[0.06]">
                    <label className={labelCls}>TransUnion (TU)</label>
                    <input type="number" className={inputCls} placeholder="635" value={form.transunion} onChange={set('transunion')} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Raw Tri-Merge Report Text (IdentityIQ / SmartCredit / Experian dump)</label>
                  <textarea 
                    rows={5} 
                    className={`${inputCls} font-mono text-[11px]`} 
                    placeholder="Paste entire text dump from credit monitoring report here. Autonomous regex engine will extract collections, charge-offs, late marks, and inquiries automatically." 
                    value={form.reportText} 
                    onChange={set('reportText')} 
                  />
                </div>
              </>
            )}

            {/* Step 3: Review & Activate */}
            {step === 3 && (
              <>
                <div className="border-b border-border-hairline pb-4 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-lux-gold">Stage 04</span>
                  <h2 className="text-base font-bold text-white tracking-wide mt-0.5">Executive Underwriting Brief</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Verify guarantor identity parameters prior to database commitment and contract issuance.</p>
                </div>

                <div className="p-5 rounded-2xl bg-surface-elevated/90 border border-border-gold shadow-lux-sm space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-border-hairline">
                    <span className="text-lux-secondary">Guarantor Principal:</span>
                    <span className="font-bold text-white">{form.firstName} {form.lastName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border-hairline">
                    <span className="text-lux-secondary">Corporate Entity:</span>
                    <span className="font-bold text-lux-gold">{form.companyName || 'Private Asset File'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border-hairline">
                    <span className="text-lux-secondary">Verified Email:</span>
                    <span className="font-bold text-white font-mono">{form.email}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border-hairline">
                    <span className="text-lux-secondary">Underwriting Agreement:</span>
                    <span className="font-bold text-lux-gold">Tier {form.plan} ({form.plan === 'A' ? '$1,250 Retainer Accord' : '$1,500 Performance Accord'})</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-lux-secondary">Bureau Baseline:</span>
                    <span className="font-bold text-emerald-400 font-mono">EQ: {form.equifax || 'Pending'} · EX: {form.experian || 'Pending'} · TU: {form.transunion || 'Pending'}</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border-hairline">
          {step > 0 ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-2.5 rounded-xl bg-surface-elevated border border-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold transition-all hover:bg-slate-800"
            >
              Previous Stage
            </motion.button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={!canNext()}
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold shadow-lux-md shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Continue Stage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={loading}
              onClick={submit}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-black shadow-glow-emerald transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Sparkles className="w-4 h-4 text-slate-950" />}
              <span>Commit & Launch File</span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
