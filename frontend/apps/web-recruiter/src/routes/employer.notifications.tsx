import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "@smart-cv/i18n";

export const Route = createFileRoute("/employer/notifications")({
  head: () => ({ meta: [{ title: "Notifications" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { t } = useTranslation();

  return (
    <div className="w-full space-y-5">
      <h1 className="text-2xl font-bold">{t("recruiter_notifications_title")}</h1>
      <div className="card-surface divide-y divide-border">
        {[
          t("recruiter_notification_item_1"),
          t("recruiter_notification_item_2"),
          t("recruiter_notification_item_3"),
        ].map((item, i) => (
          <div key={i} className="p-4 flex justify-between">
            <div className="text-sm">{item}</div>
            <div className="text-xs text-muted-foreground">{t("recruiter_hours_ago", { count: i + 1 })}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
