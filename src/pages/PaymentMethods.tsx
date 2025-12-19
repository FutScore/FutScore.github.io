import React from 'react';
import PaymentMethodManager from '../components/PaymentMethodManager';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Container, Typography, Alert } from '@mui/material';

const PaymentMethods: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">
          Por favor, faz login para gerir os teus métodos de pagamento.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Gestão de Métodos de Pagamento
      </Typography>
      
      {user.id ? (
        <PaymentMethodManager userId={user.id} />
      ) : (
        <Alert severity="error">
          Utilizador não encontrado. (user.id está undefined)
        </Alert>
      )}
    </Container>
  );
};

export default PaymentMethods;
