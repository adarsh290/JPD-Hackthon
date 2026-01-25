import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme') as Theme;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    
    // Apply theme to document
    applyTheme(initialTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    if (newTheme === 'dark') {
      root.style.setProperty('--background', '#000000');
      root.style.setProperty('--foreground', '#ffffff');
      root.style.setProperty('--card', '#111111');
      root.style.setProperty('--card-foreground', '#ffffff');
      root.style.setProperty('--popover', '#111111');
      root.style.setProperty('--popover-foreground', '#ffffff');
      root.style.setProperty('--primary', '#00ff00');
      root.style.setProperty('--primary-foreground', '#000000');
      root.style.setProperty('--secondary', '#1a1a1a');
      root.style.setProperty('--secondary-foreground', '#ffffff');
      root.style.setProperty('--muted', '#1a1a1a');
      root.style.setProperty('--muted-foreground', '#888888');
      root.style.setProperty('--accent', '#00ff00');
      root.style.setProperty('--accent-foreground', '#000000');
      root.style.setProperty('--destructive', '#ff0000');
      root.style.setProperty('--destructive-foreground', '#ffffff');
      root.style.setProperty('--border', '#333333');
      root.style.setProperty('--input', '#1a1a1a');
      root.style.setProperty('--ring', '#00ff00');
    } else {
      root.style.setProperty('--background', '#ffffff');
      root.style.setProperty('--foreground', '#000000');
      root.style.setProperty('--card', '#ffffff');
      root.style.setProperty('--card-foreground', '#000000');
      root.style.setProperty('--popover', '#ffffff');
      root.style.setProperty('--popover-foreground', '#000000');
      root.style.setProperty('--primary', '#00ff00');
      root.style.setProperty('--primary-foreground', '#000000');
      root.style.setProperty('--secondary', '#f5f5f5');
      root.style.setProperty('--secondary-foreground', '#000000');
      root.style.setProperty('--muted', '#f5f5f5');
      root.style.setProperty('--muted-foreground', '#666666');
      root.style.setProperty('--accent', '#00ff00');
      root.style.setProperty('--accent-foreground', '#000000');
      root.style.setProperty('--destructive', '#ff0000');
      root.style.setProperty('--destructive-foreground', '#ffffff');
      root.style.setProperty('--border', '#e5e5e5');
      root.style.setProperty('--input', '#ffffff');
      root.style.setProperty('--ring', '#00ff00');
    }
    
    root.classList.toggle('dark', newTheme === 'dark');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};