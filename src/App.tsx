import React, { useState, useEffect } from 'react';
import { Dashboard } from './pages/Dashboard';
import { ClientDetail } from './pages/ClientDetail';
import { NewClient } from './pages/NewClient';
import { Settings } from './pages/Settings';
import { IntakeForm } from './pages/IntakeForm';

export type Page =
  | { name: 'dashboard' }
  | { name: 'client'; id: string }
  | { name: 'new-client' }
  | { name: 'settings' }
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
    // Intake forms are not navigable from within the app interface
    setPage(p);
  };

  // Intake route doesn't get the global nav
  if (page.name === 'intake') {
    return <IntakeForm token={page.token} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      {/* Global Nav */}
      <nav className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <button onClick={() => navigate({ name: 'dashboard' })} className="flex items-center gap-2 text-white font-bold text-lg hover:text-blue-400 transition-colors">
          <span className="text-2xl">⚡</span>
          <span>Credit Acceleration CRM</span>
          <span className="text-xs text-slate-500 font-normal ml-1">Brevard County, FL</span>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ name: 'dashboard' })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${page.name === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            📊 Dashboard
          </button>
          <button onClick={() => navigate({ name: 'new-client' })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${page.name === 'new-client' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            ➕ New Client
          </button>
          <button onClick={() => navigate({ name: 'settings' })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${page.name === 'settings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
            ⚙️ Settings
          </button>
        </div>
      </nav>

      {/* Page Content */}
      <main className="flex-1 overflow-auto">
        {page.name === 'dashboard' && <Dashboard navigate={navigate} />}
        {page.name === 'client' && <ClientDetail clientId={page.id} navigate={navigate} />}
        {page.name === 'new-client' && <NewClient navigate={navigate} />}
        {page.name === 'settings' && <Settings />}
      </main>
    </div>
  );
}
