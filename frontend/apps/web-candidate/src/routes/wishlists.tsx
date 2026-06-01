import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Input } from '@smart-cv/ui'
import { Clock3, DollarSign, Heart, MapPin } from 'lucide-react'

export const Route = createFileRoute('/wishlists')({
  beforeLoad: () => {
    if (localStorage.getItem('isAuthenticated') !== 'true') {
      throw redirect({ to: '/signin' })
    }
  },
  component: WishlistsPage,
})

interface WishlistJob {
  id: string
  title: string
  company: string
  initials: string
  salary: string
  location: string
  skills: string[]
  postedAt: string
  savedAt: string
}

const chips = ['Tất cả', 'Công nghệ', 'Thiết kế', 'Marketing']

const mockWishlistJobs: WishlistJob[] = [
  { id: 'senior-nodejs', title: 'Senior Node.js Backend Developer', company: 'NexusTech Solutions', initials: 'NTS', salary: '$2,500 - $3,500', location: 'TP. HCM (Hybrid)', skills: ['Node.js', 'TypeScript', 'AWS'], postedAt: 'Đăng 2 ngày trước', savedAt: 'Lưu 1 ngày trước' },
  { id: 'frontend-react-nextjs', title: 'Frontend Engineer (React + Next.js)', company: 'Nova Product Studio', initials: 'NPS', salary: '$2,000 - $2,800', location: 'Hà Nội (Onsite)', skills: ['React', 'Next.js', 'Tailwind'], postedAt: 'Đăng 3 ngày trước', savedAt: 'Lưu 2 ngày trước' },
  { id: 'devops-aws-kubernetes', title: 'DevOps Engineer (AWS/Kubernetes)', company: 'CloudBridge Tech', initials: 'CBT', salary: '$2,700 - $3,600', location: 'Remote (VN)', skills: ['Kubernetes', 'Terraform', 'AWS'], postedAt: 'Đăng 1 ngày trước', savedAt: 'Lưu 3 ngày trước' },
  { id: 'mobile-react-native', title: 'Mobile Engineer (React Native)', company: 'BluePixel Ventures', initials: 'BPV', salary: '$1,900 - $2,700', location: 'TP. HCM (Hybrid)', skills: ['React Native', 'TypeScript'], postedAt: 'Đăng 4 ngày trước', savedAt: 'Lưu 5 ngày trước' },
  { id: 'data-engineer-python-spark', title: 'Data Engineer (Python/Spark)', company: 'DataNova Analytics', initials: 'DNA', salary: '$2,300 - $3,200', location: 'Hà Nội (Hybrid)', skills: ['Python', 'Spark', 'BigQuery'], postedAt: 'Đăng 6 ngày trước', savedAt: 'Lưu 1 tuần trước' },
  { id: 'product-designer-ux-ui', title: 'Product Designer (UX/UI)', company: 'PixelCraft Studio', initials: 'PCS', salary: '$1,600 - $2,400', location: 'Đà Nẵng (Onsite)', skills: ['Figma', 'Design System'], postedAt: 'Đăng 1 tuần trước', savedAt: 'Lưu 1 tuần trước' },
]

function WishlistsPage() {
  const [selectedChip, setSelectedChip] = React.useState(chips[0])
  const [jobs, setJobs] = React.useState(mockWishlistJobs)

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Danh sách yêu thích</h1>
        <p className="mt-1 text-sm text-muted-foreground">{jobs.length} việc làm đã lưu</p>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Tìm trong danh sách..." className="h-10 max-w-sm border-input bg-background" />
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => setSelectedChip(chip)}
              className={selectedChip === chip ? 'cursor-pointer rounded-full bg-primary px-4 py-1.5 text-sm text-primary-foreground' : 'cursor-pointer rounded-full border border-border px-4 py-1.5 text-sm text-foreground hover:bg-muted/50'}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-muted-foreground">
          <Heart className="h-12 w-12" />
          <p>Chưa có việc làm nào được lưu</p>
          <Link to="/"><Button variant="outline">Browse Jobs</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <article key={job.id} className="elevate-card rounded-2xl card-surface p-5">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-xs font-bold text-muted-foreground">{job.initials}</div>
                  <div>
                    <h3 className="text-base font-semibold">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.company}</p>
                  </div>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1"><DollarSign className="h-3.5 w-3.5" />{job.salary}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {job.skills.map((skill) => <Badge key={skill} variant="outline" className="border-border bg-secondary/70 text-xs text-secondary-foreground">{skill}</Badge>)}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{job.savedAt}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full border border-border hover:bg-danger-soft"
                  onClick={() => setJobs((prev) => prev.filter((item) => item.id !== job.id))}
                >
                  <Heart className="h-4 w-4 fill-current text-primary" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
