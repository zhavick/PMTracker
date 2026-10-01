import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  SlidersHorizontal, 
  Layers, 
  RefreshCw, 
  FolderArchive, 
  Server, 
  FileText,
  Trash2
} from 'lucide-react';
import SyncPage from './SyncPage';
import EmailSettingsPage from './EmailSettingsPage';
import DataCleanupTab from '../components/maintenance/DataCleanupTab';

export default function ConfigurationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');

  // Support legacy tab params ('sync', 'email') and modern purpose-driven tabs
  const activeTab = (() => {
    if (rawTab === 'email') return 'smtp';
    if (rawTab === 'sync') return 'modular';
    if (['modular', 'host-sync', 'offline-pkg', 'smtp', 'templates', 'maintenance'].includes(rawTab)) {
      return rawTab;
    }
    return 'modular'; // Default to Granular Module Sync
  })();

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const TABS = [
    {
      id: 'modular',
      label: 'Sinkronisasi Modul',
      badge: 'FSD v3.7',
      desc: 'Catatan, Presensi & Gamifikasi',
      icon: Layers
    },
    {
      id: 'host-sync',
      label: 'Replikasi Host Induk',
      desc: 'Push & Pull Database Penuh',
      icon: RefreshCw
    },
    {
      id: 'offline-pkg',
      label: 'Paket Offline & Backup',
      desc: 'Ekspor / Impor SQL & ZIP',
      icon: FolderArchive
    },
    {
      id: 'smtp',
      label: 'Server Email (SMTP)',
      desc: 'Host, Port & Uji Koneksi',
      icon: Server
    },
    {
      id: 'templates',
      label: 'Template Notifikasi',
      desc: 'Editor Template Email Sistem',
      icon: FileText
    },
    {
      id: 'maintenance',
      label: 'Pembersihan Data',
      badge: 'Admin',
      desc: 'Parsial & Full Reset Database',
      icon: Trash2
    }
  ];

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Top Header Card */}
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
              Pusat pengaturan sinkronisasi antar-node, migrasi offline, dan integrasi server email SMTP
            </p>
          </div>
        </div>
      </div>

      {/* Purpose-Driven Tabpage Switcher Bar */}
      <div 
        className="p-2 rounded-2xl border shadow-sm overflow-x-auto"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all relative ${
                  isActive
                    ? 'shadow-md text-white'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-primary)'
                }}
              >
                <Icon className={`w-4 h-4 ${isActive && tab.id === 'host-sync' ? 'animate-spin-slow' : ''}`} />
                <div className="flex flex-col items-start text-left">
                  <div className="flex items-center gap-1.5 leading-tight">
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-500'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] hidden sm:block ${
                    isActive ? 'text-white/80' : 'text-slate-400'
                  }`}>
                    {tab.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Tab Content Body */}
      <div>
        {(activeTab === 'modular' || activeTab === 'host-sync' || activeTab === 'offline-pkg') && (
          <SyncPage activeSection={activeTab} />
        )}
        {(activeTab === 'smtp' || activeTab === 'templates') && (
          <EmailSettingsPage activeSection={activeTab} />
        )}
        {activeTab === 'maintenance' && (
          <DataCleanupTab />
        )}
      </div>
    </div>
  );
}
