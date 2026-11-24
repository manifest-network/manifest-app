import { ReactNode, createContext, useContext, useLayoutEffect, useState } from 'react';

import { useLocalStorage } from '@/hooks';

import { ThemeColors, readThemeColors } from './themeColors';

export type Theme = 'light' | 'dark';

export interface ThemeContext {
  theme: Theme;
  toggleTheme: () => void;
  /**
   * The active theme's colors as strings, for code that cannot use a CSS class. Undefined until
   * the theme has been applied to the document.
   */
  colors?: ThemeColors;
}

export const Theme = createContext<ThemeContext>({
  theme: 'light',
  toggleTheme: () => {},
});

const getDefaultTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';

  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return isDark ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', getDefaultTheme, [
    v => (v === 'dark' ? v : 'light'),
    v => v,
  ]);
  const [colors, setColors] = useState<ThemeColors>();

  // Apply the theme, then read its colors back. A layout effect, so consumers of `colors` render
  // with the new theme's values before the browser paints.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
    setColors(readThemeColors(root));
  }, [theme]);

  const toggleTheme = () => {
    setTheme(current => (current === 'light' ? 'dark' : 'light'));
  };

  return <Theme.Provider value={{ theme, toggleTheme, colors }}>{children}</Theme.Provider>;
};

export const useTheme = (): ThemeContext => useContext(Theme);
