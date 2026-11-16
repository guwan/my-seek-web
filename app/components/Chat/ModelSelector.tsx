import { useState, useEffect } from 'react';
import { httpClient } from '~/lib/request';

interface ModelInfo {
    name: string;
    provider?: string;
    size?: string;
    modified_at?: string;
    digest?: string;
}

interface ModelSelectorProps {
    selectedModel: string;
    onModelChange: (model: string) => void;
    className?: string;
}

// 提供者显示名称映射
const providerDisplayNames: Record<string, string> = {
    'ollama': '🖥️ 本地模型 (Ollama)',
    'doubao': '🔥 豆包 (字节跳动)',
    'qwen': '☁️ 千问 (阿里云)'
};

// 提供者图标映射
const providerIcons: Record<string, string> = {
    'ollama': '🖥️',
    'doubao': '🔥',
    'qwen': '☁️'
};

// 模型显示名称映射
const modelDisplayNames: Record<string, string> = {
    // Ollama 模型
    'deepseek-r1:8b': 'DeepSeek R1 8B',
    'deepseek-r1:14b': 'DeepSeek R1 14B',
    'deepseek-r1:32b': 'DeepSeek R1 32B',
    'llama2': 'Llama 2',
    'llama2:13b': 'Llama 2 13B',
    'llama2:70b': 'Llama 2 70B',
    'qwen:7b': 'Qwen 7B',
    'qwen:14b': 'Qwen 14B',
    'qwen:72b': 'Qwen 72B',
    // 豆包模型
    'doubao-pro-32k': 'Doubao Pro 32K',
    'doubao-lite-32k': 'Doubao Lite 32K',
    'doubao-pro-128k': 'Doubao Pro 128K',
    'doubao-vision-pro-32k': 'Doubao Vision Pro 32K',
    // 千问模型
    'qwen-turbo': 'Qwen Turbo',
    'qwen-plus': 'Qwen Plus',
    'qwen-max': 'Qwen Max',
    'qwen-long': 'Qwen Long',
    'qwen-coder-plus': 'Qwen Coder Plus'
};

export const ModelSelector = ({ selectedModel, onModelChange, className = '' }: ModelSelectorProps) => {
    const [models, setModels] = useState<ModelInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchModels = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await httpClient.getRet<ModelInfo[]>('/api/ai/models');
                if (response.success) {
                    setModels(response.data || []);
                } else {
                    setError('Failed to load models');
                }
            } catch (err) {
                setError('Error loading models');
                console.error('Error fetching models:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchModels();
    }, []);

    // 按提供者分组模型
    const groupModelsByProvider = (models: ModelInfo[]) => {
        const groups: Record<string, ModelInfo[]> = {};
        
        models.forEach(model => {
            const provider = model.provider || 'ollama';
            if (!groups[provider]) {
                groups[provider] = [];
            }
            groups[provider].push(model);
        });
        
        return groups;
    };

    // 获取模型的显示名称
    const getModelDisplayName = (modelName: string) => {
        // 如果包含冒号，只取模型名部分
        const name = modelName.includes(':') ? modelName.split(':')[1] : modelName;
        return modelDisplayNames[name] || name;
    };

    // 获取当前选中模型的提供者
    const getSelectedProvider = () => {
        const selected = models.find(m => m.name === selectedModel);
        return selected?.provider || 'ollama';
    };

    if (loading) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">模型:</label>
                <div className="px-3 py-1.5 border rounded-lg text-sm bg-gray-50 dark:bg-gray-800 animate-pulse">
                    加载中...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">模型:</label>
                <div className="px-3 py-1.5 border rounded-lg text-sm text-red-600 bg-red-50">
                    {error}
                </div>
            </div>
        );
    }

    const groupedModels = groupModelsByProvider(models);
    const selectedProvider = getSelectedProvider();

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">模型:</label>
            <div className="relative">
                <select
                    value={selectedModel}
                    onChange={(e) => onModelChange(e.target.value)}
                    className="appearance-none px-4 py-1.5 pr-8 border rounded-lg text-sm 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 
                             bg-white dark:bg-gray-800 
                             text-gray-900 dark:text-gray-100
                             border-gray-300 dark:border-gray-600
                             hover:border-blue-400 dark:hover:border-blue-500
                             transition-colors cursor-pointer
                             min-w-[200px]"
                >
                    {Object.entries(groupedModels).map(([provider, providerModels]) => (
                        <optgroup 
                            key={provider} 
                            label={providerDisplayNames[provider] || provider}
                            className="font-semibold"
                        >
                            {providerModels.map((model) => (
                                <option key={model.name} value={model.name} className="py-1">
                                    {getModelDisplayName(model.name)}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                {/* 自定义下拉箭头 */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg 
                        className="w-4 h-4 text-gray-500 dark:text-gray-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            {/* 显示当前选中模型的提供者标识 */}
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                {providerIcons[selectedProvider] || '🤖'}
            </span>
        </div>
    );
};

export default ModelSelector;
