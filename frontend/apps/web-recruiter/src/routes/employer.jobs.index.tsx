import { createFileRoute, Link } from "@tanstack/react-router";
import { JOBS } from "@/lib/mock-data";
import { Button } from "@smart-cv/ui";
import { StatusBadge } from "@/components/ui-kit/StatusBadge";
import { Plus, Search, MoreVertical } from "lucide-react";

export const Route = createFileRoute("/employer/jobs/")({
  head: () => ({ meta: [{ title: "Tin tuyển dụng" }] }),
  component: () => (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tin tuyển dụng</h1>
          <p className="text-sm text-muted-foreground">{JOBS.length} tin đang hoạt động</p>
        </div>
        <Link to="/employer/jobs/new"><Button className="gap-2"><Plus className="size-4" /> Đăng tin mới</Button></Link>
      </div>

      <div className="card-surface p-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input placeholder="Tìm kiếm..." className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm" />
        </div>
        <select className="h-9 rounded-md border border-input bg-background text-sm px-3"><option>Tất cả trạng thái</option><option>Active</option><option>Draft</option></select>
        <select className="h-9 rounded-md border border-input bg-background text-sm px-3"><option>Tất cả phòng ban</option><option>Engineering</option></select>
        <select className="h-9 rounded-md border border-input bg-background text-sm px-3"><option>Mọi địa điểm</option></select>
      </div>

      <div className="card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
            <tr>
              <th className="text-left py-3 px-4">Vị trí</th>
              <th className="text-left py-3 px-4">Trạng thái</th>
              <th className="text-right py-3 px-4">Ứng viên</th>
              <th className="text-right py-3 px-4">Đạt yêu cầu</th>
              <th className="text-left py-3 px-4">Ngưỡng match</th>
              <th className="text-left py-3 px-4">Ngày đăng</th>
              <th className="text-right py-3 px-4">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {JOBS.map((j) => (
              <tr key={j.id} className="border-t border-border hover:bg-accent/40">
                <td className="py-3 px-4">
                  <Link to="/employer/applicants" className="font-medium hover:text-primary">{j.title}</Link>
                  <div className="text-xs text-muted-foreground">{j.location} • {j.mode}</div>
                </td>
                <td className="py-3 px-4"><StatusBadge status={j.status ?? "Active"} /></td>
                <td className="py-3 px-4 text-right font-semibold">{j.applicants}</td>
                <td className="py-3 px-4 text-right text-success font-semibold">{j.qualified}</td>
                <td className="py-3 px-4 text-muted-foreground">≥ 70%</td>
                <td className="py-3 px-4 text-muted-foreground">{j.postedDays} ngày trước</td>
                <td className="py-3 px-4 text-right">
                  <Button size="sm" variant="ghost"><MoreVertical className="size-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ),
});
