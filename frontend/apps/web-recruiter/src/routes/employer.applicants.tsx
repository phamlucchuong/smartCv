import { createFileRoute, Link } from "@tanstack/react-router";
import { CANDIDATES, SCORE_COLOR } from "@/lib/mock-data";
import { AIScoreRing } from "@/components/ui-kit/AIScoreRing";
import { StatusBadge } from "@/components/ui-kit/StatusBadge";
import { Button } from "@smart-cv/ui";
import { Search, Filter, Download, List, Kanban } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/employer/applicants")({
  head: () => ({ meta: [{ title: "Ứng viên" }] }),
  component: ApplicantsPage,
});

const STATUS_COLUMNS = ["Qualified", "Interview Scheduled", "Interviewed", "Offer Sent", "Accepted", "Rejected"] as const;
type Col = typeof STATUS_COLUMNS[number];

function ApplicantsPage() {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [candidatesList, setCandidatesList] = useState(CANDIDATES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState("Tất cả tin tuyển");
  const [selectedStatus, setSelectedStatus] = useState("Tất cả trạng thái");
  const [selectedScore, setSelectedScore] = useState("Mọi điểm số");

  // Get unique job list for the dropdown filter
  const uniqueJobs = Array.from(new Set(CANDIDATES.map((c) => c.appliedJob)));

  // Filter logic
  const filteredCandidates = candidatesList.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.missingSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesJob = selectedJob === "Tất cả tin tuyển" || c.appliedJob === selectedJob;
    const matchesStatus = selectedStatus === "Tất cả trạng thái" || c.status === selectedStatus;

    let matchesScore = true;
    if (selectedScore === "≥ 80%") matchesScore = c.score >= 80;
    else if (selectedScore === "70-79%") matchesScore = c.score >= 70 && c.score < 80;

    return matchesSearch && matchesJob && matchesStatus && matchesScore;
  });

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, candidateId: string, fromStatus: Col) => {
    e.dataTransfer.setData("candidateId", candidateId);
    e.dataTransfer.setData("fromStatus", fromStatus);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, toStatus: Col) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData("candidateId");
    const fromStatus = e.dataTransfer.getData("fromStatus") as Col;

    if (fromStatus === toStatus) return;

    setCandidatesList((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: toStatus } : c))
    );
    toast.success(`Đã chuyển trạng thái sang "${toStatus}"`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ứng viên</h1>
          <p className="text-sm text-muted-foreground">
            {filteredCandidates.length} ứng viên • Sàng lọc bởi AI
          </p>
        </div>
        <div className="flex gap-2">
          {/* Toggle View Mode Button Group */}
          <div className="inline-flex rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="size-4" /> Danh sách
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Kanban className="size-4" /> Bảng Kanban
            </button>
          </div>
          <Button variant="outline" className="gap-1">
            <Download className="size-4" /> Xuất danh sách
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card-surface p-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            placeholder="Tìm theo tên, kỹ năng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <select
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
          className="h-9 rounded-md border border-input bg-background text-sm px-3 cursor-pointer"
        >
          <option>Tất cả tin tuyển</option>
          {uniqueJobs.map((j) => (
            <option key={j}>{j}</option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-9 rounded-md border border-input bg-background text-sm px-3 cursor-pointer"
        >
          <option>Tất cả trạng thái</option>
          {STATUS_COLUMNS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={selectedScore}
          onChange={(e) => setSelectedScore(e.target.value)}
          className="h-9 rounded-md border border-input bg-background text-sm px-3 cursor-pointer"
        >
          <option>Mọi điểm số</option>
          <option>≥ 80%</option>
          <option>70-79%</option>
        </select>
        <Button variant="outline" size="sm" className="gap-1">
          <Filter className="size-4" /> Bộ lọc
        </Button>
      </div>

      {/* Layout Content */}
      {viewMode === "kanban" ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1200px]">
            {STATUS_COLUMNS.map((col) => {
              const colCandidates = filteredCandidates.filter((c) => c.status === col);
              return (
                <div
                  key={col}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col)}
                  className="flex-1 min-w-[200px] rounded-xl bg-secondary/30 border border-border/40 p-3 flex flex-col min-h-[500px]"
                >
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                      {col}
                    </span>
                    <span className="text-xs font-semibold rounded-full bg-card border border-border px-2 py-0.5">
                      {colCandidates.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px] pr-1">
                    {colCandidates.map((c) => (
                      <div
                        key={c.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, c.id, col)}
                        className="card-surface p-3.5 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 border border-border/50 hover:border-primary/30 space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <Link
                            to="/employer/applicants/$id"
                            params={{ id: c.id }}
                            className="font-semibold text-sm hover:text-primary line-clamp-1 flex-1 transition-colors"
                          >
                            {c.name}
                          </Link>
                          <AIScoreRing score={c.score} size={30} thickness={3} />
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {c.title}
                        </div>
                        <div className="text-[10px] bg-secondary text-secondary-foreground font-medium px-2 py-0.5 rounded border border-border/40 truncate">
                          {c.appliedJob}
                        </div>

                        {c.skills && c.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {c.skills.slice(0, 2).map((s) => (
                              <span
                                key={s}
                                className="text-[9px] bg-primary/5 text-primary border border-primary/15 px-1.5 py-0.5 rounded font-medium"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="pt-2 flex items-center justify-between border-t border-border/30 text-[10px] text-muted-foreground">
                          <span>{c.appliedDate}</span>
                          {c.assessmentScore && (
                            <span className="font-medium bg-success/10 text-success border border-success/20 px-1.5 py-0.5 rounded">
                              Test: {c.assessmentScore}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {colCandidates.length === 0 && (
                      <div className="h-24 border border-dashed border-border/60 rounded-xl flex items-center justify-center text-xs text-muted-foreground">
                        Kéo thả vào đây
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="text-left py-3 px-4">
                  <input type="checkbox" />
                </th>
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
              {filteredCandidates.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-accent/30">
                  <td className="py-3 px-4">
                    <input type="checkbox" />
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      to="/employer/applicants/$id"
                      params={{ id: c.id }}
                      className="font-medium hover:text-primary"
                    >
                      {c.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{c.title}</div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{c.appliedJob}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <AIScoreRing score={c.score} size={36} thickness={4} />
                      <span
                        className={`text-xs font-semibold ${
                          SCORE_COLOR(c.score) === "success"
                            ? "text-success"
                            : SCORE_COLOR(c.score) === "warning"
                            ? "text-warning"
                            : "text-danger"
                        }`}
                      >
                        {c.score >= 70 ? "Đạt" : c.score >= 50 ? "Xem xét" : "Không đạt"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {c.missingSkills.join(", ")}
                  </td>
                  <td className="py-3 px-4 text-right">{c.assessmentScore ?? "—"}</td>
                  <td className="py-3 px-4 text-muted-foreground">{c.appliedDate}</td>
                  <td className="py-3 px-4 text-right">
                    <Link to="/employer/applicants/$id" params={{ id: c.id }}>
                      <Button size="sm" variant="ghost">
                        Xem
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
