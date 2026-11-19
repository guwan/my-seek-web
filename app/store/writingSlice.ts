import {createSlice, type PayloadAction} from '@reduxjs/toolkit';
import type {Chapter, Character, Novel, OutlinePoint, Volume, WorldEntry, WritingState} from "~/services/writing";
import {
    createChapter,
    createNovel,
    createVolume,
    loadWritingState,
    newId,
    saveWritingState,
} from "~/services/writingStorage";

const initialState: WritingState = loadWritingState();

/** 找到章节所属作品与卷 */
function findChapterLocation(state: WritingState, chapterId: string) {
    for (const novel of state.novels) {
        for (const volume of novel.volumes) {
            if (volume.chapters.some(c => c.id === chapterId)) {
                return {novel, volume};
            }
        }
    }
    return null;
}

const writingSlice = createSlice({
    name: 'writing',
    initialState,
    reducers: {
        // ---- 作品 ----
        addNovel(state, action: PayloadAction<Novel | undefined>) {
            const novel = action.payload ?? createNovel();
            state.novels.unshift(novel);
            state.activeNovelId = novel.id;
            state.activeChapterId = novel.volumes[0].chapters[0].id;
        },
        renameNovel(state, action: PayloadAction<{id: string; title: string}>) {
            const novel = state.novels.find(n => n.id === action.payload.id);
            if (novel) {
                novel.title = action.payload.title;
                novel.updatedAt = Date.now();
            }
        },
        updateNovelMeta(state, action: PayloadAction<{id: string; patch: Partial<Pick<Novel, 'genre' | 'description' | 'style' | 'cover'>>}>) {
            const novel = state.novels.find(n => n.id === action.payload.id);
            if (novel) {
                Object.assign(novel, action.payload.patch);
                novel.updatedAt = Date.now();
            }
        },
        deleteNovel(state, action: PayloadAction<string>) {
            state.novels = state.novels.filter(n => n.id !== action.payload);
            if (state.activeNovelId === action.payload) {
                const next = state.novels[0];
                state.activeNovelId = next?.id ?? null;
                state.activeChapterId = next?.volumes[0]?.chapters[0]?.id ?? null;
            }
            if (state.novels.length === 0) {
                const novel = createNovel();
                state.novels.push(novel);
                state.activeNovelId = novel.id;
                state.activeChapterId = novel.volumes[0].chapters[0].id;
            }
        },
        selectNovel(state, action: PayloadAction<string>) {
            const novel = state.novels.find(n => n.id === action.payload);
            if (novel) {
                state.activeNovelId = action.payload;
                state.activeChapterId = novel.volumes[0]?.chapters[0]?.id ?? null;
            }
        },

        // ---- 卷 ----
        addVolume(state, action: PayloadAction<string>) {
            const novel = state.novels.find(n => n.id === action.payload);
            if (novel) {
                novel.volumes.push(createVolume(`第${novel.volumes.length + 1}卷`));
                novel.updatedAt = Date.now();
            }
        },
        renameVolume(state, action: PayloadAction<{novelId: string; volumeId: string; title: string}>) {
            const novel = state.novels.find(n => n.id === action.payload.novelId);
            const volume = novel?.volumes.find(v => v.id === action.payload.volumeId);
            if (volume) volume.title = action.payload.title;
        },
        deleteVolume(state, action: PayloadAction<{novelId: string; volumeId: string}>) {
            const novel = state.novels.find(n => n.id === action.payload.novelId);
            if (!novel || novel.volumes.length <= 1) return;
            novel.volumes = novel.volumes.filter(v => v.id !== action.payload.volumeId);
            if (!findChapterLocation(state, state.activeChapterId ?? "")) {
                state.activeChapterId = novel.volumes[0]?.chapters[0]?.id ?? null;
            }
        },

        // ---- 章节 ----
        addChapter(state, action: PayloadAction<{novelId: string; volumeId: string}>) {
            const novel = state.novels.find(n => n.id === action.payload.novelId);
            const volume = novel?.volumes.find(v => v.id === action.payload.volumeId);
            if (volume) {
                const chapter = createChapter(`第${volume.chapters.length + 1}章`);
                volume.chapters.push(chapter);
                state.activeChapterId = chapter.id;
                if (novel) novel.updatedAt = Date.now();
            }
        },
        selectChapter(state, action: PayloadAction<string>) {
            state.activeChapterId = action.payload;
        },
        updateChapter(state, action: PayloadAction<{novelId: string; chapterId: string; patch: Partial<Chapter>}>) {
            const novel = state.novels.find(n => n.id === action.payload.novelId);
            const chapter = novel?.volumes.flatMap(v => v.chapters).find(c => c.id === action.payload.chapterId);
            if (chapter) {
                Object.assign(chapter, action.payload.patch, {updatedAt: Date.now()});
                if (novel) novel.updatedAt = Date.now();
            }
        },
        deleteChapter(state, action: PayloadAction<{novelId: string; chapterId: string}>) {
            const novel = state.novels.find(n => n.id === action.payload.novelId);
            if (!novel) return;
            for (const volume of novel.volumes) {
                if (volume.chapters.some(c => c.id === action.payload.chapterId)) {
                    volume.chapters = volume.chapters.filter(c => c.id !== action.payload.chapterId);
                    break;
                }
            }
            if (state.activeChapterId === action.payload.chapterId) {
                state.activeChapterId = novel.volumes.flatMap(v => v.chapters)[0]?.id ?? null;
            }
        },

        // ---- 设定：角色 / 世界观 / 大纲 ----
        addCharacter(state, action: PayloadAction<string>) {
            const novel = state.novels.find(n => n.id === action.payload);
            if (novel) novel.characters.push({id: newId(), name: "新角色", role: "", description: ""});
        },
        updateCharacter(state, action: PayloadAction<{novelId: string; id: string; patch: Partial<Character>}>) {
            const novel = state.novels.find(n => n.id === action.payload.novelId);
            const item = novel?.characters.find(c => c.id === action.payload.id);
            if (item) Object.assign(item, action.payload.patch);
        },
        deleteCharacter(state, action: PayloadAction<{novelId: string; id: string}>) {
            const novel = state.novels.find(n => n.id === action.payload.novelId);
            if (novel) novel.characters = novel.characters.filter(c => c.id !== action.payload.id);
        },
        addWorldEntry(state, action: PayloadAction<string>) {
            const novel = state.novels.find(n => n.id === action.payload);
            if (novel) novel.world.push({id: newId(), title: "新设定", content: ""});
        },
        updateWorldEntry(state, action: PayloadAction<{novelId: string; id: string; patch: Partial<WorldEntry>}>) {
            const novel = state.novels.find(n => n.id === action.payload.novelId);
            const item = novel?.world.find(w => w.id === action.payload.id);
            if (item) Object.assign(item, action.payload.patch);
        },
        deleteWorldEntry(state, action: PayloadAction<{novelId: string; id: string}>) {
            const novel = state.novels.find(n => n.id === action.payload.novelId);
            if (novel) novel.world = novel.world.filter(w => w.id !== action.payload.id);
        },
        addOutline(state, action: PayloadAction<string>) {
            const novel = state.novels.find(n => n.id === action.payload);
            if (novel) novel.outline.push({id: newId(), title: "新情节点", content: "", done: false});
        },
        updateOutline(state, action: PayloadAction<{novelId: string; id: string; patch: Partial<OutlinePoint>}>) {
            const novel = state.novels.find(n => n.id === action.payload.novelId);
            const item = novel?.outline.find(o => o.id === action.payload.id);
            if (item) Object.assign(item, action.payload.patch);
        },
        deleteOutline(state, action: PayloadAction<{novelId: string; id: string}>) {
            const novel = state.novels.find(n => n.id === action.payload.novelId);
            if (novel) novel.outline = novel.outline.filter(o => o.id !== action.payload.id);
        },

        // ---- 选中 ----
        selectNovelAndChapter(state, action: PayloadAction<{novelId: string; chapterId: string}>) {
            state.activeNovelId = action.payload.novelId;
            state.activeChapterId = action.payload.chapterId;
        },
    },
});

export const {
    addNovel, renameNovel, updateNovelMeta, deleteNovel, selectNovel,
    addVolume, renameVolume, deleteVolume,
    addChapter, selectChapter, updateChapter, deleteChapter,
    addCharacter, updateCharacter, deleteCharacter,
    addWorldEntry, updateWorldEntry, deleteWorldEntry,
    addOutline, updateOutline, deleteOutline,
    selectNovelAndChapter,
} = writingSlice.actions;

/** 每次写作状态变化后持久化到 localStorage */
export function persistWriting(state: {writing: WritingState}) {
    saveWritingState(state.writing);
}

export default writingSlice.reducer;
