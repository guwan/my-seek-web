import type {SearchSource} from "~/services/data";

const FRAME_PREFIX = "MYSEEK_FRAME:";
const LEGACY_SOURCES_PREFIX = "\u0000MYSEEK_SOURCES:";
const LEGACY_SOURCES_SUFFIX = "\u0000\n";

export interface SearchMeta {
    performed: boolean;
    engine: string;
    sources: SearchSource[];
}

export interface StreamSnapshot {
    content: string;
    meta?: SearchMeta;
    done: boolean;
    error?: string;
}

export interface DecodedChunk {
    text: string;
    meta?: SearchMeta;
}

function toMeta(value: any): SearchMeta {
    if (Array.isArray(value)) {
        return {performed: value.length > 0, engine: "", sources: value};
    }
    return {
        performed: !!value?.performed,
        engine: typeof value?.engine === "string" ? value.engine : "",
        sources: Array.isArray(value?.sources) ? value.sources : [],
    };
}

/** 兼容旧版 NUL 前缀来源帧：\u0000MYSEEK_SOURCES:{json}\u0000\n */
export function decodeSourcesFrame(raw: string): DecodedChunk {
    if (!raw.startsWith(LEGACY_SOURCES_PREFIX)) {
        return {text: raw};
    }
    const endIdx = raw.indexOf(LEGACY_SOURCES_SUFFIX);
    if (endIdx < 0) {
        return {text: ""};
    }
    const json = raw.slice(LEGACY_SOURCES_PREFIX.length, endIdx);
    let meta: SearchMeta = {performed: false, engine: "", sources: []};
    try {
        meta = toMeta(JSON.parse(json));
    } catch {
        // 解析失败则忽略来源
    }
    return {text: raw.slice(endIdx + LEGACY_SOURCES_SUFFIX.length), meta};
}

function isPartialPrefix(buffer: string): boolean {
    return FRAME_PREFIX.startsWith(buffer) || LEGACY_SOURCES_PREFIX.startsWith(buffer);
}

/**
 * 流式响应解析器。
 *
 * 新协议：每行一个 `MYSEEK_FRAME:{...json...}\n` 帧，type 为 meta/content/done/error。
 * 旧协议：裸文本增量或 NUL 前缀来源帧，仍可解析，便于灰度发布。
 */
export class ChatStreamParser {
    private buffer = "";
    private content = "";
    private meta: SearchMeta | undefined;
    private done = false;
    private error: string | undefined;

    push(chunk: string): StreamSnapshot {
        this.buffer += chunk;
        this.drainLegacySources();

        while (true) {
            const idx = this.buffer.indexOf("\n");
            if (idx < 0) break;
            const line = this.buffer.slice(0, idx).replace(/\r$/, "");
            this.buffer = this.buffer.slice(idx + 1);
            this.consumeLine(line);
        }

        // 旧后端返回不带换行的裸文本；只要不是新协议前缀的半成品，就立即作为正文输出。
        if (this.buffer && !isPartialPrefix(this.buffer) && !this.buffer.startsWith(FRAME_PREFIX)) {
            this.content += this.buffer;
            this.buffer = "";
        }
        return this.snapshot();
    }

    finish(): StreamSnapshot {
        if (this.buffer) {
            this.drainLegacySources();
            if (this.buffer) {
                this.consumeLine(this.buffer.replace(/\r$/, ""));
                this.buffer = "";
            }
        }
        return this.snapshot();
    }

    private snapshot(): StreamSnapshot {
        return {
            content: this.content,
            meta: this.meta,
            done: this.done,
            error: this.error,
        };
    }

    private drainLegacySources(): void {
        if (!this.buffer.startsWith(LEGACY_SOURCES_PREFIX)) return;
        const decoded = decodeSourcesFrame(this.buffer);
        if (decoded.meta === undefined) return;
        this.meta = decoded.meta;
        // 尾随文本留在缓冲区，交给后续换行解析或裸文本分支处理，避免重复追加。
        this.buffer = decoded.text;
    }

    private consumeLine(line: string): void {
        if (!line) return;
        if (line.startsWith(FRAME_PREFIX)) {
            this.consumeFrame(line.slice(FRAME_PREFIX.length));
            return;
        }
        // 旧协议裸文本
        this.content += line;
    }

    private consumeFrame(json: string): void {
        let data: any;
        try {
            data = JSON.parse(json);
        } catch {
            return;
        }
        switch (data?.type) {
            case "meta":
                this.meta = toMeta(data);
                break;
            case "content":
                if (typeof data.text === "string") this.content += data.text;
                break;
            case "error":
                this.error = typeof data.message === "string" && data.message
                    ? data.message
                    : "生成失败，请稍后重试";
                break;
            case "done":
                this.done = true;
                break;
        }
    }
}

/** 统一读取聊天流，避免各调用方重复处理 Response/reader/decoder。 */
export async function readChatStream(
    response: Response,
    onSnapshot?: (snapshot: StreamSnapshot) => void,
): Promise<StreamSnapshot> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("服务端未返回流式响应");

    const decoder = new TextDecoder();
    const parser = new ChatStreamParser();
    while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        const snapshot = parser.push(decoder.decode(value, {stream: true}));
        onSnapshot?.(snapshot);
        if (snapshot.error) throw new Error(snapshot.error);
    }
    const final = parser.finish();
    onSnapshot?.(final);
    if (final.error) throw new Error(final.error);
    return final;
}
