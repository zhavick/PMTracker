import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES_LIST = [
  // 22 Light Themes
  { id: 'indigo-nebula', name: 'Indigo Nebula', mode: 'light', color: '#6366F1' },
  { id: 'emerald-forest', name: 'Emerald Forest', mode: 'light', color: '#10B981' },
  { id: 'ocean-azure', name: 'Ocean Azure', mode: 'light', color: '#0284C7' },
  { id: 'sunset-crimson', name: 'Sunset Crimson', mode: 'light', color: '#F43F5E' },
  { id: 'cyberpunk-neon', name: 'Cyberpunk Neon', mode: 'light', color: '#A855F7' },
  { id: 'royal-amethyst', name: 'Royal Amethyst', mode: 'light', color: '#D946EF' },
  { id: 'amber-gold', name: 'Amber Gold', mode: 'light', color: '#F59E0B' },
  { id: 'slate-minimalist', name: 'Slate Minimalist', mode: 'light', color: '#475569' },
  { id: 'nordic-teal', name: 'Nordic Teal', mode: 'light', color: '#14B8A6' },
  { id: 'midnight-titanium', name: 'Midnight Titanium', mode: 'light', color: '#374151' },
  { id: 'lavender-bliss', name: 'Lavender Bliss', mode: 'light', color: '#8B5CF6' },
  { id: 'mint-fresh', name: 'Mint Fresh', mode: 'light', color: '#10B981' },
  { id: 'coral-reef', name: 'Coral Reef', mode: 'light', color: '#F97316' },
  { id: 'sky-breeze', name: 'Sky Breeze', mode: 'light', color: '#38BDF8' },
  { id: 'sandstone-warm', name: 'Sandstone Warm', mode: 'light', color: '#854D0E' },
  { id: 'peach-blossom', name: 'Peach Blossom', mode: 'light', color: '#F56565' },
  { id: 'olive-grove', name: 'Olive Grove', mode: 'light', color: '#84CC16' },
  { id: 'glacier-pure', name: 'Glacier Pure', mode: 'light', color: '#0EA5E9' },
  { id: 'terracotta-earth', name: 'Terracotta Earth', mode: 'light', color: '#DC2626' },
  { id: 'sapphire-glow', name: 'Sapphire Glow', mode: 'light', color: '#2563EB' },
  { id: 'cherry-blossom', name: 'Cherry Blossom', mode: 'light', color: '#EC4899' },
  { id: 'desert-dune', name: 'Desert Dune', mode: 'light', color: '#EAB308' },

  // 18 Dark Themes
  { id: 'nordic-frost', name: 'Nordic Frost', mode: 'dark', color: '#38BDF8' },
  { id: 'midnight-oled', name: 'Midnight OLED', mode: 'dark', color: '#6366F1' },
  { id: 'cyberpunk-synthwave', name: 'Cyberpunk Synthwave', mode: 'dark', color: '#F43F5E' },
  { id: 'emerald-matrix', name: 'Emerald Matrix', mode: 'dark', color: '#10B981' },
  { id: 'dracula-eclipse', name: 'Dracula Eclipse', mode: 'dark', color: '#CBA6F7' },
  { id: 'abyssal-ocean', name: 'Abyssal Ocean', mode: 'dark', color: '#38BDF8' },
  { id: 'solar-ember', name: 'Solar Ember', mode: 'dark', color: '#F97316' },
  { id: 'amethyst-twilight', name: 'Amethyst Twilight', mode: 'dark', color: '#A855F7' },
  { id: 'monochrome-carbon', name: 'Monochrome Carbon', mode: 'dark', color: '#E4E4E7' },
  { id: 'deep-crimson', name: 'Deep Crimson', mode: 'dark', color: '#F43F5E' },
  { id: 'void-black', name: 'Void Black', mode: 'dark', color: '#6366F1' },
  { id: 'neon-tokyo', name: 'Neon Tokyo', mode: 'dark', color: '#FF3399' },
  { id: 'graphite-slate', name: 'Graphite Slate', mode: 'dark', color: '#94A3B8' },
  { id: 'aurora-borealis', name: 'Aurora Borealis', mode: 'dark', color: '#38B2AC' },
  { id: 'deep-forest', name: 'Deep Forest', mode: 'dark', color: '#4CAF50' },
  { id: 'cobalt-navy', name: 'Cobalt Navy', mode: 'dark', color: '#64FFDA' },
  { id: 'volcanic-ash', name: 'Volcanic Ash', mode: 'dark', color: '#EF4444' },
  { id: 'stellar-dark', name: 'Stellar Dark', mode: 'dark', color: '#58A6FF' },
];

export const FONTS_LIST = [
  { id: 'inter', name: 'Inter (Modern Standard)', family: 'Inter' },
  { id: 'jakarta', name: 'Plus Jakarta Sans (Contemporary)', family: 'Plus Jakarta Sans' },
  { id: 'outfit', name: 'Outfit (Sleek Geometric)', family: 'Outfit' },
  { id: 'poppins', name: 'Poppins (Friendly Rounded)', family: 'Poppins' },
  { id: 'roboto', name: 'Roboto (Google Classic)', family: 'Roboto' },
];

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('wt_theme') || 'indigo-nebula';
  });

  const [font, setFontState] = useState(() => {
    return localStorage.getItem('wt_font') || 'inter';
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('wt_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const setFont = (newFont) => {
    setFontState(newFont);
    localStorage.setItem('wt_font', newFont);
    document.documentElement.setAttribute('data-font', newFont);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-font', font);
  }, [theme, font]);

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      font,
      setFont,
      themesList: THEMES_LIST,
      fontsList: FONTS_LIST
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
