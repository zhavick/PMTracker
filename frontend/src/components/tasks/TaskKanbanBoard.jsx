import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Edit3, 
  Zap, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  Folder 
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const COLUMNS = [
  { id: 0, title: 'To Do', color: 'border-slate-500/30 text-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
  { id: 1, title: 'In Progress', color: 'border-blue-500/30 text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
  { id: 4, title: 'In Review', color: 'border-amber-500/30 text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
  { id: 2, title: 'Completed', color: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' }
];

const PRIORITY_BADGES = {
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

export default function TaskKanbanBoard({ 
  tasks = [], 
  loading = false, 
  onEditTask, 
  onUnifiedSave, 
  onTaskUpdated,
  onAddNewTask 
}) {
  const [mobileActiveColumn, setMobileActiveColumn] = useState(0);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [movingTaskId, setMovingTaskId] = useState(null);

  // Group tasks by column
  const groupedTasks = {
    0: tasks.filter(t => t.status === 0),
    1: tasks.filter(t => t.status === 1),
    4: tasks.filter(t => t.status === 4),
    2: tasks.filter(t => t.status === 2 || t.status === 3) // treat overdue/done accordingly
  };

  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskIdStr) return;

    const taskId = parseInt(taskIdStr, 10);
    setDraggedTaskId(null);

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    try {
      setMovingTaskId(taskId);
      await axiosClient.put(`/api/tasks/${taskId}/status`, {
        status: targetStatus
      });
      onTaskUpdated?.();
    } catch (err) {
      console.error('Failed to move task:', err);
    } finally {
      setMovingTaskId(null);
    }
  };

  const handleStepStatus = async (task, direction) => {
    const statusOrder = [0, 1, 4, 2];
    const currentIndex = statusOrder.indexOf(task.status);
    if (currentIndex === -1) return;

    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= statusOrder.length) return;

    const newStatus = statusOrder[newIndex];
    try {
      setMovingTaskId(task.id);
      await axiosClient.put(`/api/tasks/${task.id}/status`, {
        status: newStatus
      });
      onTaskUpdated?.();
    } catch (err) {
      console.error('Failed to step status:', err);
    } finally {
      setMovingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Memuat papan Kanban...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* MOBILE SEGMENTED SWITCHER PILL BAR (< 768px, FSD 5.6) */}
      <div 
        className="flex md:hidden p-1.5 rounded-2xl border overflow-x-auto gap-1 shadow-sm"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        {COLUMNS.map(col => {
          const count = (groupedTasks[col.id] || []).length;
          const isActive = mobileActiveColumn === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setMobileActiveColumn(col.id)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{ color: isActive ? '#fff' : 'var(--text-secondary)' }}
            >
              <span className={`w-2 h-2 rounded-full ${col.dot}`} />
              <span>{col.title}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* KANBAN COLUMNS CONTAINER */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const colTasks = groupedTasks[col.id] || [];
          const isMobileVisible = mobileActiveColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col rounded-2xl border transition-all min-h-[500px] ${
                !isMobileVisible ? 'hidden md:flex' : 'flex'
              }`}
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
            >
              {/* Column Header */}
              <div 
                className="p-3.5 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {col.title}
                  </h3>
                  <span 
                    className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {col.id === 0 && (
                  <button
                    type="button"
                    onClick={onAddNewTask}
                    className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 hover:text-indigo-600 transition-colors"
                    title="Tambah Tugas di kolom To Do"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Tasks List in Column */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div 
                    className="h-36 rounded-xl border border-dashed flex flex-col items-center justify-center p-4 text-center opacity-60"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Tarik & letakkan kartu ke kolom ini
                    </p>
                  </div>
                ) : (
                  colTasks.map(task => {
                    const priorityInfo = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES[1];
                    const hasObstacle = Boolean(task.obstacle);
                    const isMoving = movingTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className={`p-3.5 rounded-xl border shadow-sm space-y-2.5 cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:border-indigo-500/40 ${
                          isMoving ? 'opacity-40 scale-95' : ''
                        }`}
                        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                      >
                        {/* Tags and Priority */}
                        <div className="flex items-center justify-between gap-1">
                          {task.projectName ? (
                            <span 
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full truncate max-w-[130px]"
                              style={{ 
                                backgroundColor: `${task.projectColor || '#6366F1'}15`, 
                                color: task.projectColor || '#6366F1' 
                              }}
                            >
                              {task.projectName}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">Umum</span>
                          )}

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 
                          className="font-bold text-sm line-clamp-2 leading-snug cursor-pointer hover:text-indigo-500"
                          style={{ color: 'var(--text-primary)' }}
                          onClick={() => onEditTask(task)}
                        >
                          {task.title}
                        </h4>

                        {/* Obstacle Indicator */}
                        {hasObstacle && (
                          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center space-x-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 animate-bounce" />
                            <span className="line-clamp-1 text-[11px] font-medium">{task.obstacle}</span>
                          </div>
                        )}

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[11px] font-semibold">
                            <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
                            <span className="text-indigo-600 dark:text-indigo-400">{task.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${task.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Footer Info & Move Buttons */}
                        <div className="flex items-center justify-between pt-2 border-t text-xs" style={{ borderColor: 'var(--border-color)' }}>
                          <span className="flex items-center space-x-1 text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            <Clock className="w-3 h-3" />
                            <span>{formatSeconds(task.totalSecondsSpent)}</span>
                          </span>

                          <div className="flex items-center space-x-1">
                            {/* Unified Save */}
                            <button
                              type="button"
                              onClick={() => onUnifiedSave(task)}
                              className="p-1 rounded hover:bg-amber-500/10 text-amber-600 transition-colors"
                              title="⚡ Unified Save"
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => onEditTask(task)}
                              className="p-1 rounded hover:bg-indigo-500/10 text-indigo-600 transition-colors"
                              title="Edit Tugas"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Move Left Button */}
                            {col.id !== 0 && (
                              <button
                                type="button"
                                onClick={() => handleStepStatus(task, -1)}
                                className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 transition-colors"
                                title="Pindah ke kolom sebelumnya"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Move Right Button */}
                            {col.id !== 2 && (
                              <button
                                type="button"
                                onClick={() => handleStepStatus(task, 1)}
                                className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 transition-colors"
                                title="Pindah ke kolom berikutnya"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
