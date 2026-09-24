import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Zap, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Folder, 
  Flag, 
  Calendar, 
  Sliders, 
  FileText 
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const MILESTONES = [
  'Requirement Analysis',
  'System Design',
  'Implementation',
  'Testing & QA',
  'Deployment',
  'Maintenance'
];

export default function TaskFormModal({ isOpen, onClose, onSaved, taskToEdit = null, defaultProjectId = null }) {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'unified'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 0, // 0: Todo, 1: InProgress, 2: Done, 4: InReview
    priority: 1, // 0: Low, 1: Medium, 2: High, 3: Critical
    progress: 0,
    projectId: defaultProjectId || '',
    milestone: 'Implementation',
    obstacle: '',
    solution: '',
    dueDate: '',
    startDate: '',
    // Unified Save fields
    logSession: false,
    durationMinutes: 30,
    sessionDate: new Date().toISOString().split('T')[0],
    sessionNotes: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      if (taskToEdit) {
        setFormData({
          title: taskToEdit.title || '',
          description: taskToEdit.description || '',
          status: taskToEdit.status ?? 0,
          priority: taskToEdit.priority ?? 1,
          progress: taskToEdit.progress ?? 0,
          projectId: taskToEdit.projectId || '',
          milestone: taskToEdit.milestone || 'Implementation',
          obstacle: taskToEdit.obstacle || '',
          solution: taskToEdit.solution || '',
          dueDate: taskToEdit.dueDate ? taskToEdit.dueDate.split('T')[0] : '',
          startDate: taskToEdit.startDate ? taskToEdit.startDate.split('T')[0] : '',
          logSession: false,
          durationMinutes: 30,
          sessionDate: new Date().toISOString().split('T')[0],
          sessionNotes: ''
        });
      } else {
        setFormData({
          title: '',
          description: '',
          status: 0,
          priority: 1,
          progress: 0,
          projectId: defaultProjectId || '',
          milestone: 'Implementation',
          obstacle: '',
          solution: '',
          dueDate: '',
          startDate: '',
          logSession: false,
          durationMinutes: 30,
          sessionDate: new Date().toISOString().split('T')[0],
          sessionNotes: ''
        });
      }
      setError(null);
      setActiveTab('details');
    }
  }, [isOpen, taskToEdit, defaultProjectId]);

  const fetchProjects = async () => {
    try {
      const res = await axiosClient.get('/api/projects');
      if (res.data?.data) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load projects for dropdown:', err);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProgressChange = (val) => {
    const p = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
    setFormData(prev => ({
      ...prev,
      progress: p,
      status: p === 100 ? 2 : (p > 0 && prev.status === 0 ? 1 : prev.status)
    }));
  };

  const handleStatusChange = (newStatus) => {
    const statusNum = parseInt(newStatus, 10);
    setFormData(prev => ({
      ...prev,
      status: statusNum,
      progress: statusNum === 2 ? 100 : (prev.progress === 100 ? 50 : prev.progress)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Judul tugas wajib diisi.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        status: parseInt(formData.status, 10),
        priority: parseInt(formData.priority, 10),
        progress: parseInt(formData.progress, 10),
        projectId: formData.projectId ? parseInt(formData.projectId, 10) : null,
        milestone: formData.milestone,
        obstacle: formData.obstacle.trim() || null,
        solution: formData.solution.trim() || null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
      };

      if (taskToEdit) {
        // Edit mode
        if (formData.logSession && formData.durationMinutes > 0) {
          // Unified Save Endpoint
          const unifiedPayload = {
            ...payload,
            logSession: true,
            durationMinutes: parseInt(formData.durationMinutes, 10),
            sessionDate: formData.sessionDate ? new Date(formData.sessionDate).toISOString() : new Date().toISOString(),
            sessionNotes: formData.sessionNotes.trim() || 'Manual session via Unified Save'
          };
          await axiosClient.put(`/api/tasks/${taskToEdit.id}/unified-save`, unifiedPayload);
        } else {
          // Standard update
          await axiosClient.put(`/api/tasks/${taskToEdit.id}`, payload);
        }
      } else {
        // Create mode
        await axiosClient.post('/api/tasks', payload);
      }

      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Task save error:', err);
      setError(err.response?.data?.message || 'Gagal menyimpan tugas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden animate-scale-up"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center space-x-3">
            <div 
              className="p-2 rounded-xl text-white shadow-md"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {taskToEdit ? 'Ubah Rincian Tugas' : 'Tambah Tugas Baru'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {taskToEdit ? `ID Tugas: #${taskToEdit.id}` : 'Lengkapi informasi tugas dan rencana milestone'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div 
          className="flex px-6 pt-2 border-b space-x-4 text-sm font-medium"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-3 border-b-2 flex items-center space-x-2 transition-all ${
              activeTab === 'details'
                ? 'border-indigo-600 font-semibold text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Spesifikasi Tugas</span>
          </button>

          {taskToEdit && (
            <button
              type="button"
              onClick={() => setActiveTab('unified')}
              className={`pb-3 border-b-2 flex items-center space-x-2 transition-all ${
                activeTab === 'unified'
                  ? 'border-amber-500 font-semibold text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>⚡ Simpan Terpadu (Unified Save)</span>
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm flex items-center space-x-2.5">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'details' ? (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Judul Tugas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Contoh: Implementasi Pipeline JWT Bearer..."
                  required
                  className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  style={{ 
                    backgroundColor: 'var(--input-bg)', 
                    borderColor: 'var(--border-color)', 
                    color: 'var(--text-primary)' 
                  }}
                />
              </div>

              {/* Project & Milestone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Proyek Terkait
                  </label>
                  <select
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    style={{ 
                      backgroundColor: 'var(--input-bg)', 
                      borderColor: 'var(--border-color)', 
                      color: 'var(--text-primary)' 
                    }}
                  >
                    <option value="">-- Tanpa Proyek --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Milestone SDLC Waterfall
                  </label>
                  <select
                    name="milestone"
                    value={formData.milestone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    style={{ 
                      backgroundColor: 'var(--input-bg)', 
                      borderColor: 'var(--border-color)', 
                      color: 'var(--text-primary)' 
                    }}
                  >
                    {MILESTONES.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Status Tugas
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    style={{ 
                      backgroundColor: 'var(--input-bg)', 
                      borderColor: 'var(--border-color)', 
                      color: 'var(--text-primary)' 
                    }}
                  >
                    <option value={0}>📋 To Do</option>
                    <option value={1}>🔄 In Progress</option>
                    <option value={4}>🔍 In Review</option>
                    <option value={2}>✅ Completed (Done)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Tingkat Prioritas
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    style={{ 
                      backgroundColor: 'var(--input-bg)', 
                      borderColor: 'var(--border-color)', 
                      color: 'var(--text-primary)' 
                    }}
                  >
                    <option value={0}>🟢 Low</option>
                    <option value={1}>🔵 Medium</option>
                    <option value={2}>🟠 High</option>
                    <option value={3}>🔴 Critical</option>
                  </select>
                </div>
              </div>

              {/* Progress Slider (0 - 100%) */}
              <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Progress Penyelesaian
                  </span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {formData.progress}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.progress}
                  onChange={(e) => handleProgressChange(e.target.value)}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-600 bg-gray-200 dark:bg-gray-700"
                />
                <div className="flex justify-between mt-2.5 gap-1">
                  {[0, 25, 50, 75, 100].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleProgressChange(val)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                        formData.progress === val
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                      style={{ color: formData.progress === val ? '#fff' : 'var(--text-secondary)' }}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    style={{ 
                      backgroundColor: 'var(--input-bg)', 
                      borderColor: 'var(--border-color)', 
                      color: 'var(--text-primary)' 
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Batas Waktu (Due Date)
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    style={{ 
                      backgroundColor: 'var(--input-bg)', 
                      borderColor: 'var(--border-color)', 
                      color: 'var(--text-primary)' 
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Deskripsi / Catatan Tugas
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Deskripsikan rincian teknis tugas ini..."
                  className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  style={{ 
                    backgroundColor: 'var(--input-bg)', 
                    borderColor: 'var(--border-color)', 
                    color: 'var(--text-primary)' 
                  }}
                />
              </div>

              {/* Obstacle & Solution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-amber-600 dark:text-amber-400">
                    Kendala / Hambatan Teknis
                  </label>
                  <textarea
                    name="obstacle"
                    rows={2}
                    value={formData.obstacle}
                    onChange={handleChange}
                    placeholder="Contoh: Mengalami timeout koneksi socket..."
                    className="w-full px-4 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    style={{ 
                      backgroundColor: 'var(--input-bg)', 
                      borderColor: 'var(--border-color)', 
                      color: 'var(--text-primary)' 
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-emerald-600 dark:text-emerald-400">
                    Solusi / Tindak Lanjut
                  </label>
                  <textarea
                    name="solution"
                    rows={2}
                    value={formData.solution}
                    onChange={handleChange}
                    placeholder="Contoh: Mengatur retry policy dan buffer pooling..."
                    className="w-full px-4 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    style={{ 
                      backgroundColor: 'var(--input-bg)', 
                      borderColor: 'var(--border-color)', 
                      color: 'var(--text-primary)' 
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Unified Save Section */
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                  <Zap className="w-5 h-5" />
                  <span>Penyatuan Edit Tugas & Pengisian Jam Kerja Manual (FSD 5.5)</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Fitur ini memungkinkan Anda memperbarui status dan progress tugas sekaligus mencatat sesi jam kerja ke modul timesheet secara atomik dalam satu transaksi tanpa berpindah menu.
                </p>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <input
                  type="checkbox"
                  id="logSession"
                  name="logSession"
                  checked={formData.logSession}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="logSession" className="text-sm font-semibold cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                  Aktifkan Pencatatan Jam Kerja untuk Sesi Ini
                </label>
              </div>

              {formData.logSession && (
                <div className="space-y-4 pl-2 border-l-2 border-amber-500/40 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        Durasi Sesi (Menit) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="720"
                        step="5"
                        name="durationMinutes"
                        value={formData.durationMinutes}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        style={{ 
                          backgroundColor: 'var(--input-bg)', 
                          borderColor: 'var(--border-color)', 
                          color: 'var(--text-primary)' 
                        }}
                      />
                      <div className="flex gap-1.5 mt-2">
                        {[15, 30, 45, 60, 120].map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, durationMinutes: m }))}
                            className="px-2 py-0.5 text-xs rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium"
                          >
                            +{m}m
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        Tanggal Sesi Kerja
                      </label>
                      <input
                        type="date"
                        name="sessionDate"
                        value={formData.sessionDate}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        style={{ 
                          backgroundColor: 'var(--input-bg)', 
                          borderColor: 'var(--border-color)', 
                          color: 'var(--text-primary)' 
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Catatan Aktivitas Sesi
                    </label>
                    <textarea
                      name="sessionNotes"
                      rows={2}
                      value={formData.sessionNotes}
                      onChange={handleChange}
                      placeholder="Jelaskan ringkasan pekerjaan yang diselesaikan pada sesi ini..."
                      className="w-full px-4 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      style={{ 
                        backgroundColor: 'var(--input-bg)', 
                        borderColor: 'var(--border-color)', 
                        color: 'var(--text-primary)' 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Controls */}
          <div 
            className="flex items-center justify-end space-x-3 pt-4 border-t"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all transform active:scale-95 disabled:opacity-50"
              style={{ 
                backgroundColor: formData.logSession ? '#d97706' : 'var(--accent-primary)',
                boxShadow: formData.logSession ? '0 10px 20px -5px rgba(217, 119, 6, 0.4)' : 'var(--accent-glow)' 
              }}
            >
              {loading ? (
                <span>Menyimpan...</span>
              ) : formData.logSession ? (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Simpan Terpadu (Tugas + Sesi)</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Tugas</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
