import {
  BarChart3Icon,
  CalendarIcon,
  ChevronRightIcon,
  HomeIcon,
  TargetIcon,
  UserIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardHeader, CardTitle } from "./ui/card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "./ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { LoadingWrapper } from "./loading-wrapper";
import { Skeleton } from "./ui/skeleton";
import { Link, useLocation } from "@tanstack/react-router";

type AppLayoutProps = {
  children: ReactNode;
};

function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex h-[calc(100svh-1rem)] flex-col overflow-hidden">
        <header className="sticky top-0 z-10 shrink-0 p-4">
          <SidebarTrigger />
        </header>
        <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AppSidebar() {
  const { isPending, data: session } = authClient.useSession();
  const location = useLocation();

  return (
    <Sidebar variant="inset">
      <SidebarContent>
        <SidebarHeader>
          <div className="text-3xl font-extrabold italic">hyuu</div>
        </SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel className="tracking-widest uppercase">
            Main Menu
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location.pathname === "/dashboard"}
                  render={
                    <Link to="/dashboard">
                      <HomeIcon /> Dashboard
                    </Link>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location.pathname === "/analytics"}
                  render={
                    <Link to="/analytics">
                      <BarChart3Icon /> Analytics
                    </Link>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location.pathname === "/training-plan"}
                  render={
                    <Link to="/training-plan">
                      <CalendarIcon /> Training Plan
                    </Link>
                  }
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location.pathname === "/goals"}
                  render={
                    <Link to="/goals">
                      <TargetIcon /> Goals
                    </Link>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <LoadingWrapper
          isLoading={isPending}
          fallback={<Skeleton className="h-18 w-full" />}
        >
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-accent/60 flex size-10 items-center justify-center rounded-md">
                  <UserIcon />
                </div>
                <CardTitle>{session?.user?.name}</CardTitle>
              </div>
              <ChevronRightIcon className="text-muted-foreground stroke-[1.5]" />
            </CardHeader>
          </Card>
        </LoadingWrapper>
      </SidebarFooter>
    </Sidebar>
  );
}

export { AppLayout };
