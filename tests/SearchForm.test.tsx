import {afterEach, describe, expect, it, vi} from "vitest";
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {SearchForm} from "~/components/SearchForm";

afterEach(cleanup);

describe("SearchForm", () => {
    it("渲染占位文案并回传输入值", () => {
        let changed = "";
        const onChange = vi.fn(event => {
            changed = event.target.value;
        });
        render(<SearchForm value="" onChange={onChange} placeholder="搜索会话..."/>);

        const input = screen.getByPlaceholderText("搜索会话...") as HTMLInputElement;
        expect(input).toBeTruthy();
        fireEvent.change(input, {target: {value: "MySeek"}});
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(changed).toBe("MySeek");
    });
});
