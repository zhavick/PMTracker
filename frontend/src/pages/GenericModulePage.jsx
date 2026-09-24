import React from 'react';

export default function GenericModulePage({ title, description, icon: Icon }) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div 
        className="p-6 rounded-3xl border shadow-sm flex items-center justify-between"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-3.5">
          {Icon && (
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <Icon size={24} />
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h1>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {description}
            </p>
          </div>
        </div>
      </div>

      <div 
        className="p-12 rounded-3xl border shadow-sm text-center space-y-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Modul {title} Siap Digunakan
        </div>
        <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Komponen terpadu sedang dimuat dari arsitektur backend .NET 8 dan basis data MySQL.
        </p>
      </div>
    </div>
  );
}
