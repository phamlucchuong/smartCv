import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@smart-cv/ui";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { RecruiterApi } from "@smart-cv/api";

import { Upload, FileText, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/employer/setup")({
  head: () => ({ meta: [{ title: "Company Profile Setup — SmartCV" }] }),
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, refetch } = RecruiterApi.useGetMe1();
  const recruiter = data?.data;
  const isApproved = recruiter?.status === 'APPROVED';

  const updateMutation = RecruiterApi.useUpdate();
  const submitMutation = RecruiterApi.useSubmitForApproval();
  const uploadLicenseMutation = RecruiterApi.useUploadBusinessLicense();

  const [form, setForm] = useState({
    companyName: "",
    taxCode: "",
    companyAddress: "",
    companyCity: "",
    companySize: "",
    companyType: "",
    industry: "",
    companyDescription: "",
    companyWebsite: "",
    linkedinUrl: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [licenseFileName, setLicenseFileName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const formInitialized = useRef(false);
  useEffect(() => {
    if (!recruiter || formInitialized.current) return;
    formInitialized.current = true;
    setForm({
      companyName: recruiter.companyName ?? "",
      taxCode: recruiter.taxCode ?? "",
      companyAddress: recruiter.companyAddress ?? "",
      companyCity: recruiter.companyCity ?? "",
      companySize: recruiter.companySize ?? "",
      companyType: recruiter.companyType ?? "",
      industry: recruiter.industry ?? "",
      companyDescription: recruiter.companyDescription ?? "",
      companyWebsite: recruiter.companyWebsite ?? "",
      linkedinUrl: recruiter.linkedinUrl ?? "",
      contactName: recruiter.contactName ?? "",
      contactEmail: recruiter.contactEmail ?? "",
      contactPhone: recruiter.contactPhone ?? "",
    });
    if (recruiter.businessLicenseUrl) setLicenseFileName("Đã tải lên");
  }, [recruiter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLicenseFileName(file.name);
    try {
      await uploadLicenseMutation.mutateAsync({ data: { file } });
      toast.success("Tải lên giấy phép kinh doanh thành công");
      refetch();
    } catch {
      toast.error("Tải lên thất bại. Vui lòng thử lại.");
      setLicenseFileName(null);
    }
  };

  const handleSave = async () => {
    if (!recruiter?.id) return;
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({ id: recruiter.id, data: form });
      toast.success("Đã lưu thông tin");
      refetch();
    } catch {
      toast.error("Lưu thất bại. Vui lòng thử lại.");
      throw new Error("save_failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recruiter?.id) return;
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({ id: recruiter.id, data: form });
      refetch();
      setIsSaving(false);
      await submitMutation.mutateAsync();
      toast.success("Hồ sơ đã được gửi để phê duyệt!");
      navigate({ to: "/employer/pending", replace: true });
    } catch (err: unknown) {
      setIsSaving(false);
      if ((err as Error)?.message === "save_failed") return;
      const code = (err as { response?: { data?: { code?: number } } })?.response?.data?.code;
      if (code === 5004) {
        toast.error("Vui lòng điền đầy đủ các trường bắt buộc trước khi nộp hồ sơ.");
      } else {
        toast.error("Không thể nộp hồ sơ. Vui lòng thử lại.");
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Hoàn thiện hồ sơ công ty</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Điền đầy đủ thông tin để được phê duyệt đăng tuyển dụng.
        </p>
      </div>

      {isApproved && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="size-5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            Tài khoản của bạn đã được xác minh. Để thay đổi thông tin, vui lòng liên hệ{" "}
            <a href="mailto:support@smartcv.vn" className="underline font-medium">
              support@smartcv.vn
            </a>.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company info */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Thông tin công ty</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Tên công ty *" {...field("companyName")} disabled={isApproved} />
            <Field label="Mã số thuế *" {...field("taxCode")} disabled={isApproved} />
            <Field label="Địa chỉ *" {...field("companyAddress")} disabled={isApproved} />
            <Field label="Tỉnh / Thành phố *" {...field("companyCity")} disabled={isApproved} />
            <SelectField
              label="Quy mô *"
              {...field("companySize")}
              disabled={isApproved}
              options={["1-10", "11-50", "51-200", "201-500", "500+"]}
            />
            <SelectField
              label="Loại hình *"
              {...field("companyType")}
              disabled={isApproved}
              options={["STARTUP", "TNHH", "CO_PHAN", "AGENCY", "OUTSOURCING", "PRODUCT"]}
            />
            <Field label="Ngành nghề *" {...field("industry")} disabled={isApproved} />
            <Field label="Website" {...field("companyWebsite")} disabled={isApproved} />
          </div>
          <TextareaField label="Mô tả công ty" {...field("companyDescription")} disabled={isApproved} />
        </section>

        {/* Business license */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Giấy phép kinh doanh *</h2>
          <div
            className="rounded-lg border-2 border-dashed border-border p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => !isApproved && fileInputRef.current?.click()}
          >
            {licenseFileName ? (
              <div className="flex items-center justify-center gap-2 text-primary">
                <FileText className="size-5" />
                <span className="text-sm font-medium">{licenseFileName}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="size-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Tải lên PDF hoặc ảnh (tối đa 10 MB)
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,image/jpeg,image/png"
              onChange={handleFileChange}
              disabled={isApproved}
            />
          </div>
          {uploadLicenseMutation.isPending && (
            <p className="text-sm text-muted-foreground">Đang tải lên...</p>
          )}
        </section>

        {/* HR contact */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Liên hệ HR</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Người phụ trách" {...field("contactName")} disabled={isApproved} />
            <Field label="Email liên hệ" {...field("contactEmail")} type="email" disabled={isApproved} />
            <Field label="Số điện thoại" {...field("contactPhone")} disabled={isApproved} />
            <Field label="LinkedIn" {...field("linkedinUrl")} disabled={isApproved} />
          </div>
        </section>

        {!isApproved && (
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleSave} disabled={isSaving || submitMutation.isPending}>
              {isSaving ? "Đang lưu..." : "Lưu nháp"}
            </Button>
            <Button type="submit" disabled={submitMutation.isPending || uploadLicenseMutation.isPending}>
              {submitMutation.isPending ? "Đang gửi..." : "Nộp hồ sơ để phê duyệt"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="mt-1.5 w-full h-10 rounded-md border border-input px-3 text-sm bg-background disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={3}
        className="mt-1.5 w-full rounded-md border border-input px-3 py-2 text-sm bg-background resize-none disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="mt-1.5 w-full h-10 rounded-md border border-input px-3 text-sm bg-background disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <option value="">Chọn...</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
