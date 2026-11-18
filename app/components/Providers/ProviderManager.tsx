import {useEffect, useState} from 'react';
import {Loader2, PlugZap, Plus, Trash2, Plug, CheckCircle2, XCircle, Pencil} from "lucide-react";
import {message} from "~/components/Message";
import {
    createProvider, deleteProvider, getProviders, testProvider, toggleProvider, updateProvider,
    type AiProvider,
} from "~/services/providerService";
import {useAppDispatch} from "~/store";
import {fetchModels} from "~/store/modelSlice";

const emptyForm = () => ({
    id: "" as string,
    name: "",
    displayName: "",
    baseUrl: "",
    apiKey: "",
    modelsText: "",
    enabled: true,
});

type FormState = ReturnType<typeof emptyForm>;

export default function ProviderManager() {
    const dispatch = useAppDispatch();
    const [providers, setProviders] = useState<AiProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<FormState>(emptyForm());
    const [testing, setTesting] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await getProviders();
            if (res.success) setProviders(res.data ?? []);
            else message.error(res.msg || "加载接口列表失败");
        } catch (e: any) {
            message.error(e?.message || "加载接口列表失败");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void load(); }, []);

    const startCreate = () => {
        setForm(emptyForm());
        setEditing(true);
    };

    const startEdit = (p: AiProvider) => {
        setForm({
            id: p.id ?? "",
            name: p.name,
            displayName: p.displayName,
            baseUrl: p.baseUrl,
            apiKey: "",
            modelsText: (p.models ?? []).join("\n"),
            enabled: p.enabled,
        });
        setEditing(true);
    };

    const buildPayload = () => ({
        name: form.name.trim(),
        displayName: form.displayName.trim(),
        baseUrl: form.baseUrl.trim(),
        apiKey: form.apiKey.trim(),
        models: form.modelsText.split(/[\n,]/).map(s => s.trim()).filter(Boolean),
        enabled: form.enabled,
    });

    const handleSave = async () => {
        const payload = buildPayload();
        if (!payload.name || !payload.displayName || !payload.baseUrl) {
            message.error("请填写接口标识、显示名称和 base-url");
            return;
        }
        if (payload.models.length === 0) {
            message.error("请至少填写一个模型名称");
            return;
        }
        try {
            const res = form.id
                ? await updateProvider(form.id, payload)
                : await createProvider(payload);
            if (res.success) {
                message.success(form.id ? "接口已更新" : "接口已添加");
                setEditing(false);
                await load();
                dispatch(fetchModels());
            } else {
                message.error(res.msg || "保存失败");
            }
        } catch (e: any) {
            message.error(e?.message || "保存失败");
        }
    };

    const handleTest = async () => {
        const payload = buildPayload();
        if (form.id) (payload as any).id = form.id;
        if (!payload.baseUrl || (payload.models.length === 0)) {
            message.error("请填写 base-url 和至少一个模型");
            return;
        }
        setTesting(true);
        try {
            const res = await testProvider(payload as any);
            if (res.success) message.success("连接成功，接口可用");
            else message.error(res.msg || "连接失败");
        } catch (e: any) {
            message.error(e?.message || "连接失败");
        } finally {
            setTesting(false);
        }
    };

    const handleDelete = async (p: AiProvider) => {
        if (!p.id) return;
        if (!confirm(`确定删除「${p.displayName}」吗？使用其模型的会话将无法继续生成。`)) return;
        try {
            const res = await deleteProvider(p.id);
            if (res.success) {
                message.success("已删除");
                await load();
                dispatch(fetchModels());
            } else message.error(res.msg || "删除失败");
        } catch (e: any) {
            message.error(e?.message || "删除失败");
        }
    };

    const handleToggle = async (p: AiProvider) => {
        if (!p.id) return;
        try {
            const res = await toggleProvider(p.id, !p.enabled);
            if (res.success) {
                await load();
                dispatch(fetchModels());
            } else message.error(res.msg || "操作失败");
        } catch (e: any) {
            message.error(e?.message || "操作失败");
        }
    };

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">第三方 AI 接口</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        添加任何兼容 OpenAI Chat Completions 协议的服务（DeepSeek、Moonshot、智谱、OpenAI 等）。
                        添加后模型会出现在对话页的模型选择器中。
                    </p>
                </div>
                <button
                    onClick={startCreate}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    <Plus className="size-4"/> 添加接口
                </button>
            </div>

            {editing && (
                <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
                    <h2 className="font-medium">{form.id ? "编辑接口" : "新建接口"}</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="接口标识（英文，作为模型前缀）">
                            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                                   placeholder="deepseek" disabled={!!form.id}
                                   className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"/>
                        </Field>
                        <Field label="显示名称">
                            <input value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})}
                                   placeholder="DeepSeek 官方" className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"/>
                        </Field>
                    </div>
                    <Field label="Base URL（OpenAI 兼容地址，可不带 /v1）">
                        <input value={form.baseUrl} onChange={e => setForm({...form, baseUrl: e.target.value})}
                               placeholder="https://api.deepseek.com" className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"/>
                    </Field>
                    <Field label={form.id ? "API Key（留空表示沿用原 Key）" : "API Key"}>
                        <input type="password" value={form.apiKey} onChange={e => setForm({...form, apiKey: e.target.value})}
                               placeholder="sk-..." className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40" autoComplete="new-password"/>
                    </Field>
                    <Field label="模型列表（每行一个模型名）">
                        <textarea value={form.modelsText} onChange={e => setForm({...form, modelsText: e.target.value})}
                                  placeholder={"deepseek-chat\ndeepseek-reasoner"}
                                  rows={3} className="input-cls resize-none"/>
                    </Field>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.enabled}
                               onChange={e => setForm({...form, enabled: e.target.checked})}/>
                        启用该接口
                    </label>
                    <div className="flex gap-2 pt-1">
                        <button onClick={handleSave}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                            保存
                        </button>
                        <button onClick={handleTest} disabled={testing}
                                className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50">
                            {testing ? <Loader2 className="size-4 animate-spin"/> : <PlugZap className="size-4"/>}
                            测试连接
                        </button>
                        <button onClick={() => setEditing(false)} className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-accent">
                            取消
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground"/></div>
            ) : (
                <div className="space-y-3">
                    {providers.map(p => (
                        <div key={p.id ?? p.name} className="flex items-start gap-4 rounded-xl border bg-card p-4">
                            <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${
                                p.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            }`}>
                                <Plug className="size-4"/>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium">{p.displayName}</span>
                                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{p.name}</code>
                                    {p.builtIn && <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-secondary-foreground">内置</span>}
                                    {p.enabled
                                        ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="size-3.5"/>已启用</span>
                                        : <span className="flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="size-3.5"/>已停用</span>}
                                </div>
                                <p className="mt-1 truncate text-xs text-muted-foreground">{p.baseUrl}</p>
                                {p.apiKeyMasked && <p className="mt-0.5 text-xs text-muted-foreground">Key: {p.apiKeyMasked}</p>}
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {(p.models ?? []).map(m => (
                                        <span key={m} className="rounded-md bg-muted px-2 py-0.5 text-[11px]">{m}</span>
                                    ))}
                                </div>
                            </div>
                            {!p.builtIn && p.id && (
                                <div className="flex shrink-0 gap-1">
                                    <button onClick={() => handleToggle(p)} title={p.enabled ? "停用" : "启用"}
                                            className="rounded-md p-2 text-muted-foreground hover:bg-accent">
                                        {p.enabled ? <XCircle className="size-4"/> : <CheckCircle2 className="size-4"/>}
                                    </button>
                                    <button onClick={() => startEdit(p)} title="编辑"
                                            className="rounded-md p-2 text-muted-foreground hover:bg-accent">
                                        <Pencil className="size-4"/>
                                    </button>
                                    <button onClick={() => handleDelete(p)} title="删除"
                                            className="rounded-md p-2 text-muted-foreground hover:text-destructive hover:bg-accent">
                                        <Trash2 className="size-4"/>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
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
