import { createFileRoute, Link } from "@tanstack/react-router";
import { CANDIDATES, SCORE_COLOR } from "@/lib/mock-data";
import { AIScoreRing } from "@/components/ui-kit/AIScoreRing";
import { StatusBadge } from "@/components/ui-kit/StatusBadge";
import { Button } from "@smart-cv/ui";
import { Search, Filter, Download } from "lucide-react";

export const Route = createFileRoute("/employer/applicants")({
  head: () => ({ meta: [{ title: "Ứng viên" }] }),
  component: () => (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ứng viên</h1>
          <p className="text-sm text-muted-foreground">{CANDIDATES.length} ứng viên • Sàng lọc bởi AI</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1"><Download className="size-4" /> Xuất danh sách</Button>
        </div>
      </div>

      <div className="card-surface p-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input placeholder="Tìm theo tên, kỹ năng..." className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm" />
        </div>
        <select className="h-9 rounded-md border border-input bg-background text-sm px-3"><option>Tất cả tin tuyển</option></select>
        <select className="h-9 rounded-md border border-input bg-background text-sm px-3"><option>Tất cả trạng thái</option></select>
        <select className="h-9 rounded-md border border-input bg-background text-sm px-3"><option>Mọi điểm số</option><option>≥ 80%</option><option>70-79%</option></select>
        <Button variant="outline" size="sm" className="gap-1"><Filter className="size-4" /> Bộ lọc</Button>
      </div>

      <div className="card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
            <tr>
              <th className="text-left py-3 px-4"><input type="checkbox" /></th>
              <th className="text-left py-3 px-4">Ứng viên</th>
              <th className="text-left py-3 px-4">Vị trí</th>
              <th className="text-left py-3 px-4">Match Score</th>
              <th className="text-left py-3 px-4">Trạng thái</th>
              <th className="text-left py-3 px-4">Kỹ năng thiếu</th>
              <th className="text-right py-3 px-4">Điểm test</th>
              <th className="text-left py-3 px-4">Ngày ứng tuyển</th>
              <th className="text-right py-3 px-4">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {CANDIDATES.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-accent/30">
                <td className="py-3 px-4"><input type="checkbox" /></td>
                <td className="py-3 px-4">
                  <Link to="/employer/applicants/$id" params={{ id: c.id }} className="font-medium hover:text-primary">{c.name}</Link>
                  <div className="text-xs text-muted-foreground">{c.title}</div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">{c.appliedJob}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <AIScoreRing score={c.score} size={36} thickness={4} />
                    <span className={`text-xs font-semibold ${SCORE_COLOR(c.score) === "success" ? "text-success" : SCORE_COLOR(c.score) === "warning" ? "text-warning" : "text-danger"}`}>
                      {c.score >= 70 ? "Đạt" : c.score >= 50 ? "Xem xét" : "Không đạt"}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{c.missingSkills.join(", ")}</td>
                <td className="py-3 px-4 text-right">{c.assessmentScore ?? "—"}</td>
                <td className="py-3 px-4 text-muted-foreground">{c.appliedDate}</td>
                <td className="py-3 px-4 text-right">
                  <Link to="/employer/applicants/$id" params={{ id: c.id }}><Button size="sm" variant="ghost">Xem</Button></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ),
});
