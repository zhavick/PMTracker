import React, { useState, useEffect, useMemo } from 'react';
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
  Layers,
  Building2,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [projects, setProjects] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Admin View & Grouping State
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'grid'
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('all');
  const [collapsedCompanies, setCollapsedCompanies] = useState({});

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366F1',
    deadline: '',
    status: 0,
    companyId: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (isAdmin && selectedCompanyFilter !== 'all') {
        params.companyId = selectedCompanyFilter;
      }

      const res = await axiosClient.get('/api/projects', { params });
      if (res.data?.data) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await axiosClient.get('/api/projects/companies');
      if (res.data?.data) {
        setCompanies(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search, selectedCompanyFilter]);

  useEffect(() => {
    if (isAdmin) {
      fetchCompanies();
    }
  }, [isAdmin]);

  const toggleCompanyCollapse = (companyName) => {
    setCollapsedCompanies(prev => ({
      ...prev,
      [companyName]: !prev[companyName]
    }));
  };

  const handleOpenCreate = () => {
    setProjectToEdit(null);
    setFormData({
      name: '',
      description: '',
      color: '#6366F1',
      deadline: '',
      status: 0,
      companyId: companies.length > 0 ? companies[0].id : ''
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
      status: project.status ?? 0,
      companyId: project.companyId || (companies.length > 0 ? companies[0].id : '')
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
        status: parseInt(formData.status, 10),
        companyId: isAdmin && formData.companyId ? parseInt(formData.companyId, 10) : undefined
      };

      if (projectToEdit) {
        await axiosClient.put(`/api/projects/${projectToEdit.id}`, payload);
      } else {
        await axiosClient.post('/api/projects', payload);
      }

      setIsModalOpen(false);
      fetchProjects();
      if (isAdmin) fetchCompanies();
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
      if (isAdmin) fetchCompanies();
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Gagal menghapus proyek.');
    }
  };

  // Group projects by company name
  const groupedProjects = useMemo(() => {
    const groups = {};
    projects.forEach(p => {
      const compName = p.companyName || 'Perusahaan Mandiri';
      if (!groups[compName]) {
        groups[compName] = [];
      }
      groups[compName].push(p);
    });
    return groups;
  }, [projects]);

  const renderProjectCard = (project) => {
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
          {/* Title, Company & Status */}
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

              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                project.status === 1 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : project.status === 2 
                  ? 'bg-gray-500/10 text-gray-500' 
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              }`}>
                {project.status === 1 ? 'Selesai' : project.status === 2 ? 'Arsip' : 'Aktif'}
              </span>
            </div>

            {/* Company Badge for Admin / Quick Info */}
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <Building2 className="w-3 h-3" />
                {project.companyName || 'Perusahaan Mandiri'}
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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {isAdmin ? 'Manajemen Portofolio Proyek Enterprise' : `Portofolio Proyek - ${user?.companyName || 'Perusahaan Saya'}`}
            </h1>
            {isAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                Mode Administrator
              </span>
            )}
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isAdmin 
              ? 'Pantau portofolio proyek terpusat yang dikelompokkan berdasarkan nama perusahaan dan klien mitra.' 
              : `Daftar proyek resmi yang dialokasikan khusus untuk anggota tim ${user?.companyName || 'perusahaan Anda'}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Admin View Mode Switcher */}
          {isAdmin && (
            <div 
              className="flex items-center p-1 rounded-xl border bg-slate-500/5"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <button
                onClick={() => setViewMode('grouped')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'grouped'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Grup Perusahaan</span>
              </button>

              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid Bebas</span>
              </button>
            </div>
          )}

          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all transform active:scale-95 w-max"
            style={{ backgroundColor: 'var(--accent-primary)', boxShadow: 'var(--accent-glow)' }}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Proyek Baru</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div 
        className="p-4 rounded-2xl border shadow-sm space-y-3"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
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

          <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Menampilkan <strong className="text-indigo-500">{projects.length}</strong> proyek
            {isAdmin && ` dari ${Object.keys(groupedProjects).length} perusahaan`}
          </div>
        </div>

        {/* Admin Company Filter Pills */}
        {isAdmin && companies.length > 0 && (
          <div className="pt-2 border-t flex items-center gap-2 overflow-x-auto pb-1" style={{ borderColor: 'var(--border-color)' }}>
            <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold whitespace-nowrap mr-1">
              <Filter className="w-3.5 h-3.5" /> Filter Perusahaan:
            </span>

            <button
              onClick={() => setSelectedCompanyFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCompanyFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20'
              }`}
            >
              Semua ({projects.length})
            </button>

            {companies.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCompanyFilter(c.id.toString())}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCompanyFilter === c.id.toString()
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20'
                }`}
              >
                <Building2 className="w-3 h-3" />
                <span>{c.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 text-white">
                  {c.projectCount}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Projects Display */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Memuat portofolio proyek...</p>
        </div>
      ) : projects.length === 0 ? (
        <div 
          className="py-16 text-center rounded-2xl border flex flex-col items-center justify-center p-6"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >
          <FolderKanban className="w-12 h-12 mb-3 text-gray-400 opacity-60" />
          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Belum Ada Proyek</h3>
          <p className="text-sm max-w-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            {isAdmin 
              ? 'Belum ada proyek yang terdaftar pada sistem atau filter perusahaan yang dipilih.' 
              : `Belum ada proyek terdaftar untuk ${user?.companyName || 'perusahaan Anda'}.`}
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            Tambah Proyek Sekarang
          </button>
        </div>
      ) : isAdmin && viewMode === 'grouped' ? (
        /* Admin Grouped View by Company */
        <div className="space-y-8">
          {Object.entries(groupedProjects).map(([companyName, companyProjects]) => {
            const isCollapsed = !!collapsedCompanies[companyName];
            const totalTasks = companyProjects.reduce((s, p) => s + p.totalTasks, 0);
            const completedTasks = companyProjects.reduce((s, p) => s + p.completedTasks, 0);
            const avgProgress = companyProjects.length > 0 
              ? Math.round(companyProjects.reduce((s, p) => s + p.progressPercent, 0) / companyProjects.length)
              : 0;

            return (
              <div 
                key={companyName}
                className="rounded-3xl border shadow-sm overflow-hidden space-y-4 p-5 transition-all"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                {/* Company Group Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                          {companyName}
                        </h2>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 border border-indigo-500/30">
                          {companyProjects.length} Proyek
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Portofolio proyek resmi entitas {companyName}
                      </p>
                    </div>
                  </div>

                  {/* Summary Badges & Toggle Accordion */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="hidden md:flex items-center gap-4 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-500/5 border border-slate-500/10">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Total Tugas</span>
                        <span style={{ color: 'var(--text-primary)' }}>{totalTasks}</span>
                      </div>
                      <div className="w-px h-6 bg-slate-500/20" />
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Tugas Selesai</span>
                        <span className="text-emerald-500">{completedTasks}</span>
                      </div>
                      <div className="w-px h-6 bg-slate-500/20" />
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Rata-rata Progres</span>
                        <span className="text-indigo-400">{avgProgress}%</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleCompanyCollapse(companyName)}
                      className="p-2 rounded-xl border hover:bg-slate-500/10 text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1.5 text-xs font-medium"
                      style={{ borderColor: 'var(--border-color)' }}
                      title={isCollapsed ? 'Buka grup' : 'Tutup grup'}
                    >
                      {isCollapsed ? (
                        <>
                          <span>Tampilkan</span>
                          <ChevronDown className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <span>Sembunyikan</span>
                          <ChevronUp className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Company Projects Grid */}
                {!isCollapsed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-1">
                    {companyProjects.map(renderProjectCard)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Regular User View / Flat Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(renderProjectCard)}
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

              {/* Admin Company Selector */}
              {isAdmin && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Alokasi Perusahaan Pemilik Proyek <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>
                        🏢 {c.name} {c.code ? `(${c.code})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Sebagai Administrator, Anda dapat menentukan perusahaan mana yang memiliki proyek ini.
                  </p>
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
