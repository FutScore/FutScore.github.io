import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Grid,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Home as HomeIcon,
  Email as EmailIcon,
  Instagram as InstagramIcon,
  Lock as LockIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout, setUser } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api';

const UserPanel = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State for dialogs
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [instagramDialogOpen, setInstagramDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  // State for form data
  const [userEmail, setUserEmail] = useState(user?.userEmail || user?.email || '');
  const [instagramNames, setInstagramNames] = useState<string[]>(
    user?.instagramNames ? JSON.parse(user.instagramNames) : 
    user?.instagramName ? [user.instagramName] : []
  );
  const [newInstagramName, setNewInstagramName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State for loading and errors
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [instagramLoading, setInstagramLoading] = useState(false);
  const [instagramError, setInstagramError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Email management
  const handleOpenEmailDialog = () => {
    setUserEmail(user?.userEmail || user?.email || '');
    setEmailError(null);
    setEmailDialogOpen(true);
  };

  const handleCloseEmailDialog = () => {
    setEmailDialogOpen(false);
    setEmailError(null);
  };

  const handleSaveEmail = async () => {
    setEmailLoading(true);
    setEmailError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/.netlify/functions/updateuseremail/${user?.id}`, { userEmail }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch(setUser({ ...user, userEmail }));
      setEmailDialogOpen(false);
    } catch (err: any) {
      setEmailError('Erro ao atualizar o email.');
    }
    setEmailLoading(false);
  };

  // Instagram management
  const handleOpenInstagramDialog = () => {
    setInstagramNames(
      user?.instagramNames ? JSON.parse(user.instagramNames) : 
      user?.instagramName ? [user.instagramName] : []
    );
    setNewInstagramName('');
    setInstagramError(null);
    setInstagramDialogOpen(true);
  };

  const handleCloseInstagramDialog = () => {
    setInstagramDialogOpen(false);
    setInstagramError(null);
  };

  const handleAddInstagramName = () => {
    if (newInstagramName.trim() && !instagramNames.includes(newInstagramName.trim())) {
      setInstagramNames([...instagramNames, newInstagramName.trim()]);
      setNewInstagramName('');
    }
  };

  const handleRemoveInstagramName = (index: number) => {
    setInstagramNames(instagramNames.filter((_, i) => i !== index));
  };

  const handleSaveInstagramNames = async () => {
    setInstagramLoading(true);
    setInstagramError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/.netlify/functions/updateInstagramName`, { 
        instagramNames: JSON.stringify(instagramNames) 
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh user from backend to ensure state matches persisted data
      if (user?.id) {
        const refreshed = await axios.get(`${API_BASE_URL}/.netlify/functions/getusers?userId=${user.id}`);
        if (refreshed?.data) {
          dispatch(setUser({ ...user, ...refreshed.data }));
        } else {
          dispatch(setUser({ ...user, instagramNames: JSON.stringify(instagramNames) }));
        }
      } else {
        dispatch(setUser({ ...user, instagramNames: JSON.stringify(instagramNames) }));
      }
      setInstagramDialogOpen(false);
    } catch (err: any) {
      setInstagramError('Erro ao atualizar os nomes do Instagram.');
    }
    setInstagramLoading(false);
  };

  // Password management
  const handleOpenPasswordDialog = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setPasswordDialogOpen(true);
  };

  const handleClosePasswordDialog = () => {
    setPasswordDialogOpen(false);
    setPasswordError(null);
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('As palavras-passe não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('A nova palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/.netlify/functions/changepassword`, {
        currentPassword,
        newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPasswordDialogOpen(false);
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Erro ao alterar a palavra-passe.');
    }
    setPasswordLoading(false);
  };

  const userOptions = [
    {
      title: 'Minhas Moradas',
      description: 'Gerir as tuas moradas de entrega',
      icon: <HomeIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/moradas'),
      color: '#4CAF50',
    },
    {
      title: 'Atualizar Email',
      description: 'Alterar o email para notificações',
      icon: <EmailIcon sx={{ fontSize: 40 }} />,
      action: handleOpenEmailDialog,
      color: '#2196F3',
    },
    {
      title: 'Gerir Nomes do Instagram',
      description: 'Configurar os teus nomes do Instagram',
      icon: <InstagramIcon sx={{ fontSize: 40 }} />,
      action: handleOpenInstagramDialog,
      color: '#E91E63',
    },
    {
      title: 'Métodos de Pagamento',
      description: 'Gerir os teus métodos de pagamento',
      icon: <PaymentIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/payment-methods'),
      color: '#4CAF50',
    },
    {
      title: 'Mudar Palavra-passe',
      description: 'Alterar a tua palavra-passe',
      icon: <LockIcon sx={{ fontSize: 40 }} />,
      action: handleOpenPasswordDialog,
      color: '#FF9800',
    },
    {
      title: 'Sair',
      description: 'Terminar sessão na aplicação',
      icon: <LogoutIcon sx={{ fontSize: 40 }} />,
      action: handleLogout,
      color: '#F44336',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Painel do Utilizador
      </Typography>
      
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <PersonIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Bem-vindo, {user?.email}
        </Typography>
        {user?.instagramNames && (
          <Typography variant="body1" color="text.secondary">
            Instagram: {(() => {
              try {
                const names = JSON.parse(user.instagramNames);
                return names.map((name: string, index: number) => (
                  <span key={index}>
                    @{name}{index < names.length - 1 ? ', ' : ''}
                  </span>
                ));
              } catch (error) {
                return null;
              }
            })()}
          </Typography>
        )}
        {user?.instagramName && !user?.instagramNames && (
          <Typography variant="body1" color="text.secondary">
            Instagram: @{user.instagramName}
          </Typography>
        )}
      </Box>

      <Grid container spacing={3}>
        {Array.isArray(userOptions) && userOptions.map((option, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              onClick={option.action}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: option.color, mb: 2 }}>
                  {option.icon}
                </Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {option.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {option.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onClose={handleCloseEmailDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Atualizar Email</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email para notificações"
            type="email"
            fullWidth
            value={userEmail}
            onChange={e => setUserEmail(e.target.value)}
            InputProps={{ startAdornment: <EmailIcon sx={{ mr: 1 }} /> }}
          />
          {emailError && <Alert severity="error" sx={{ mt: 2 }}>{emailError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEmailDialog}>Cancelar</Button>
          <Button onClick={handleSaveEmail} disabled={emailLoading} variant="contained">
            {emailLoading ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Instagram Dialog */}
      <Dialog open={instagramDialogOpen} onClose={handleCloseInstagramDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Gerir Nomes do Instagram</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Adiciona os teus nomes do Instagram para personalização das camisolas
            </Typography>
            
            {/* Add new Instagram name */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                autoFocus
                margin="dense"
                label="Novo nome do Instagram"
                type="text"
                fullWidth
                value={newInstagramName}
                onChange={e => setNewInstagramName(e.target.value)}
                InputProps={{ startAdornment: <InstagramIcon sx={{ mr: 1 }} /> }}
                placeholder="@seu_nome"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddInstagramName();
                  }
                }}
              />
              <Button 
                variant="outlined" 
                onClick={handleAddInstagramName}
                disabled={!newInstagramName.trim() || instagramNames.includes(newInstagramName.trim())}
                sx={{ minWidth: 'auto', px: 2 }}
              >
                +
              </Button>
            </Box>

            {/* Display existing Instagram names */}
            {instagramNames.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Nomes atuais:
                </Typography>
                {Array.isArray(instagramNames) && instagramNames.map((name, index) => (
                  <Box key={index} sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    p: 1,
                    mb: 1,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    backgroundColor: '#f9f9f9'
                  }}>
                    <Typography variant="body2">
                      @{name}
                    </Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleRemoveInstagramName(index)}
                      sx={{ minWidth: 'auto', p: 0.5 }}
                    >
                      ×
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
          {instagramError && <Alert severity="error" sx={{ mt: 2 }}>{instagramError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInstagramDialog}>Cancelar</Button>
          <Button onClick={handleSaveInstagramNames} disabled={instagramLoading} variant="contained">
            {instagramLoading ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={handleClosePasswordDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Mudar Palavra-passe</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Palavra-passe atual"
            type="password"
            fullWidth
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            InputProps={{ startAdornment: <LockIcon sx={{ mr: 1 }} /> }}
          />
          <TextField
            margin="dense"
            label="Nova palavra-passe"
            type="password"
            fullWidth
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            InputProps={{ startAdornment: <LockIcon sx={{ mr: 1 }} /> }}
          />
          <TextField
            margin="dense"
            label="Confirmar nova palavra-passe"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            InputProps={{ startAdornment: <LockIcon sx={{ mr: 1 }} /> }}
          />
          {passwordError && <Alert severity="error" sx={{ mt: 2 }}>{passwordError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>Cancelar</Button>
          <Button onClick={handleSavePassword} disabled={passwordLoading} variant="contained">
            {passwordLoading ? <CircularProgress size={24} /> : 'Alterar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserPanel; 