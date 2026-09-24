import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from './AuthContext';

const TimerContext = createContext();

export function TimerProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [activeTimers, setActiveTimers] = useState([]);
  const [elapsedSeconds, setElapsedSeconds] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch active timers from backend
  const refreshActiveTimers = useCallback(async () => {
    if (!isAuthenticated) {
      setActiveTimers([]);
      return;
    }
    try {
      const res = await axiosClient.get('/api/timesheets/active');
      if (res.data?.data) {
        setActiveTimers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to sync active timers:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshActiveTimers();
      // Periodically sync every 30 seconds
      const syncInterval = setInterval(refreshActiveTimers, 30000);
      return () => clearInterval(syncInterval);
    }
  }, [isAuthenticated, refreshActiveTimers]);

  // Local ticker for live UI display
  useEffect(() => {
    if (activeTimers.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const newElapsed = {};
      activeTimers.forEach(timer => {
        const start = new Date(timer.startTime).getTime();
        const diff = Math.max(0, Math.floor((now - start) / 1000));
        newElapsed[timer.id] = diff;
      });
      setElapsedSeconds(newElapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimers]);

  const startTimer = async (taskId, notes = '') => {
    setLoading(true);
    try {
      const res = await axiosClient.post('/api/timesheets/start', {
        taskId,
        notes: notes.trim() || null
      });
      await refreshActiveTimers();
      return res.data;
    } catch (err) {
      console.error('Failed to start timer:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const stopTimer = async (sessionId, notes = '') => {
    setLoading(true);
    try {
      const res = await axiosClient.post(`/api/timesheets/stop/${sessionId}`, {
        notes: notes.trim() || null
      });
      await refreshActiveTimers();
      return res.data;
    } catch (err) {
      console.error('Failed to stop timer:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const stopTimerByTask = async (taskId) => {
    setLoading(true);
    try {
      const res = await axiosClient.post(`/api/timesheets/stop-by-task/${taskId}`);
      await refreshActiveTimers();
      return res.data;
    } catch (err) {
      console.error('Failed to stop timer by task:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const isTaskTimerRunning = (taskId) => {
    return activeTimers.some(t => t.taskId === taskId);
  };

  return (
    <TimerContext.Provider value={{
      activeTimers,
      elapsedSeconds,
      loading,
      startTimer,
      stopTimer,
      stopTimerByTask,
      isTaskTimerRunning,
      refreshActiveTimers
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
