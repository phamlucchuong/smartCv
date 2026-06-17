import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@smart-cv/ui";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Building2, User, Mail, Lock, Phone, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@smart-cv/i18n";
import { useRegisterCandidate, useVerifyCandidateRegistration, useResendRegistrationOtp } from "@smart-cv/api";
import { useAuthStore } from "../store/useAuthStore";
import {
  buildRecruiterRegistrationPayload,
  ensureRecruiterRole,
  extractAuthTokens,
} from "../lib/recruiterAuth";

type ApiError = {
  response?: {
    data?: {
      code?: number;
      message?: string;
    };
  };
};

export const Route = createFileRoute("/signup/recruiter")({
  head: () => ({ meta: [{ title: "Đăng ký nhà tuyển dụng — SmartCV" }] }),
  component: RecruiterSignup,
});

function maskContact(contact: string): string {
  if (contact.includes("@")) {
    const [local, domain] = contact.split("@");
    return `${local.charAt(0)}***@${domain}`;
  }
  return `${contact.slice(0, 3)}***${contact.slice(-2)}`;
}

function RecruiterSignup() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const signIn = useAuthStore((state) => state.signIn);

  const [companyName, setCompanyName] = useState("FPT Software");
  const [fullname, setFullname] = useState("Trần Thị HR");
  const [email, setEmail] = useState("hr@company.com");
  const [phone, setPhone] = useState("0901234567");
  const [password, setPassword] = useState("demo1234");
  const [confirmPassword, setConfirmPassword] = useState("demo1234");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);

  // OTP Verification States
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [otpError, setOtpError] = useState("");
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const registerMutation = useRegisterCandidate();
  const verifyMutation = useVerifyCandidateRegistration();
  const resendMutation = useResendRegistrationOtp();

  // Timer Effect when OTP active
  useEffect(() => {
    if (!otpOpen) return;
    const timer = setInterval(() => {
      setOtpCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpOpen]);

  function openOtpPanel() {
    setOtpDigits(Array(6).fill(""));
    setOtpError("");
    setOtpCountdown(60);
    setOtpOpen(true);
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !fullname.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      toast.error("Vui lòng điền đầy đủ các trường thông tin");
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t("account_password_mismatch"));
      return;
    }
    if (password.length < 8) {
      toast.error("Mật khẩu phải dài tối thiểu 8 ký tự");
      return;
    }

    try {
      await registerMutation.mutateAsync({
        data: buildRecruiterRegistrationPayload({
          companyName,
          fullname,
          email,
          phone,
          password,
        }),
      });
      toast.success("Mã OTP đã được gửi tới email tuyển dụng của bạn!");
      openOtpPanel();
    } catch (err: unknown) {
      const error = err as ApiError;
      const code = error.response?.data?.code;
      if (code === 3003) {
        toast.info("Tài khoản đã được đăng ký nhưng chưa xác minh. Vui lòng xác minh OTP.");
        openOtpPanel();
      } else if (code === 3001) {
        toast.error("Email này đã được sử dụng.");
      } else {
        toast.error(error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = char;
    setOtpDigits(next);
    if (char && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(""));
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join("");
    if (code.length < 6) return;
    setOtpError("");
    try {
      const result = await verifyMutation.mutateAsync({
        data: {
          contact: email,
          verificationType: "EMAIL",
          code,
        },
      });

      const { accessToken, refreshToken } = extractAuthTokens(result);
      ensureRecruiterRole(accessToken);
      signIn(accessToken, refreshToken);

      toast.success("Xác minh tài khoản thành công!");
      setOtpOpen(false);
      navigate({ to: "/employer" });
    } catch (err: unknown) {
      const error = err as ApiError;
      setOtpError(error.response?.data?.message || "Mã OTP không chính xác. Vui lòng kiểm tra lại.");
    }
  };

  const handleOtpResend = async () => {
    if (otpCountdown > 0) return;
    setOtpError("");
    try {
      await resendMutation.mutateAsync({
        data: {
          contact: email,
          preferredVerification: "EMAIL",
        },
      });
      setOtpCountdown(60);
      toast.success("Mã OTP mới đã được gửi!");
    } catch {
      setOtpError("Không thể gửi lại mã OTP. Vui lòng thử lại sau.");
    }
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
            <h1 className="text-3xl font-bold">
              {otpOpen ? "Xác minh tài khoản" : t("recruiter_signup_title")}
            </h1>
            <p className="text-muted-foreground mt-2">
              {otpOpen
                ? `Nhập mã OTP 6 chữ số gửi đến ${maskContact(email)}`
                : t("recruiter_signup_subtitle")}
            </p>

            <div className="mt-6 space-y-4">
              {otpOpen ? (
                <form onSubmit={handleOtpSubmit} className="space-y-6">
                  <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                    {otpDigits.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          otpInputRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="h-12 w-10 rounded-md border border-input bg-background text-center text-lg font-semibold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    ))}
                  </div>

                  {otpError && <p className="text-center text-sm text-destructive font-medium">{otpError}</p>}

                  <Button
                    type="submit"
                    className="h-11 w-full font-semibold"
                    disabled={otpDigits.join("").length < 6 || verifyMutation.isPending}
                  >
                    {verifyMutation.isPending ? "Đang xác minh..." : "Xác minh tài khoản"}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground mt-4">
                    {otpCountdown > 0 ? (
                      <span>Gửi lại mã sau {otpCountdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOtpResend}
                        disabled={resendMutation.isPending}
                        className="text-primary hover:underline font-semibold disabled:opacity-50"
                      >
                        {resendMutation.isPending ? "Đang gửi..." : "Gửi lại OTP"}
                      </button>
                    )}
                  </div>

                  <div className="text-center text-sm mt-4">
                    <button
                      type="button"
                      onClick={() => setOtpOpen(false)}
                      className="text-muted-foreground hover:text-foreground text-xs underline"
                    >
                      Quay lại chỉnh sửa thông tin đăng ký
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  {/* Company Name */}
                  <div>
                    <label className="text-sm font-medium">{t("recruiter_company_name")}</label>
                    <div className="relative mt-1.5">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full h-11 pl-9 pr-3 rounded-md border border-input bg-background text-sm"
                      />
                    </div>
                  </div>

                  {/* Fullname */}
                  <div>
                    <label className="text-sm font-medium">{t("recruiter_contact_name")}</label>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={fullname}
                        onChange={(e) => setFullname(e.target.value)}
                        className="w-full h-11 pl-9 pr-3 rounded-md border border-input bg-background text-sm"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm font-medium">{t("recruiter_work_email")}</label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 pl-9 pr-3 rounded-md border border-input bg-background text-sm"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-sm font-medium">{t("recruiter_phone")}</label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-11 pl-9 pr-3 rounded-md border border-input bg-background text-sm"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-sm font-medium">{t("password")}</label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-11 pl-9 pr-10 rounded-md border border-input bg-background text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="text-sm font-medium">{t("confirm_password")}</label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-11 pl-9 pr-10 rounded-md border border-input bg-background text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 font-semibold flex items-center justify-center gap-2"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    )}
                    {t("recruiter_create_account")} <ArrowRight className="size-4" />
                  </Button>
                </form>
              )}

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
