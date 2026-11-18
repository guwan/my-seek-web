export interface TimeGroup {
    label: string;
    items: {id: string | number; title: string; url: string; createAt?: string | number}[];
}

function toTimestamp(value?: string | number): number {
    if (!value) return 0;
    if (typeof value === "number") return value < 1e12 ? value * 1000 : value;
    // 兼容 "2026-11-18 14:20:00" 与 ISO 字符串
    const normalized = value.replace(" ", "T");
    const t = Date.parse(normalized);
    return Number.isNaN(t) ? 0 : t;
}

function startOfDay(d: Date): number {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** 会话条目的简短时间标签：今天显示时分，其它显示月-日 */
export function formatItemTime(value?: string | number): string {
    const ts = toTimestamp(value);
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    if (startOfDay(d) === startOfDay(now)) {
        return d.toLocaleTimeString("zh-CN", {hour: "2-digit", minute: "2-digit", hour12: false});
    }
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 仿 DeepSeek 按时间分组：今天 / 昨天 / 7 天内 / 30 天内 / 更早 */
export function groupByTime<T extends {id: string | number; title: string; url: string; createAt?: string | number}>(
    items: T[],
): {label: string; items: T[]}[] {
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = today - 86400000;
    const week = today - 6 * 86400000;
    const month = today - 29 * 86400000;

    const buckets: Record<string, T[]> = {
        今天: [], 昨天: [], "7 天内": [], "30 天内": [], 更早: [],
    };

    const sorted = [...items].sort((a, b) => toTimestamp(b.createAt) - toTimestamp(a.createAt));
    for (const item of sorted) {
        const ts = toTimestamp(item.createAt);
        if (ts >= today) buckets["今天"].push(item);
        else if (ts >= yesterday) buckets["昨天"].push(item);
        else if (ts >= week) buckets["7 天内"].push(item);
        else if (ts >= month) buckets["30 天内"].push(item);
        else buckets["更早"].push(item);
    }

    return Object.entries(buckets)
        .filter(([, list]) => list.length > 0)
        .map(([label, list]) => ({label, items: list}));
}
