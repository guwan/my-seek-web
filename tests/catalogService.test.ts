import {beforeEach, describe, expect, it, vi} from "vitest";

const {getRetMock, putMock, deleteMock} = vi.hoisted(() => ({
    getRetMock: vi.fn(),
    putMock: vi.fn(),
    deleteMock: vi.fn(),
}));

vi.mock("~/lib/request", () => ({
    httpClient: {getRet: getRetMock, put: putMock, delete: deleteMock},
}));

import {
    deleteAgent, deleteConnector, deleteSkill,
    listAgents, listConnectors, listSkills,
    saveAgent, saveConnector, saveSkill,
} from "~/services/catalogService";

describe("catalogService", () => {
    beforeEach(() => {
        getRetMock.mockReset();
        putMock.mockReset();
        deleteMock.mockReset();
    });

    it("lists agents, skills and connectors", async () => {
        getRetMock.mockResolvedValue({success: true, data: []});
        await listAgents();
        await listSkills();
        await listConnectors();
        expect(getRetMock).toHaveBeenCalledWith("/api/catalog/agents");
        expect(getRetMock).toHaveBeenCalledWith("/api/catalog/skills");
        expect(getRetMock).toHaveBeenCalledWith("/api/catalog/connectors");
    });

    it("saves catalog entries with PUT", async () => {
        putMock.mockResolvedValue({success: true, data: {id: "x"}});
        await saveAgent({code: "my_expert", name: "我的专家", systemPrompt: "人设"});
        await saveSkill({code: "my_skill", name: "我的技能", toolsJson: "[]"});
        await saveConnector({code: "mcp_demo", name: "MCP", type: "MCP"});
        expect(putMock).toHaveBeenCalledWith("/api/catalog/agents", expect.objectContaining({code: "my_expert"}));
        expect(putMock).toHaveBeenCalledWith("/api/catalog/skills", expect.objectContaining({code: "my_skill"}));
        expect(putMock).toHaveBeenCalledWith("/api/catalog/connectors", expect.objectContaining({type: "MCP"}));
    });

    it("deletes entries by encoded id", async () => {
        deleteMock.mockResolvedValue({success: true});
        await deleteAgent("a/1");
        await deleteSkill("s/1");
        await deleteConnector("c/1");
        expect(deleteMock).toHaveBeenCalledWith("/api/catalog/agents/a%2F1");
        expect(deleteMock).toHaveBeenCalledWith("/api/catalog/skills/s%2F1");
        expect(deleteMock).toHaveBeenCalledWith("/api/catalog/connectors/c%2F1");
    });
});
