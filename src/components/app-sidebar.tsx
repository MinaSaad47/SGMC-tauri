import { Home, Inbox, Settings, Users } from "lucide-react";

import logo from "@/assets/logo.svg";
import
{
  Sidebar,
  SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { BackButton } from "./back-button";
import { LanguageToggle } from "./language-toggle";

export function AppSidebar() {
  const { t } = useTranslation();

  const items = [
    {
      title: t("common.home"),
      url: "/",
      icon: Home,
    },
    {
      title: t("common.patients"),
      url: "/patients",
      icon: Users,
    },
    {
      title: t("common.statements"),
      url: "/statements",
      icon: Inbox, // Reusing Inbox icon for now, can be changed later
    },
    {
      title: t("common.settings"),
      url: "/settings", 
      icon: Settings,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row items-center gap-2 p-4">
        <img src={logo} alt={`${t("common.app_name")} Logo`} className="w-8 h-8 rounded-md" />
        <span className="font-bold text-lg tracking-tight">{t("common.app_name")}</span>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-2 pt-2">
          <BackButton />
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>{t("common.application")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 flex flex-row items-center justify-between">
        <span className="text-xs text-muted-foreground">v0.1.0</span>
        <LanguageToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
