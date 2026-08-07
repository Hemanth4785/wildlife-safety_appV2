// Centralized Production Design System for Wildlife Safety App

export const Theme = {
  colors: {
    primary: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981', // Main Emerald
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22',
    },
    neutral: {
      950: '#020617', // Pitch Dark
      900: '#0f172a', // Dark Surface
      850: '#1e293b', // Card Dark Background
      800: '#334155', // Border Slate
      700: '#475569',
      600: '#64748b',
      400: '#94a3b8',
      300: '#cbd5e1',
      200: '#e2e8f0',
      100: '#f1f5f9',
      50: '#f8fafc',
    },
    risk: {
      high: '#ef4444',     // Red-500
      moderate: '#f59e0b', // Amber-500
      low: '#10b981',      // Emerald-500
      info: '#3b82f6',     // Blue-500
    },
    accent: {
      gold: '#f59e0b',
      purple: '#8b5cf6',
      teal: '#14b8a6',
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  shadows: {
    sm: 'shadow-sm shadow-emerald-950/10',
    md: 'shadow-md shadow-emerald-950/20',
    lg: 'shadow-lg shadow-emerald-500/10',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.25)]',
  }
};
