import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#cbbfae', // muted beige
      contrastText: '#222',
    },
    secondary: {
      main: '#f5f5f5', // soft gray
      contrastText: '#222',
    },
    background: {
      default: '#faf9f6', // off-white
      paper: '#fff',
    },
    text: {
      primary: '#222',
      secondary: '#666',
    },
    divider: '#ececec',
  },
  typography: {
    fontFamily: 'Inter, Nunito, Arial, sans-serif',
    fontSize: 17,
    h1: {
      fontWeight: 800,
      fontSize: '2.3rem',
      letterSpacing: '-1px',
    },
    h2: {
      fontWeight: 700,
      fontSize: '1.7rem',
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.2rem',
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
      fontSize: '1rem',
    },
  },
  shape: {
    borderRadius: 16,
  },
  spacing: 10,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#faf9f6',
          minHeight: '100vh',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)',
          padding: '28px 20px',
          border: '1px solid #ececec',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: 'none',
          padding: '12px 28px',
          fontWeight: 700,
          fontSize: '1rem',
          background: '#cbbfae',
          color: '#222',
          '&:hover': {
            background: '#b3a692',
            boxShadow: '0 2px 8px 0 rgba(203,191,174,0.10)',
          },
        },
        containedPrimary: {
          background: '#cbbfae',
          color: '#222',
        },
        containedSecondary: {
          background: '#f5f5f5',
          color: '#222',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          background: '#fff',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          background: '#fff',
          fontSize: '1rem',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          background: '#fff',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingTop: '32px',
          paddingBottom: '32px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)',
          border: '1px solid #ececec',
        },
      },
    },
  },
});

export default theme; 