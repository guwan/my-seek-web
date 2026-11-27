import {useCallback, useEffect, useState} from "react";
import {Check, Loader2, Plus, Trash2, Wrench} from "lucide-react";
import {message} from "~/components/Message";
import {
    deleteAgent, deleteConnector, deleteSkill,
    listAgents, listConnectors, listSkills,
    saveAgent, saveConnector, saveSkill,
    type AgentDef, type ConnectorDef, type SkillDef,
} from "~/services/catalogService";

type Tab = "agents" | "skills" | "connectors";

const TABS: {key: Tab; label: string; hint: string}[] = [
    {key: "agents", label: "专家", hint: "决定任务规划时的人设、技能与推荐模型"},
    {key: "skills", label: "技能", hint: "可复用的能力：指令模板 + 工具白名单"},
    {key: "connectors", label: "连接器", hint: "工具来源：内置工具集或外部 MCP 服务器"},
];

export default function CatalogManager() {
    const [tab, setTab] = useState<Tab>("agents");
    const [agents, setAgents] = useState<AgentDef[]>([]);
    const [skills, setSkills] = useState<SkillDef[]>([]);
    const [connectors, setConnectors] = useState<ConnectorDef[]>([]);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [form, setForm] = useState<Record<string, any>>({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [a, s, c] = await Promise.all([listAgents(), listSkills(), listConnectors()]);
            if (a.success && a.data) setAgents(a.data);
            if (s.success && s.data) setSkills(s.data);
            if (c.success && c.data) setConnectors(c.data);
        } catch (e: any) {
            message.error(e?.message || "加载目录失败");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const startNew = () => {
        setForm({code: "", name: "", description: "", enabled: "true"});
        if (tab === "agents") setForm(f => ({...f, systemPrompt: "", skillsJson: "[]", modelCode: ""}));
        if (tab === "skills") setForm(f => ({...f, promptTemplate: "", toolsJson: "[]"}));
        if (tab === "connectors") setForm(f => ({...f, type: "BUILTIN", toolsJson: "[]"}));
        setEditing(true);
    };

    const startEdit = (item: AgentDef | SkillDef | ConnectorDef) => {
        setForm({
            ...item,
            description: item.description ?? "",
            enabled: item.enabled === false ? "false" : "true",
            systemPrompt: (item as AgentDef).systemPrompt ?? "",
            skillsJson: (item as AgentDef).skillsJson ?? "[]",
            modelCode: (item as AgentDef).modelCode ?? "",
            promptTemplate: (item as SkillDef).promptTemplate ?? "",
            toolsJson: (item as SkillDef).toolsJson ?? (item as ConnectorDef).toolsJson ?? "[]",
            type: (item as ConnectorDef).type ?? "BUILTIN",
        });
        setEditing(true);
    };

    const handleSave = async () => {
        if (!form.code?.trim() || !form.name?.trim()) {
            message.error("标识和名称不能为空");
            return;
        }
        setBusy(true);
        try {
            const base = {
                code: form.code.trim(), name: form.name.trim(),
                description: form.description, enabled: form.enabled !== "false",
            };
            const res = tab === "agents"
                ? await saveAgent({...base, systemPrompt: form.systemPrompt, skillsJson: form.skillsJson, modelCode: form.modelCode || undefined})
                : tab === "skills"
                    ? await saveSkill({...base, promptTemplate: form.promptTemplate, toolsJson: form.toolsJson})
                    : await saveConnector({...base, type: form.type as "BUILTIN" | "MCP", toolsJson: form.toolsJson});
            if (!res.success) { message.error(res.msg || "保存失败"); return; }
            message.success("已保存");
            setEditing(false);
            await load();
        } catch (e: any) {
            message.error(e?.message || "保存失败");
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async (id: string) => {
        setBusy(true);
        try {
            const res = tab === "agents" ? await deleteAgent(id)
                : tab === "skills" ? await deleteSkill(id) : await deleteConnector(id);
            if (!res.success) { message.error(res.msg || "删除失败"); return; }
            message.success("已删除");
            await load();
        } catch (e: any) {
            message.error(e?.message || "删除失败");
        } finally {
            setBusy(false);
        }
    };

    const current: (AgentDef | SkillDef | ConnectorDef)[] =
        tab === "agents" ? agents : tab === "skills" ? skills : connectors;
    const builtinCount = current.filter(x => x.builtin).length;

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
            <div>
                <h1 className="flex items-center gap-2 text-2xl font-semibold">
                    <Wrench className="size-6 text-indigo-300"/> 能力目录
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    内置 {builtinCount} 项开箱即用；自定义项仅你可见，可在任务创建时选择专家。
                </p>
            </div>

            <div className="flex items-center gap-2 border-b">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => { setTab(t.key); setEditing(false); }}
                        className={`border-b-2 px-4 py-2 text-sm transition ${
                            tab === t.key ? "border-indigo-500 text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                        {t.label}
                    </button>
                ))}
                <button
                    onClick={startNew}
                    className="ml-auto flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-500"
                >
                    <Plus className="size-3.5"/> 新建{TABS.find(t => t.key === tab)?.label}
                </button>
            </div>
            <p className="-mt-4 text-xs text-muted-foreground">{TABS.find(t => t.key === tab)?.hint}</p>

            {editing && (
                <section className="space-y-3 rounded-xl border bg-card p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <input value={form.code ?? ""} onChange={e => setForm({...form, code: e.target.value})}
                               placeholder="标识（英文，如 my_expert）"
                               className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"/>
                        <input value={form.name ?? ""} onChange={e => setForm({...form, name: e.target.value})}
                               placeholder="名称"
                               className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"/>
                    </div>
                    <input value={form.description ?? ""} onChange={e => setForm({...form, description: e.target.value})}
                           placeholder="描述"
                           className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"/>
                    {tab === "agents" && (
                        <>
                            <textarea value={form.systemPrompt ?? ""} onChange={e => setForm({...form, systemPrompt: e.target.value})}
                                      placeholder="专家人设 / systemPrompt" rows={4}
                                      className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"/>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <input value={form.skillsJson ?? ""} onChange={e => setForm({...form, skillsJson: e.target.value})}
                                       placeholder='关联技能 code，如 ["web_research"]'
                                       className="rounded-md border bg-background px-3 py-2 text-sm outline-none"/>
                                <input value={form.modelCode ?? ""} onChange={e => setForm({...form, modelCode: e.target.value})}
                                       placeholder="推荐模型（可选）"
                                       className="rounded-md border bg-background px-3 py-2 text-sm outline-none"/>
                            </div>
                        </>
                    )}
                    {tab === "skills" && (
                        <>
                            <textarea value={form.promptTemplate ?? ""} onChange={e => setForm({...form, promptTemplate: e.target.value})}
                                      placeholder="技能指令模板" rows={4}
                                      className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none"/>
                            <input value={form.toolsJson ?? ""} onChange={e => setForm({...form, toolsJson: e.target.value})}
                                   placeholder='工具白名单 JSON，如 ["web_search"]，留空不限制'
                                   className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"/>
                        </>
                    )}
                    {tab === "connectors" && (
                        <>
                            <select value={form.type ?? "BUILTIN"} onChange={e => setForm({...form, type: e.target.value})}
                                    className="rounded-md border bg-background px-3 py-2 text-sm outline-none">
                                <option value="BUILTIN">内置工具集</option>
                                <option value="MCP">MCP 外部工具</option>
                            </select>
                            <input value={form.toolsJson ?? ""} onChange={e => setForm({...form, toolsJson: e.target.value})}
                                   placeholder='提供的工具名 JSON，如 ["knowledge_search"]'
                                   className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none"/>
                        </>
                    )}
                    <div className="flex gap-2">
                        <button disabled={busy} onClick={() => void handleSave()}
                                className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-500 disabled:opacity-50">
                            <Check className="size-3.5"/> 保存
                        </button>
                        <button onClick={() => setEditing(false)}
                                className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent">取消</button>
                    </div>
                </section>
            )}

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="size-5 animate-spin"/></div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {current.map(item => (
                        <div key={item.id} className="space-y-2 rounded-xl border bg-card p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{item.name}</span>
                                        {item.builtin && (
                                            <span className="rounded bg-slate-500/15 px-1.5 py-0.5 text-[10px] text-slate-300">内置</span>
                                        )}
                                        {item.enabled === false && (
                                            <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] text-rose-300">已停用</span>
                                        )}
                                    </div>
                                    <div className="mt-0.5 text-xs text-muted-foreground">{item.code}</div>
                                </div>
                                {!item.builtin && (
                                    <div className="flex gap-1">
                                        <button disabled={busy} onClick={() => startEdit(item)}
                                                className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent">编辑</button>
                                        <button disabled={busy} onClick={() => void handleDelete(item.id)}
                                                title="删除"
                                                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-rose-400 disabled:opacity-50">
                                            <Trash2 className="size-3.5"/>
                                        </button>
                                    </div>
                                )}
                            </div>
                            {item.description && (
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                            {tab === "connectors" && (
                                <div className="text-xs text-muted-foreground">类型：{(item as ConnectorDef).type}</div>
                            )}
                            {tab === "agents" && (item as AgentDef).skillsJson && (
                                <div className="truncate text-xs text-muted-foreground">技能：{(item as AgentDef).skillsJson}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
