import {getUserToken} from "~/lib/AuthUtils";
import type {Novel, WritingState} from "~/services/writing";
import {deleteWritingNovel, listWritingNovels, saveWritingNovel} from "~/services/writingService";
import {replaceWritingFromServer} from "~/store/writingSlice";

interface StoreLike {
    dispatch: (action: unknown) => unknown;
    getState: () => {writing: WritingState};
}

let storeRef: StoreLike | null = null;
let lastToken: string | null = null;
let initPromise: Promise<void> | null = null;
let syncPromise: Promise<void> | null = null;
let syncQueued = false;

/** 已确认写入服务端的作品快照，用于增量同步与删除检测 */
const syncedSnapshots = new Map<string, string>();

export function configureWritingSync(store: StoreLike): void {
    storeRef = store;
}

function snapshot(novel: Novel): string {
    return JSON.stringify(novel);
}

/** 账号切换时清空上一账号的同步状态，避免误删或误传 */
function detectAccountChange(): void {
    const token = getUserToken();
    if (token === lastToken) return;
    lastToken = token;
    initPromise = null;
    syncPromise = null;
    syncedSnapshots.clear();
}

async function loadFromServer(): Promise<void> {
    const token = getUserToken();
    const res = await listWritingNovels();
    // 请求期间账号已切换：丢弃旧账号数据
    if (getUserToken() !== token) return;
    if (!res.success) throw new Error(res.msg || "加载云端作品失败");
    const remote = Array.isArray(res.data) ? res.data : [];
    syncedSnapshots.clear();
    remote.forEach(novel => syncedSnapshots.set(novel.id, snapshot(novel)));
    storeRef?.dispatch(replaceWritingFromServer(remote));
}

/** 登录后才可访问云端；初始化失败时继续保留本地数据 */
export function ensureWritingSyncInitialized(): Promise<void> {
    if (typeof window === "undefined" || !storeRef || !getUserToken()) return Promise.resolve();
    detectAccountChange();
    if (!initPromise) {
        initPromise = loadFromServer().catch(err => {
            console.warn("[写作] 云端作品加载失败，继续使用本地数据", err);
        });
    }
    return initPromise;
}

async function performSync(): Promise<void> {
    const token = getUserToken();
    await ensureWritingSyncInitialized();
    if (!storeRef || getUserToken() !== token) return;

    const novels = storeRef.getState().writing.novels;
    const currentIds = new Set(novels.map(novel => novel.id));

    for (const novel of novels) {
        const serialized = snapshot(novel);
        if (syncedSnapshots.get(novel.id) === serialized) continue;
        try {
            await saveWritingNovel(novel);
            syncedSnapshots.set(novel.id, serialized);
        } catch (err) {
            console.warn(`[写作] 作品《${novel.title}》保存失败，稍后重试`, err);
        }
    }

    for (const id of [...syncedSnapshots.keys()]) {
        if (currentIds.has(id)) continue;
        try {
            await deleteWritingNovel(id);
            syncedSnapshots.delete(id);
        } catch (err) {
            console.warn(`[写作] 云端作品删除失败: ${id}`, err);
        }
    }
}

/**
 * 把本地作品变更推送到服务端。重复调用会合并为一次，避免高频输入打满接口。
 */
export function syncWritingToServer(): Promise<void> {
    if (typeof window === "undefined" || !storeRef || !getUserToken()) return Promise.resolve();
    detectAccountChange();
    if (syncPromise) {
        syncQueued = true;
        return syncPromise;
    }
    syncPromise = performSync()
        .catch(err => console.warn("[写作] 云端同步失败", err))
        .finally(() => {
            syncPromise = null;
            if (syncQueued) {
                syncQueued = false;
                void syncWritingToServer();
            }
        });
    return syncPromise;
}
