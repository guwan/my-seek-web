import {httpClient} from "~/lib/request";
import type {Result} from "~/services/data";

export interface AiProvider {
    id?: string;
    name: string;
    displayName: string;
    baseUrl: string;
    apiKeyMasked?: string;
    apiKeyConfigured?: boolean;
    apiKey?: string;
    models: string[];
    enabled: boolean;
    builtIn?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export const getProviders = () => httpClient.getRet<AiProvider[]>('/api/ai/providers');

export const createProvider = (data: Omit<AiProvider, 'id' | 'builtIn'>) =>
    httpClient.post<Result<AiProvider>>('/api/ai/providers', data as Record<string, any>);

export const updateProvider = (id: string, data: Omit<AiProvider, 'id' | 'builtIn'>) =>
    httpClient.put<Result<AiProvider>>(`/api/ai/providers/${id}`, data as Record<string, any>);

export const deleteProvider = (id: string) =>
    httpClient.delete<Result<void>>(`/api/ai/providers/${id}`);

export const toggleProvider = (id: string, enabled: boolean) =>
    httpClient.patch<Result<AiProvider>>(`/api/ai/providers/${id}/toggle`, {enabled});

export const testProvider = (data: Omit<AiProvider, 'id' | 'builtIn'>) =>
    httpClient.post<Result<void>>('/api/ai/providers/test', data as Record<string, any>);

export interface OllamaConfig {
    baseUrl: string;
    defaultChatModel: string;
    embeddingModel: string;
    pullModelStrategy: string;
    configured?: boolean;
    updatedAt?: string;
}

export const getOllamaConfig = () => httpClient.getRet<OllamaConfig>('/api/ai/ollama/config');

export const updateOllamaConfig = (data: OllamaConfig) =>
    httpClient.put<Result<OllamaConfig>>('/api/ai/ollama/config', data as Record<string, any>);

export const testOllamaConfig = (data: OllamaConfig) =>
    httpClient.post<Result<string[]>>('/api/ai/ollama/test', data as Record<string, any>);
