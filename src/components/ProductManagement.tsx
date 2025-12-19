import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  TableSortLabel,
} from '@mui/material';
// Replaced x-tree-view with a simple indented list to avoid extra dependency
import axios from 'axios';
import { API_BASE_URL } from '../api';
import { Product, ProductType } from '../types';
import { Search as SearchIcon } from '@mui/icons-material';
// Removido DragDropZone: passamos a usar URL direto da imagem

const ProductManagement = () => {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shirtTypes, setShirtTypes] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openProductTypeDialog, setOpenProductTypeDialog] = useState(false);
  const [editingProductType, setEditingProductType] = useState<ProductType | null>(null);
  const [newProductTypeName, setNewProductTypeName] = useState('');
  const [newProductTypeBase, setNewProductTypeBase] = useState('tshirt');
  const [newProductTypeParentId, setNewProductTypeParentId] = useState<number | ''>('');

  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const sexoOptions = ['Neutro', 'Masculino', 'Feminino'];
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    cost_price: 0,
    image_url: '',
    base_type: 'tshirt',
    available_sizes: '',
    product_type_id: '',
    shirt_type_id: '',
    available_shirt_type_ids: [] as number[],
    sexo: 'Neutro',
    ano: '25/26',
  });

  // Removido estado/handlers de upload; usamos apenas URL da imagem

  // Handle opening product dialog for editing
  const handleOpenProductDialog = async (product: Product | null = null) => {
    setEditingProduct(product);
    if (product) {
      setNewProduct({
        name: product.name,
        description: product.description || '',
        price: product.price,
        cost_price: product.cost_price || 0,
        image_url: (product as any).image_url || '',
        base_type: product.productType.base_type,
        available_sizes: Array.isArray(product.available_sizes) ? product.available_sizes.join(', ') : product.available_sizes,
        product_type_id: String((product as any).product_type_id ?? product.productType.id),
        shirt_type_id: String((product as any).shirt_type_id || ''),
        available_shirt_type_ids: Array.isArray((product as any).available_shirt_type_ids) ? (product as any).available_shirt_type_ids : [],
        sexo: product.sexo || 'Neutro',
        ano: product.ano || '25/26',
      });
      // Preview será feito diretamente do campo image_url
      try {
        const full = await axios.get(`${API_BASE_URL}/.netlify/functions/getProduct?id=${(product as any).id}`);
        const p = full.data || {};
        setNewProduct(prev => ({
          ...prev,
          image_url: p.image_url || prev.image_url,
          available_sizes: Array.isArray(p.available_sizes) ? p.available_sizes.join(', ') : (prev.available_sizes || ''),
          product_type_id: String(p.product_type_id ?? prev.product_type_id),
          shirt_type_id: p.shirt_type_id != null ? String(p.shirt_type_id) : prev.shirt_type_id,
          available_shirt_type_ids: Array.isArray(p.available_shirt_type_ids) ? p.available_shirt_type_ids : prev.available_shirt_type_ids,
          sexo: p.sexo || prev.sexo,
          ano: p.ano || prev.ano,
        }));
        // Preview usa o campo image_url
      } catch (e) {}
    } else {
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        cost_price: 0,
        image_url: '',
        base_type: 'tshirt',
        available_sizes: '',
        product_type_id: '',
        shirt_type_id: '',
        available_shirt_type_ids: [],
        sexo: 'Neutro',
        ano: '25/26',
      });
      // Limpeza não necessária para preview via URL
    }
    setOpenProductDialog(true);
  };

  // Handle closing the product dialog and resetting states
  const handleCloseProductDialog = () => {
    setOpenProductDialog(false);
    setEditingProduct(null);
    setNewProduct({
      name: '',
      description: '',
      price: 0,
      cost_price: 0,
      image_url: '',
      base_type: 'tshirt',
      available_sizes: '',
      product_type_id: '',
      shirt_type_id: '',
      available_shirt_type_ids: [],
      sexo: 'Neutro',
      ano: '25/26',
    });
    // Limpeza não necessária para preview via URL
  };

  useEffect(() => {
    fetchProductTypes();
    fetchProducts();
    fetchShirtTypes();
  }, []);

  const normalizeImageUrl = (url: string): string => {
    if (!url) return '';
    try {
      const u = new URL(url);
      if (u.host.includes('drive.google.com') || u.host.includes('drive.usercontent.google.com')) {
        const byParam = u.searchParams.get('id');
        let id = byParam || '';
        const path = u.pathname || '';
        // Keep Drive thumbnail endpoint as is
        if (path.includes('/thumbnail') && byParam) {
          return url;
        }
        if (!id && path.includes('/file/d/')) {
          id = path.split('/file/d/')[1]?.split('/')[0] || '';
        }
        if (!id && path.includes('/d/')) {
          id = path.split('/d/')[1]?.split('/')[0] || '';
        }
        if (id) return `https://drive.google.com/uc?export=view&id=${id}`;
      }
    } catch {}
    return url;
  };

  const buildDriveThumbnailUrl = (value: string): string => {
    const input = String(value || '').trim();
    if (!input) return '';
    if (!input.includes('://') && !input.includes(' ')) {
      return `https://drive.google.com/thumbnail?id=${input}`;
    }
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

  // Pesquisa e ordenação para a listagem de produtos
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'type'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredSortedProducts = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = Array.isArray(products) ? products : [];
    const filtered = q
      ? base.filter((p: any) => {
          const name = String(p?.name || '').toLowerCase();
          const desc = String(p?.description || '').toLowerCase();
          const ano = String(p?.ano || '').toLowerCase();
          const typeName = String(p?.productType?.name || '').toLowerCase();
          return name.includes(q) || desc.includes(q) || ano.includes(q) || typeName.includes(q);
        })
      : base;
    const sorted = [...filtered].sort((a: any, b: any) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (sortBy === 'name') {
        return String(a?.name || '').localeCompare(String(b?.name || '')) * dir;
      }
      const at = String(a?.productType?.name || '');
      const bt = String(b?.productType?.name || '');
      const cmp = at.localeCompare(bt);
      if (cmp !== 0) return cmp * dir;
      return String(a?.name || '').localeCompare(String(b?.name || '')) * dir;
    });
    return sorted;
  }, [products, searchQuery, sortBy, sortDirection]);

  const handleRequestSort = (column: 'name' | 'type') => {
    if (sortBy === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const fetchProductTypes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/.netlify/functions/getProductTypes?asTree=true&limit=1000`);
      // Handle both old format (array) and new format (paginated response)
      const tree = res.data?.tree || (Array.isArray(res.data) ? res.data : res.data?.productTypes);
      setProductTypes(tree);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch product types');
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/.netlify/functions/getProducts?summary=true&limit=1000`);
      if (Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        setProducts(res.data.products);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch products');
      setLoading(false);
    }
  };

  const fetchShirtTypes = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/.netlify/functions/getShirtTypes?page=1&limit=1000`);
      const list = Array.isArray(res.data?.shirtTypes) ? res.data.shirtTypes : (Array.isArray(res.data) ? res.data : []);
      setShirtTypes(list.map((t: any) => ({ id: t.id, name: t.name })));
    } catch (e) {
      // silent
    }
  };

  const handleCreateOrUpdateProductType = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
      if (editingProductType) {
        await axios.put(
          `${API_BASE_URL}/.netlify/functions/updateProductType/${editingProductType.id}`,
          {
            name: newProductTypeName,
            base_type: newProductTypeBase,
            parent_id: newProductTypeParentId === '' ? null : Number(newProductTypeParentId),
          },
          headers
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/.netlify/functions/createProductType`,
          {
            name: newProductTypeName,
            base_type: newProductTypeBase,
            parent_id: newProductTypeParentId === '' ? null : Number(newProductTypeParentId),
          },
          headers
        );
      }
      setOpenProductTypeDialog(false);
      setEditingProductType(null);
      setNewProductTypeName('');
      setNewProductTypeParentId('');
      fetchProductTypes();
    } catch (err) {
      setError(editingProductType ? 'Falha ao atualizar tipo de produto' : 'Failed to create product type');
    }
  };

  const handleDeleteProductType = async (productTypeId: number) => {
    if (window.confirm('Tem a certeza que quer apagar este tipo de produto?')) {
      try {
        await axios.delete(`${API_BASE_URL}/.netlify/functions/deleteProductType/${productTypeId}`);
        fetchProductTypes();
      } catch (err: any) {
        setError(err.response?.data || 'Failed to delete product type');
      }
    }
  };

  const handleSaveProduct = async () => {
    try {
      const productData: any = {
        ...newProduct,
        price: Number(newProduct.price),
        cost_price: Number(newProduct.cost_price),
        product_type_id: Number(newProduct.product_type_id),
        available_sizes: newProduct.available_sizes.split(',').map(s => s.trim()),
        sexo: newProduct.sexo,
        ano: newProduct.ano,
      };
      // Normalize and persist thumbnail URL based on Drive ID/URL
      productData.image_url = buildDriveThumbnailUrl(newProduct.image_url);
      productData.shirt_type_id = newProduct.shirt_type_id ? Number(newProduct.shirt_type_id) : null;
      productData.available_shirt_type_ids = Array.isArray(newProduct.available_shirt_type_ids) ? newProduct.available_shirt_type_ids : [];


      const token = localStorage.getItem('token');
      const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;

      if (editingProduct) {
        // Update existing product
        await axios.put(`${API_BASE_URL}/.netlify/functions/updateProduct/${editingProduct.id}`, productData, headers);
      } else {
        // Create new product
        const endpoint = `${API_BASE_URL}/.netlify/functions/createProduct`;
        try {
          console.log('[createProduct] endpoint', endpoint);
          console.log('[createProduct] headers present', !!token);
          console.log('[createProduct] payload', productData);
          const res = await axios.post(endpoint, productData, headers);
          console.log('[createProduct] success', res.status, res.data);
        } catch (err: any) {
          if (axios.isAxiosError(err)) {
            console.error('[createProduct] axios error', {
              status: err.response?.status,
              data: err.response?.data,
              headers: err.response?.headers,
            });
          } else {
            console.error('[createProduct] unknown error', err);
          }
          throw err;
        }
      }

      handleCloseProductDialog();
      fetchProducts();
    } catch (err) {
      setError(editingProduct ? 'Falha ao atualizar produto' : 'Falha ao criar produto');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('Tem a certeza que quer apagar este produto?')) {
      try {
        await axios.delete(`${API_BASE_URL}/.netlify/functions/deleteProduct/${productId}`);
        fetchProducts();
      } catch (err) {
        setError('Falha ao apagar o produto');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Tipos de Produto</Typography>
        <Button variant="contained" onClick={() => setOpenProductTypeDialog(true)}>
          Adicionar Tipo de Produto
        </Button>
      </Box>
      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Estrutura de Tipos</Typography>
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {(Array.isArray(productTypes) ? productTypes : []).filter(pt => !pt.parent_id).map((root) => (
            <Box key={root.id} sx={{ ml: 0, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{root.name}</span>
                <Button size="small" variant="outlined" onClick={() => { setEditingProductType(root); setNewProductTypeName(root.name); setNewProductTypeBase(root.base_type); setNewProductTypeParentId(root.parent_id || ''); setOpenProductTypeDialog(true); }}>Editar</Button>
                <Button size="small" color="error" onClick={() => handleDeleteProductType(root.id)}>Apagar</Button>
              </Box>
              {(root.children || []).map(child => (
                <Box key={child.id} sx={{ ml: 2, my: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{child.name}</span>
                    <Button size="small" variant="outlined" onClick={() => { setEditingProductType(child); setNewProductTypeName(child.name); setNewProductTypeBase(child.base_type); setNewProductTypeParentId(child.parent_id || ''); setOpenProductTypeDialog(true); }}>Editar</Button>
                    <Button size="small" color="error" onClick={() => handleDeleteProductType(child.id)}>Apagar</Button>
                  </Box>
                  {(child.children || []).map(gchild => (
                    <Box key={gchild.id} sx={{ ml: 4, my: 0.25 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{gchild.name}</span>
                        <Button size="small" variant="outlined" onClick={() => { setEditingProductType(gchild); setNewProductTypeName(gchild.name); setNewProductTypeBase(gchild.base_type); setNewProductTypeParentId(gchild.parent_id || ''); setOpenProductTypeDialog(true); }}>Editar</Button>
                        <Button size="small" color="error" onClick={() => handleDeleteProductType(gchild.id)}>Apagar</Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Produtos</Typography>
        <Button variant="contained" onClick={() => handleOpenProductDialog()}>
          Adicionar Produto
        </Button>
      </Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <TextField
          size="small"
          placeholder="Pesquisar por nome, tipo, ano..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 260 }}
        />
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sortDirection={sortBy === 'name' ? sortDirection : false}>
                <TableSortLabel
                  active={sortBy === 'name'}
                  direction={sortBy === 'name' ? sortDirection : 'asc'}
                  onClick={() => handleRequestSort('name')}
                >
                  Nome
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortBy === 'type' ? sortDirection : false}>
                <TableSortLabel
                  active={sortBy === 'type'}
                  direction={sortBy === 'type' ? sortDirection : 'asc'}
                  onClick={() => handleRequestSort('type')}
                >
                  Tipo
                </TableSortLabel>
              </TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(filteredSortedProducts) && filteredSortedProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.productType.name}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => handleOpenProductDialog(product)}
                    >
                      Editar
                    </Button>
                    <Button 
                      color="error" 
                      size="small"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Apagar
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Product Type Dialog */}
      <Dialog open={openProductTypeDialog} onClose={() => { setOpenProductTypeDialog(false); setEditingProductType(null); }}>
        <DialogTitle>{editingProductType ? 'Editar Tipo de Produto' : 'Adicionar Tipo de Produto'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome do Tipo de Produto"
            type="text"
            fullWidth
            value={newProductTypeName}
            onChange={(e) => setNewProductTypeName(e.target.value)}
          />
          {/* Removido do Admin conforme pedido: seleção de Tipo Base */}
          <FormControl fullWidth margin="dense">
            <InputLabel>Tipo Pai (Opcional)</InputLabel>
            <Select
              value={newProductTypeParentId === '' ? '' : String(newProductTypeParentId)}
              label="Tipo Pai (Opcional)"
              onChange={(e) => setNewProductTypeParentId(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <MenuItem value="">— Sem Pai —</MenuItem>
              {flattenTypes(Array.isArray(productTypes) ? productTypes : []).map((pt) => (
                <MenuItem key={pt.id} value={pt.id}>{pt.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenProductTypeDialog(false); setEditingProductType(null); }}>Cancelar</Button>
          <Button onClick={handleCreateOrUpdateProductType}>{editingProductType ? 'Guardar' : 'Criar'}</Button>
        </DialogActions>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={openProductDialog} onClose={() => setOpenProductDialog(false)}>
        <DialogTitle>{editingProduct ? 'Editar Produto' : 'Adicionar Produto'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Nome do Produto"
            fullWidth
            margin="normal"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
          />
          <TextField
            label="Descrição"
            fullWidth
            margin="normal"
            multiline
            rows={2}
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
          />
          <TextField
            label="Imagem (ID do Drive ou URL)"
            fullWidth
            margin="normal"
            value={newProduct.image_url}
            onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
            placeholder="Ex.: 1-pW0M60WDmG-k_rzjkWIn5e1BfdmfMCm ou https://..."
          />
          {isUnsupportedDriveViewer(newProduct.image_url) && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Este link do Google Drive não é incorporável. Usa "Partilhar → Obter ligação" e cola um link com ID (ex.: /file/d/ID ou ?id=ID). Será convertido para uc?export=view.
            </Alert>
          )}
          {newProduct.image_url && !isUnsupportedDriveViewer(newProduct.image_url) ? (
            <Box sx={{ mt: 1, mb: 2 }}>
              <Box
                component="img"
                src={normalizeImageUrl(buildDriveThumbnailUrl(newProduct.image_url))}
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
            value={newProduct.available_sizes}
            onChange={(e) => setNewProduct({ ...newProduct, available_sizes: e.target.value })}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Família do produto</InputLabel>
            <Select
              value={newProduct.product_type_id}
              label="Família do produto"
              onChange={(e) => setNewProduct({ ...newProduct, product_type_id: String(e.target.value) })}
            >
              {flattenTypes(Array.isArray(productTypes) ? productTypes : []).map((pt) => (
                <MenuItem key={pt.id} value={String(pt.id)}>{pt.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Tipos Disponíveis para o Produto</InputLabel>
            <Select
              multiple
              value={(newProduct.available_shirt_type_ids || []).map(String)}
              label="Tipos Disponíveis para o Produto"
              onChange={(e) => {
                const value = e.target.value as unknown as string[];
                setNewProduct({ ...newProduct, available_shirt_type_ids: value.map(v => Number(v)) });
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
              value={newProduct.sexo}
              label="Sexo"
              onChange={e => setNewProduct({ ...newProduct, sexo: e.target.value })}
            >
              {sexoOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="Ano"
            fullWidth
            margin="normal"
            placeholder="24/25 ou 24"
            value={newProduct.ano}
            onChange={(e) => setNewProduct({ ...newProduct, ano: e.target.value })}
            onBlur={(e) => setNewProduct({ ...newProduct, ano: formatSeason(e.target.value) })}
          />
          {/* Removed "Número" field from Add/Edit Product as requested */}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProductDialog}>Cancelar</Button>
          <Button onClick={handleSaveProduct}>
            {editingProduct ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
    </Box>
  );
};

export default ProductManagement; 