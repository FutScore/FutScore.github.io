import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  IconButton,
  TextField,
  Alert,
  useTheme,
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { removeFromCart, clearCart, updateCartItem } from '../store/slices/cartSlice';
import { createOrder } from '../store/slices/orderSlice';
import { getAddresses } from '../store/slices/addressSlice';
import { AppDispatch } from '../store';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import AddressManager from '../components/AddressManager';
import PatchSelection from '../components/PatchSelection';
import Check from '@mui/icons-material/Check';

const initialAddress = {
  nome: '',
  morada: '',
  cidade: '',
  distrito: '',
  pais: 'Portugal',
  codigoPostal: '',
  telemovel: '',
};



const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { items } = useSelector((state: RootState) => state.cart);
  const { user } = useSelector((state: RootState) => state.auth);
  const { addresses } = useSelector((state: RootState) => state.address);
  const [address, setAddress] = useState(initialAddress);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [addressMode, setAddressMode] = useState<'manual' | 'saved'>('manual');
  const [proofImage, setProofImage] = useState<string>('');
  const [proofReference, setProofReference] = useState<string>('');
  const [proofError, setProofError] = useState<string | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const proofInputRef = useRef<HTMLInputElement>(null);
  const [cartPrice, setCartPrice] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Revolut');
  const [clientInstagram, setClientInstagram] = useState<string>('');
  
  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<any>(null);
  const [paymentMode, setPaymentMode] = useState<'manual' | 'saved'>('manual');

  // Pricing configuration state
  const [personalizationPrice, setPersonalizationPrice] = useState<number>(3); // Default value
  const [packs, setPacks] = useState<any[]>([]);
  const [shirtTypes, setShirtTypes] = useState<any[]>([]);
  const [patchCatalog, setPatchCatalog] = useState<{ image: string; price: number }[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [patchEditorOpen, setPatchEditorOpen] = useState(false);
  const [patchEditorIndex, setPatchEditorIndex] = useState<number | null>(null);
  const [patchEditorSelection, setPatchEditorSelection] = useState<string[]>([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleRemoveItem = (index: number) => {
    dispatch(removeFromCart(index));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleAddressModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'manual' | 'saved' | null) => {
    if (newMode !== null) {
      setAddressMode(newMode);
      if (newMode === 'manual') {
        setSelectedAddress(null);
        setAddress(initialAddress);
      } else {
        // Load saved addresses if not already loaded
        if (user && (!Array.isArray(addresses) || addresses.length === 0)) {
          dispatch(getAddresses(user.id));
        }
      }
    }
  };

  const handleSelectAddress = (selectedAddr: any) => {
    setSelectedAddress(selectedAddr);
    setAddress(selectedAddr);
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProofError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProofError('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProofError('Image size should be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setProofImage(result);
      } else {
        setProofError('Error processing the image');
      }
    };
    reader.onerror = () => setProofError('Error reading the image file');
    reader.readAsDataURL(file);
  };

  const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProofReference(e.target.value);
  };

  // Check if cart contains custom orders (items from "Novo Pedido")
  // Only items without product_id are considered custom
  const hasCustomItems = items.some(item => !item.product_id);

  const allFieldsFilled = Object.values(address).every((v) => v.trim() !== '');
  const proofProvided = proofImage || selectedRecipient || selectedPaymentMethod;
  // For custom orders, only address is required. For regular orders, both address and payment proof are required
  const canPlaceOrder = items.length > 0 && allFieldsFilled && (hasCustomItems || proofProvided);

  const getBackendItems = (items: any[]) =>
    items.map((item) => item);

  const handleSubmitOrder = async () => {
    if (canPlaceOrder && user) {
      await dispatch(createOrder({ 
        userId: user.id, 
        items: getBackendItems(items), 
        address: { ...address, proofImage, proofReference, selectedRecipient }, 
        paymentMethod,
        clientInstagram: user.role === 'admin' ? clientInstagram : undefined,
        finalPrice: cartPrice !== null ? Number(cartPrice) + (calculateShipping(items) || 0) : undefined,
      }));
      dispatch(clearCart());
      setAddress(initialAddress);
      setProofImage('');
      setProofReference('');
      setSelectedRecipient('');
      setPaymentMethod('Revolut');
      setClientInstagram('');
      setSelectedPaymentMethod(null);
      setPaymentMode('manual');
      navigate('/');
    }
  };

  useEffect(() => {
    const fetchCartPrice = async () => {
      if (items.length === 0) {
        setCartPrice(null);
        return;
      }
      try {
        const res = await axios.post(`${API_BASE_URL}/.netlify/functions/calculateOrderPrice`, {
          items: getBackendItems(items),
        });
        setCartPrice(res.data.price);
      } catch {
        setCartPrice(null);
      }
    };
    fetchCartPrice();
  }, [items]);

  // Fetch addresses and payment methods on mount if user exists
  useEffect(() => {
    if (user) {
      dispatch(getAddresses(user.id));
      fetchPaymentMethods();
    }
    fetchPricingConfiguration();
    fetchPacksAndShirtTypes();
  }, [dispatch, user]);
  
  useEffect(() => {
    const fetchPatchCatalog = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/.netlify/functions/getPatches?page=1&limit=1000`);
        const list = Array.isArray(res.data) ? res.data : (res.data?.patches || []);
        setPatchCatalog(list.map((p: any) => ({ image: p.image, price: Number(p.price || 0) })));
      } catch {}
    };
    fetchPatchCatalog();
  }, []);

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/.netlify/functions/getpaymentmethods`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaymentMethods(response.data);
      
      // Auto-select default payment method if available
      const defaultMethod = response.data.find((method: any) => method.isDefault);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod);
        setPaymentMethod(defaultMethod.method);
        setPaymentMode('saved');
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  // Fetch pricing configuration
  const fetchPricingConfiguration = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/.netlify/functions/getpricingconfig`);
      const configs = Array.isArray(response.data) ? response.data : response.data.pricingConfigs;
      configs.forEach((config: any) => {
        switch (config.key) {
          case 'personalization_price':
            setPersonalizationPrice(config.price);
            break;
          // Backward compatibility if legacy keys exist
          case 'number_price':
          case 'name_price':
            if (!configs.find((c: any) => c.key === 'personalization_price')) {
              setPersonalizationPrice(config.price);
            }
            break;
        }
      });
    } catch (error) {
      console.error('Error fetching pricing configuration:', error);
      // Keep default values if loading fails
    }
  };

  const fetchPacksAndShirtTypes = async () => {
    try {
      const [packsRes, shirtsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/.netlify/functions/getpacks?page=1&limit=200`),
        axios.get(`${API_BASE_URL}/.netlify/functions/getShirtTypes?page=1&limit=200`),
      ]);
      setPacks((packsRes.data?.packs) || []);
      setShirtTypes((shirtsRes.data?.shirtTypes) || []);
    } catch (error) {
      console.error('Error fetching packs/shirt types:', error);
    }
  };

  const calculateShipping = (cartItems: any[]) => {
    const totalQuantity = cartItems.reduce((total, item) => total + (Number(item.quantity) || 1), 0);
    return totalQuantity === 1 ? 2 : 0;
  };

  const findShirtTypeNameById = (id?: number) => {
    if (!id) return undefined;
    const st = shirtTypes.find((t: any) => t.id === id);
    return st?.name;
  };

  const getBestUnitPriceForShirtType = (shirtTypeId: number, countForType: number) => {
    let bestUnit = Infinity;
    for (const pack of packs) {
      if (!Array.isArray(pack.items) || pack.items.length !== 1) continue;
      const packItem = pack.items[0];
      if (packItem.product_type !== 'tshirt') continue;
      const packTypeId = parseInt(packItem.shirt_type_id, 10);
      if (packTypeId !== shirtTypeId) continue;
      const threshold = Number(packItem.quantity || 0);
      if (threshold <= countForType && typeof pack.price === 'number') {
        bestUnit = Math.min(bestUnit, Number(pack.price));
      }
    }
    return bestUnit === Infinity ? null : bestUnit;
  };

  const renderBasePriceInfo = (item: any) => {
    // Only try pack logic for t-shirts with shirt_type_id
    if (item.product_type === 'tshirt' && item.shirt_type_id) {
      const shirtTypeId = Number(item.shirt_type_id);
      // Determine unit base price: prefer item.price, fallback to shirt type price
      const shirtTypeObj = shirtTypes.find((t: any) => t.id === shirtTypeId);
      const unitBase = (typeof item.price === 'number' && item.price > 0)
        ? item.price
        : (typeof shirtTypeObj?.price === 'number' ? Number(shirtTypeObj.price) : 0);
      // Count how many items in cart share the same shirt_type_id (expanded by quantity)
      const countForType = items.reduce((acc, it) => {
        if (it.product_type === 'tshirt' && Number(it.shirt_type_id) === shirtTypeId) {
          return acc + (it.quantity || 1);
        }
        return acc;
      }, 0);
      const bestUnit = getBestUnitPriceForShirtType(shirtTypeId, countForType);
      if (bestUnit != null) {
        const cheaperWithPack = bestUnit < unitBase;
        const qty = item.quantity || 1;
        return (
          <Box>
            <Typography variant="body2" color="text.secondary">
              Preço base: €{(unitBase * qty).toFixed(2)}
            </Typography>
            <Typography variant="body2" color={cheaperWithPack ? 'success.main' : 'text.secondary'}>
              Preço com PACK ({countForType}): €{(bestUnit * qty).toFixed(2)}
            </Typography>
          </Box>
        );
      }
      // If no pack discount applies, still show base price
      const qty = item.quantity || 1;
      return (
        <Typography variant="body2" color="text.secondary">
          Preço base: €{(unitBase * qty).toFixed(2)}
        </Typography>
      );
    }
    // Default: show item unit price when available
    if (typeof item.price === 'number') {
      return (
        <Typography variant="body2" color="text.secondary">
          Preço base: €{((item.quantity || 1) * item.price).toFixed(2)}
        </Typography>
      );
    }
    return null;
  };

  const computePatchCost = (images: string[] | undefined, qty: number): number => {
    if (!Array.isArray(images) || images.length === 0) return 0;
    const perItem = images.reduce((acc, img) => {
      const found = patchCatalog.find(p => p.image === img);
      const price = typeof found?.price === 'number' && !Number.isNaN(found.price) ? found.price : 0;
      return acc + price;
    }, 0);
    return perItem * (qty || 1);
  };

  // Handler to edit/fill the manual form with a saved address (like AddressManager)
  const handleEdit = (addr: any) => {
    setAddress({
      nome: addr.nome || '',
      telemovel: addr.telemovel || '',
      morada: addr.morada || '',
      cidade: addr.cidade || '',
      distrito: addr.distrito || '',
      codigoPostal: addr.codigoPostal || '',
      pais: addr.pais || 'Portugal',
    });
  };

  const handleCartItemFieldChange = (index: number, field: string, value: any) => {
    const updatedItems = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    localStorage.setItem('cart', JSON.stringify({ items: updatedItems }));
    dispatch(updateCartItem({ index, field, value }));
  };

  // Payment method handlers
  const handlePaymentModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'manual' | 'saved' | null) => {
    if (newMode !== null) {
      setPaymentMode(newMode);
      if (newMode === 'manual') {
        setSelectedPaymentMethod(null);
        setPaymentMethod('Revolut');
      } else {
        // Load default payment method if available
        const defaultMethod = paymentMethods.find((method: any) => method.isDefault);
        if (defaultMethod) {
          setSelectedPaymentMethod(defaultMethod);
          setPaymentMethod(defaultMethod.method);
        }
      }
    }
  };

  const handleSelectPaymentMethod = (paymentMethodData: any) => {
    setSelectedPaymentMethod(paymentMethodData);
    setPaymentMethod(paymentMethodData.method);
    setPaymentMode('saved');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Carrinho de Compras
        </Typography>
        {items.length === 0 ? (
          <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
            O teu carrinho está vazio
          </Typography>
        ) : (
          <>
            <Grid container spacing={2}>
              {items.map((item, index) => (
                <Grid item xs={12} key={index}>
                  <Paper sx={{ p: 2, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      {item.image_front && (
                        <img
                          src={item.image_front}
                          alt="Front"
                          style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 4, border: '1px solid #eee', marginRight: 16 }}
                        />
                      )}
                      {item.product_type === 'tshirt' && item.image_back && (
                        <img
                          src={item.image_back}
                          alt="Back"
                          style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 4, border: '1px solid #eee', marginRight: 16 }}
                        />
                      )}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1">
                          {item.product_type === 'tshirt' ? 'Camisola' : (item.name || 'Produto')}
                        </Typography>
                        {item.product_type && (
                          <Typography variant="body2" color="text.secondary">
                            Tipo: {item.product_type}
                          </Typography>
                        )}
                        {item.shirt_type_id && (
                          <Typography variant="body2" color="text.secondary">
                            Tipo de Camisola: {item.shirt_type_name || findShirtTypeNameById(item.shirt_type_id) || item.shirt_type_id}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          Tamanho: {item.size}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Quantidade: {item.quantity}
                        </Typography>
                        {/* Price per item */}
                        {renderBasePriceInfo(item)}
                        {/* Show personalization costs */}
                        {(item.player_name || item.numero) && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            + Personalização (nome/número): +€{personalizationPrice.toFixed(2)}
                          </Typography>
                        )}
                        {(item.patch_images && item.patch_images.length > 0) && (() => {
                          const qty = item.quantity || 1;
                          const total = computePatchCost(item.patch_images, qty);
                          return (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              + Patches ({qty}): +€{total.toFixed(2)}
                            </Typography>
                          );
                        })()}
                        {item.player_name && (
                          <Typography variant="body2" color="text.secondary">
                            Nome do Jogador: {item.player_name}
                          </Typography>
                        )}
                        {item.numero && String(item.numero).trim() !== '' && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Número: {item.numero}
                          </Typography>
                        )}
                        {/* PATCH IMAGES SECTION */}
                        {(item.patch_images ?? []).length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              Patches:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {Array.from(new Set(item.patch_images ?? [])).map((img: string, idx: number) => {
                                return (
                                  <Box key={`${img}-${idx}`} sx={{ position: 'relative', display: 'inline-block' }}>
                                    <img src={img} alt={`patch ${idx + 1}`} style={{ height: 40, border: '1px solid #ccc', borderRadius: 4 }} />
                                    <IconButton
                                      size="small"
                                      color="error"
                                      sx={{ position: 'absolute', top: 0, right: 0, minWidth: 0, p: 0.5 }}
                                      onClick={() => {
                                        // Remove all occurrences of this patch image
                                        const newImages = (item.patch_images ?? []).filter((p: string) => p !== img);
                                        handleCartItemFieldChange(index, 'patch_images', newImages as any);
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                );
                              })}
                            </Box>
                          </Box>
                        )}
                        {/* END PATCH IMAGES SECTION */}
                        {/* Edit controls */}
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button size="small" variant="outlined" onClick={() => setEditingIndex(editingIndex === index ? null : index)}>
                            {editingIndex === index ? 'Fechar Edição' : 'Editar'}
                          </Button>
                          <Button size="small" variant="outlined" onClick={() => {
                            setPatchEditorIndex(index);
                            setPatchEditorSelection(item.patch_images || []);
                            setPatchEditorOpen(true);
                          }}>Editar Patches</Button>
                        </Box>

                        {editingIndex === index && (
                          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <TextField
                              label="Quantidade"
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt((e.target as any).value || '1', 10));
                                handleCartItemFieldChange(index, 'quantity', val);
                              }}
                              sx={{ width: 110 }}
                              InputProps={{ inputProps: { min: 1 } }}
                            />
                            {Array.isArray(item.available_sizes) && item.available_sizes.length > 0 ? (
                              <FormControl size="small" sx={{ width: 160 }}>
                                <InputLabel>Tamanho</InputLabel>
                                <Select
                                  label="Tamanho"
                                  value={item.size}
                                  onChange={(e: any) => handleCartItemFieldChange(index, 'size', e.target.value)}
                                >
                                  {item.available_sizes.map((s: string) => (
                                    <MenuItem key={s} value={s}>{s}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            ) : (
                              <TextField
                                label="Tamanho"
                                size="small"
                                value={item.size}
                                onChange={(e) => handleCartItemFieldChange(index, 'size', (e.target as any).value)}
                                sx={{ width: 140 }}
                              />
                            )}
                            <TextField
                              label="Nome do Jogador"
                              size="small"
                              value={item.player_name || ''}
                              onChange={(e) => handleCartItemFieldChange(index, 'player_name', (e.target as any).value)}
                              sx={{ minWidth: 160 }}
                            />
                            <TextField
                              label="Número"
                              size="small"
                              value={item.numero || ''}
                              onChange={(e) => handleCartItemFieldChange(index, 'numero', (e.target as any).value)}
                              sx={{ width: 120 }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveItem(index)}
                      sx={{ mt: isMobile ? 2 : 0 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            
            {/* Shipping Costs */}
            {(() => {
              // Calculate total quantity of all items
              const totalQuantity = items.reduce((total, item) => total + (item.quantity || 1), 0);
              
              // Only charge shipping if total quantity is 1
              const shouldChargeShipping = totalQuantity === 1;
              
              return shouldChargeShipping && (
                <Box sx={{ mt: 3, p: 2, backgroundColor: '#fff3e0', borderRadius: 1, border: '1px solid #ff9800' }}>
                  <Typography variant="body1" sx={{ color: '#d84315', fontWeight: 'bold' }}>
                    Portes de Envio - €2.00
                  </Typography>
                </Box>
              );
            })()}
            {!hasCustomItems && cartPrice !== null && (() => {
              const shippingCost = calculateShipping(items);
              return (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6">
                    Preço Total: €{(cartPrice + shippingCost).toFixed(2)}
                  </Typography>
                  {shippingCost > 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      (Inclui portes de envio: €2.00)
                    </Typography>
                  )}
                </Box>
              );
            })()}
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Morada de Entrega
              </Typography>

              {addressMode === 'manual' ? (
                <>
                  {/* List of saved addresses to use for autofill */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Usar uma morada guardada:
                    </Typography>
                    {!Array.isArray(addresses) || addresses.length === 0 ? (
                      <Typography variant="body2">Nenhuma morada guardada.</Typography>
                    ) : (
                      <List>
                        {addresses.map((addr: any) => (
                          <Paper key={addr.id} sx={{ mb: 1, p: 1 }}>
                            <ListItem disablePadding>
                              <ListItemText
                                primary={addr.nome}
                                secondary={`${addr.morada}, ${addr.cidade}, ${addr.distrito}, ${addr.codigoPostal}, ${addr.pais} - ${addr.telemovel}`}
                              />
                              <ListItemSecondaryAction>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleEdit(addr)}
                                  startIcon={<Check />}
                                >
                                  Usar
                                </Button>
                              </ListItemSecondaryAction>
                            </ListItem>
                          </Paper>
                        ))}
                      </List>
                    )}
                  </Box>
                  {/* Manual address form */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Nome" name="nome" fullWidth required value={address.nome} onChange={handleAddressChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Telemóvel" name="telemovel" fullWidth required value={address.telemovel} onChange={handleAddressChange} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Morada" name="morada" fullWidth required value={address.morada} onChange={handleAddressChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Cidade" name="cidade" fullWidth required value={address.cidade} onChange={handleAddressChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Distrito" name="distrito" fullWidth required value={address.distrito} onChange={handleAddressChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Código Postal" name="codigoPostal" fullWidth required value={address.codigoPostal} onChange={handleAddressChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="País" name="pais" fullWidth required value={address.pais} onChange={handleAddressChange} />
                    </Grid>
                  </Grid>
                </>
              ) : (
                // In saved mode, just show the list of addresses (no edit, no add, no delete)
                <Box>
                  {!Array.isArray(addresses) || addresses.length === 0 ? (
                    <Typography variant="body2">Nenhuma morada guardada.</Typography>
                  ) : (
                    <List>
                      {addresses.map((addr: any) => (
                        <Paper key={addr.id} sx={{ mb: 1, p: 1 }}>
                          <ListItem disablePadding>
                            <ListItemText
                              primary={addr.nome}
                              secondary={`${addr.morada}, ${addr.cidade}, ${addr.distrito}, ${addr.codigoPostal}, ${addr.pais} - ${addr.telemovel}`}
                            />
                          </ListItem>
                        </Paper>
                      ))}
                    </List>
                  )}
                </Box>
              )}
            </Box>

            {/* Instagram Input for Admin Users */}
            {user?.role === 'admin' && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Instagram do Cliente
                </Typography>
                <TextField
                  label="Instagram do Cliente (Opcional)"
                  fullWidth
                  value={clientInstagram}
                  onChange={(e) => setClientInstagram(e.target.value)}
                  placeholder="Ex: @cliente_instagram"
                  helperText="Este campo só está disponível para administradores"
                />
              </Box>
            )}

            {hasCustomItems ? (
              /* Custom orders section */
              <Box sx={{ mt: 4 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>Encomenda Personalizada Detectada</Typography>
                  O seu carrinho contém itens personalizados. A sua encomenda será enviada para orçamento e entraremos em contacto consigo com o preço final.
                </Alert>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Não é necessário efetuar qualquer pagamento agora. Apenas preencha a morada de entrega e clique em "Enviar para Orçamento".
                </Alert>
              </Box>
            ) : (
              /* Regular orders section */
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>Comprovativo de Pagamento *</Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  É obrigatório fornecer um comprovativo de pagamento ou indicar o destinatário.
                </Alert>
              
              {/* Payment Method Selection */}
              <Box sx={{ mb: 2 }}>
                <ToggleButtonGroup
                  value={paymentMode}
                  exclusive
                  onChange={handlePaymentModeChange}
                  fullWidth={isMobile}
                  sx={{ mb: 2 }}
                >
                  <ToggleButton value="manual">Manual</ToggleButton>
                  <ToggleButton value="saved">Métodos Salvos</ToggleButton>
                </ToggleButtonGroup>

                {paymentMode === 'saved' ? (
                  <Box>
                    {paymentMethods.length === 0 ? (
                      <Alert severity="info">
                        Nenhum método de pagamento salvo. <Button onClick={() => navigate('/payment-methods')}>Gerir Métodos</Button>
                      </Alert>
                    ) : (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Selecionar método de pagamento:</Typography>
                        <List>
                          {paymentMethods.map((method: any) => (
                            <Paper key={method.id} sx={{ mb: 1 }}>
                              <ListItem 
                                button
                                selected={selectedPaymentMethod?.id === method.id}
                                onClick={() => handleSelectPaymentMethod(method)}
                              >
                                <ListItemText
                                  primary={method.name}
                                  secondary={`${method.method} - ${method.accountInfo}`}
                                />
                                {method.isDefault && (
                                  <Box sx={{ ml: 1, px: 1, py: 0.5, backgroundColor: 'primary.main', color: 'white', borderRadius: 1, fontSize: '0.75rem' }}>
                                    Padrão
                                  </Box>
                                )}
                              </ListItem>
                            </Paper>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <FormControl fullWidth>
                    <InputLabel id="payment-method-label">Método de Pagamento</InputLabel>
                    <Select
                      labelId="payment-method-label"
                      value={paymentMethod}
                      label="Método de Pagamento"
                      onChange={e => setPaymentMethod(e.target.value)}
                    >
                      <MenuItem value="Revolut">Revolut</MenuItem>
                      <MenuItem value="PayPal">PayPal</MenuItem>
                      <MenuItem value="Bank Transfer">Transferência Bancária</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Box>
              {paymentMethod === 'Revolut' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Envie o pagamento para o número Revolut: <b>+351 912 345 678</b>
                </Alert>
              )}
              {paymentMethod === 'PayPal' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Envie o pagamento para o email PayPal: <b>pagamentos@futscore.com</b>
                </Alert>
              )}
              {paymentMethod === 'Bank Transfer' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Envie o pagamento para o IBAN: <b>PT50 0002 0123 1234 5678 9015 4</b>
                </Alert>
              )}
              
              {/* Option 1: Upload Proof */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Opção 1: Carregar Comprovativo
                </Typography>
                <Button
                  variant="contained"
                  component="label"
                  sx={{ mb: 2 }}
                >
                  Carregar Comprovativo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    ref={proofInputRef}
                    onChange={handleProofChange}
                  />
                </Button>
                {proofError && <Alert severity="error" sx={{ mb: 2 }}>{proofError}</Alert>}
                {proofImage && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <img
                      src={proofImage}
                      alt="Comprovativo de Pagamento"
                      style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain', border: '1px solid #eee', borderRadius: 4 }}
                    />
                  </Box>
                )}
                <TextField
                  label="Referência do Comprovativo (Opcional)"
                  fullWidth
                  value={proofReference}
                  onChange={handleReferenceChange}
                  sx={{ mt: 2 }}
                  placeholder="Insira a referência do comprovativo se não anexar imagem"
                />
              </Box>
              
              {/* Option 2: Select Recipient */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Opção 2: Enviei para:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant={selectedRecipient === 'MIGUEL' ? 'contained' : 'outlined'}
                    onClick={() => setSelectedRecipient('MIGUEL')}
                    startIcon={selectedRecipient === 'MIGUEL' ? <Check /> : null}
                    sx={{ minWidth: 120 }}
                  >
                    MIGUEL
                  </Button>
                  <Button
                    variant={selectedRecipient === 'HUGO' ? 'contained' : 'outlined'}
                    onClick={() => setSelectedRecipient('HUGO')}
                    startIcon={selectedRecipient === 'HUGO' ? <Check /> : null}
                    sx={{ minWidth: 120 }}
                  >
                    HUGO
                  </Button>
                </Box>
              </Box>
              
              {/* Validation Error */}
              {!proofProvided && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  É obrigatório fornecer um comprovativo de pagamento, selecionar um destinatário ou escolher um método de pagamento salvo.
                </Alert>
              )}
              </Box>
            )}
            <Box sx={{ mt: 4, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate('/store')}
                fullWidth={isMobile}
              >
                Continuar a Comprar
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitOrder}
                disabled={!canPlaceOrder}
                fullWidth={isMobile}
              >
                {hasCustomItems ? 'Enviar para Orçamento' : 'Finalizar Encomenda'}
              </Button>
            </Box>
          </>
        )}
      </Paper>

      {/* Patch editor modal */}
      <Dialog open={patchEditorOpen} onClose={() => setPatchEditorOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Editar Patches</DialogTitle>
        <DialogContent>
          <PatchSelection
            onPatchesChange={(imgs) => setPatchEditorSelection(imgs)}
            selectedPatches={patchEditorSelection}
            title="Seleciona os Patches"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPatchEditorOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (patchEditorIndex != null) {
                handleCartItemFieldChange(patchEditorIndex, 'patch_images', patchEditorSelection as any);
              }
              setPatchEditorOpen(false);
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Cart;
 
// Patch editor dialog (mounted at end to keep file cohesive)
// We append it after the main return by reopening the component scope via JSX fragment inside return above if needed.