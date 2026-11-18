/** 解析模型输出中的 <think> 推理段与正文，兼容流式未闭合的情况 */
export interface ParsedContent {
    reasoning: string;
    content: string;
}

export function parseReasoning(raw: string): ParsedContent {
    if (!raw) return {reasoning: "", content: ""};

    const open = raw.indexOf("<think>");
    if (open < 0) {
        // 有些模型用 <thinking> 或 <reasoning>
        const altOpen = raw.indexOf("<thinking>");
        if (altOpen < 0) return {reasoning: "", content: raw};
        return splitByTag(raw, "<thinking>", "</thinking>");
    }
    return splitByTag(raw, "<think>", "</think>");
}

function splitByTag(raw: string, openTag: string, closeTag: string): ParsedContent {
    const openIdx = raw.indexOf(openTag);
    const before = raw.slice(0, openIdx).trim();
    const afterOpen = raw.slice(openIdx + openTag.length);
    const closeIdx = afterOpen.indexOf(closeTag);

    if (closeIdx < 0) {
        // 推理尚未结束（流式进行中）：全部作为推理，正文为空
        return {reasoning: afterOpen.trim(), content: before};
    }
    const reasoning = afterOpen.slice(0, closeIdx).trim();
    const content = (before + "\n" + afterOpen.slice(closeIdx + closeTag.length)).trim();
    return {reasoning, content};
}

/** 判断推理是否仍在进行（出现了开始的 think 标签但还没闭合） */
export function isReasoningStreaming(raw: string): boolean {
    if (!raw) return false;
    const hasOpen = raw.includes("<think>") || raw.includes("<thinking>");
    const hasClose = raw.includes("</think>") || raw.includes("</thinking>");
    return hasOpen && !hasClose;
}
