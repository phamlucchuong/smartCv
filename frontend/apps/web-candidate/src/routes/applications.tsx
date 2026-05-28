import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Input } from '@smart-cv/ui'
import { Clock3, DollarSign, MapPin } from 'lucide-react'

export const Route = createFileRoute('/applications')({
  beforeLoad: () => {
    if (localStorage.getItem('isAuthenticated') !== 'true') {
      throw redirect({ to: '/signin' })
    }
  },
  component: ApplicationsPage,
})

type ApplicationStatus = 'applied' | 'under_review' | 'interview' | 'rejected' | 'offer'

interface AppliedJob {
  id: string
  title: string
  company: string
  initials: string
  salary: string
  location: string
  skills: string[]
  appliedAt: string
  status: ApplicationStatus
}

const chips = ['Tất cả', 'Đang xử lý', 'Phỏng vấn', 'Từ chối']

const applications: AppliedJob[] = [
  { id: 'frontend-react-nextjs', title: 'Frontend Engineer (React + Next.js)', company: 'Nova Product Studio', initials: 'NPS', salary: '$2,000 - $2,800', location: 'Hà Nội', skills: ['React', 'Next.js', 'Tailwind'], status: 'offer', appliedAt: 'Ứng tuyển 2 tuần trước' },
  { id: 'senior-nodejs', title: 'Senior Node.js Backend Developer', company: 'NexusTech Solutions', initials: 'NTS', salary: '$2,500 - $3,500', location: 'TP. HCM', skills: ['Node.js', 'TypeScript', 'AWS'], status: 'interview', appliedAt: 'Ứng tuyển 1 tuần trước' },
  { id: 'devops-aws-kubernetes', title: 'DevOps Engineer (AWS/Kubernetes)', company: 'CloudBridge Tech', initials: 'CBT', salary: '$2,700 - $3,600', location: 'Remote', skills: ['Kubernetes', 'Terraform', 'AWS'], status: 'under_review', appliedAt: 'Ứng tuyển 5 ngày trước' },
  { id: 'fullstack-python-react', title: 'Fullstack Developer (Python/React)', company: 'Skyline Labs', initials: 'SL', salary: '$2,200 - $3,000', location: 'Đà Nẵng', skills: ['Python', 'React', 'PostgreSQL'], status: 'rejected', appliedAt: 'Ứng tuyển 3 tuần trước' },
  { id: 'mobile-react-native', title: 'Mobile Engineer (React Native)', company: 'BluePixel Ventures', initials: 'BPV', salary: '$1,900 - $2,700', location: 'TP. HCM', skills: ['React Native', 'TypeScript'], status: 'applied', appliedAt: 'Ứng tuyển 2 ngày trước' },
]

const statusMap: Record<ApplicationStatus, { label: string; className: string }> = {
  applied: { label: 'Đã ứng tuyển', className: 'bg-secondary text-secondary-foreground' },
  under_review: { label: 'Đang xem xét', className: 'bg-primary/15 text-primary' },
  interview: { label: 'Phỏng vấn', className: 'bg-purple-500/10 text-purple-600' },
  rejected: { label: 'Không phù hợp', className: 'bg-destructive/10 text-destructive' },
  offer: { label: 'Nhận offer', className: 'bg-green-500/10 text-green-700' },
}

function ApplicationsPage() {
  const [selectedChip, setSelectedChip] = React.useState(chips[0])

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold theme-text-main">Việc đã ứng tuyển</h1>
        <p className="mt-1 text-sm text-muted-foreground">5 đơn ứng tuyển</p>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Tìm việc đã ứng tuyển..." className="h-10 max-w-sm border-white/10 bg-[#1f2833]/70" />
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
        {applications.map((job) => (
          <article key={job.id} className="rounded-2xl border border-white/10 bg-[#1f2833]/95 p-5">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#111844] text-xs font-bold text-muted-foreground">{job.initials}</div>
                <div>
                  <h3 className="text-base font-semibold">{job.title}</h3>
                  <p className="text-sm text-muted-foreground">{job.company}</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusMap[job.status].className}`}>{statusMap[job.status].label}</span>
            </div>

            <div className="mb-3 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1"><DollarSign className="h-3.5 w-3.5" />{job.salary}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {job.skills.map((skill) => <Badge key={skill} variant="outline" className="border-white/20 text-xs">{skill}</Badge>)}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{job.appliedAt}</span>
              <Link to="/jobs/$jobId" params={{ jobId: job.id }}>
                <Button size="sm" variant="outline">Xem chi tiết</Button>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
