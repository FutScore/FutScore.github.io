import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { Order, OrderState } from '../../types';
import { API_BASE_URL } from '../../api';

interface OrderSliceState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const initialState: OrderSliceState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
};

export const createOrder = createAsyncThunk(
  'order/create',
  async (orderData: { userId: number; items: any[]; address: any; paymentMethod?: string; clientInstagram?: string; finalPrice?: number }) => {
    const response = await axios.post(`${API_BASE_URL}/.netlify/functions/createorder`, orderData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data; // { id: orderId }
  }
);

export const fetchOrders = createAsyncThunk(
  'order/fetchAll',
  async ({ userId, page = 1, limit = 20 }: { userId?: number; page?: number; limit?: number } = {}) => {
    const url = userId
      ? `${API_BASE_URL}/.netlify/functions/getorders?userId=${userId}&page=${page}&limit=${limit}`
      : `${API_BASE_URL}/.netlify/functions/getorders?page=${page}&limit=${limit}`;
    const response = await axios.get(url);
    return response.data;
  }
);

export const updateOrderStatus = createAsyncThunk(
  'order/updateStatus',
  async ({ orderId, status }: { orderId: string; status: string }) => {
    const response = await axios.put(`${API_BASE_URL}/.netlify/functions/updateorderstatus/${orderId}`, { status });
    return response.data;
  }
);

export const updateOrderImages = createAsyncThunk(
  'order/updateImages',
  async ({ orderId, images }: { orderId: string; images: { imageFront: string; imageBack?: string; }[] }) => {
    const response = await axios.put(`${API_BASE_URL}/.netlify/functions/updateorderimages/${orderId}`, { images }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
        state.orders.push(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Falha ao criar encomenda';
      })
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both old format (array) and new format (paginated response)
        if (Array.isArray(action.payload)) {
          state.orders = action.payload;
          state.pagination = undefined;
        } else {
          state.orders = action.payload.orders;
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Falha ao carregar encomendas';
      })
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.orders.findIndex(
          (order) => order.id === action.payload.id
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Falha ao atualizar estado da encomenda';
      })
      .addCase(updateOrderImages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderImages.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.orders.findIndex(
          (order) => order.id === action.payload.id
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(updateOrderImages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Falha ao atualizar imagens da encomenda';
      });
  },
});

export const { clearError } = orderSlice.actions;
export default orderSlice.reducer; 