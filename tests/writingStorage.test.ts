import {describe, expect, it} from "vitest";
import {countNovelWords, countWords, createChapter, createNovel, createVolume} from "~/services/writingStorage";

describe("writingStorage", () => {
    it("按中文字和英文词统计字数", () => {
        expect(countWords("你好 world 123")).toBe(4);
        expect(countWords("")).toBe(0);
    });

    it("统计整本书字数", () => {
        const novel = createNovel("测试");
        novel.volumes[0].chapters[0].content = "第一章你好";
        const volume = createVolume("第二卷");
        volume.chapters.push(createChapter("第二章"));
        volume.chapters[0].content = "hello 世界";
        novel.volumes.push(volume);
        expect(countNovelWords(novel)).toBe(8);
    });

    it("新建作品包含默认卷章节和风格字段", () => {
        const novel = createNovel("仿写测试", "冷峻克制");
        expect(novel.title).toBe("仿写测试");
        expect(novel.style).toBe("冷峻克制");
        expect(novel.volumes).toHaveLength(1);
        expect(novel.volumes[0].chapters).toHaveLength(1);
        expect(novel.volumes[0].chapters[0].status).toBe("draft");
    });
});
