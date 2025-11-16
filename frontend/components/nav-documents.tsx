"use client";

import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { useAuthStore } from "@/app/stores/useAuthStore";

export function NavDocuments({
  items,
}: {
  items: {
    name: string;
    url: string;
    icon: any;
  }[];
}) {
  const pathname = usePathname();   // ⭐ Get current URL
  const role = useAuthStore((state) => state.role);

  // ❌ If role is not admin, DON'T render
  if (role !== "admin") return null;

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Admin Menu</SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => {
          // ⭐ Highlight if the current route is active
          const isActive = pathname === item.url;

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton 
                isActive={isActive}   // ⭐ IMPORTANT
                asChild
              >
                <a href={item.url}>
                  <item.icon />
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
