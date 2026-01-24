import { Building2, Home, Inbox, RefreshCw, Settings, Stethoscope, Users, Wifi, WifiOff } from "lucide-react";

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
import { useSyncStore } from "@/lib/sync-store";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { BackButton } from "./back-button";
import { LanguageToggle } from "./language-toggle";

export function AppSidebar()
{
  const { t } = useTranslation();
  const { isOnline, isAutoSyncEnabled, isSyncing } = useSyncStore();

  const mainItems = [
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
      icon: Inbox,
    },
  ];

  const managementItems = [
    {
      title: t("doctors.title"),
      url: "/doctors",
      icon: Stethoscope,
    },
    {
      title: t("clinics.title"),
      url: "/clinics",
      icon: Building2,
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
              {mainItems.map((item) => (
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

        <SidebarGroup>
          <SidebarGroupLabel>{t("common.management")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
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
      <SidebarFooter className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md transition-colors", isOnline ? "text-green-500 bg-green-500/10" : "text-destructive bg-destructive/10")}>
              {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            </div>
            {isAutoSyncEnabled && (
              <div className={cn("p-1.5 rounded-md text-primary bg-primary/10", isSyncing && "animate-pulse")}>
                <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">v0.1.0</span>
        </div>
        <div className="flex justify-end">
          <LanguageToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
