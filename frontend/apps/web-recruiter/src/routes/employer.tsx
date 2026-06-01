import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout, type NavItem } from "@/components/layouts/DashboardLayout";
import {
  LayoutDashboard, ShieldCheck, Briefcase, Users, Trello, Search, ClipboardCheck, CreditCard, Bell, Settings,
} from "lucide-react";

const NAV: NavItem[] = [
  { to: "/employer", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/employer/verification", label: "Xác minh công ty", icon: ShieldCheck },
  { to: "/employer/jobs", label: "Tin tuyển dụng", icon: Briefcase },
  { to: "/employer/applicants", label: "Ứng viên", icon: Users },
  { to: "/employer/ats", label: "Bảng ATS", icon: Trello },
  { to: "/employer/cv-search", label: "Tìm kiếm CV", icon: Search },
  { to: "/employer/assessments", label: "Bài kiểm tra", icon: ClipboardCheck },
  { to: "/employer/billing", label: "Gói & Thanh toán", icon: CreditCard },
  { to: "/employer/notifications", label: "Thông báo", icon: Bell },
  { to: "/employer/settings", label: "Cài đặt", icon: Settings },
];

export const Route = createFileRoute("/employer")({
  component: () => <DashboardLayout role="employer" nav={NAV} userName="Trần Thị HR" userRole="FPT Software" />,
});
