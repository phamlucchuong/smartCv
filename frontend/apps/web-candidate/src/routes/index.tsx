import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Card, CardContent, Input } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import {
  ArrowRight,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Building2,
  ChartColumn,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DollarSign,
  Layers3,
  MapPin,
  Search,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

const stats = [
  { label: 'Open jobs', value: '1,284+' },
  { label: 'Hiring companies', value: '420+' },
  { label: 'Avg response time', value: '36h' },
  { label: 'Remote roles', value: '310+' },
]

const categories = [
  { name: 'Frontend Engineering', jobs: 188, icon: Layers3 },
  { name: 'Backend Engineering', jobs: 234, icon: BriefcaseBusiness },
  { name: 'Data & AI', jobs: 116, icon: ChartColumn },
  { name: 'DevOps / Cloud', jobs: 97, icon: TrendingUp },
]

const jobs = [
  {
    id: 'senior-nodejs',
    title: 'Senior Node.js Backend Developer',
    company: 'NexusTech Solutions',
    salary: '$2,500 - $3,500',
    location: 'Ho Chi Minh City (Hybrid)',
    skills: ['Node.js', 'TypeScript', 'AWS', 'PostgreSQL'],
    posted: 'Posted 2 hours ago',
  },
  {
    id: 'frontend-react-nextjs',
    title: 'Frontend Engineer (React + Next.js)',
    company: 'Nova Product Studio',
    salary: '$2,000 - $2,800',
    location: 'Ha Noi (Onsite)',
    skills: ['React', 'Next.js', 'Tailwind', 'GraphQL'],
    posted: 'Posted 6 hours ago',
  },
  {
    id: 'fullstack-python-react',
    title: 'Fullstack Developer (Python/React)',
    company: 'Skyline Labs',
    salary: '$2,200 - $3,000',
    location: 'Da Nang (Remote)',
    skills: ['Python', 'Django', 'React', 'Docker'],
    posted: 'Posted 1 day ago',
  },
  {
    id: 'senior-qa-automation',
    title: 'Senior QA Automation Engineer',
    company: 'Finverse Digital',
    salary: '$1,800 - $2,500',
    location: 'Ho Chi Minh City (Onsite)',
    skills: ['Playwright', 'Cypress', 'CI/CD', 'API Testing'],
    posted: 'Posted 1 day ago',
  },
  {
    id: 'devops-aws-kubernetes',
    title: 'DevOps Engineer (AWS/Kubernetes)',
    company: 'CloudBridge Tech',
    salary: '$2,700 - $3,600',
    location: 'Remote (Vietnam)',
    skills: ['Kubernetes', 'Terraform', 'AWS', 'Prometheus'],
    posted: 'Posted 2 days ago',
  },
  {
    id: 'data-engineer-python-spark',
    title: 'Data Engineer (Python/Spark)',
    company: 'DataNova Analytics',
    salary: '$2,300 - $3,200',
    location: 'Ha Noi (Hybrid)',
    skills: ['Python', 'Spark', 'Airflow', 'BigQuery'],
    posted: 'Posted 3 days ago',
  },
  {
    id: 'mobile-react-native',
    title: 'Mobile Engineer (React Native)',
    company: 'BluePixel Ventures',
    salary: '$1,900 - $2,700',
    location: 'Ho Chi Minh City (Hybrid)',
    skills: ['React Native', 'TypeScript', 'Redux', 'Firebase'],
    posted: 'Posted 3 days ago',
  },
  {
    id: 'engineering-manager',
    title: 'Engineering Manager',
    company: 'ScaleOne Labs',
    salary: '$4,000 - $5,500',
    location: 'Remote (APAC)',
    skills: ['Leadership', 'System Design', 'Agile', 'Hiring'],
    posted: 'Posted 4 days ago',
  },
  {
    id: 'product-designer-ux-ui',
    title: 'Product Designer (UX/UI)',
    company: 'PixelCraft Studio',
    salary: '$1,600 - $2,400',
    location: 'Da Nang (Onsite)',
    skills: ['Figma', 'Design System', 'Research', 'Prototyping'],
    posted: 'Posted 5 days ago',
  },
]

const companies = [
  { name: 'InnovateHub Vietnam', reviews: 45, hiring: 12, pitch: 'AI-first product studio scaling cloud-native platforms globally.' },
  { name: 'ByteForge', reviews: 30, hiring: 8, pitch: 'Engineering-focused environment for high-load fintech products.' },
  { name: 'CloudBridge Tech', reviews: 52, hiring: 16, pitch: 'Remote-friendly team building data and DevOps tooling.' },
  { name: 'ScaleOne Labs', reviews: 38, hiring: 10, pitch: 'Fast-growth SaaS team with strong product engineering culture.' },
]

const resources = [
  'How to craft a developer CV that passes ATS in 2026',
  'Technical interview prep roadmap for mid-level engineers',
  'Remote compensation benchmark in Vietnam IT market',
  'How to evaluate engineering culture before accepting an offer',
  'Backend system design checklist for senior-level interviews',
  'Salary negotiation guide for software engineers in SEA',
]

const testimonials = [
  {
    name: 'Nguyen Minh Anh',
    role: 'Frontend Engineer',
    quote: 'I found a better role in 2 weeks thanks to transparent salary ranges and quality job descriptions.',
  },
  {
    name: 'Tran Hoang Vu',
    role: 'DevOps Engineer',
    quote: 'The filters are practical. I could quickly narrow to remote AWS roles with growth-focused teams.',
  },
  {
    name: 'Le Thu Ha',
    role: 'Product Designer',
    quote: 'Company profile details helped me avoid poor-fit interviews and focus on culture I value.',
  },
]

const faqs = [
  {
    q: 'How do I apply for a job?',
    a: 'Open a job card, review requirements, and click Quick Apply. Your profile is attached automatically.',
  },
  {
    q: 'Can I filter only remote jobs?',
    a: 'Yes. Use location filter and select Remote to see distributed opportunities only.',
  },
  {
    q: 'Do companies see my profile publicly?',
    a: 'No. Your profile is shared only when you apply or explicitly allow visibility.',
  },
]

function IndexComponent() {
  const { t } = useTranslation()
  const [page, setPage] = React.useState(1)
  const jobsPerPage = 6
  const totalPages = Math.ceil(jobs.length / jobsPerPage)
  const paginatedJobs = jobs.slice((page - 1) * jobsPerPage, page * jobsPerPage)

  return (
    <div className="space-y-12 pb-12">
      <section className="relative overflow-hidden border-y border-border" aria-label="Hero Banner">
        <div className="absolute inset-0 ai-gradient opacity-60 pointer-events-none" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 md:px-6 lg:grid-cols-2 lg:items-center lg:py-16">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-ai/20 bg-ai-soft px-3 py-1 text-xs font-medium text-ai">
              <Sparkles className="h-3.5 w-3.5" /> Powered by AI Matching Engine
            </div>
            <h1 className="hero-title text-4xl font-bold leading-tight md:text-5xl">
              {t('hero_title_before')} <span className="hero-gradient">{t('hero_title_highlight')}</span>
            </h1>
            <p className="mt-5 text-base text-muted-foreground md:text-lg">{t('hero_subtitle')}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" className="gap-2">{t('search_jobs')} <ArrowRight className="h-4 w-4" /></Button>
              <Button size="lg" variant="outline">Đăng tuyển dụng</Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> 50,000+ việc làm</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> 200+ doanh nghiệp</div>
            </div>
          </div>

          <div className="relative">
            <div className="card-surface relative z-10 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">AI Match Result</div>
                  <div className="text-lg font-semibold">Backend Java Developer</div>
                  <div className="text-sm text-muted-foreground">FPT Software</div>
                </div>
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-[6px] border-success text-lg font-bold text-success">
                  82%
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="mb-1.5 text-xs text-muted-foreground">Kỹ năng phù hợp</div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Java', 'REST API', 'MySQL'].map((s) => (
                      <span key={s} className="rounded-md border border-success/20 bg-success-soft px-2 py-0.5 text-xs text-success">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 text-xs text-muted-foreground">Kỹ năng còn thiếu</div>
                  <div className="flex flex-wrap gap-1.5">
                    {['Spring Boot', 'Docker'].map((s) => (
                      <span key={s} className="rounded-md border border-danger/20 bg-danger-soft px-2 py-0.5 text-xs text-danger">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-ai/20 bg-ai-soft p-3 text-xs text-foreground/80">
                  <div className="mb-1 flex items-center gap-1.5 font-medium text-ai">
                    <Sparkles className="h-3.5 w-3.5" /> 5 việc khác phù hợp hơn được gợi ý
                  </div>
                  Hãy cải thiện Spring Boot và Docker để tăng cơ hội.
                </div>
              </div>
            </div>
            <div className="absolute -right-4 -top-4 hidden items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm md:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ai text-ai-foreground"><Brain className="h-4 w-4" /></div>
              <div className="text-xs"><div className="font-semibold">AI Analysis</div><div className="text-muted-foreground">Live</div></div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4 md:px-6">
      <section className="relative -mt-4" aria-label="Job Search Engine">
        <form className="grid gap-3 rounded-2xl card-surface p-3 md:grid-cols-[1fr_220px_150px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={t('search_placeholder')} className="h-11 border-input bg-background pl-9" />
          </div>
          <Input placeholder={t('search_location')} className="h-11 border-input bg-background" />
          <Button type="submit" className="h-11">{t('search_jobs')}</Button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('hot_tech')}</span>
          {['React', 'Node.js', 'Python', 'Docker', 'Go', 'Kubernetes'].map((item) => (
            <Badge key={item} variant="secondary" className="bg-secondary/90 text-secondary-foreground">{item}</Badge>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Platform Stats">
        {stats.map((item) => (
          <Card key={item.label} className="card-surface">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-3xl font-bold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-4" aria-label="Popular Categories">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold">Popular Categories</h2>
          <a href="#" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">View all categories <ChevronRight className="h-4 w-4" /></a>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Card key={category.name} className="elevate-card card-surface">
                <CardContent className="space-y-3 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary"><Icon className="h-5 w-5" /></div>
                  <h3 className="text-base font-semibold">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.jobs} open positions this week</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section id="remote-jobs" className="space-y-4" aria-label="Featured and Hot Jobs">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold">{t('featured_jobs')}</h2>
          <Link to="/about" className="text-sm text-primary hover:underline">Explore career profile tips</Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedJobs.map((job) => (
            <Link key={job.title} to="/jobs/$jobId" params={{ jobId: job.id }} className="block">
              <article className="elevate-card rounded-2xl card-surface p-5 h-full">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.company}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-border" onClick={(e) => e.preventDefault()}>☆</Button>
                </div>

                <div className="mb-3 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1"><DollarSign className="h-3.5 w-3.5" />{job.salary}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  {job.skills.map((skill) => <Badge key={skill} variant="outline" className="border-border text-xs">{skill}</Badge>)}
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{job.posted}</span>
                  <Button size="sm" onClick={(e) => e.preventDefault()}>Quick Apply</Button>
                </div>
              </article>
            </Link>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-border bg-white/5 p-4 text-sm md:flex-row">
          <p className="text-muted-foreground">Page {page} of {totalPages} • Showing {(page - 1) * jobsPerPage + 1}-{Math.min(page * jobsPerPage, jobs.length)} of {jobs.length} jobs</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="border-border bg-white/5">
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <Button
                key={idx + 1}
                size="sm"
                variant={page === idx + 1 ? 'default' : 'outline'}
                onClick={() => setPage(idx + 1)}
                className={page === idx + 1 ? '' : 'border-border bg-white/5'}
              >
                {idx + 1}
              </Button>
            ))}
            <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="border-border bg-white/5">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <section id="companies" className="space-y-4" aria-label="Top Companies Spotlight">
        <h2 className="text-2xl font-semibold">Top Companies Spotlight</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {companies.map((company) => (
            <Card key={company.name} className="elevate-card overflow-hidden border border-border bg-card">
              <div className="h-24 bg-gradient-to-r from-primary to-brand-blue" />
              <CardContent className="space-y-3 p-5">
                <div className="-mt-11 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background"><Building2 className="h-5 w-5" /></div>
                <h3 className="text-base font-semibold">{company.name}</h3>
                <p className="flex items-center gap-1 text-sm text-primary"><Star className="h-4 w-4 fill-current" />4.5 ({company.reviews} reviews)</p>
                <p className="text-sm text-muted-foreground">{company.pitch}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">{company.hiring} Open Positions</span>
                  <a href="#" className="text-primary hover:underline">View Profile</a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="salary-insights" className="grid gap-4 lg:grid-cols-[1.2fr_1fr]" aria-label="Salary and Career Insights">
        <Card className="border border-border bg-card/95">
          <CardContent className="space-y-4 p-6">
            <p className="inline-flex items-center gap-2 text-sm text-primary"><Sparkles className="h-4 w-4" /> Salary Insights</p>
            <h3 className="text-xl font-semibold">2026 Vietnam Tech Salary Snapshot</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center justify-between rounded-lg border border-border bg-white/5 px-3 py-2"><span>Frontend Engineer (Mid)</span><strong className="text-foreground">$1,500 - $2,300</strong></p>
              <p className="flex items-center justify-between rounded-lg border border-border bg-white/5 px-3 py-2"><span>Backend Engineer (Senior)</span><strong className="text-foreground">$2,500 - $3,800</strong></p>
              <p className="flex items-center justify-between rounded-lg border border-border bg-white/5 px-3 py-2"><span>DevOps Engineer</span><strong className="text-foreground">$2,200 - $3,500</strong></p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card/95">
          <CardContent className="space-y-4 p-6">
            <p className="inline-flex items-center gap-2 text-sm text-primary"><TrendingUp className="h-4 w-4" /> Career Momentum</p>
            <h3 className="text-xl font-semibold">Most Requested Skills by Employers</h3>
            <div className="flex flex-wrap gap-2">
              {['TypeScript', 'System Design', 'AWS', 'Kubernetes', 'GraphQL', 'Data Modeling', 'Prompt Engineering'].map((tag) => (
                <Badge key={tag} variant="outline" className="border-border">{tag}</Badge>
              ))}
            </div>
            <Button variant="outline" className="w-full border-border bg-white/5">Download Salary Report</Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4" aria-label="Candidate Success Stories">
        <h2 className="text-2xl font-semibold">Candidate Success Stories</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <Card key={item.name} className="card-surface">
              <CardContent className="space-y-3 p-5">
                <p className="text-sm leading-6 text-muted-foreground">“{item.quote}”</p>
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="internships" className="space-y-4" aria-label="How It Works">
        <h2 className="text-2xl font-semibold">How SmartCV Works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { step: '1', title: 'Create your profile', desc: 'Add your skills, projects, and preferred role in under 10 minutes.' },
            { step: '2', title: 'Get curated matches', desc: 'Receive job recommendations based on stack, level, and salary expectations.' },
            { step: '3', title: 'Apply and track', desc: 'Submit applications quickly and track interview status in one dashboard.' },
          ].map((item) => (
            <Card key={item.step} className="card-surface">
              <CardContent className="space-y-3 p-5">
                <Badge className="bg-primary/20 text-primary">Step {item.step}</Badge>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="resources" className="space-y-4" aria-label="Career Resources">
        <h2 className="text-2xl font-semibold">Career Resources & Blog Hub</h2>
        <div id="cv-templates" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((title) => (
            <Card key={title} className="card-surface">
              <CardContent className="p-5">
                <p className="mb-3 inline-flex items-center gap-1 text-xs text-primary"><BookOpen className="h-3.5 w-3.5" />Career Guide</p>
                <h3 className="text-base font-semibold">{title}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="interview-guides" className="space-y-4" aria-label="FAQ">
        <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((item) => (
            <Card key={item.q} className="card-surface">
              <CardContent className="space-y-2 p-5">
                <h3 className="font-semibold">{item.q}</h3>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      </div>
    </div>
  )
}
