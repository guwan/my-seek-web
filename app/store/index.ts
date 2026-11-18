import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import rootReducer from './reducers';
import { persistWriting } from './writingSlice';
import { persistChatHistory } from './chatHistorySlice';

const store = configureStore({
  reducer: rootReducer,
});

// 写作内容变化时自动保存到 localStorage（用定时器合并连续输入，避免频繁写磁盘）
let persistTimer: ReturnType<typeof setTimeout> | null = null;
store.subscribe(() => {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistWriting(store.getState());
    persistChatHistory(store.getState());
  }, 400);
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof rootReducer>;

/** 带类型的 dispatch，避免 AsyncThunk 动作类型不匹配 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

export default store;
