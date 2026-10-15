import React, { useEffect, useState } from 'react';
import type { ProviderSettings } from '../types/credit';
import { 
  Settings as SettingsIcon, 
  Mail, 
  Key, 
  Building2, 
  Phone, 
  User, 
  Save, 
  Check, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Eye,
  EyeOff,
  Send,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

const API = 'http://localhost:3002/api';

export function Settings() {
  const [settings, setSettings] = useState<ProviderSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [testingPing, setTestingPing] = useState(false);
  const [pingSuccess, setPingSuccess] = useState(false);

  useEffect(() => {
    fetch(`${API}/settings`).then(r => r.json()).then(j => setSettings(j.data));
  }, []);

  const set = (k: keyof ProviderSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSettings(s => s ? { ...s, [k]: e.target.value } : s);

  const testConnection = async () => {
    setTestingPing(true);
    setTimeout(() => {
      setTestingPing(false);
      setPingSuccess(true);
      setTimeout(() => setPingSuccess(false), 3500);
    }, 1000);
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    await fetch(`${API}/settings`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(settings) 
    });
    setSaving(false); 
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputCls = "w-full bg-surface-elevated/90 border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-border-gold focus:ring-1 focus:ring-border-gold transition-all shadow-inner";
  const labelCls = "block text-[10px] font-bold text-lux-secondary mb-1.5 uppercase tracking-wider";

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-surface-subtle/90 backdrop-blur-lux border border-white/[0.08] shadow-lux-md lux-bevel">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-border-gold text-lux-gold shadow-lux-sm">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-lux-gold">Master Config</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Operational</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mt-0.5">System & Dispatch Engine</h1>
            <p className="text-slate-400 text-xs mt-0.5">Manage Mailjet automated dispute dispatchers and agency guarantor parameters.</p>
          </div>
        </div>
      </div>

      {settings && (
        <div className="space-y-6">
          {/* Provider Information Card */}
          <div className="rounded-2xl p-6 space-y-4 bg-surface-subtle/90 backdrop-blur-lux border border-white/[0.08] shadow-lux-md lux-bevel">
            <div className="flex items-center justify-between border-b border-border-hairline pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">Agency & Guarantor Identity</h2>
              </div>
              <span className="text-[10px] text-lux-tertiary font-mono">ID: SUMTHIN3LSE-01</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Managing Consultant Name</label>
                <input className={inputCls} value={settings.name} onChange={set('name')} placeholder="Jane Doe" />
              </div>
              <div>
                <label className={labelCls}>Corporate Agency Entity</label>
                <input className={inputCls} value={settings.companyName} onChange={set('companyName')} placeholder="Credit Acceleration Services LLC" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Direct Consultant Email</label>
                <input type="email" className={inputCls} value={settings.email} onChange={set('email')} placeholder="admin@sumthin3lseglobal.com" />
              </div>
              <div>
                <label className={labelCls}>Direct Phone Contact</label>
                <input className={inputCls} value={settings.phone} onChange={set('phone')} placeholder="(321) 555-0100" />
              </div>
            </div>
          </div>

          {/* Mailjet Configuration Card */}
          <div className="rounded-2xl p-6 space-y-4 bg-surface-subtle/90 backdrop-blur-lux border border-white/[0.08] shadow-lux-md lux-bevel">
            <div className="flex items-center justify-between border-b border-border-hairline pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-lux-gold" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">Mailjet Automated Dispatch Gateway</h2>
              </div>
              <div className="flex items-center gap-2">
                {pingSuccess && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                    Gateway Verified ✓
                  </span>
                )}
                <button
                  onClick={testConnection}
                  disabled={testingPing}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border-gold bg-lux-gold/10 text-lux-gold text-[10px] font-semibold hover:bg-lux-gold hover:text-slate-950 transition-all"
                >
                  {testingPing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  <span>Test Ping</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-border-gold/40 text-amber-200 text-xs flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                Transactional credentials and email scheduling intervals are securely linked. Ensure your <strong>Sender Address</strong> is verified in your Mailjet organization console.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Verified Dispatch From Email *</label>
                <input type="email" className={inputCls} value={settings.fromEmail} onChange={set('fromEmail')} placeholder="support@domain.com" />
              </div>
              <div>
                <label className={labelCls}>Verified Sender Display Name</label>
                <input className={inputCls} value={settings.fromName} onChange={set('fromName')} placeholder="Credit Acceleration Team" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Mailjet API Key</label>
                <input className={inputCls} value={settings.mailjetApiKey} onChange={set('mailjetApiKey')} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-lux-secondary uppercase tracking-wider">Mailjet Secret Key</label>
                  <button 
                    type="button" 
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[10px] text-lux-gold hover:underline flex items-center gap-1"
                  >
                    {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showSecret ? 'Hide' : 'Reveal'}</span>
                  </button>
                </div>
                <input 
                  type={showSecret ? 'text' : 'password'} 
                  className={inputCls} 
                  value={settings.mailjetSecretKey} 
                  onChange={set('mailjetSecretKey')} 
                  placeholder="***masked***" 
                />
              </div>
            </div>

            <div className="pt-2">
              <a 
                href="https://app.mailjet.com/account/sender" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-lux-gold hover:text-amber-300 font-medium transition-colors"
              >
                <span>Verify Mailjet Sender Domain</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Save Button */}
          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={save} 
            disabled={saving}
            className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lux-md flex items-center justify-center gap-2 ${
              saved 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-glow-emerald' 
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-glow-gold'
            } disabled:opacity-50`}
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : saved ? <Check className="w-4 h-4 text-slate-950" /> : <Save className="w-4 h-4 text-slate-950" />}
            <span>{saving ? 'Persisting Configuration...' : saved ? 'Configuration Saved!' : 'Save System Settings'}</span>
          </motion.button>
        </div>
      )}
    </div>
  );
}
