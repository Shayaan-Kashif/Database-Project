"use client";

import * as React from "react";
import Image from "next/image";
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

import { usePathname } from "next/navigation";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    { title: "Overview", url: "/dashboard", icon: IconDashboard },
    { title: "Map", url: "/map", icon: IconListDetails },
    { title: "Analytics", url: "#", icon: IconChartBar },
  ],
  navSecondary: [],
  documents: [
    { name: "Parking Lots Managment", url: "/dashboard/lotManagement", icon: IconDatabase },
    { name: "User Logs", url: "/dashboard/userLogs", icon: IconReport },
    { name: "Review Managment", url: "/dashboard/reviewsManagement", icon: IconFileWord },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* Header with Theme-Aware Logo */}
      <SidebarHeader>
        <div className="flex items-center gap-3 px-3 py-3">

          {/* Light mode logo */}
          <Image
            src="/OTU Logo 2.png"
            alt="OTU Logo Light"
            width={32}
            height={32}
            className="rounded-sm dark:hidden"
          />

          {/* Dark mode logo */}
          <Image
            src="/OTU Logo 2.png"   // CHANGE TO YOUR DARK LOGO FILE
            //src="/OTU logo.png"   // CHANGE TO YOUR DARK LOGO FILE
            alt="OTU Logo Dark"
            width={32}
            height={32}
            className="rounded-sm hidden dark:block"
          />

          <span className="text-base font-semibold">OTU Parking</span>
        </div>
      </SidebarHeader>

      {/* Main Nav */}
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
