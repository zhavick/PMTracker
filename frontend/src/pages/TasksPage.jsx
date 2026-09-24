import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutGrid, 
  Kanban, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  FolderKanban,
  SlidersHorizontal,
  X,
  FileSpreadsheet,
  Download,
  Users,
  Trash2,
  CheckSquare
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import TaskTableGrid from '../components/tasks/TaskTableGrid';
import TaskKanbanBoard from '../components/tasks/TaskKanbanBoard';
import TaskFormModal from '../components/tasks/TaskFormModal';
import TaskImportModal from '../components/tasks/TaskImportModal';
import TaskDetailDrawer from '../components/tasks/TaskDetailDrawer';

export default function TasksPage() {
  // USER SPECIFICATION: Grid view is the default view
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'kanban'
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Bulk Selection State
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState('');

  // Pagination (Grid view)
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);

  // Modals & Drawer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskForDetail, setTaskForDetail] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const fetchTasks = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const params = {
        page,
        pageSize,
        parentOnly: false // Load tasks for grid/kanban
      };
      if (search.trim()) params.search = search.trim();
      if (selectedProject) params.projectId = selectedProject;
      if (selectedAssignee) params.assignedToUserId = selectedAssignee;
      if (selectedStatus !== '') params.status = selectedStatus;
      if (selectedPriority !== '') params.priority = selectedPriority;
      if (selectedMilestone) params.milestone = selectedMilestone;

      const res = await axiosClient.get('/api/tasks', { params });
      const raw = res?.data?.data ?? res?.data ?? res;
      const taskList = raw?.items ?? (Array.isArray(raw) ? raw : []);
      const totalCount = raw?.totalItems ?? taskList.length;
      setTasks(taskList);
      setTotalItems(totalCount);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, pageSize, search, selectedProject, selectedAssignee, selectedStatus, selectedPriority, selectedMilestone]);

  const fetchMetadata = async () => {
    try {
      const [projRes, memRes] = await Promise.all([
        axiosClient.get('/api/projects'),
        axiosClient.get('/api/members')
      ]);

      const pRaw = projRes?.data?.data ?? projRes?.data ?? projRes;
      const pList = Array.isArray(pRaw) ? pRaw : (pRaw?.items || []);
      setProjects(pList);

      const mRaw = memRes?.data?.data ?? memRes?.data ?? memRes;
      const mList = Array.isArray(mRaw) ? mRaw : (mRaw?.items || []);
      setMembers(mList);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleUnifiedSave = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleViewTaskDetail = (task) => {
    setTaskForDetail(task);
    setIsDetailDrawerOpen(true);
  };

  const handleAddNew = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedProject) params.projectId = selectedProject;
      if (selectedAssignee) params.assignedToUserId = selectedAssignee;
      if (selectedStatus !== '') params.status = selectedStatus;
      if (selectedPriority !== '') params.priority = selectedPriority;
      if (selectedMilestone) params.milestone = selectedMilestone;

      const response = await axiosClient.get('/api/tasks/export-excel', {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Daftar_Tugas_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export tasks to Excel:', err);
      alert('Gagal mengekspor data tugas ke Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleToggleSelectTask = (taskId) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleToggleSelectAll = () => {
    const pageTaskIds = tasks.map(t => t.id);
    const isAllSelected = pageTaskIds.length > 0 && pageTaskIds.every(id => selectedTaskIds.includes(id));
    if (isAllSelected) {
      setSelectedTaskIds(prev => prev.filter(id => !pageTaskIds.includes(id)));
    } else {
      setSelectedTaskIds(prev => Array.from(new Set([...prev, ...pageTaskIds])));
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (newStatus === '' || selectedTaskIds.length === 0) return;
    try {
      setIsBulkActionLoading(true);
      await axiosClient.post('/api/tasks/bulk-update', {
        taskIds: selectedTaskIds,
        status: parseInt(newStatus, 10)
      });
      setSelectedTaskIds([]);
      fetchTasks(true);
    } catch (err) {
      console.error('Bulk update status failed:', err);
      alert('Gagal memperbarui status tugas terpilih.');
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkPriorityChange = async (newPriority) => {
    if (newPriority === '' || selectedTaskIds.length === 0) return;
    try {
      setIsBulkActionLoading(true);
      await axiosClient.post('/api/tasks/bulk-update', {
        taskIds: selectedTaskIds,
        priority: parseInt(newPriority, 10)
      });
      setSelectedTaskIds([]);
      fetchTasks(true);
    } catch (err) {
      console.error('Bulk update priority failed:', err);
      alert('Gagal memperbarui prioritas tugas terpilih.');
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkAssigneeChange = async (newAssigneeId) => {
    if (newAssigneeId === '' || selectedTaskIds.length === 0) return;
    try {
      setIsBulkActionLoading(true);
      await axiosClient.post('/api/tasks/bulk-update', {
        taskIds: selectedTaskIds,
        assignedToUserId: newAssigneeId === 'unassigned' ? null : newAssigneeId
      });
      setSelectedTaskIds([]);
      fetchTasks(true);
    } catch (err) {
      console.error('Bulk assign failed:', err);
      alert('Gagal mengubah PIC tugas terpilih.');
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return;
    if (!window.confirm(`Yakin ingin menghapus ${selectedTaskIds.length} tugas yang dipilih? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      setIsBulkActionLoading(true);
      await axiosClient.post('/api/tasks/bulk-delete', {
        taskIds: selectedTaskIds
      });
      setSelectedTaskIds([]);
      fetchTasks(true);
    } catch (err) {
      console.error('Bulk delete failed:', err);
      alert('Gagal menghapus tugas terpilih.');
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkExport = async () => {
    if (selectedTaskIds.length === 0) return;
    try {
      setIsExporting(true);
      const res = await axiosClient.get(`/api/tasks/export-excel?ids=${selectedTaskIds.join(',')}`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data || res], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Daftar_Tugas_Terpilih_${selectedTaskIds.length}_items.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Bulk export failed:', err);
      alert('Gagal mengekspor tugas terpilih.');
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedProject('');
    setSelectedAssignee('');
    setSelectedStatus('');
    setSelectedPriority('');
    setSelectedMilestone('');
    setPage(1);
  };

  // Metrics
  const totalTasks = totalItems || tasks.length;
  const completedTasks = tasks.filter(t => t.status === 2).length;
  const inProgressTasks = tasks.filter(t => t.status === 1).length;
  const totalSeconds = tasks.reduce((sum, t) => sum + (t.totalSecondsSpent || 0), 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Daftar Tugas & Pelacakan Kerja
            </h1>
            <button
              onClick={() => fetchTasks(true)}
              className={`p-1.5 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition-all ${
                refreshing ? 'animate-spin' : ''
              }`}
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              title="Perbarui Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Pelacakan tugas tim, milestone SDLC Waterfall, dan pencatatan jam kerja otomatis.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Toggle: Grid (Default) vs Kanban */}
          <div 
            className="flex p-1 rounded-xl border shadow-sm"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{ color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)' }}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Table Grid</span>
            </button>

            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              style={{ color: viewMode === 'kanban' ? '#fff' : 'var(--text-secondary)' }}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border shadow-sm transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
            title="Ekspor daftar tugas yang tersaring ke berkas Excel (.xlsx)"
          >
            <Download className={`w-4 h-4 text-blue-500 ${isExporting ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">{isExporting ? 'Mengekspor...' : 'Ekspor Excel'}</span>
          </button>

          {/* Import Excel Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border shadow-sm transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
            title="Impor Tugas dari Berkas Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Impor Excel</span>
          </button>

          {/* Add New Task Button */}
          <button
            onClick={handleAddNew}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md transition-all transform active:scale-95"
            style={{ backgroundColor: 'var(--accent-primary)', boxShadow: 'var(--accent-glow)' }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Tugas</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div 
          className="p-4 rounded-2xl border shadow-sm flex items-center space-x-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Total Tugas</div>
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalTasks}</div>
          </div>
        </div>

        <div 
          className="p-4 rounded-2xl border shadow-sm flex items-center space-x-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Dalam Pengerjaan</div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{inProgressTasks}</div>
          </div>
        </div>

        <div 
          className="p-4 rounded-2xl border shadow-sm flex items-center space-x-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Selesai (Done)</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{completedTasks}</div>
          </div>
        </div>

        <div 
          className="p-4 rounded-2xl border shadow-sm flex items-center space-x-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Waktu Tercatat</div>
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalHours} Jam</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div 
        className="p-4 rounded-2xl border shadow-sm space-y-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Cari judul, kendala, atau solusi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Project Filter */}
          <div>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              <option value="">Semua Proyek ({projects.length})</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Assignee / PIC Filter */}
          <div>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              <option value="">Semua PIC / Anggota</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.fullName || m.userName}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              <option value="">Semua Status</option>
              <option value="0">📋 To Do</option>
              <option value="1">🔄 In Progress</option>
              <option value="4">🔍 In Review</option>
              <option value="2">✅ Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              <option value="">Semua Prioritas</option>
              <option value="0">🟢 Low</option>
              <option value="1">🔵 Medium</option>
              <option value="2">🟠 High</option>
              <option value="3">🔴 Critical</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button if any filter active */}
        {(search || selectedProject || selectedAssignee || selectedStatus !== '' || selectedPriority !== '' || selectedMilestone) && (
          <div className="flex items-center justify-between pt-2 border-t text-xs" style={{ borderColor: 'var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Menyaring hasil pencarian</span>
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 text-rose-500 hover:text-rose-600 font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* Main View: Grid View (Default) or Kanban View */}
      {viewMode === 'grid' ? (
        <TaskTableGrid
          tasks={tasks}
          loading={loading}
          onEditTask={handleEditTask}
          onUnifiedSave={handleUnifiedSave}
          onViewTaskDetail={handleViewTaskDetail}
          onTaskUpdated={() => fetchTasks(true)}
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          selectedTaskIds={selectedTaskIds}
          onToggleSelectTask={handleToggleSelectTask}
          onToggleSelectAll={handleToggleSelectAll}
        />
      ) : (
        <TaskKanbanBoard
          tasks={tasks}
          loading={loading}
          onEditTask={handleEditTask}
          onUnifiedSave={handleUnifiedSave}
          onTaskUpdated={() => fetchTasks(true)}
          onAddNewTask={handleAddNew}
        />
      )}

      {/* Sticky / Floating Bulk Action Toolbar */}
      {selectedTaskIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900/95 dark:bg-gray-800/95 text-white backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-fade-in flex-wrap max-w-full">
          <div className="flex items-center gap-2 pr-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {selectedTaskIds.length}
            </span>
            <span className="text-xs font-bold whitespace-nowrap">Tugas Dipilih</span>
          </div>

          <div className="h-5 w-px bg-white/20 hidden sm:block" />

          {/* Bulk Status Update */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-300 whitespace-nowrap">Status:</span>
            <select 
              disabled={isBulkActionLoading}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleBulkStatusChange(e.target.value);
                e.target.value = "";
              }}
              className="text-xs font-semibold bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white focus:outline-none cursor-pointer"
            >
              <option value="" className="text-gray-900">Ubah Status...</option>
              <option value="0" className="text-gray-900">📋 To Do</option>
              <option value="1" className="text-gray-900">🔄 In Progress</option>
              <option value="4" className="text-gray-900">🔍 In Review</option>
              <option value="2" className="text-gray-900">✅ Completed</option>
            </select>
          </div>

          {/* Bulk Priority Update */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-300 whitespace-nowrap">Prioritas:</span>
            <select 
              disabled={isBulkActionLoading}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleBulkPriorityChange(e.target.value);
                e.target.value = "";
              }}
              className="text-xs font-semibold bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white focus:outline-none cursor-pointer"
            >
              <option value="" className="text-gray-900">Ubah Prioritas...</option>
              <option value="0" className="text-gray-900">🟢 Low</option>
              <option value="1" className="text-gray-900">🔵 Medium</option>
              <option value="2" className="text-gray-900">🟠 High</option>
              <option value="3" className="text-gray-900">🔴 Critical</option>
            </select>
          </div>

          {/* Bulk PIC Assign */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-300 whitespace-nowrap">PIC:</span>
            <select 
              disabled={isBulkActionLoading}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleBulkAssigneeChange(e.target.value);
                e.target.value = "";
              }}
              className="text-xs font-semibold bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-white focus:outline-none cursor-pointer max-w-[130px]"
            >
              <option value="" className="text-gray-900">Tugaskan PIC...</option>
              <option value="unassigned" className="text-gray-900">❌ Kosongkan PIC</option>
              {members.map(m => (
                <option key={m.id} value={m.id} className="text-gray-900">{m.fullName}</option>
              ))}
            </select>
          </div>

          <div className="h-5 w-px bg-white/20 hidden sm:block" />

          {/* Bulk Export Excel Button */}
          <button
            type="button"
            disabled={isExporting}
            onClick={handleBulkExport}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 text-white cursor-pointer"
            title="Ekspor tugas yang dipilih ke file Excel"
          >
            <Download size={13} />
            <span>Ekspor ({selectedTaskIds.length})</span>
          </button>

          {/* Bulk Delete Button */}
          <button
            type="button"
            disabled={isBulkActionLoading}
            onClick={handleBulkDelete}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 text-white cursor-pointer"
            title="Hapus tugas yang dipilih"
          >
            <Trash2 size={13} />
            <span>Hapus</span>
          </button>

          {/* Cancel selection */}
          <button
            type="button"
            onClick={() => setSelectedTaskIds([])}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Batalkan pilihan"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={taskForDetail}
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        onEdit={(task) => {
          setIsDetailDrawerOpen(false);
          handleEditTask(task);
        }}
      />

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => fetchTasks(true)}
        taskToEdit={taskToEdit}
      />

      {/* Excel Import Modal */}
      <TaskImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => fetchTasks(true)}
      />
    </div>
  );
}
