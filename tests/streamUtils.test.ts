import {describe, expect, it} from "vitest";
import {ChatStreamParser, decodeSourcesFrame} from "~/components/Chat/streamUtils";

describe("ChatStreamParser", () => {
    it("解析结构化帧并拼接正文", () => {
        const parser = new ChatStreamParser();
        const snapshot = parser.push(
            'MYSEEK_FRAME:{"type":"meta","performed":true,"engine":"Tavily","sources":[{"title":"a","url":"https://a"}]}\n' +
            'MYSEEK_FRAME:{"type":"content","text":"你好"}\n' +
            'MYSEEK_FRAME:{"type":"content","text":"，世界"}\n',
        );

        expect(snapshot.content).toBe("你好，世界");
        expect(snapshot.meta?.performed).toBe(true);
        expect(snapshot.meta?.engine).toBe("Tavily");
        expect(snapshot.meta?.sources).toHaveLength(1);
        expect(snapshot.done).toBe(false);
    });

    it("处理跨 chunk 的半帧", () => {
        const parser = new ChatStreamParser();
        expect(parser.push('MYSEEK_FRAME:{"type":"content","text":"拆').content).toBe("");
        const snapshot = parser.push('分"}\nMYSEEK_FRAME:{"type":"done"}\n');
        expect(snapshot.content).toBe("拆分");
        expect(snapshot.done).toBe(true);
    });

    it("解析 error 帧", () => {
        const parser = new ChatStreamParser();
        const snapshot = parser.push('MYSEEK_FRAME:{"type":"error","message":"模型不可用"}\n');
        expect(snapshot.error).toBe("模型不可用");
    });

    it("兼容旧版裸文本", () => {
        const parser = new ChatStreamParser();
        expect(parser.push("旧版流式文本").content).toBe("旧版流式文本");
    });

    it("兼容旧版来源帧", () => {
        const parser = new ChatStreamParser();
        const snapshot = parser.push(
            '\u0000MYSEEK_SOURCES:{"performed":true,"engine":"Wikipedia","sources":[]}\u0000\n正文',
        );
        expect(snapshot.meta?.engine).toBe("Wikipedia");
        expect(snapshot.content).toBe("正文");
    });
});

describe("decodeSourcesFrame", () => {
    it("兼容纯数组来源格式", () => {
        const decoded = decodeSourcesFrame(
            '\u0000MYSEEK_SOURCES:[{"title":"t","url":"u"}]\u0000\nrest',
        );
        expect(decoded.meta?.performed).toBe(true);
        expect(decoded.meta?.sources[0]?.title).toBe("t");
        expect(decoded.text).toBe("rest");
    });

    it("半帧时等待后续数据", () => {
        const decoded = decodeSourcesFrame('\u0000MYSEEK_SOURCES:{"performed":true');
        expect(decoded.meta).toBeUndefined();
        expect(decoded.text).toBe("");
    });
});
