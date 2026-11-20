import {httpClient} from "~/lib/request";
import type {Result} from "~/services/data";
import type {Novel} from "~/services/writing";

/** 拉取当前用户的全部云端作品（完整作品树） */
export async function listWritingNovels() {
    return httpClient.getRet<Novel[]>("/api/writing/novels");
}

/** 按作品 id  upsert；服务端按登录用户隔离 */
export async function saveWritingNovel(novel: Novel) {
    return httpClient.put<Result<Novel>>(
        "/api/writing/novels",
        novel as unknown as Record<string, any>,
    );
}

export async function deleteWritingNovel(novelId: string) {
    return httpClient.delete<Result<unknown>>(
        `/api/writing/novels/${encodeURIComponent(novelId)}`,
    );
}
