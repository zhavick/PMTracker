import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Trash2, 
  Zap, 
  Calendar, 
  Folder, 
  ChevronDown, 
  ChevronRight, 
  User as UserIcon,
  HelpCircle,
  MoreVertical,
  Eye
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const STATUS_CONFIG = {
  0: { label: 'To Do', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20' },
  1: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  4: { label: 'In Review', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  2: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' }
};

const PRIORITY_CONFIG = {
  0: { label: 'Low', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  1: { label: 'Medium', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  2: { label: 'High', color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  3: { label: 'Critical', color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' }
};

function formatSeconds(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '0j 0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}j ${minutes}m`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TaskTableGrid({ 
  tasks = [], 
  loading = false, 
  onEditTask, 
  onUnifiedSave, 
  onTaskUpdated,
  onViewTaskDetail,
  page = 1,
  pageSize = 20,
  totalItems = 0,
  onPageChange,
  selectedTaskIds = [],
  onToggleSelectTask,
  onToggleSelectAll
}) {
  const [activeObstacleTask, setActiveObstacleTask] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const handleQuickStatusChange = async (task, newStatus) => {
    try {
      setUpdatingTaskId(task.id);
      await axiosClient.put(`/api/tasks/${task.id}/status`, {
        status: parseInt(newStatus, 10)
      });
      onTaskUpdated?.();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Yakin ingin menghapus tugas: "${task.title}"?`)) return;
    try {
      await axiosClient.delete(`/api/tasks/${task.id}`);
      onTaskUpdated?.();
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert('Gagal menghapus tugas.');
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Memuat daftar tugas...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div 
        className="py-16 text-center rounded-2xl border flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <Folder className="w-12 h-12 mb-3 text-gray-400 opacity-60" />
        <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Tidak Ada Tugas Ditemukan</h3>
        <p className="text-sm max-w-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Belum ada tugas yang cocok dengan filter aktif atau belum ada tugas yang ditambahkan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Obstacle Tooltip/Modal Overlay */}
      {activeObstacleTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                Kendala & Solusi Teknis
              </h3>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">
                  Kendala:
                </span>
                <p style={{ color: 'var(--text-primary)' }}>{activeObstacleTask.obstacle || 'Tidak ada catatan kendala.'}</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                  Solusi / Rencana:
                </span>
                <p style={{ color: 'var(--text-primary)' }}>{activeObstacleTask.solution || 'Belum ada solusi yang dicatat.'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveObstacleTask(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP TABLE VIEW (>= 768px) */}
      <div 
        className="hidden md:block overflow-hidden rounded-2xl border shadow-sm transition-all"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr 
                className="text-xs font-bold uppercase tracking-wider border-b select-none"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                <th className="py-3.5 px-3 w-10 text-center">
                  <input 
                    type="checkbox" 
                    checked={tasks.length > 0 && tasks.every(t => selectedTaskIds.includes(t.id))}
                    onChange={onToggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title="Pilih Semua di Halaman Ini"
                  />
                </th>
                <th className="py-3.5 px-4 min-w-[280px]">Tugas</th>
                <th className="py-3.5 px-4">Proyek / Milestone</th>
                <th className="py-3.5 px-3">PIC / Anggota</th>
                <th className="py-3.5 px-3">Prioritas</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3 w-36">Progress</th>
                <th className="py-3.5 px-3">Kendala</th>
                <th className="py-3.5 px-3">Durasi</th>
                <th className="py-3.5 px-3">Batas Waktu</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm" style={{ borderColor: 'var(--border-color)' }}>
              {tasks.map((task) => {
                const statusInfo = STATUS_CONFIG[task.status] || STATUS_CONFIG[0];
                const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG[1];
                const hasObstacle = Boolean(task.obstacle);
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 2;
                const isSelected = selectedTaskIds.includes(task.id);

                return (
                  <tr 
                    key={task.id} 
                    className={`transition-colors ${
                      isSelected 
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40' 
                        : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Row Checkbox */}
                    <td className="py-4 px-3 text-center align-top" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => onToggleSelectTask?.(task.id)}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-1"
                      />
                    </td>

                    {/* Title with full text wrapping */}
                    <td className="py-4 px-4 font-medium min-w-[280px] max-w-lg align-top">
                      <div className="flex flex-col space-y-1">
                        <span 
                          className="font-semibold text-sm leading-relaxed whitespace-normal break-words hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                          onClick={() => onEditTask(task)}
                          title="Klik untuk edit tugas"
                        >
                          {task.title}
                        </span>
                        {task.subtaskCount > 0 && (
                          <span className="text-xs text-indigo-500 font-medium">
                            Subtask: {task.subtasksCompletedCount}/{task.subtaskCount} selesai
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Project & Milestone */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex flex-col space-y-1">
                        {task.projectName ? (
                          <span 
                            className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full w-max"
                            style={{ 
                              backgroundColor: `${task.projectColor || '#6366F1'}15`, 
                              color: task.projectColor || '#6366F1' 
                            }}
                          >
                            <span 
                              className="w-1.5 h-1.5 rounded-full mr-1.5" 
                              style={{ backgroundColor: task.projectColor || '#6366F1' }}
                            />
                            {task.projectName}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Umum</span>
                        )}
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {task.milestone || 'Implementation'}
                        </span>
                      </div>
                    </td>

                    {/* Assignee / PIC */}
                    <td className="py-4 px-3 align-top">
                      {task.assignedToName ? (
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-xs mt-0.5"
                            style={{ backgroundColor: task.projectColor || '#3B82F6' }}
                          >
                            {task.assignedToName.charAt(0)}
                          </div>
                          <span className="text-xs font-semibold whitespace-normal break-words max-w-[120px]" style={{ color: 'var(--text-primary)' }} title={task.assignedToName}>
                            {task.assignedToName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="py-4 px-3 align-top">
                      <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${priorityInfo.color}`}>
                        {priorityInfo.label}
                      </span>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-4 px-3 align-top">
                      <select
                        value={task.status}
                        disabled={updatingTaskId === task.id}
                        onChange={(e) => handleQuickStatusChange(task, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 ${statusInfo.color}`}
                        style={{ backgroundColor: 'var(--input-bg)' }}
                      >
                        <option value={0}>📋 To Do</option>
                        <option value={1}>🔄 In Progress</option>
                        <option value={4}>🔍 In Review</option>
                        <option value={2}>✅ Completed</option>
                      </select>
                    </td>

                    {/* Progress Slider Bar */}
                    <td className="py-4 px-3 align-top">
                      <div className="w-full space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span style={{ color: 'var(--text-secondary)' }}>{task.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              task.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Obstacle Icon Tooltip */}
                    <td className="py-4 px-3 align-top">
                      {hasObstacle ? (
                        <button
                          type="button"
                          onClick={() => setActiveObstacleTask(task)}
                          className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition-colors"
                          title="Klik untuk melihat kendala dan solusi"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                          <span>Kendala</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>

                    {/* Duration Logged */}
                    <td className="py-4 px-3 text-xs font-semibold align-top" style={{ color: 'var(--text-primary)' }}>
                      <span className="inline-flex items-center space-x-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{formatSeconds(task.totalSecondsSpent)}</span>
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className="py-4 px-3 text-xs align-top">
                      <span className={`font-medium ${isOverdue ? 'text-rose-500 font-bold' : ''}`} style={{ color: isOverdue ? undefined : 'var(--text-secondary)' }}>
                        {formatDate(task.dueDate)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right align-top">
                      <div className="inline-flex items-center space-x-1">
                        {/* View Detail Drawer */}
                        <button
                          type="button"
                          onClick={() => onViewTaskDetail ? onViewTaskDetail(task) : onEditTask(task)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-500/10 transition-colors"
                          title="Lihat Detail & Deskripsi Lengkap"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Unified Save Quick Button */}
                        <button
                          type="button"
                          onClick={() => onUnifiedSave(task)}
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-500/10 transition-colors"
                          title="⚡ Simpan Terpadu (Task + Log Sesi)"
                        >
                          <Zap className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => onEditTask(task)}
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-500/10 transition-colors"
                          title="Edit Rincian Tugas"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete(task)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors"
                          title="Hapus Tugas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE RESPONSIVE CARDS VIEW (< 768px) */}
      <div className="block md:hidden space-y-3">
        {tasks.map((task) => {
          const statusInfo = STATUS_CONFIG[task.status] || STATUS_CONFIG[0];
          const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG[1];
          const hasObstacle = Boolean(task.obstacle);
          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 2;

          return (
            <div
              key={task.id}
              className="p-4 rounded-2xl border shadow-sm space-y-3 transition-all"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <input 
                    type="checkbox" 
                    checked={selectedTaskIds.includes(task.id)}
                    onChange={() => onToggleSelectTask?.(task.id)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-0.5 shrink-0"
                  />
                  <div>
                    <h4 
                      className="font-bold text-sm leading-relaxed whitespace-normal break-words cursor-pointer hover:text-indigo-500"
                      style={{ color: 'var(--text-primary)' }}
                      onClick={() => onEditTask(task)}
                    >
                      {task.title}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      {task.projectName && (
                        <span 
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${task.projectColor || '#6366F1'}15`, color: task.projectColor || '#6366F1' }}
                        >
                          {task.projectName}
                        </span>
                      )}
                      <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {task.milestone}
                      </span>
                    </div>
                  </div>
                </div>

                <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${priorityInfo.color}`}>
                  {priorityInfo.label}
                </span>
              </div>

              {/* Progress & Status Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{task.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${task.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>

              {/* Status and Info Footer */}
              <div className="flex items-center justify-between pt-2 border-t text-xs" style={{ borderColor: 'var(--border-color)' }}>
                <select
                  value={task.status}
                  disabled={updatingTaskId === task.id}
                  onChange={(e) => handleQuickStatusChange(task, e.target.value)}
                  className={`text-xs font-bold px-2 py-1 rounded-full border cursor-pointer ${statusInfo.color}`}
                  style={{ backgroundColor: 'var(--input-bg)' }}
                >
                  <option value={0}>📋 To Do</option>
                  <option value={1}>🔄 In Progress</option>
                  <option value={4}>🔍 Review</option>
                  <option value={2}>✅ Completed</option>
                </select>

                <div className="flex items-center space-x-3">
                  <span className="flex items-center space-x-1 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatSeconds(task.totalSecondsSpent)}</span>
                  </span>

                  {hasObstacle && (
                    <button
                      type="button"
                      onClick={() => setActiveObstacleTask(task)}
                      className="p-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onUnifiedSave(task)}
                    className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600"
                    title="Unified Save"
                  >
                    <Zap className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditTask(task)}
                    className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div 
          className="flex items-center justify-between px-4 py-3 rounded-2xl border"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
        >
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Menampilkan halaman <span className="font-bold text-indigo-600">{page}</span> dari <span className="font-bold">{totalPages}</span> ({totalItems} total tugas)
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-40"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              Sebelumnya
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-40"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
