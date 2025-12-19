import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => (
  <Box
    component="footer"
    sx={{
      width: '100%',
      bgcolor: '#f5f5f5',
      borderTop: '1px solid #ececec',
      py: 3,
      mt: 6,
      textAlign: 'center',
      fontWeight: 600,
      color: 'text.primary',
      fontSize: '1.1rem',
      letterSpacing: 0.5,
    }}
  >
    <Typography variant="body1" color="text.primary">
      &copy; {new Date().getFullYear()} FutScore. Todos os direitos reservados.
    </Typography>
  </Box>
);

export default Footer; 