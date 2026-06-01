import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@smart-cv/ui";
import {
  Search, MapPin, Briefcase, DollarSign, Sparkles, Brain, Target, Zap, ArrowRight, CheckCircle2,
  Building2, Clock,
} from "lucide-react";
import { JOBS } from "@/lib/mock-data";
import { AIScoreRing } from "@/components/ui-kit/AIScoreRing";

export const Route = createFileRoute("/_public/")({
  head: () => ({
    meta: [
      { title: "SmartCV — Tuyển dụng thông minh với AI" },
      { name: "description", content: "Tìm việc tốt hơn và tuyển dụng nhanh hơn với AI matching CV." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 ai-gradient opacity-60 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-ai/20 bg-ai-soft px-3 py-1 text-xs font-medium text-ai mb-5">
              <Sparkles className="size-3.5" /> Powered by AI Matching Engine
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              Tìm việc tốt hơn và tuyển dụng <span className="text-primary">thông minh hơn</span> với AI
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              SmartCV giúp ứng viên biết mức độ phù hợp <strong>trước khi ứng tuyển</strong> và giúp
              nhà tuyển dụng sàng lọc CV nhanh hơn 10 lần bằng AI.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/jobs"><Button size="lg" className="gap-2">Tìm việc ngay <ArrowRight className="size-4" /></Button></Link>
              <Link to="/for-employers"><Button size="lg" variant="outline">Đăng tuyển dụng</Button></Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> 50,000+ việc làm</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> 200+ doanh nghiệp</div>
            </div>
          </div>

          {/* AI Match Card */}
          <div className="relative">
            <div className="card-surface p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-muted-foreground">AI Match Result</div>
                  <div className="font-semibold text-lg">Backend Java Developer</div>
                  <div className="text-sm text-muted-foreground">FPT Software</div>
                </div>
                <AIScoreRing score={82} size={88} />
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1.5">Kỹ năng phù hợp</div>
                  <div className="flex flex-wrap gap-1.5">
                    {["Java", "REST API", "MySQL"].map((s) => (
                      <span key={s} className="rounded-md bg-success-soft text-success text-xs px-2 py-0.5 border border-success/20">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1.5">Kỹ năng còn thiếu</div>
                  <div className="flex flex-wrap gap-1.5">
                    {["Spring Boot", "Docker"].map((s) => (
                      <span key={s} className="rounded-md bg-danger-soft text-danger text-xs px-2 py-0.5 border border-danger/20">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-ai/20 bg-ai-soft p-3 text-xs text-foreground/80">
                  <div className="flex items-center gap-1.5 font-medium text-ai mb-1">
                    <Sparkles className="size-3.5" /> 5 việc khác phù hợp hơn được gợi ý
                  </div>
                  Hãy cải thiện Spring Boot và Docker để tăng cơ hội.
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 card-surface p-3 hidden md:flex items-center gap-2">
              <div className="size-8 rounded-lg bg-ai text-ai-foreground flex items-center justify-center"><Brain className="size-4" /></div>
              <div className="text-xs"><div className="font-semibold">AI Analysis</div><div className="text-muted-foreground">Live</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Job search bar */}
      <section className="mx-auto max-w-7xl px-6 -mt-6 relative z-10">
        <div className="card-surface p-2 flex flex-col md:flex-row gap-2">
          <div className="flex items-center gap-2 flex-1 px-3">
            <Search className="size-4 text-muted-foreground" />
            <input placeholder="Vị trí, kỹ năng..." className="h-11 flex-1 bg-transparent outline-none text-sm" />
          </div>
          <div className="flex items-center gap-2 flex-1 px-3 border-t md:border-t-0 md:border-l border-border">
            <MapPin className="size-4 text-muted-foreground" />
            <input placeholder="Địa điểm" className="h-11 flex-1 bg-transparent outline-none text-sm" />
          </div>
          <div className="flex items-center gap-2 flex-1 px-3 border-t md:border-t-0 md:border-l border-border">
            <Briefcase className="size-4 text-muted-foreground" />
            <input placeholder="Loại hình" className="h-11 flex-1 bg-transparent outline-none text-sm" />
          </div>
          <div className="flex items-center gap-2 flex-1 px-3 border-t md:border-t-0 md:border-l border-border">
            <DollarSign className="size-4 text-muted-foreground" />
            <input placeholder="Mức lương" className="h-11 flex-1 bg-transparent outline-none text-sm" />
          </div>
          <Link to="/jobs"><Button size="lg" className="h-11 w-full md:w-auto">Tìm kiếm</Button></Link>
        </div>
      </section>

      {/* AI Features */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-12">
          <div className="text-sm font-semibold text-ai uppercase tracking-wider">AI Features</div>
          <h2 className="text-3xl font-bold mt-2">Trí tuệ nhân tạo cho mọi bước tuyển dụng</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "AI CV Matching", desc: "So khớp CV với mô tả công việc và trả về điểm phù hợp 0–100% tức thời.", color: "ai" },
            { icon: Zap, title: "AI Auto Screening", desc: "Tự động sàng lọc ứng viên theo ngưỡng điểm và rule cấu hình.", color: "primary" },
            { icon: Target, title: "Smart Job Recommendation", desc: "Gợi ý việc làm phù hợp hơn dựa trên kỹ năng và lịch sử ứng tuyển.", color: "success" },
          ].map((f) => (
            <div key={f.title} className="card-surface p-6 hover:shadow-md transition-shadow">
              <div className={`flex size-12 items-center justify-center rounded-xl mb-4 ${
                f.color === "ai" ? "bg-ai-soft text-ai" : f.color === "primary" ? "bg-primary/10 text-primary" : "bg-success-soft text-success"
              }`}>
                <f.icon className="size-6" />
              </div>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{f.desc}</p>
              <div className="mt-4 pt-4 border-t border-border text-xs text-ai font-medium flex items-center gap-1">
                <Sparkles className="size-3.5" /> AI-powered
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured jobs */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">Việc làm nổi bật</h2>
            <p className="text-muted-foreground mt-1">Cập nhật mỗi ngày từ các công ty hàng đầu</p>
          </div>
          <Link to="/jobs" className="text-sm text-primary font-medium hover:underline">Xem tất cả →</Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {JOBS.map((j) => (
            <Link key={j.id} to="/jobs/$id" params={{ id: j.id }} className="card-surface p-5 hover:shadow-md hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold leading-tight">{j.title}</div>
                    <div className="text-xs text-muted-foreground">{j.company}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-2"><DollarSign className="size-3.5" /> {j.salary}</div>
                <div className="flex items-center gap-2"><MapPin className="size-3.5" /> {j.location}</div>
                <div className="flex items-center gap-2"><Clock className="size-3.5" /> {j.postedDays} ngày trước</div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border">
                {j.skills.slice(0, 3).map((s) => (
                  <span key={s} className="text-xs bg-secondary px-2 py-0.5 rounded-md text-secondary-foreground">{s}</span>
                ))}
                {j.skills.length > 3 && <span className="text-xs text-muted-foreground">+{j.skills.length - 3}</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Employer CTA */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="card-surface p-10 grid lg:grid-cols-2 gap-8 items-center bg-gradient-to-br from-primary to-brand-blue text-primary-foreground border-0">
          <div>
            <h2 className="text-3xl font-bold">Tuyển dụng cùng SmartCV</h2>
            <p className="mt-3 opacity-90">Tự động hoá sàng lọc CV, quản lý ATS và sinh câu hỏi phỏng vấn bằng AI.</p>
            <ul className="mt-5 space-y-2 text-sm opacity-90">
              {["Giảm 80% thời gian sàng lọc thủ công", "Cấu hình quy tắc screening linh hoạt", "Pipeline ATS Kanban trực quan", "AI sinh câu hỏi phỏng vấn theo CV"].map((t) => (
                <li key={t} className="flex items-center gap-2"><CheckCircle2 className="size-4" /> {t}</li>
              ))}
            </ul>
            <Link to="/login" className="inline-block mt-6">
              <Button size="lg" variant="secondary">Start hiring with SmartCV</Button>
            </Link>
          </div>
          <div className="hidden lg:block">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              <div className="text-sm opacity-80 mb-2">AI Screening Summary</div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-white/10 p-3"><div className="text-2xl font-bold">42</div><div className="text-xs opacity-80">Auto-qualified</div></div>
                <div className="rounded-lg bg-white/10 p-3"><div className="text-2xl font-bold">18</div><div className="text-xs opacity-80">Manual review</div></div>
                <div className="rounded-lg bg-white/10 p-3"><div className="text-2xl font-bold">26</div><div className="text-xs opacity-80">Auto-rejected</div></div>
              </div>
              <div className="mt-3 text-xs opacity-80">Avg match score: <span className="font-semibold">68%</span></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
