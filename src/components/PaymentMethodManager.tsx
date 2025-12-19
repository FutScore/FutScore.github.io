import React, { useEffect, useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import PaymentIcon from '@mui/icons-material/Payment';
import axios from 'axios';
import { API_BASE_URL } from '../api';

interface PaymentMethod {
  id: number;
  name: string;
  method: string;
  accountInfo: string;
  isDefault: boolean;
}

interface PaymentMethodManagerProps {
  userId: number;
  onSelect?: (paymentMethod: PaymentMethod) => void;
}

const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({ userId, onSelect }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState({
    name: '',
    method: 'Revolut',
    accountInfo: '',
    isDefault: false,
  });

  const paymentTypes = [
    { value: 'Revolut', label: 'Revolut' },
    { value: 'PayPal', label: 'PayPal' },
    { value: 'Bank Transfer', label: 'Transferência Bancária' },
  ];

  useEffect(() => {
    fetchPaymentMethods();
  }, [userId]);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/.netlify/functions/getpaymentmethods`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaymentMethods(response.data);
    } catch (err: any) {
      setError('Erro ao carregar métodos de pagamento');
      console.error('Error fetching payment methods:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      if (editing) {
        // Update existing payment method
        await axios.put(
          `${API_BASE_URL}/.netlify/functions/updatepaymentmethod/${editing.id}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEditing(null);
      } else {
        // Create new payment method
        await axios.post(
          `${API_BASE_URL}/.netlify/functions/createpaymentmethod`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      // Reset form
      setForm({
        name: '',
        method: 'Revolut',
        accountInfo: '',
        isDefault: false,
      });
      
      // Refresh the list
      await fetchPaymentMethods();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar método de pagamento');
    }
  };

  const handleEdit = (paymentMethod: PaymentMethod) => {
    setEditing(paymentMethod);
    setForm({
      name: paymentMethod.name,
      method: paymentMethod.method,
      accountInfo: paymentMethod.accountInfo,
      isDefault: paymentMethod.isDefault,
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover este método de pagamento?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/.netlify/functions/deletepaymentmethod/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchPaymentMethods();
    } catch (err: any) {
      setError('Erro ao remover método de pagamento');
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setForm({
      name: '',
      method: 'Revolut',
      accountInfo: '',
      isDefault: false,
    });
  };

  const getPlaceholderText = (method: string) => {
    switch (method) {
      case 'Revolut':
        return 'Ex: +351 912 345 678';
      case 'PayPal':
        return 'Ex: email@exemplo.com';
      case 'Bank Transfer':
        return 'Ex: PT50 0002 0123 1234 5678 9015 4';
      default:
        return 'Informação da conta';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'Revolut':
        return '#00D4FF';
      case 'PayPal':
        return '#0070BA';
      case 'Bank Transfer':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PaymentIcon />
        Métodos de Pagamento
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Add/Edit Form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          {editing ? 'Editar Método de Pagamento' : 'Adicionar Novo Método de Pagamento'}
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nome Descritivo"
                fullWidth
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Revolut Principal, PayPal Pessoal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Pagamento</InputLabel>
                <Select
                  value={form.method}
                  label="Tipo de Pagamento"
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                >
                  {paymentTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Informação da Conta"
                fullWidth
                value={form.accountInfo}
                onChange={(e) => setForm({ ...form, accountInfo: e.target.value })}
                placeholder={getPlaceholderText(form.method)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  />
                }
                label="Definir como método padrão"
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={editing ? <CheckIcon /> : <AddIcon />}
                >
                  {editing ? 'Atualizar' : 'Adicionar'}
                </Button>
                {editing && (
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                  >
                    Cancelar
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Payment Methods List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper>
          {paymentMethods.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Nenhum método de pagamento cadastrado
              </Typography>
            </Box>
          ) : (
            <List>
              {paymentMethods.map((paymentMethod, index) => (
                <ListItem
                  key={paymentMethod.id}
                  divider={index < paymentMethods.length - 1}
                  sx={{ 
                    cursor: onSelect ? 'pointer' : 'default',
                    '&:hover': onSelect ? { backgroundColor: 'action.hover' } : {}
                  }}
                  onClick={() => onSelect?.(paymentMethod)}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          {paymentMethod.name}
                        </Typography>
                        {paymentMethod.isDefault && (
                          <Chip
                            label="Padrão"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Chip
                          label={paymentMethod.method}
                          size="small"
                          sx={{
                            backgroundColor: getMethodColor(paymentMethod.method),
                            color: 'white',
                            mr: 1,
                          }}
                        />
                        <Typography variant="body2" component="span">
                          {paymentMethod.accountInfo}
                        </Typography>
                      </Box>
                    }
                  />
                  {!onSelect && (
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleEdit(paymentMethod)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDelete(paymentMethod.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default PaymentMethodManager;
