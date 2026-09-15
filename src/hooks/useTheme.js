import { useState, useEffect, useCallback } from 'react';

const THEME_STORAGE_KEY = 'moneyhub-theme';

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
    } catch (e) {}
    return 'dark';
  });

  const aplicarTema = useCallback((novoTema) => {
    const root = document.documentElement;
    if (novoTema === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, novoTema);
    } catch (e) {}
  }, []);

  useEffect(() => {
    aplicarTema(theme);
  }, [theme, aplicarTema]);

  // Sincroniza com alterações do sistema operacional caso não haja preferência manual salva
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const hasSavedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (!hasSavedTheme) {
        const sistemaTema = e.matches ? 'dark' : 'light';
        setThemeState(sistemaTema);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setTheme = useCallback((novoTema) => {
    if (novoTema === 'light' || novoTema === 'dark') {
      setThemeState(novoTema);
    }
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme
  };
}
