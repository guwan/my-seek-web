import {useRef, useState} from "react";
import {useSelector} from "react-redux";
import {Loader2, Sparkles, X} from "lucide-react";
import {useAppDispatch} from "~/store";
import type {RootState} from "~/store";
import {addNovel, updateChapter} from "~/store/writingSlice";
import {createNovel, newId} from "~/services/writingStorage";
import {streamAiWrite} from "~/services/writingAiService";
import {message} from "~/components/Message";

interface Props {
    open: boolean;
    onClose: () => void;
}

export default function NewWritingDialog({open, onClose}: Props) {
    const dispatch = useAppDispatch();
    const selectedModel = useSelector((state: RootState) => state.models.selectedModel);
    const [title, setTitle] = useState("");
    const [genre, setGenre] = useState("");
    const [idea, setIdea] = useState("");
    const [style, setStyle] = useState("");
    const [generateOpening, setGenerateOpening] = useState(true);
    const [preview, setPreview] = useState("");
    const [generating, setGenerating] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    if (!open) return null;

    const reset = () => {
        setTitle("");
        setGenre("");
        setIdea("");
        setStyle("");
        setGenerateOpening(true);
        setPreview("");
    };

    const close = () => {
        abortRef.current?.abort();
        abortRef.current = null;
        setGenerating(false);
        onClose();
    };

    const create = async () => {
        const styleText = style.trim();
        if (generateOpening && !styleText) {
            message.error("请填写风格描述，或关闭仿写生成");
            return;
        }

        const novel = createNovel(title.trim() || "未命名作品", styleText);
        novel.genre = genre.trim();
        novel.description = idea.trim();
        if (idea.trim()) {
            novel.outline.push({id: newId(), title: "开篇方向", content: idea.trim(), done: false});
        }
        const chapterId = novel.volumes[0].chapters[0].id;

        dispatch(addNovel(novel));

        if (!generateOpening) {
            message.success("已新建作品，开始写作吧");
            reset();
            onClose();
            return;
        }

        setGenerating(true);
        setPreview("");
        const controller = new AbortController();
        abortRef.current = controller;
        try {
            const content = await streamAiWrite(
                novel,
                chapterId,
                "",
                "imitate",
                selectedModel || "",
                "请写出第一章开篇正文，围绕简介与开篇方向展开。",
                {onChunk: setPreview, signal: controller.signal},
            );
            if (content.trim()) {
                dispatch(updateChapter({novelId: novel.id, chapterId, patch: {content: content.trim()}}));
            }
            message.success("已按风格生成开篇");
            reset();
            onClose();
        } catch (error: any) {
            if (error?.name !== "AbortError") {
                message.error("仿写失败：" + (error?.message || "未知错误"));
            }
        } finally {
            setGenerating(false);
            abortRef.current = null;
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={close}
        >
            <div
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border bg-card p-6 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                            <Sparkles className="size-5 text-primary"/> 新建写作
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            可选择填写风格描述，创建时直接仿写生成第一章开篇。仿写不依赖范文。
                        </p>
                    </div>
                    <button onClick={close} className="rounded-md p-1 text-muted-foreground hover:bg-accent">
                        <X className="size-4"/>
                    </button>
                </div>

                <div className="mt-5 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="作品标题">
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="未命名作品"
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                            />
                        </Field>
                        <Field label="题材">
                            <input
                                value={genre}
                                onChange={e => setGenre(e.target.value)}
                                placeholder="科幻 / 悬疑 / 都市……"
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                            />
                        </Field>
                    </div>

                    <Field label="简介 / 开篇方向">
                        <textarea
                            value={idea}
                            onChange={e => setIdea(e.target.value)}
                            placeholder="一句话介绍故事，或说明第一章要写什么……"
                            rows={3}
                            className="w-full resize-none rounded-lg border bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                        />
                    </Field>

                    <Field label="风格描述（仿写依据）">
                        <textarea
                            value={style}
                            onChange={e => setStyle(e.target.value)}
                            placeholder="例如：冷峻克制的第三人称限知视角；短句为主；环境细节密集；情绪压在动作里，不直接抒情……"
                            rows={5}
                            className="w-full resize-none rounded-lg border bg-background p-2.5 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring/40"
                        />
                    </Field>

                    <label className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                        <input
                            type="checkbox"
                            checked={generateOpening}
                            onChange={e => setGenerateOpening(e.target.checked)}
                            className="mt-0.5"
                        />
                        <span>
                            <span className="font-medium">创建后按风格生成开篇</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                                使用当前选中的模型生成第一章正文；可随时停止，已生成内容不会自动写入章节。
                            </span>
                        </span>
                    </label>

                    {preview && (
                        <div>
                            <p className="mb-1 text-xs text-muted-foreground">生成预览</p>
                            <div className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed">
                                {preview}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 border-t pt-4">
                        <button
                            onClick={close}
                            className="rounded-lg border px-4 py-2 text-sm hover:bg-accent"
                        >
                            取消
                        </button>
                        <button
                            onClick={() => void create()}
                            disabled={generating}
                            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {generating ? <Loader2 className="size-4 animate-spin"/> : <Sparkles className="size-4"/>}
                            {generating ? "仿写中…" : generateOpening ? "创建并仿写" : "创建作品"}
                        </button>
                        {generating && (
                            <button
                                onClick={() => abortRef.current?.abort()}
                                className="rounded-lg border px-4 py-2 text-sm hover:bg-accent"
                            >
                                停止生成
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
    return (
        <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            {children}
        </label>
    );
}
