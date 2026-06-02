import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Card, CardContent, Input } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import { Briefcase, Eye, MapPin, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { type CVItem, type Education, type Experience, useCandidateStore } from '../store/useCandidateStore'

export const Route = createFileRoute('/_account/profile')({
  component: ProfilePage,
})

function formatToday() {
  const now = new Date()
  return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
}

function toInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function ProfilePage() {
  const { t } = useTranslation()
  const user = useCandidateStore((s) => s.user)
  const experiences = useCandidateStore((s) => s.experiences)
  const educations = useCandidateStore((s) => s.educations)
  const skills = useCandidateStore((s) => s.skills)
  const appliedJobIds = useCandidateStore((s) => s.appliedJobIds)
  const wishlistJobs = useCandidateStore((s) => s.wishlistJobs)
  const updateUser = useCandidateStore((s) => s.updateUser)
  const setSkills = useCandidateStore((s) => s.setSkills)
  const addExperience = useCandidateStore((s) => s.addExperience)
  const updateExperience = useCandidateStore((s) => s.updateExperience)
  const removeExperience = useCandidateStore((s) => s.removeExperience)
  const addEducation = useCandidateStore((s) => s.addEducation)
  const updateEducation = useCandidateStore((s) => s.updateEducation)
  const removeEducation = useCandidateStore((s) => s.removeEducation)
  const addCV = useCandidateStore((s) => s.addCV)

  const [editMode, setEditMode] = React.useState(false)
  const [draft, setDraft] = React.useState(user)
  const [skillInput, setSkillInput] = React.useState('')
  const [editingExperienceId, setEditingExperienceId] = React.useState<string | null>(null)
  const [editingEducationId, setEditingEducationId] = React.useState<string | null>(null)
  const [expForm, setExpForm] = React.useState<Omit<Experience, 'id'>>({ title: '', company: '', type: '', dateRange: '', location: '', achievements: [] })
  const [eduForm, setEduForm] = React.useState<Omit<Education, 'id'>>({ school: '', degree: '', dateRange: '' })

  const fileRef = React.useRef<HTMLInputElement>(null)

  const resetExpForm = () => {
    setEditingExperienceId(null)
    setExpForm({ title: '', company: '', type: '', dateRange: '', location: '', achievements: [] })
  }

  const resetEduForm = () => {
    setEditingEducationId(null)
    setEduForm({ school: '', degree: '', dateRange: '' })
  }

  const handleUpload = (file: File | null) => {
    if (!file) return
    const validType = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)
    if (!validType) {
      toast.error(t('account_upload_invalid_type'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('account_upload_too_large'))
      return
    }

    const cv: CVItem = {
      id: crypto.randomUUID(),
      name: file.name,
      type: file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOC',
      uploaded: formatToday(),
      status: 'Processing',
      isDefault: false,
    }
    addCV(cv)
    toast.success(t('account_upload_success'))
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit lg:sticky lg:top-20">
          <CardContent className="space-y-4 p-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary">{user.initials}</div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{user.name}</h1>
              <p className="text-sm text-muted-foreground">{user.title}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{user.location}</p>
            </div>
            <hr className="border-border" />
            <div className="space-y-2 text-sm">
              <p className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-muted-foreground"><Briefcase className="h-4 w-4" />Applied</span><span className="font-semibold text-foreground">{appliedJobIds.length}</span></p>
              <p className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-muted-foreground">♡ Saved</span><span className="font-semibold text-foreground">{wishlistJobs.length}</span></p>
              <p className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-muted-foreground"><Eye className="h-4 w-4" />Profile views</span><span className="font-semibold text-foreground">34</span></p>
            </div>
            <hr className="border-border" />
            {!editMode ? (
              <Button variant="outline" className="w-full" onClick={() => { setDraft(user); setEditMode(true) }}>Edit Profile</Button>
            ) : (
              <div className="flex gap-2">
                <Button className="w-full" onClick={() => {
                  updateUser({ ...draft, initials: toInitials(draft.name), firstName: draft.name.split(' ').slice(-1)[0] ?? draft.firstName })
                  setEditMode(false)
                  toast.success(t('account_saved_toast'))
                }}>Save</Button>
                <Button variant="outline" className="w-full" onClick={() => { setDraft(user); setEditMode(false) }}>Cancel</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 border-l-4 border-primary pl-3 text-lg font-semibold text-foreground">Basic Info</h2>
              {[
                ['Full Name', 'name'],
                ['Email', 'email'],
                ['Phone', 'phone'],
                ['Location', 'location'],
                ['Title', 'title'],
              ].map(([label, key]) => (
                <div key={label} className="flex items-start gap-3 border-b border-border py-2 text-sm last:border-0">
                  <span className="w-28 shrink-0 font-medium text-muted-foreground">{label}</span>
                  {editMode ? (
                    <Input value={draft[key as keyof typeof draft] as string} onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))} />
                  ) : (
                    <span className="text-foreground">{user[key as keyof typeof user]}</span>
                  )}
                </div>
              ))}
              <div className="mt-3">
                <p className="mb-2 text-sm font-medium text-muted-foreground">Bio</p>
                {editMode ? (
                  <textarea className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm" value={draft.bio} onChange={(e) => setDraft((prev) => ({ ...prev, bio: e.target.value }))} />
                ) : (
                  <p className="text-sm text-foreground">{user.bio}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="border-l-4 border-primary pl-3 text-lg font-semibold text-foreground">Work Experience</h2>
              {experiences.map((item) => (
                <div key={item.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.company} · {item.type}</p>
                      <p className="text-xs text-muted-foreground">{item.dateRange} · {item.location}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditingExperienceId(item.id); setExpForm({ title: item.title, company: item.company, type: item.type, dateRange: item.dateRange, location: item.location, achievements: item.achievements }) }}>Sửa</Button>
                      <Button variant="outline" size="sm" onClick={() => removeExperience(item.id)}>Xóa</Button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="grid gap-2 md:grid-cols-2">
                <Input value={expForm.title} onChange={(e) => setExpForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" />
                <Input value={expForm.company} onChange={(e) => setExpForm((p) => ({ ...p, company: e.target.value }))} placeholder="Company" />
                <Input value={expForm.type} onChange={(e) => setExpForm((p) => ({ ...p, type: e.target.value }))} placeholder="Type" />
                <Input value={expForm.dateRange} onChange={(e) => setExpForm((p) => ({ ...p, dateRange: e.target.value }))} placeholder="Date range" />
                <Input value={expForm.location} onChange={(e) => setExpForm((p) => ({ ...p, location: e.target.value }))} placeholder="Location" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  if (editingExperienceId) {
                    updateExperience(editingExperienceId, expForm)
                    toast.success(t('account_saved_toast'))
                  } else {
                    addExperience(expForm)
                    toast.success(t('account_saved_toast'))
                  }
                  resetExpForm()
                }}>{editingExperienceId ? 'Lưu sửa' : 'Thêm kinh nghiệm'}</Button>
                {editingExperienceId && <Button variant="ghost" size="sm" onClick={resetExpForm}>Hủy</Button>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="border-l-4 border-primary pl-3 text-lg font-semibold text-foreground">Education</h2>
              {educations.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
                  <div>
                    <p className="font-semibold text-foreground">{item.school}</p>
                    <p className="text-sm text-muted-foreground">{item.degree}</p>
                    <p className="text-xs text-muted-foreground">{item.dateRange}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditingEducationId(item.id); setEduForm({ school: item.school, degree: item.degree, dateRange: item.dateRange }) }}>Sửa</Button>
                    <Button variant="outline" size="sm" onClick={() => removeEducation(item.id)}>Xóa</Button>
                  </div>
                </div>
              ))}
              <div className="grid gap-2 md:grid-cols-3">
                <Input value={eduForm.school} onChange={(e) => setEduForm((p) => ({ ...p, school: e.target.value }))} placeholder="School" />
                <Input value={eduForm.degree} onChange={(e) => setEduForm((p) => ({ ...p, degree: e.target.value }))} placeholder="Degree" />
                <Input value={eduForm.dateRange} onChange={(e) => setEduForm((p) => ({ ...p, dateRange: e.target.value }))} placeholder="Date range" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  if (editingEducationId) {
                    updateEducation(editingEducationId, eduForm)
                    toast.success(t('account_saved_toast'))
                  } else {
                    addEducation(eduForm)
                    toast.success(t('account_saved_toast'))
                  }
                  resetEduForm()
                }}>{editingEducationId ? 'Lưu sửa' : 'Thêm học vấn'}</Button>
                {editingEducationId && <Button variant="ghost" size="sm" onClick={resetEduForm}>Hủy</Button>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="border-l-4 border-primary pl-3 text-lg font-semibold text-foreground">Skills & CV</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1">{skill}<button onClick={() => setSkills(skills.filter((item) => item !== skill))}><X className="h-3 w-3" /></button></Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Thêm kỹ năng" />
                <Button onClick={() => {
                  const value = skillInput.trim()
                  if (!value || skills.includes(value)) return
                  setSkills([...skills, value])
                  setSkillInput('')
                  toast.success(t('account_saved_toast'))
                }}>Thêm</Button>
              </div>
              <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-8 text-center text-muted-foreground" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files?.[0] ?? null) }}>
                <Upload className="h-6 w-6" />
                <p>Drag & drop or click to upload</p>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0] ?? null)} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Browse files</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
