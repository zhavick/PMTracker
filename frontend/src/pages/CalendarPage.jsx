import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Users, 
  User, 
  Clock, 
  Folder, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ExternalLink 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

const DAYS_OF_WEEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function CalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isElevated = user?.role === 'Admin' || user?.role === 'System Analyst' || user?.role === 'Technical Writer';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [scopeFilter, setScopeFilter] = useState('all'); // 'all' | 'mine'
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Event Modal
  const [selectedEvent, setSelectedEvent] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const firstDay = new Date(year, month - 1, 1).toISOString();
      const lastDay = new Date(year, month + 2, 0).toISOString();

      const res = await axiosClient.get('/api/calendar/events', {
        params: {
          start: firstDay,
          end: lastDay,
          filter: isElevated ? scopeFilter : 'mine'
        }
      });
      if (res.data?.data) {
        setEvents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [year, month, scopeFilter]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];

  // Previous month padding days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrevMonth - i);
    calendarDays.push({ date: d, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    calendarDays.push({ date: d, isCurrentMonth: true });
  }

  // Next month padding days to complete 35 or 42 grid cells
  const remainingCells = (7 - (calendarDays.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(year, month + 1, i);
    calendarDays.push({ date: d, isCurrentMonth: false });
  }

  const getEventsForDay = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => {
      const eDate = new Date(e.start).toISOString().split('T')[0];
      return eDate === dateStr;
    });
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Kalender Tugas & Linimasa SDLC
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Visualisasi batas waktu dan jadwal tugas tim terintegrasi RBAC (Mine vs All Team).
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-3">
          {/* RBAC Scope Filter Switcher */}
          {isElevated ? (
            <div className="flex p-1 rounded-xl border bg-black/5 dark:bg-white/5 text-xs font-bold" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={() => setScopeFilter('all')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                  scopeFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Semua Tim</span>
              </button>
              <button
                onClick={() => setScopeFilter('mine')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                  scopeFilter === 'mine' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Tugas Saya</span>
              </button>
            </div>
          ) : (
            <span className="px-3 py-1.5 rounded-xl border bg-black/5 dark:bg-white/5 text-xs font-semibold text-gray-500 flex items-center space-x-1">
              <User className="w-3.5 h-3.5" />
              <span>Terkunci: Tugas Saya</span>
            </span>
          )}

          {/* Month Navigation */}
          <div className="flex items-center space-x-1 rounded-xl border p-1" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-500"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: 'var(--text-primary)' }}
            >
              Hari Ini
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-gray-500"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Month Title Banner */}
      <div 
        className="p-4 rounded-2xl border shadow-sm flex items-center justify-between"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
            {monthNames[month]} {year}
          </h2>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600">
          {events.length} Jadwal Tugas Terpantau
        </span>
      </div>

      {/* Calendar Grid */}
      <div 
        className="rounded-3xl border shadow-sm overflow-hidden"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b text-center text-xs font-bold uppercase tracking-wider py-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
          {DAYS_OF_WEEK.map((day, idx) => (
            <div key={day} className={idx === 0 ? 'text-rose-500' : ''}>
              {day}
            </div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 divide-x divide-y" style={{ borderColor: 'var(--border-color)' }}>
          {calendarDays.map((cell, idx) => {
            const dayEvents = getEventsForDay(cell.date);
            const isToday = cell.date.toDateString() === new Date().toDateString();

            return (
              <div
                key={idx}
                className={`min-h-[110px] sm:min-h-[130px] p-2 flex flex-col justify-between transition-colors ${
                  !cell.isCurrentMonth ? 'opacity-30 bg-black/[0.01] dark:bg-white/[0.01]' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                }`}
                style={{ borderColor: 'var(--border-color)' }}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-indigo-600 text-white shadow-sm' : ''
                  }`} style={{ color: isToday ? '#fff' : 'var(--text-primary)' }}>
                    {cell.date.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-bold text-gray-400">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Event Chips */}
                <div className="space-y-1 mt-1 flex-1 overflow-y-auto max-h-24">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full text-left p-1 rounded-lg text-[11px] font-semibold truncate block transition-transform hover:scale-[1.02] shadow-xs"
                      style={{ 
                        backgroundColor: `${event.projectColor || '#6366F1'}18`, 
                        color: event.projectColor || '#6366F1',
                        borderLeft: `3px solid ${event.projectColor || '#6366F1'}` 
                      }}
                      title={`${event.title} (${event.projectName || 'Umum'})`}
                    >
                      {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] font-bold text-gray-400 pl-1 block">
                      +{dayEvents.length - 3} lainnya...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden animate-scale-up"
            style={{ backgroundColor: 'var(--card-bg, var(--bg-card, #FFFFFF))', borderColor: 'var(--border-color)' }}
          >
            <div 
              className="p-5 border-b flex items-start justify-between"
              style={{ 
                borderColor: 'var(--border-color)', 
                backgroundColor: 'var(--bg-secondary)',
                borderTop: `4px solid ${selectedEvent.projectColor || '#6366F1'}` 
              }}
            >
              <div>
                <span 
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full mb-1 inline-block"
                  style={{ backgroundColor: `${selectedEvent.projectColor || '#6366F1'}20`, color: selectedEvent.projectColor || '#6366F1' }}
                >
                  {selectedEvent.projectName || 'Umum / Non-Proyek'}
                </span>
                <h3 className="font-bold text-base mt-1" style={{ color: 'var(--text-primary)' }}>
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-400 block mb-0.5">Milestone SDLC:</span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{selectedEvent.milestone}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Penanggung Jawab (PIC):</span>
                  <span className="font-bold text-indigo-500">{selectedEvent.assigneeName}</span>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span style={{ color: 'var(--text-secondary)' }}>Progress Tugas</span>
                  <span className="text-indigo-600 font-bold">{selectedEvent.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-indigo-600"
                    style={{ width: `${selectedEvent.progress}%` }}
                  />
                </div>
              </div>

              {/* Obstacle if any */}
              {selectedEvent.obstacle && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  <div className="flex items-center space-x-1.5 font-bold mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Catatan Kendala:</span>
                  </div>
                  <p>{selectedEvent.obstacle}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end space-x-2" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  navigate('/tasks');
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka di Daftar Tugas</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
