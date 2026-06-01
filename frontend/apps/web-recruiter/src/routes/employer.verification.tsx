import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@smart-cv/ui";
import { StatusBadge } from "@/components/ui-kit/StatusBadge";
import { ShieldCheck, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/employer/verification")({
  head: () => ({ meta: [{ title: "Xác minh công ty" }] }),
  component: () => (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Xác minh công ty</h1>
          <p className="text-sm text-muted-foreground">Hoàn tất xác minh để mở khoá đầy đủ tính năng</p>
        </div>
        <StatusBadge status="Verified" />
      </div>

      <div className="card-surface p-5 flex items-center gap-4 bg-success-soft border-success/20">
        <div className="size-12 rounded-full bg-success text-white flex items-center justify-center"><ShieldCheck className="size-6" /></div>
        <div className="flex-1">
          <div className="font-semibold text-success">Tài khoản đã được xác minh</div>
          <div className="text-sm text-foreground/80">Bạn có thể đăng tin và sử dụng đầy đủ tính năng.</div>
        </div>
      </div>

      <div className="card-surface p-6 space-y-4">
        <h2 className="font-semibold">Thông tin công ty</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Tên công ty" value="FPT Software Co., Ltd" />
          <Field label="Mã số thuế" value="0301234567" />
          <Field label="Email doanh nghiệp" value="hr@fpt.com.vn" />
          <Field label="Website" value="https://fpt-software.com" />
          <Field label="Quy mô" value="5000+ nhân viên" />
          <Field label="Ngành nghề" value="Công nghệ thông tin" />
          <Field label="Người liên hệ" value="Trần Thị HR" />
          <Field label="Số điện thoại" value="028 7300 9999" />
        </div>
      </div>

      <div className="card-surface p-6">
        <h2 className="font-semibold mb-4">Giấy phép kinh doanh</h2>
        <div className="rounded-xl border border-success/20 bg-success-soft p-4 flex items-center gap-3">
          <CheckCircle2 className="size-6 text-success" />
          <div className="flex-1">
            <div className="font-medium">business_license_2024.pdf</div>
            <div className="text-xs text-muted-foreground">Đã duyệt • 12/03/2025</div>
          </div>
          <Button variant="outline" size="sm"><Upload className="size-4 mr-1" /> Tải lại</Button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Lưu nháp</Button>
        <Button onClick={() => toast.success("Đã lưu cập nhật")}>Cập nhật thông tin</Button>
      </div>
    </div>
  ),
});

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input defaultValue={value} className="mt-1.5 w-full h-10 rounded-md border border-input px-3 text-sm bg-background" />
    </div>
  );
}
