import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchOrderStates, updateOrderStateAsync } from '../store/slices/orderStateSlice';
import { OrderState } from '../types';

const OrderStateManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orderStates, loading, error } = useSelector((state: RootState) => state.orderStates);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<OrderState | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    name_user: '',
    name_admin: '',
    color: '#ff9800', // Default to orange
    description: '',
  });

  useEffect(() => {
    dispatch(fetchOrderStates());
  }, [dispatch]);

  const handleEditClick = (orderState: OrderState) => {
    setSelectedState(orderState);
    setEditForm({
      name: orderState.name,
      name_user: orderState.name_user || orderState.name,
      name_admin: orderState.name_admin || orderState.name,
      color: getColorValue(orderState.color),
      description: orderState.description || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedState) return;

    try {
      await dispatch(updateOrderStateAsync({
        id: selectedState.id,
        name: editForm.name,
        name_user: editForm.name_user,
        name_admin: editForm.name_admin,
        color: editForm.color,
        description: editForm.description,
      })).unwrap();
      
      setEditDialogOpen(false);
      setSelectedState(null);
    } catch (err) {
      console.error('Erro ao atualizar estado:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setSelectedState(null);
    setEditForm({ name: '', name_user: '', name_admin: '', color: '#ff9800', description: '' });
  };

  // Convert color names to hex values
  const getColorValue = (color: string) => {
    const colorMap: { [key: string]: string } = {
      orange: '#ff9800',
      purple: '#9c27b0',
      darkblue: '#1565c0',
      red: '#f44336',
      blue: '#2196f3',
      green: '#4caf50',
      brown: '#795548',
      gray: '#757575'
    };
    return colorMap[color] || color;
  };

  const getColorPreview = (color: string) => {
    // If it's already a hex color, use it directly
    if (color.startsWith('#')) {
      return color;
    }
    // Otherwise, convert from color name
    return getColorValue(color);
  };

  if (loading && orderStates.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Gestão de Estados das Encomendas
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Gerir os nomes e cores dos estados das encomendas. Não é possível criar nem apagar estados, apenas alterar o nome e a cor.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Estado</TableCell>
              <TableCell>Cor</TableCell>
              <TableCell>Descrição da Regra de Negócio</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orderStates.map((orderState) => (
              <TableRow key={orderState.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {orderState.name_admin || orderState.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Chave: {orderState.key}
                  </Typography>
                  {orderState.name_user && orderState.name_user !== orderState.name_admin && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      User: {orderState.name_user}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={orderState.name_admin || orderState.name}
                    size="small"
                    style={{
                      backgroundColor: getColorPreview(orderState.color),
                      color: 'white',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {orderState.description || 'Sem descrição'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleEditClick(orderState)}
                  >
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCancelEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Estado da Encomenda</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Estado (Fallback/Compatibilidade)"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                margin="normal"
                helperText="Nome usado como fallback se name_user ou name_admin não estiverem definidos"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome para Utilizadores"
                value={editForm.name_user}
                onChange={(e) => setEditForm({ ...editForm, name_user: e.target.value })}
                margin="normal"
                helperText="Nome exibido para utilizadores normais"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome para Administradores"
                value={editForm.name_admin}
                onChange={(e) => setEditForm({ ...editForm, name_admin: e.target.value })}
                margin="normal"
                helperText="Nome exibido para administradores"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cor"
                type="color"
                value={editForm.color}
                onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          backgroundColor: editForm.color,
                          borderRadius: 1,
                          border: '1px solid #ccc',
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
                helperText="Selecione a cor desejada ou insira um código hexadecimal (ex: #ff0000)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição da Regra de Negócio"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Pré-visualização:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Admin: ${editForm.name_admin || editForm.name || 'Nome do Estado'}`}
                    style={{
                      backgroundColor: editForm.color,
                      color: 'white',
                    }}
                  />
                  <Chip
                    label={`User: ${editForm.name_user || editForm.name || 'Nome do Estado'}`}
                    style={{
                      backgroundColor: editForm.color,
                      color: 'white',
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>Cancelar</Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained"
            disabled={!editForm.color || !editForm.color.startsWith('#')}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderStateManager;
