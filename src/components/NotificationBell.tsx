import React, { useEffect, useState } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  useTheme,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../store/slices/notificationSlice';
import { useNavigate } from 'react-router-dom';
import PaymentProofModal from './PaymentProofModal';
import { API_BASE_URL } from '../api';

const NotificationBell: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { notifications, unreadCount, loading } = useSelector((state: RootState) => state.notification);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any>(null);
  const theme = useTheme();

  const open = Boolean(anchorEl);

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications(user.id));
    }
  }, [dispatch, user]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await dispatch(markNotificationAsRead({ notificationId: notification.id }));
    }
    handleClose();

    // Handle different notification types
    if (notification.type === 'payment_reminder' && notification.orderId) {
      // For payment reminders, open the payment modal
      try {
        // Fetch the order details
        const response = await fetch(`${API_BASE_URL}/.netlify/functions/getorders?orderId=${notification.orderId}`);
        const orders = await response.json();
        const order = orders.find((o: any) => o.id.toString() === notification.orderId);
        
        if (order) {
          setSelectedOrderForPayment(order);
          setPaymentModalOpen(true);
        } else {
          // If order not found, navigate to orders page
          navigate('/previous-orders');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        navigate('/previous-orders');
      }
    } else if (notification.type === 'order_update' && notification.orderId) {
      // For order updates, navigate to orders page
      navigate('/previous-orders');
    } else {
      // For general notifications, just close the menu
      handleClose();
    }
  };

  const handleMarkAllAsRead = async () => {
    if (user) {
      await dispatch(markAllNotificationsAsRead(user.id));
    }
  };

  const handleClosePaymentModal = () => {
    setPaymentModalOpen(false);
    setSelectedOrderForPayment(null);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_reminder':
        return '💰';
      case 'order_update':
        return '📦';
      default:
        return '🔔';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      return `Há ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
    }
  };

  if (!user) return null;

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ ml: 1 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 350,
            maxHeight: 400,
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notificações</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllAsRead}>
              Marcar todas como lidas
            </Button>
          )}
        </Box>
        <Divider />
        
        {loading ? (
          <MenuItem>
            <Typography>Carregando...</Typography>
          </MenuItem>
        ) : notifications.length === 0 ? (
          <MenuItem>
            <Typography color="text.secondary">Nenhuma notificação</Typography>
          </MenuItem>
        ) : (
          Array.isArray(notifications) && notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                backgroundColor: notification.read ? 'transparent' : theme.palette.action.hover,
                '&:hover': {
                  backgroundColor: theme.palette.action.selected,
                },
                flexDirection: 'column',
                alignItems: 'flex-start',
                py: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.5 }}>
                <Typography sx={{ mr: 1, fontSize: '1.2em' }}>
                  {getNotificationIcon(notification.type)}
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: notification.read ? 'normal' : 'bold',
                    flex: 1,
                  }}
                >
                  {notification.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(notification.created_at)}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontWeight: notification.read ? 'normal' : 'medium',
                  ml: 3,
                }}
              >
                {notification.message}
              </Typography>
            </MenuItem>
          ))
        )}
      </Menu>

      {selectedOrderForPayment && (
        <PaymentProofModal
          open={paymentModalOpen}
          onClose={handleClosePaymentModal}
          order={selectedOrderForPayment}
        />
      )}
    </>
  );
};

export default NotificationBell; 