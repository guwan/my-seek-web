import { useSelector } from "react-redux";

import type { RootState } from "~/store";

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

const providerDisplayNames: Record<string, string> = {
    ollama: "本地模型 (Ollama)",
    doubao: "豆包",
    qwen: "千问",
};

const providerIcons: Record<string, string> = {
    ollama: "🖥️",
    doubao: "🔥",
    qwen: "☁️",
};

const modelDisplayNames: Record<string, string> = {
    "deepseek-r1:8b": "DeepSeek R1 8B",
    "deepseek-r1:14b": "DeepSeek R1 14B",
    "deepseek-r1:32b": "DeepSeek R1 32B",
    "llama2": "Llama 2",
    "llama2:13b": "Llama 2 13B",
    "llama2:70b": "Llama 2 70B",
    "qwen:7b": "Qwen 7B",
    "qwen:14b": "Qwen 14B",
    "qwen:72b": "Qwen 72B",
    "doubao-pro-32k": "Doubao Pro 32K",
    "doubao-lite-32k": "Doubao Lite 32K",
    "doubao-pro-128k": "Doubao Pro 128K",
    "doubao-vision-pro-32k": "Doubao Vision Pro 32K",
    "qwen-turbo": "Qwen Turbo",
    "qwen-plus": "Qwen Plus",
    "qwen-max": "Qwen Max",
    "qwen-long": "Qwen Long",
    "qwen-coder-plus": "Qwen Coder Plus",
};

export const ModelSelector = ({ selectedModel, onModelChange, className = "" }: ModelSelectorProps) => {
    const { models, loading, error } = useSelector((state: RootState) => state.models);

    const groupModelsByProvider = (list: ModelInfo[]) => {
        return list.reduce<Record<string, ModelInfo[]>>((groups, model) => {
            const provider = model.provider || "ollama";
            (groups[provider] ||= []).push(model);
            return groups;
        }, {});
    };

    const getModelDisplayName = (modelName: string) => {
        const name = modelName.startsWith("ollama:")
            ? modelName.slice("ollama:".length)
            : modelName;
        return modelDisplayNames[name] || name;
    };

    if (loading) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <label className="text-sm font-medium text-muted-foreground">模型</label>
                <div className="px-3 py-1.5 border rounded-lg text-sm bg-muted animate-pulse">
                    加载中...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <label className="text-sm font-medium text-muted-foreground">模型</label>
                <div className="px-3 py-1.5 border border-destructive/30 rounded-lg text-sm text-destructive bg-destructive/10">
                    {error}
                </div>
            </div>
        );
    }

    if (models.length === 0) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <label className="text-sm font-medium text-muted-foreground">模型</label>
                <span className="text-sm text-muted-foreground">暂无可用模型</span>
            </div>
        );
    }

    const groupedModels = groupModelsByProvider(models);
    const selectedProvider = models.find((model) => model.name === selectedModel)?.provider || "ollama";

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <label className="text-sm font-medium text-muted-foreground" htmlFor="model-select">模型</label>
            <div className="relative">
                <select
                    id="model-select"
                    value={selectedModel}
                    onChange={(event) => onModelChange(event.target.value)}
                    className="appearance-none px-4 py-1.5 pr-8 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground border-border hover:border-blue-400 transition-colors cursor-pointer max-w-[240px]"
                >
                    {Object.entries(groupedModels).map(([provider, providerModels]) => (
                        <optgroup
                            key={provider}
                            label={providerDisplayNames[provider] || provider}
                        >
                            {providerModels.map((model) => (
                                <option key={model.name} value={model.name}>
                                    {getModelDisplayName(model.name)}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                        className="size-4 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            <span className="text-xs text-muted-foreground" aria-hidden="true">
                {providerIcons[selectedProvider] || "🤖"}
            </span>
        </div>
    );
};

export default ModelSelector;
