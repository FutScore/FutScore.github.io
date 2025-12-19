import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import orderReducer from './slices/orderSlice';
import cartReducer from './slices/cartSlice';
import addressReducer from './slices/addressSlice';
import notificationReducer from './slices/notificationSlice';
import orderStateReducer from './slices/orderStateSlice';
import appSettingsReducer from './slices/appSettingsSlice';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    order: orderReducer,
    cart: cartReducer,
    address: addressReducer,
    notification: notificationReducer,
    orderStates: orderStateReducer,
    appSettings: appSettingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector; 