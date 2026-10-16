import React, { useState, useEffect } from 'react';
import { Dashboard } from './pages/Dashboard';
import { ClientDetail } from './pages/ClientDetail';
import { NewClient } from './pages/NewClient';
import { Settings } from './pages/Settings';
import { IntakeForm } from './pages/IntakeForm';
import { CovenantOfTransparency } from './components/CovenantOfTransparency';
import { 
  LayoutDashboard, 
  UserPlus, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Sparkles,
  Zap,
  Activity,
  Layers,
  Search,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type Page =
  | { name: 'dashboard' }
  | { name: 'client'; id: string }
  | { name: 'new-client' }
  | { name: 'settings' }
  | { name: 'covenant' }
  | { name: 'intake'; token: string };

export default function App() {
  const [page, setPage] = useState<Page>({ name: 'dashboard' });

  // Simple hash-based routing
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/client/')) {
        setPage({ name: 'client', id: hash.replace('#/client/', '') });
      } else if (hash.startsWith('#/intake/')) {
        setPage({ name: 'intake', token: hash.replace('#/intake/', '') });
      } else if (hash === '#/new') {
        setPage({ name: 'new-client' });
      } else if (hash === '#/settings') {
        setPage({ name: 'settings' });
      } else if (hash === '#/covenant') {
        setPage({ name: 'covenant' });
      } else {
        setPage({ name: 'dashboard' });
      }
    };
    window.addEventListener('hashchange', onHash);
    onHash();
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (p: Page) => {
    if (p.name === 'dashboard') window.location.hash = '#/';
    else if (p.name === 'client') window.location.hash = `#/client/${p.id}`;
    else if (p.name === 'new-client') window.location.hash = '#/new';
    else if (p.name === 'settings') window.location.hash = '#/settings';
    else if (p.name === 'covenant') window.location.hash = '#/covenant';
    setPage(p);
  };

  // Intake route doesn't get the global nav
  if (page.name === 'intake') {
    return <IntakeForm token={page.token} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
    { id: 'new-client', label: 'Client Intake', icon: UserPlus },
    { id: 'covenant', label: 'Covenant of Transparency', icon: Compass },
    { id: 'settings', label: 'Engine Config', icon: SettingsIcon },
  ];

  return (
    <div className="relative min-h-screen bg-[#08080A] text-slate-100 selection:bg-amber-500/20 selection:text-amber-200 overflow-x-hidden flex flex-col">
      {/* Dynamic Ambient Background Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-500/[0.07] via-indigo-600/[0.04] to-transparent blur-[120px]" />
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full bg-gradient-to-bl from-indigo-500/[0.05] via-violet-600/[0.03] to-transparent blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[700px] h-[400px] rounded-full bg-gradient-to-t from-emerald-500/[0.03] to-transparent blur-[140px]" />
      </div>

      {/* Premium Glass Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-[#0E0E14]/80 backdrop-blur-lux border-b border-white/[0.08] px-4 md:px-8 py-3 transition-all shadow-lux-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand & Subtitle */}
          <button 
            onClick={() => navigate({ name: 'dashboard' })} 
            className="flex items-center gap-3.5 group text-left focus:outline-none shrink-0"
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/80 via-indigo-600 to-violet-600 p-[1px] shadow-lg shadow-amber-500/10 group-hover:shadow-amber-500/25 transition-all duration-300 group-hover:scale-105 flex items-center justify-center">
              <div className="w-full h-full bg-[#0b0b10] rounded-[11px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20 group-hover:text-amber-300 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-amber-200 transition-colors">
                  TrueBuild
                </span>
                <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest rounded-full bg-amber-500/15 text-[#d9b779] border border-amber-500/30">
                  EXECUTIVE SUITE
                </span>
              </div>
              <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Sumthin3lse Global · Personal Credit CRM</span>
              </div>
            </div>
          </button>

          {/* Navigation Action Buttons with Framer Motion spring indicator */}
          <div className="flex items-center gap-1 bg-[#12121A]/80 p-1.5 rounded-2xl border border-white/[0.08] backdrop-blur-md shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = page.name === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate({ name: item.id as any })}
                  className={`relative px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-indigo-600/30 to-violet-600/25 border border-amber-500/40 rounded-xl shadow-lux-sm"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Status Pill & Fast Action */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate({ name: 'covenant' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-indigo-600/15 to-amber-500/10 hover:from-amber-500/25 hover:to-indigo-600/25 border border-amber-500/30 text-[11px] font-bold text-amber-300 transition-all shadow-lux-sm hover:scale-105"
              title="Open The Covenant of Transparency"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>The Covenant</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-subtle/80 border border-white/[0.06] text-[11px] text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>FCRA Telemetry Active</span>
            </div>
          </div>

        </div>
      </nav>

      {/* Main Content Viewport with Staggered View Transitions */}
      <main className="relative z-10 flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={page.name + (page.name === 'client' ? page.id : '')}
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            {page.name === 'dashboard' && <Dashboard navigate={navigate} />}
            {page.name === 'client' && <ClientDetail clientId={page.id} navigate={navigate} />}
            {page.name === 'new-client' && <NewClient navigate={navigate} />}
            {page.name === 'settings' && <Settings />}
            {page.name === 'covenant' && (
              <div className="max-w-6xl mx-auto p-6 md:p-8">
                <CovenantOfTransparency />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
