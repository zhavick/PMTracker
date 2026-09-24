import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Archive, 
  ArrowRight,
  X,
  Save,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const COLOR_PRESETS = [
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Rose
  '#06B6D4', // Cyan
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#3B82F6'  // Blue
];

function formatSeconds(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0j';
  const hours = (totalSeconds / 3600).toFixed(1);
  return `${hours}j`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366F1',
    deadline: '',
    status: 0
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/projects', {
        params: search.trim() ? { search: search.trim() } : {}
      });
      if (res.data?.data) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search]);

  const handleOpenCreate = () => {
    setProjectToEdit(null);
    setFormData({
      name: '',
      description: '',
      color: '#6366F1',
      deadline: '',
      status: 0
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project) => {
    setProjectToEdit(project);
    setFormData({
      name: project.name || '',
      description: project.description || '',
      color: project.color || '#6366F1',
      deadline: project.deadline ? project.deadline.split('T')[0] : '',
      status: project.status ?? 0
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Nama proyek wajib diisi.');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        color: formData.color,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        status: parseInt(formData.status, 10)
      };

      if (projectToEdit) {
        await axiosClient.put(`/api/projects/${projectToEdit.id}`, payload);
      } else {
        await axiosClient.post('/api/projects', payload);
      }

      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      console.error('Failed to save project:', err);
      setFormError(err.response?.data?.message || 'Gagal menyimpan proyek.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Yakin ingin menghapus/mengarsipkan proyek: "${project.name}"?`)) return;
    try {
      const res = await axiosClient.delete(`/api/projects/${project.id}`);
      alert(res.data?.message || 'Operasi berhasil.');
      fetchProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Gagal menghapus proyek.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Manajemen Proyek
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Pantau seluruh portofolio proyek organisasi, progres kumulatif, dan alokasi jam kerja tim.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all transform active:scale-95 w-max"
          style={{ backgroundColor: 'var(--accent-primary)', boxShadow: 'var(--accent-glow)' }}
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Proyek Baru</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div 
        className="p-4 rounded-2xl border shadow-sm"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau deskripsi proyek..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Memuat daftar proyek...</p>
        </div>
      ) : projects.length === 0 ? (
        <div 
          className="py-16 text-center rounded-2xl border flex flex-col items-center justify-center p-6"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >
          <FolderKanban className="w-12 h-12 mb-3 text-gray-400 opacity-60" />
          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Belum Ada Proyek</h3>
          <p className="text-sm max-w-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Mulai dengan menambahkan proyek pertama untuk mengelompokkan penugasan tim.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            Tambah Proyek Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => {
            const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status !== 1;

            return (
              <div
                key={project.id}
                className="rounded-2xl border shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
              >
                {/* Top Color Accent Line */}
                <div 
                  className="h-1.5 w-full"
                  style={{ backgroundColor: project.color || '#6366F1' }}
                />

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  {/* Title & Status */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color || '#6366F1' }}
                        />
                        <h3 className="font-bold text-base line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                          {project.name}
                        </h3>
                      </div>

                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        project.status === 1 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : project.status === 2 
                          ? 'bg-gray-500/10 text-gray-500' 
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}>
                        {project.status === 1 ? 'Selesai' : project.status === 2 ? 'Arsip' : 'Aktif'}
                      </span>
                    </div>

                    <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {project.description || 'Tidak ada deskripsi tambahan.'}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span style={{ color: 'var(--text-secondary)' }}>Progres Tugas</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">{project.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${project.progressPercent}%`,
                          backgroundColor: project.color || '#6366F1' 
                        }}
                      />
                    </div>
                  </div>

                  {/* Metrics Footer */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y text-center" style={{ borderColor: 'var(--border-color)' }}>
                    <div>
                      <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Total Tugas</div>
                      <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{project.totalTasks}</div>
                    </div>
                    <div>
                      <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Selesai</div>
                      <div className="text-sm font-bold text-emerald-600">{project.completedTasks}</div>
                    </div>
                    <div>
                      <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Jam Kerja</div>
                      <div className="text-sm font-bold text-indigo-600">{formatSeconds(project.totalSecondsLogged)}</div>
                    </div>
                  </div>

                  {/* Deadline & Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-1.5 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span className={isOverdue ? 'text-rose-500 font-bold' : ''} style={{ color: isOverdue ? undefined : 'var(--text-secondary)' }}>
                        {formatDate(project.deadline)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(project)}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-indigo-600 transition-colors"
                        title="Edit Proyek"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(project)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-gray-500 hover:text-rose-500 transition-colors"
                        title="Hapus / Arsipkan Proyek"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => navigate('/tasks')}
                        className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-indigo-600 transition-colors"
                        title="Lihat Tugas Proyek"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Create / Edit Project */}
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
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  {projectToEdit ? 'Ubah Rincian Proyek' : 'Tambah Proyek Baru'}
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

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Nama Proyek <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Digitalisasi Platform HR..."
                  className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Jelaskan tujuan dan ruang lingkup proyek..."
                  className="w-full px-4 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Label Warna Proyek
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        formData.color === color ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500 shadow-md' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Deadline & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Batas Waktu (Deadline)
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Status Proyek
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    <option value={0}>🔵 Aktif</option>
                    <option value={1}>🟢 Selesai</option>
                    <option value={2}>⚪ Arsip</option>
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center space-x-2 px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-md transition-all disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent-primary)', boxShadow: 'var(--accent-glow)' }}
                >
                  <Save className="w-4 h-4" />
                  <span>{formLoading ? 'Menyimpan...' : 'Simpan Proyek'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
