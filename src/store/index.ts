import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import roleSlice from './slices/roleSlice';
import permissionSlice from './slices/permissionSlice';
import serviceSlice from './slices/serviceSlice';
import oauthSlice from './slices/oauthSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    role: roleSlice,
    permission: permissionSlice,
    service: serviceSlice,
    oauth: oauthSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;