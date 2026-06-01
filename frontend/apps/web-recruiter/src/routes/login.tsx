import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@smart-cv/ui";
import { Sparkles, Mail, Lock, Brain, Target, Zap } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@smart-cv/i18n";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Đăng nhập — SmartCV" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const loginRecruiter = () => {
    toast.success(t("recruiter_login_success"));
    navigate({ to: "/employer" });
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
            <h1 className="text-3xl font-bold">{t("recruiter_login_title")}</h1>
            <p className="text-muted-foreground mt-2">{t("recruiter_login_subtitle")}</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium">{t("email")}</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input defaultValue="hr@company.com"
                    className="w-full h-11 pl-9 pr-3 rounded-md border border-input bg-background text-sm" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{t("password")}</label>
                  <a className="text-xs text-primary hover:underline cursor-pointer">{t("recruiter_forgot_password")}</a>
                </div>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input type="password" defaultValue="demo1234" className="w-full h-11 pl-9 pr-3 rounded-md border border-input bg-background text-sm" />
                </div>
              </div>

              <Button className="w-full h-11" onClick={loginRecruiter}>{t("recruiter_continue")}</Button>

              <p className="text-center text-sm text-muted-foreground">
                {t("recruiter_no_account")}{" "}
                <Link to="/signup/recruiter" className="text-primary font-medium hover:underline">
                  {t("register")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual */}
      <div className="hidden lg:flex relative items-center justify-center bg-gradient-to-br from-primary via-brand-blue to-ai p-12 text-primary-foreground">
        <div className="max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
            <Sparkles className="size-3.5" /> {t("recruiter_ai_platform")}
          </div>
          <h2 className="text-3xl font-bold leading-tight">{t("recruiter_login_visual_title")}</h2>
          <div className="space-y-3">
            {[
              { icon: Brain, title: t("recruiter_feature_ai_cv_title"), desc: t("recruiter_feature_ai_cv_desc") },
              { icon: Target, title: t("recruiter_feature_recommend_title"), desc: t("recruiter_feature_recommend_desc") },
              { icon: Zap, title: t("recruiter_feature_screening_title"), desc: t("recruiter_feature_screening_desc") },
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
