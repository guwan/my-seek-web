import * as React from "react"

import { SearchForm } from "~/components/SearchForm"
import { VersionSwitcher } from "~/components/version-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "~/components/layout/sidebar"

// This is sample data.
const data = {
  versions: ["r1", "r0"],
  navMain: [
    {
      title: "开始",
      url: "#",
      items: [
        {
          title: "会话",
          url: "#",
        },
        {
          title: "写作",
          url: "#",
        },
      ],
    },
    {
      title: "会话历史",
      url: "#",
      items: [
        {
          title: "Routing",
          url: "#",
        },
        {
          title: "Data Fetching",
          url: "#",
          isActive: true,
        },
      ],
    },
    {
      title: "写作历史",
      url: "#",
      items: [
        {
          title: "Components",
          url: "#",
        },
      ],
    },
    {
      title: "配置",
      url: "#",
      items: [
        {
          title: "会话配置",
          url: "#",
        },
        {
          title: "写作配置",
          url: "#",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0]}
        />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <a href={item.url}>{item.title}</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
