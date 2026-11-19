import {describe, expect, it} from "vitest";
import {isReasoningStreaming, parseReasoning} from "~/components/Chat/reasoning";

describe("parseReasoning", () => {
    it("拆出已闭合的 think 段", () => {
        const parsed = parseReasoning("前置<think>推理中</think>最终答案");
        expect(parsed.reasoning).toBe("推理中");
        expect(parsed.content).toBe("前置\n最终答案");
    });

    it("流式未闭合时正文仍可显示", () => {
        const parsed = parseReasoning("前缀<think>还在思考");
        expect(parsed.reasoning).toBe("还在思考");
        expect(parsed.content).toBe("前缀");
        expect(isReasoningStreaming("前缀<think>还在思考")).toBe(true);
    });

    it("没有推理标签时原样返回正文", () => {
        const parsed = parseReasoning("普通回答");
        expect(parsed.reasoning).toBe("");
        expect(parsed.content).toBe("普通回答");
    });

    it("兼容 thinking 标签", () => {
        const parsed = parseReasoning("<thinking>检查</thinking>结果");
        expect(parsed.reasoning).toBe("检查");
        expect(parsed.content).toBe("结果");
    });
});
