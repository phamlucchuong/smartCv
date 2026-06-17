import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@smart-cv/ui";
import { useGetMyJobs } from "@smart-cv/api";
import { StatusBadge } from "@/components/ui-kit/StatusBadge";
import { Plus, Search, MoreVertical } from "lucide-react";

export const Route = createFileRoute("/employer/jobs/")({
  head: () => ({ meta: [{ title: "Tin tuyển dụng" }] }),
  component: EmployerJobsPage,
});

const STATUS_OPTIONS = [
  { label: "Tất cả trạng thái", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Draft", value: "DRAFT" },
  { label: "Closed", value: "CLOSED" },
  { label: "Expired", value: "EXPIRED" },
];

function formatStatus(status?: string) {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "DRAFT":
      return "Draft";
    case "CLOSED":
      return "Closed";
    case "EXPIRED":
      return "Expired";
    default:
      return "Unknown";
  }
}

function formatJobType(jobType?: string) {
  switch (jobType) {
    case "FULL_TIME":
      return "Full-time";
    case "PART_TIME":
      return "Part-time";
    case "REMOTE":
      return "Remote";
    case "CONTRACT":
      return "Hợp đồng";
    case "INTERNSHIP":
      return "Thực tập";
    default:
      return "Chưa cập nhật";
  }
}

function formatDate(date?: string) {
  if (!date) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function EmployerJobsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading, isError, refetch } = useGetMyJobs({ page: 1, size: 20 });
  const jobs = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = !search.trim() ||
      job.title?.toLowerCase().includes(search.trim().toLowerCase()) ||
      job.location?.toLowerCase().includes(search.trim().toLowerCase()) ||
      job.company?.toLowerCase().includes(search.trim().toLowerCase());

    const matchesStatus = !status || job.status === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tin tuyển dụng</h1>
          <p className="text-sm text-muted-foreground">{total} tin tuyển dụng</p>
        </div>
        <Link to="/employer/jobs/new">
          <Button className="gap-2">
            <Plus className="size-4" /> Đăng tin mới
          </Button>
        </Link>
      </div>

      <div className="card-surface p-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo vị trí, công ty hoặc địa điểm..."
            className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-md border border-input bg-background text-sm px-3"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="card-surface p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-14 rounded-lg bg-muted/60 animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="card-surface p-6 text-sm flex items-center justify-between">
          <span>Không thể tải danh sách tin tuyển dụng.</span>
          <Button variant="outline" onClick={() => refetch()}>Tải lại</Button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="card-surface overflow-hidden">
          {filteredJobs.length === 0 ? (
            <div className="p-8 text-sm text-muted-foreground text-center">
              Chưa có tin tuyển dụng phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="text-left py-3 px-4">Vị trí</th>
                  <th className="text-left py-3 px-4">Trạng thái</th>
                  <th className="text-right py-3 px-4">Ứng viên</th>
                  <th className="text-left py-3 px-4">Loại hình</th>
                  <th className="text-left py-3 px-4">Ngày tạo</th>
                  <th className="text-right py-3 px-4">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="border-t border-border hover:bg-accent/40">
                    <td className="py-3 px-4">
                      <Link to="/employer/applicants" className="font-medium hover:text-primary">
                        {job.title || "Untitled job"}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {job.location || "Chưa cập nhật"} • {formatJobType(job.jobType)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={formatStatus(job.status)} />
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">-</td>
                    <td className="py-3 px-4 text-muted-foreground">{formatJobType(job.jobType)}</td>
                    <td className="py-3 px-4 text-muted-foreground">{formatDate(job.createdAt)}</td>
                    <td className="py-3 px-4 text-right">
                      <Button size="sm" variant="ghost">
                        <MoreVertical className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
