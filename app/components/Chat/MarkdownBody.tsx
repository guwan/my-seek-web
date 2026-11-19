import {memo, useState} from "react";
import ReactMarkdown from "react-markdown";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {vscDarkPlus} from "react-syntax-highlighter/dist/cjs/styles/prism";
import {Check, Copy} from "lucide-react";
import {message as toast} from "~/components/Message";

function MarkdownBody({content}: {content: string}) {
    const [copiedCode, setCopiedCode] = useState(false);
    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 1500);
        }).catch(() => toast.error("复制失败"));
    };

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4" {...props}/>,
                h2: ({node, ...props}) => <h2 className="text-xl font-semibold my-3" {...props}/>,
                h3: ({node, ...props}) => <h3 className="text-lg font-medium my-3" {...props}/>,
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

export default memo(MarkdownBody);
