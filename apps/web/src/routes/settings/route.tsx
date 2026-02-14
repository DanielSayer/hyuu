import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect
} from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  LinkIcon,
  UserIcon,
} from "lucide-react";

const settingsNavItems = [
  {
    title: "Profile",
    href: "/settings/profile",
    icon: UserIcon,
  },
  {
    title: "Connections",
    href: "/settings/connections",
    icon: LinkIcon,
  },
];

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

function SettingsPage() {
  return (
    <div className="bg-background flex h-screen flex-col overflow-y-auto">
      <div className="container mx-auto flex max-w-6xl flex-1 flex-col p-3 pb-6 lg:max-h-dvh lg:overflow-y-hidden lg:p-6">
        {/* Header */}
        <div className="mb-8 max-md:px-2">
          <div className="mb-6 flex items-center gap-4">
            <Link to="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground gap-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account preferences and configuration.
            </p>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Navigation */}
          <div className="w-full shrink-0 lg:w-64 lg:pr-2">
            <nav className="w-full space-y-1">
              {settingsNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="col-span-3 flex-1">
            <div className="space-y-6 p-0.5 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}