import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../store/slices/orderSlice';
import { fetchOrderStates } from '../store/slices/orderStateSlice';
import { RootState, AppDispatch } from '../store';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Button,
  Modal,
  Grid,
  Pagination,
} from '@mui/material';
import { Order, OrderItem } from '../types';
import PaymentProofModal from './PaymentProofModal';
import axios from 'axios';
import { API_BASE_URL } from '../api';

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: 800,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto',
};

const PreviousOrders: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { orders, loading, error, pagination } = useSelector((state: RootState) => state.order);
  const { orderStates } = useSelector((state: RootState) => state.orderStates);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [orderVideos, setOrderVideos] = useState<string[]>([]);
  const [shirtTypes, setShirtTypes] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    const fetchShirtTypes = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/.netlify/functions/getShirtTypes?page=1&limit=1000`);
        const list = Array.isArray(res.data?.shirtTypes) ? res.data.shirtTypes : (Array.isArray(res.data) ? res.data : []);
        setShirtTypes(list.map((t: any) => ({ id: t.id, name: t.name })));
      } catch {}
    };
    fetchShirtTypes();
  }, []);

  // Get order state info dynamically
  // Para utilizadores, usar name_user se disponível, senão name
  const getOrderStateInfo = (status: string) => {
    const orderState = orderStates.find(state => state.key === status);
    if (!orderState) {
      return { name: status, color: 'gray' };
    }
    // Para users, usar name_user se disponível, senão name
    const displayName = orderState.name_user || orderState.name;
    return { ...orderState, name: displayName };
  };

  const statusStyles = (status: string) => {
    const orderState = getOrderStateInfo(status);
    // If it's already a hex color, use it directly
    let backgroundColor = orderState.color;
    if (!backgroundColor.startsWith('#')) {
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
      backgroundColor = colorMap[orderState.color] || orderState.color;
    }
    
    return {
      padding: '2px 8px',
      borderRadius: '12px',
      color: 'white',
      backgroundColor,
      display: 'inline-block',
    } as const;
  };

  // Translation function for product types
  const translateProductType = (productType: string): string => {
    const translations: { [key: string]: string } = {
      'tshirt': 'Camisola',
      'shoes': 'Sapatos',
      'shorts': 'Calções'
    };
    return translations[productType] || productType;
  };

  const handleOpenModal = async (order: Order) => {
    try {
      // Fetch full order details (includes images, patches, payment/address fields)
      const res = await axios.get(`${API_BASE_URL}/.netlify/functions/getorders?orderId=${order.id}`);
      const fullOrder = Array.isArray(res.data) ? res.data[0] : res.data;
      setSelectedOrder(fullOrder || order);
    } catch (err) {
      // Fallback to existing order data if detailed fetch fails
      setSelectedOrder(order);
    }
    
    // Load videos separately to avoid payload size issues
    try {
      const response = await axios.get(`${API_BASE_URL}/.netlify/functions/getOrderVideos?orderId=${order.id}`);
      setOrderVideos(response.data.trackingVideos || []);
    } catch (error) {
      console.error('Error loading order videos:', error);
      setOrderVideos([]);
    }
  };
  const handleCloseModal = () => {
    setSelectedOrder(null);
    setOrderVideos([]);
  };
  
  const handleOpenPaymentModal = (order: Order) => {
    setSelectedOrderForPayment(order);
    setPaymentModalOpen(true);
  };
  
  const handleClosePaymentModal = () => {
    setPaymentModalOpen(false);
    setSelectedOrderForPayment(null);
  };

  useEffect(() => {
    if (user) {
      dispatch(fetchOrders({ userId: user.id, page: currentPage, limit: 10 }));
      dispatch(fetchOrderStates());
    }
  }, [dispatch, user, currentPage]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!orders || orders.length === 0) {
    return null;
  }

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Os Meus Pedidos Anteriores
      </Typography>
      <List>
        {Array.isArray(orders) && orders.map((order) => (
          <ListItem
            key={order.id}
            secondaryAction={
              <Box sx={{ display: 'flex', gap: 1 }}>
                {order.status === 'em_pagamento' && (
                  <Button 
                    variant="contained" 
                    color="warning" 
                    size="small" 
                    onClick={() => handleOpenPaymentModal(order)}
                  >
                    Adicionar Pagamento
                  </Button>
                )}
                <Button variant="outlined" size="small" onClick={() => handleOpenModal(order)}>
                  Detalhes
                </Button>
              </Box>
            }
          >
            <ListItemText
              primary={
                <>
                  {`Encomenda #${order.id} - Estado: `}
                  <span style={statusStyles(order.status)}>{getOrderStateInfo(order.status).name}</span>
                </>
              }
              secondary={
                <>
                  {order.total_price != null
                    ? `Total: €${order.total_price.toFixed(2)}`
                    : 'Total: -'}
                  {order.status === 'em_pagamento' && (
                    <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                      ⚠️ Pagamento pendente - Adicione a prova de pagamento
                    </Typography>
                  )}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
      <Modal
        open={!!selectedOrder}
        onClose={handleCloseModal}
        aria-labelledby="order-details-title"
      >
        <Box sx={modalStyle}>
          {selectedOrder && (
            <>
              <Typography id="order-details-title" variant="h6" component="h2">
                Detalhes da Encomenda #{selectedOrder.id}
              </Typography>
              <Typography sx={{ mt: 2 }}>
                <Typography component="span" sx={{ fontWeight: 'bold' }}>Estado:</Typography> {getOrderStateInfo(selectedOrder.status).name}
              </Typography>
              <Typography>
                <Typography component="span" sx={{ fontWeight: 'bold' }}>Total:</Typography>{' '}
                {selectedOrder.total_price != null
                  ? `€${selectedOrder.total_price.toFixed(2)}`
                  : '-'}
              </Typography>
              {/* Address & Payment */}
              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Morada de Entrega
              </Typography>
              <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
                <Typography variant="body2">{selectedOrder.address_nome}</Typography>
                <Typography variant="body2">{selectedOrder.address_morada}</Typography>
                <Typography variant="body2">{selectedOrder.address_codigo_postal} {selectedOrder.address_cidade}, {selectedOrder.address_distrito}</Typography>
                <Typography variant="body2">{selectedOrder.address_pais}</Typography>
                <Typography variant="body2">Telemóvel: {selectedOrder.address_telemovel}</Typography>
              </Paper>

              {(selectedOrder.paymentMethod || selectedOrder.paymentAccountInfo || selectedOrder.paymentRecipient || selectedOrder.proofReference) && (
                <>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                    Pagamento
                  </Typography>
                  <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
                    {(() => {
                      const parts: string[] = [];
                      if (selectedOrder.paymentRecipient) parts.push(selectedOrder.paymentRecipient);
                      if (selectedOrder.paymentMethod) parts.push(selectedOrder.paymentMethod);
                      // If paymentAccountInfo already includes name/method, prefer it wholly
                      const hasCombined = !!selectedOrder.paymentAccountInfo && /-/.test(selectedOrder.paymentAccountInfo);
                      return (
                        <>
                          {hasCombined ? (
                            <Typography variant="body2">{selectedOrder.paymentAccountInfo}</Typography>
                          ) : (
                            <>
                              {parts.length > 0 && (
                                <Typography variant="body2">{parts.join(' - ')}</Typography>
                              )}
                              {selectedOrder.paymentAccountInfo && (
                                <Typography variant="body2">Conta: {selectedOrder.paymentAccountInfo}</Typography>
                              )}
                            </>
                          )}
                          {selectedOrder.proofReference && (
                            <Typography variant="body2">Referência: {selectedOrder.proofReference}</Typography>
                          )}
                        </>
                      );
                    })()}
                  </Paper>
                </>
              )}

              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Artigos
              </Typography>
              <List>
                {selectedOrder.items.map((item: OrderItem, index: number) => (
                  <Paper key={index} sx={{ p: 2, mb: 2 }} variant="outlined">
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography>
                          <Typography component="span" sx={{ fontWeight: 'bold' }}>Produto:</Typography> {item.name || translateProductType(item.product_type)}
                        </Typography>
                        <Typography>
                          <Typography component="span" sx={{ fontWeight: 'bold' }}>Tamanho:</Typography> {item.size}
                        </Typography>
                        {item.product_type === 'tshirt' && item.shirt_type_id && (
                          <Typography>
                            <Typography component="span" sx={{ fontWeight: 'bold' }}>Tipo de Camisola:</Typography>{' '}
                            {(() => {
                              const st = shirtTypes.find(st => st.id === Number(item.shirt_type_id));
                              return st?.name || item.shirt_type_id;
                            })()}
                          </Typography>
                        )}
                        {item.player_name && (
                          <Typography>
                            <Typography component="span" sx={{ fontWeight: 'bold' }}>Nome do Jogador:</Typography> {item.player_name}
                          </Typography>
                        )}
                        {item.numero && (
                          <Typography>
                            <Typography component="span" sx={{ fontWeight: 'bold' }}>Número:</Typography> {item.numero}
                          </Typography>
                        )}
                        {item.quantity && (
                          <Typography>
                            <Typography component="span" sx={{ fontWeight: 'bold' }}>Quantidade:</Typography> {item.quantity}
                          </Typography>
                        )}
                        {Array.isArray(item.patch_images) && item.patch_images.length > 0 && (
                          <Typography>
                            <Typography component="span" sx={{ fontWeight: 'bold' }}>Patches:</Typography> {item.patch_images.length}
                          </Typography>
                        )}
                        {item.sexo && (
                          <Typography>
                            <Typography component="span" sx={{ fontWeight: 'bold' }}>Sexo:</Typography> {item.sexo}
                          </Typography>
                        )}
                        {item.ano && (
                          <Typography>
                            <Typography component="span" sx={{ fontWeight: 'bold' }}>Ano:</Typography> {item.ano}
                          </Typography>
                        )}
                        {(item as any).anuncios === true && (
                          <Typography>
                            <Typography component="span" sx={{ fontWeight: 'bold' }}>With ads</Typography>
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        {item.image_front && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2">Imagem da Frente:</Typography>
                            <img
                              src={item.image_front}
                              alt="Design da frente"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '150px',
                                border: '1px solid #ddd',
                                cursor: 'zoom-in',
                              }}
                              onClick={() => setImagePreview(item.image_front || null)}
                            />
                          </Box>
                        )}
                        {item.image_back && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2">Imagem das Costas:</Typography>
                            <img
                              src={item.image_back}
                              alt="Design das costas"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '150px',
                                border: '1px solid #ddd',
                                cursor: 'zoom-in',
                              }}
                              onClick={() => setImagePreview(item.image_back || null)}
                            />
                          </Box>
                        )}
                        {Array.isArray(item.patch_images) && item.patch_images.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">Patches:</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {item.patch_images.map((img: string, idx: number) => (
                                <img key={idx} src={img} alt={`patch ${idx + 1}`} style={{ height: 40, border: '1px solid #ccc', borderRadius: 4, cursor: 'zoom-in' }} onClick={() => setImagePreview(img)} />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </List>

              {/* Tracking Information */}
              {(selectedOrder.trackingText || 
                (selectedOrder.trackingImages && selectedOrder.trackingImages.length > 0) ||
                (orderVideos && orderVideos.length > 0)) && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    📦 Informações de Tracking
                  </Typography>
                  
                  {selectedOrder.trackingText && (
                    <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }} variant="outlined">
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Informações de Rastreamento:
                      </Typography>
                      <Typography variant="body2">
                        {selectedOrder.trackingText}
                      </Typography>
                    </Paper>
                  )}
                  
                  {selectedOrder.trackingImages && selectedOrder.trackingImages.length > 0 && (
                    <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Imagens de Tracking:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedOrder.trackingImages.map((img: string, idx: number) => (
                          <Box key={idx}>
                            <img
                              src={img}
                              alt={`Tracking ${idx + 1}`}
                              style={{
                                maxWidth: '150px',
                                maxHeight: '150px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                cursor: 'zoom-in',
                              }}
                              onClick={() => setImagePreview(img)}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  )}

                  {orderVideos && orderVideos.length > 0 && (
                    <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Vídeos de Tracking:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {orderVideos.map((video: string, idx: number) => (
                          <Box key={idx}>
                            <video
                              src={video}
                              controls
                              style={{
                                maxWidth: '300px',
                                maxHeight: '200px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  )}
                </Box>
              )}
              <Button onClick={handleCloseModal} sx={{ mt: 2 }}>
                Fechar
              </Button>
            </>
          )}
        </Box>
      </Modal>
      
      {selectedOrderForPayment && (
        <PaymentProofModal
          open={paymentModalOpen}
          onClose={handleClosePaymentModal}
          order={selectedOrderForPayment}
        />
      )}
      
      {/* Image Preview Modal */}
      <Modal open={!!imagePreview} onClose={() => setImagePreview(null)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', outline: 0 }}>
          {imagePreview && (
            <img src={imagePreview} alt="Preview" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} />
          )}
        </Box>
      </Modal>
      
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.currentPage}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Paper>
  );
};

export default PreviousOrders; 