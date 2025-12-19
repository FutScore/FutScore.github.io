import React from 'react';
import AddressManager from '../components/AddressManager';
import { useAppSelector } from '../store';
import { Container, Typography, Alert } from '@mui/material';

const Addresses: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">
          Por favor, faz login para gerir as tuas moradas.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Gestão de Moradas
      </Typography>
      
      {user.id ? (
        <AddressManager userId={user.id} />
      ) : (
        <Alert severity="error">
          Utilizador não encontrado. (user.id está undefined)
        </Alert>
      )}
    </Container>
  );
};

export default Addresses; 