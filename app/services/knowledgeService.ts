import {httpClient} from "~/lib/request";
import type {Result} from "~/services/data";

export type KnowledgeStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface KnowledgeDocument {
    id?: string;
    name?: string;
    originalName?: string;
    type?: string;
    size?: number;
    status?: KnowledgeStatus;
    errorMessage?: string;
    chunkCount?: number;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: number;
}

export interface KnowledgePage {
    content: KnowledgeDocument[];
    totalElements?: number;
    totalPages?: number;
    number?: number;
    size?: number;
}

export async function uploadDocument(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return httpClient.postForm<Result<KnowledgeDocument>>("/api/knowledge/upload", formData);
}

export async function listDocuments(params: {page: number; size: number; status?: KnowledgeStatus}) {
    return httpClient.getRet<KnowledgePage>("/api/knowledge/documents", params);
}

export async function deleteDocument(documentId: string) {
    return httpClient.delete<Result<unknown>>(`/api/knowledge/documents/${encodeURIComponent(documentId)}`);
}

export async function queryKnowledge(query: string, topK = 5, model?: string) {
    return httpClient.postRet("/api/knowledge/query", {query, topK, model});
}

export async function queryDocument(documentId: string, query: string, topK = 5, model?: string) {
    return httpClient.postRet(`/api/knowledge/documents/${encodeURIComponent(documentId)}/query`, {query, topK, model});
}
