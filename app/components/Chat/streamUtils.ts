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

export interface ReadChatStreamOptions {
    /** 等待首个数据包的超时；推理模型可能长时间思考后才吐字，默认 10 分钟 */
    firstTokenTimeoutMs?: number;
    /** 已收到数据后的空闲超时，仅作最后兜底，默认 5 分钟 */
    idleTimeoutMs?: number;
}

/** 默认不在短时间内判定流结束，避免长思考/慢输出被误判为已完成 */
const DEFAULT_FIRST_TOKEN_TIMEOUT = 10 * 60 * 1000;
const DEFAULT_IDLE_TIMEOUT = 5 * 60 * 1000;

/**
 * 统一读取聊天流，避免各调用方重复处理 Response/reader/decoder。
 *
 * 收尾策略：
 * 1. 收到 done 帧立即结束，这是正常路径，不等上游关闭 HTTP 连接；
 * 2. 只有上游既不发 done、又不关连接时才走超时兜底，且只在收到首包后
 *    才使用较短的空闲超时；首包之前给推理模型足够长的等待时间；
 * 3. 用户主动中止由 AbortController 处理，不受这里影响。
 */
export async function readChatStream(
    response: Response,
    onSnapshot?: (snapshot: StreamSnapshot) => void,
    options?: ReadChatStreamOptions,
): Promise<StreamSnapshot> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("服务端未返回流式响应");

    const decoder = new TextDecoder();
    const parser = new ChatStreamParser();
    const firstTokenTimeoutMs = options?.firstTokenTimeoutMs ?? DEFAULT_FIRST_TOKEN_TIMEOUT;
    const idleTimeoutMs = options?.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT;
    let receivedData = false;
    let timedOut = false;

    const readNext = () => new Promise<{done: boolean; value?: Uint8Array}>((resolve, reject) => {
        const timeoutMs = receivedData ? idleTimeoutMs : firstTokenTimeoutMs;
        const timer = setTimeout(() => {
            timedOut = true;
            void reader.cancel().catch(() => undefined);
            resolve({done: true});
        }, timeoutMs);
        reader.read().then(result => {
            clearTimeout(timer);
            if (result.value && result.value.byteLength > 0) receivedData = true;
            resolve(result);
        }, error => {
            clearTimeout(timer);
            reject(error);
        });
    });

    while (true) {
        const {done, value} = await readNext();
        if (done) break;
        const snapshot = parser.push(decoder.decode(value!, {stream: true}));
        onSnapshot?.(snapshot);
        if (snapshot.error) throw new Error(snapshot.error);
        if (snapshot.done) break;
    }

    let final = parser.finish();
    if (timedOut && !final.done) {
        final = {...final, done: true};
    }
    onSnapshot?.(final);
    if (final.error) throw new Error(final.error);
    return final;
}
