import { createFileRoute, redirect } from '@tanstack/react-router'
import { Badge, Button, Card, CardContent } from '@smart-cv/ui'
import { Briefcase, Eye, MapPin, Upload } from 'lucide-react'
import { mockUser } from '../store/useCandidateStore'

export const Route = createFileRoute('/profile')({
  beforeLoad: () => {
    if (localStorage.getItem('isAuthenticated') !== 'true') {
      throw redirect({ to: '/signin' })
    }
  },
  component: ProfilePage,
})

const experiences = [
  {
    title: 'Frontend Engineer',
    company: 'Nova Product Studio',
    type: 'Full-time',
    dateRange: '01/2024 - Present',
    location: 'TP. Hồ Chí Minh',
    initials: 'NPS',
    achievements: ['Built React + TypeScript SPAs for HR and fintech products.', 'Improved performance by 40% through code-splitting and query caching.'],
  },
  {
    title: 'Junior Frontend Developer',
    company: 'Skyline Labs',
    type: 'Full-time',
    dateRange: '06/2022 - 12/2023',
    location: 'Hà Nội',
    initials: 'SL',
    achievements: ['Developed UI components in Vue.js and migrated core screens to React.', 'Collaborated with designers to deliver responsive interfaces across web and tablet.'],
  },
]

const education = {
  school: 'Đại học Bách Khoa TP.HCM',
  degree: 'Cử nhân Kỹ thuật Phần mềm',
  dateRange: '2018 - 2022',
  initials: 'BKU',
}

const skills = ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL', 'Node.js', 'Figma', 'Git']

function ProfilePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 pb-20 lg:pb-0">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit lg:sticky lg:top-20">
          <CardContent className="p-6 space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
              {mockUser.initials}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{mockUser.name}</h1>
              <p className="text-sm text-muted-foreground">{mockUser.title}</p>
              <p className="text-sm text-muted-foreground inline-flex items-center gap-1 mt-1"><MapPin className="h-3.5 w-3.5" />{mockUser.location}</p>
            </div>
            <hr className="border-border" />
            <div className="space-y-2 text-sm">
              <p className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-muted-foreground"><Briefcase className="h-4 w-4" />Applied</span><span className="font-semibold text-foreground">12</span></p>
              <p className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-muted-foreground">♡ Saved</span><span className="font-semibold text-foreground">8</span></p>
              <p className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-muted-foreground"><Eye className="h-4 w-4" />Profile views</span><span className="font-semibold text-foreground">34</span></p>
            </div>
            <hr className="border-border" />
            <Button variant="outline" className="w-full">Edit Profile</Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">Basic Info</h2>
              {[
                ['Full Name', mockUser.name],
                ['Email', mockUser.email],
                ['Phone', mockUser.phone],
                ['Location', mockUser.location],
                ['Title', mockUser.title],
                ['Bio', mockUser.bio],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start gap-3 py-2 border-b border-border last:border-0 text-sm">
                  <span className="w-28 shrink-0 text-muted-foreground font-medium">{label}</span>
                  <span className="text-foreground">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">Work Experience</h2>
              <div className="space-y-4">
                {experiences.map((item) => (
                  <div key={`${item.company}-${item.title}`} className="border border-border rounded-xl p-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs font-semibold text-foreground shrink-0">
                        {item.initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.company} · {item.type}</p>
                        <p className="text-xs text-muted-foreground">{item.dateRange} · {item.location}</p>
                        <ul className="mt-2 text-sm text-foreground list-disc pl-5 space-y-1">
                          {item.achievements.map((achievement) => <li key={achievement}>{achievement}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3 mb-4">Education</h2>
              <div className="border border-border rounded-xl p-4 flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs font-semibold text-foreground shrink-0">{education.initials}</div>
                <div>
                  <p className="font-semibold text-foreground">{education.school}</p>
                  <p className="text-sm text-muted-foreground">{education.degree}</p>
                  <p className="text-xs text-muted-foreground">{education.dateRange}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground border-l-4 border-primary pl-3">Skills & CV</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}
              </div>
              <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 text-muted-foreground text-center">
                <Upload className="h-6 w-6" />
                <p>Drag & drop or click to upload</p>
                <Button variant="outline" size="sm">Browse files</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
