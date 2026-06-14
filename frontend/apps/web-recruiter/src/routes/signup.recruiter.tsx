import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@smart-cv/ui";
import { Sparkles, Building2, User, Mail, Lock, Phone } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@smart-cv/i18n";

export const Route = createFileRoute("/signup/recruiter")({
  head: () => ({ meta: [{ title: "Đăng ký nhà tuyển dụng — SmartCV" }] }),
  component: RecruiterSignup,
});

function RecruiterSignup() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSignup = () => {
    toast.success(t("recruiter_signup_success"));
    navigate({ to: "/employer" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="flex flex-col px-6 lg:px-16 py-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <span className="font-bold text-lg">SmartCV</span>
        </Link>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <h1 className="text-3xl font-bold">{t("recruiter_signup_title")}</h1>
            <p className="text-muted-foreground mt-2">{t("recruiter_signup_subtitle")}</p>

            <div className="mt-6 space-y-4">
              <Field label={t("recruiter_company_name")} icon={Building2} defaultValue="FPT Software" />
              <Field label={t("recruiter_contact_name")} icon={User} defaultValue="Trần Thị HR" />
              <Field label={t("recruiter_work_email")} icon={Mail} defaultValue="hr@company.com" />
              <Field label={t("recruiter_phone")} icon={Phone} defaultValue="0901234567" />
              <Field label={t("password")} icon={Lock} type="password" defaultValue="demo1234" />

              <Button className="w-full h-11" onClick={handleSignup}>{t("recruiter_create_account")}</Button>

              <p className="text-center text-sm text-muted-foreground">
                {t("already_have_account")}{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  {t("login")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-primary via-brand-blue to-ai p-12 text-primary-foreground">
        <div className="max-w-md space-y-3">
          <h2 className="text-3xl font-bold leading-tight">{t("recruiter_signup_visual_title")}</h2>
          <p className="opacity-90">
            {t("recruiter_signup_visual_desc")}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  type = "text",
  defaultValue,
}: {
  label: string;
  icon: typeof Building2;
  type?: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="relative mt-1.5">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type={type}
          defaultValue={defaultValue}
          className="w-full h-11 pl-9 pr-3 rounded-md border border-input bg-background text-sm"
        />
      </div>
    </div>
  );
}
