import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Button } from "@smart-cv/ui";
import { Sparkles } from "lucide-react";

const NAV = [
  { to: "/jobs", label: "Tìm việc" },
  { to: "/for-employers", label: "Dành cho nhà tuyển dụng" },
  { to: "/pricing", label: "Bảng giá" },
  { to: "/about", label: "Về chúng tôi" },
];

export function PublicLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">SmartCV</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  pathname.startsWith(n.to)
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Đăng nhập</Button>
            </Link>
            <Link to="/login">
              <Button size="sm">Bắt đầu ngay</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-card mt-16">
        <div className="mx-auto max-w-7xl px-6 py-10 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-3.5" />
              </div>
              <span className="font-bold">SmartCV</span>
            </div>
            <p className="text-muted-foreground">Nền tảng tuyển dụng ứng dụng AI hàng đầu Việt Nam.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Sản phẩm</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>Tìm việc</li><li>Gợi ý AI</li><li>Đánh giá CV</li><li>Bài kiểm tra</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Nhà tuyển dụng</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>Đăng tin</li><li>AI Screening</li><li>ATS Board</li><li>CV Database</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Hỗ trợ</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>Trung tâm trợ giúp</li><li>Liên hệ</li><li>Điều khoản</li><li>Chính sách</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          © 2026 SmartCV. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
