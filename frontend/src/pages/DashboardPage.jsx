import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CheckSquare, Clock, AlertTriangle, TrendingUp, 
  Briefcase, Users, Calendar, ArrowRight, Play, CheckCircle2,
  Database, RefreshCw, BarChart3, Layers, UserCheck, Shield,
  BarChart2, List
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();
  const [excludeAdmin, setExcludeAdmin] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    inReviewTasks: 0,
    doneTasks: 0,
    overdueTasks: 0,
    totalProjects: 0,
    totalUsers: 0,
    todayWorkHours: 0,
    totalWorkHoursAllTime: 0,
    overallCompletionRate: 0
  });

  const [teamWorkload, setTeamWorkload] = useState([]);
  const [projectsOverview, setProjectsOverview] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [workloadViewMode, setWorkloadViewMode] = useState('vertical-bar'); // 'vertical-bar' | 'list'
  const [hoveredMember, setHoveredMember] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      const [statsRes, workloadRes, projectsRes, recentRes] = await Promise.all([
        axiosClient.get(`/api/dashboard/stats?excludeAdmin=${excludeAdmin}`),
        axiosClient.get(`/api/dashboard/workload?excludeAdmin=${excludeAdmin}`),
        axiosClient.get('/api/dashboard/projects-overview'),
        axiosClient.get('/api/dashboard/recent-activities')
      ]);

      const sData = statsRes?.data?.data ?? statsRes?.data ?? statsRes;
      if (sData && typeof sData === 'object') {
        setStats(sData);
      }

      const wData = workloadRes?.data?.data ?? workloadRes?.data ?? workloadRes;
      if (Array.isArray(wData)) {
        setTeamWorkload(wData);
      }

      const pData = projectsRes?.data?.data ?? projectsRes?.data ?? projectsRes;
      if (Array.isArray(pData)) {
        setProjectsOverview(pData);
      }

      const rData = recentRes?.data?.data ?? recentRes?.data ?? recentRes;
      if (Array.isArray(rData)) {
        setRecentActivities(rData);
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [excludeAdmin]);

  const statCards = [
    { 
      title: 'Total Tugas Sistem', 
      value: stats.totalTasks, 
      icon: CheckSquare, 
      color: '#3B82F6', 
      desc: `${stats.overallCompletionRate}% Tuntas (${stats.doneTasks} selesai)`,
      badge: `${stats.totalProjects} Proyek`
    },
    { 
      title: 'Sedang Berjalan', 
      value: stats.inProgressTasks + stats.inReviewTasks, 
      icon: Clock, 
      color: '#F59E0B', 
      desc: `${stats.inProgressTasks} In Progress • ${stats.inReviewTasks} Review`,
      badge: 'Aktif'
    },
    { 
      title: 'Tugas Selesai', 
      value: stats.doneTasks, 
      icon: CheckCircle2, 
      color: '#10B981', 
      desc: `Dari ${stats.totalTasks} tugas keseluruhan`,
      badge: `${stats.overallCompletionRate}%`
    },
    { 
      title: 'Tenggat Terlewat', 
      value: stats.overdueTasks, 
      icon: AlertTriangle, 
      color: stats.overdueTasks > 0 ? '#EF4444' : '#6B7280', 
      desc: stats.overdueTasks > 0 ? 'Perlu tindakan segera' : 'Semua tepat waktu',
      badge: stats.overdueTasks > 0 ? 'Perhatian' : 'Aman'
    },
    { 
      title: 'Jam Kerja Hari Ini', 
      value: `${stats.todayWorkHours} Jam`, 
      icon: TrendingUp, 
      color: '#8B5CF6', 
      desc: `Total ${stats.totalWorkHoursAllTime} jam tercatat`,
      badge: 'Multi-Timer'
    }
  ];

  // Filter out administrator when excludeAdmin is enabled
  const displayWorkload = teamWorkload.filter(m => {
    if (!excludeAdmin) return true;
    const isRoleAdmin = m.role && m.role.toLowerCase().includes('admin');
    const isEmailAdmin = m.email && m.email.toLowerCase() === 'admin@trackerkerja.com';
    const isNameAdmin = m.fullName && m.fullName.toLowerCase().includes('administrator');
    return !isRoleAdmin && !isEmailAdmin && !isNameAdmin;
  });

  // Calculate clean Y-axis scale for vertical bar chart
  const rawMax = Math.max(1, ...displayWorkload.map(m => m.totalTasks));
  const yAxisMax = rawMax <= 10 ? 10 : rawMax <= 25 ? 25 : rawMax <= 50 ? 50 : rawMax <= 80 ? 80 : Math.ceil(rawMax / 20) * 20;
  const yTicks = [
    yAxisMax,
    Math.round(yAxisMax * 0.75),
    Math.round(yAxisMax * 0.50),
    Math.round(yAxisMax * 0.25),
    0
  ];
  const chartHeightPx = 220; // Maximum bar height in pixels

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div 
        className="p-6 sm:p-8 rounded-3xl border shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        style={{ 
          backgroundColor: 'var(--bg-card)', 
          borderColor: 'var(--border-color)' 
        }}
      >
        <div className="space-y-2 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--accent-primary)' }}>
            <span>🏢 {user?.companyName || 'PT Elistec Teknologi'}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Shield size={12} /> {user?.role || 'Pengguna'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Selamat Datang, {user?.fullName || 'Pengguna'}!
          </h1>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Sistem mengelola <strong>{stats.totalTasks} tugas</strong> pada <strong>{stats.totalProjects} proyek</strong> aktif dengan <strong>{teamWorkload.length} anggota tim</strong> terdaftar. Pantau progres sprint dan catat aktivitas kerja harian Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 z-10 shrink-0">
          <button
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border font-semibold text-xs transition-all hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 flex items-center gap-1.5"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            title="Muat ulang data analitik"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>
          <Link
            to="/tasks"
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:opacity-95 active:scale-95 flex items-center gap-2"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <CheckSquare size={16} /> Buka Tugas (Grid)
          </Link>
          <Link
            to="/timesheet"
            className="px-4 py-2.5 rounded-xl font-bold text-xs border transition-all hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            <Clock size={16} /> Timesheet
          </Link>
        </div>
      </div>

      {/* 5 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md relative overflow-hidden flex flex-col justify-between"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {card.title}
                </span>
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: card.color }}
                >
                  <Icon size={16} />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline justify-between gap-1">
                  <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                    {loading ? '...' : card.value}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10" style={{ color: card.color }}>
                    {card.badge}
                  </span>
                </div>
                <div className="text-[11px] mt-1 opacity-70 truncate" style={{ color: 'var(--text-secondary)' }}>
                  {card.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Status Progress Breakdown Bar */}
      <div 
        className="p-5 rounded-2xl border shadow-sm space-y-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} style={{ color: 'var(--accent-primary)' }} />
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Distribusi Status Tugas Keseluruhan ({stats.totalTasks} Tugas)
            </h2>
          </div>
          <span className="text-xs font-bold" style={{ color: '#10B981' }}>
            Tingkat Penyelesaian: {stats.overallCompletionRate}%
          </span>
        </div>

        {/* Progress Bar Multi-Segment */}
        <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-800 p-0.5 gap-0.5">
          {stats.totalTasks > 0 ? (
            <>
              <div 
                className="h-full rounded-l-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${(stats.doneTasks / stats.totalTasks) * 100}%` }}
                title={`Selesai: ${stats.doneTasks} (${Math.round((stats.doneTasks / stats.totalTasks) * 100)}%)`}
              />
              <div 
                className="h-full bg-blue-500 transition-all duration-500" 
                style={{ width: `${(stats.inProgressTasks / stats.totalTasks) * 100}%` }}
                title={`In Progress: ${stats.inProgressTasks} (${Math.round((stats.inProgressTasks / stats.totalTasks) * 100)}%)`}
              />
              <div 
                className="h-full bg-indigo-500 transition-all duration-500" 
                style={{ width: `${(stats.inReviewTasks / stats.totalTasks) * 100}%` }}
                title={`Review: ${stats.inReviewTasks} (${Math.round((stats.inReviewTasks / stats.totalTasks) * 100)}%)`}
              />
              <div 
                className="h-full bg-amber-400 transition-all duration-500" 
                style={{ width: `${(stats.todoTasks / stats.totalTasks) * 100}%` }}
                title={`Todo: ${stats.todoTasks} (${Math.round((stats.todoTasks / stats.totalTasks) * 100)}%)`}
              />
              {stats.overdueTasks > 0 && (
                <div 
                  className="h-full rounded-r-full bg-rose-500 transition-all duration-500" 
                  style={{ width: `${(stats.overdueTasks / stats.totalTasks) * 100}%` }}
                  title={`Overdue: ${stats.overdueTasks} (${Math.round((stats.overdueTasks / stats.totalTasks) * 100)}%)`}
                />
              )}
            </>
          ) : (
            <div className="h-full w-full bg-gray-300 dark:bg-gray-700 rounded-full" />
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between flex-wrap gap-3 text-xs pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span style={{ color: 'var(--text-secondary)' }}>Selesai: <strong>{stats.doneTasks}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span style={{ color: 'var(--text-secondary)' }}>In Progress: <strong>{stats.inProgressTasks}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span style={{ color: 'var(--text-secondary)' }}>Review: <strong>{stats.inReviewTasks}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span style={{ color: 'var(--text-secondary)' }}>Todo: <strong>{stats.todoTasks}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span style={{ color: 'var(--text-secondary)' }}>Overdue: <strong>{stats.overdueTasks}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Left 2 Cols (Workload + Activities), Right 1 Col (Projects + Shortcuts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Team Workload Card with Vertical Bar Chart */}
          <div 
            className="p-6 rounded-3xl border shadow-sm space-y-5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            {/* Header with Title and View Switcher */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Users size={18} style={{ color: 'var(--accent-primary)' }} />
                  Beban Kerja Tim ({displayWorkload.length} Anggota)
                </h2>
                <p className="text-xs opacity-70 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Visualisasi beban tugas dan skala tinggi bar per anggota tim (Skala Maks: {yAxisMax} Tugas)
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Exclude Admin Toggle Button */}
                <button
                  type="button"
                  onClick={() => setExcludeAdmin(!excludeAdmin)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    excludeAdmin 
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400' 
                      : 'bg-transparent border-gray-300 dark:border-gray-700 text-gray-500'
                  }`}
                  title="Kecualikan Administrator dari metrik dan grafik beban kerja"
                >
                  <span className={`w-2 h-2 rounded-full ${excludeAdmin ? 'bg-indigo-600' : 'bg-gray-400'}`} />
                  <span>{excludeAdmin ? 'Admin Dikecualikan' : 'Termasuk Admin'}</span>
                </button>

                {/* View Mode Toggle: Vertical Bar vs List */}
                <div 
                  className="flex p-0.5 rounded-xl border bg-black/5 dark:bg-white/5 text-xs font-bold"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <button
                    onClick={() => setWorkloadViewMode('vertical-bar')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      workloadViewMode === 'vertical-bar'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <BarChart2 size={13} />
                    <span>Bar Vertikal</span>
                  </button>
                  <button
                    onClick={() => setWorkloadViewMode('list')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      workloadViewMode === 'list'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <List size={13} />
                    <span>Rincian List</span>
                  </button>
                </div>

                <Link 
                  to="/members" 
                  className="text-xs font-semibold hover:underline flex items-center gap-1 ml-1"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  Detail <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* VERTICAL BAR CHART VIEW */}
            {workloadViewMode === 'vertical-bar' && (
              <div className="space-y-4">
                {/* Chart Box with Dedicated Left Y-Axis */}
                <div 
                  className="p-5 rounded-2xl border relative select-none overflow-x-auto"
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderColor: 'var(--border-color)' 
                  }}
                >
                  <div className="flex gap-2 items-stretch min-w-[560px]">
                    {/* Dedicated Left Y-Axis Scale with Labels */}
                    <div className="w-16 flex flex-col justify-between items-end pr-2 text-[11px] font-bold select-none py-0 pb-16 text-gray-500 dark:text-gray-400 shrink-0">
                      <span className="flex items-center gap-0.5">{yTicks[0]} <span className="text-[9px] font-normal opacity-70">tgs</span></span>
                      <span>{yTicks[1]}</span>
                      <span>{yTicks[2]}</span>
                      <span>{yTicks[3]}</span>
                      <span>0</span>
                    </div>

                    {/* Plot Area with Horizontal Grid Lines and Columns */}
                    <div className="flex-1 flex flex-col min-w-0">
                      {/* The 240px tall Plot Box */}
                      <div className="h-60 relative border-l-2 border-b-2 border-gray-300 dark:border-gray-700">
                        {/* Horizontal Guideline Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                          <div className="w-full border-b border-dashed border-gray-300/70 dark:border-gray-700/70" />
                          <div className="w-full border-b border-dashed border-gray-300/70 dark:border-gray-700/70" />
                          <div className="w-full border-b border-dashed border-gray-300/70 dark:border-gray-700/70" />
                          <div className="w-full border-b border-dashed border-gray-300/70 dark:border-gray-700/70" />
                          <div className="w-full" />
                        </div>

                        {/* The Columns Container: Directly on the baseline */}
                        <div className="absolute inset-0 flex items-end justify-around px-4">
                          {displayWorkload.map((m) => {
                            // Calculate bar height in percentage against yAxisMax
                            const barHeightPct = Math.round((m.totalTasks / yAxisMax) * 100);
                            const isHovered = hoveredMember?.userId === m.userId;

                            // Proportions inside stacked bar
                            const donePct = m.totalTasks > 0 ? (m.doneTasks / m.totalTasks) * 100 : 0;
                            const inProgPct = m.totalTasks > 0 ? (m.inProgressTasks / m.totalTasks) * 100 : 0;

                            return (
                              <div 
                                key={m.userId}
                                className="flex-1 flex flex-col items-center max-w-[68px] group cursor-pointer transition-transform duration-200 hover:-translate-y-1"
                                onMouseEnter={() => setHoveredMember(m)}
                                onMouseLeave={() => setHoveredMember(null)}
                              >
                                {/* Value Bubble over Bar */}
                                <div className="mb-1.5 text-center">
                                  <span 
                                    className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-black transition-all shadow-xs ${
                                      isHovered 
                                        ? 'bg-indigo-600 text-white scale-110 ring-2 ring-indigo-400' 
                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                                    }`}
                                  >
                                    {m.totalTasks}
                                  </span>
                                </div>

                                {/* The Vertical Stacked Bar */}
                                <div 
                                  className={`w-full rounded-t-xl overflow-hidden flex flex-col-reverse shadow-md transition-all duration-500 relative border border-b-0 ${
                                    isHovered ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                                  }`}
                                  style={{ 
                                    height: `${Math.max(barHeightPct, m.totalTasks > 0 ? 4 : 1)}%`,
                                    borderColor: 'rgba(0,0,0,0.1)'
                                  }}
                                >
                                  {/* Done Section (Green - Bottom) */}
                                  <div 
                                    className="w-full bg-emerald-500 transition-all duration-300 hover:brightness-110"
                                    style={{ height: `${donePct}%` }}
                                    title={`Selesai: ${m.doneTasks}`}
                                  />

                                  {/* In Progress Section (Blue - Middle) */}
                                  {m.inProgressTasks > 0 && (
                                    <div 
                                      className="w-full bg-blue-500 transition-all duration-300 hover:brightness-110"
                                      style={{ height: `${inProgPct}%` }}
                                      title={`In Progress: ${m.inProgressTasks}`}
                                    />
                                  )}

                                  {/* Remaining / Todo Section (Amber - Top) */}
                                  {m.todoTasks > 0 && (
                                    <div 
                                      className="w-full bg-amber-400 flex-1 hover:brightness-110"
                                      title={`Todo: ${m.todoTasks}`}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* X-Axis Foot: Initial Avatar + Name + Completion % */}
                      <div className="flex justify-around px-4 pt-3">
                        {displayWorkload.map((m) => {
                          const firstName = m.fullName.split(' ')[0];
                          return (
                            <div key={m.userId} className="flex-1 flex flex-col items-center max-w-[68px] space-y-1 text-center">
                              <div 
                                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-xs shrink-0"
                                style={{ backgroundColor: m.avatarColor || '#3B82F6' }}
                                title={m.fullName}
                              >
                                {firstName.charAt(0)}
                              </div>
                              <span 
                                className="text-[11px] font-bold truncate max-w-[64px] leading-tight block"
                                style={{ color: 'var(--text-primary)' }}
                                title={m.fullName}
                              >
                                {firstName}
                              </span>
                              <span 
                                className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full"
                                style={{ 
                                  backgroundColor: m.completionPercentage === 100 ? '#DCFCE7' : '#DBEAFE',
                                  color: m.completionPercentage === 100 ? '#166534' : '#1E40AF'
                                }}
                              >
                                {m.completionPercentage}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hover Details Banner & Legend */}
                <div 
                  className="p-3.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                >
                  {/* Dynamic Tooltip / Status Display */}
                  <div className="flex items-center gap-2 min-w-0">
                    {hoveredMember ? (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: hoveredMember.avatarColor || '#3B82F6' }}
                        >
                          {hoveredMember.fullName.charAt(0)}
                        </div>
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                          {hoveredMember.fullName} ({hoveredMember.role}) :
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          <strong>{hoveredMember.doneTasks}</strong> Selesai, <strong>{hoveredMember.inProgressTasks}</strong> In Progress, Total <strong>{hoveredMember.totalTasks}</strong> Tugas ({hoveredMember.completionPercentage}% Tuntas)
                        </span>
                      </div>
                    ) : (
                      <span className="opacity-70 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <span>💡</span>
                        <span>Arahkan kursor pada batang vertikal untuk melihat rincian per personil</span>
                      </span>
                    )}
                  </div>

                  {/* Chart Legend */}
                  <div className="flex items-center gap-3 shrink-0 text-[11px] font-semibold">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                      <span style={{ color: 'var(--text-secondary)' }}>Selesai</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                      <span style={{ color: 'var(--text-secondary)' }}>In Progress</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                      <span style={{ color: 'var(--text-secondary)' }}>Todo</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LIST DETAIL VIEW (Fallback / Alternative View) */}
            {workloadViewMode === 'list' && (
              <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {teamWorkload.map((m) => (
                  <div key={m.userId} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-1 last:pb-1">
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                        style={{ backgroundColor: m.avatarColor || '#3B82F6' }}
                      >
                        {m.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                          {m.fullName}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/5 dark:bg-white/10" style={{ color: 'var(--accent-primary)' }}>
                            {m.role}
                          </span>
                        </div>
                        <div className="text-xs opacity-70 truncate" style={{ color: 'var(--text-secondary)' }}>
                          {m.jobTitle || m.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:justify-end shrink-0 pl-13 sm:pl-0">
                      <div className="text-right">
                        <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                          {m.doneTasks} / {m.totalTasks} Tugas
                        </div>
                        <div className="text-[10px] opacity-70" style={{ color: 'var(--text-secondary)' }}>
                          {m.inProgressTasks > 0 ? `${m.inProgressTasks} In Progress` : 'Semua Done'}
                        </div>
                      </div>

                      <div className="w-24 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${m.completionPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: `${m.completionPercentage}%` }}
                        />
                      </div>

                      <span 
                        className="text-xs font-bold min-w-10 text-right"
                        style={{ color: m.completionPercentage === 100 ? '#10B981' : 'var(--text-primary)' }}
                      >
                        {m.completionPercentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Tasks */}
          <div 
            className="p-6 rounded-3xl border shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Layers size={18} style={{ color: 'var(--accent-primary)' }} />
                  Aktivitas Tugas Terakhir Diperbarui
                </h2>
                <p className="text-xs opacity-70 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Tugas aktif dengan perubahan status dan progres terakhir
                </p>
              </div>
              <Link 
                to="/tasks" 
                className="text-xs font-semibold hover:underline flex items-center gap-1"
                style={{ color: 'var(--accent-primary)' }}
              >
                Semua Tugas <ArrowRight size={14} />
              </Link>
            </div>

            <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {recentActivities.length === 0 ? (
                <div className="py-8 text-center text-xs opacity-60" style={{ color: 'var(--text-secondary)' }}>
                  Belum ada aktivitas tugas tercatat.
                </div>
              ) : (
                recentActivities.map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between gap-4 first:pt-1 last:pb-1">
                    <div className="min-w-0 space-y-1">
                      <div className="text-xs sm:text-sm font-semibold truncate hover:underline cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                        <Link to={`/tasks`}>{t.title}</Link>
                      </div>
                      <div className="flex items-center flex-wrap gap-2 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                        <span 
                          className="px-2 py-0.5 rounded-full font-bold text-[10px]"
                          style={{ 
                            backgroundColor: `${t.projectColor || '#3B82F6'}1A`,
                            color: t.projectColor || '#3B82F6'
                          }}
                        >
                          {t.projectName || 'Proyek'}
                        </span>
                        <span>•</span>
                        <span>PIC: <strong>{t.assigneeName || 'Unassigned'}</strong></span>
                        <span>•</span>
                        <span>{t.milestone || 'SDLC'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span 
                        className="px-2.5 py-1 rounded-lg text-xs font-bold"
                        style={{
                          backgroundColor: t.status === 2 ? '#DCFCE7' : t.status === 1 ? '#DBEAFE' : '#FEF3C7',
                          color: t.status === 2 ? '#166534' : t.status === 1 ? '#1E40AF' : '#92400E'
                        }}
                      >
                        {t.status === 2 ? 'Done (100%)' : t.status === 1 ? `In Progress (${t.progress}%)` : 'Todo'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col: Projects Overview & Quick Shortcuts) */}
        <div className="space-y-6">

          {/* Active Projects Overview */}
          <div 
            className="p-6 rounded-3xl border shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Briefcase size={18} style={{ color: 'var(--accent-primary)' }} />
                  Ringkasan Proyek ({projectsOverview.length})
                </h2>
                <p className="text-xs opacity-70 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Proyek aktif dengan akumulasi tugas
                </p>
              </div>
              <Link 
                to="/projects" 
                className="text-xs font-semibold hover:underline flex items-center gap-1"
                style={{ color: 'var(--accent-primary)' }}
              >
                Detail <ArrowRight size={14} />
              </Link>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {projectsOverview.map((p) => (
                <div 
                  key={p.projectId} 
                  className="p-3.5 rounded-2xl border transition-all hover:bg-black/5 dark:hover:bg-white/5 space-y-2"
                  style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                        {p.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold shrink-0" style={{ color: p.progressPercentage === 100 ? '#10B981' : 'var(--text-primary)' }}>
                      {p.progressPercentage}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${p.progressPercentage}%`,
                        backgroundColor: p.color || '#3B82F6'
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] opacity-70" style={{ color: 'var(--text-secondary)' }}>
                    <span>{p.totalTasks} Total Tugas</span>
                    <span>{p.completedTasks} Selesai</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div 
            className="p-6 rounded-3xl border shadow-sm space-y-4"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Pintasan Menu
            </h2>

            <div className="space-y-2.5">
              <Link
                to="/timesheet"
                className="p-3.5 rounded-2xl border flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-all group"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      Multi-Timer Timesheet
                    </div>
                    <div className="text-[11px] opacity-70" style={{ color: 'var(--text-secondary)' }}>
                      Lacak durasi pengerjaan tugas
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent-primary)' }} />
              </Link>

              <Link
                to="/attendance"
                className="p-3.5 rounded-2xl border flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-all group"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      Presensi & Kehadiran
                    </div>
                    <div className="text-[11px] opacity-70" style={{ color: 'var(--text-secondary)' }}>
                      Check-in dan stopwatch harian
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent-primary)' }} />
              </Link>

              <Link
                to="/sql-tools"
                className="p-3.5 rounded-2xl border flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-all group"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <Database size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      SQL Beautifier
                    </div>
                    <div className="text-[11px] opacity-70" style={{ color: 'var(--text-secondary)' }}>
                      Format kueri 15+ dialek
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent-primary)' }} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
