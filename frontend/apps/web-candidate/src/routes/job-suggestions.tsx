import { createFileRoute, redirect } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Input } from '@smart-cv/ui'
import { Clock3, DollarSign, MapPin, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/job-suggestions')({
  beforeLoad: () => {
    if (localStorage.getItem('isAuthenticated') !== 'true') {
      throw redirect({ to: '/signin' })
    }
  },
  component: JobSuggestionsPage,
})

interface SuggestedJob {
  id: string
  title: string
  company: string
  initials: string
  salary: string
  location: string
  skills: string[]
  postedAt: string
  matchReason: string
  matchScore: number
}

const chips = ['Tất cả', 'React', 'TypeScript', 'Next.js', 'Node.js']

const suggestions: SuggestedJob[] = [
  { id: 'frontend-react-nextjs', title: 'Frontend Engineer (React + Next.js)', company: 'Nova Product Studio', initials: 'NPS', salary: '$2,000 - $2,800', location: 'Hà Nội (Onsite)', skills: ['React', 'Next.js', 'Tailwind'], postedAt: 'Đăng 3 ngày trước', matchReason: 'Phù hợp với kỹ năng React, Next.js', matchScore: 98 },
  { id: 'senior-nodejs', title: 'Senior Node.js Backend Developer', company: 'NexusTech Solutions', initials: 'NTS', salary: '$2,500 - $3,500', location: 'TP. HCM (Hybrid)', skills: ['Node.js', 'TypeScript', 'AWS'], postedAt: 'Đăng 2 ngày trước', matchReason: 'Phù hợp với kỹ năng TypeScript', matchScore: 85 },
  { id: 'fullstack-python-react', title: 'Fullstack Developer (Python/React)', company: 'Skyline Labs', initials: 'SL', salary: '$2,200 - $3,000', location: 'Đà Nẵng (Remote)', skills: ['Python', 'React', 'PostgreSQL'], postedAt: 'Đăng 1 tuần trước', matchReason: 'Bao gồm React trong tech stack', matchScore: 80 },
  { id: 'engineering-manager', title: 'Engineering Manager', company: 'ScaleOne Labs', initials: 'SOL', salary: '$4,000 - $5,500', location: 'Remote (APAC)', skills: ['Leadership', 'Agile', 'Product'], postedAt: 'Đăng 4 ngày trước', matchReason: 'Phù hợp với lộ trình sự nghiệp', matchScore: 74 },
  { id: 'mobile-react-native', title: 'Mobile Engineer (React Native)', company: 'BluePixel Ventures', initials: 'BPV', salary: '$1,900 - $2,700', location: 'TP. HCM (Hybrid)', skills: ['React Native', 'TypeScript'], postedAt: 'Đăng 5 ngày trước', matchReason: 'Phù hợp với kỹ năng React Native', matchScore: 72 },
  { id: 'product-designer-ux-ui', title: 'Product Designer (UX/UI)', company: 'PixelCraft Studio', initials: 'PCS', salary: '$1,600 - $2,400', location: 'Đà Nẵng (Onsite)', skills: ['Figma', 'Design System'], postedAt: 'Đăng 2 tuần trước', matchReason: 'Liên quan đến công việc hiện tại', matchScore: 70 },
]

function JobSuggestionsPage() {
  const [selectedChip, setSelectedChip] = React.useState(chips[0])

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold theme-text-main">Gợi ý việc làm</h1>
        <p className="mt-1 text-sm text-muted-foreground">Dựa trên hồ sơ và kỹ năng của bạn</p>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Lọc gợi ý..." className="h-10 max-w-sm border-white/10 bg-[#1f2833]/70" />
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((job) => (
          <article key={job.id} className="rounded-2xl border border-white/10 bg-[#1f2833]/95 p-5">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#111844] text-xs font-bold text-muted-foreground">{job.initials}</div>
                <div>
                  <h3 className="text-base font-semibold">{job.title}</h3>
                  <p className="text-sm text-muted-foreground">{job.company}</p>
                </div>
              </div>
              <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">{job.matchScore}% phù hợp</span>
            </div>

            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1"><DollarSign className="h-3.5 w-3.5" />{job.salary}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {job.skills.map((skill) => <Badge key={skill} variant="outline" className="border-white/20 text-xs">{skill}</Badge>)}
            </div>

            <p className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground"><Sparkles className="h-3.5 w-3.5" />{job.matchReason}</p>

            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{job.postedAt}</span>
              <Button size="sm">Ứng tuyển ngay</Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
