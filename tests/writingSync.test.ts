import {describe, expect, it} from "vitest";
import type {Novel, WritingState} from "~/services/writing";
import {createNovel} from "~/services/writingStorage";
import reducer, {replaceWritingFromServer} from "~/store/writingSlice";

function stateOf(novels: Novel[], activeNovelId: string | null = null, activeChapterId: string | null = null): WritingState {
    return {novels, activeNovelId, activeChapterId};
}

describe("写作作品云端合并", () => {
    it("同 id 保留 updatedAt 较新的本地离线修改", () => {
        const local = createNovel("本地修改", "冷峻");
        local.updatedAt = 200;
        local.title = "本地更新";
        const remote: Novel = {...local, title: "云端旧版", updatedAt: 100};

        const next = reducer(stateOf([local]), replaceWritingFromServer([remote]));

        expect(next.novels).toHaveLength(1);
        expect(next.novels[0].title).toBe("本地更新");
    });

    it("保留本地独有作品等待上传", () => {
        const local = createNovel("本地独有");
        const remote = createNovel("云端作品");

        const next = reducer(stateOf([local]), replaceWritingFromServer([remote]));

        expect(next.novels.map(n => n.title)).toEqual(["云端作品", "本地独有"]);
    });

    it("云端返回空列表时不清除本地作品", () => {
        const local = createNovel("本地作品");
        const next = reducer(stateOf([local]), replaceWritingFromServer([]));
        expect(next.novels).toHaveLength(1);
    });

    it("选中项失效时回退到第一本的第一章", () => {
        const novel = createNovel("云端作品");
        const next = reducer(stateOf([], "已删除", "已删除"), replaceWritingFromServer([novel]));

        expect(next.activeNovelId).toBe(novel.id);
        expect(next.activeChapterId).toBe(novel.volumes[0].chapters[0].id);
    });
});
