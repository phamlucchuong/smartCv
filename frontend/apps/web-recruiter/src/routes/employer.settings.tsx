import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@smart-cv/ui";
import { useTranslation } from "@smart-cv/i18n";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

export const Route = createFileRoute("/employer/settings")({
  head: () => ({ meta: [{ title: "Settings" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signOut = useAuthStore((s) => s.signOut);

  const handleLogout = () => {
    signOut();
    toast.success("Đăng xuất thành công");
    navigate({ to: "/login" });
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác!")) {
      toast.success("Tài khoản của bạn đã được xóa thành công");
      signOut();
      navigate({ to: "/login" });
    }
  };

  return (
    <div className="w-full space-y-5">
      <h1 className="text-2xl font-bold">{t("recruiter_settings_title")}</h1>
      
      {/* Account Info */}
      <div className="card-surface p-6 space-y-4">
        <h2 className="font-semibold">{t("recruiter_settings_account_info")}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">{t("full_name")}</label>
            <input defaultValue="Trần Thị HR" className="mt-1 w-full h-10 rounded-md border border-input px-3 text-sm bg-background" />
          </div>
          <div>
            <label className="text-sm font-medium">{t("email")}</label>
            <input defaultValue="hr@fpt.com.vn" className="mt-1 w-full h-10 rounded-md border border-input px-3 text-sm bg-background" />
          </div>
        </div>
        <Button>{t("recruiter_save_changes")}</Button>
      </div>

      {/* Logout Settings */}
      <div className="card-surface p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Đăng xuất tài khoản</h2>
        <p className="text-sm text-muted-foreground">
          Đăng xuất khỏi tài khoản nhà tuyển dụng hiện tại trên thiết bị này.
        </p>
        <Button variant="outline" onClick={handleLogout}>
          Đăng xuất
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="card-surface border border-destructive/20 p-6 space-y-4 bg-destructive/5">
        <h2 className="font-semibold text-destructive">Vùng nguy hiểm (Danger Zone)</h2>
        <p className="text-sm text-muted-foreground">
          Một khi bạn xóa tài khoản, mọi dữ liệu liên quan đến tin tuyển dụng, ứng viên và cấu hình sẽ bị xóa vĩnh viễn và không thể khôi phục.
        </p>
        <Button variant="destructive" onClick={handleDeleteAccount}>
          Xóa tài khoản
        </Button>
      </div>
    </div>
  );
}
