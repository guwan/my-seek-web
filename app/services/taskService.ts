import {getUserToken} from "~/lib/AuthUtils";
import {httpClient} from "~/lib/request";
import type {Result} from "~/services/data";

export type TaskStatus = "CREATED" | "PLANNING" | "PLAN_REVIEW" | "WAIT_APPROVAL" | "RUNNING" | "PAUSED"
    | "COMPLETED" | "FAILED" | "CANCELLED" | "REJECTED";
export type StepStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "SKIPPED";

export interface TaskStep {
    id: string;
    seq: number;
    title: string;
    tool?: string;
    inputJson?: string;
    parallelGroup?: string;
    requiresApproval?: boolean;
    approved?: boolean;
    status: StepStatus;
    resultText?: string;
    errorMessage?: string;
}

export interface TaskEvent {
    id: string;
    seq?: number;
    stepId?: string;
    eventType: string;
    payload?: string;
    createdAt?: string;
}

export interface AgentTask {
    id: string;
    title: string;
    goal: string;
    constraints?: string;
    modelCode?: string;
    agentCode?: string;
    status: TaskStatus;
    currentStep?: number;
    maxSteps?: number;
    finalSummary?: string;
    errorMessage?: string;
    createdAt?: string;
    updatedAt?: string;
    steps?: TaskStep[];
    events?: TaskEvent[];
}

export interface TaskPage {
    content: AgentTask[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

/**
 * 订阅任务事件的 SSE 流。fetch 可以携带 Authorization 头，避免 EventSource 无法传 Token 的限制。
 */
export async function streamTaskEvents(
    taskId: string,
    after: number,
    onEvent: (event: TaskEvent) => void,
    options?: { signal?: AbortSignal },
) {
    const token = getUserToken();
    const response = await fetch(
        `/api/tasks/${encodeURIComponent(taskId)}/events?after=${after}`,
        {
            headers: token ? {Authorization: `Bearer ${token}`} : {},
            signal: options?.signal,
        },
    );
    if (!response.ok || !response.body) {
        throw new Error(`订阅任务事件失败：HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
        const {value, done} = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, {stream: true});
        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
            const data = frame.split(/\r?\n/)
                .filter(line => line.startsWith("data:"))
                .map(line => line.slice(5).trimStart())
                .join("\n");
            if (!data || data === "keepalive") continue;
            try {
                onEvent(JSON.parse(data) as TaskEvent);
            } catch {
                // 忽略无法解析的心跳或非事件帧
            }
        }
    }
}

export function createTask(payload: { title: string; goal: string; constraints?: string; modelCode?: string; agentCode?: string }) {
    return httpClient.post<Result<AgentTask>>("/api/tasks", payload);
}

export function listTasks(page = 0, size = 20) {
    return httpClient.getRet<TaskPage>("/api/tasks", {page, size});
}

export function getTask(taskId: string) {
    return httpClient.getRet<AgentTask>(`/api/tasks/${encodeURIComponent(taskId)}`);
}

/** 任务中心可用工具（内置 + 外部 MCP 工具）。 */
export function listTaskTools() {
    return httpClient.getRet<string[]>("/api/tasks/tools");
}

export function confirmTask(taskId: string) {
    return httpClient.post<Result<AgentTask>>(`/api/tasks/${encodeURIComponent(taskId)}/confirm`, {});
}

export function approveTask(taskId: string, approved: boolean, reason?: string) {
    return httpClient.post<Result<AgentTask>>(`/api/tasks/${encodeURIComponent(taskId)}/approve`, {
        approved,
        reason,
    });
}

export function cancelTask(taskId: string) {
    return httpClient.post<Result<AgentTask>>(`/api/tasks/${encodeURIComponent(taskId)}/cancel`, {});
}

export function retryTaskStep(taskId: string, stepId: string) {
    return httpClient.post<Result<AgentTask>>(
        `/api/tasks/${encodeURIComponent(taskId)}/steps/${encodeURIComponent(stepId)}/retry`, {});
}
