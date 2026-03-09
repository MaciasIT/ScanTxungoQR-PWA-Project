import { useState, useEffect } from 'react';

const STORAGE_KEY = 'scanHistory';
const MAX_ENTRIES = 20;

/**
 * Custom hook for managing scan history with localStorage persistence.
 * Includes try/catch around JSON.parse to prevent crashes on corrupted data (TD-006, SEC-008).
 */
const useHistory = () => {
  const [history, setHistory] = useState([]);

  // Load history on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (_) {
      // Corrupted localStorage data — start fresh
      setHistory([]);
    }
  }, []);

  const addToHistory = (url, result) => {
    const newEntry = {
      url,
      timestamp: new Date().toISOString(),
      malicious: result.positives > 0,
      positives: result.positives,
      total: result.total,
    };

    setHistory((prev) => {
      const updatedHistory = [newEntry, ...prev].slice(0, MAX_ENTRIES);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      } catch (_) {
        // localStorage full or unavailable — silently fail
      }
      return updatedHistory;
    });
  };

  return { history, addToHistory };
};

export default useHistory;
