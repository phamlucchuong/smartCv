import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@smart-cv/ui'
import { Award, ShieldCheck, Zap, Sparkles } from 'lucide-react'
import { useCandidateStore } from '../store/useCandidateStore'

export const Route = createFileRoute('/about')({
  component: AboutComponent,
})

function AboutComponent() {
  const { count } = useCandidateStore()

  const features = [
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: "Ứng tuyển nhanh chóng",
      desc: "Nộp hồ sơ trực tuyến chỉ với 1 cú click chuột và nhận phản hồi tức thì từ nhà tuyển dụng."
    },
    {
      icon: <Award className="h-6 w-6 text-primary" />,
      title: "Phân tích hồ sơ AI",
      desc: "Hệ thống AI tự động tối ưu hóa và so sánh năng lực của bạn với yêu cầu công việc cụ thể."
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-primary" />,
      title: "Bảo mật tuyệt đối",
      desc: "Dữ liệu cá nhân và thông tin hồ sơ của bạn được mã hóa an toàn và chỉ hiển thị khi có sự cho phép."
    }
  ]

  return (
    <div className="space-y-10 text-left max-w-3xl mx-auto">
      <div className="space-y-4">
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1 px-3 py-1">
          <Sparkles className="h-3 w-3" />
          Về Chúng Tôi
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight">Smart CV - Nền Tảng Tuyển Dụng Thế Hệ Mới</h1>
        <p className="text-lg text-muted-foreground">
          Chúng tôi mang đến giải pháp kết nối nhân tài và doanh nghiệp một cách nhanh chóng, minh bạch và hiệu quả thông qua công nghệ hiện đại.
        </p>
      </div>

      {/* Proof of persistent Zustand state */}
      <Card className="bg-primary/5 border-primary/20 shadow-none">
        <CardContent className="p-6 space-y-2">
          <h3 className="font-bold text-lg text-primary flex items-center gap-2">
            📊 Trạng thái Zustand được giữ nguyên!
          </h3>
          <p className="text-sm text-muted-foreground">
            Khi bạn chuyển hướng từ Trang chủ sang trang Giới thiệu này, toàn bộ dữ liệu của bạn trong Zustand Store không hề bị mất đi.
          </p>
          <div className="text-sm font-semibold text-foreground pt-1">
            Số lượt đếm hiện tại từ Zustand: <span className="text-primary text-base font-bold">{count}</span>
          </div>
        </CardContent>
      </Card>

      {/* Platform Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {features.map((feat, index) => (
          <Card key={index} className="bg-card border-border hover:-translate-y-1 transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="p-2 w-fit bg-primary/10 rounded-xl mb-2">
                {feat.icon}
              </div>
              <CardTitle className="text-base font-bold">{feat.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed">
              {feat.desc}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation CTA */}
      <div className="pt-6 flex justify-center">
        <Link to="/">
          <Button size="lg" className="px-8 font-semibold shadow-md shadow-primary/20">
            Quay lại tìm việc làm
          </Button>
        </Link>
      </div>
    </div>
  )
}
