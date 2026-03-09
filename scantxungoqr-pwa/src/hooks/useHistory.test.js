import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useHistory from './useHistory';

describe('useHistory', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with an empty array if localStorage is empty', () => {
    const { result } = renderHook(() => useHistory());
    expect(result.current.history).toEqual([]);
  });

  it('should initialize with an empty array if it contains garbage (TD-006 protection)', () => {
    // Inject garbage into localStorage exactly as requested
    localStorage.setItem('scanHistory', '{not_valid_json: 123');

    const { result } = renderHook(() => useHistory());
    
    // Fallback to []
    expect(result.current.history).toEqual([]);
  });

  it('should correctly load valid history from localStorage', () => {
    const mockHistory = [
      { url: 'https://example.com', result: { positives: 0, total: 90 } },
    ];
    localStorage.setItem('scanHistory', JSON.stringify(mockHistory));

    const { result } = renderHook(() => useHistory());
    
    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].url).toBe('https://example.com');
  });

  it('should add items to the history array and update localStorage', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      // Adding first item
      result.current.addToHistory('https://safe.com', { positives: 0 });
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].url).toBe('https://safe.com');
    // Ensure the timestamp is set
    expect(result.current.history[0].timestamp).toBeDefined();

    // Verify localStorage was updated
    const saved = JSON.parse(localStorage.getItem('scanHistory'));
    expect(saved).toHaveLength(1);
    expect(saved[0].url).toBe('https://safe.com');

    act(() => {
      // Adding second item (should be pushed to the beginning)
      result.current.addToHistory('https://danger.com', { positives: 5 });
    });

    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0].url).toBe('https://danger.com');
    expect(result.current.history[1].url).toBe('https://safe.com');
  });
});
