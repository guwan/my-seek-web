import type {SearchSource} from "~/services/data";

const PREFIX = "\u0000MYSEEK_SOURCES:";
const SUFFIX = "\u0000\n";

export interface SearchMeta {
    performed: boolean;
    engine: string;
    sources: SearchSource[];
}

export interface DecodedChunk {
    text: string;
    meta?: SearchMeta;
}

/**
 * 从流式首帧中解析联网元数据帧。
 * 后端协议：\u0000MYSEEK_SOURCES:{"performed":true,"engine":"...","sources":[...]}\u0000\n
 * 兼容旧版纯数组格式。
 */
export function decodeSourcesFrame(raw: string): DecodedChunk {
    if (!raw.startsWith(PREFIX)) {
        return {text: raw};
    }
    const endIdx = raw.indexOf(SUFFIX);
    if (endIdx < 0) {
        // 首帧尚未接收完整，暂时不输出
        return {text: ""};
    }
    const json = raw.slice(PREFIX.length, endIdx);
    let meta: SearchMeta = {performed: false, engine: "", sources: []};
    try {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed)) {
            meta = {performed: parsed.length > 0, engine: "", sources: parsed};
        } else {
            meta = {
                performed: !!parsed.performed,
                engine: typeof parsed.engine === "string" ? parsed.engine : "",
                sources: Array.isArray(parsed.sources) ? parsed.sources : [],
            };
        }
    } catch {
        // 解析失败则忽略来源
    }
    return {text: raw.slice(endIdx + SUFFIX.length), meta};
}
