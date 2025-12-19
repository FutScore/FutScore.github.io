import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getOrderStates, updateOrderState } from '../../api';
import { OrderState } from '../../types';

interface OrderStateSliceState {
  orderStates: OrderState[];
  loading: boolean;
  error: string | null;
}

const initialState: OrderStateSliceState = {
  orderStates: [],
  loading: false,
  error: null,
};

export const fetchOrderStates = createAsyncThunk(
  'orderStates/fetchOrderStates',
  async () => {
    const response = await getOrderStates();
    return response;
  }
);

export const updateOrderStateAsync = createAsyncThunk(
  'orderStates/updateOrderState',
  async (data: { id: number; name?: string; name_user?: string; name_admin?: string; color: string; description?: string }) => {
    const response = await updateOrderState(data);
    return response;
  }
);

const orderStateSlice = createSlice({
  name: 'orderStates',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderStates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderStates.fulfilled, (state, action) => {
        state.loading = false;
        state.orderStates = action.payload;
      })
      .addCase(fetchOrderStates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Falha ao carregar estados das encomendas';
      })
      .addCase(updateOrderStateAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStateAsync.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.orderStates.findIndex(
          (orderState) => orderState.id === action.payload.id
        );
        if (index !== -1) {
          state.orderStates[index] = action.payload;
        }
      })
      .addCase(updateOrderStateAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Falha ao atualizar estado da encomenda';
      });
  },
});

export const { clearError } = orderStateSlice.actions;
export default orderStateSlice.reducer;
