import {describe, expect, it} from "vitest";
import {ChatStreamParser, decodeSourcesFrame, readChatStream} from "~/components/Chat/streamUtils";

function streamResponse(chunks: string[], closeAtEnd: boolean): Response {
    const encoder = new TextEncoder();
    let index = 0;
    return new Response(new ReadableStream<Uint8Array>({
        pull(controller) {
            if (index < chunks.length) {
                controller.enqueue(encoder.encode(chunks[index++]));
            } else if (closeAtEnd) {
                controller.close();
            }
        },
    }));
}

/** 模拟推理模型先静默一段时间再吐出首包 */
function delayedStreamResponse(chunk: string, delayMs: number): Response {
    const encoder = new TextEncoder();
    let sent = false;
    return new Response(new ReadableStream<Uint8Array>({
        async pull(controller) {
            if (sent) return;
            sent = true;
            await new Promise(resolve => setTimeout(resolve, delayMs));
            controller.enqueue(encoder.encode(chunk));
            controller.close();
        },
    }));
}

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

describe("readChatStream", () => {
    it("收到 done 帧后立即结束，不等待上游关闭连接", async () => {
        const response = streamResponse([
            'MYSEEK_FRAME:{"type":"content","text":"回答完成"}\n',
            'MYSEEK_FRAME:{"type":"done"}\n',
        ], false);

        const snapshot = await readChatStream(response, undefined, {idleTimeoutMs: 5000});

        expect(snapshot.content).toBe("回答完成");
        expect(snapshot.done).toBe(true);
    }, 3000);

    it("上游既无 done 也不关闭连接时按空闲超时收尾", async () => {
        const response = streamResponse([
            'MYSEEK_FRAME:{"type":"content","text":"模型已输出完毕"}\n',
        ], false);

        const snapshot = await readChatStream(response, undefined, {idleTimeoutMs: 50});

        expect(snapshot.content).toBe("模型已输出完毕");
        expect(snapshot.done).toBe(true);
    }, 3000);

    it("首包前使用较长超时，慢思考模型不被空闲超时截断", async () => {
        const response = delayedStreamResponse(
            'MYSEEK_FRAME:{"type":"content","text":"慢思考后的回答"}\nMYSEEK_FRAME:{"type":"done"}\n',
            40,
        );

        const snapshot = await readChatStream(response, undefined, {
            firstTokenTimeoutMs: 2000,
            idleTimeoutMs: 10,
        });

        expect(snapshot.content).toBe("慢思考后的回答");
        expect(snapshot.done).toBe(true);
    }, 3000);

    it("正常结束的流仍然完整返回", async () => {
        const response = streamResponse([
            'MYSEEK_FRAME:{"type":"content","text":"你好"}\n',
            'MYSEEK_FRAME:{"type":"done"}\n',
        ], true);

        const snapshot = await readChatStream(response);
        expect(snapshot.content).toBe("你好");
        expect(snapshot.done).toBe(true);
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
