import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Bell, Search, Sparkles, LogOut, Sun, Moon, ChevronDown,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@smart-cv/ui";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@smart-cv/ui";
import type { LucideIcon } from "lucide-react";
import { useRecruiterStore } from "@/store/useRecruiterStore";
import { useTranslation } from "@smart-cv/i18n";

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

const ROLE_HOME: Record<Props["role"], string> = {
  candidate: "/candidate",
  employer: "/employer",
  admin: "/admin",
};

export function DashboardLayout({ role, nav, userName, userRole }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { i18n, t } = useTranslation();
  const theme = useRecruiterStore((s) => s.theme);
  const setTheme = useRecruiterStore((s) => s.setTheme);
  const language: "EN" | "VI" = i18n.language?.toUpperCase() === "VI" ? "VI" : "EN";
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    overview: true,
    hiring: true,
    intelligence: true,
    account: true,
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  const toggleLanguage = () => {
    const nextLanguage = language === "EN" ? "VI" : "EN";
    localStorage.setItem("smartcv_lang", nextLanguage.toLowerCase());
    i18n.changeLanguage(nextLanguage.toLowerCase());
  };

  const navGroups = useMemo(() => ([
    {
      key: "overview",
      label: t("recruiter_sidebar_group_overview"),
      items: nav.filter((item) => item.to === ROLE_HOME[role]),
    },
    {
      key: "hiring",
      label: t("recruiter_sidebar_group_hiring"),
      items: nav.filter((item) => ["/employer/company-verification", "/employer/jobs", "/employer/applicants", "/employer/ats-board"].includes(item.to)),
    },
    {
      key: "intelligence",
      label: t("recruiter_sidebar_group_intelligence"),
      items: nav.filter((item) => ["/employer/cv-search", "/employer/assessments"].includes(item.to)),
    },
    {
      key: "account",
      label: t("recruiter_sidebar_group_account"),
      items: nav.filter((item) => ["/employer/billing", "/employer/notifications", "/employer/settings"].includes(item.to)),
    },
  ].filter((group) => group.items.length > 0)), [nav, role, t]);

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
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-2">
          {navGroups.map((group) => {
            const groupHasActive = group.items.some((item) => pathname === item.to || (item.to !== ROLE_HOME[role] && pathname.startsWith(item.to)));
            if (group.items.length === 1) {
              const item = group.items[0];
              const active = pathname === item.to || (item.to !== ROLE_HOME[role] && pathname.startsWith(item.to));
              const Icon = item.icon;
              return (
                <Link
                  key={group.key}
                  to={item.to}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary/10 text-primary font-semibold border-primary/20"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            }
            const expanded = collapsed ? false : (openGroups[group.key] ?? groupHasActive);
            return (
              <div key={group.key} className="space-y-1">
                <button
                  type="button"
                  onClick={() => setOpenGroups((prev) => ({ ...prev, [group.key]: !expanded }))}
                  className={cn(
                    "flex w-full items-center rounded-lg px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-sidebar-accent",
                    collapsed && "justify-center px-0",
                  )}
                >
                  {!collapsed && <span className="truncate">{group.label}</span>}
                  {!collapsed && <ChevronDown className={cn("ml-auto size-3.5 transition-transform", expanded && "rotate-180")} />}
                  {collapsed && <div className={cn("size-1.5 rounded-full", groupHasActive ? "bg-primary" : "bg-muted-foreground/40")} />}
                </button>
                {expanded && group.items.map((item) => {
                  const active = pathname === item.to || (item.to !== ROLE_HOME[role] && pathname.startsWith(item.to));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-primary/10 text-primary font-semibold border-primary/20"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
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
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-card flex items-center gap-3 px-4 lg:px-5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              placeholder={t("recruiter_search_placeholder")}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={toggleLanguage}
              className="border-border bg-muted/60 relative flex h-9 w-[84px] cursor-pointer items-center rounded-lg border p-1 text-xs"
              title={t("language")}
            >
              <span
                className={`absolute top-1 h-7 w-9 rounded-md bg-primary transition-transform duration-200 ${language === "EN" ? "translate-x-0" : "translate-x-[38px]"}`}
              />
              <span className={`relative z-10 w-9 text-center transition-colors duration-200 ${language === "EN" ? "text-primary-foreground" : "text-muted-foreground"}`}>EN</span>
              <span className={`relative z-10 w-9 text-center transition-colors duration-200 ${language === "VI" ? "text-primary-foreground" : "text-muted-foreground"}`}>VI</span>
            </button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="border-border bg-muted/60 text-muted-foreground h-9 w-9 transition-transform duration-300 active:scale-95"
              title={theme === "dark" ? t("light") : t("dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4 transition-transform duration-300 hover:rotate-12" /> : <Moon className="h-4 w-4 transition-transform duration-300 hover:-rotate-12" />}
            </Button>

            <button className="relative rounded-lg p-2 hover:bg-accent">
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
                <DropdownMenuItem>{t("account_my_profile")}</DropdownMenuItem>
                <DropdownMenuItem>{t("account_settings")}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/login" })}>
                  <LogOut className="size-4 mr-2" /> {t("account_sign_out")}
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
