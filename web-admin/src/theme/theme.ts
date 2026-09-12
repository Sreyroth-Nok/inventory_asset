import { createTheme, type ThemeOptions } from '@mui/material';

export const getMuiTheme = (mode: 'light' | 'dark') => {
  const isLight = mode === 'light';

  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: '#ff5252',
        light: '#ff8e8e',
        dark: '#e04848',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#06b6d4',
        light: '#67e8f9',
        dark: '#0e7490',
        contrastText: '#ffffff',
      },
      background: {
        default: isLight ? '#f4f6f8' : '#0b0f19',
        paper: isLight ? '#ffffff' : '#131b2e',
      },
      text: {
        primary: isLight ? '#1e293b' : '#f8fafc',
        secondary: isLight ? '#64748b' : '#94a3b8',
        disabled: isLight ? '#94a3b8' : '#64748b',
      },
      divider: isLight ? '#eaedf1' : 'rgba(255, 255, 255, 0.08)',
      action: {
        hover: isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.05)',
        selected: isLight ? '#ffe8e6' : 'rgba(255, 82, 82, 0.18)',
      },
    },
    typography: {
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      h1: { fontWeight: 800, letterSpacing: '-0.02em' },
      h2: { fontWeight: 800, letterSpacing: '-0.02em' },
      h3: { fontWeight: 700, letterSpacing: '-0.01em' },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isLight ? '#f4f6f8' : '#0b0f19',
            color: isLight ? '#1e293b' : '#f8fafc',
            transition: 'background-color 0.2s ease, color 0.2s ease',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          contained: {
            backgroundColor: '#ff5252',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#e04848',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '14px',
            border: isLight ? '1px solid #eaedf1' : '1px solid rgba(255, 255, 255, 0.08)',
            backgroundImage: 'none',
            boxShadow: isLight ? '0 2px 10px rgba(0, 0, 0, 0.03)' : '0 4px 20px rgba(0, 0, 0, 0.4)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: isLight ? '1px solid #eaedf1' : '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: isLight ? '#ffffff' : '#111726',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isLight ? '#ffffff' : '#111726',
            color: isLight ? '#1e293b' : '#f8fafc',
            borderBottom: isLight ? '1px solid #eaedf1' : '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'none',
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};
