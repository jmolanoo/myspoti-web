import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // 'classic' | 'immersive' | 'amoled'
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('msp_theme') || 'immersive';
  });

  const [palette, setPalette] = useState({
    dominant: '#1DB954',
    secondary: '#1ed760',
    dark: '#0e2b17',
    background: '#0a1a0f'
  });

  useEffect(() => {
    localStorage.setItem('msp_theme', themeMode);
    document.documentElement.className = themeMode === 'amoled' ? 'theme-amoled dark' : `theme-${themeMode} dark`;
  }, [themeMode]);

  const updatePaletteFromCover = (coverUrl) => {
    if (!coverUrl) return;
    // Dynamic complementary fallback palette generator
    let hash = 0;
    for (let i = 0; i < coverUrl.length; i++) {
      hash = coverUrl.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    setPalette({
      dominant: `hsl(${h}, 75%, 45%)`,
      secondary: `hsl(${(h + 40) % 360}, 85%, 55%)`,
      dark: `hsl(${h}, 50%, 15%)`,
      background: `hsl(${h}, 60%, 8%)`
    });
  };

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, palette, updatePaletteFromCover }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
