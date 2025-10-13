/**
 * Hooks Module
 * 
 * Centralized custom React hooks for the entire application.
 * Provides reusable hooks with consistent interfaces across all modules.
 */

// Re-export existing hooks for backward compatibility
export * from '../../shared/hooks';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AsyncState } from '../types';

// Generic async state hook
export function useAsyncState<T>(
  initialData: T | null = null
): [AsyncState<T>, (promise: Promise<T>) => Promise<void>] {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (promise: Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await promise;
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  }, []);

  return [state, execute];
}

// Local storage hook
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

// Debounced value hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Previous value hook
export function usePrevious<T>(value: T): T | undefined {
  const [current, setCurrent] = useState<T>(value);
  const [previous, setPrevious] = useState<T | undefined>();

  if (value !== current) {
    setPrevious(current);
    setCurrent(value);
  }

  return previous;
}

// Toggle hook
export function useToggle(initialValue: boolean = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  const setToggle = useCallback((newValue: boolean) => {
    setValue(newValue);
  }, []);

  return [value, toggle, setToggle];
}

// Array state hook
export function useArray<T>(initialArray: T[] = []): {
  items: T[];
  add: (item: T) => void;
  remove: (index: number) => void;
  update: (index: number, item: T) => void;
  clear: () => void;
  set: (items: T[]) => void;
} {
  const [items, setItems] = useState<T[]>(initialArray);

  const add = useCallback((item: T) => {
    setItems(prev => [...prev, item]);
  }, []);

  const remove = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const update = useCallback((index: number, item: T) => {
    setItems(prev => prev.map((existingItem, i) => i === index ? item : existingItem));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const set = useCallback((newItems: T[]) => {
    setItems(newItems);
  }, []);

  return useMemo(() => ({
    items,
    add,
    remove,
    update,
    clear,
    set,
  }), [items, add, remove, update, clear, set]);
}

// Intersection observer hook
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return isIntersecting;
}