import {useRef, useState} from 'react';
import {useSelector} from "react-redux";
import {Loader2, Sparkles, WandSparkles} from "lucide-react";
import type {RootState} from "~/store";
import type {Novel} from "~/services/writing";
import {
    AI_WRITE_ACTIONS,
    streamAiWrite,
    type AiWriteAction,
} from "~/services/writingAiService";
import {message} from "~/components/Message";

interface Props {
    novel: Novel;
    chapterId: string;
    selection: {start: number; end: number; text: string};
    onApply: (text: string, mode: "append" | "replace") => void;
}

export default function AiAssistantPanel({novel, chapterId, selection, onApply}: Props) {
    const [action, setAction] = useState<AiWriteAction>("continue");
    const [custom, setCustom] = useState("");
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);
    const selectedModel = useSelector((state: RootState) => state.models.selectedModel);
    const abortRef = useRef<AbortController | null>(null);

    const generate = async () => {
        if (loading) return;
        if (action === "custom" && !custom.trim()) {
            message.error("请先填写写作指令");
            return;
        }
        if (action === "imitate" && !custom.trim() && !novel.style?.trim()) {
            message.error("请先填写风格描述，或在设定页补充作品风格");
            return;
        }
        setLoading(true);
        setResult("");
        const controller = new AbortController();
        abortRef.current = controller;
        try {
            await streamAiWrite(
                novel,
                chapterId,
                selection.text,
                action,
                selectedModel || "",
                custom,
                {onChunk: text => setResult(text), signal: controller.signal},
            );
        } catch (e: any) {
            if (e?.name !== "AbortError") message.error("生成失败：" + (e?.message || "未知错误"));
        } finally {
            setLoading(false);
            abortRef.current = null;
        }
    };

    const stop = () => abortRef.current?.abort();

    return (
        <div className="flex h-full min-h-0 flex-col gap-3">
            <div className="flex items-center gap-2">
                <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                    <WandSparkles className="size-4"/>
                </div>
                <div className="leading-tight">
                    <p className="text-sm font-medium">AI 写作助手</p>
                    <p className="text-xs text-muted-foreground">基于全书设定创作</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {AI_WRITE_ACTIONS.map(item => (
                    <button
                        key={item.key}
                        title={item.hint}
                        onClick={() => setAction(item.key)}
                        className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                            action === item.key
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "hover:bg-accent"
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {(action === "custom" || action === "imitate") && (
                <textarea
                    value={custom}
                    onChange={e => setCustom(e.target.value)}
                    placeholder={action === "imitate"
                        ? "补充风格指令，如：短句为主、冷峻克制、第三人称限知视角……"
                        : "例如：描写主角第一次进入残骸时的紧张心情……"}
                    className="w-full resize-none rounded-lg border bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                    rows={3}
                />
            )}

            <div className="flex gap-2">
                <button
                    onClick={generate}
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                    {loading ? <Loader2 className="size-4 animate-spin"/> : <Sparkles className="size-4"/>}
                    {loading ? "生成中…" : "生成内容"}
                </button>
                {loading && (
                    <button onClick={stop} className="rounded-lg border px-3 text-sm hover:bg-accent">
                        停止
                    </button>
                )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">生成结果</span>
                    {result && !loading && (
                        <div className="flex gap-1">
                            <button
                                onClick={() => onApply(result, "append")}
                                className="rounded border px-2 py-0.5 text-xs hover:bg-accent"
                            >
                                插入文末
                            </button>
                            {selection.text && (
                                <button
                                    onClick={() => onApply(result, "replace")}
                                    className="rounded border px-2 py-0.5 text-xs hover:bg-accent"
                                >
                                    替换选中
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <div className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed">
                    {result ? (
                        result
                    ) : (
                        <span className="text-muted-foreground">
                            选择续写 / 润色 / 扩写，或输入自定义指令。若编辑器中有选中文字，将作为操作对象。
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
