import { createFileRoute } from "@tanstack/react-router";
import { CANDIDATES } from "@/lib/mock-data";
import { AIScoreRing } from "@/components/ui-kit/AIScoreRing";
import { Button } from "@smart-cv/ui";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/employer/cv-search")({
  head: () => ({ meta: [{ title: "Tìm kiếm CV" }] }),
  component: () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tìm kiếm CV Database</h1>
          <p className="text-sm text-muted-foreground">Tìm ứng viên tiềm năng từ kho CV có sẵn</p>
        </div>
        <div className="rounded-lg bg-ai-soft border border-ai/20 text-ai px-3 py-1.5 text-xs font-medium">
          Gói Pro • Truy cập đầy đủ
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        <aside className="card-surface p-5 space-y-4 h-fit">
          <h3 className="font-semibold">Bộ lọc</h3>
          {["Từ khoá", "Kỹ năng", "Kinh nghiệm", "Địa điểm", "Mức lương mong muốn", "Học vấn", "Sẵn sàng đi làm"].map((l) => (
            <div key={l}>
              <label className="text-xs font-medium text-muted-foreground">{l}</label>
              <input className="mt-1 w-full h-9 rounded-md border border-input px-3 text-sm bg-background" />
            </div>
          ))}
        </aside>

        <div className="space-y-3">
          {CANDIDATES.map((c, i) => (
            <div key={c.id} className="card-surface p-5 flex items-center gap-4">
              <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                {i % 2 ? <Lock className="size-5" /> : c.name.split(" ").pop()?.[0]}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{i % 2 ? "Ứng viên ***" : c.name}</div>
                <div className="text-sm text-muted-foreground">{c.title} • {c.location} • {c.experience}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.skills.map((s) => <span key={s} className="text-xs bg-secondary px-2 py-0.5 rounded">{s}</span>)}
                </div>
              </div>
              <AIScoreRing score={c.score} size={56} thickness={6} label="AI fit" />
              <div className="flex flex-col gap-2">
                <Button size="sm">Xem hồ sơ</Button>
                <Button size="sm" variant="outline">Mời ứng tuyển</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
});
