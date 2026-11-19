import {useEffect, useMemo, useRef, useState} from 'react';
import {useSelector} from "react-redux";
import {
    BookOpenText, Check, ChevronDown, ChevronRight, FileText, FolderPlus,
    Plus, Save, Trash2, Type,
} from "lucide-react";
import type {RootState} from "~/store";
import {useAppDispatch} from "~/store";
import {
    addChapter, addVolume, deleteChapter, deleteNovel, deleteVolume,
    renameNovel, renameVolume, selectChapter, selectNovel, updateChapter,
    updateNovelMeta,
} from "~/store/writingSlice";
import type {ChapterStatus, Novel} from "~/services/writing";
import {countNovelWords, countWords} from "~/services/writingStorage";
import {message} from "~/components/Message";
import {NEW_WRITING_EVENT} from "~/lib/constants";
import AiAssistantPanel from "./AiAssistantPanel";
import SettingsPanel from "./SettingsPanel";
import NewWritingDialog from "./NewWritingDialog";

const STATUS_OPTIONS: {value: ChapterStatus; label: string}[] = [
    {value: "draft", label: "草稿"},
    {value: "revising", label: "修改中"},
    {value: "final", label: "已定稿"},
];

export default function WritingWorkspace() {
    const dispatch = useAppDispatch();
    const {novels, activeNovelId, activeChapterId} = useSelector((state: RootState) => state.writing);

    const novel: Novel | undefined = novels.find(n => n.id === activeNovelId) ?? novels[0];
    const activeChapter = novel?.volumes.flatMap(v => v.chapters).find(c => c.id === activeChapterId);

    const [collapsedVolumes, setCollapsedVolumes] = useState<Record<string, boolean>>({});
    const [selection, setSelection] = useState<{start: number; end: number; text: string}>({start: 0, end: 0, text: ""});
    const [rightTab, setRightTab] = useState<"ai" | "settings">("ai");
    const [newWritingOpen, setNewWritingOpen] = useState(false);
    const editorRef = useRef<HTMLTextAreaElement>(null);

    // 响应侧边栏“新建写作”：先打开新建弹窗，可选择风格仿写。sessionStorage 用于兜底跨路由事件丢失。
    useEffect(() => {
        const open = () => {
            setNewWritingOpen(true);
            window.sessionStorage.removeItem(NEW_WRITING_EVENT);
        };
        window.addEventListener(NEW_WRITING_EVENT, open);
        if (window.sessionStorage.getItem(NEW_WRITING_EVENT) === "1") {
            open();
        }
        return () => window.removeEventListener(NEW_WRITING_EVENT, open);
    }, []);

    const totalWords = useMemo(() => (novel ? countNovelWords(novel) : 0), [novel]);

    if (!novel) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">还没有作品</p>
                <button onClick={() => setNewWritingOpen(true)} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
                    创建第一本书
                </button>
            </div>
        );
    }

    const handleSelectText = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        const el = e.currentTarget;
        setSelection({start: el.selectionStart, end: el.selectionEnd, text: el.value.slice(el.selectionStart, el.selectionEnd)});
    };

    const applyAiText = (text: string, mode: "append" | "replace") => {
        if (!activeChapter) return;
        const current = activeChapter.content;
        const cleaned = text.replace(/^```(?:markdown)?\s*\n?/i, "").replace(/\n?```\s*$/, "").trim();
        let next: string;
        if (mode === "replace" && selection.text) {
            next = current.slice(0, selection.start) + cleaned + current.slice(selection.end);
        } else {
            next = current ? `${current}\n\n${cleaned}` : cleaned;
        }
        dispatch(updateChapter({novelId: novel.id, chapterId: activeChapter.id, patch: {content: next}}));
        message.success(mode === "replace" ? "已替换选中内容" : "已插入到文末");
    };

    return (
        <div className="flex h-full min-h-0 w-full gap-3">
            {/* 左栏：作品与章节目录 */}
            <aside className="flex w-60 shrink-0 flex-col overflow-hidden rounded-xl border bg-card">
                <div className="flex items-center justify-between border-b p-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <BookOpenText className="size-4 shrink-0 text-primary"/>
                        <input
                            value={novel.title}
                            onChange={e => dispatch(renameNovel({id: novel.id, title: e.target.value}))}
                            className="min-w-0 flex-1 truncate bg-transparent text-sm font-semibold outline-none"
                        />
                    </div>
                    <button title="新建作品" onClick={() => setNewWritingOpen(true)} className="text-muted-foreground hover:text-foreground">
                        <Plus className="size-4"/>
                    </button>
                </div>

                {/* 作品切换 */}
                {novels.length > 1 && (
                    <div className="flex gap-1 overflow-x-auto border-b p-2">
                        {novels.map(n => (
                            <button
                                key={n.id}
                                onClick={() => dispatch(selectNovel(n.id))}
                                className={`shrink-0 rounded-md px-2 py-1 text-xs ${
                                    n.id === novel.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"
                                }`}
                            >
                                {n.title || "未命名"}
                            </button>
                        ))}
                    </div>
                )}

                {/* 作品信息 */}
                <div className="space-y-2 border-b p-3">
                    <input
                        value={novel.genre}
                        onChange={e => dispatch(updateNovelMeta({id: novel.id, patch: {genre: e.target.value}}))}
                        placeholder="题材，如：科幻 / 悬疑"
                        className="w-full bg-transparent text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/60"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{countWords(novel.description) ? countWords(novel.description) + " 字简介" : "暂无简介"}</span>
                        <span>共 {totalWords.toLocaleString()} 字</span>
                    </div>
                    <button
                        onClick={() => {
                            if (confirm(`确定删除《${novel.title || "未命名"}》吗？此操作不可撤销。`)) dispatch(deleteNovel(novel.id));
                        }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                    >
                        <Trash2 className="size-3"/> 删除作品
                    </button>
                </div>

                {/* 卷 / 章节目录 */}
                <div className="min-h-0 flex-1 overflow-auto p-2">
                    {novel.volumes.map(volume => {
                        const collapsed = collapsedVolumes[volume.id];
                        return (
                            <div key={volume.id} className="mb-2">
                                <div className="group flex items-center gap-1 px-1 py-1">
                                    <button onClick={() => setCollapsedVolumes(p => ({...p, [volume.id]: !collapsed}))} className="text-muted-foreground">
                                        {collapsed ? <ChevronRight className="size-3.5"/> : <ChevronDown className="size-3.5"/>}
                                    </button>
                                    <input
                                        value={volume.title}
                                        onChange={e => dispatch(renameVolume({novelId: novel.id, volumeId: volume.id, title: e.target.value}))}
                                        className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
                                    />
                                    {novel.volumes.length > 1 && (
                                        <button
                                            onClick={() => dispatch(deleteVolume({novelId: novel.id, volumeId: volume.id}))}
                                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="size-3"/>
                                        </button>
                                    )}
                                </div>
                                {!collapsed && (
                                    <div className="ml-3 space-y-0.5">
                                        {volume.chapters.map(chapter => (
                                            <div key={chapter.id} className="group flex items-center gap-1">
                                                <button
                                                    onClick={() => dispatch(selectChapter(chapter.id))}
                                                    className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm ${
                                                        chapter.id === activeChapterId ? "bg-primary/10 text-primary" : "hover:bg-accent"
                                                    }`}
                                                >
                                                    <FileText className="size-3.5 shrink-0"/>
                                                    <span className="truncate">{chapter.title}</span>
                                                </button>
                                                <button
                                                    onClick={() => dispatch(deleteChapter({novelId: novel.id, chapterId: chapter.id}))}
                                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="size-3"/>
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => dispatch(addChapter({novelId: novel.id, volumeId: volume.id}))}
                                            className="flex w-full items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-primary"
                                        >
                                            <Plus className="size-3"/> 新建章节
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <button
                        onClick={() => dispatch(addVolume(novel.id))}
                        className="mt-1 flex w-full items-center gap-1.5 rounded-md border border-dashed px-2 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                    >
                        <FolderPlus className="size-3.5"/> 新建卷
                    </button>
                </div>
            </aside>

            {/* 中栏：章节编辑器 */}
            <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
                {activeChapter ? (
                    <>
                        <div className="flex flex-wrap items-center gap-3 border-b p-3">
                            <input
                                value={activeChapter.title}
                                onChange={e => dispatch(updateChapter({novelId: novel.id, chapterId: activeChapter.id, patch: {title: e.target.value}}))}
                                className="min-w-[180px] flex-1 bg-transparent text-base font-semibold outline-none"
                            />
                            <select
                                value={activeChapter.status}
                                onChange={e => dispatch(updateChapter({novelId: novel.id, chapterId: activeChapter.id, patch: {status: e.target.value as ChapterStatus}}))}
                                className="rounded-md border bg-background px-2 py-1 text-xs"
                            >
                                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Type className="size-3.5"/> {countWords(activeChapter.content).toLocaleString()} 字
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Save className="size-3.5"/> 自动保存
                            </span>
                        </div>
                        <textarea
                            ref={editorRef}
                            value={activeChapter.content}
                            onChange={e => dispatch(updateChapter({novelId: novel.id, chapterId: activeChapter.id, patch: {content: e.target.value}}))}
                            onSelect={handleSelectText}
                            placeholder="开始写作……选中文字后可用右侧 AI 润色或扩写。"
                            className="min-h-0 flex-1 resize-none bg-transparent p-6 text-[15px] leading-8 outline-none placeholder:text-muted-foreground/50"
                            spellCheck={false}
                        />
                    </>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                        <FileText className="size-10 opacity-50"/>
                        <p>还没有章节</p>
                        <button
                            onClick={() => dispatch(addChapter({novelId: novel.id, volumeId: novel.volumes[0].id}))}
                            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
                        >
                            新建章节
                        </button>
                    </div>
                )}
            </section>

            {/* 右栏：AI 助手 / 设定 */}
            <aside className="flex w-80 shrink-0 flex-col overflow-hidden rounded-xl border bg-card">
                <div className="flex border-b p-2">
                    <button
                        onClick={() => setRightTab("ai")}
                        className={`flex-1 rounded-md py-1.5 text-sm ${rightTab === "ai" ? "bg-muted font-medium" : "text-muted-foreground"}`}
                    >
                        AI 助手
                    </button>
                    <button
                        onClick={() => setRightTab("settings")}
                        className={`flex-1 rounded-md py-1.5 text-sm ${rightTab === "settings" ? "bg-muted font-medium" : "text-muted-foreground"}`}
                    >
                        设定
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden p-3">
                    {rightTab === "ai" ? (
                        <AiAssistantPanel
                            novel={novel}
                            chapterId={activeChapter?.id ?? ""}
                            selection={selection}
                            onApply={applyAiText}
                        />
                    ) : (
                        <SettingsPanel
                            novel={novel}
                            activeChapterOutline={activeChapter?.outline ?? ""}
                            onChapterOutlineChange={value => activeChapter && dispatch(updateChapter({
                                novelId: novel.id, chapterId: activeChapter.id, patch: {outline: value},
                            }))}
                        />
                    )}
                </div>
            </aside>

            <NewWritingDialog open={newWritingOpen} onClose={() => setNewWritingOpen(false)} />
        </div>
    );
}
