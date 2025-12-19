import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { getAddresses, addAddress, editAddress, removeAddress } from '../store/slices/addressSlice';
import {
  Box,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';

const AddressManager = ({ userId, onSelect }: { userId: number, onSelect?: (address: any) => void }) => {
  const dispatch = useAppDispatch();
  const { addresses, loading, error } = useAppSelector((state) => state.address);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ 
    nome: '', 
    telemovel: '', 
    morada: '', 
    cidade: '', 
    distrito: '', 
    codigoPostal: '', 
    pais: 'Portugal' 
  });

  useEffect(() => {
    dispatch(getAddresses(userId));
  }, [dispatch, userId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      dispatch(editAddress({ ...form, id: editing.id, userId }));
      setEditing(null);
    } else {
      dispatch(addAddress({ ...form, userId }));
    }
    setForm({ 
      nome: '', 
      telemovel: '', 
      morada: '', 
      cidade: '', 
      distrito: '', 
      codigoPostal: '', 
      pais: 'Portugal' 
    });
  };

  const handleEdit = (address: any) => {
    setEditing(address);
    setForm(address);
  };

  const handleDelete = (id: number) => {
    dispatch(removeAddress({ id, userId }));
  };

  const handleSelect = (address: any) => {
    // In select mode, fill the form for editing (like pencil)
    setEditing(address);
    setForm(address);
    if (onSelect) onSelect(address);
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({ 
      nome: '', 
      telemovel: '', 
      morada: '', 
      cidade: '', 
      distrito: '', 
      codigoPostal: '', 
      pais: 'Portugal' 
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Moradas
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {onSelect && (
        <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
          Selecione uma morada para usar no pedido:
        </Typography>
      )}

      <List>
        {Array.isArray(addresses) && addresses.map((address: any) => (
          <Paper key={address.id} sx={{ mb: 2, p: 2 }}>
            <ListItem disablePadding>
              <ListItemText
                primary={address.nome}
                secondary={`${address.morada}, ${address.cidade}, ${address.distrito}, ${address.codigoPostal}, ${address.pais} - ${address.telemovel}`}
              />
              <ListItemSecondaryAction>
                {onSelect ? (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleEdit(address)}
                    startIcon={<CheckIcon />}
                  >
                    Usar
                  </Button>
                ) : (
                  <>
                    <IconButton 
                      edge="end" 
                      aria-label="edit" 
                      onClick={() => handleEdit(address)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      aria-label="delete" 
                      onClick={() => handleDelete(address.id)}
                      sx={{ mr: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          </Paper>
        ))}
      </List>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          {editing ? 'Editar Morada' : 'Adicionar Nova Morada'}
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telemóvel"
                value={form.telemovel}
                onChange={(e) => setForm({ ...form, telemovel: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Morada"
                value={form.morada}
                onChange={(e) => setForm({ ...form, morada: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cidade"
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Distrito"
                value={form.distrito}
                onChange={(e) => setForm({ ...form, distrito: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Código Postal"
                value={form.codigoPostal}
                onChange={(e) => setForm({ ...form, codigoPostal: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="País"
                value={form.pais}
                onChange={(e) => setForm({ ...form, pais: e.target.value })}
                required
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {editing ? 'Atualizar' : 'Adicionar'}
            </Button>
            {editing && (
              <Button
                type="button"
                variant="outlined"
                onClick={handleCancel}
              >
                Cancelar
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default AddressManager; 