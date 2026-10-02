import { useState, useEffect, useCallback, useRef } from 'react';
import { getCookie, setCookie, removeCookie } from '../utils/cookieHelper';

/**
 * Custom hook to manage and persist grid/table filter, sort, and pagination state into cookies.
 * 
 * @param {string} storageKey - Unique key for this table (e.g. 'wt_grid_tasks_v1')
 * @param {object} defaultState - Default filter & sort values
 * @param {number} cookieDays - Duration in days to preserve cookies (default: 30)
 */
export function useGridTableState(storageKey, defaultState = {}, cookieDays = 30) {
  // 1. Initialize state by reading from cookie
  const [state, setState] = useState(() => {
    const saved = getCookie(storageKey);
    if (saved && typeof saved === 'object') {
      return { ...defaultState, ...saved };
    }
    return defaultState;
  });

  const isFirstMount = useRef(true);

  // 2. Persist to cookie whenever state changes (skip on very first mount)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setCookie(storageKey, state, cookieDays);
  }, [storageKey, state, cookieDays]);

  // 3. Update single key or multiple keys
  const updateState = useCallback((updates) => {
    setState((prev) => {
      const next = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      return next;
    });
  }, []);

  // 4. Dedicated sorting handler
  const handleSort = useCallback((columnKey) => {
    setState((prev) => {
      if (prev.sortBy === columnKey) {
        if (!prev.sortDesc) {
          // ASC -> DESC
          return { ...prev, sortBy: columnKey, sortDesc: true };
        } else {
          // DESC -> Reset to default or toggle to ASC
          const defaultSortBy = defaultState.sortBy || '';
          const defaultSortDesc = defaultState.sortDesc ?? false;
          return { ...prev, sortBy: defaultSortBy, sortDesc: defaultSortDesc };
        }
      } else {
        // New column -> ASC
        return { ...prev, sortBy: columnKey, sortDesc: false };
      }
    });
  }, [defaultState.sortBy, defaultState.sortDesc]);

  // 5. Reset filters to defaultState
  const resetState = useCallback(() => {
    setState(defaultState);
    setCookie(storageKey, defaultState, cookieDays);
  }, [storageKey, defaultState, cookieDays]);

  return {
    state,
    setState,
    updateState,
    handleSort,
    resetState
  };
}
