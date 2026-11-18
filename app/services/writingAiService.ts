import {httpClient} from "~/lib/request";
import type {Novel} from "~/services/writing";

export type AiWriteAction = "continue" | "polish" | "expand" | "custom";

export const AI_WRITE_ACTIONS: {key: AiWriteAction; label: string; hint: string}[] = [
    {key: "continue", label: "续写", hint: "根据前文与设定，接着往下写"},
    {key: "polish", label: "润色", hint: "改进文笔，保持原意"},
    {key: "expand", label: "扩写", hint: "丰富细节与描写"},
    {key: "custom", label: "自定义", hint: "给 AI 一条明确的写作指令"},
];

function buildContext(novel: Novel, chapterId: string, selection: string): string {
    const chapter = novel.volumes.flatMap(v => v.chapters).find(c => c.id === chapterId);
    const lines: string[] = [];
    lines.push(`作品名称：《${novel.title}》`);
    if (novel.genre) lines.push(`题材：${novel.genre}`);
    if (novel.description) lines.push(`简介：${novel.description}`);
    if (chapter) {
        lines.push(`\n【当前章节】${chapter.title}`);
        if (chapter.outline) lines.push(`章节大纲：${chapter.outline}`);
    }
    if (novel.outline.length) {
        lines.push("\n【全书大纲】");
        novel.outline.forEach(o => lines.push(`- ${o.title}${o.content ? `：${o.content}` : ""}`));
    }
    if (novel.characters.length) {
        lines.push("\n【人物设定】");
        novel.characters.forEach(c =>
            lines.push(`- ${c.name}${c.role ? `（${c.role}）` : ""}：${c.description}`),
        );
    }
    if (novel.world.length) {
        lines.push("\n【世界观设定】");
        novel.world.forEach(w => lines.push(`- ${w.title}：${w.content}`));
    }
    const prior = chapter ? chapter.content.slice(-1200) : "";
    if (prior) lines.push(`\n【当前正文结尾（供衔接）】\n${prior}`);
    if (selection) lines.push(`\n【选中的文字】\n${selection}`);
    return lines.join("\n");
}

function buildPrompt(action: AiWriteAction, custom: string, context: string): string {
    const rules =
        "严格要求：只输出小说正文内容，不要输出任何解释、说明、标题、引号或 Markdown 代码块标记；" +
        "使用中文；保持与原文一致的人称、时态和叙事风格；严格遵守上述设定，不得违背人物性格。";
    switch (action) {
        case "continue":
            return `你是小说写作助手。请基于以下上下文，从正文结尾自然往下续写 300～500 字。\n\n${context}\n\n${rules}`;
        case "polish":
            return `你是小说写作助手。请润色下面这段选中的文字（若无选中文字则润色正文结尾），使其更生动流畅，保持原意与字数相近。\n\n${context}\n\n${rules}`;
        case "expand":
            return `你是小说写作助手。请扩写下面这段选中的文字（若无选中文字则扩写正文结尾），补充动作、心理与环境细节，使其更丰满。\n\n${context}\n\n${rules}`;
        case "custom":
            return `你是小说写作助手。请按用户的写作指令创作。\n\n写作指令：${custom}\n\n${context}\n\n${rules}`;
    }
}

export interface StreamWriteCallbacks {
    onChunk: (text: string) => void;
    signal?: AbortSignal;
}

/** 调用后端的流式对话接口生成内容，逐块回调 */
export async function streamAiWrite(
    novel: Novel,
    chapterId: string,
    selection: string,
    action: AiWriteAction,
    model: string,
    custom: string,
    {onChunk, signal}: StreamWriteCallbacks,
): Promise<string> {
    const prompt = buildPrompt(action, custom, buildContext(novel, chapterId, selection));
    const response = await httpClient.postRet(
        "/api/ai/chat/stream",
        {
            conversationId: `writing-${novel.id}-${chapterId}`,
            message: prompt,
            model,
        },
        {signal},
    );
    if (!response.ok) throw new Error(`请求失败 (${response.status})`);
    const reader = response.body?.getReader();
    if (!reader) throw new Error("服务端未返回流式响应");

    const decoder = new TextDecoder();
    let full = "";
    while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        full += decoder.decode(value, {stream: true});
        onChunk(full);
    }
    return full;
}
