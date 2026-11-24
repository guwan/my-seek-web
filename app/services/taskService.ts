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
    requiresApproval?: boolean;
    approved?: boolean;
    status: StepStatus;
    resultText?: string;
    errorMessage?: string;
}

export interface TaskEvent {
    id: string;
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

export function createTask(payload: { title: string; goal: string; constraints?: string; modelCode?: string }) {
    return httpClient.post<Result<AgentTask>>("/api/tasks", payload);
}

export function listTasks(page = 0, size = 20) {
    return httpClient.getRet<TaskPage>("/api/tasks", {page, size});
}

export function getTask(taskId: string) {
    return httpClient.getRet<AgentTask>(`/api/tasks/${encodeURIComponent(taskId)}`);
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
