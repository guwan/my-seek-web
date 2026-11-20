import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import rootReducer from './reducers';
import { persistWriting } from './writingSlice';
import { persistChatHistory } from './chatHistorySlice';
import { configureWritingSync, ensureWritingSyncInitialized, syncWritingToServer } from '~/services/writingSync';

const store = configureStore({
  reducer: rootReducer,
});

configureWritingSync(store);

// 写作内容先落 localStorage，再增量同步到服务端（定时器合并连续输入）
let persistTimer: ReturnType<typeof setTimeout> | null = null;
store.subscribe(() => {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistWriting(store.getState());
    persistChatHistory(store.getState());
    void syncWritingToServer();
  }, 400);
});

void ensureWritingSyncInitialized();

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof rootReducer>;

/** 带类型的 dispatch，避免 AsyncThunk 动作类型不匹配 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

export default store;
