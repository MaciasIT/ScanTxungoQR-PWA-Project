import { createTheme } from '@mui/material';

const cyberTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e5ff', // Cyber Blue
    },
    secondary: {
      main: '#f50057', // Cyber Pink
    },
    background: {
      default: '#0a0a12', // Deep Dark
      paper: 'rgba(30, 30, 40, 0.7)', // Semi-transparent for Glassmorphism
    },
    success: {
      main: '#00e676',
    },
    error: {
      main: '#ff1744',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '1px',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'radial-gradient(circle at 50% 10%, #1a1a2e 0%, #000000 100%)',
          minHeight: '100vh',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(16px)',
          background: 'rgba(25, 25, 35, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '1rem',
        },
      },
    },
  },
});

export default cyberTheme;
