import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Briefcase, 
  Tag, 
  Play, 
  Edit3, 
  FileText, 
  Layers, 
  ShieldAlert, 
  Lightbulb,
  ExternalLink,
  Mail
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useTimer } from '../../context/TimerContext';

const STATUS_MAP = {
  0: { label: 'To Do', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)' },
  1: { label: 'In Progress', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
  4: { label: 'In Review', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
  2: { label: 'Completed / Done', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  3: { label: 'Overdue', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' }
};

const PRIORITY_MAP = {
  0: { label: 'Low', color: '#6B7280' },
  1: { label: 'Medium', color: '#3B82F6' },
  2: { label: 'High', color: '#F59E0B' },
  3: { label: 'Critical', color: '#EF4444' }
};

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0j 0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h} Jam ${m} Menit`;
}

export default function TaskDetailDrawer({ task, isOpen, onClose, onEdit }) {
  const { startTimer, activeTimers } = useTimer();
  const [currentTask, setCurrentTask] = useState(task);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (task) {
      setCurrentTask(task);
    }
    if (isOpen && task?.id) {
      setLoadingDetail(true);
      axiosClient.get(`/api/tasks/${task.id}`)
        .then(res => {
          const fresh = res?.data?.data || res?.data;
          if (fresh) setCurrentTask(fresh);
        })
        .catch(err => {
          console.error('Failed to load fresh task details:', err);
        })
        .finally(() => {
          setLoadingDetail(false);
        });
    }
  }, [isOpen, task?.id]);

  if (!isOpen || !task) return null;

  const activeTask = currentTask || task;
  const isTimerRunning = activeTimers?.some(t => t.taskId === activeTask.id);
  const statusInfo = STATUS_MAP[activeTask.status] || STATUS_MAP[0];
  const priorityInfo = PRIORITY_MAP[activeTask.priority] || PRIORITY_MAP[1];
  const isOverdue = activeTask.dueDate && new Date(activeTask.dueDate) < new Date() && activeTask.status !== 2;

  const handleStartTimer = () => {
    startTimer(activeTask.id, activeTask.title, activeTask.projectName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div 
          className="w-screen max-w-xl shadow-2xl flex flex-col justify-between transition-all"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderLeft: '1px solid var(--border-color)',
            color: 'var(--text-primary)' 
          }}
        >
          {/* Header */}
          <div 
            className="p-6 border-b flex items-start justify-between gap-4"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span 
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ 
                    backgroundColor: `${activeTask.projectColor || '#3B82F6'}20`, 
                    color: activeTask.projectColor || '#3B82F6' 
                  }}
                >
                  {activeTask.projectName || 'Tanpa Proyek'}
                </span>

                <span 
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                >
                  {statusInfo.label}
                </span>

                <span 
                  className="px-2.5 py-1 rounded-full text-xs font-bold bg-black/5 dark:bg-white/10"
                  style={{ color: priorityInfo.color }}
                >
                  Prioritas {priorityInfo.label}
                </span>
              </div>

              <h2 className="text-xl font-black leading-snug tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {activeTask.title}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition-all text-gray-500 hover:text-gray-900 dark:hover:text-white shrink-0"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
            
            {/* Progress Section */}
            <div 
              className="p-4 rounded-2xl border space-y-2"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>Progres Penyelesaian</span>
                <span style={{ color: activeTask.progress === 100 ? '#10B981' : 'var(--accent-primary)' }}>
                  {activeTask.progress || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${activeTask.progress || 0}%`,
                    backgroundColor: activeTask.progress === 100 ? '#10B981' : 'var(--accent-primary)'
                  }}
                />
              </div>
            </div>

            {/* Assignee & Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* PIC */}
              <div 
                className="p-4 rounded-2xl border space-y-1.5"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-secondary)' }}>
                  Penanggung Jawab (PIC)
                </span>
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0"
                    style={{ backgroundColor: activeTask.projectColor || 'var(--accent-primary, #3B82F6)' }}
                  >
                    {(activeTask.assignedToName || activeTask.assignedToEmail || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs leading-snug truncate" style={{ color: 'var(--text-primary)' }} title={activeTask.assignedToName}>
                      {activeTask.assignedToName || activeTask.assignedToEmail || 'Belum Ditugaskan'}
                    </div>
                    <div className="text-[11px] opacity-75 truncate" style={{ color: 'var(--text-secondary)' }}>
                      {activeTask.assignedToJobTitle || (activeTask.assignedToName ? 'Anggota Tim' : 'Belum Ada PIC')}
                    </div>
                    {activeTask.assignedToEmail && activeTask.assignedToEmail !== activeTask.assignedToName && (
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate mt-0.5">
                        <Mail size={11} className="shrink-0" />
                        <span className="truncate">{activeTask.assignedToEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Milestone */}
              <div 
                className="p-4 rounded-2xl border space-y-1.5"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-secondary)' }}>
                  SDLC Milestone
                </span>
                <div className="flex items-center gap-2 font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                  <Layers size={16} style={{ color: 'var(--accent-primary)' }} />
                  <span>{activeTask.milestone || 'Implementation'}</span>
                </div>
                <div className="text-[11px] opacity-70" style={{ color: 'var(--text-secondary)' }}>
                  Waterfall Phase
                </div>
              </div>

              {/* Start Date */}
              <div 
                className="p-4 rounded-2xl border space-y-1.5"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-secondary)' }}>
                  Tanggal Mulai
                </span>
                <div className="flex items-center gap-2 font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                  <Calendar size={16} style={{ color: '#3B82F6' }} />
                  <span>{formatDate(activeTask.startDate)}</span>
                </div>
              </div>

              {/* Due Date */}
              <div 
                className="p-4 rounded-2xl border space-y-1.5"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-secondary)' }}>
                    Tenggat Waktu
                  </span>
                  {isOverdue && (
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                      Terlambat
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 font-bold text-xs" style={{ color: isOverdue ? '#EF4444' : 'var(--text-primary)' }}>
                  <Clock size={16} style={{ color: isOverdue ? '#EF4444' : '#F59E0B' }} />
                  <span>{formatDate(activeTask.dueDate)}</span>
                </div>
              </div>
            </div>

            {/* Description & Metadata */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Deskripsi & Rincian Modul
              </h3>
              <div 
                className="p-4 rounded-2xl border leading-relaxed text-xs sm:text-sm whitespace-pre-wrap"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                {activeTask.description ? activeTask.description : 'Tidak ada keterangan tambahan pada tugas ini.'}
              </div>
            </div>

            {/* Obstacles & Solutions - Always Visible Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Catatan Kendala & Solusi Teknis
                </h3>
                {(activeTask.obstacle || activeTask.solution) ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Terdapat Catatan
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Lancar
                  </span>
                )}
              </div>
              
              {activeTask.obstacle ? (
                <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-1.5 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                    <ShieldAlert size={15} />
                    <span>Kendala yang Dihadapi:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-rose-950 dark:text-rose-100 whitespace-pre-wrap leading-relaxed">
                    {activeTask.obstacle}
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Tidak Ada Kendala Dilaporkan
                    </div>
                    <div className="text-[11px] opacity-70" style={{ color: 'var(--text-secondary)' }}>
                      Pengerjaan tugas berjalan lancar tanpa hambatan teknis.
                    </div>
                  </div>
                </div>
              )}

              {activeTask.solution && (
                <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-1.5 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Lightbulb size={15} />
                    <span>Solusi / Tindak Lanjut:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-100 whitespace-pre-wrap leading-relaxed">
                    {activeTask.solution}
                  </p>
                </div>
              )}
            </div>

            {/* Work Time Summary */}
            <div 
              className="p-4 rounded-2xl border flex items-center justify-between"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Total Waktu Kerja Tercatat
                  </div>
                  <div className="text-[11px] opacity-70" style={{ color: 'var(--text-secondary)' }}>
                    Akumulasi sesi timesheet
                  </div>
                </div>
              </div>
              <div className="text-sm font-black" style={{ color: 'var(--accent-primary)' }}>
                {formatDuration(activeTask.totalSecondsSpent)}
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div 
            className="p-6 border-t flex items-center justify-between gap-3"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <button
              onClick={handleStartTimer}
              disabled={isTimerRunning}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all ${
                isTimerRunning 
                  ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
              }`}
            >
              <Play size={15} className={isTimerRunning ? 'animate-pulse' : ''} />
              <span>{isTimerRunning ? 'Timer Sedang Berjalan' : 'Mulai Timer'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onEdit(activeTask);
                }}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:opacity-95 active:scale-95 flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <Edit3 size={15} />
                <span>Edit Tugas</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
