import {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {Loader2, Pencil, Plus, Search, ShieldCheck, Trash2, Users, X} from "lucide-react";
import {message} from "~/components/Message";
import type {RootState} from "~/store";
import {
    createUser,
    deleteUsers,
    queryAllRoles,
    queryUsers,
    updateUser,
    updateUserRoles,
    type RoleOption,
    type UserAccount,
    type UserFormPayload,
} from "~/services/userService";

const PAGE_SIZE = 10;

const emptyForm = (): UserFormPayload => ({
    name: "",
    username: "",
    phone: "",
    email: "",
    level: 1,
    enabled: true,
    password: "",
    access: "user",
});

type FormState = UserFormPayload;

export default function UserManager() {
    const currentUserId = useSelector((state: RootState) => state.currentUserSetter.value.id);
    const [users, setUsers] = useState<UserAccount[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [keyword, setKeyword] = useState("");
    const [enabledFilter, setEnabledFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<FormState>(emptyForm());
    const [saving, setSaving] = useState(false);

    const loadRoles = async () => {
        try {
            const res = await queryAllRoles();
            if (!res.success) return;
            const all = res.data?.treeData ?? [];
            setRoles(all.filter(r => r.authority === "admin" || r.authority === "user"));
        } catch {
            // 角色列表加载失败时，新建仍可使用 admin/user 文本值
        }
    };

    const load = async () => {
        setLoading(true);
        try {
            const data = await queryUsers({
                current: page,
                pageSize: PAGE_SIZE,
                username: keyword.trim() || undefined,
                enabled: enabledFilter === "" ? undefined : enabledFilter === "true",
            });
            setUsers(data.data ?? []);
            setTotal(data.total ?? 0);
        } catch (e: any) {
            message.error(e?.message || "加载用户列表失败");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadRoles();
    }, []);

    useEffect(() => {
        void load();
    }, [page, enabledFilter]);

    const openCreate = () => {
        setEditing(false);
        setForm(emptyForm());
        setFormOpen(true);
    };

    const openEdit = (user: UserAccount) => {
        setEditing(true);
        setForm({
            id: user.id,
            name: user.name,
            username: user.username || user.userid,
            phone: user.phone,
            email: user.email,
            level: 1,
            enabled: user.enabled ?? true,
            password: "",
            access: user.access || "user",
        });
        setFormOpen(true);
    };

    const handleSave = async () => {
        if (!form.username?.trim()) {
            message.error("请填写登录名");
            return;
        }
        if (!editing && !form.password?.trim()) {
            message.error("请填写初始密码");
            return;
        }
        if (form.password && form.password.length < 6) {
            message.error("密码长度不能少于 6 位");
            return;
        }

        setSaving(true);
        try {
            if (editing) {
                const res = await updateUser({
                    ...form,
                    id: form.id,
                    username: form.username.trim(),
                    password: form.password?.trim() || undefined,
                });
                if (!res.success) {
                    message.error(res.msg || "更新失败");
                    return;
                }
                const role = roles.find(r => r.authority === form.access);
                if (role?.id) {
                    const roleRes = await updateUserRoles(form.id!, [role.id]);
                    if (!roleRes.success) message.error(roleRes.msg || "角色更新失败");
                }
                message.success("用户已更新");
            } else {
                const res = await createUser({
                    ...form,
                    username: form.username.trim(),
                    password: form.password!.trim(),
                });
                if (!res.success) {
                    message.error(res.msg || "创建失败");
                    return;
                }
                message.success("用户已创建");
            }
            setFormOpen(false);
            await load();
        } catch (e: any) {
            message.error(e?.message || "保存失败");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user: UserAccount) => {
        if (!user.id) return;
        if (user.id === currentUserId) {
            message.error("不能删除当前登录用户");
            return;
        }
        if (!confirm(`确定删除用户「${user.name || user.username || user.userid || user.id}」吗？`)) return;
        try {
            const res = await deleteUsers([user.id]);
            if (res.success) {
                message.success("已删除");
                await load();
            } else message.error(res.msg || "删除失败");
        } catch (e: any) {
            message.error(e?.message || "删除失败");
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold">
                        <Users className="size-6 text-primary"/> 用户管理
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        创建内部账号、维护基础信息并分配角色。仅管理员可访问。
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    <Plus className="size-4"/> 新建用户
                </button>
            </div>

            <div className="flex flex-wrap gap-3 rounded-xl border bg-card p-4">
                <label className="flex min-w-48 flex-1 items-center gap-2 rounded-lg border bg-background px-3 py-2">
                    <Search className="size-4 text-muted-foreground"/>
                    <input
                        value={keyword}
                        onChange={e => setKeyword(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === "Enter") {
                                setPage(1);
                                void load();
                            }
                        }}
                        placeholder="按登录名搜索"
                        className="w-full bg-transparent text-sm outline-none"
                    />
                </label>
                <select
                    value={enabledFilter}
                    onChange={e => {
                        setEnabledFilter(e.target.value);
                        setPage(1);
                    }}
                    className="rounded-lg border bg-background px-3 py-2 text-sm"
                >
                    <option value="">全部状态</option>
                    <option value="true">已启用</option>
                    <option value="false">已停用</option>
                </select>
                <button
                    onClick={() => {
                        setPage(1);
                        void load();
                    }}
                    className="rounded-lg border px-4 py-2 text-sm hover:bg-accent"
                >
                    搜索
                </button>
            </div>

            <section className="overflow-hidden rounded-xl border bg-card">
                {loading ? (
                    <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-muted-foreground"/></div>
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-16 text-sm text-muted-foreground">
                        <Users className="size-8 opacity-40"/>
                        <p>没有匹配的用户</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {users.map(user => (
                            <div key={user.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                                    {(user.name || user.username || user.userid || "?").slice(0, 1).toUpperCase()}
                                </div>
                                <div className="min-w-48 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{user.name || user.userid || "未命名用户"}</span>
                                        <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                                            {user.username || user.userid || "-"}
                                        </code>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {user.email || "未填写邮箱"} · {user.phone || "未填写手机"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className={`flex items-center gap-1 rounded px-2 py-1 ${
                                        user.access === "admin"
                                            ? "bg-violet-500/10 text-violet-600"
                                            : "bg-muted text-muted-foreground"
                                    }`}>
                                        <ShieldCheck className="size-3.5"/>
                                        {user.access === "admin" ? "管理员" : "普通用户"}
                                    </span>
                                    <span className={`rounded px-2 py-1 ${
                                        user.enabled === false
                                            ? "bg-destructive/10 text-destructive"
                                            : "bg-green-500/10 text-green-600"
                                    }`}>
                                        {user.enabled === false ? "已停用" : "已启用"}
                                    </span>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEdit(user)} title="编辑" className="rounded-md p-2 text-muted-foreground hover:bg-accent">
                                        <Pencil className="size-4"/>
                                    </button>
                                    <button onClick={() => void handleDelete(user)} title="删除" className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-destructive">
                                        <Trash2 className="size-4"/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
                        <span>共 {total} 个用户，第 {page} / {totalPages} 页</span>
                        <div className="flex gap-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="rounded border px-2 py-1 disabled:opacity-40"
                            >
                                上一页
                            </button>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="rounded border px-2 py-1 disabled:opacity-40"
                            >
                                下一页
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {formOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setFormOpen(false)}>
                    <div
                        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border bg-card p-6 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">{editing ? "编辑用户" : "新建用户"}</h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    登录名创建后不可修改；编辑时不填密码表示保持原密码。
                                </p>
                            </div>
                            <button onClick={() => setFormOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-accent">
                                <X className="size-4"/>
                            </button>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <Field label="登录名">
                                <input
                                    value={form.username ?? ""}
                                    disabled={editing}
                                    onChange={e => setForm({...form, username: e.target.value})}
                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-60"
                                    placeholder="至少 4 位"
                                />
                            </Field>
                            <Field label="显示名称">
                                <input
                                    value={form.name ?? ""}
                                    disabled={editing}
                                    onChange={e => setForm({...form, name: e.target.value})}
                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-60"
                                />
                            </Field>
                            <Field label={editing ? "新密码（可选）" : "初始密码"}>
                                <input
                                    type="password"
                                    value={form.password ?? ""}
                                    onChange={e => setForm({...form, password: e.target.value})}
                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                                    placeholder="至少 6 位"
                                />
                            </Field>
                            <Field label="角色">
                                <select
                                    value={form.access ?? "user"}
                                    onChange={e => setForm({...form, access: e.target.value})}
                                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                                >
                                    {(roles.length ? roles : [
                                        {authority: "admin", title: "管理员"},
                                        {authority: "user", title: "普通用户"},
                                    ]).map(role => (
                                        <option key={role.authority} value={role.authority}>
                                            {role.title || role.authority}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="手机">
                                <input value={form.phone ?? ""} onChange={e => setForm({...form, phone: e.target.value})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"/>
                            </Field>
                            <Field label="邮箱">
                                <input value={form.email ?? ""} onChange={e => setForm({...form, email: e.target.value})} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"/>
                            </Field>
                        </div>

                        <label className="mt-4 flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.enabled ?? true}
                                onChange={e => setForm({...form, enabled: e.target.checked})}
                            />
                            启用该账号
                        </label>

                        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                            <button onClick={() => setFormOpen(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-accent">
                                取消
                            </button>
                            <button
                                onClick={() => void handleSave()}
                                disabled={saving}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                            >
                                {saving ? "保存中…" : "保存"}
                            </button>
                        </div>
                    </div>
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
