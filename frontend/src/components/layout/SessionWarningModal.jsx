import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SessionWarningModal({ isOpen, remainingSeconds, onExtend }) {
  const { logout } = useAuth();

  if (!isOpen) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-md p-6 rounded-2xl border shadow-2xl text-center space-y-5"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <AlertTriangle size={32} />
        </div>

        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Peringatan Sesi Kedaluwarsa
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Sesi kerja Anda akan berakhir karena tidak ada aktivitas selama 55 menit.
          </p>
        </div>

        <div 
          className="p-4 rounded-xl flex items-center justify-center gap-2 text-2xl font-mono font-bold"
          style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--accent-primary)' }}
        >
          <Clock size={24} />
          <span>{formattedTime}</span>
        </div>

        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Klik tombol di bawah untuk melanjutkan aktivitas Anda dan memperpanjang sesi selama 1 jam ke depan.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => logout('manual')}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            Keluar Sekarang
          </button>
          <button
            onClick={onExtend}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            Lanjutkan Sesi
          </button>
        </div>
      </div>
    </div>
  );
}
