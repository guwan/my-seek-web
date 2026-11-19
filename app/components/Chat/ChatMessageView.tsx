import {lazy, memo, Suspense, useState} from "react";
import {
    Brain, Check, ChevronDown, ChevronRight, Copy, ExternalLink, Globe, RefreshCw,
} from "lucide-react";
import type {ChatMessage} from "~/services/data";
import {message as toast} from "~/components/Message";

const MarkdownBody = lazy(() => import("./MarkdownBody"));
const LONG_CONTENT_THRESHOLD = 4000;

interface Props {
    msg: ChatMessage;
    showReasoning: boolean;
    reasoningExpanded: Record<number, boolean>;
    onToggleReasoning: (id: number) => void;
    onRegenerate?: () => void;
    isLast?: boolean;
}

/** 单条消息视图：DeepSeek 风格，推理可折叠、来源可展开、代码块可复制 */
function ChatMessageView({
    msg, showReasoning, reasoningExpanded, onToggleReasoning, onRegenerate, isLast,
}: Props) {
    const [copied, setCopied] = useState(false);
    const [sourcesOpen, setSourcesOpen] = useState(false);
    const [contentExpanded, setContentExpanded] = useState(false);

    const isUser = msg.type === "user";
    const hasReasoning = !!msg.reasoning && showReasoning;
    const expanded = reasoningExpanded[msg.id] ?? false;
    const hasSources = !!msg.sources && msg.sources.length > 0;

    const copyText = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error("复制失败");
        }
    };

    return (
        <div className={`group flex w-full gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
            {!isUser && (
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 text-white shadow-sm shadow-purple-500/25">
                    <span className="text-sm font-bold">M</span>
                </div>
            )}
            <div className={`min-w-0 max-w-[85%] ${isUser ? "flex flex-col items-end" : "flex-1"}`}>
                {isUser ? (
                    <div className="whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-gradient-to-br from-violet-500 to-indigo-500 px-4 py-2.5 text-sm leading-relaxed text-white shadow-md shadow-violet-500/20">
                        {msg.content}
                    </div>
                ) : (
                    <>
                        {/* 推理过程：可折叠，像 DeepSeek 一样默认收起 */}
                        {hasReasoning && (
                            <div className="mb-3 overflow-hidden rounded-xl bg-muted/60">
                                <button
                                    onClick={() => onToggleReasoning(msg.id)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <Brain className="size-3.5"/>
                                    <span>
                                        {msg.reasoningStreaming
                                            ? "正在深度思考…"
                                            : `已深度思考${msg.reasoningMs ? `（用时 ${(msg.reasoningMs / 1000).toFixed(1)} 秒）` : ""}`}
                                    </span>
                                    {msg.reasoningStreaming
                                        ? <span className="ml-1 size-1.5 animate-pulse rounded-full bg-primary"/>
                                        : expanded
                                            ? <ChevronDown className="ml-auto size-3.5"/>
                                            : <ChevronRight className="ml-auto size-3.5"/>}
                                </button>
                                {(expanded || msg.reasoningStreaming) && (
                                    <div className="whitespace-pre-wrap border-t px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                                        {msg.reasoning}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 正在等待首个 token */}
                        {msg.isThinking && !hasReasoning && (
                            <div className="flex items-center gap-1.5 py-2 text-sm text-muted-foreground">
                                <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"/>
                                <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"/>
                                <span className="size-2 animate-bounce rounded-full bg-primary"/>
                            </div>
                        )}

                        {/* 正文：超长内容先折叠为纯文本，避免首屏解析大段 Markdown */}
                        {msg.content && !msg.isThinking && (
                            <div className="prose prose-sm dark:prose-invert max-w-none text-[15px] leading-7">
                                {msg.content.length > LONG_CONTENT_THRESHOLD && !contentExpanded ? (
                                    <div className="not-prose">
                                        <div className="whitespace-pre-wrap break-words">{msg.content.slice(0, LONG_CONTENT_THRESHOLD)}…</div>
                                        <button
                                            onClick={() => setContentExpanded(true)}
                                            className="mt-3 rounded-lg border px-3 py-1.5 text-xs text-primary hover:bg-accent"
                                        >
                                            展开全文（共 {msg.content.length.toLocaleString()} 字）
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <Suspense fallback={<div className="text-sm text-muted-foreground">正在加载富文本渲染…</div>}>
                                            <MarkdownBody content={msg.content}/>
                                        </Suspense>
                                        {msg.content.length > LONG_CONTENT_THRESHOLD && (
                                            <button
                                                onClick={() => setContentExpanded(false)}
                                                className="not-prose mt-3 rounded-lg border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent"
                                            >
                                                收起长文
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {msg.error && <p className="text-sm text-destructive">{msg.content}</p>}

                        {/* 联网状态：开启搜索后始终显示；有来源时可展开，无来源时给出明确提示 */}
                        {msg.searchPerformed && !msg.reasoningStreaming && (
                            <div className="mt-3">
                                <button
                                    onClick={() => hasSources && setSourcesOpen(v => !v)}
                                    className="flex items-center gap-1.5 rounded-lg border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent"
                                >
                                    <Globe className="size-3.5 text-violet-500"/>
                                    {hasSources
                                        ? `找到 ${msg.sources!.length} 个网页${msg.searchEngine ? ` · ${msg.searchEngine}` : ""}`
                                        : `已联网搜索${msg.searchEngine && msg.searchEngine !== "无可用结果" ? ` · ${msg.searchEngine}` : ""}，未找到相关网页`}
                                    {hasSources && (sourcesOpen
                                        ? <ChevronDown className="size-3"/>
                                        : <ChevronRight className="size-3"/>)}
                                </button>
                                {sourcesOpen && (
                                    <div className="mt-2 space-y-1.5">
                                        {msg.sources!.map((s, i) => (
                                            <a
                                                key={i}
                                                href={s.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-start gap-2 rounded-lg border px-3 py-2 text-xs hover:bg-accent"
                                            >
                                                <span className="flex size-4 shrink-0 items-center justify-center rounded bg-muted text-[10px]">{i + 1}</span>
                                                <span className="min-w-0 flex-1 truncate text-foreground">{s.title}</span>
                                                <ExternalLink className="size-3 shrink-0 text-muted-foreground"/>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 操作栏 */}
                        {!msg.isThinking && !msg.reasoningStreaming && msg.content && (
                            <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                    onClick={() => copyText(msg.content)}
                                    title="复制"
                                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                                >
                                    {copied ? <Check className="size-3.5 text-green-500"/> : <Copy className="size-3.5"/>}
                                    {copied ? "已复制" : "复制"}
                                </button>
                                {isLast && onRegenerate && (
                                    <button
                                        onClick={onRegenerate}
                                        title="重新生成"
                                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                                    >
                                        <RefreshCw className="size-3.5"/> 重新生成
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default memo(ChatMessageView);
