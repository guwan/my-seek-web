import {useState} from 'react';
import {Trash2} from "lucide-react";
import type {Novel, WorldEntry} from "~/services/writing";
import {
    addCharacter, addOutline, addWorldEntry,
    deleteCharacter, deleteOutline, deleteWorldEntry,
    updateCharacter, updateNovelMeta, updateOutline, updateWorldEntry,
} from "~/store/writingSlice";
import {useAppDispatch} from "~/store";

type Tab = "outline" | "characters" | "world" | "style";

const TABS: {key: Tab; label: string}[] = [
    {key: "outline", label: "大纲"},
    {key: "characters", label: "角色"},
    {key: "world", label: "世界观"},
    {key: "style", label: "风格"},
];

export default function SettingsPanel({novel, activeChapterOutline, onChapterOutlineChange}: {
    novel: Novel;
    activeChapterOutline: string;
    onChapterOutlineChange: (value: string) => void;
}) {
    const [tab, setTab] = useState<Tab>("outline");
    const dispatch = useAppDispatch();
    const novelId = novel.id;

    return (
        <div className="flex h-full min-h-0 flex-col gap-3">
            <div className="flex rounded-lg bg-muted p-1">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex-1 rounded-md py-1.5 text-sm transition-colors ${
                            tab === t.key ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
                {tab === "outline" && (
                    <>
                        <div>
                            <label className="mb-1 block text-xs text-muted-foreground">本章大纲</label>
                            <textarea
                                value={activeChapterOutline}
                                onChange={e => onChapterOutlineChange(e.target.value)}
                                placeholder="本章要发生的情节点……"
                                rows={3}
                                className="w-full resize-none rounded-lg border bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                            />
                        </div>
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-medium">全书大纲</span>
                            <button onClick={() => dispatch(addOutline(novelId))} className="text-xs text-primary hover:underline">
                                + 添加情节点
                            </button>
                        </div>
                        {novel.outline.map((o, i) => (
                            <div key={o.id} className="rounded-lg border p-2.5">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={o.done}
                                        onChange={e => dispatch(updateOutline({novelId, id: o.id, patch: {done: e.target.checked}}))}
                                    />
                                    <input
                                        value={o.title}
                                        onChange={e => dispatch(updateOutline({novelId, id: o.id, patch: {title: e.target.value}}))}
                                        className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
                                    />
                                    <button onClick={() => dispatch(deleteOutline({novelId, id: o.id}))} className="text-muted-foreground hover:text-destructive">
                                        <Trash2 className="size-3.5"/>
                                    </button>
                                </div>
                                <textarea
                                    value={o.content}
                                    onChange={e => dispatch(updateOutline({novelId, id: o.id, patch: {content: e.target.value}}))}
                                    placeholder="情节描述"
                                    rows={2}
                                    className="mt-1.5 w-full resize-none bg-transparent text-sm text-muted-foreground outline-none"
                                />
                            </div>
                        ))}
                    </>
                )}

                {tab === "characters" && (
                    <>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">人物设定（{novel.characters.length}）</span>
                            <button onClick={() => dispatch(addCharacter(novelId))} className="text-xs text-primary hover:underline">
                                + 添加角色
                            </button>
                        </div>
                        {novel.characters.map(c => (
                            <div key={c.id} className="space-y-1.5 rounded-lg border p-2.5">
                                <div className="flex items-center gap-2">
                                    <input
                                        value={c.name}
                                        onChange={e => dispatch(updateCharacter({novelId, id: c.id, patch: {name: e.target.value}}))}
                                        className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
                                    />
                                    <button onClick={() => dispatch(deleteCharacter({novelId, id: c.id}))} className="text-muted-foreground hover:text-destructive">
                                        <Trash2 className="size-3.5"/>
                                    </button>
                                </div>
                                <input
                                    value={c.role}
                                    onChange={e => dispatch(updateCharacter({novelId, id: c.id, patch: {role: e.target.value}}))}
                                    placeholder="身份 / 定位，如：主角、反派"
                                    className="w-full bg-transparent text-xs text-primary outline-none"
                                />
                                <textarea
                                    value={c.description}
                                    onChange={e => dispatch(updateCharacter({novelId, id: c.id, patch: {description: e.target.value}}))}
                                    placeholder="性格、外貌、动机……"
                                    rows={2}
                                    className="w-full resize-none bg-transparent text-sm text-muted-foreground outline-none"
                                />
                            </div>
                        ))}
                        {novel.characters.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">还没有角色，点上方添加</p>}
                    </>
                )}

                {tab === "world" && (
                    <>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">世界观设定（{novel.world.length}）</span>
                            <button onClick={() => dispatch(addWorldEntry(novelId))} className="text-xs text-primary hover:underline">
                                + 添加设定
                            </button>
                        </div>
                        {novel.world.map((w: WorldEntry) => (
                            <div key={w.id} className="space-y-1.5 rounded-lg border p-2.5">
                                <div className="flex items-center gap-2">
                                    <input
                                        value={w.title}
                                        onChange={e => dispatch(updateWorldEntry({novelId, id: w.id, patch: {title: e.target.value}}))}
                                        className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
                                    />
                                    <button onClick={() => dispatch(deleteWorldEntry({novelId, id: w.id}))} className="text-muted-foreground hover:text-destructive">
                                        <Trash2 className="size-3.5"/>
                                    </button>
                                </div>
                                <textarea
                                    value={w.content}
                                    onChange={e => dispatch(updateWorldEntry({novelId, id: w.id, patch: {content: e.target.value}}))}
                                    placeholder="规则、地理、势力、历史……"
                                    rows={3}
                                    className="w-full resize-none bg-transparent text-sm text-muted-foreground outline-none"
                                />
                            </div>
                        ))}
                        {novel.world.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">还没有设定，点上方添加</p>}
                    </>
                )}

                {tab === "style" && (
                    <div className="space-y-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium">仿写风格描述</label>
                            <textarea
                                value={novel.style ?? ""}
                                onChange={e => dispatch(updateNovelMeta({
                                    id: novelId,
                                    patch: {style: e.target.value},
                                }))}
                                placeholder="例如：冷峻克制的第三人称限知视角；短句为主；大量环境细节；情绪压在动作里，不直接抒情……"
                                rows={8}
                                className="w-full resize-none rounded-lg border bg-background p-2.5 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring/40"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                仿写不依赖范文，只按这里的题材、人称、节奏、句式与语言密度生成内容。
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
