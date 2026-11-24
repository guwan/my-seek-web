import {useCallback, useEffect, useRef, useState} from "react";
import {useSelector} from "react-redux";
import {Database, FileText, Loader2, Plus, RotateCcw, Search, Trash2, Upload} from "lucide-react";
import {message} from "~/components/Message";
import {
    deleteDocument,
    listDocuments,
    queryDocument,
    queryKnowledge,
    retryDocument,
    uploadDocument,
    type KnowledgeDocument,
    type KnowledgeStatus,
} from "~/services/knowledgeService";
import type {Result} from "~/services/data";
import type {RootState} from "~/store";

const PAGE_SIZE = 10;

const STATUS_META: Record<KnowledgeStatus, {label: string; className: string}> = {
    PENDING: {label: "待处理", className: "bg-muted text-muted-foreground"},
    PROCESSING: {label: "处理中", className: "bg-amber-500/10 text-amber-600"},
    COMPLETED: {label: "已完成", className: "bg-green-500/10 text-green-600"},
    FAILED: {label: "失败", className: "bg-destructive/10 text-destructive"},
};

function formatSize(size?: number): string {
    if (!size) return "0 B";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatTime(value?: string): string {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function KnowledgeManager() {
    const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [scope, setScope] = useState("all");
    const [query, setQuery] = useState("");
    const [topK, setTopK] = useState(5);
    const [answer, setAnswer] = useState("");
    const [querying, setQuerying] = useState(false);
    const [retryingId, setRetryingId] = useState<string | null>(null);
    const selectedModel = useSelector((state: RootState) => state.models.selectedModel);
    const fileRef = useRef<HTMLInputElement>(null);

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await listDocuments({page, size: PAGE_SIZE});
            if (!res.success) {
                message.error(res.msg || "加载知识库失败");
                return;
            }
            setDocuments(res.data?.content ?? []);
            setTotalPages(Math.max(1, res.data?.totalPages ?? 1));
        } catch (e: any) {
            message.error(e?.message || "加载知识库失败");
        } finally {
            if (!silent) setLoading(false);
        }
    }, [page]);

    const loadRef = useRef(load);
    useEffect(() => { loadRef.current = load; }, [load]);
    useEffect(() => { void load(); }, [load]);

    // 上传后状态会在后台流转，PENDING/PROCESSING 期间轻量轮询，进入终态后自动停止
    const hasPending = documents.some(doc => doc.status === "PENDING" || doc.status === "PROCESSING");
    useEffect(() => {
        if (!hasPending) return;
        const timer = window.setInterval(() => void loadRef.current(true), 4000);
        return () => window.clearInterval(timer);
    }, [hasPending]);

    const handleUpload = async (file: File | undefined) => {
        if (!file) return;
        setUploading(true);
        try {
            const res = await uploadDocument(file);
            if (res.success) {
                message.success("文档已上传，正在后台处理");
                if (page === 0) await load(); else setPage(0);
            } else {
                message.error(res.msg || "上传失败");
            }
        } catch (e: any) {
            message.error(e?.message || "上传失败");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    };

    const handleDelete = async (doc: KnowledgeDocument) => {
        if (!doc.id) return;
        if (!confirm(`确定删除「${doc.originalName || doc.name || "未命名文档"}」吗？向量数据也会一并删除。`)) return;
        try {
            const res = await deleteDocument(doc.id);
            if (res.success) {
                message.success("已删除");
                if (documents.length === 1 && page > 0) setPage(page - 1); else await load();
            } else message.error(res.msg || "删除失败");
        } catch (e: any) {
            message.error(e?.message || "删除失败");
        }
    };

    const handleRetry = async (doc: KnowledgeDocument) => {
        if (!doc.id) return;
        setRetryingId(doc.id);
        try {
            const res = await retryDocument(doc.id);
            if (res.success) {
                message.success("已重新提交处理");
                await load();
            } else message.error(res.msg || "重试失败");
        } catch (e: any) {
            message.error(e?.message || "重试失败");
        } finally {
            setRetryingId(null);
        }
    };

    const handleQuery = async () => {
        const text = query.trim();
        if (!text) {
            message.error("请输入问题");
            return;
        }
        setQuerying(true);
        setAnswer("");
        try {
            const response = scope === "all"
                ? await queryKnowledge(text, topK, selectedModel || undefined)
                : await queryDocument(scope, text, topK, selectedModel || undefined);
            const data = await response.json() as Result<string>;
            if (!response.ok || !data.success) throw new Error(data.msg || `查询失败 (${response.status})`);
            setAnswer(data.data || "没有找到相关内容");
        } catch (e: any) {
            message.error(e?.message || "查询失败");
        } finally {
            setQuerying(false);
        }
    };

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">知识库</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        上传后自动进入后台解析与向量化，列表会刷新状态；失败的文档可点击重试。完成后可在页面中检索，也可通过 RAG 接口为对话补充上下文。
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.md,.xls,.xlsx,.ppt,.pptx"
                        className="hidden"
                        onChange={e => void handleUpload(e.target.files?.[0])}
                    />
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                        {uploading ? <Loader2 className="size-4 animate-spin"/> : <Upload className="size-4"/>}
                        {uploading ? "上传中…" : "上传文档"}
                    </button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
                <section className="overflow-hidden rounded-xl border bg-card">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h2 className="flex items-center gap-2 text-sm font-medium">
                            <FileText className="size-4 text-primary"/> 文档列表
                        </h2>
                        <button onClick={() => void load()} className="text-xs text-muted-foreground hover:text-foreground">
                            刷新
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground"/></div>
                    ) : documents.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-16 text-sm text-muted-foreground">
                            <Database className="size-8 opacity-40"/>
                            <p>还没有文档，点击右上角上传</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {documents.map(doc => {
                                const status = doc.status ?? "PENDING";
                                const meta = STATUS_META[status];
                                return (
                                    <div key={doc.id} className="flex items-start gap-3 px-4 py-3">
                                        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                            <FileText className="size-4 text-muted-foreground"/>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="truncate text-sm font-medium" title={doc.originalName || doc.name}>
                                                    {doc.originalName || doc.name || "未命名文档"}
                                                </span>
                                                <span className={`rounded px-1.5 py-0.5 text-[11px] ${meta.className}`}>{meta.label}</span>
                                                {!!doc.chunkCount && (
                                                    <span className="text-[11px] text-muted-foreground">{doc.chunkCount} 个分块</span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {formatSize(doc.size)} · 上传于 {formatTime(doc.createdAt)}
                                            </p>
                                            {doc.errorMessage && (
                                                <p className="mt-1 text-xs text-destructive">{doc.errorMessage}</p>
                                            )}
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1">
                                            {status === "FAILED" && doc.id && (
                                                <button
                                                    onClick={() => void handleRetry(doc)}
                                                    disabled={retryingId === doc.id}
                                                    title="重试处理"
                                                    className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-primary disabled:opacity-50"
                                                >
                                                    {retryingId === doc.id
                                                        ? <Loader2 className="size-4 animate-spin"/>
                                                        : <RotateCcw className="size-4"/>}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => void handleDelete(doc)}
                                                title="删除"
                                                className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-destructive"
                                            >
                                                <Trash2 className="size-4"/>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
                            <span>第 {page + 1} / {totalPages} 页</span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page <= 0}
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    className="rounded border px-2 py-1 disabled:opacity-40"
                                >
                                    上一页
                                </button>
                                <button
                                    disabled={page + 1 >= totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    className="rounded border px-2 py-1 disabled:opacity-40"
                                >
                                    下一页
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                <section className="flex flex-col gap-4 rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Search className="size-4"/>
                        </div>
                        <div>
                            <h2 className="text-sm font-medium">知识库问答</h2>
                            <p className="text-xs text-muted-foreground">基于已完成文档生成模型回答</p>
                        </div>
                    </div>

                    <label className="block space-y-1.5">
                        <span className="text-xs text-muted-foreground">检索范围</span>
                        <select
                            value={scope}
                            onChange={e => setScope(e.target.value)}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none"
                        >
                            <option value="all">全部文档</option>
                            {documents.filter(doc => doc.status === "COMPLETED").map(doc => (
                                <option key={doc.id} value={doc.id}>
                                    {doc.originalName || doc.name || doc.id}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block space-y-1.5">
                        <span className="text-xs text-muted-foreground">问题</span>
                        <textarea
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="例如：这份文档中关于部署的要求有哪些？"
                            rows={4}
                            className="w-full resize-none rounded-lg border bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                        />
                    </label>

                    <div className="flex items-center gap-3">
                        <label className="flex flex-1 items-center gap-2 text-xs text-muted-foreground">
                            返回片段数
                            <input
                                type="number"
                                min={1}
                                max={20}
                                value={topK}
                                onChange={e => setTopK(Math.max(1, Math.min(20, Number(e.target.value) || 5)))}
                                className="w-20 rounded-md border bg-background px-2 py-1 text-sm"
                            />
                        </label>
                        <button
                            onClick={() => void handleQuery()}
                            disabled={querying}
                            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                        >
                            {querying ? <Loader2 className="size-4 animate-spin"/> : <Plus className="size-4"/>}
                            查询
                        </button>
                    </div>

                    <div className="min-h-40 flex-1 whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed">
                        {answer || <span className="text-muted-foreground">模型回答会显示在这里。</span>}
                    </div>
                </section>
            </div>
        </div>
    );
}
