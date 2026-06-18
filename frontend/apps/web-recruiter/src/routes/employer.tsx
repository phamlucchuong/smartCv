import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout, type NavItem } from "@/components/layouts/DashboardLayout";
import Cookies from "js-cookie";
import {
  LayoutDashboard, ShieldCheck, Briefcase, Users, Trello, Search, ClipboardCheck, CreditCard, Bell, Settings, Building2,
} from "lucide-react";
import { useTranslation } from "@smart-cv/i18n";
import { hasRecruiterRole } from "../lib/recruiterAuth";

export const Route = createFileRoute("/employer")({
  beforeLoad: () => {
    const token = Cookies.get("smart_cv_token");
    if (!token || !hasRecruiterRole(token)) {
      throw redirect({ to: "/login" });
    }
  },
  component: EmployerLayoutRoute,
});

function EmployerLayoutRoute() {
  const { t } = useTranslation();
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

  return <DashboardLayout role="employer" nav={nav} userName="Trần Thị HR" userRole="FPT Software" />;
}
