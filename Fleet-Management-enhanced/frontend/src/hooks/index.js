import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../store';
import { socketService } from '../services/socket';

export const useSocket = () => {
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      socketService.connect(token);
    }
    return () => {
      socketService.disconnect();
    };
  }, [token]);

  return socketService;
};

// FIXED: Removed duplicate useAsync declaration; merged both into a single, stable version
export const useAsync = (asyncFunction, immediate = true, deps = []) => {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setData(null);
    setError(null);
    try {
      const response = await asyncFunction();
      setData(response.data);
      setStatus('success');
      return response.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      setStatus('error');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps]);

  return { execute, status, data, error };
};

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// FIXED: usePrevious now uses a ref instead of state to correctly capture the previous render value
export const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};
