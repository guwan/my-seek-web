import {httpClient} from "~/lib/request";
import type {Result} from "~/services/data";

export interface AgentDef {
    id: string;
    code: string;
    name: string;
    description?: string;
    icon?: string;
    systemPrompt?: string;
    skillsJson?: string;
    modelCode?: string;
    builtin?: boolean;
    enabled?: boolean;
    createdAt?: string;
}

export interface SkillDef {
    id: string;
    code: string;
    name: string;
    description?: string;
    icon?: string;
    promptTemplate?: string;
    toolsJson?: string;
    builtin?: boolean;
    enabled?: boolean;
    createdAt?: string;
}

export interface ConnectorDef {
    id: string;
    code: string;
    name: string;
    description?: string;
    icon?: string;
    type: "BUILTIN" | "MCP";
    toolsJson?: string;
    builtin?: boolean;
    enabled?: boolean;
    createdAt?: string;
}

export function listAgents() {
    return httpClient.getRet<AgentDef[]>("/api/catalog/agents");
}

export function listSkills() {
    return httpClient.getRet<SkillDef[]>("/api/catalog/skills");
}

export function listConnectors() {
    return httpClient.getRet<ConnectorDef[]>("/api/catalog/connectors");
}

export function saveAgent(payload: Partial<AgentDef> & { code: string; name: string }) {
    return httpClient.put<Result<AgentDef>>("/api/catalog/agents", payload);
}

export function saveSkill(payload: Partial<SkillDef> & { code: string; name: string }) {
    return httpClient.put<Result<SkillDef>>("/api/catalog/skills", payload);
}

export function saveConnector(payload: Partial<ConnectorDef> & { code: string; name: string }) {
    return httpClient.put<Result<ConnectorDef>>("/api/catalog/connectors", payload);
}

export function deleteAgent(id: string) {
    return httpClient.delete<Result<void>>(`/api/catalog/agents/${encodeURIComponent(id)}`);
}

export function deleteSkill(id: string) {
    return httpClient.delete<Result<void>>(`/api/catalog/skills/${encodeURIComponent(id)}`);
}

export function deleteConnector(id: string) {
    return httpClient.delete<Result<void>>(`/api/catalog/connectors/${encodeURIComponent(id)}`);
}
