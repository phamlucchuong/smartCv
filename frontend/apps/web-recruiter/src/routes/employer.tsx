import { createFileRoute, redirect, Outlet, useRouterState } from "@tanstack/react-router";
import { DashboardLayout, type NavItem } from "@/components/layouts/DashboardLayout";
import Cookies from "js-cookie";
import {
  LayoutDashboard, ShieldCheck, Briefcase, Users, Trello, Search, ClipboardCheck, CreditCard, Bell, Settings, Building2,
} from "lucide-react";
import { useTranslation } from "@smart-cv/i18n";
import { hasRecruiterRole } from "../lib/recruiterAuth";
import { RecruiterApi } from "@smart-cv/api";

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
      if (status === "DRAFT") {
        throw redirect({ to: "/employer/setup", replace: true });
      }
      if (status === "PENDING" || status === "REJECTED") {
        throw redirect({ to: "/employer/pending", replace: true });
      }
      return result;
    } catch (err) {
      // Re-throw redirect errors as-is; swallow network errors (let the page render)
      if ((err as { isRedirect?: boolean })?.isRedirect) throw err;
      return null;
    }
  },
  component: EmployerLayoutRoute,
});

function EmployerLayoutRoute() {
  // All hooks unconditionally before any conditional return
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation();
  const isGate = GATE_PATHS.some((p) => pathname.startsWith(p));
  // Disable fetch on gate paths — they handle their own data fetching
  const { data } = RecruiterApi.useGetMe1({ query: { enabled: !isGate } });
  const recruiter = data?.data;

  if (isGate) {
    return <Outlet />;
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
