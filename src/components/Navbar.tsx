import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  useMediaQuery,
  IconButton as MuiIconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { logout } from '../store/slices/authSlice';
import { fetchAppSettings } from '../store/slices/appSettingsSlice';
import NotificationBell from './NotificationBell';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import { setUser } from '../store/slices/authSlice';

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { items } = useSelector((state: RootState) => state.cart);
  const { appSettings } = useSelector((state: RootState) => state.appSettings);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    dispatch(fetchAppSettings());
  }, [dispatch]);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleClose();
    navigate('/login');
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };





  const commonLinks = (
    <>
      <Button color="inherit" component={RouterLink} to="/store" onClick={isMobile ? handleDrawerToggle : undefined}>
        Loja
      </Button>
      {user && (
        <>
          <Button color="inherit" component={RouterLink} to="/order" onClick={isMobile ? handleDrawerToggle : undefined}>
            Novo Pedido
          </Button>
           <Button color="inherit" component={RouterLink} to="/previous-orders" onClick={isMobile ? handleDrawerToggle : undefined}>
                Meus Pedidos
            </Button>
          <Button color="inherit" component={RouterLink} to="/user-panel" onClick={isMobile ? handleDrawerToggle : undefined}>
            Painel do Utilizador
          </Button>
          {user.role === 'admin' && (
            <Button color="inherit" component={RouterLink} to="/admin" onClick={isMobile ? handleDrawerToggle : undefined}>
              Painel de Admin
            </Button>
          )}
        </>
      )}
    </>
  );

  const drawerItems = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center', width: 250 }}>
      <Box sx={{ my: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {appSettings?.logo ? (
          <img 
            src={appSettings.logo} 
            alt="Logo" 
            style={{ 
              height: `${appSettings.logoHeight || 40}px`,
              maxWidth: '200px',
              objectFit: 'contain'
            }} 
          />
        ) : (
          <Typography variant="h6">FutScore</Typography>
        )}
      </Box>
      <List>
        <ListItemButton component={RouterLink} to="/store">
          <ListItemText primary="Loja" />
        </ListItemButton>
        {user ? (
          <>
            <ListItemButton component={RouterLink} to="/order">
              <ListItemText primary="Novo Pedido" />
            </ListItemButton>
            <ListItemButton component={RouterLink} to="/previous-orders">
                <ListItemText primary="Meus Pedidos" />
            </ListItemButton>
            <ListItemButton component={RouterLink} to="/user-panel">
              <ListItemText primary="Painel do Utilizador" />
            </ListItemButton>
            {user.role === 'admin' && (
              <ListItemButton component={RouterLink} to="/admin">
                <ListItemText primary="Painel de Admin" />
              </ListItemButton>
            )}
          </>
        ) : (
            <ListItemButton component={RouterLink} to="/login">
                <ListItemText primary="Entrar" />
            </ListItemButton>
        )}
      </List>
    </Box>
  );

  return (
    <AppBar position="static" sx={{ borderRadius: '0px' }}>
      <Toolbar>
        {isMobile && (
          <MuiIconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </MuiIconButton>
        )}
        <Box
          component={RouterLink}
          to="/"
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none', 
            color: 'inherit',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {appSettings?.logo ? (
            <img 
              src={appSettings.logo} 
              alt="Logo" 
              style={{ 
                height: `${appSettings.logoHeight || 40}px`,
                maxWidth: '200px',
                objectFit: 'contain'
              }} 
            />
          ) : (
            <Typography variant="h6">FutScore</Typography>
          )}
        </Box>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            {commonLinks}
        </Box>
        <Box sx={{ flexGrow: { xs: 1, md: 0 } }} />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              component={RouterLink}
              to="/cart"
            >
              <Badge badgeContent={items.length} color="error">
                <ShoppingCartIcon />
              </Badge>
            </IconButton>

            {user && <NotificationBell />}

            {user ? (
                <>
                    <IconButton
                        size="large"
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleMenu}
                        color="inherit"
                    >
                        <AccountCircle />
                    </IconButton>
                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                        }}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                        <MenuItem component={RouterLink} to="/user-panel" onClick={handleClose}>
                          <PersonIcon fontSize="small" style={{ marginRight: 8 }} />
                          Painel do Utilizador
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>Sair</MenuItem>
                    </Menu>
                </>
            ) : (
                !isMobile && (
                    <Button
                        color="inherit"
                        component={RouterLink}
                        to="/login"
                    >
                        Entrar
                    </Button>
                )
            )}
        </Box>
      </Toolbar>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        {drawerItems}
      </Drawer>
    </AppBar>
  );
};

export default Navbar; 