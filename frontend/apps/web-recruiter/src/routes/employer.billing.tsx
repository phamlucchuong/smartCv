import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@smart-cv/ui";
import { StatusBadge } from "@/components/ui-kit/StatusBadge";
import { CheckCircle2, Zap } from "lucide-react";

const PLANS = [
  { name: "Basic", price: "Miễn phí", perks: ["3 tin/tháng", "AI Screening cơ bản"] },
  { name: "Pro", price: "2,990,000₫/tháng", perks: ["20 tin/tháng", "AI Screening nâng cao", "Truy cập CV Database"], featured: true },
  { name: "Premium", price: "Liên hệ", perks: ["Không giới hạn", "Account Manager", "API ATS"] },
];
const PAYMENTS = [
  { id: "INV-001234", pkg: "Pro", amount: "2,990,000₫", status: "Paid", date: "2025-05-15" },
  { id: "INV-001233", pkg: "Pro", amount: "2,990,000₫", status: "Paid", date: "2025-04-15" },
  { id: "INV-001232", pkg: "Boost x3", amount: "450,000₫", status: "Pending", date: "2025-05-20" },
  { id: "INV-001231", pkg: "Pro", amount: "2,990,000₫", status: "Refunded", date: "2025-03-15" },
];

export const Route = createFileRoute("/employer/billing")({
  head: () => ({ meta: [{ title: "Gói & Thanh toán" }] }),
  component: () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gói & Thanh toán</h1>

      <div className="card-surface p-6 bg-gradient-to-br from-primary to-brand-blue text-primary-foreground border-0 grid md:grid-cols-2 gap-6 items-center">
        <div>
          <div className="text-sm opacity-90">Gói hiện tại</div>
          <div className="text-3xl font-bold mt-1">Pro</div>
          <div className="text-sm opacity-90 mt-1">Gia hạn 15/06/2025</div>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary">Nâng cấp</Button>
            <Button variant="outline" className="bg-transparent text-primary-foreground border-white/30 hover:bg-white/10 hover:text-primary-foreground"><Zap className="size-4 mr-1" /> Mua Boost</Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat l="Tin tháng" v="8/20" />
          <Stat l="Boost còn" v="3" />
          <Stat l="CV access" v="Có" />
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Các gói có sẵn</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((p) => (
            <div key={p.name} className={`card-surface p-5 ${p.featured ? "ring-2 ring-primary" : ""}`}>
              <h3 className="font-bold text-lg">{p.name}</h3>
              <div className="text-xl font-bold mt-1 text-primary">{p.price}</div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {p.perks.map((x) => <li key={x} className="flex gap-2"><CheckCircle2 className="size-4 text-success shrink-0" /> {x}</li>)}
              </ul>
              <Button className="w-full mt-4" variant={p.featured ? "default" : "outline"}>Chọn gói</Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Lịch sử thanh toán</h2>
        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr><th className="text-left py-3 px-4">Mã HD</th><th className="text-left py-3 px-4">Gói</th><th className="text-left py-3 px-4">Số tiền</th><th className="text-left py-3 px-4">Trạng thái</th><th className="text-left py-3 px-4">Ngày</th><th></th></tr>
            </thead>
            <tbody>
              {PAYMENTS.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-accent/30">
                  <td className="py-3 px-4 font-mono text-xs">{p.id}</td>
                  <td className="py-3 px-4">{p.pkg}</td>
                  <td className="py-3 px-4 font-semibold">{p.amount}</td>
                  <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                  <td className="py-3 px-4 text-muted-foreground">{p.date}</td>
                  <td className="py-3 px-4 text-right"><Button size="sm" variant="ghost">Hoá đơn</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ),
});

function Stat({ l, v }: { l: string; v: string }) {
  return (
    <div className="rounded-lg bg-white/10 p-3 text-center">
      <div className="text-xl font-bold">{v}</div>
      <div className="text-xs opacity-80">{l}</div>
    </div>
  );
}
