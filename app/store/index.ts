import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import rootReducer from './reducers';

const store = configureStore({
  reducer: rootReducer,
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof rootReducer>;

/** 带类型的 dispatch，避免 AsyncThunk 动作类型不匹配 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

export default store;
