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
            return rejectWithValue('Failed to fetch models');
        } catch (error) {
            return rejectWithValue('Error fetching models');
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
        clearError: (state) => {
            state.error = null;
        },
        // 设置默认模型
        setDefaultModel: (state) => {
            if (state.models.length > 0) {
                // 优先选择 Ollama 的 deepseek-r1:8b
                const defaultModel = state.models.find(m => m.name === DEFAULT_MODEL);
                if (defaultModel) {
                    state.selectedModel = DEFAULT_MODEL;
                } else {
                    // 如果没有默认模型，选择第一个可用的
                    state.selectedModel = state.models[0].name;
                }
            }
        }
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

export const { setSelectedModel, clearError, setDefaultModel } = modelSlice.actions;
export default modelSlice.reducer;
