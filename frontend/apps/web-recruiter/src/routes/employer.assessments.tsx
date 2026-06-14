import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@smart-cv/ui";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/employer/assessments")({
  head: () => ({ meta: [{ title: "Bài kiểm tra" }] }),
  component: () => (
    <div className="space-y-5">
      <div className="flex justify-between items-end">
        <h1 className="text-2xl font-bold">Quản lý bài kiểm tra</h1>
        <Button className="gap-1"><Plus className="size-4" /> Tạo bài test</Button>
      </div>
      <div className="card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
            <tr>
              <th className="text-left py-3 px-4">Tên bài test</th>
              <th className="text-left py-3 px-4">Loại</th>
              <th className="text-left py-3 px-4">Thời gian</th>
              <th className="text-right py-3 px-4">Số câu</th>
              <th className="text-left py-3 px-4">Áp dụng cho</th>
              <th className="text-right py-3 px-4">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {[
              { t: "Backend Technical Test", type: "Technical", d: 60, q: 20, j: "Backend Java Developer" },
              { t: "Frontend Skill Check", type: "Technical", d: 45, q: 15, j: "Frontend React Developer" },
              { t: "General IQ Test", type: "IQ", d: 30, q: 25, j: "Tất cả vị trí" },
              { t: "EQ Assessment", type: "EQ", d: 25, q: 20, j: "Business Analyst" },
            ].map((a) => (
              <tr key={a.t} className="border-t border-border hover:bg-accent/30">
                <td className="py-3 px-4 font-medium">{a.t}</td>
                <td className="py-3 px-4"><span className="rounded-md bg-ai-soft text-ai border border-ai/20 px-2 py-0.5 text-xs">{a.type}</span></td>
                <td className="py-3 px-4">{a.d} phút</td>
                <td className="py-3 px-4 text-right">{a.q}</td>
                <td className="py-3 px-4 text-muted-foreground">{a.j}</td>
                <td className="py-3 px-4 text-right"><Button size="sm" variant="ghost">Sửa</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ),
});
