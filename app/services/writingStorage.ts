import type {Chapter, Novel, Volume, WritingState} from "~/services/writing";

const STORAGE_KEY = "myseek-writing-v1";

export function newId(): string {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createChapter(title = "新章节"): Chapter {
    const now = Date.now();
    return {
        id: newId(),
        title,
        content: "",
        status: "draft",
        outline: "",
        updatedAt: now,
        createdAt: now,
    };
}

export function createVolume(title = "第一卷"): Volume {
    return {
        id: newId(),
        title,
        chapters: [],
        createdAt: Date.now(),
    };
}

export function createNovel(title = "未命名作品"): Novel {
    const now = Date.now();
    const firstVolume = createVolume("第一卷");
    firstVolume.chapters.push(createChapter("第一章"));
    return {
        id: newId(),
        title,
        genre: "",
        description: "",
        cover: "",
        volumes: [firstVolume],
        characters: [],
        world: [],
        outline: [],
        createdAt: now,
        updatedAt: now,
    };
}

function sampleNovel(): Novel {
    const novel = createNovel("星际拾荒者");
    novel.genre = "科幻 / 冒险";
    novel.description = "一名拾荒少年在废弃星舰中发现了一段不该存在的记忆，从此卷入横跨星系的古老阴谋。";
    novel.characters = [
        {id: newId(), name: "林越", role: "主角", description: "十八岁拾荒少年，直觉敏锐，害怕被人记住。"},
        {id: newId(), name: "沉默的导航员", role: "神秘角色", description: "只以一段残存意识存在于旧星舰的AI核心中。"},
    ];
    novel.world = [
        {id: newId(), title: "拾荒带", content: "各大星系交界处漂浮的废弃舰船群，法则稀薄，是拾荒者的乐园，也是逃亡者的坟场。"},
    ];
    novel.outline = [
        {id: newId(), title: "开端：残骸中的信号", content: "林越在拆解一艘废弃舰船时，唤醒了沉睡的导航员。", done: false},
        {id: newId(), title: "发展：被追踪", content: "一股未知势力注意到了信号，开始追杀林越。", done: false},
    ];
    const chapter = novel.volumes[0].chapters[0];
    chapter.title = "第一章 · 残骸中的微光";
    chapter.outline = "林越进入残骸 → 发现异常信号 → 导航员苏醒";
    chapter.content =
        "拾荒带的黄昏没有太阳，只有远方星云缓慢燃烧的暗红色光晕。\n\n" +
        "林越把切割器调低一档，贴着那艘废弃了不知多少年的运输舰外壳，一点点撬开舱门。金属疲劳的脆响在真空里传不出去，只顺着他的手套传来细微的震动。\n\n" +
        "「又是空的。」他嘀咕着，正要转向下一个舱室，手腕上的探测器忽然闪了一下。\n\n" +
        "很微弱，但确实是一次有规律的脉冲。像某种心跳。";
    return novel;
}

export function loadWritingState(): WritingState {
    if (typeof window === "undefined") {
        const n = createNovel();
        return {novels: [n], activeNovelId: n.id, activeChapterId: n.volumes[0].chapters[0].id};
    }
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as WritingState;
            if (parsed && Array.isArray(parsed.novels) && parsed.novels.length > 0) {
                return parsed;
            }
        }
    } catch {
        // 数据损坏时回退到示例数据
    }
    const n = sampleNovel();
    return {novels: [n], activeNovelId: n.id, activeChapterId: n.volumes[0].chapters[0].id};
}

export function saveWritingState(state: WritingState): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // 超出配额时忽略，不阻断写作
    }
}

/** 中文字数统计：中文按字计，英文按词计，忽略空白 */
export function countWords(text: string): number {
    if (!text) return 0;
    const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
    const words = (text.match(/[a-zA-Z0-9]+(?:['’-][a-zA-Z0-9]+)*/g) || []).length;
    return cjk + words;
}

/** 统计一本书的总字数 */
export function countNovelWords(novel: Novel): number {
    return novel.volumes.reduce(
        (sum, v) => sum + v.chapters.reduce((s, c) => s + countWords(c.content), 0),
        0,
    );
}
