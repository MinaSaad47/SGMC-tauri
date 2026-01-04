import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Layout() {
  const { i18n } = useTranslation();
  return (
    <SidebarProvider dir={i18n.dir()}>
      <AppSidebar />
      <main className="flex flex-col w-full">
        <SidebarTrigger />
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}
