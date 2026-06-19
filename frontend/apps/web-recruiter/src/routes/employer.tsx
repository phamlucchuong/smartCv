import { createFileRoute, redirect, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { DashboardLayout, type NavItem } from "@/components/layouts/DashboardLayout";
import Cookies from "js-cookie";
import {
  LayoutDashboard, ShieldCheck, Briefcase, Users, Trello, Search, ClipboardCheck, CreditCard, Bell, Settings, Building2,
} from "lucide-react";
import { useTranslation } from "@smart-cv/i18n";
import { useEffect } from "react";
import { hasRecruiterRole } from "../lib/recruiterAuth";
import { RecruiterApi } from "@smart-cv/api";
import { useAuthStore } from "../store/useAuthStore";

const GATE_PATHS = ["/employer/setup", "/employer/pending"];

export const Route = createFileRoute("/employer")({
  beforeLoad: ({ location }) => {
    const token = Cookies.get("smart_cv_token");
    if (!token || !hasRecruiterRole(token)) {
      throw redirect({ to: "/login" });
    }
    // Gate paths skip the async status check — they handle their own content
    if (GATE_PATHS.some((p) => location.pathname.startsWith(p))) return;
  },
  loader: async ({ location }) => {
    if (GATE_PATHS.some((p) => location.pathname.startsWith(p))) return null;

    try {
      const result = await RecruiterApi.getMe1();
      const status = result?.data?.status;
      if (!result?.data) {
        throw redirect({ to: "/login", replace: true });
      }
      if (status === "DRAFT") {
        throw redirect({ to: "/employer/setup", replace: true });
      }
      if (status === "PENDING" || status === "REJECTED") {
        throw redirect({ to: "/employer/pending", replace: true });
      }
      return result;
    } catch (err) {
      if ((err as { isRedirect?: boolean })?.isRedirect) throw err;
      throw redirect({ to: "/login", replace: true });
    }
  },
  component: EmployerLayoutRoute,
});

function EmployerLayoutRoute() {
  const navigate = useNavigate();
  const signOut = useAuthStore((state) => state.signOut);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation();
  const isGate = GATE_PATHS.some((p) => pathname.startsWith(p));
  const { data, isLoading, isError } = RecruiterApi.useGetMe1({ query: { enabled: !isGate } });
  const recruiter = data?.data;

  useEffect(() => {
    if (isGate || isLoading) {
      return;
    }

    if (isError || !recruiter) {
      signOut();
      navigate({ to: "/login", replace: true });
      return;
    }

    if (recruiter.status === "DRAFT") {
      navigate({ to: "/employer/setup", replace: true });
      return;
    }

    if (recruiter.status === "PENDING" || recruiter.status === "REJECTED") {
      navigate({ to: "/employer/pending", replace: true });
    }
  }, [isGate, isLoading, isError, recruiter, navigate, signOut]);

  if (isGate) {
    return <Outlet />;
  }

  if (isLoading || !recruiter || recruiter.status !== "APPROVED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const nav: NavItem[] = [
    { to: "/employer", label: t("recruiter_nav_overview"), icon: LayoutDashboard },
    { to: "/employer/verification", label: t("recruiter_nav_verification"), icon: ShieldCheck },
    { to: "/employer/jobs", label: t("recruiter_nav_jobs"), icon: Briefcase },
    { to: "/employer/applicants", label: t("recruiter_nav_applicants"), icon: Users },
    { to: "/employer/ats", label: t("recruiter_nav_ats"), icon: Trello },
    { to: "/employer/cv-search", label: t("recruiter_nav_cv_search"), icon: Search },
    { to: "/employer/assessments", label: t("recruiter_nav_assessments"), icon: ClipboardCheck },
    { to: "/employer/profile", label: t("recruiter_nav_profile"), icon: Building2 },
    { to: "/employer/billing", label: t("recruiter_nav_billing"), icon: CreditCard },
    { to: "/employer/notifications", label: t("recruiter_nav_notifications"), icon: Bell },
    { to: "/employer/settings", label: t("recruiter_nav_settings"), icon: Settings },
  ];

  return (
    <DashboardLayout
      role="employer"
      nav={nav}
      userName={recruiter?.contactName ?? recruiter?.fullName ?? ""}
      userRole={recruiter?.companyName ?? ""}
    />
  );
}
