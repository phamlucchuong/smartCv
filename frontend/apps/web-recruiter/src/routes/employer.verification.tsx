import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@smart-cv/ui";
import { StatusBadge } from "@/components/ui-kit/StatusBadge";
import { ShieldCheck, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@smart-cv/i18n";

export const Route = createFileRoute("/employer/verification")({
  head: () => ({ meta: [{ title: "Company Verification" }] }),
  component: VerificationPage,
});

function VerificationPage() {
  const { t } = useTranslation();

  return (
    <div className="w-full space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("recruiter_verification_title")}</h1>
          <p className="text-sm text-muted-foreground">{t("recruiter_verification_subtitle")}</p>
        </div>
        <StatusBadge status="Verified" />
      </div>

      <div className="card-surface p-5 flex items-center gap-4 bg-success-soft border-success/20">
        <div className="size-12 rounded-full bg-success text-white flex items-center justify-center"><ShieldCheck className="size-6" /></div>
        <div className="flex-1">
          <div className="font-semibold text-success">{t("recruiter_verified_title")}</div>
          <div className="text-sm text-foreground/80">{t("recruiter_verified_desc")}</div>
        </div>
      </div>

      <div className="card-surface p-6 space-y-4">
        <h2 className="font-semibold">{t("recruiter_company_info")}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label={t("recruiter_company_name")} value="FPT Software Co., Ltd" />
          <Field label={t("recruiter_tax_id")} value="0301234567" />
          <Field label={t("recruiter_business_email")} value="hr@fpt.com.vn" />
          <Field label={t("recruiter_website")} value="https://fpt-software.com" />
          <Field label={t("recruiter_company_size")} value="5000+ nhân viên" />
          <Field label={t("recruiter_industry")} value="Công nghệ thông tin" />
          <Field label={t("recruiter_contact_name")} value="Trần Thị HR" />
          <Field label={t("recruiter_phone")} value="028 7300 9999" />
        </div>
      </div>

      <div className="card-surface p-6">
        <h2 className="font-semibold mb-4">{t("recruiter_business_license")}</h2>
        <div className="rounded-xl border border-success/20 bg-success-soft p-4 flex items-center gap-3">
          <CheckCircle2 className="size-6 text-success" />
          <div className="flex-1">
            <div className="font-medium">business_license_2024.pdf</div>
            <div className="text-xs text-muted-foreground">{t("recruiter_approved_date")}</div>
          </div>
          <Button variant="outline" size="sm"><Upload className="size-4 mr-1" /> {t("recruiter_reupload")}</Button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline">{t("recruiter_save_draft")}</Button>
        <Button onClick={() => toast.success(t("recruiter_update_saved"))}>{t("recruiter_update_info")}</Button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input defaultValue={value} className="mt-1.5 w-full h-10 rounded-md border border-input px-3 text-sm bg-background" />
    </div>
  );
}
