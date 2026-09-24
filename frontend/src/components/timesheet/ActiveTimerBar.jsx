import React, { useState } from 'react';
import { Play, Square, Clock, ChevronUp, ChevronDown, Layers } from 'lucide-react';
import { useTimer } from '../../context/TimerContext';

function formatTimerSeconds(seconds = 0) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function ActiveTimerBar() {
  const { activeTimers, elapsedSeconds, stopTimer } = useTimer();
  const [isExpanded, setIsExpanded] = useState(false);
  const [stoppingId, setStoppingId] = useState(null);

  if (activeTimers.length === 0) return null;

  const handleStop = async (sessionId) => {
    setStoppingId(sessionId);
    try {
      await stopTimer(sessionId);
    } catch (err) {
      console.error('Error stopping timer:', err);
    } finally {
      setStoppingId(null);
    }
  };

  const primaryTimer = activeTimers[0];
  const primarySeconds = elapsedSeconds[primaryTimer.id] || 0;

  return (
    <div className="fixed bottom-16 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-40 animate-slide-up">
      <div 
        className="rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-md transition-all"
        style={{ 
          backgroundColor: 'var(--card-bg)', 
          borderColor: 'var(--border-color)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)' 
        }}
      >
        {/* Main Bar */}
        <div className="p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 overflow-hidden">
            {/* Pulsing Timer Icon */}
            <div className="relative flex-shrink-0">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>

            <div className="overflow-hidden">
              <div className="flex items-center space-x-1.5">
                <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400 tracking-wider">
                  {formatTimerSeconds(primarySeconds)}
                </span>
                {activeTimers.length > 1 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    +{activeTimers.length - 1} Lainnya
                  </span>
                )}
              </div>
              <h4 
                className="text-xs font-semibold truncate line-clamp-1" 
                style={{ color: 'var(--text-primary)' }}
                title={primaryTimer.taskTitle}
              >
                {primaryTimer.taskTitle}
              </h4>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {/* Stop Button */}
            <button
              onClick={() => handleStop(primaryTimer.id)}
              disabled={stoppingId === primaryTimer.id}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
              title="Hentikan Timer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>

            {/* Expand Multi-Timers */}
            {activeTimers.length > 1 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 transition-colors"
                title="Lihat semua timer aktif"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Expanded Drawer for Concurrent Multi-Timers */}
        {isExpanded && activeTimers.length > 1 && (
          <div 
            className="border-t p-3 space-y-2 max-h-48 overflow-y-auto"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              Multi-Timer Serentak ({activeTimers.length})
            </div>
            {activeTimers.slice(1).map(timer => {
              const seconds = elapsedSeconds[timer.id] || 0;
              return (
                <div 
                  key={timer.id}
                  className="flex items-center justify-between p-2 rounded-xl border text-xs"
                  style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
                >
                  <div className="overflow-hidden mr-2">
                    <span className="font-mono font-bold text-indigo-500 mr-2">
                      {formatTimerSeconds(seconds)}
                    </span>
                    <span className="truncate" style={{ color: 'var(--text-primary)' }}>
                      {timer.taskTitle}
                    </span>
                  </div>

                  <button
                    onClick={() => handleStop(timer.id)}
                    disabled={stoppingId === timer.id}
                    className="p-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
                    title="Stop Timer Ini"
                  >
                    <Square className="w-3 h-3 fill-current" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
