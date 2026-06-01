import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Stepper } from "@/components/ui-kit/Stepper";
import { Button } from "@smart-cv/ui";
import { AIInsightBox } from "@/components/ui-kit/AIInsightBox";
import { toast } from "sonner";

export const Route = createFileRoute("/employer/jobs/new")({
  head: () => ({ meta: [{ title: "Đăng tin tuyển dụng" }] }),
  component: NewJob,
});

const STEPS = ["Thông tin cơ bản", "Mô tả công việc", "Quy tắc sàng lọc", "Xem trước & Đăng"];

function NewJob() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Đăng tin tuyển dụng mới</h1>
      <div className="card-surface p-5"><Stepper steps={STEPS} current={step} /></div>

      {step === 0 && (
        <div className="card-surface p-6 space-y-4">
          <h2 className="font-semibold">Thông tin cơ bản</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <F label="Vị trí" value="Backend Java Developer" />
            <F label="Phòng ban" value="Engineering" />
            <F label="Địa điểm" value="Ho Chi Minh City" />
            <S label="Loại hình" opts={["Full-time", "Part-time"]} />
            <S label="Hình thức" opts={["Onsite", "Remote", "Hybrid"]} />
            <F label="Số lượng tuyển" value="2" />
            <F label="Lương min" value="25000000" />
            <F label="Lương max" value="40000000" />
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4">
          <div className="card-surface p-6 space-y-4">
            <h2 className="font-semibold">Mô tả công việc</h2>
            <T label="Mô tả" />
            <T label="Trách nhiệm" />
            <T label="Yêu cầu" />
            <T label="Quyền lợi" />
            <div className="grid md:grid-cols-2 gap-4">
              <S label="Kinh nghiệm" opts={["1-3 năm", "3-5 năm", "5+ năm"]} />
              <S label="Học vấn" opts={["Cử nhân", "Thạc sĩ"]} />
            </div>
            <F label="Kỹ năng (cách nhau bởi dấu phẩy)" value="Java, Spring Boot, REST API, MySQL, Docker" />
          </div>
          <AIInsightBox title="Gợi ý AI">
            <ul className="list-disc list-inside space-y-1">
              <li>Thêm ít nhất 5 kỹ năng để tăng độ chính xác sàng lọc.</li>
              <li>Việc có mức lương cụ thể nhận nhiều ứng tuyển hơn 40%.</li>
            </ul>
          </AIInsightBox>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div className="card-surface p-6 space-y-4">
            <h2 className="font-semibold">Quy tắc sàng lọc AI</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <F label="Ngưỡng đạt yêu cầu (%)" value="70" />
              <F label="Ngưỡng tự động từ chối (%)" value="50" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <S label="Bài kiểm tra bắt buộc" opts={["Không", "Backend Technical Test", "General IQ"]} />
              <F label="Knockout questions" value="(Tuỳ chọn)" />
            </div>
            <div className="rounded-xl bg-secondary p-4 text-sm space-y-1">
              <div className="font-semibold">Quy tắc áp dụng</div>
              <div>• Điểm ≥ 70% → <span className="text-success font-medium">Qualified</span></div>
              <div>• Điểm 50–69% → <span className="text-warning font-medium">Under Review</span></div>
              <div>• Điểm &lt; 50% → <span className="text-danger font-medium">Not Qualified</span></div>
            </div>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="card-surface p-6">
            <h2 className="font-semibold">Xem trước tin tuyển dụng</h2>
            <div className="mt-4 rounded-xl border border-border p-5">
              <h3 className="text-xl font-bold">Backend Java Developer</h3>
              <div className="text-sm text-muted-foreground">FPT Software • Ho Chi Minh City • Hybrid</div>
              <div className="mt-3 text-sm text-success font-semibold">25–40M VND</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Java", "Spring Boot", "REST API", "MySQL", "Docker"].map((s) => (
                  <span key={s} className="text-xs bg-secondary px-2 py-0.5 rounded-md">{s}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="card-surface p-6 text-sm">
            <h3 className="font-semibold mb-2">Cấu hình AI Screening</h3>
            <div className="text-muted-foreground">Qualified ≥ 70% • Under Review 50–69% • Auto-reject &lt; 50% • Yêu cầu Backend Technical Test</div>
          </div>
          <div className="card-surface p-6 text-sm flex justify-between">
            <div>Gói hiện tại: <strong>Pro</strong> • Còn lại 12/20 tin trong tháng</div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate({ to: "/employer/jobs" })}>
          {step === 0 ? "Huỷ" : "Quay lại"}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">Lưu nháp</Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>Tiếp theo</Button>
          ) : (
            <Button onClick={() => { toast.success("Đăng tin thành công"); navigate({ to: "/employer/jobs" }); }}>Đăng tin</Button>
          )}
        </div>
      </div>
    </div>
  );
}

function F({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input defaultValue={value} className="mt-1.5 w-full h-10 rounded-md border border-input px-3 text-sm bg-background" />
    </div>
  );
}
function S({ label, opts }: { label: string; opts: string[] }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <select className="mt-1.5 w-full h-10 rounded-md border border-input px-3 text-sm bg-background">
        {opts.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
function T({ label }: { label: string }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <textarea rows={3} className="mt-1.5 w-full rounded-md border border-input px-3 py-2 text-sm bg-background" placeholder={`Nhập ${label.toLowerCase()}...`} />
    </div>
  );
}
