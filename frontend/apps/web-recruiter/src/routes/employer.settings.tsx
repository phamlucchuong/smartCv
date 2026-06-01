import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@smart-cv/ui";
import { useTranslation } from "@smart-cv/i18n";

export const Route = createFileRoute("/employer/settings")({
  head: () => ({ meta: [{ title: "Settings" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="w-full space-y-5">
      <h1 className="text-2xl font-bold">{t("recruiter_settings_title")}</h1>
      <div className="card-surface p-6 space-y-4">
        <h2 className="font-semibold">{t("recruiter_settings_account_info")}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="text-sm">{t("full_name")}</label><input defaultValue="Trần Thị HR" className="mt-1 w-full h-10 rounded-md border border-input px-3 text-sm bg-background" /></div>
          <div><label className="text-sm">{t("email")}</label><input defaultValue="hr@fpt.com.vn" className="mt-1 w-full h-10 rounded-md border border-input px-3 text-sm bg-background" /></div>
        </div>
        <Button>{t("recruiter_save_changes")}</Button>
      </div>
    </div>
  );
}
