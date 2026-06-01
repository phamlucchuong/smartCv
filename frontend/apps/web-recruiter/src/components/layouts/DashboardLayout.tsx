import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Bell, Search, Sparkles, ChevronDown, LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@smart-cv/ui";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@smart-cv/ui";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  role: "candidate" | "employer" | "admin";
  nav: NavItem[];
  userName: string;
  userRole: string;
}

const ROLE_LABEL: Record<Props["role"], string> = {
  candidate: "Ứng viên",
  employer: "Nhà tuyển dụng",
  admin: "Quản trị viên",
};
const ROLE_HOME: Record<Props["role"], string> = {
  candidate: "/candidate",
  employer: "/employer",
  admin: "/admin",
};

export function DashboardLayout({ role, nav, userName, userRole }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "border-r border-sidebar-border bg-sidebar flex flex-col transition-all sticky top-0 h-screen",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="h-16 flex items-center gap-2 px-4 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            {!collapsed && <span className="font-bold tracking-tight">SmartCV</span>}
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {nav.map((item) => {
            const active = pathname === item.to || (item.to !== ROLE_HOME[role] && pathname.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                  collapsed && "justify-center px-0",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="m-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-accent"
        >
          {collapsed ? "→" : "← Thu gọn"}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-card flex items-center gap-4 px-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              placeholder="Tìm kiếm..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Role switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Vai trò: <span className="font-semibold">{ROLE_LABEL[role]}</span>
                  <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Chuyển vai trò demo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.assign("/login")}>Ứng viên</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/employer" })}>Nhà tuyển dụng</DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.assign("/login")}>Quản trị viên</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button className="relative p-2 rounded-lg hover:bg-accent">
              <Bell className="size-5" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-danger" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-accent">
                  <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                    {userName.split(" ").slice(-1)[0]?.[0] ?? "U"}
                  </div>
                  <div className="hidden md:block text-left leading-tight">
                    <div className="text-sm font-medium">{userName}</div>
                    <div className="text-xs text-muted-foreground">{userRole}</div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>Hồ sơ</DropdownMenuItem>
                <DropdownMenuItem>Cài đặt</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/login" })}>
                  <LogOut className="size-4 mr-2" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
