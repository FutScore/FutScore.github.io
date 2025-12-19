import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  SelectChangeEvent,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BrushIcon from '@mui/icons-material/Brush';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import { addToCart } from '../store/slices/cartSlice';
import { OrderItem } from '../types';
import Checkbox from '@mui/material/Checkbox';
import FilterSidebar from '../components/FilterSidebar';
import PatchSelection from '../components/PatchSelection';
// Removido DragDropZone: passamos a usar URL direto da imagem
import { RootState } from '../store';

const Store = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [products, setProducts] = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [shirtTypes, setShirtTypes] = useState<{ id: number; name: string; price?: number }[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [patchImages, setPatchImages] = useState<string[]>([]);
  const [selectedShirtTypeId, setSelectedShirtTypeId] = useState<number | ''>('');

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  // Options used in admin edit modal to mirror admin Add Product form
  const sexoOptions = ['Neutro', 'Masculino', 'Feminino'];
  // "Ano" passa a ser input livre com formatação "YY/ZZ"

  const normalizeImageUrl = (url: string): string => {
    if (!url) return '';
    try {
      const u = new URL(url);
      if (u.host.includes('drive.google.com') || u.host.includes('drive.usercontent.google.com')) {
        const byParam = u.searchParams.get('id');
        let id = byParam || '';
        const path = u.pathname || '';
        // If already using Drive thumbnail endpoint with id, keep as-is (works great for <img>)
        if (path.includes('/thumbnail') && byParam) {
          return url;
        }
        // Matches /file/d/{id}/view or /d/{id}
        if (!id && path.includes('/file/d/')) {
          id = path.split('/file/d/')[1]?.split('/')[0] || '';
        }
        if (!id && path.includes('/d/')) {
          id = path.split('/d/')[1]?.split('/')[0] || '';
        }
        // open?id=, uc?id=, thumbnail?id=
        if (id) return `https://drive.google.com/uc?export=view&id=${id}`;
      }
    } catch {}
    return url;
  };

  // Converte entradas como "24" para "24/25" e "99" para "99/00"
  const formatSeason = (input: string): string => {
    const raw = String(input || '').trim();
    if (!raw) return '';
    const match = raw.match(/^(\d{2})\s*\/\s*(\d{2})$/);
    if (match) return `${match[1]}/${match[2]}`;
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    const yy = (digits.length >= 2 ? digits.slice(-2) : digits).padStart(2, '0');
    const next = (Number(yy) + 1) % 100;
    return `${yy}/${String(next).padStart(2, '0')}`;
  };

  const buildDriveThumbnailUrl = (value: string): string => {
    const input = String(value || '').trim();
    if (!input) return '';
    // If input looks like a bare Drive file id (no scheme, no spaces), build thumbnail URL
    if (!input.includes('://') && !input.includes(' ')) {
      return `https://drive.google.com/thumbnail?id=${input}`;
    }
    // If it's a URL, try to extract id and convert to thumbnail
    try {
      const u = new URL(input);
      if (u.host.includes('drive.google.com') || u.host.includes('drive.usercontent.google.com')) {
        const byParam = u.searchParams.get('id');
        let id = byParam || '';
        const path = u.pathname || '';
        if (!id && path.includes('/file/d/')) id = path.split('/file/d/')[1]?.split('/')[0] || '';
        if (!id && path.includes('/d/')) id = path.split('/d/')[1]?.split('/')[0] || '';
        if (id) return `https://drive.google.com/thumbnail?id=${id}`;
      }
    } catch {}
    return input;
  };

  const isUnsupportedDriveViewer = (url: string): boolean => {
    try {
      const u = new URL(url);
      const path = u.pathname || '';
      const hasId = !!u.searchParams.get('id') || path.includes('/file/d/') || path.includes('/d/');
      return (u.host.includes('drive.google.com') && path.includes('/drive-viewer/')) && !hasId;
    } catch {
      return false;
    }
  };

  // Admin edit modal state
  const [openAdminDialog, setOpenAdminDialog] = useState(false);
  const [adminEditingProduct, setAdminEditingProduct] = useState<any | null>(null);
  const [adminProductData, setAdminProductData] = useState<any>({
    name: '',
    description: '',
    price: 0,
    cost_price: 0,
    image_url: '',
    available_sizes: '',
    product_type_id: '',
    shirt_type_id: '',
    available_shirt_type_ids: [] as number[],
    sexo: 'Neutro',
    ano: '25/26',
  });
  // Preview será feito com base no próprio campo image_url
  const [adminError, setAdminError] = useState<string | null>(null);



  const handleOpenDialog = (product: any) => {
    setSelectedProduct(product);
    setSize(product.available_sizes[0] || '');
    // Default selected shirt type: first available, or existing shirt_type_id if defined
    const availableIds: number[] = Array.isArray(product.available_shirt_type_ids) ? product.available_shirt_type_ids : [];
    if (availableIds.length > 0) {
      setSelectedShirtTypeId(availableIds[0]);
    } else if (product.shirt_type_id) {
      setSelectedShirtTypeId(product.shirt_type_id);
    } else {
      setSelectedShirtTypeId('');
    }
    setPlayerName('');
    setPlayerNumber('');
    setPatchImages([]);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
    setQuantity(1);
    setSize('');
  };



  const handleAddToCart = async () => {
    if (!selectedProduct) return;

    const imageUrl = normalizeImageUrl(selectedProduct.image_url || '');

    const findShirtTypeName = (id?: number | '') => {
      if (!id || !Array.isArray(shirtTypes)) return undefined;
      const st = shirtTypes.find(st => st.id === id);
      return st?.name;
    };

    const chosenShirtTypeId = typeof selectedShirtTypeId === 'number' ? selectedShirtTypeId : undefined;
    const cartItem: OrderItem = {
      id: `${selectedProduct.id}-${size}`,
      product_id: selectedProduct.id,
      product_type: selectedProduct?.productType?.base_type || 'tshirt',
      name: selectedProduct.name,
      price: selectedProduct.price,
      image_front: imageUrl,
      size,
      available_sizes: Array.isArray(selectedProduct.available_sizes) ? selectedProduct.available_sizes : undefined,
      quantity,
      player_name: playerName,
      numero: playerNumber,
      patch_images: patchImages,
      shirt_type_id: chosenShirtTypeId,
      shirt_type_name: findShirtTypeName(chosenShirtTypeId),
    };
    dispatch(addToCart(cartItem));
    handleCloseDialog();
  };

  useEffect(() => {
    fetchProducts();
    fetchProductTypes();
    fetchShirtTypes();
  }, []);

  const fetchProducts = async (typeId = '') => {
    try {
      setLoading(true);
      const url = typeId
        ? `${API_BASE_URL}/.netlify/functions/getProducts?productTypeId=${typeId}&summary=true`
        : `${API_BASE_URL}/.netlify/functions/getProducts?summary=true`;
      const res = await axios.get(url);
      // Handle both old format (array) and new paginated format
      if (Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        setProducts(res.data.products);
      }
      // Imagens já vêm por URL diretamente no payload
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch products');
      setLoading(false);
    }
  };

  // Removido: carregamento adicional de imagens por produto

  const fetchProductTypes = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/.netlify/functions/getProductTypes?asTree=true&limit=1000`);
      // Handle both old format (array) and new paginated format
      if (Array.isArray(res.data)) {
        setProductTypes(res.data);
      } else {
        // Prefer tree if available
        setProductTypes(res.data.tree || res.data.productTypes);
      }
    } catch (err) {
      // Handle error silently for now
    }
  };

  const fetchShirtTypes = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/.netlify/functions/getShirtTypes?page=1&limit=1000`);
      const list = Array.isArray(res.data?.shirtTypes) ? res.data.shirtTypes : (Array.isArray(res.data) ? res.data : []);
      setShirtTypes(list.map((t: any) => ({ id: t.id, name: t.name, price: t.price })));
    } catch {
      // silent
    }
  };

  const flattenTypes = (nodes: any[]): any[] => {
    if (!Array.isArray(nodes)) return [];
    const out: any[] = [];
    const walk = (arr: any[]) => {
      for (const n of arr) {
        out.push(n);
        if (Array.isArray(n.children) && n.children.length) {
          walk(n.children);
        }
      }
    };
    walk(nodes);
    return out;
  };

  // Compute starting price for product based on available shirt types
  const getProductStartingPrice = (product: any): number => {
    const ids: number[] = Array.isArray(product.available_shirt_type_ids)
      ? product.available_shirt_type_ids
      : (product.shirt_type_id ? [product.shirt_type_id] : []);
    const candidatePrices: number[] = ids
      .map((id: number) => {
        const st = shirtTypes.find((t: any) => t.id === id);
        return typeof st?.price === 'number' ? st.price : undefined;
      })
      .filter((p: any) => typeof p === 'number') as number[];
    if (candidatePrices.length > 0) {
      return Math.min(...candidatePrices);
    }
    return typeof product.price === 'number' ? product.price : 0;
  };

  // Admin edit handlers
  const handleOpenAdminDialog = async (product: any) => {
    setAdminError(null);
    setAdminEditingProduct(product);
    // Start with summary data
    const base = {
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      cost_price: product.cost_price || 0,
        image_url: product.image_url || '',
      available_sizes: Array.isArray(product.available_sizes) ? product.available_sizes.join(', ') : (product.available_sizes || ''),
      product_type_id: String(product.product_type_id ?? product?.productType?.id ?? ''),
      shirt_type_id: String(product.shirt_type_id || ''),
      available_shirt_type_ids: Array.isArray(product.available_shirt_type_ids) ? product.available_shirt_type_ids : [],
      sexo: product.sexo || 'Neutro',
      ano: product.ano || '25/26',
    };
    setAdminProductData(base);
    // Fetch full product for complete data (image/sizes)
    try {
      const full = await axios.get(`${API_BASE_URL}/.netlify/functions/getProduct?id=${product.id}`);
      const p = full.data || {};
      setAdminProductData((prev: any) => ({
        ...prev,
        image_url: p.image_url || prev.image_url,
        available_sizes: Array.isArray(p.available_sizes) ? p.available_sizes.join(', ') : (prev.available_sizes || ''),
        product_type_id: String(p.product_type_id ?? prev.product_type_id),
        shirt_type_id: p.shirt_type_id != null ? String(p.shirt_type_id) : prev.shirt_type_id,
        available_shirt_type_ids: Array.isArray(p.available_shirt_type_ids) ? p.available_shirt_type_ids : prev.available_shirt_type_ids,
        price: typeof p.price === 'number' ? p.price : prev.price,
        cost_price: typeof p.cost_price === 'number' ? p.cost_price : prev.cost_price,
        description: typeof p.description === 'string' ? p.description : prev.description,
        name: typeof p.name === 'string' ? p.name : prev.name,
        sexo: typeof p.sexo === 'string' ? p.sexo : prev.sexo,
        ano: typeof p.ano === 'string' ? p.ano : prev.ano,
      }));
    } catch {}
    setOpenAdminDialog(true);
  };

  const handleCloseAdminDialog = () => {
    setOpenAdminDialog(false);
    setAdminEditingProduct(null);
    setAdminProductData({
      name: '', description: '', price: 0, cost_price: 0, image_url: '', available_sizes: '', product_type_id: '', shirt_type_id: '', available_shirt_type_ids: [], sexo: 'Neutro', ano: '25/26'
    });
    setAdminError(null);
  };

  const handleSaveAdminProduct = async () => {
    try {
      setAdminError(null);
      const payload: any = {
        ...adminProductData,
        price: Number(adminProductData.price),
        cost_price: Number(adminProductData.cost_price),
        product_type_id: adminProductData.product_type_id ? Number(adminProductData.product_type_id) : undefined,
        available_sizes: String(adminProductData.available_sizes || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean),
      };
      // Normalize and persist thumbnail URL based on Drive ID/URL
      payload.image_url = buildDriveThumbnailUrl(adminProductData.image_url);
      payload.shirt_type_id = adminProductData.shirt_type_id ? Number(adminProductData.shirt_type_id) : null;
      payload.available_shirt_type_ids = Array.isArray(adminProductData.available_shirt_type_ids) ? adminProductData.available_shirt_type_ids.map((n: any) => Number(n)) : [];
      payload.sexo = adminProductData.sexo;
      payload.ano = adminProductData.ano;

      const token = localStorage.getItem('token');
      const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
      await axios.put(`${API_BASE_URL}/.netlify/functions/updateProduct/${adminEditingProduct.id}`, payload, headers);
      handleCloseAdminDialog();
      // Refresh list
      fetchProducts(selectedType);
    } catch (e: any) {
      setAdminError(e?.response?.data?.error || 'Falha ao atualizar produto');
    }
  };

  const handleDeleteAdminProduct = async () => {
    if (!adminEditingProduct) return;
    if (!window.confirm('Tem a certeza que quer apagar este produto?')) return;
    try {
      setAdminError(null);
      await axios.delete(`${API_BASE_URL}/.netlify/functions/deleteProduct/${adminEditingProduct.id}`);
      handleCloseAdminDialog();
      fetchProducts(selectedType);
    } catch (e: any) {
      setAdminError(e?.response?.data?.error || 'Falha ao apagar o produto');
    }
  };

  const handleTypeSelectFromTree = (typeId: string) => {
    setSelectedType(typeId);
    fetchProducts(typeId);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" gutterBottom sx={{ m: 0 }}>
          Loja
        </Typography>
        <TextField
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Procurar produtos..."
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1 }} />,
          }}
          size="small"
          sx={{ minWidth: 260 }}
        />
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3} lg={3}>
          <FilterSidebar
            productTypes={productTypes}
            selectedType={selectedType}
            onSelectType={handleTypeSelectFromTree}
            onClearAll={() => handleTypeSelectFromTree('')}
          />
        </Grid>
        <Grid item xs={12} md={9} lg={9}>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Grid container spacing={3}>
              {Array.isArray(products) && products
                .filter((product) => {
                  if (!searchQuery.trim()) return true;
                  const query = searchQuery.toLowerCase();
                  const name = `${product.name || ''} ${product.ano || ''}`.toLowerCase();
                  const description = (product.description || '').toLowerCase();
                  const typeName = (product?.productType?.name || '').toLowerCase();
                  return name.includes(query) || description.includes(query) || typeName.includes(query);
                })
                .map((product) => (
                <Grid item key={product.id} xs={12} sm={6} md={4}>
                  <Card sx={{ position: 'relative' }}>
                    {user?.role === 'admin' && (
                      <IconButton
                        size="small"
                        onClick={() => handleOpenAdminDialog(product)}
                        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, backgroundColor: 'rgba(255,255,255,0.9)' }}
                        title="Editar produto"
                      >
                        <BrushIcon fontSize="small" />
                      </IconButton>
                    )}
                    <CardMedia
                      component="img"
                      sx={{
                        height: 300,
                        objectFit: 'contain',
                        backgroundColor: '#f5f5f5',
                        padding: 2,
                      }}
                      image={normalizeImageUrl(product.image_url || '')}
                      referrerPolicy="no-referrer"
                      alt={product.name}
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="div" noWrap>
                        {product.name}{product.ano ? ` ${product.ano}` : ''}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                        {product.description}
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 1 }}>
                        Desde €{getProductStartingPrice(product).toFixed(2)}
                      </Typography>
                      <Button variant="contained" sx={{ mt: 1 }} onClick={() => handleOpenDialog(product)}>
                        Adicionar ao Pedido
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>
      <Dialog open={openDialog} onClose={handleCloseDialog} fullScreen={fullScreen}>
        <DialogContent>
          {selectedProduct && (
            <>
              <Typography variant="h6">{selectedProduct.name}{selectedProduct.ano ? ` ${selectedProduct.ano}` : ''}</Typography>


              <TextField
                label="Nome do Jogador (Opcional)"
                fullWidth
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                sx={{ mt: 2 }}
              />
              <TextField
                label="Número (Opcional)"
                fullWidth
                value={playerNumber}
                onChange={e => setPlayerNumber(e.target.value)}
                sx={{ mt: 2 }}
              />
              <Box sx={{ mt: 2 }}>
                <PatchSelection
                  onPatchesChange={setPatchImages}
                  selectedPatches={patchImages}
                  title="Patches"
                />
              </Box>
              <TextField
                label="Quantidade"
                type="number"
                value={quantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(Math.max(1, parseInt(e.target.value, 10)))}
                sx={{ mt: 2, mb: 2 }}
                InputProps={{ inputProps: { min: 1 } }}
              />
              {/* Shirt type selection based on available_shirt_type_ids */}
              {Array.isArray(selectedProduct?.available_shirt_type_ids) && selectedProduct.available_shirt_type_ids.length > 0 && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Tipo de Produto</InputLabel>
                  <Select
                    value={selectedShirtTypeId === '' ? '' : String(selectedShirtTypeId)}
                    label="Tipo de Produto"
                    onChange={(e: any) => setSelectedShirtTypeId(e.target.value === '' ? '' : Number(e.target.value))}
                  >
                    {selectedProduct.available_shirt_type_ids.map((id: number) => (
                      (() => {
                        const st = shirtTypes.find(st => st.id === id);
                        const name = st?.name || `Tipo ${id}`;
                        const price = typeof st?.price === 'number' ? ` — €${st!.price.toFixed(2)}` : '';
                        return (
                          <MenuItem key={id} value={String(id)}>
                            {name}{price}
                          </MenuItem>
                        );
                      })()
                    ))}
                  </Select>
                </FormControl>
              )}
              <FormControl fullWidth>
                <InputLabel>Tamanho</InputLabel>
                <Select value={size} label="Tamanho" onChange={(e: any) => setSize(e.target.value)}>
                  {selectedProduct.available_sizes.map((s: string) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleAddToCart} variant="contained">Adicionar ao Carrinho</Button>
        </DialogActions>
      </Dialog>

      {/* Admin Edit Product Dialog */}
      <Dialog open={openAdminDialog} onClose={handleCloseAdminDialog} fullScreen={fullScreen}>
        <DialogTitle>Editar Produto</DialogTitle>
        <DialogContent>
          {adminError && (
            <Alert severity="error" sx={{ mb: 2 }}>{adminError}</Alert>
          )}
          <TextField
            label="Nome do Produto"
            fullWidth
            margin="normal"
            value={adminProductData.name}
            onChange={(e) => setAdminProductData({ ...adminProductData, name: e.target.value })}
          />
          <TextField
            label="Descrição"
            fullWidth
            margin="normal"
            multiline
            rows={2}
            value={adminProductData.description}
            onChange={(e) => setAdminProductData({ ...adminProductData, description: e.target.value })}
          />
          <TextField
            label="Imagem (ID do Drive ou URL)"
            fullWidth
            margin="normal"
            value={adminProductData.image_url}
            onChange={(e) => setAdminProductData({ ...adminProductData, image_url: e.target.value })}
            placeholder="Ex.: 1-pW0M60WDmG-k_rzjkWIn5e1BfdmfMCm ou https://..."
          />
          {isUnsupportedDriveViewer(adminProductData.image_url) && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Este link do Google Drive não é incorporável. Usa "Partilhar → Obter ligação" e cola um link com ID (ex.: /file/d/ID ou ?id=ID). Será convertido para uc?export=view.
            </Alert>
          )}
          {adminProductData.image_url && !isUnsupportedDriveViewer(adminProductData.image_url) ? (
            <Box sx={{ mt: 1, mb: 2 }}>
              <Box
                component="img"
                src={normalizeImageUrl(buildDriveThumbnailUrl(adminProductData.image_url))}
                alt="preview"
                referrerPolicy="no-referrer"
                sx={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}
              />
            </Box>
          ) : null}
          <TextField
            label="Tamanhos Disponíveis (separados por vírgula)"
            fullWidth
            margin="normal"
            value={adminProductData.available_sizes}
            onChange={(e) => setAdminProductData({ ...adminProductData, available_sizes: e.target.value })}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Família do Produto</InputLabel>
            <Select
              value={adminProductData.product_type_id}
              label="Família do Produto"
              onChange={(e) => setAdminProductData({ ...adminProductData, product_type_id: e.target.value })}
            >
              {flattenTypes(Array.isArray(productTypes) ? productTypes : []).map((type: any) => (
                <MenuItem key={type.id} value={String(type.id)}>{type.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Removed single select 'Tipo de Produto' from admin edit as requested */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Tipos Disponíveis para o Produto</InputLabel>
            <Select
              multiple
              value={(adminProductData.available_shirt_type_ids || []).map(String)}
              label="Tipos Disponíveis para o Produto"
              onChange={(e) => {
                const value = e.target.value as unknown as string[];
                setAdminProductData({ ...adminProductData, available_shirt_type_ids: value.map(v => Number(v)) });
              }}
              renderValue={(selected) => {
                const ids = (selected as string[]).map(v => Number(v));
                const names = shirtTypes.filter(st => ids.includes(st.id)).map(st => st.name);
                return names.join(', ');
              }}
            >
              {Array.isArray(shirtTypes) && shirtTypes.map((st) => (
                <MenuItem key={st.id} value={String(st.id)}>{st.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Sexo</InputLabel>
            <Select
              value={adminProductData.sexo}
              label="Sexo"
              onChange={(e) => setAdminProductData({ ...adminProductData, sexo: e.target.value })}
            >
              {sexoOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="Ano"
            fullWidth
            margin="normal"
            placeholder="24/25 ou 24"
            value={adminProductData.ano}
            onChange={(e) => setAdminProductData({ ...adminProductData, ano: e.target.value })}
            onBlur={(e) => setAdminProductData({ ...adminProductData, ano: formatSeason(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteAdminProduct} color="error">Apagar</Button>
          <Button onClick={handleCloseAdminDialog}>Cancelar</Button>
          <Button onClick={handleSaveAdminProduct} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Store; 