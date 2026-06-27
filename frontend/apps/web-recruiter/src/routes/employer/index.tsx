import { createFileRoute, Link } from "@tanstack/react-router";
import { JOBS, CANDIDATES } from "@/lib/mock-data";
import { AIScoreRing } from "@/components/ui-kit/AIScoreRing";
import { StatusBadge } from "@/components/ui-kit/StatusBadge";
import { AIInsightBox } from "@/components/ui-kit/AIInsightBox";
import { Briefcase, Users, CheckCircle2, AlertCircle, TrendingUp, DollarSign } from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/employer/")({
  head: () => ({ meta: [{ title: "Tổng quan — Nhà tuyển dụng" }] }),
  component: EmployerDashboard,
});

const APP_DATA = [
  { day: "T2", apps: 12 }, { day: "T3", apps: 18 }, { day: "T4", apps: 15 },
  { day: "T5", apps: 25 }, { day: "T6", apps: 22 }, { day: "T7", apps: 10 }, { day: "CN", apps: 6 },
];
const FUNNEL = [
  { stage: "Applied", v: 128 }, { stage: "Qualified", v: 56 }, { stage: "Interview", v: 22 }, { stage: "Offer", v: 8 }, { stage: "Accepted", v: 5 },
];

function EmployerDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tổng quan tuyển dụng</h1>
          <p className="text-sm text-muted-foreground">FPT Software • <span className="text-success font-medium">Đã xác minh ✓</span></p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: Briefcase, label: "Việc đang đăng", value: "8", color: "primary" },
          { icon: Users, label: "Ứng viên", value: "128", color: "primary" },
          { icon: CheckCircle2, label: "Đạt yêu cầu", value: "42", color: "success" },
          { icon: AlertCircle, label: "Cần review", value: "18", color: "warning" },
          { icon: TrendingUp, label: "Sử dụng gói", value: "62%", color: "primary" },
          { icon: DollarSign, label: "Chi tháng này", value: "12M₫", color: "primary" },
        ].map((k) => (
          <div key={k.label} className="card-surface p-4">
            <k.icon className={`size-5 ${k.color === "success" ? "text-success" : k.color === "warning" ? "text-warning" : "text-primary"}`} />
            <div className="mt-2 text-2xl font-bold">{k.value}</div>
            <div className="text-xs text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card-surface p-5 lg:col-span-2">
          <h2 className="font-semibold mb-4">Đơn ứng tuyển theo ngày</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={APP_DATA}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
              <YAxis tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
              <Tooltip />
              <Line type="monotone" dataKey="apps" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card-surface p-5">
          <h2 className="font-semibold mb-4">Phễu tuyển dụng</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={FUNNEL} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="stage" type="category" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} width={70} />
              <Tooltip />
              <Bar dataKey="v" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card-surface p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Ứng viên gần đây</h2>
            <Link to="/employer/applicants" className="text-xs text-primary">Xem tất cả →</Link>
          </div>
          <div className="space-y-2">
            {CANDIDATES.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent">
                <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                  {c.name.split(" ").pop()?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.appliedJob}</div>
                </div>
                <AIScoreRing score={c.score} size={42} thickness={5} />
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <AIInsightBox title="AI Screening Summary">
            <div className="space-y-1.5">
              <div className="flex justify-between"><span>Auto-qualified</span><strong className="text-success">42</strong></div>
              <div className="flex justify-between"><span>Manual review</span><strong className="text-warning">18</strong></div>
              <div className="flex justify-between"><span>Auto-rejected</span><strong className="text-danger">26</strong></div>
              <div className="flex justify-between border-t border-ai/20 pt-2 mt-2"><span>Average match score</span><strong>68%</strong></div>
            </div>
          </AIInsightBox>
          <div className="card-surface p-5">
            <h3 className="font-semibold mb-3">Việc cần chú ý</h3>
            <div className="space-y-2 text-sm">
              {JOBS.slice(0, 3).map((j) => (
                <div key={j.id} className="flex justify-between p-2 rounded-lg hover:bg-accent">
                  <span className="truncate">{j.title}</span>
                  <span className="text-warning text-xs">{j.applicants} CV mới</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
