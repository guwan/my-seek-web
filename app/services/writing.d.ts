export type ChapterStatus = "draft" | "revising" | "final";

export interface Chapter {
    id: string;
    title: string;
    content: string;
    status: ChapterStatus;
    outline: string;
    updatedAt: number;
    createdAt: number;
}

export interface Volume {
    id: string;
    title: string;
    chapters: Chapter[];
    createdAt: number;
}

export interface Character {
    id: string;
    name: string;
    role: string;
    description: string;
}

export interface WorldEntry {
    id: string;
    title: string;
    content: string;
}

export interface OutlinePoint {
    id: string;
    title: string;
    content: string;
    done: boolean;
}

export interface Novel {
    id: string;
    title: string;
    genre: string;
    description: string;
    /** 风格描述：用于仿写，不依赖具体范文 */
    style?: string;
    cover: string;
    volumes: Volume[];
    characters: Character[];
    world: WorldEntry[];
    outline: OutlinePoint[];
    createdAt: number;
    updatedAt: number;
}

export interface WritingState {
    novels: Novel[];
    activeNovelId: string | null;
    activeChapterId: string | null;
}
