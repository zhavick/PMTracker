import React, { useState, useRef, useMemo } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FolderPlus, 
  UserPlus, 
  Loader2, 
  ArrowRight,
  Database,
  Search,
  Sparkles,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export default function TaskImportModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [filePath, setFilePath] = useState('C:\\Users\\WAHANA 24\\Downloads\\Task Tracker v2.xlsx');
  const [isPathMode, setIsPathMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [detailTab, setDetailTab] = useState('all'); // 'all' | 'created' | 'updated'
  const [detailSearch, setDetailSearch] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith('.xlsx') && !selected.name.endsWith('.xls')) {
        setError('Hanya berkas Excel (.xlsx / .xls) yang diperbolehkan.');
        return;
      }
      setFile(selected);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      if (!dropped.name.endsWith('.xlsx') && !dropped.name.endsWith('.xls')) {
        setError('Hanya berkas Excel (.xlsx / .xls) yang diperbolehkan.');
        return;
      }
      setFile(dropped);
      setError('');
    }
  };

  const handleImport = async () => {
    setError('');
    setImportResult(null);

    if (!isPathMode && !file) {
      setError('Silakan pilih berkas Excel terlebih dahulu.');
      return;
    }

    if (isPathMode && !filePath.trim()) {
      setError('Silakan masukkan path berkas Excel pada komputer.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      if (!isPathMode && file) {
        formData.append('file', file);
      } else if (isPathMode && filePath) {
        formData.append('filePath', filePath.trim());
      }

      const res = await axiosClient.post('/api/tasks/import-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.isSuccess && res.data) {
        setImportResult(res.data);
        if (onSuccess) onSuccess();
      } else {
        setError(res.message || 'Gagal memproses berkas Excel.');
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message || 'Terjadi kesalahan saat mengimpor tugas.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError('');
    setImportResult(null);
    setDetailTab('all');
    setDetailSearch('');
    onClose();
  };

  // Process details for result grid
  const createdTasks = importResult?.tasksCreated || [];
  const updatedTasks = importResult?.tasksUpdated || [];
  const allTasks = useMemo(() => [...createdTasks, ...updatedTasks], [createdTasks, updatedTasks]);

  const filteredTasks = useMemo(() => {
    const list = detailTab === 'created' ? createdTasks : detailTab === 'updated' ? updatedTasks : allTasks;
    if (!detailSearch.trim()) return list;
    const s = detailSearch.toLowerCase();
    return list.filter(t => 
      t.title?.toLowerCase().includes(s) ||
      t.projectName?.toLowerCase().includes(s) ||
      t.assignedTo?.toLowerCase().includes(s) ||
      t.status?.toLowerCase().includes(s)
    );
  }, [detailTab, detailSearch, createdTasks, updatedTasks, allTasks]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className={`w-full rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden transition-all flex flex-col ${
          importResult ? 'max-w-4xl max-h-[92vh]' : 'max-w-xl'
        }`}
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Impor Tugas dari Excel
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Validasi duplikasi otomatis & update detail per anggota tim
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Toggle (only when no result yet) */}
        {!importResult && (
          <div className="flex rounded-xl p-1 border text-xs font-semibold shrink-0" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setIsPathMode(false)}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                !isPathMode 
                  ? 'shadow-sm text-white font-bold' 
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: !isPathMode ? 'var(--accent-primary)' : 'transparent', color: !isPathMode ? '#fff' : 'var(--text-primary)' }}
            >
              Unggah Berkas (.xlsx)
            </button>
            <button
              type="button"
              onClick={() => setIsPathMode(true)}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                isPathMode 
                  ? 'shadow-sm text-white font-bold' 
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: isPathMode ? 'var(--accent-primary)' : 'transparent', color: isPathMode ? '#fff' : 'var(--text-primary)' }}
            >
              Path Lokal di Komputer
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-500 shrink-0">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Import Success Result with Detailed Data Grid */}
        {importResult ? (
          <div className="space-y-4 animate-fade-in overflow-y-auto flex-1 pr-1">
            {/* Success Summary Banner */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 size={18} />
                <span>Impor Berhasil Diselesaikan!</span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Sebanyak <strong>{importResult.createdCount || createdTasks.length}</strong> tugas baru ditambahkan, dan <strong>{importResult.updatedCount || updatedTasks.length}</strong> tugas disinkronkan tanpa redundansi data.
              </p>
            </div>

            {/* Metric Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <div className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{importResult.totalRows}</div>
                <div className="text-[10px] font-semibold opacity-70" style={{ color: 'var(--text-secondary)' }}>Total Baris</div>
              </div>
              <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <div className="text-xl font-black text-emerald-500">{importResult.successRows}</div>
                <div className="text-[10px] font-semibold opacity-70" style={{ color: 'var(--text-secondary)' }}>Total Sukses</div>
              </div>
              <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <div className="text-xl font-black text-emerald-400">{importResult.createdCount || createdTasks.length}</div>
                <div className="text-[10px] font-semibold opacity-70" style={{ color: 'var(--text-secondary)' }}>Tugas Baru Ditambah</div>
              </div>
              <div className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <div className="text-xl font-black text-sky-400">{importResult.updatedCount || updatedTasks.length}</div>
                <div className="text-[10px] font-semibold opacity-70" style={{ color: 'var(--text-secondary)' }}>Tugas Diperbarui</div>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 p-1 rounded-xl border text-xs font-semibold" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setDetailTab('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all text-xs ${
                    detailTab === 'all' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ color: detailTab === 'all' ? '#fff' : 'var(--text-primary)' }}
                >
                  Semua ({allTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('created')}
                  className={`px-3 py-1.5 rounded-lg transition-all text-xs flex items-center gap-1.5 ${
                    detailTab === 'created' ? 'bg-emerald-600 text-white font-bold shadow-sm' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ color: detailTab === 'created' ? '#fff' : 'var(--text-primary)' }}
                >
                  <PlusCircle size={13} />
                  <span>Baru ({createdTasks.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('updated')}
                  className={`px-3 py-1.5 rounded-lg transition-all text-xs flex items-center gap-1.5 ${
                    detailTab === 'updated' ? 'bg-sky-600 text-white font-bold shadow-sm' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ color: detailTab === 'updated' ? '#fff' : 'var(--text-primary)' }}
                >
                  <RefreshCw size={13} />
                  <span>Diperbarui ({updatedTasks.length})</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  value={detailSearch}
                  onChange={(e) => setDetailSearch(e.target.value)}
                  placeholder="Cari tugas / proyek / PIC..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Interactive Data Grid of Imported Tasks */}
            <div className="border rounded-2xl overflow-hidden max-h-72 overflow-y-auto" style={{ borderColor: 'var(--border-color)' }}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b text-[11px] font-bold uppercase tracking-wider" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 w-32">Aksi / Status</th>
                    <th className="py-2.5 px-3">Judul Tugas</th>
                    <th className="py-2.5 px-3">Proyek</th>
                    <th className="py-2.5 px-3">PIC</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Prioritas</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center opacity-60 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Tidak ada baris tugas yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((t, idx) => (
                      <tr 
                        key={idx} 
                        className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <td className="py-2 px-3 text-center opacity-60 text-[11px]">{idx + 1}</td>
                        <td className="py-2 px-3">
                          {t.action === 'Created' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Ditambahkan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                              Diperbarui
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold max-w-xs truncate" title={t.title}>
                          {t.title}
                        </td>
                        <td className="py-2 px-3 opacity-90 max-w-[150px] truncate" title={t.projectName || '-'}>
                          {t.projectName || '-'}
                        </td>
                        <td className="py-2 px-3 opacity-80 whitespace-nowrap">
                          {t.assignedTo || '-'}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/5 dark:bg-white/5">
                            {t.status || 'Todo'}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/5 dark:bg-white/5">
                            {t.priority || 'Medium'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Created Projects List */}
            {importResult.createdProjectNames?.length > 0 && (
              <div className="p-3 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  <FolderPlus size={14} className="text-indigo-500" /> Proyek Baru yang Terbentuk ({importResult.createdProjectNames.length}):
                </div>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {importResult.createdProjectNames.map((p, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-500">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-between border-t shrink-0" style={{ borderColor: 'var(--border-color)' }}>
              <span className="text-[11px] opacity-60" style={{ color: 'var(--text-secondary)' }}>
                Menampilkan {filteredTasks.length} dari {allTasks.length} tugas yang diproses
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md hover:opacity-90 transition-all"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                Selesai & Lihat Tugas
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {!isPathMode ? (
              /* Drag & Drop Upload Zone */
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all hover:border-indigo-500 hover:bg-black/5 dark:hover:bg-white/5 space-y-3"
                style={{ borderColor: file ? 'var(--accent-primary)' : 'var(--border-color)' }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                />
                <div 
                  className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--accent-primary)' }}
                >
                  <UploadCloud size={24} />
                </div>
                <div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    {file ? file.name : 'Klik untuk memilih berkas atau seret ke sini'}
                  </div>
                  <p className="text-[11px] opacity-70 mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {file ? `${(file.size / 1024).toFixed(1)} KB • Siap diimpor` : 'Mendukung format Microsoft Excel (.xlsx / .xls)'}
                  </p>
                </div>
              </div>
            ) : (
              /* Local File Path Input */
              <div className="space-y-2">
                <label className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  Alamat Path Berkas di Komputer:
                </label>
                <div 
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all focus-within:ring-2"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                >
                  <Database size={16} style={{ color: 'var(--accent-primary)' }} />
                  <input
                    type="text"
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                    placeholder="Contoh: C:\Users\WAHANA 24\Downloads\Task Tracker v2.xlsx"
                    className="w-full bg-transparent text-xs outline-none"
                    style={{ color: 'var(--text-primary)' }}
                  />
                </div>
                <p className="text-[11px] opacity-70" style={{ color: 'var(--text-secondary)' }}>
                  Gunakan path absolut dari komputer lokal server untuk impor berkecepatan tinggi.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border font-bold text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-2 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Mengimpor 329+ Baris...</span>
                  </>
                ) : (
                  <>
                    <span>Mulai Impor Tugas</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
