import { createFileRoute } from "@tanstack/react-router";
import { CANDIDATES } from "@/lib/mock-data";
import { AIScoreRing } from "@/components/ui-kit/AIScoreRing";
import { StatusBadge } from "@/components/ui-kit/StatusBadge";
import { AIInsightBox } from "@/components/ui-kit/AIInsightBox";
import { SkillGapCard } from "@/components/ui-kit/SkillGapCard";
import { Button } from "@smart-cv/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@smart-cv/ui";
import { Mail, Phone, MapPin, FileText, Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/employer/applicants/$id")({
  head: () => ({ meta: [{ title: "Chi tiết ứng viên" }] }),
  component: CandidateDetail,
});

function CandidateDetail() {
  const { id } = Route.useParams();
  const c = CANDIDATES.find((x) => x.id === id) ?? CANDIDATES[0];
  const [questions, setQuestions] = useState<string[] | null>(null);

  const generateQuestions = () => {
    setQuestions([
      `Hãy mô tả kinh nghiệm của bạn với ${c.skills[0]} và các dự án đã triển khai.`,
      `Bạn đã tham gia dự án nào có quy mô lớn? Vai trò và đóng góp cụ thể?`,
      `Một bug khó nhất bạn từng debug, bạn đã xử lý như thế nào?`,
      `Khi làm việc với team, bạn xử lý xung đột kỹ thuật ra sao?`,
      `Vì sao bạn muốn ứng tuyển vào vị trí ${c.appliedJob} tại công ty chúng tôi?`,
    ]);
    toast.success("Đã sinh 5 câu hỏi phỏng vấn từ AI");
  };

  return (
    <div className="space-y-5">
      <div className="card-surface p-6 flex flex-wrap items-center gap-5">
        <div className="size-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
          {c.name.split(" ").pop()?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">{c.name}</h1>
          <div className="text-muted-foreground">{c.title} • Ứng tuyển: <strong>{c.appliedJob}</strong></div>
          <div className="mt-2 flex items-center gap-3"><StatusBadge status={c.status} /><span className="text-xs text-muted-foreground">ATS: Interview</span></div>
        </div>
        <AIScoreRing score={c.score} size={88} />
        <div className="flex flex-col gap-2">
          <Button>Chuyển stage</Button>
          <Button variant="outline">Hẹn phỏng vấn</Button>
          <Button variant="ghost" className="text-danger">Từ chối</Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="cv">CV</TabsTrigger>
          <TabsTrigger value="ai">Phân tích AI</TabsTrigger>
          <TabsTrigger value="test">Bài test</TabsTrigger>
          <TabsTrigger value="interview">Phỏng vấn</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5 grid lg:grid-cols-3 gap-4">
          <div className="card-surface p-5 lg:col-span-2 space-y-4">
            <h3 className="font-semibold">Tóm tắt ứng viên</h3>
            <p className="text-sm text-foreground/80">{c.experience} kinh nghiệm trong ngành CNTT, thế mạnh về {c.skills.join(", ")}.</p>
            <div>
              <h4 className="font-semibold text-sm mb-2">Kinh nghiệm làm việc</h4>
              <div className="rounded-xl border border-border p-4">
                <div className="font-medium">{c.title}</div>
                <div className="text-xs text-muted-foreground">FPT Software • 2022 - Hiện tại</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Kỹ năng</h4>
              <div className="flex flex-wrap gap-1.5">
                {c.skills.map((s) => <span key={s} className="text-xs bg-success-soft text-success border border-success/20 px-2 py-0.5 rounded-md">{s}</span>)}
              </div>
            </div>
          </div>
          <div className="card-surface p-5 space-y-3">
            <h3 className="font-semibold">Liên hệ</h3>
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" /> {c.email}</div>
              <div className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /> {c.phone}</div>
              <div className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /> {c.location}</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cv" className="mt-5 card-surface p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">CV ứng viên</h3>
            <Button variant="outline" size="sm"><FileText className="size-4 mr-1" /> Tải xuống CV</Button>
          </div>
          <div className="aspect-[3/4] max-w-md mx-auto rounded-lg bg-muted flex items-center justify-center text-muted-foreground border-2 border-dashed border-border">
            CV Preview
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-5 grid lg:grid-cols-3 gap-4">
          <div className="card-surface p-5 lg:col-span-2 space-y-4">
            <h3 className="font-semibold">Chi tiết Matching Score</h3>
            <div className="flex items-center gap-6">
              <AIScoreRing score={c.score} size={120} thickness={10} />
              <div className="flex-1 space-y-2">
                {[
                  { l: "Skills match", v: 82 },
                  { l: "Experience match", v: 75 },
                  { l: "Education match", v: 88 },
                  { l: "Keyword match", v: 70 },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="flex justify-between text-xs mb-1"><span>{s.l}</span><span className="font-semibold">{s.v}%</span></div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${s.v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <AIInsightBox title="AI Recommendation">
              <div className="mb-2"><StatusBadge status={c.score >= 70 ? "Qualified" : "Under Review"} /></div>
              Ứng viên có kỹ năng cốt lõi phù hợp. HR cần kiểm tra thêm kinh nghiệm thực tế với <strong>{c.missingSkills.join(", ")}</strong> qua phỏng vấn.
            </AIInsightBox>
          </div>
          <SkillGapCard matched={c.skills} missing={c.missingSkills} suggested={["Microservices", "Kubernetes"]} />
        </TabsContent>

        <TabsContent value="test" className="mt-5 card-surface p-5">
          <h3 className="font-semibold mb-4">Kết quả bài test</h3>
          {c.assessmentScore ? (
            <div className="space-y-4">
              <div className="text-4xl font-bold text-success">{c.assessmentScore}/100</div>
              <div className="text-sm text-muted-foreground">Hoàn thành lúc: 25/05/2025 14:30</div>
              <div className="grid sm:grid-cols-3 gap-3">
                {[{ l: "Java", v: 90 }, { l: "Database", v: 85 }, { l: "System Design", v: 70 }].map((s) => (
                  <div key={s.l} className="rounded-xl border border-border p-4">
                    <div className="text-xs text-muted-foreground">{s.l}</div>
                    <div className="text-2xl font-bold">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Chưa có bài test nào được gửi.</div>
          )}
        </TabsContent>

        <TabsContent value="interview" className="mt-5 card-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Câu hỏi phỏng vấn AI</h3>
            <Button onClick={generateQuestions} className="gap-2"><Sparkles className="size-4" /> Sinh câu hỏi</Button>
          </div>
          {questions ? (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={i} className="rounded-xl border border-border p-4 flex gap-3">
                  <div className="size-7 rounded-full bg-ai text-ai-foreground flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                  <div className="flex-1 text-sm">{q}</div>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard?.writeText(q); toast("Đã copy"); }}><Copy className="size-3.5" /></Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Bấm "Sinh câu hỏi" để AI tạo 5 câu hỏi phỏng vấn dựa trên CV và mô tả công việc.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
