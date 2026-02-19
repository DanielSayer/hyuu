import {
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
                <SidebarMenuButton>
                  <HomeIcon /> Dashboard
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <CalendarIcon /> Training Plan
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <TargetIcon /> Goals
                </SidebarMenuButton>
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
