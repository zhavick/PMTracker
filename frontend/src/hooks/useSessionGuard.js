import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes
const WARNING_TIMEOUT_MS = 55 * 60 * 1000;    // 55 minutes (warning triggers)
const THROTTLE_MS = 3000;                     // 3 seconds event throttle

export const useSessionGuard = () => {
  const { isAuthenticated, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(300);

  const lastActivityRef = useRef(Date.now());
  const lastThrottleRef = useRef(0);
  const timerRef = useRef(null);

  const resetActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastThrottleRef.current > THROTTLE_MS) {
      lastThrottleRef.current = now;
      lastActivityRef.current = now;
      if (showWarning) {
        setShowWarning(false);
        setRemainingSeconds(300);
      }
    }
  }, [showWarning]);

  const extendSession = () => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setRemainingSeconds(300);
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleEvent = () => resetActivity();

    events.forEach(e => window.addEventListener(e, handleEvent, { passive: true }));

    timerRef.current = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;

      if (idleTime >= INACTIVITY_TIMEOUT_MS) {
        clearInterval(timerRef.current);
        logout('timeout');
      } else if (idleTime >= WARNING_TIMEOUT_MS) {
        setShowWarning(true);
        const timeLeft = Math.max(0, Math.floor((INACTIVITY_TIMEOUT_MS - idleTime) / 1000));
        setRemainingSeconds(timeLeft);
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => {
      events.forEach(e => window.removeEventListener(e, handleEvent));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuthenticated, logout, resetActivity]);

  return {
    showWarning,
    remainingSeconds,
    extendSession
  };
};
