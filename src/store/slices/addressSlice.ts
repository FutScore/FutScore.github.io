import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchAddresses, createAddress, updateAddress, deleteAddress } from '../../api';

export const getAddresses = createAsyncThunk(
  'address/getAddresses',
  async (userId: number) => {
    const response = await fetchAddresses(userId);
    return response;
  }
);

export const addAddress = createAsyncThunk(
  'address/addAddress',
  async (address: any) => {
    const response = await createAddress(address);
    return response;
  }
);

export const editAddress = createAsyncThunk(
  'address/editAddress',
  async (address: any) => {
    const response = await updateAddress(address);
    return response;
  }
);

export const removeAddress = createAsyncThunk(
  'address/removeAddress',
  async ({ id, userId }: { id: number; userId: number }) => {
    await deleteAddress(id, userId);
    return id;
  }
);

export interface Address {
  id: number;
  userId: number;
  nome: string;
  telemovel: string;
  morada: string;
  cidade: string;
  distrito: string;
  codigoPostal: string;
  pais: string;
}

interface AddressState {
  addresses: Address[];
  loading: boolean;
  error: string | null;
}

const initialState: AddressState = {
  addresses: [],
  loading: false,
  error: null,
};

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAddresses.fulfilled, (state, action) => {
        // Handle both old format (array) and new paginated format
        if (Array.isArray(action.payload)) {
          state.addresses = action.payload;
        } else {
          state.addresses = action.payload.addresses;
        }
        state.loading = false;
      })
      .addCase(getAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch addresses';
      })
      .addCase(addAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.addresses.unshift(action.payload);
        state.loading = false;
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add address';
      })
      .addCase(editAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editAddress.fulfilled, (state, action) => {
        const idx = state.addresses.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.addresses[idx] = action.payload;
        state.loading = false;
      })
      .addCase(editAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update address';
      })
      .addCase(removeAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeAddress.fulfilled, (state, action) => {
        state.addresses = state.addresses.filter((a) => a.id !== action.payload);
        state.loading = false;
      })
      .addCase(removeAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete address';
      });
  },
});

export const { clearError } = addressSlice.actions;
export default addressSlice.reducer; 