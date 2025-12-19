import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { fetchOrders } from '../store/slices/orderSlice';

interface PaymentProofModalProps {
  open: boolean;
  onClose: () => void;
  order: any;
}

const PaymentProofModal: React.FC<PaymentProofModalProps> = ({ open, onClose, order }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [proofReference, setProofReference] = useState('');
  const [proofImage, setProofImage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Revolut');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProofImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Por favor, carregue um ficheiro de imagem');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('O tamanho da imagem deve ser inferior a 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setProofImage(result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    // Payment proof is now optional, so we can proceed even without it

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/.netlify/functions/updateorderpaymentproof/${order.id}`,
        {
          proofReference: proofReference.trim() || null,
          proofImage: proofImage || null,
          paymentMethod,
          paymentRecipient: selectedRecipient || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update order status to pending
      await axios.put(
        `${API_BASE_URL}/.netlify/functions/updateorderstatus/${order.id}`,
        { status: 'pending' },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      dispatch(fetchOrders({} as any));
      onClose();
      setProofReference('');
      setProofImage('');
      setPaymentMethod('Revolut');
      setSelectedRecipient('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao atualizar a prova de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setProofReference('');
      setProofImage('');
      setPaymentMethod('Revolut');
      setSelectedRecipient('');
      setError(null);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Adicionar Prova de Pagamento</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Encomenda #{order.id} - Total: €{order.total_price?.toFixed(2)}
        </Typography>

        <TextField
          fullWidth
          label="Referência de Pagamento (Opcional)"
          value={proofReference}
          onChange={(e) => setProofReference(e.target.value)}
          margin="normal"
          placeholder="Ex: REF123456789"
        />

        <TextField
          fullWidth
          select
          label="Método de Pagamento"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          margin="normal"
        >
          <MenuItem value="Revolut">Revolut</MenuItem>
          <MenuItem value="PayPal">PayPal</MenuItem>
          <MenuItem value="Bank Transfer">Transferência Bancária</MenuItem>
        </TextField>

        {/* Recipient quick-select, like Cart */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Enviei para:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant={selectedRecipient === 'MIGUEL' ? 'contained' : 'outlined'}
              onClick={() => setSelectedRecipient('MIGUEL')}
              sx={{ minWidth: 120 }}
            >
              MIGUEL
            </Button>
            <Button
              variant={selectedRecipient === 'HUGO' ? 'contained' : 'outlined'}
              onClick={() => setSelectedRecipient('HUGO')}
              sx={{ minWidth: 120 }}
            >
              HUGO
            </Button>
          </Box>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" component="label" fullWidth>
            Carregar Imagem de Prova
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleProofImageChange}
            />
          </Button>
          {proofImage && (
            <Box sx={{ mt: 1 }}>
              <img
                src={proofImage}
                alt="Prova de pagamento"
                style={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Enviar Prova'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentProofModal; 