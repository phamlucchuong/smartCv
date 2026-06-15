import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Stepper } from "@/components/ui-kit/Stepper";
import { Button } from "@smart-cv/ui";
import { AIInsightBox } from "@/components/ui-kit/AIInsightBox";
import { toast } from "sonner";
import { Plus, Minus, X, Search } from "lucide-react";

export const Route = createFileRoute("/employer/jobs/new")({
  head: () => ({ meta: [{ title: "Đăng tin tuyển dụng" }] }),
  component: NewJob,
});

const STEPS = ["Thông tin cơ bản", "Mô tả công việc", "Quy tắc sàng lọc", "Xem trước & Đăng"];

function NewJob() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const [skills, setSkills] = useState(["Java", "Spring Boot", "REST API", "MySQL", "Docker"]);
  const [newSkill, setNewSkill] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(false);

  const [qualifiedThreshold, setQualifiedThreshold] = useState(70);
  const [rejectThreshold, setRejectThreshold] = useState(50);
  const [autoRejectEnabled, setAutoRejectEnabled] = useState(false);
  const [requiredTest, setRequiredTest] = useState("Không");

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill.trim())) {
      toast.error("Kỹ năng này đã tồn tại!");
      return;
    }
    setSkills([...skills, newSkill.trim()]);
    setNewSkill("");
  };

  const handleNextStep = () => {
    if (step === 2) {
      if (qualifiedThreshold <= 0 || rejectThreshold <= 0) {
        toast.error("Ngưỡng điểm sàng lọc phải lớn hơn 0%");
        return;
      }
      if (qualifiedThreshold > 100 || rejectThreshold > 100) {
        toast.error("Ngưỡng điểm tối đa là 100%");
        return;
      }
      if (rejectThreshold >= qualifiedThreshold) {
        toast.error("Ngưỡng tự động từ chối phải thấp hơn ngưỡng đạt yêu cầu");
        return;
      }
    }
    setStep(step + 1);
  };

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
            <S label="Loại hình" opts={["Full-time", "Part-time", "Internship", "Bootcamp", "Hybrid"]} />
            <S label="Hình thức" opts={["Onsite", "Remote", "Hybrid"]} />
            <F label="Số lượng tuyển" value="2" />
            <div className="md:col-span-2 flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="negotiableSalary"
                checked={isNegotiable}
                onChange={(e) => setIsNegotiable(e.target.checked)}
                className="size-4 rounded border-input accent-primary cursor-pointer"
              />
              <label htmlFor="negotiableSalary" className="text-sm font-semibold cursor-pointer">
                Mức lương thỏa thuận (Negotiable)
              </label>
            </div>
            {!isNegotiable && (
              <>
                <F label="Lương tối thiểu (VND)" value="25000000" />
                <F label="Lương tối đa (VND)" value="40000000" />
              </>
            )}
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
              <div className="flex items-center gap-2 pt-8">
                <input
                  type="checkbox"
                  id="requireDegree"
                  className="size-4 rounded border-input accent-primary cursor-pointer"
                  defaultChecked
                />
                <label htmlFor="requireDegree" className="text-sm font-medium cursor-pointer animate-fade-in">
                  Yêu cầu bằng Đại học
                </label>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Kỹ năng yêu cầu</label>
              
              {/* Badges container */}
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((skill, index) => (
                  <span
                    key={skill + index}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 animate-fade-in"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => setSkills(skills.filter((_, i) => i !== index))}
                      className="hover:text-foreground focus:outline-none ml-1 cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Input field and Add button */}
              <div className="flex gap-2 mt-3 max-w-md">
                <input
                  type="text"
                  placeholder="Nhập tên kỹ năng mới (ví dụ: Kubernetes)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  className="flex-1 h-10 rounded-md border border-input px-3 text-sm bg-background"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSkill}
                  className="size-10 p-0 flex items-center justify-center border-dashed cursor-pointer"
                >
                  <Plus className="size-5" />
                </Button>
              </div>
            </div>
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
            <div className="flex flex-wrap items-end gap-6">
              <div className="w-36">
                <label className="text-sm font-medium">Ngưỡng đạt (%)</label>
                <div className="relative mt-1.5 flex items-center">
                  <button
                    type="button"
                    onClick={() => setQualifiedThreshold(prev => Math.max(1, prev - 1))}
                    className="absolute left-1 flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <Minus className="size-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={qualifiedThreshold}
                    onChange={(e) => setQualifiedThreshold(parseInt(e.target.value) || 0)}
                    className="w-full h-10 rounded-md border border-input px-8 text-center text-sm bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQualifiedThreshold(prev => Math.min(100, prev + 1))}
                    className="absolute right-1 flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
              <div className="w-36">
                <label className="text-sm font-medium">Ngưỡng từ chối (%)</label>
                <div className="relative mt-1.5 flex items-center">
                  <button
                    type="button"
                    onClick={() => setRejectThreshold(prev => Math.max(1, prev - 1))}
                    className="absolute left-1 flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <Minus className="size-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={rejectThreshold}
                    onChange={(e) => setRejectThreshold(parseInt(e.target.value) || 0)}
                    className="w-full h-10 rounded-md border border-input px-8 text-center text-sm bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setRejectThreshold(prev => Math.min(100, prev + 1))}
                    className="absolute right-1 flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 pb-2.5">
                <input
                  type="checkbox"
                  id="autoRejectByAI"
                  checked={autoRejectEnabled}
                  onChange={(e) => setAutoRejectEnabled(e.target.checked)}
                  className="size-4 rounded border-input accent-primary cursor-pointer"
                />
                <label htmlFor="autoRejectByAI" className="text-sm font-semibold cursor-pointer select-none">
                  Tự động từ chối bằng AI
                </label>
              </div>
            </div>

            <div>
              <SearchableSelect
                label="Bài kiểm tra bắt buộc"
                value={requiredTest}
                onChange={setRequiredTest}
                opts={["Không", "Backend Technical Test", "General IQ", "Frontend React Test", "Python Core Assessment"]}
              />
            </div>

            <div className="rounded-xl bg-secondary p-4 text-sm space-y-1">
              <div className="font-semibold">Quy tắc áp dụng</div>
              <div>• Điểm ≥ {qualifiedThreshold}% → <span className="text-success font-medium">Qualified</span></div>
              <div>• Điểm {rejectThreshold}–{qualifiedThreshold - 1}% → <span className="text-warning font-medium">Under Review</span></div>
              <div>• Điểm &lt; {rejectThreshold}% → <span className="text-danger font-medium">Not Qualified {autoRejectEnabled && "(Auto-Rejected by AI)"}</span></div>
              <div className="mt-2 text-xs text-muted-foreground border-t border-border/50 pt-1.5">
                {autoRejectEnabled 
                  ? "✓ AI sẽ tự động gửi email từ chối tới các ứng viên dưới ngưỡng mà không cần sự can thiệp từ Recruiter."
                  : "ℹ AI chỉ phân loại và đánh dấu. Recruiter vẫn có thể xem lại và thay đổi quyết định thủ công."
                }
              </div>
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
              <div className="mt-3 text-sm text-success font-semibold">
                {isNegotiable ? "Thỏa thuận" : "25–40M VND"}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span key={s} className="text-xs bg-secondary px-2 py-0.5 rounded-md">{s}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="card-surface p-6 text-sm">
            <h3 className="font-semibold mb-2">Cấu hình AI Screening</h3>
            <div className="text-muted-foreground">
              Qualified ≥ {qualifiedThreshold}% • Under Review {rejectThreshold}–{qualifiedThreshold - 1}% • Auto-reject &lt; {rejectThreshold}% ({autoRejectEnabled ? "AI tự động từ chối" : "AI đánh dấu, Recruiter duyệt"}){requiredTest !== "Không" && ` • Yêu cầu ${requiredTest}`}
            </div>
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
            <Button onClick={handleNextStep}>Tiếp theo</Button>
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

function SearchableSelect({
  label,
  value,
  onChange,
  opts,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  opts: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = opts.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-72">
      <label className="text-sm font-medium">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mt-1.5 w-full h-10 rounded-md border border-input px-3 text-left text-sm bg-background flex items-center justify-between cursor-pointer"
      >
        <span>{value}</span>
        <span className="text-muted-foreground text-[10px]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-md p-1.5 space-y-1 animate-fade-in card-surface">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 rounded pl-8 pr-2.5 text-xs bg-secondary border border-input focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              autoFocus
            />
          </div>
          <div className="max-h-40 overflow-y-auto space-y-0.5 mt-1">
            {filtered.length === 0 ? (
              <div className="text-xs text-muted-foreground p-2">Không tìm thấy kết quả</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => {
                    onChange(o);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-secondary transition-colors cursor-pointer ${
                    o === value ? "bg-primary/10 text-primary font-medium" : ""
                  }`}
                >
                  {o}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
