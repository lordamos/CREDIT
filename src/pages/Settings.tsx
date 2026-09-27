import React, { useEffect, useState } from 'react';
import type { ProviderSettings } from '../types/credit';

const API = 'http://localhost:3002/api';

export function Settings() {
  const [settings, setSettings] = useState<ProviderSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API}/settings`).then(r => r.json()).then(j => setSettings(j.data));
  }, []);

  const set = (k: keyof ProviderSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSettings(s => s ? { ...s, [k]: e.target.value } : s);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    await fetch(`${API}/settings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500";
  const labelCls = "block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide";

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">⚙️ Provider Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure your Mailjet email credentials and provider contact info.</p>
      </div>

      {settings && (
        <>
          {/* Provider Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Provider Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Your Name</label><input className={inputCls} value={settings.name} onChange={set('name')} placeholder="Jane Doe" /></div>
              <div><label className={labelCls}>Company Name</label><input className={inputCls} value={settings.companyName} onChange={set('companyName')} placeholder="Credit Acceleration Services" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Your Email</label><input type="email" className={inputCls} value={settings.email} onChange={set('email')} placeholder="you@yourcompany.com" /></div>
              <div><label className={labelCls}>Phone</label><input className={inputCls} value={settings.phone} onChange={set('phone')} placeholder="(321) 555-0100" /></div>
            </div>
          </div>

          {/* Mailjet Config */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">📧 Mailjet Email Configuration</h2>
            <div className="bg-blue-950 border border-blue-800 rounded-lg p-3 text-blue-300 text-xs">
              ✅ Your Mailjet API key is pre-configured. Enter your <strong>From Email</strong> (must be verified in Mailjet) to enable sending.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>From Email *</label><input type="email" className={inputCls} value={settings.fromEmail} onChange={set('fromEmail')} placeholder="support@yourdomain.com" /></div>
              <div><label className={labelCls}>From Name</label><input className={inputCls} value={settings.fromName} onChange={set('fromName')} placeholder="Credit Acceleration Team" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Mailjet API Key</label><input className={inputCls} value={settings.mailjetApiKey} onChange={set('mailjetApiKey')} /></div>
              <div><label className={labelCls}>Mailjet Secret Key</label><input type="password" className={inputCls} value={settings.mailjetSecretKey} onChange={set('mailjetSecretKey')} placeholder="***masked***" /></div>
            </div>
            <p className="text-xs text-slate-500">
              ⚠️ Your "From Email" must be verified as a Sender Domain or Sender Address in your Mailjet account. Go to <a href="https://app.mailjet.com/account/sender" target="_blank" className="text-blue-400 underline">app.mailjet.com/account/sender</a> to verify.
            </p>
          </div>

          {/* Save */}
          <button onClick={save} disabled={saving}
            className={`w-full py-3 rounded-xl font-bold text-white text-sm transition-colors ${saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-500'} disabled:opacity-50`}>
            {saving ? '⏳ Saving...' : saved ? '✅ Settings Saved!' : '💾 Save Settings'}
          </button>
        </>
      )}
    </div>
  );
}
