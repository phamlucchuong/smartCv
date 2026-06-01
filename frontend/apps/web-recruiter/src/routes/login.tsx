import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@smart-cv/ui";
import { Sparkles, Mail, Lock, Brain, Target, Zap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Đăng nhập — SmartCV" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"candidate" | "employer">("candidate");

  const loginAs = (role: "candidate" | "employer" | "admin") => {
    toast.success(`Đăng nhập demo: ${role}`);
    navigate({ to: role === "employer" ? "/employer" : "/login" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Form */}
      <div className="flex flex-col px-6 lg:px-16 py-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <span className="font-bold text-lg">SmartCV</span>
        </Link>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <h1 className="text-3xl font-bold">Chào mừng trở lại</h1>
            <p className="text-muted-foreground mt-2">Đăng nhập để tiếp tục với SmartCV</p>

            <div className="mt-6 grid grid-cols-2 gap-2 p-1 rounded-lg bg-secondary">
              {(["candidate", "employer"] as const).map((t) => (
                <button key={t}
                  onClick={() => setTab(t)}
                  className={`py-2 rounded-md text-sm font-medium transition-colors ${
                    tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                  }`}>
                  {t === "candidate" ? "Ứng viên" : "Nhà tuyển dụng"}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input defaultValue={tab === "candidate" ? "minhanh@example.com" : "hr@company.com"}
                    className="w-full h-11 pl-9 pr-3 rounded-md border border-input bg-background text-sm" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Mật khẩu</label>
                  <a className="text-xs text-primary hover:underline cursor-pointer">Quên mật khẩu?</a>
                </div>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input type="password" defaultValue="demo1234" className="w-full h-11 pl-9 pr-3 rounded-md border border-input bg-background text-sm" />
                </div>
              </div>

              <Button className="w-full h-11" onClick={() => loginAs(tab)}>Tiếp tục</Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">Hoặc đăng nhập nhanh demo</span></div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => loginAs("candidate")}>Ứng viên</Button>
                <Button variant="outline" size="sm" onClick={() => loginAs("employer")}>NTD</Button>
                <Button variant="outline" size="sm" onClick={() => loginAs("admin")}>Admin</Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Chưa có tài khoản? <a className="text-primary font-medium cursor-pointer">Đăng ký ngay</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual */}
      <div className="hidden lg:flex relative items-center justify-center bg-gradient-to-br from-primary via-brand-blue to-ai p-12 text-primary-foreground">
        <div className="max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
            <Sparkles className="size-3.5" /> AI Recruitment Platform
          </div>
          <h2 className="text-3xl font-bold leading-tight">Hơn 1 triệu CV đã được phân tích bằng AI</h2>
          <div className="space-y-3">
            {[
              { icon: Brain, title: "AI CV Matching", desc: "Điểm phù hợp tức thời" },
              { icon: Target, title: "Smart Recommendation", desc: "Gợi ý việc làm thông minh" },
              { icon: Zap, title: "Auto Screening", desc: "Tự động sàng lọc CV" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 rounded-xl bg-white/10 backdrop-blur p-4 border border-white/20">
                <div className="size-9 rounded-lg bg-white/20 flex items-center justify-center"><f.icon className="size-4" /></div>
                <div>
                  <div className="font-semibold">{f.title}</div>
                  <div className="text-sm opacity-80">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
