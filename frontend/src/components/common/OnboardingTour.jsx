import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  X, 
  LayoutDashboard, 
  CheckSquare, 
  Clock, 
  Calendar, 
  Code, 
  Palette 
} from 'lucide-react';

const TOUR_STEPS = [
  {
    title: 'Selamat Datang di Work Tracker Pro!',
    description: 'Sistem manajemen proyek dan pelacak jam kerja enterprise berbasis .NET Core 8 Web API, database MySQL 8.4 LTS, dan frontend React.',
    icon: Sparkles,
    badge: 'Langkah 1 dari 6'
  },
  {
    title: 'Interactive Grid & Kanban Board',
    description: 'Secara default, seluruh tugas kerja ditampilkan dalam format Interaktif Grid / Tabel dengan multi-filter dan sorting cepat. Anda dapat beralih ke Kanban kapan pun.',
    icon: CheckSquare,
    badge: 'Langkah 2 dari 6'
  },
  {
    title: 'Floating Multi-Timer Dock',
    description: 'Jalankan beberapa stopwatch tugas sekaligus secara bersamaan melalui floating digital dock di bagian bawah layar tanpa kehilangan detik saat beralih halaman.',
    icon: Clock,
    badge: 'Langkah 3 dari 6'
  },
  {
    title: 'Absensi Kerja & Kalender RBAC',
    description: 'Lakukan check-in & check-out harian serta pantau irisan jadwal seluruh anggota tim dengan filter otorisasi khusus Administrator.',
    icon: Calendar,
    badge: 'Langkah 4 dari 6'
  },
  {
    title: 'Developer Tools (SQL & JSON)',
    description: 'Format dan rapikan kueri SQL untuk 15+ dialek database (MySQL, PostgreSQL, Oracle, SQLite, BigQuery) dan validasi struktur JSON payload.',
    icon: Code,
    badge: 'Langkah 5 dari 6'
  },
  {
    title: '40 Tema Tampilan & 5 Google Fonts',
    description: 'Sesuaikan kenyamanan mata Anda dengan 22 Tema Terang dan 18 Tema Gelap, dipadukan 5 pilihan tipografi Google Fonts modern pada menu topbar.',
    icon: Palette,
    badge: 'Langkah 6 dari 6'
  }
];

export default function OnboardingTour({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('worktracker_tour_completed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        {/* Subtle Decorative Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-500">
            {step.badge}
          </span>
          <button
            onClick={handleFinish}
            className="p-1.5 rounded-xl hover:bg-slate-500/10 text-slate-400 hover:text-slate-200 transition-colors"
            title="Lewati Tur"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Icon & Title */}
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-indigo-500/15 text-indigo-500 shadow-inner">
            <Icon className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {step.title}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {step.description}
            </p>
          </div>
        </div>

        {/* Step Indicator Dots */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {TOUR_STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-2 rounded-full transition-all ${
                currentStep === idx 
                  ? 'w-7 bg-indigo-500' 
                  : 'w-2 bg-slate-500/30 hover:bg-slate-500/60'
              }`}
            />
          ))}
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Sebelumnya
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md hover:opacity-95 transition-all"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            {currentStep === TOUR_STEPS.length - 1 ? (
              <>
                <Check className="w-4 h-4" />
                Mulai Gunakan Sistem
              </>
            ) : (
              <>
                Lanjut
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
