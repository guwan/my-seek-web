import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { httpClient } from '~/lib/request';
import type { Result } from '~/services/data';

interface ModelInfo {
    name: string;
    provider?: string;
    size?: string;
    modified_at?: string;
    digest?: string;
}

interface ModelState {
    models: ModelInfo[];
    selectedModel: string;
    loading: boolean;
    error: string | null;
}

// 默认模型
const DEFAULT_MODEL = 'ollama:deepseek-r1:8b';

const initialState: ModelState = {
    models: [],
    selectedModel: DEFAULT_MODEL,
    loading: false,
    error: null,
};

// 异步获取模型列表
export const fetchModels = createAsyncThunk<ModelInfo[], void, { rejectValue: string }>(
    'models/fetchModels',
    async (_, { rejectWithValue }) => {
        try {
            const response = await httpClient.getRet<ModelInfo[]>('/api/ai/models');
            if (response.success) {
                return response.data || [];
            }
            return rejectWithValue('模型列表加载失败');
        } catch (error) {
            return rejectWithValue('模型列表加载失败，请检查后端服务');
        }
    }
);

const modelSlice = createSlice({
    name: 'models',
    initialState,
    reducers: {
        setSelectedModel: (state, action: PayloadAction<string>) => {
            state.selectedModel = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchModels.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchModels.fulfilled, (state, action) => {
                state.loading = false;
                state.models = action.payload;
                
                // 如果当前选中的模型不在列表中，选择默认模型
                if (action.payload.length > 0 && 
                    !action.payload.some(model => model.name === state.selectedModel)) {
                    const defaultModel = action.payload.find((m: ModelInfo) => m.name === DEFAULT_MODEL);
                    if (defaultModel) {
                        state.selectedModel = DEFAULT_MODEL;
                    } else {
                        state.selectedModel = action.payload[0].name;
                    }
                }
            })
            .addCase(fetchModels.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setSelectedModel } = modelSlice.actions;
export default modelSlice.reducer;
