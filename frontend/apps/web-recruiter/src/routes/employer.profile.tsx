import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@smart-cv/ui";
import { RecruiterApi } from "@smart-cv/api";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  Briefcase,
  Calendar,
  Save,
  Image as ImageIcon,
  Edit2,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/employer/profile")({
  head: () => ({ meta: [{ title: "Hồ sơ công ty" }] }),
  component: CompanyProfilePage,
});

function CompanyProfilePage() {
  // 1. Fetch current profile
  const { data: apiResponse, isLoading, isError, refetch } = RecruiterApi.useGetMe1();
  const recruiter = apiResponse?.data;

  // 2. Mutations
  const updateMutation = RecruiterApi.useUpdate({
    mutation: {
      onSuccess: () => {
        toast.success("Cập nhật hồ sơ công ty thành công!");
        refetch();
        setIsEditing(false);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Cập nhật hồ sơ thất bại.");
      },
    },
  });

  // 3. Component States
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [foundedYear, setFoundedYear] = useState<number>(2000);
  const [industry, setIndustry] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Sync form states with recruiter data
  useEffect(() => {
    if (recruiter) {
      setCompanyName(recruiter.companyName || "");
      setCompanyWebsite(recruiter.companyWebsite || "");
      setCompanyAddress(recruiter.companyAddress || "");
      setCompanyDescription(recruiter.companyDescription || "");
      setCompanyPhone(recruiter.companyPhone || "");
      setCompanySize(recruiter.companySize || "");
      setCompanyType(recruiter.companyType || "");
      setFoundedYear(recruiter.foundedYear || 2000);
      setIndustry(recruiter.industry || "");
      setLogoUrl(recruiter.logoUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&auto=format&fit=crop&q=60");
      setCoverImageUrl(recruiter.coverImageUrl || "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=1200&auto=format&fit=crop&q=60");
      setContactName(recruiter.contactName || "");
      setContactEmail(recruiter.contactEmail || "");
      setContactPhone(recruiter.contactPhone || "");
    }
  }, [recruiter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recruiter?.id) return;

    const payload = {
      companyName,
      companyWebsite,
      companyAddress,
      companyDescription,
      companyPhone,
      companySize,
      companyType,
      foundedYear,
      industry,
      logoUrl,
      coverImageUrl,
      contactName,
      contactEmail,
      contactPhone,
    };

    updateMutation.mutate({ id: recruiter.id, data: payload });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Đang tải thông tin hồ sơ...</p>
      </div>
    );
  }

  if (isError || !recruiter) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center card-surface border-red-200/50 bg-red-50/10 max-w-lg mx-auto">
        <Info className="size-12 text-destructive mb-3" />
        <h3 className="font-semibold text-lg text-foreground">Đã xảy ra lỗi khi tải hồ sơ</h3>
        <p className="text-sm text-muted-foreground mt-1 px-4">
          Không tìm thấy thông tin hồ sơ của bạn trên máy chủ hoặc bạn chưa có quyền truy cập. Vui lòng đăng nhập lại.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="size-8 text-primary" />
            Hồ sơ doanh nghiệp
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Quản lý thông tin thương hiệu công ty và liên hệ của bạn để thu hút ứng viên chất lượng.
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="gap-2 font-semibold">
            <Edit2 className="size-4" /> Chỉnh sửa hồ sơ
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner and Logo card */}
        <div className="card-surface overflow-hidden relative border border-border shadow-md">
          {/* Cover image banner */}
          <div className="h-48 sm:h-64 bg-muted relative group">
            <img
              src={coverImageUrl}
              alt="Banner Công ty"
              className="w-full h-full object-cover"
            />
            {isEditing && (
              <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-80 bg-background/90 p-3 rounded-lg border border-border flex flex-col gap-2 shadow-lg">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1">
                    <ImageIcon className="size-3.5" /> Thay đổi link ảnh bìa (Banner)
                  </span>
                  <input
                    type="text"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="URL hình ảnh banner..."
                    className="h-8 text-xs rounded border border-input bg-background px-2 w-full focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Logo overlay */}
          <div className="absolute top-36 sm:top-48 left-6 sm:left-10 flex items-end gap-4">
            <div className="size-24 sm:size-32 rounded-xl border-4 border-card bg-card overflow-hidden shadow-lg relative group">
              <img
                src={logoUrl}
                alt="Logo Công ty"
                className="w-full h-full object-cover"
              />
              {isEditing && (
                <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-1.5 bg-background/95 rounded-lg border border-border flex flex-col gap-1 shadow-lg text-[9px] w-24">
                    <span className="font-bold text-center">Đổi Link Logo</span>
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="URL logo..."
                      className="h-6 text-[9px] rounded border border-input bg-background px-1 w-full focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="mb-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm">
                {companyName || "Chưa đặt tên công ty"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-semibold bg-background/85 backdrop-blur-sm px-2 py-0.5 rounded mt-0.5 w-max">
                {industry || "Chưa cập nhật ngành nghề"}
              </p>
            </div>
          </div>

          <div className="h-16 sm:h-20 bg-card"></div>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main profile form - Left 2 Columns */}
          <div className="md:col-span-2 space-y-6">
            {/* Basic company information */}
            <div className="card-surface p-6 border border-border shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                Thông tin chung
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Tên công ty *</label>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Website công ty</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      placeholder="https://company.com"
                      className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Ngành nghề tuyển dụng</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="Ví dụ: Công nghệ thông tin / Phần mềm"
                      className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Quy mô nhân sự</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <select
                      disabled={!isEditing}
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                    >
                      <option value="">Chọn quy mô...</option>
                      <option value="1-50 nhân viên">1-50 nhân viên</option>
                      <option value="50-200 nhân viên">50-200 nhân viên</option>
                      <option value="200-500 nhân viên">200-500 nhân viên</option>
                      <option value="500-1000 nhân viên">500-1000 nhân viên</option>
                      <option value="1000-5000 nhân viên">1000-5000 nhân viên</option>
                      <option value="5000+ nhân viên">5000+ nhân viên</option>
                      <option value="10000+ nhân viên">10000+ nhân viên</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Loại hình doanh nghiệp</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                    placeholder="Ví dụ: Cổ phần, Trách nhiệm hữu hạn"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Năm thành lập</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="number"
                      disabled={!isEditing}
                      value={foundedYear || ""}
                      onChange={(e) => setFoundedYear(parseInt(e.target.value) || 2000)}
                      className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Địa chỉ trụ sở</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Nhập địa chỉ đầy đủ của công ty..."
                      className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description & Introduction */}
            <div className="card-surface p-6 border border-border shadow-sm space-y-3">
              <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">
                Giới thiệu công ty
              </h3>
              <div className="space-y-1.5">
                <textarea
                  disabled={!isEditing}
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Viết đoạn giới thiệu ngắn về lịch sử, sứ mệnh và văn hóa doanh nghiệp của bạn..."
                  rows={6}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar Columns - Contacts and details */}
          <div className="space-y-6">
            {/* Contact details */}
            <div className="card-surface p-6 border border-border shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <Users className="size-5 text-primary" />
                Đại diện liên hệ
              </h3>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Họ tên người liên hệ</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Email liên hệ</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="email"
                      disabled={!isEditing}
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Số điện thoại liên hệ</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Status info */}
            <div className="card-surface p-6 border border-border shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Trạng thái xác minh</h3>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                    recruiter.status === "APPROVED"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : recruiter.status === "REJECTED"
                        ? "bg-red-500/10 text-red-600 border-red-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  }`}
                >
                  {recruiter.status === "APPROVED"
                    ? "Đã duyệt"
                    : recruiter.status === "REJECTED"
                      ? "Từ chối"
                      : "Chờ xác minh"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tài khoản được duyệt mới có thể hiển thị thông tin tuyển dụng công khai đến ứng viên.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons at bottom */}
        {isEditing && (
          <div className="flex justify-end gap-3 border-t border-border pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                // Reset states
                if (recruiter) {
                  setCompanyName(recruiter.companyName || "");
                  setCompanyWebsite(recruiter.companyWebsite || "");
                  setCompanyAddress(recruiter.companyAddress || "");
                  setCompanyDescription(recruiter.companyDescription || "");
                  setCompanyPhone(recruiter.companyPhone || "");
                  setCompanySize(recruiter.companySize || "");
                  setCompanyType(recruiter.companyType || "");
                  setFoundedYear(recruiter.foundedYear || 2000);
                  setIndustry(recruiter.industry || "");
                  setLogoUrl(recruiter.logoUrl || "");
                  setCoverImageUrl(recruiter.coverImageUrl || "");
                  setContactName(recruiter.contactName || "");
                  setContactEmail(recruiter.contactEmail || "");
                  setContactPhone(recruiter.contactPhone || "");
                }
              }}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="gap-2 font-semibold"
            >
              {updateMutation.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Save className="size-4" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
