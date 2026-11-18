import {useState} from "react";
import ReactMarkdown from "react-markdown";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {vscDarkPlus} from "react-syntax-highlighter/dist/cjs/styles/prism";
import {
    Brain, Check, ChevronDown, ChevronRight, Copy, ExternalLink, Globe, RefreshCw,
} from "lucide-react";
import type {ChatMessage} from "~/services/data";
import {message as toast} from "~/components/Message";

interface Props {
    msg: ChatMessage;
    showReasoning: boolean;
    reasoningExpanded: Record<number, boolean>;
    onToggleReasoning: (id: number) => void;
    onRegenerate?: () => void;
    isLast?: boolean;
}

/** 单条消息视图：DeepSeek 风格，推理可折叠、来源可展开、代码块可复制 */
export default function ChatMessageView({
    msg, showReasoning, reasoningExpanded, onToggleReasoning, onRegenerate, isLast,
}: Props) {
    const [copied, setCopied] = useState(false);
    const [sourcesOpen, setSourcesOpen] = useState(false);

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

                        {/* 正文 */}
                        {msg.content && !msg.isThinking && (
                            <div className="prose prose-sm dark:prose-invert max-w-none text-[15px] leading-7">
                                <MarkdownBody content={msg.content}/>
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

/** Markdown 正文渲染（代码块带复制按钮） */
function MarkdownBody({content}: {content: string}) {
    const [copiedCode, setCopiedCode] = useState(false);
    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 1500);
        }).catch(() => {});
    };
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4" {...props}/>,
                h2: ({node, ...props}) => <h2 className="text-xl font-semibold my-3" {...props}/>,
                h3: ({node, ...props}) => <h3 className="text-lg font-semibold my-3" {...props}/>,
                p: ({node, ...props}) => <p className="my-2 leading-7" {...props}/>,
                ul: ({node, ...props}) => <ul className="list-disc pl-6 my-2" {...props}/>,
                ol: ({node, ...props}) => <ol className="list-decimal pl-6 my-2" {...props}/>,
                li: ({node, ...props}) => <li className="my-0.5" {...props}/>,
                a: ({node, ...props}) => <a className="text-violet-600 hover:underline dark:text-violet-400" target="_blank" rel="noreferrer" {...props}/>,
                blockquote: ({node, ...props}) => (
                    <blockquote className="border-l-4 border-gray-300 pl-4 my-3 text-gray-600" {...props}/>
                ),
                table: ({node, ...props}) => (
                    <div className="my-3 overflow-x-auto"><table className="border-collapse text-sm" {...props}/></div>
                ),
                th: ({node, ...props}) => <th className="border px-3 py-1.5 bg-muted" {...props}/>,
                td: ({node, ...props}) => <td className="border px-3 py-1.5" {...props}/>,
                code({node, inline, className, children, ...props}: {
                    node?: any;
                    inline?: boolean;
                    className?: string;
                    children?: React.ReactNode;
                }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const code = String(children).replace(/\n$/, "");
                    if (!inline && match) {
                        return (
                            <div className="group/code relative my-3">
                                <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/code:opacity-100">
                                    <button onClick={() => copyCode(code)} className="flex items-center gap-1 hover:text-green-300">
                                        {copiedCode ? <Check className="size-3"/> : <Copy className="size-3"/>}
                                        {copiedCode ? "已复制" : "复制"}
                                    </button>
                                </div>
                                <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    className="rounded-xl p-4 text-sm !mt-0"
                                    customStyle={{background: "#1e1e1e", fontSize: "0.875rem", lineHeight: "1.6"}}
                                    {...props}
                                >
                                    {code}
                                </SyntaxHighlighter>
                            </div>
                        );
                    }
                    return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm break-words" {...props}>{children}</code>;
                },
            }}
        >
            {content}
        </ReactMarkdown>
    );
}
