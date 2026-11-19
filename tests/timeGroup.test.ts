import {afterEach, describe, expect, it, vi} from "vitest";
import {formatItemTime, groupByTime} from "~/components/Chat/timeGroup";

const NOW = new Date("2026-11-19T12:00:00").getTime();
const HOUR = 3600_000;
const DAY = 24 * HOUR;

describe("timeGroup", () => {
    afterEach(() => vi.useRealTimers());

    it("按今天/昨天/更早分组并按时间倒序", () => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
        const groups = groupByTime([
            {id: "old", title: "old", url: "/old", createAt: NOW - 40 * DAY},
            {id: "today", title: "today", url: "/today", createAt: NOW - HOUR},
            {id: "yesterday", title: "yesterday", url: "/yesterday", createAt: NOW - DAY},
        ]);

        expect(groups.map(g => g.label)).toEqual(["今天", "昨天", "更早"]);
        expect(groups[0].items[0].id).toBe("today");
    });

    it("兼容秒级时间戳并显示今天时分", () => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
        expect(formatItemTime(Math.floor(NOW / 1000))).toMatch(/^\d{2}:\d{2}$/);
        expect(formatItemTime(undefined)).toBe("");
    });
});
