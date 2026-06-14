import { createFileRoute } from '@tanstack/react-router'
import { useCandidateStore } from '../store/useCandidateStore'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Input, Badge } from '@smart-cv/ui'
import { Search, MapPin, Sparkles, Briefcase } from 'lucide-react'
import { useTranslation } from '@smart-cv/i18n'
import reactLogo from '../assets/react.svg'
import viteLogo from '../assets/vite.svg'
import heroImg from '../assets/hero.png'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  const { count, searchQuery, setSearchQuery, increment } = useCandidateStore()
  const { t } = useTranslation()

  // Mock list of tags/categories
  const categories = [
    { name: 'React / Next.js', count: 124, variant: 'default' as const },
    { name: 'Node.js Backend', count: 85, variant: 'secondary' as const },
    { name: 'DevOps / AWS', count: 42, variant: 'outline' as const },
    { name: 'UI/UX Design', count: 67, variant: 'secondary' as const },
  ]

  // Mock job listings
  const jobs = [
    {
      title: 'Senior Frontend Engineer (React)',
      company: 'TechVibe Solutions',
      location: 'Hồ Chí Minh, Việt Nam (Hybrid)',
      salary: '2,500 - 3,500 USD',
      tags: ['React 19', 'TypeScript', 'Tailwind'],
      status: 'Hot',
    },
    {
      title: 'Fullstack Developer (Node.js & Next.js)',
      company: 'SmartCV Global',
      location: 'Hà Nội, Việt Nam (Remote)',
      salary: 'Negotiable',
      tags: ['Next.js', 'PostgreSQL', 'Docker'],
      status: 'New',
    }
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-card border border-border p-8 rounded-2xl shadow-sm">
        <div className="lg:col-span-7 space-y-6 text-left">
          <Badge variant="secondary" className="px-3 py-1 text-sm bg-primary/10 text-primary border-primary/20 flex items-center w-fit gap-1.5">
            <Sparkles className="h-3 w-3" />
            Next-Gen Recruitment Platform
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight !margin-0">
            {t('welcome') || 'Chào mừng đến với Smart CV'}
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-xl">
            Xây dựng hồ sơ xin việc chuyên nghiệp, ứng tuyển nhanh chóng với kết quả tức thì nhờ công nghệ phân tích CV tiên tiến nhất.
          </p>

          {/* Interactive counter button using Zustand */}
          <div className="flex flex-wrap gap-3 items-center pt-2">
            <Button
              variant="default"
              size="lg"
              onClick={increment}
              className="font-semibold shadow-lg shadow-primary/25"
            >
              Nhấp vào tôi (Zustand State): {count}
            </Button>
            <Button variant="outline" size="lg" className="font-semibold">
              Xem hướng dẫn
            </Button>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center items-center relative py-6">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl -z-10 w-72 h-72 mx-auto"></div>
          <div className="relative group">
            <img
              src={heroImg}
              className="w-48 sm:w-60 h-auto object-contain drop-shadow-xl transform group-hover:scale-105 transition-all duration-300"
              alt="Smart CV Hero"
            />
            <img
              src={reactLogo}
              className="absolute -top-4 -right-4 w-12 h-12 animate-[spin_8s_linear_infinite]"
              alt="React logo"
            />
            <img
              src={viteLogo}
              className="absolute -bottom-4 -left-4 w-12 h-12 animate-bounce"
              alt="Vite logo"
            />
          </div>
        </div>
      </section>

      {/* Job Search & Filters */}
      <section className="space-y-6">
        <div className="text-left space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Tìm Kiếm Công Việc Mơ Ước</h2>
          <p className="text-sm text-muted-foreground">Khám phá hàng ngàn cơ hội nghề nghiệp được cập nhật mỗi ngày</p>
        </div>

        {/* Search Box using our custom Input & Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Nhập vị trí, kỹ năng hoặc công ty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Button size="lg" className="sm:w-36 gap-2">
            <Search className="h-4 w-4" />
            Tìm kiếm
          </Button>
        </div>

        {/* Tag suggestions */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-left">
          <span className="text-xs font-semibold text-muted-foreground mr-1 uppercase tracking-wider">Xu hướng:</span>
          {categories.map((cat, i) => (
            <Badge
              key={i}
              variant={cat.variant}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              onClick={() => setSearchQuery(cat.name.split(' ')[0])}
            >
              {cat.name} ({cat.count})
            </Badge>
          ))}
        </div>
      </section>

      {/* Job Listings using our Card component */}
      <section className="space-y-6">
        <div className="text-left">
          <h2 className="text-2xl font-bold tracking-tight">Việc Làm Nổi Bật</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs
            .filter((j) =>
              searchQuery
                ? j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  j.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  j.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
                : true
            )
            .map((job, index) => (
              <Card key={index} className="text-left flex flex-col justify-between">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={job.status === 'Hot' ? 'default' : 'secondary'} className="px-2 py-0.5 text-[10px]">
                      {job.status}
                    </Badge>
                    <span className="text-sm font-semibold text-primary">{job.salary}</span>
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground line-clamp-1">{job.title}</CardTitle>
                  <CardDescription className="font-medium text-muted-foreground">{job.company}</CardDescription>
                </CardHeader>
                <CardContent className="pb-4 space-y-3">
                  <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    {job.location}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {job.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] py-0 px-2">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="pt-2 border-t border-border mt-auto">
                  <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary hover:bg-primary/5 font-semibold">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Ứng tuyển ngay
                  </Button>
                </CardFooter>
              </Card>
            ))}
          {jobs.filter((j) =>
            searchQuery
              ? j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                j.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                j.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
              : true
          ).length === 0 && (
            <div className="col-span-2 text-center py-10 text-muted-foreground">
              Không tìm thấy công việc nào phù hợp với từ khóa "{searchQuery}"
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
