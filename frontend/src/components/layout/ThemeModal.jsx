import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { X, Check, Sun, Moon, Type } from 'lucide-react';

export default function ThemeModal({ isOpen, onClose }) {
  const { theme, setTheme, font, setFont, themesList, fontsList } = useTheme();
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'light', 'dark'

  if (!isOpen) return null;

  const filteredThemes = themesList.filter(t => {
    if (filterMode === 'light') return t.mode === 'light';
    if (filterMode === 'dark') return t.mode === 'dark';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Kustomisasi Tampilan & Font
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Pilih dari 40 tema eye-friendly dan 5 Google Fonts terkurasi
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Section 1: Font Switcher */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Type size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Global Typography (5 Google Fonts)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {fontsList.map((f) => {
                const isSelected = font === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFont(f.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected ? 'ring-2 ring-offset-1' : 'hover:border-opacity-80'
                    }`}
                    style={{
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                      backgroundColor: isSelected ? 'var(--bg-secondary)' : 'transparent',
                      fontFamily: f.family
                    }}
                  >
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {f.name.split(' (')[0]}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Aa Bb Gg 123
                      </div>
                    </div>
                    {isSelected && <Check size={16} style={{ color: 'var(--accent-primary)' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: 40 Themes Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                40 Dynamic Themes ({filteredThemes.length})
              </h3>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                    filterMode === 'all' ? 'bg-white dark:bg-zinc-800 shadow-sm' : ''
                  }`}
                  style={{ color: filterMode === 'all' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                >
                  Semua
                </button>
                <button
                  onClick={() => setFilterMode('light')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                    filterMode === 'light' ? 'bg-white dark:bg-zinc-800 shadow-sm' : ''
                  }`}
                  style={{ color: filterMode === 'light' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                >
                  <Sun size={13} /> Terang (22)
                </button>
                <button
                  onClick={() => setFilterMode('dark')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                    filterMode === 'dark' ? 'bg-white dark:bg-zinc-800 shadow-sm' : ''
                  }`}
                  style={{ color: filterMode === 'dark' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                >
                  <Moon size={13} /> Gelap (18)
                </button>
              </div>
            </div>

            {/* Themes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {filteredThemes.map((t) => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected ? 'ring-2 ring-offset-1' : 'hover:scale-[1.02]'
                    }`}
                    style={{
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                      backgroundColor: isSelected ? 'var(--bg-secondary)' : 'transparent',
                    }}
                  >
                    <span 
                      className="w-5 h-5 rounded-full shrink-0 shadow-inner flex items-center justify-center"
                      style={{ backgroundColor: t.color }}
                    >
                      {isSelected && <Check size={11} className="text-white drop-shadow" />}
                    </span>
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {t.name}
                      </div>
                      <div className="text-[10px] capitalize" style={{ color: 'var(--text-secondary)' }}>
                        {t.mode}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-md transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
