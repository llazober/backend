import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1', // Indigo
      light: '#818cf8',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#f43f5e', // Rose
      light: '#fb7185',
      dark: '#e11d48',
    },
    background: {
      default: '#070a13',
      paper: '#0f172a',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
    error: {
      main: '#f43f5e', // Critical
    },
    warning: {
      main: '#f97316', // High
    },
    info: {
      main: '#38bdf8', // Normal
    },
    success: {
      main: '#10b981', // Completed
    },
  },
  typography: {
    fontFamily: '"Inter", "Outfit", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 800,
    },
    h2: {
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 700,
    },
    h4: {
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      fontFamily: 'Outfit, sans-serif',
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'none',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.03)',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 20px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
            borderColor: 'rgba(99, 102, 241, 0.25)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0b0f19',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
  },
});

export default theme;
