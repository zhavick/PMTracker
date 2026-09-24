import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Pin, 
  Paperclip, 
  Edit3, 
  Trash2, 
  Download, 
  X, 
  Save, 
  Tag, 
  Upload 
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

const NOTE_COLORS = [
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Rose
  '#8B5CF6', // Purple
  '#06B6D4'  // Cyan
];

const CATEGORIES = ['General', 'Architecture', 'Meeting', 'Investigation', 'Bugfix', 'DevOps'];

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    contentHtml: '',
    category: 'General',
    color: '#6366F1',
    isPinned: false,
    taskId: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;

      const res = await axiosClient.get('/api/notes', { params });
      if (res.data?.data) {
        setNotes(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await axiosClient.get('/api/tasks', { params: { pageSize: 50 } });
      if (res.data?.data?.items) {
        setTasks(res.data.data.items);
      }
    } catch (err) {
      console.error('Failed to load tasks for notes:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [search, selectedCategory]);

  const handleOpenCreate = () => {
    setNoteToEdit(null);
    setFormData({
      title: '',
      contentHtml: '',
      category: 'General',
      color: '#6366F1',
      isPinned: false,
      taskId: ''
    });
    setSelectedFiles([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note) => {
    setNoteToEdit(note);
    setFormData({
      title: note.title || '',
      contentHtml: note.contentHtml || '',
      category: note.category || 'General',
      color: note.color || '#6366F1',
      isPinned: note.isPinned || false,
      taskId: note.taskId || ''
    });
    setSelectedFiles([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.contentHtml.trim()) {
      setFormError('Judul dan isi catatan wajib diisi.');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      if (noteToEdit) {
        await axiosClient.put(`/api/notes/${noteToEdit.id}`, {
          title: formData.title.trim(),
          contentHtml: formData.contentHtml.trim(),
          category: formData.category,
          color: formData.color,
          isPinned: formData.isPinned,
          taskId: formData.taskId ? parseInt(formData.taskId, 10) : null
        });
      } else {
        const bodyFormData = new FormData();
        bodyFormData.append('title', formData.title.trim());
        bodyFormData.append('contentHtml', formData.contentHtml.trim());
        bodyFormData.append('category', formData.category);
        bodyFormData.append('color', formData.color);
        bodyFormData.append('isPinned', formData.isPinned);
        if (formData.taskId) {
          bodyFormData.append('taskId', formData.taskId);
        }
        for (let i = 0; i < selectedFiles.length; i++) {
          bodyFormData.append('files', selectedFiles[i]);
        }

        await axiosClient.post('/api/notes', bodyFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setIsModalOpen(false);
      fetchNotes();
    } catch (err) {
      console.error('Failed to save note:', err);
      setFormError(err.response?.data?.message || 'Gagal menyimpan catatan.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (note) => {
    if (!window.confirm(`Yakin ingin menghapus catatan: "${note.title}"?`)) return;
    try {
      await axiosClient.delete(`/api/notes/${note.id}`);
      fetchNotes();
    } catch (err) {
      console.error('Failed to delete note:', err);
      alert('Gagal menghapus catatan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Catatan Kerja & Lampiran Berkas
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Dokumentasi teknis dengan isolasi folder pengguna (FSD 5.9).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all transform active:scale-95 w-max"
          style={{ backgroundColor: 'var(--accent-primary)', boxShadow: 'var(--accent-glow)' }}
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Catatan Baru</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div 
        className="p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-center gap-3"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Cari judul atau isi catatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm"
            style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border text-sm"
            style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="">Semua Kategori</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Memuat catatan...</p>
        </div>
      ) : notes.length === 0 ? (
        <div 
          className="py-16 text-center rounded-2xl border flex flex-col items-center justify-center p-6"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >
          <FileText className="w-12 h-12 mb-3 text-gray-400 opacity-60" />
          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Belum Ada Catatan</h3>
          <p className="text-sm max-w-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Gunakan modul catatan untuk mendokumentasikan investigasi bug, catatan rapat, atau snippet arsitektur.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            Buat Catatan Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
            >
              {/* Accent Top Border */}
              <div className="h-1.5 w-full" style={{ backgroundColor: note.color || '#6366F1' }} />

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span 
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${note.color || '#6366F1'}15`, color: note.color || '#6366F1' }}
                    >
                      {note.category}
                    </span>

                    <div className="flex items-center space-x-1">
                      {note.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-amber-500 fill-current" />
                      )}
                      <button
                        onClick={() => handleOpenEdit(note)}
                        className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-indigo-600"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(note)}
                        className="p-1 rounded hover:bg-rose-500/10 text-gray-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-base leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                    {note.title}
                  </h3>

                  <p className="text-xs whitespace-pre-wrap line-clamp-4" style={{ color: 'var(--text-secondary)' }}>
                    {note.contentHtml}
                  </p>
                </div>

                {/* Attachments Section */}
                {note.attachments && note.attachments.length > 0 && (
                  <div className="pt-2 border-t space-y-1.5" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1">
                      <Paperclip className="w-3 h-3" />
                      <span>{note.attachments.length} Lampiran</span>
                    </div>
                    <div className="space-y-1">
                      {note.attachments.map(att => (
                        <a
                          key={att.id}
                          href={att.fileUrl}
                          download
                          className="flex items-center justify-between p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-indigo-500/10 text-[11px] transition-colors"
                        >
                          <span className="truncate max-w-[180px] font-medium" style={{ color: 'var(--text-primary)' }}>
                            {att.fileName}
                          </span>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">
                            {formatBytes(att.fileSize)}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Info */}
                <div className="flex items-center justify-between pt-2 border-t text-[11px]" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                  <span>{formatDate(note.createdAt)}</span>
                  <span>Oleh: <strong className="text-indigo-500">{note.authorName}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-scale-up"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
          >
            <div 
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  {noteToEdit ? 'Ubah Catatan' : 'Buat Catatan Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Judul Catatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Contoh: Hasil Investigasi Bottleneck Query..."
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Category and Color */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Kategori
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Warna Aksen
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {NOTE_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color: c }))}
                        className={`w-6 h-6 rounded-full transition-transform ${formData.color === c ? 'scale-125 ring-2 ring-indigo-500' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Isi Catatan / Dokumentasi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.contentHtml}
                  onChange={(e) => setFormData(prev => ({ ...prev, contentHtml: e.target.value }))}
                  placeholder="Tuliskan catatan teknis Anda di sini..."
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* File Attachment Dropzone (on create) */}
              {!noteToEdit && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Lampiran Berkas (Multi-File)
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                      {selectedFiles.length} berkas siap diunggah ke folder terisolasi pengguna.
                    </div>
                  )}
                </div>
              )}

              {/* Pin Checkbox */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPinned: e.target.checked }))}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isPinned" className="text-xs font-semibold cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                  Sematkan di Atas (Pin to top)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-sm font-medium"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center space-x-2 px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-md disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent-primary)', boxShadow: 'var(--accent-glow)' }}
                >
                  <Save className="w-4 h-4" />
                  <span>{formLoading ? 'Menyimpan...' : 'Simpan Catatan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
