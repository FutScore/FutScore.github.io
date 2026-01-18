import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Link,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import KeyIcon from '@mui/icons-material/Key';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../store/slices/authSlice';
import { RootState } from '../store';
import { AppDispatch } from '../store';
import axios from 'axios';
import { API_BASE_URL } from '../api';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading, error } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Password Reset State
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetStep, setResetStep] = useState(0);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/store');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(login(formData));
  };

  // Password Reset Handlers
  const handleOpenResetDialog = () => {
    setResetDialogOpen(true);
    setResetStep(0);
    setResetError(null);
    setResetSuccess(null);
    setResetEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setMaskedEmail('');
  };

  const handleCloseResetDialog = () => {
    setResetDialogOpen(false);
    setResetStep(0);
    setResetError(null);
    setResetSuccess(null);
  };

  const handleRequestCode = async () => {
    if (!resetEmail.trim()) {
      setResetError('Por favor, insira o seu email ou nome de utilizador');
      return;
    }

    setResetLoading(true);
    setResetError(null);

    try {
      const isEmail = resetEmail.includes('@');
      const response = await axios.post(`${API_BASE_URL}/.netlify/functions/requestPasswordReset`, {
        email: isEmail ? resetEmail : undefined,
        username: !isEmail ? resetEmail : undefined,
      });

      if (response.data.success) {
        setMaskedEmail(response.data.email || '');
        setResetSuccess(response.data.message);
        setResetStep(1);
      }
    } catch (err: any) {
      setResetError(err.response?.data?.error || 'Erro ao enviar código. Tente novamente.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (resetCode.length !== 6) {
      setResetError('O código deve ter 6 dígitos');
      return;
    }

    setResetLoading(true);
    setResetError(null);

    try {
      const isEmail = resetEmail.includes('@');
      const response = await axios.post(`${API_BASE_URL}/.netlify/functions/verifyResetCode`, {
        email: isEmail ? resetEmail : undefined,
        username: !isEmail ? resetEmail : undefined,
        code: resetCode,
      });

      if (response.data.success) {
        setResetSuccess('Código verificado!');
        setResetStep(2);
      }
    } catch (err: any) {
      setResetError(err.response?.data?.error || 'Código inválido. Tente novamente.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      setResetError('A palavra-passe deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('As palavras-passe não coincidem');
      return;
    }

    setResetLoading(true);
    setResetError(null);

    try {
      const isEmail = resetEmail.includes('@');
      const response = await axios.post(`${API_BASE_URL}/.netlify/functions/resetPasswordWithCode`, {
        email: isEmail ? resetEmail : undefined,
        username: !isEmail ? resetEmail : undefined,
        code: resetCode,
        newPassword,
      });

      if (response.data.success) {
        setResetSuccess(response.data.message);
        setResetStep(3);
      }
    } catch (err: any) {
      setResetError(err.response?.data?.error || 'Erro ao alterar palavra-passe. Tente novamente.');
    } finally {
      setResetLoading(false);
    }
  };

  const resetSteps = ['Identificação', 'Verificar Código', 'Nova Palavra-passe'];

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Entrar
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Nome de Utilizador"
            name="email"
            type="text"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Palavra-passe"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          {/* Forgot Password Link */}
          <Box sx={{ textAlign: 'right', mt: 1 }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={handleOpenResetDialog}
              sx={{
                cursor: 'pointer',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Esqueceu a palavra-passe?
            </Link>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? 'A entrar...' : 'Entrar'}
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Password Reset Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={handleCloseResetDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Recuperar Palavra-passe
          </Typography>
        </DialogTitle>
        <DialogContent>
          {/* Stepper */}
          {resetStep < 3 && (
            <Stepper activeStep={resetStep} sx={{ pt: 2, pb: 4 }}>
              {resetSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          )}

          {/* Error/Success Alerts */}
          {resetError && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setResetError(null)}>
              {resetError}
            </Alert>
          )}
          {resetSuccess && resetStep < 3 && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {resetSuccess}
            </Alert>
          )}

          {/* Step 0: Enter Email/Username */}
          {resetStep === 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Insira o seu email ou nome de utilizador para receber um código de recuperação.
              </Typography>
              <TextField
                fullWidth
                label="Email ou Nome de Utilizador"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
            </Box>
          )}

          {/* Step 1: Enter Code */}
          {resetStep === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enviámos um código de 6 dígitos para <strong>{maskedEmail}</strong>. 
                Verifique a sua caixa de entrada.
              </Typography>
              <TextField
                fullWidth
                label="Código de Verificação"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  maxLength: 6,
                  style: { letterSpacing: '0.5em', fontFamily: 'monospace', fontSize: '1.2rem' },
                }}
                sx={{ mb: 2 }}
              />
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setResetStep(0);
                  setResetCode('');
                  setResetError(null);
                  setResetSuccess(null);
                }}
                sx={{ color: 'text.secondary' }}
              >
                Não recebeu o código? Voltar
              </Button>
            </Box>
          )}

          {/* Step 2: New Password */}
          {resetStep === 2 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Defina a sua nova palavra-passe.
              </Typography>
              <TextField
                fullWidth
                label="Nova Palavra-passe"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                label="Confirmar Palavra-passe"
                type={showNewPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
            </Box>
          )}

          {/* Step 3: Success */}
          {resetStep === 3 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Palavra-passe Alterada!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                A sua palavra-passe foi alterada com sucesso. Pode agora fazer login com a nova palavra-passe.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          {resetStep < 3 && (
            <Button onClick={handleCloseResetDialog} color="inherit">
              Cancelar
            </Button>
          )}
          {resetStep === 0 && (
            <Button
              variant="contained"
              onClick={handleRequestCode}
              disabled={resetLoading || !resetEmail.trim()}
            >
              {resetLoading ? <CircularProgress size={24} /> : 'Enviar Código'}
            </Button>
          )}
          {resetStep === 1 && (
            <Button
              variant="contained"
              onClick={handleVerifyCode}
              disabled={resetLoading || resetCode.length !== 6}
            >
              {resetLoading ? <CircularProgress size={24} /> : 'Verificar'}
            </Button>
          )}
          {resetStep === 2 && (
            <Button
              variant="contained"
              onClick={handleResetPassword}
              disabled={resetLoading || !newPassword || !confirmPassword}
            >
              {resetLoading ? <CircularProgress size={24} /> : 'Alterar Palavra-passe'}
            </Button>
          )}
          {resetStep === 3 && (
            <Button variant="contained" onClick={handleCloseResetDialog}>
              Continuar para Login
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Login;
