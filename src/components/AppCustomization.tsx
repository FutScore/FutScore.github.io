import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
} from '@mui/material';
import { CloudUpload, Image, Business } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { updateAppSettings } from '../store/slices/appSettingsSlice';

interface AppSettings {
  logo?: string;
  backgroundImage?: string;
  logoHeight?: number;
  backgroundOpacity?: number;
}

const AppCustomization: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { appSettings, loading, error } = useSelector((state: RootState) => state.appSettings);
  
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [backgroundDialogOpen, setBackgroundDialogOpen] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [backgroundPreview, setBackgroundPreview] = useState<string>('');
  const [logoHeight, setLogoHeight] = useState<number>(40);
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(0.1);

  useEffect(() => {
    if (appSettings) {
      setLogoPreview(appSettings.logo || '');
      setBackgroundPreview(appSettings.backgroundImage || '');
      setLogoHeight(appSettings.logoHeight || 40);
      setBackgroundOpacity(appSettings.backgroundOpacity || 0.1);
    }
  }, [appSettings]);

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBackgroundFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveLogo = async () => {
    if (!logoFile) return;

    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      formData.append('logoHeight', logoHeight.toString());

      await dispatch(updateAppSettings({
        logo: logoPreview,
        logoHeight,
      })).unwrap();

      setLogoDialogOpen(false);
      setLogoFile(null);
    } catch (err) {
      console.error('Erro ao atualizar logo:', err);
    }
  };

  const handleSaveBackground = async () => {
    if (!backgroundFile) return;

    try {
      await dispatch(updateAppSettings({
        backgroundImage: backgroundPreview,
        backgroundOpacity,
      })).unwrap();

      setBackgroundDialogOpen(false);
      setBackgroundFile(null);
    } catch (err) {
      console.error('Erro ao atualizar background:', err);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await dispatch(updateAppSettings({
        logo: '',
        logoHeight: 40,
      })).unwrap();
      setLogoPreview('');
    } catch (err) {
      console.error('Erro ao remover logo:', err);
    }
  };

  const handleRemoveBackground = async () => {
    try {
      await dispatch(updateAppSettings({
        backgroundImage: '',
        backgroundOpacity: 0.1,
      })).unwrap();
      setBackgroundPreview('');
    } catch (err) {
      console.error('Erro ao remover background:', err);
    }
  };

  if (loading && !appSettings) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Personalização da Aplicação
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Personalize o visual da aplicação alterando o logo e a imagem de fundo.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Logo Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Business sx={{ mr: 1 }} />
                <Typography variant="h6">Logo da Aplicação</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                O logo aparece na barra de navegação no lugar de "FutScore".
              </Typography>

              {logoPreview && (
                <Box sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="body2" gutterBottom>Pré-visualização:</Typography>
                  <img 
                    src={logoPreview} 
                    alt="Logo Preview" 
                    style={{ 
                      maxHeight: `${logoHeight}px`, 
                      maxWidth: '200px',
                      objectFit: 'contain'
                    }} 
                  />
                </Box>
              )}

              <Typography variant="body2" gutterBottom>
                Altura do Logo: {logoHeight}px
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                onClick={() => setLogoDialogOpen(true)}
              >
                {logoPreview ? 'Alterar Logo' : 'Adicionar Logo'}
              </Button>
              {logoPreview && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleRemoveLogo}
                >
                  Remover
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>

        {/* Background Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Image sx={{ mr: 1 }} />
                <Typography variant="h6">Imagem de Fundo</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                A imagem de fundo é aplicada a toda a aplicação com opacidade configurável.
              </Typography>

              {backgroundPreview && (
                <Box sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="body2" gutterBottom>Pré-visualização:</Typography>
                  <Box
                    sx={{
                      height: 100,
                      backgroundImage: `url(${backgroundPreview})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: 1,
                      opacity: backgroundOpacity,
                      border: '1px solid #ddd'
                    }}
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Opacidade: {Math.round(backgroundOpacity * 100)}%
                  </Typography>
                </Box>
              )}
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                onClick={() => setBackgroundDialogOpen(true)}
              >
                {backgroundPreview ? 'Alterar Fundo' : 'Adicionar Fundo'}
              </Button>
              {backgroundPreview && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleRemoveBackground}
                >
                  Remover
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Logo Dialog */}
      <Dialog open={logoDialogOpen} onClose={() => setLogoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configurar Logo</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="logo-upload"
                type="file"
                onChange={handleLogoFileChange}
              />
              <label htmlFor="logo-upload">
                <Button variant="outlined" component="span" startIcon={<CloudUpload />} fullWidth>
                  Selecionar Imagem do Logo
                </Button>
              </label>
            </Grid>
            
            {logoPreview && (
              <>
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    Pré-visualização:
                  </Typography>
                  <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1, textAlign: 'center' }}>
                    <img 
                      src={logoPreview} 
                      alt="Logo Preview" 
                      style={{ 
                        maxHeight: `${logoHeight}px`, 
                        maxWidth: '200px',
                        objectFit: 'contain'
                      }} 
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    Altura do Logo (px):
                  </Typography>
                  <input
                    type="range"
                    min="20"
                    max="80"
                    value={logoHeight}
                    onChange={(e) => setLogoHeight(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <Typography variant="caption" display="block" textAlign="center">
                    {logoHeight}px
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleSaveLogo} 
            variant="contained"
            disabled={!logoFile}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Background Dialog */}
      <Dialog open={backgroundDialogOpen} onClose={() => setBackgroundDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configurar Imagem de Fundo</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="background-upload"
                type="file"
                onChange={handleBackgroundFileChange}
              />
              <label htmlFor="background-upload">
                <Button variant="outlined" component="span" startIcon={<CloudUpload />} fullWidth>
                  Selecionar Imagem de Fundo
                </Button>
              </label>
            </Grid>
            
            {backgroundPreview && (
              <>
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    Pré-visualização:
                  </Typography>
                  <Box
                    sx={{
                      height: 150,
                      backgroundImage: `url(${backgroundPreview})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: 1,
                      opacity: backgroundOpacity,
                      border: '1px solid #ddd'
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    Opacidade:
                  </Typography>
                  <input
                    type="range"
                    min="0.05"
                    max="0.5"
                    step="0.05"
                    value={backgroundOpacity}
                    onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <Typography variant="caption" display="block" textAlign="center">
                    {Math.round(backgroundOpacity * 100)}%
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackgroundDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleSaveBackground} 
            variant="contained"
            disabled={!backgroundFile}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppCustomization;
