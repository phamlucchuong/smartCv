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
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

export const Route = createFileRoute("/employer/profile")({
  head: () => ({ meta: [{ title: "Hồ sơ công ty — SmartCV" }] }),
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
      onError: (err: unknown) => {
        const error = err as ApiError;
        toast.error(error.response?.data?.message || "Cập nhật hồ sơ thất bại.");
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
  /* eslint-disable react-hooks/set-state-in-effect */
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
  /* eslint-enable react-hooks/set-state-in-effect */

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
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground animate-pulse">Đang tải thông tin hồ sơ...</p>
      </div>
    );
  }

  if (isError || !recruiter) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center card-surface border-red-200/50 bg-red-50/10 max-w-lg mx-auto rounded-2xl shadow-xl p-8">
        <Info className="size-14 text-destructive mb-4" />
        <h3 className="font-semibold text-xl text-foreground">Đã xảy ra lỗi khi tải hồ sơ</h3>
        <p className="text-sm text-muted-foreground mt-2 px-4 leading-relaxed">
          Không tìm thấy thông tin hồ sơ của bạn trên máy chủ hoặc bạn chưa có quyền truy cập. Vui lòng đăng nhập lại.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto py-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/60 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="size-8 text-primary" />
            Hồ sơ doanh nghiệp
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Quản lý thông tin thương hiệu công ty và liên hệ của bạn để thu hút ứng viên chất lượng.
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="gap-2 font-semibold shadow-md transition-all duration-300 hover:shadow-lg">
            <Edit2 className="size-4" /> Chỉnh sửa hồ sơ
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Banner and Logo card */}
        <div className="card-surface overflow-hidden relative border border-border/50 shadow-md rounded-2xl transition-all duration-300 hover:shadow-lg">
          {/* Cover image banner */}
          <div className="h-56 sm:h-72 bg-muted relative group overflow-hidden">
            <img
              src={coverImageUrl}
              alt="Banner Công ty"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            {isEditing && (
              <div className="absolute inset-0 bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-96 bg-background/95 p-4 rounded-xl border border-border/60 flex flex-col gap-2.5 shadow-2xl backdrop-blur-sm">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ImageIcon className="size-4 text-primary" /> Thay đổi link ảnh bìa (Banner)
                  </span>
                  <input
                    type="text"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="URL hình ảnh banner..."
                    className="h-9 text-xs rounded-lg border border-input bg-background px-3 w-full focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Logo and Company Name Overlay */}
          <div className="absolute top-44 sm:top-56 left-6 sm:left-10 right-6 sm:right-10 flex flex-col sm:flex-row items-start sm:items-end gap-5">
            <div className="size-28 sm:size-36 rounded-2xl border-4 border-card bg-card overflow-hidden shadow-xl relative group shrink-0">
              <img
                src={logoUrl}
                alt="Logo Công ty"
                className="w-full h-full object-cover"
              />
              {isEditing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="p-2 bg-background/95 rounded-lg border border-border flex flex-col gap-1.5 shadow-2xl text-[10px] w-28 text-center backdrop-blur-sm">
                    <span className="font-bold text-foreground">Đổi Link Logo</span>
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="URL logo..."
                      className="h-7 text-[10px] rounded border border-input bg-background px-1.5 w-full focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="mb-2 space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">
                {companyName || "Chưa đặt tên công ty"}
              </h2>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-semibold text-primary bg-primary/15 border border-primary/20 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                  {industry || "Chưa cập nhật ngành nghề"}
                </span>
                {companyWebsite && (
                  <a
                    href={companyWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-white/90 hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/10 px-2.5 py-0.5 rounded-full transition-colors backdrop-blur-md"
                  >
                    <Globe className="size-3" /> {companyWebsite.replace(/^https?:\/\//, "")} <ExternalLink className="size-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="h-20 sm:h-24 bg-card"></div>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main profile form - Left 2 Columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic company information */}
            <div className="card-surface p-6 border border-border/50 shadow-sm rounded-2xl space-y-6">
              <h3 className="text-lg font-bold text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                Thông tin chung
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tên công ty *</label>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Website công ty</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      placeholder="https://company.com"
                      className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3.5 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ngành nghề tuyển dụng</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="Ví dụ: Công nghệ thông tin / Phần mềm"
                      className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3.5 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quy mô nhân sự</label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <select
                      disabled={!isEditing}
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3.5 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10 cursor-pointer"
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

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Loại hình doanh nghiệp</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                    placeholder="Ví dụ: Cổ phần, Trách nhiệm hữu hạn"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Năm thành lập</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="number"
                      disabled={!isEditing}
                      value={foundedYear || ""}
                      onChange={(e) => setFoundedYear(parseInt(e.target.value) || 2000)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3.5 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Địa chỉ trụ sở</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Nhập địa chỉ đầy đủ của công ty..."
                      className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3.5 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description & Introduction */}
            <div className="card-surface p-6 border border-border/50 shadow-sm rounded-2xl space-y-4">
              <h3 className="text-lg font-bold text-foreground border-b border-border/60 pb-3">
                Giới thiệu công ty
              </h3>
              <div className="space-y-2">
                <textarea
                  disabled={!isEditing}
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Viết đoạn giới thiệu ngắn về lịch sử, sứ mệnh và văn hóa doanh nghiệp của bạn..."
                  rows={8}
                  className="flex min-h-[160px] w-full rounded-lg border border-input bg-background px-4 py-3.5 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10 leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar Columns - Contacts and details */}
          <div className="space-y-8">
            {/* Contact details */}
            <div className="card-surface p-6 border border-border/50 shadow-sm rounded-2xl space-y-5">
              <h3 className="text-lg font-bold text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
                <Users className="size-5 text-primary" />
                Đại diện liên hệ
              </h3>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Họ tên người liên hệ</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email liên hệ</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="email"
                      disabled={!isEditing}
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3.5 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Số điện thoại liên hệ</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3.5 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-85 disabled:bg-muted/10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Status info */}
            <div className="card-surface p-6 border border-border/50 shadow-sm rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Trạng thái xác minh</h3>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold border ${
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
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tài khoản được duyệt mới có thể hiển thị thông tin tuyển dụng công khai đến ứng viên.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons at bottom */}
        {isEditing && (
          <div className="flex justify-end gap-3.5 border-t border-border/60 pt-6">
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
              className="px-5"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="gap-2 font-semibold px-6 shadow-md transition-all"
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
