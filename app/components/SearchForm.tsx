import type { ComponentProps } from "react";
import { Search } from "lucide-react";

import { Label } from "~/components/ui/label";
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarInput,
} from "~/components/layout/sidebar";

type SearchFormProps = Omit<ComponentProps<"input">, "type">;

export function SearchForm({ value, onChange, placeholder = "搜索...", ...props }: SearchFormProps) {
    return (
        <div>
            <SidebarGroup className="py-0">
                <SidebarGroupContent className="relative">
                    <Label htmlFor="chat-history-search" className="sr-only">
                        搜索会话
                    </Label>
                    <SidebarInput
                        id="chat-history-search"
                        type="search"
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        className="pl-8"
                        {...props}
                    />
                    <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
                </SidebarGroupContent>
            </SidebarGroup>
        </div>
    );
}
