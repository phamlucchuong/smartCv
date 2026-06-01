import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/employer/notifications")({
  head: () => ({ meta: [{ title: "Thông báo" }] }),
  component: () => (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-5">Thông báo</h1>
      <div className="card-surface divide-y divide-border">
        {[
          "5 ứng viên mới cho Backend Java Developer",
          "Đơn ứng tuyển của Phạm Quốc Huy đạt 91% match",
          "Gói Pro sẽ gia hạn trong 7 ngày",
        ].map((t, i) => (
          <div key={i} className="p-4 flex justify-between">
            <div className="text-sm">{t}</div>
            <div className="text-xs text-muted-foreground">{i + 1}h trước</div>
          </div>
        ))}
      </div>
    </div>
  ),
});
