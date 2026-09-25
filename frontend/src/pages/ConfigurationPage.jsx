import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, Mail, SlidersHorizontal } from 'lucide-react';
import SyncPage from './SyncPage';
import EmailSettingsPage from './EmailSettingsPage';

export default function ConfigurationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Tab can be 'sync' or 'email'
  const activeTab = searchParams.get('tab') === 'email' ? 'email' : 'sync';

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header Card with Integrated Tab Switcher */}
      <div 
        className="p-5 md:p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <SlidersHorizontal className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Konfigurasi Sistem
            </h1>
            <p className="text-xs md:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Pengaturan terpadu replikasi multi-node Host Induk dan integrasi server email SMTP
            </p>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div 
          className="flex p-1.5 rounded-2xl border shadow-inner gap-1.5"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <button
            type="button"
            onClick={() => handleTabChange('sync')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'sync'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            style={{ color: activeTab === 'sync' ? '#fff' : 'var(--text-secondary)' }}
          >
            <RefreshCw className={`w-4 h-4 ${activeTab === 'sync' ? 'animate-spin-slow' : ''}`} />
            <span>Host Induk Sync</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('email')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'email'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            style={{ color: activeTab === 'email' ? '#fff' : 'var(--text-secondary)' }}
          >
            <Mail className="w-4 h-4" />
            <span>Email SMTP & Template</span>
          </button>
        </div>
      </div>

      {/* Dynamic Tab Body */}
      <div>
        {activeTab === 'email' ? <EmailSettingsPage /> : <SyncPage />}
      </div>
    </div>
  );
}
