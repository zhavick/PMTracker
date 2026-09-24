import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  ChevronRight, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  CheckSquare, 
  Briefcase, 
  Calendar, 
  FileText, 
  Database, 
  Code, 
  Settings, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';

const GUIDE_CHAPTERS = [
  {
    id: 'intro',
    title: '1. Pengenalan & Memulai Aplikasi',
    icon: ShieldCheck,
    sections: [
      {
        subtitle: '1.1 Autentikasi Pure JWT & Persetujuan Admin (Approval Workflow)',
        content: 'Work Tracker Pro menggunakan autentikasi JWT (JSON Web Token) HMAC-SHA256 tanpa sesi server stateful. Akun baru yang mendaftar secara default berstatus Pending Approval dan memerlukan verifikasi serta persetujuan dari Administrator sebelum dapat masuk ke sistem.'
      },
      {
        subtitle: '1.2 Kustomisasi 40 Tema & 5 Google Fonts',
        content: 'Pengguna dapat berganti antara 22 Tema Terang (Light) dan 18 Tema Gelap (Dark), dipadukan dengan 5 tipografi modern (Inter, Plus Jakarta Sans, Outfit, Poppins, Roboto). Pengaturan disimpan secara instan pada browser LocalStorage.'
      },
      {
        subtitle: '1.3 Keamanan Sesi & Auto-Logout Inaktivitas',
        content: 'Sesi login diproteksi dengan masa kedaluwarsa token 8 jam dan mekanisme deteksi inaktivitas 1 jam dengan peringatan modal 5 menit sebelum otomatis diarahkan ke halaman login.'
      }
    ]
  },
  {
    id: 'tasks',
    title: '2. Modul Tugas (Interactive Grid & Kanban)',
    icon: CheckSquare,
    sections: [
      {
        subtitle: '2.1 Default Tampilan Interactive Grid / Table',
        content: 'Sesuai standar operasional enterprise, halaman Tasks selalu terbuka dalam mode Interaktif Tabel Grid sebagai default view. Tabel menyediakan pencarian multi-kolom, filter proyek, filter status, filter prioritas, paginasi AJAX, dan tombol toggle untuk beralih ke papan Kanban interaktif drag-and-drop.'
      },
      {
        subtitle: '2.2 Formulir Penyatuan Edit Tugas & Log Jam Kerja (Unified Save)',
        content: 'Saat mengedit tugas kerja, dialog menyediakan tab "Unified Save (Simpan Tugas & Catat Sesi)". Melalui 1 tombol simpan tunggal, sistem mengeksekusi mutasi task sekaligus pencatatan jam kerja sesi log (WorkSession) dalam 1 transaksi atomik.'
      },
      {
        subtitle: '2.3 Sub-Task & SDLC Milestone',
        content: 'Setiap tugas dapat memiliki sub-task bertingkat (parent-child) dan dikaitkan dengan milestone SDLC Waterfall (Requirements, Design, Implementation, Testing, Deployment, Maintenance).'
      }
    ]
  },
  {
    id: 'projects',
    title: '3. Modul Proyek & Linimasa',
    icon: Briefcase,
    sections: [
      {
        subtitle: '3.1 Manajemen Proyek & Status Otomatis',
        content: 'Pantau kemajuan keseluruhan proyek berdasarkan kalkulasi rata-rata progress tugas di dalamnya. Proyek dapat berstatus Planning, In Progress, On Hold, Completed, atau Archived.'
      },
      {
        subtitle: '3.2 Indikator Tenggat Waktu & Sisa Hari',
        content: 'Setiap kartu proyek menampilkan countdown sisa hari menuju target rilis produksi, anggaran estimasi jam kerja, dan tim yang ditugaskan.'
      }
    ]
  },
  {
    id: 'timesheet',
    title: '4. Timesheet & Multi-Timer Digital',
    icon: Clock,
    sections: [
      {
        subtitle: '4.1 Stopwatch Digital Dock Multi-Timer',
        content: 'Pengguna dapat menjalankan beberapa timer tugas secara bersamaan melalui floating dock bar di bagian bawah layar. Timer terus berdetak secara real-time dan tersinkronisasi saat beralih halaman.'
      },
      {
        subtitle: '4.2 Ekspor Laporan Resmi Excel (.xlsx)',
        content: 'Modul Timesheet menyediakan ekspor data jam kerja harian, mingguan, dan bulanan ke format file Microsoft Excel (.xlsx) resmi dengan formula kalkulasi durasi jam otomatis menggunakan ClosedXML engine.'
      }
    ]
  },
  {
    id: 'attendance',
    title: '5. Absensi Harian & Presensi Kerja',
    icon: Clock,
    sections: [
      {
        subtitle: '5.1 Check-In & Check-Out Harian',
        content: 'Mencatat jam masuk dan jam pulang kerja karyawan disertai status kehadiran: Hadir (WFO), Work From Home (WFH), Sakit, Izin, Cuti Tahunan, atau Libur Nasional.'
      },
      {
        subtitle: '5.2 Rekonsiliasi Presensi Admin',
        content: 'Administrator memiliki hak akses untuk memantau rekapitulasi kehadiran seluruh anggota tim secara real-time dan melakukan approval atau penyesuaian jika terjadi kendala teknis absensi.'
      }
    ]
  },
  {
    id: 'calendar',
    title: '6. Kalender Kerja & RBAC Scoping',
    icon: Calendar,
    sections: [
      {
        subtitle: '6.1 RBAC Scoping: Tugas Saya vs Semua Anggota',
        content: 'Karyawan standar melihat jadwal penugasan dan tenggat waktu miliknya sendiri. Pengguna berstatus Administrator memiliki pill switcher untuk beralih antara "Tugas Saya" dan "Semua Anggota Tim" secara global.'
      },
      {
        subtitle: '6.2 Visualisasi Chip Warna & Detail Popover',
        content: 'Setiap event kalender diwarnai sesuai tingkat urgensi prioritas (Merah: Sangat Mendesak, Kuning: Sedang, Biru: Normal). Mengklik chip menampilkan modal ringkasan PIC, proyek, dan persentase progress.'
      }
    ]
  },
  {
    id: 'notes',
    title: '7. Catatan Kerja & Dokumentasi (Notes)',
    icon: FileText,
    sections: [
      {
        subtitle: '7.1 Rich Documentation & Pin Notes',
        content: 'Tulis catatan teknis, memo harian, dan dokumentasi arsitektur dengan dukungan penyematan (Pin) ke posisi teratas dan label kategori warna.'
      },
      {
        subtitle: '7.2 Folder Unggahan Berkas Terisolasi',
        content: 'Lampiran berkas pada catatan disimpan secara terisolasi per username pengguna pada direktori wwwroot/uploads/notes/{username}/ untuk mencegah tumpang tindih nama berkas.'
      }
    ]
  },
  {
    id: 'tools',
    title: '8. Utilitas Developer (SQL & JSON Tools)',
    icon: Code,
    sections: [
      {
        subtitle: '8.1 SQL Beautifier & 15+ Dialek Database',
        content: 'Format, rapikan indentasi, validasi sintaksis, atau minify kueri SQL untuk lebih dari 15 dialek engine: MySQL, PostgreSQL, Transact-SQL (SQL Server), Oracle PL/SQL, SQLite, MariaDB, BigQuery, Snowflake, ClickHouse, dll.'
      },
      {
        subtitle: '8.2 JSON Validator & Minifier',
        content: 'Periksa keabsahan format payload REST API, rapikan hierarki kurung kurawal, dan hitung penghematan ukuran byte (bandwidth savings) saat payload diminifikasi.'
      }
    ]
  },
  {
    id: 'admin',
    title: '9. Administrasi, Audit Trail & Sinkronisasi',
    icon: Settings,
    sections: [
      {
        subtitle: '9.1 Master Data SDLC Waterfall',
        content: 'Administrator dapat menambah, mengurutkan, dan mengedit Prioritas, Status Pekerjaan (dengan flag IsDoneState), Milestone SDLC, dan Kategori.'
      },
      {
        subtitle: '9.2 Audit Trail Mutasi HTTP & Ekspor CSV',
        content: 'Setiap permintaan mutasi data dicatat secara otomatis (metode, endpoint, IP address, waktu eksekusi ms, pengguna) dan dapat diekspor ke berkas CSV.'
      },
      {
        subtitle: '9.3 Multi-Instance Host Induk Handshake',
        content: 'Uji sambungan sinkronisasi ke server Host Induk via REST API ping atau siapkan paket kompresi mandiri untuk instalasi server air-gapped.'
      }
    ]
  }
];

export default function UserGuidePage() {
  const [search, setSearch] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('intro');
  const [appSettings, setAppSettings] = useState({
    appName: 'Work Tracker Pro v3.6 • Enterprise Edition',
    companyName: 'PT Elistec Teknologi'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axiosClient.get('/api/app-settings');
        if (res.data?.data) {
          setAppSettings({
            appName: res.data.data.appName || 'Work Tracker Pro v3.6 • Enterprise Edition',
            companyName: res.data.data.companyName || 'PT Elistec Teknologi'
          });
        }
      } catch (err) {
        // Fallback to default
      }
    };
    fetchSettings();
  }, []);

  const filteredChapters = GUIDE_CHAPTERS.filter(ch => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchChapter = ch.title.toLowerCase().includes(q);
    const matchSection = ch.sections.some(s => 
      s.subtitle.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
    );
    return matchChapter || matchSection;
  });

  const activeChapter = GUIDE_CHAPTERS.find(c => c.id === selectedChapterId) || GUIDE_CHAPTERS[0];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5" style={{ color: 'var(--text-primary)' }}>
            <HelpCircle className="w-7 h-7 text-indigo-500" />
            Buku Panduan Pengguna (User Guide)
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Rujukan komprehensif seluruh alur kerja, standar teknis, dan operasional fitur {appSettings.appName}
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari panduan fitur..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Guide Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          <div 
            className="rounded-2xl border p-3 shadow-sm space-y-1.5"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          >
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-2 text-slate-400 block">
              Daftar Bab Panduan ({filteredChapters.length})
            </span>

            {filteredChapters.map((ch) => {
              const Icon = ch.icon;
              const isSelected = selectedChapterId === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChapterId(ch.id)}
                  className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'hover:bg-slate-500/5'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-tertiary, rgba(99,102,241,0.08))' : 'var(--bg-primary)',
                    borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`} />
                    <span className="font-semibold text-xs truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>
                      {ch.title}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-indigo-500' : 'text-slate-400 opacity-60'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Viewer */}
        <div className="lg:col-span-8">
          <div 
            className="rounded-2xl border p-6 sm:p-8 shadow-sm space-y-6"
            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
          >
            <div className="pb-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 block mb-1">
                  Dokumentasi Resmi
                </span>
                <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {activeChapter.title}
                </h2>
              </div>
            </div>

            <div className="space-y-6">
              {activeChapter.sections.map((sec, idx) => (
                <div key={idx} className="p-5 rounded-2xl border space-y-2" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                  <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {sec.subtitle}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-300" style={{ color: 'var(--text-secondary)' }}>
                    {sec.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
              <span className="font-medium tracking-wide">{appSettings.appName}</span>
              <span className="font-semibold text-indigo-500">{appSettings.companyName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
