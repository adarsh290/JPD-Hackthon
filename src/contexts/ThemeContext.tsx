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
    
    // Remove existing theme class
    root.classList.remove('light', 'dark');
    
    // Add new theme class
    root.classList.add(newTheme);
    
    // Apply CSS custom properties for proper theme switching
    if (newTheme === 'dark') {
      // Dark theme - Mandatory black background with green accents
      root.style.setProperty('--background', '0 0% 0%');
      root.style.setProperty('--foreground', '0 0% 100%');
      root.style.setProperty('--card', '0 0% 3%');
      root.style.setProperty('--card-foreground', '0 0% 100%');
      root.style.setProperty('--popover', '0 0% 2%');
      root.style.setProperty('--popover-foreground', '0 0% 100%');
      root.style.setProperty('--primary', '120 100% 50%');
      root.style.setProperty('--primary-foreground', '0 0% 0%');
      root.style.setProperty('--secondary', '0 0% 8%');
      root.style.setProperty('--secondary-foreground', '0 0% 100%');
      root.style.setProperty('--muted', '0 0% 12%');
      root.style.setProperty('--muted-foreground', '0 0% 60%');
      root.style.setProperty('--accent', '120 100% 50%');
      root.style.setProperty('--accent-foreground', '0 0% 0%');
      root.style.setProperty('--destructive', '0 100% 50%');
      root.style.setProperty('--destructive-foreground', '0 0% 100%');
      root.style.setProperty('--border', '0 0% 20%');
      root.style.setProperty('--input', '0 0% 8%');
      root.style.setProperty('--ring', '120 100% 50%');
    } else {
      // Light theme - White background with green accents
      root.style.setProperty('--background', '0 0% 100%');
      root.style.setProperty('--foreground', '0 0% 0%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', '0 0% 0%');
      root.style.setProperty('--popover', '0 0% 100%');
      root.style.setProperty('--popover-foreground', '0 0% 0%');
      root.style.setProperty('--primary', '120 100% 50%');
      root.style.setProperty('--primary-foreground', '0 0% 0%');
      root.style.setProperty('--secondary', '0 0% 96%');
      root.style.setProperty('--secondary-foreground', '0 0% 0%');
      root.style.setProperty('--muted', '0 0% 96%');
      root.style.setProperty('--muted-foreground', '0 0% 40%');
      root.style.setProperty('--accent', '120 100% 50%');
      root.style.setProperty('--accent-foreground', '0 0% 0%');
      root.style.setProperty('--destructive', '0 100% 50%');
      root.style.setProperty('--destructive-foreground', '0 0% 100%');
      root.style.setProperty('--border', '0 0% 90%');
      root.style.setProperty('--input', '0 0% 100%');
      root.style.setProperty('--ring', '120 100% 50%');
    }
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