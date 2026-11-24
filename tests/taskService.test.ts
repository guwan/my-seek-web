import {beforeEach, describe, expect, it, vi} from "vitest";

const {postMock, getRetMock} = vi.hoisted(() => ({
    postMock: vi.fn(),
    getRetMock: vi.fn(),
}));

vi.mock("~/lib/request", () => ({httpClient: {post: postMock, getRet: getRetMock}}));

import {
    approveTask,
    confirmTask,
    createTask,
    listTasks,
    retryTaskStep,
} from "~/services/taskService";

describe("taskService", () => {
    beforeEach(() => {
        postMock.mockReset();
        getRetMock.mockReset();
    });

    it("creates a task with the entered goal", async () => {
        postMock.mockResolvedValue({success: true, data: {id: "t1"}});
        const result = await createTask({title: "整理设定", goal: "输出世界观文档"});
        expect(postMock).toHaveBeenCalledWith("/api/tasks", {
            title: "整理设定",
            goal: "输出世界观文档",
            constraints: undefined,
            modelCode: undefined,
        });
        expect(result.data?.id).toBe("t1");
    });

    it("lists tasks with pagination", async () => {
        getRetMock.mockResolvedValue({success: true, data: {content: []}});
        const result = await listTasks(1, 10);
        expect(getRetMock).toHaveBeenCalledWith("/api/tasks", {page: 1, size: 10});
        expect(result.success).toBe(true);
    });

    it("calls confirm and step retry endpoints", async () => {
        postMock.mockResolvedValue({success: true});
        await confirmTask("a/b");
        await retryTaskStep("a/b", "s/1");
        await approveTask("a/b", true, "允许");
        expect(postMock).toHaveBeenCalledWith("/api/tasks/a%2Fb/confirm", {});
        expect(postMock).toHaveBeenCalledWith("/api/tasks/a%2Fb/steps/s%2F1/retry", {});
        expect(postMock).toHaveBeenCalledWith("/api/tasks/a%2Fb/approve", {approved: true, reason: "允许"});
    });
});
