import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../api';

export interface Notification {
  id: string;
  userId: number;
  type: 'payment_reminder' | 'order_update' | 'general';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  orderId?: string;
}

export interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
}

const initialState: NotificationState = {
  notifications: [],
  loading: false,
  error: null,
  unreadCount: 0,
};

export const fetchNotifications = createAsyncThunk(
  'notification/fetchAll',
  async (userId: number) => {
    const response = await axios.get(`${API_BASE_URL}/.netlify/functions/getnotifications?userId=${userId}`);
    return response.data;
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notification/markAsRead',
  async ({ notificationId }: { notificationId: string }) => {
    const response = await axios.put(`${API_BASE_URL}/.netlify/functions/marknotificationread/${notificationId}`);
    return response.data;
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (userId: number) => {
    const response = await axios.put(`${API_BASE_URL}/.netlify/functions/markallnotificationsread`, { userId });
    return response.data;
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure payload is an array
        const notifications = Array.isArray(action.payload) ? action.payload : [];
        state.notifications = notifications;
        state.unreadCount = notifications.filter((n: Notification) => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch notifications';
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload.id);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(n => n.read = true);
        state.unreadCount = 0;
      });
  },
});

export const { clearError, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer; 