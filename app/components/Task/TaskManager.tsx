import {useCallback, useEffect, useState} from "react";
import {
    Check,
    CheckCircle2,
    Circle,
    ClipboardList,
    Layers,
    Loader2,
    Play,
    RotateCcw,
    Square,
    X,
    XCircle,
} from "lucide-react";
import {message} from "~/components/Message";
import {
    approveTask,
    cancelTask,
    confirmTask,
    createTask,
    getTask,
    listTaskTools,
    listTasks,
    retryTaskStep,
    streamTaskEvents,
    type AgentTask,
    type StepStatus,
    type TaskStatus,
} from "~/services/taskService";
import type {Result} from "~/services/data";

const ACTIVE_STATUSES: TaskStatus[] = ["PLANNING", "PLAN_REVIEW", "WAIT_APPROVAL", "RUNNING"];

const STATUS_META: Record<TaskStatus, { label: string; className: string }> = {
    CREATED: {label: "待规划", className: "bg-slate-500/15 text-slate-300"},
    PLANNING: {label: "生成计划中", className: "bg-blue-500/15 text-blue-300"},
    PLAN_REVIEW: {label: "待确认计划", className: "bg-amber-500/15 text-amber-300"},
    WAIT_APPROVAL: {label: "等待工具审批", className: "bg-orange-500/15 text-orange-300"},
    RUNNING: {label: "执行中", className: "bg-indigo-500/15 text-indigo-300"},
    PAUSED: {label: "已暂停", className: "bg-slate-500/15 text-slate-300"},
    COMPLETED: {label: "已完成", className: "bg-emerald-500/15 text-emerald-300"},
    FAILED: {label: "失败", className: "bg-rose-500/15 text-rose-300"},
    CANCELLED: {label: "已取消", className: "bg-slate-500/15 text-slate-400"},
    REJECTED: {label: "已拒绝", className: "bg-rose-500/15 text-rose-300"},
};

const STEP_META: Record<StepStatus, { icon: typeof Circle; className: string }> = {
    PENDING: {icon: Circle, className: "text-slate-500"},
    RUNNING: {icon: Loader2, className: "text-indigo-300 animate-spin"},
    SUCCEEDED: {icon: CheckCircle2, className: "text-emerald-400"},
    FAILED: {icon: XCircle, className: "text-rose-400"},
    SKIPPED: {icon: Circle, className: "text-slate-500"},
};

const TOOL_LABELS: Record<string, string> = {
    model: "模型推理",
    knowledge_search: "知识库问答",
    knowledge_list: "列出知识库文档",
    novel_read: "读取写作作品",
    novel_write_draft: "保存写作草稿",
    web_search: "联网搜索",
};

function toolLabel(tool?: string) {
    if (!tool) return "模型推理";
    if (tool.startsWith("mcp_")) return `MCP · ${tool.slice(4)}`;
    return TOOL_LABELS[tool] ?? tool;
}

function formatTime(value?: string) {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN");
}

export default function TaskManager() {
    const [tasks, setTasks] = useState<AgentTask[]>([]);
    const [tools, setTools] = useState<string[]>([]);
    const [detail, setDetail] = useState<AgentTask | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [streamConnected, setStreamConnected] = useState(false);
    const [title, setTitle] = useState("");
    const [goal, setGoal] = useState("");
    const [constraints, setConstraints] = useState("");
    const [modelCode, setModelCode] = useState("");

    const loadList = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await listTasks(0, 30);
            if (!res.success) {
                message.error(res.msg || "加载任务列表失败");
                return;
            }
            setTasks(res.data?.content ?? []);
        } catch (e: any) {
            message.error(e?.message || "加载任务列表失败");
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    const loadDetail = useCallback(async (id: string, silent = false) => {
        try {
            const res = await getTask(id);
            if (res.success && res.data) setDetail(res.data);
        } catch {
            if (!silent) message.error("加载任务详情失败");
        }
    }, []);

    useEffect(() => { void loadList(); }, [loadList]);
    useEffect(() => {
        void listTaskTools().then(res => {
            if (res.success && res.data) setTools(res.data);
        }).catch(() => { /* 工具列表加载失败不影响任务中心主流程 */ });
    }, []);
    useEffect(() => {
        if (selectedId) void loadDetail(selectedId); else setDetail(null);
    }, [selectedId, loadDetail]);

    useEffect(() => {
        if (!selectedId) {
            setStreamConnected(false);
            return;
        }
        const controller = new AbortController();
        let cancelled = false;
        setStreamConnected(true);
        streamTaskEvents(selectedId, 0, event => {
            if (cancelled) return;
            setDetail(prev => {
                if (!prev || prev.id !== selectedId) return prev;
                if (prev.events?.some(existing => existing.seq === event.seq)) return prev;
                return {...prev, events: [...(prev.events ?? []), event]};
            });
            if (["step_finished", "step_failed", "task_completed", "approval_requested",
                "plan_generated", "task_cancelled", "plan_failed"].includes(event.eventType)) {
                void loadDetail(selectedId, true);
            }
        }, {signal: controller.signal}).catch(() => {
            if (!cancelled) setStreamConnected(false);
        }).finally(() => {
            if (!cancelled) setStreamConnected(false);
        });
        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [selectedId, loadDetail]);

    const hasActive = tasks.some(task => ACTIVE_STATUSES.includes(task.status))
        || (detail != null && ACTIVE_STATUSES.includes(detail.status));
    useEffect(() => {
        if (!hasActive || streamConnected) return;
        const timer = window.setInterval(() => {
            void loadList(true);
            if (selectedId) void loadDetail(selectedId, true);
        }, 4000);
        return () => window.clearInterval(timer);
    }, [hasActive, streamConnected, selectedId, loadList, loadDetail]);

    const runAction = async (action: () => Promise<Result<AgentTask>>, successText: string) => {
        setBusy(true);
        try {
            const res = await action();
            if (res.success) {
                message.success(successText);
                await loadList(true);
                if (res.data) setDetail(res.data);
            } else message.error(res.msg || "操作失败");
        } catch (e: any) {
            message.error(e?.message || "操作失败");
        } finally {
            setBusy(false);
        }
    };

    const handleCreate = async () => {
        if (!title.trim() || !goal.trim()) {
            message.error("请填写任务标题和目标");
            return;
        }
        const res = await createTask({
            title: title.trim(),
            goal: goal.trim(),
            constraints: constraints.trim() || undefined,
            modelCode: modelCode.trim() || undefined,
        });
        if (!res.success) {
            message.error(res.msg || "新建任务失败");
            return;
        }
        message.success("任务已创建，正在生成计划");
        setTitle(""); setGoal(""); setConstraints(""); setModelCode("");
        await loadList(true);
        if (res.data) setSelectedId(res.data.id);
    };

    const pendingApproval = detail?.steps?.find(
        step => step.requiresApproval && !step.approved && step.status === "PENDING",
    );
    const steps = detail?.steps ?? [];

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-semibold">
                    <ClipboardList className="size-6 text-indigo-300"/> AI 任务中心
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    描述目标后，系统会生成可执行步骤；确认后异步执行，并实时展示进度与结果。
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
                <div className="space-y-4">
                    <section className="space-y-3 rounded-xl border bg-card p-4">
                        <h2 className="text-sm font-semibold">新建任务</h2>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="任务标题，例如：整理世界观设定"
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
                        />
                        <textarea
                            value={goal}
                            onChange={e => setGoal(e.target.value)}
                            placeholder="任务目标：希望 AI 最终交付什么？"
                            rows={5}
                            className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
                        />
                        <textarea
                            value={constraints}
                            onChange={e => setConstraints(e.target.value)}
                            placeholder="约束条件（可选）：风格、字数、禁止事项…"
                            rows={3}
                            className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
                        />
                        <input
                            value={modelCode}
                            onChange={e => setModelCode(e.target.value)}
                            placeholder="模型（可选）：provider:model，留空用默认"
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
                        />
                        <button
                            onClick={() => void handleCreate()}
                            className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                        >
                            创建任务
                        </button>
                        {tools.length > 0 && (
                            <div className="border-t pt-2">
                                <div className="mb-1 text-xs text-muted-foreground">
                                    可用工具（{tools.filter(t => !t.startsWith("mcp_")).length} 内置 /
                                    {tools.filter(t => t.startsWith("mcp_")).length} MCP）
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {tools.map(tool => (
                                        <span
                                            key={tool}
                                            title={tool.startsWith("mcp_") ? "外部 MCP 工具，执行前需批准" : undefined}
                                            className={`rounded px-1.5 py-0.5 text-[10px] ${
                                                tool.startsWith("mcp_")
                                                    ? "bg-violet-500/15 text-violet-300"
                                                    : "bg-muted text-muted-foreground"}`}
                                        >
                                            {tool.startsWith("mcp_") ? tool.slice(4) : tool}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="rounded-xl border bg-card p-3">
                        <h2 className="mb-2 px-1 text-sm font-semibold">任务列表</h2>
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin"/></div>
                        ) : tasks.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">还没有任务，先创建一个吧</p>
                        ) : (
                            <div className="space-y-1">
                                {tasks.map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => setSelectedId(task.id)}
                                        className={`w-full rounded-lg px-3 py-2 text-left transition ${
                                            selectedId === task.id ? "bg-indigo-500/15" : "hover:bg-accent"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="truncate text-sm font-medium">{task.title}</span>
                                            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${STATUS_META[task.status]?.className ?? ""}`}>
                                                {STATUS_META[task.status]?.label ?? task.status}
                                            </span>
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground">{formatTime(task.createdAt)}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <section className="min-h-[420px] rounded-xl border bg-card p-5">
                    {!detail ? (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            从左侧选择一个任务查看详情
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold">{detail.title}</h2>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <span className={`rounded px-1.5 py-0.5 ${STATUS_META[detail.status]?.className ?? ""}`}>
                                            {STATUS_META[detail.status]?.label ?? detail.status}
                                        </span>
                                        <span>步骤 {detail.currentStep ?? 0}/{detail.maxSteps ?? 0}</span>
                                        <span>{streamConnected ? "实时连接" : "轮询刷新"}</span>
                                        <span>创建于 {formatTime(detail.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {detail.status === "PLAN_REVIEW" && (
                                        <button
                                            disabled={busy}
                                            onClick={() => void runAction(() => confirmTask(detail.id), "已开始执行")}
                                            className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-500 disabled:opacity-50"
                                        >
                                            <Play className="size-3.5"/> 确认并开始
                                        </button>
                                    )}
                                    {ACTIVE_STATUSES.includes(detail.status) && (
                                        <button
                                            disabled={busy}
                                            onClick={() => void runAction(() => cancelTask(detail.id), "已取消任务")}
                                            className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
                                        >
                                            <Square className="size-3.5"/> 取消
                                        </button>
                                    )}
                                </div>
                            </div>

                            {detail.errorMessage && (
                                <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                                    {detail.errorMessage}
                                </div>
                            )}

                            {detail.status === "WAIT_APPROVAL" && pendingApproval && (
                                <div className="rounded-lg border border-orange-500/40 bg-orange-500/10 p-4">
                                    <div className="text-sm font-semibold text-orange-200">敏感操作需要你的批准</div>
                                    <p className="mt-1 text-sm">
                                        步骤 #{pendingApproval.seq} {pendingApproval.title} 将调用
                                        <span className="mx-1 rounded bg-orange-500/20 px-1.5 py-0.5 text-xs">
                                            {toolLabel(pendingApproval.tool)}
                                        </span>
                                    </p>
                                    {pendingApproval.inputJson && pendingApproval.inputJson !== "{}" && (
                                        <pre className="mt-2 max-h-40 overflow-auto rounded bg-background/60 p-2 text-xs whitespace-pre-wrap break-words">
                                            {pendingApproval.inputJson}
                                        </pre>
                                    )}
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            disabled={busy}
                                            onClick={() => void runAction(
                                                () => approveTask(detail.id, true), "已批准，继续执行")}
                                            className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-500 disabled:opacity-50"
                                        >
                                            <Check className="size-3.5"/> 批准执行
                                        </button>
                                        <button
                                            disabled={busy}
                                            onClick={() => void runAction(
                                                () => approveTask(detail.id, false), "已拒绝该步骤")}
                                            className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
                                        >
                                            <X className="size-3.5"/> 拒绝
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="rounded-lg bg-background/50 p-3 text-sm">
                                <div className="mb-1 text-xs text-muted-foreground">任务目标</div>
                                <p className="whitespace-pre-wrap break-words">{detail.goal}</p>
                                {detail.constraints && (
                                    <>
                                        <div className="mb-1 mt-3 text-xs text-muted-foreground">约束</div>
                                        <p className="whitespace-pre-wrap break-words text-sm">{detail.constraints}</p>
                                    </>
                                )}
                            </div>

                            <div>
                                <h3 className="mb-2 text-sm font-semibold">执行步骤</h3>
                                {steps.length ? (
                                    <ol className="space-y-2">
                                        {steps.map((step, index) => {
                                            const Icon = STEP_META[step.status]?.icon ?? Circle;
                                            const group = step.parallelGroup?.trim() ?? "";
                                            const groupStart = !!group && steps[index - 1]?.parallelGroup?.trim() !== group;
                                            return (
                                                <li key={step.id} className={`rounded-lg border p-3 ${
                                                    group ? "border-indigo-500/40 bg-indigo-500/5" : ""}`}>
                                                    <div className="flex items-start gap-2">
                                                        <Icon className={`mt-0.5 size-4 shrink-0 ${STEP_META[step.status]?.className ?? ""}`}/>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                                                <span className="font-medium">#{step.seq} {step.title}</span>
                                                                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                                    {toolLabel(step.tool)}
                                                                </span>
                                                                {group && (
                                                                    <span className="inline-flex items-center gap-1 rounded bg-indigo-500/15 px-1.5 py-0.5 text-[10px] text-indigo-300">
                                                                        {groupStart && <Layers className="size-3"/>}
                                                                        {groupStart ? `并行组 ${group}` : `并行 · ${group}`}
                                                                    </span>
                                                                )}
                                                                {step.requiresApproval && (
                                                                    <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-[10px] text-orange-300">
                                                                        需审批{step.approved ? " · 已批准" : ""}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {step.resultText && (
                                                                <p className="mt-2 whitespace-pre-wrap break-words rounded bg-muted/40 p-2 text-xs text-muted-foreground">
                                                                    {step.resultText}
                                                                </p>
                                                            )}
                                                            {step.errorMessage && (
                                                                <p className="mt-2 text-xs text-rose-300">{step.errorMessage}</p>
                                                            )}
                                                        </div>
                                                        {step.status === "FAILED" && (
                                                            <button
                                                                disabled={busy}
                                                                onClick={() => void runAction(
                                                                    () => retryTaskStep(detail.id, step.id), "已重新执行步骤")}
                                                                title="重试该步骤"
                                                                className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-primary disabled:opacity-50"
                                                            >
                                                                <RotateCcw className="size-4"/>
                                                            </button>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                ) : (
                                    <p className="text-sm text-muted-foreground">计划生成中，请稍候…</p>
                                )}
                            </div>

                            {detail.finalSummary && (
                                <div>
                                    <h3 className="mb-2 text-sm font-semibold">最终结果</h3>
                                    <p className="whitespace-pre-wrap break-words rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-100">
                                        {detail.finalSummary}
                                    </p>
                                </div>
                            )}

                            {detail.events && detail.events.length > 0 && (
                                <div>
                                    <h3 className="mb-2 text-sm font-semibold">执行日志</h3>
                                    <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg bg-background/50 p-2 text-xs font-mono text-muted-foreground">
                                        {detail.events.slice(-30).map(event => (
                                            <div key={event.id}>
                                                [{formatTime(event.createdAt)}] {event.eventType}
                                                {event.payload ? ` · ${event.payload}` : ""}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
