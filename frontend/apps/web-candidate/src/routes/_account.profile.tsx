import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { Button, Card, CardContent, Input } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import { Briefcase, Eye, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import {
  useGetMe2, useUpdate1, useUpdateUser,
  getGetMe2QueryKey, getGetCurrentUserQueryKey,
  UserModels,
} from '@smart-cv/api'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/useAuthStore'
import { usePreferencesStore } from '../store/usePreferencesStore'

export const Route = createFileRoute('/_account/profile')({
  component: ProfilePage,
})

function toInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
}

type ExpForm = {
  title: string; company: string
  startMonth: string; startYear: string
  endMonth: string; endYear: string
  isCurrent: boolean; achievements: string[]
}
type EduForm = {
  school: string; degree: string
  startMonth: string; startYear: string
  endMonth: string; endYear: string
  isCurrent: boolean
}
type CertForm = {
  name: string; issuer: string
  issueMonth: string; issueYear: string
  credentialUrl: string
}

// ── Month data ──────────────────────────────────────────────────
const MONTHS = [
  { value: '01', vi: 'Tháng 1',  en: 'January' },
  { value: '02', vi: 'Tháng 2',  en: 'February' },
  { value: '03', vi: 'Tháng 3',  en: 'March' },
  { value: '04', vi: 'Tháng 4',  en: 'April' },
  { value: '05', vi: 'Tháng 5',  en: 'May' },
  { value: '06', vi: 'Tháng 6',  en: 'June' },
  { value: '07', vi: 'Tháng 7',  en: 'July' },
  { value: '08', vi: 'Tháng 8',  en: 'August' },
  { value: '09', vi: 'Tháng 9',  en: 'September' },
  { value: '10', vi: 'Tháng 10', en: 'October' },
  { value: '11', vi: 'Tháng 11', en: 'November' },
  { value: '12', vi: 'Tháng 12', en: 'December' },
]
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 30 }, (_, i) => String(CURRENT_YEAR - i))

// ── Custom scrollable select ──────────────────────────────────────
type ScrollSelectOption = { value: string; label: string }

function ScrollSelect({
  value, onChange, options, placeholder, disabled,
}: {
  value: string
  onChange: (v: string) => void
  options: ScrollSelectOption[]
  placeholder: string
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`border-input bg-background flex h-9 w-full items-center justify-between rounded-md border pl-2 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 ${
          disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/30'
        }`}
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="border-border bg-popover absolute left-0 top-full z-50 mt-1 w-full rounded-md border shadow-lg">
          <ul className="max-h-48 overflow-y-auto py-1 text-sm" role="listbox">
            <li
              role="option"
              aria-selected={value === ''}
              onClick={() => { onChange(''); setOpen(false) }}
              className={`cursor-pointer px-3 py-1.5 text-muted-foreground hover:bg-muted/60 ${
                value === '' ? 'bg-muted/40 font-medium' : ''
              }`}
            >
              {placeholder}
            </li>
            {options.map((opt) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={value === opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`cursor-pointer px-3 py-1.5 hover:bg-muted/60 ${
                  value === opt.value ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                }`}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Reusable selects ─────────────────────────────────────────────
function MonthSelect({
  value, onChange, disabled, lang,
}: { value: string; onChange: (v: string) => void; disabled?: boolean; lang: string }) {
  const placeholder = lang === 'VI' ? 'Tháng' : 'Month'
  const options = MONTHS.map((m) => ({ value: m.value, label: lang === 'VI' ? m.vi : m.en }))
  return <ScrollSelect value={value} onChange={onChange} options={options} placeholder={placeholder} disabled={disabled} />
}

function YearSelect({
  value, onChange, disabled, lang,
}: { value: string; onChange: (v: string) => void; disabled?: boolean; lang: string }) {
  const placeholder = lang === 'VI' ? 'Năm' : 'Year'
  const options = YEARS.map((y) => ({ value: y, label: y }))
  return <ScrollSelect value={value} onChange={onChange} options={options} placeholder={placeholder} disabled={disabled} />
}

// ── DateRangeRow ─────────────────────────────────────────────────
function DateRangeRow({
  startMonth, startYear, endMonth, endYear, isCurrent,
  onStartMonth, onStartYear, onEndMonth, onEndYear, onCurrentChange,
  lang, startLabel, endLabel, currentLabel,
}: {
  startMonth: string; startYear: string; endMonth: string; endYear: string; isCurrent: boolean
  onStartMonth: (v: string) => void; onStartYear: (v: string) => void
  onEndMonth: (v: string) => void; onEndYear: (v: string) => void
  onCurrentChange: (v: boolean) => void
  lang: string; startLabel: string; endLabel: string; currentLabel: string
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{startLabel}</p>
        <div className="grid grid-cols-2 gap-1">
          <MonthSelect value={startMonth} onChange={onStartMonth} lang={lang} />
          <YearSelect value={startYear} onChange={onStartYear} lang={lang} />
        </div>
      </div>

      <span className="pb-1 text-xs text-muted-foreground">→</span>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{endLabel}</p>
          <label className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => onCurrentChange(e.target.checked)}
              className="accent-primary"
            />
            {currentLabel}
          </label>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <MonthSelect value={endMonth} onChange={onEndMonth} disabled={isCurrent} lang={lang} />
          <YearSelect value={endYear} onChange={onEndYear} disabled={isCurrent} lang={lang} />
        </div>
      </div>
    </div>
  )
}

function buildCandidateRequest(p: UserModels.CandidateResponse): UserModels.CandidateRequest {
  return {
    address:           p.address,
    title:             p.title,
    bio:               p.bio,
    avatarUrl:         p.avatarUrl,
    skills:            p.skills ?? [],
    yearsOfExperience: p.yearsOfExperience,
    experiences:       p.experiences ?? [],
    educations:        p.educations ?? [],
    certifications:    p.certifications ?? [],
    languages:         p.languages ?? [],
    jobType:           p.jobType,
    preferredLocation: p.preferredLocation,
    expectedSalaryMin: p.expectedSalaryMin,
    expectedSalaryMax: p.expectedSalaryMax,
    portfolioUrl:      p.portfolioUrl,
    githubUrl:         p.githubUrl,
    linkedinUrl:       p.linkedinUrl,
  }
}

// ── Main page ────────────────────────────────────────────────────
function ProfilePage() {
  const { t } = useTranslation()
  const { isAuthenticated, userId } = useAuthStore()
  const lang = usePreferencesStore((s) => s.language) // 'EN' | 'VI'
  const { data, isLoading, isError } = useGetMe2({ query: { enabled: isAuthenticated } })
  const profile = data?.data
  const candidateId = profile?.id

  const queryClient = useQueryClient()
  const updateCandidateMutation = useUpdate1()
  const updateUserMutation = useUpdateUser()

  React.useEffect(() => { document.title = t('page_title_profile') }, [t])

  const fullName      = profile?.fullName    ?? ''
  const email         = profile?.email       ?? ''
  const phone         = profile?.phone       ?? ''
  const bio           = profile?.bio         ?? ''
  const title         = profile?.title       ?? ''
  const address       = profile?.address     ?? ''
  const experiences: UserModels.WorkExperience[] = profile?.experiences   ?? []
  const educations: UserModels.Education[]        = profile?.educations    ?? []
  const certifications: UserModels.Certification[] = profile?.certifications ?? []
  const initials   = toInitials(fullName)

  const [editMode, setEditMode] = React.useState(false)
  const [draft, setDraft] = React.useState({ name: '', email: '', phone: '', location: '', title: '', bio: '' })

  const [editingExpId,  setEditingExpId]  = React.useState<string | null>(null)
  const [editingEduId,  setEditingEduId]  = React.useState<string | null>(null)
  const [editingCertId, setEditingCertId] = React.useState<string | null>(null)

  const [expForm, setExpForm] = React.useState<ExpForm>({
    title: '', company: '', startMonth: '', startYear: '', endMonth: '', endYear: '', isCurrent: false, achievements: [],
  })
  const [eduForm, setEduForm] = React.useState<EduForm>({
    school: '', degree: '', startMonth: '', startYear: '', endMonth: '', endYear: '', isCurrent: false,
  })
  const [certForm, setCertForm] = React.useState<CertForm>({
    name: '', issuer: '', issueMonth: '', issueYear: '', credentialUrl: '',
  })

  const displayValues = { name: fullName, email, phone, location: address, title }

  const handleEditClick = () => {
    setDraft({ name: fullName, email, phone, location: address, title, bio })
    setEditMode(true)
  }

  const handleSave = () => {
    if (!profile || !candidateId || !userId) return
    Promise.all([
      updateCandidateMutation.mutateAsync({
        id: candidateId,
        data: { ...buildCandidateRequest(profile), address: draft.location, title: draft.title, bio: draft.bio },
      }),
      updateUserMutation.mutateAsync({ userId, data: { fullName: draft.name } }),
    ]).then(() => {
      queryClient.invalidateQueries({ queryKey: getGetMe2QueryKey() })
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() })
      setEditMode(false)
      toast.success(t('profile_saved') || 'Profile saved')
    }).catch(() => toast.error('Failed to save profile'))
  }

  const handleSaveExp = () => {
    if (!profile || !candidateId) return
    const newExp: UserModels.WorkExperience = {
      title:     expForm.title || undefined,
      company:   expForm.company || undefined,
      startDate: expForm.startYear ? `${expForm.startYear}-${expForm.startMonth || '01'}-01` : undefined,
      endDate:   expForm.isCurrent ? undefined : (expForm.endYear ? `${expForm.endYear}-${expForm.endMonth || '01'}-01` : undefined),
      current:   expForm.isCurrent,
      description: expForm.achievements.length ? expForm.achievements.join('\n') : undefined,
    }
    const updatedExps = editingExpId !== null
      ? experiences.map((e, i) => (String(i) === editingExpId ? newExp : e))
      : [...experiences, newExp]
    updateCandidateMutation.mutate(
      { id: candidateId, data: { ...buildCandidateRequest(profile), experiences: updatedExps } },
      {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetMe2QueryKey() }); resetExpForm(); toast.success('Experience saved') },
        onError: () => toast.error('Failed to save experience'),
      }
    )
  }

  const handleDeleteExp = (idx: number) => {
    if (!profile || !candidateId) return
    updateCandidateMutation.mutate(
      { id: candidateId, data: { ...buildCandidateRequest(profile), experiences: experiences.filter((_, i) => i !== idx) } },
      {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetMe2QueryKey() }); toast.success('Experience deleted') },
        onError: () => toast.error('Failed to delete experience'),
      }
    )
  }

  const handleSaveEdu = () => {
    if (!profile || !candidateId) return
    const newEdu: UserModels.Education = {
      institution: eduForm.school || undefined,
      degree:      eduForm.degree || undefined,
      startYear:   Number(eduForm.startYear) || undefined,
      endYear:     eduForm.isCurrent ? undefined : (Number(eduForm.endYear) || undefined),
    }
    const updatedEdus = editingEduId !== null
      ? educations.map((e, i) => (String(i) === editingEduId ? newEdu : e))
      : [...educations, newEdu]
    updateCandidateMutation.mutate(
      { id: candidateId, data: { ...buildCandidateRequest(profile), educations: updatedEdus } },
      {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetMe2QueryKey() }); resetEduForm(); toast.success('Education saved') },
        onError: () => toast.error('Failed to save education'),
      }
    )
  }

  const handleDeleteEdu = (idx: number) => {
    if (!profile || !candidateId) return
    updateCandidateMutation.mutate(
      { id: candidateId, data: { ...buildCandidateRequest(profile), educations: educations.filter((_, i) => i !== idx) } },
      {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetMe2QueryKey() }); toast.success('Education deleted') },
        onError: () => toast.error('Failed to delete education'),
      }
    )
  }

  const handleSaveCert = () => {
    if (!profile || !candidateId) return
    const newCert: UserModels.Certification = {
      name:          certForm.name || undefined,
      issuer:        certForm.issuer || undefined,
      issuedDate:    certForm.issueYear ? `${certForm.issueYear}-${certForm.issueMonth || '01'}-01` : undefined,
      credentialUrl: certForm.credentialUrl || undefined,
    }
    const updatedCerts = editingCertId !== null
      ? certifications.map((c, i) => (String(i) === editingCertId ? newCert : c))
      : [...certifications, newCert]
    updateCandidateMutation.mutate(
      { id: candidateId, data: { ...buildCandidateRequest(profile), certifications: updatedCerts } },
      {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetMe2QueryKey() }); resetCertForm(); toast.success('Certification saved') },
        onError: () => toast.error('Failed to save certification'),
      }
    )
  }

  const handleDeleteCert = (idx: number) => {
    if (!profile || !candidateId) return
    updateCandidateMutation.mutate(
      { id: candidateId, data: { ...buildCandidateRequest(profile), certifications: certifications.filter((_, i) => i !== idx) } },
      {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetMe2QueryKey() }); toast.success('Certification deleted') },
        onError: () => toast.error('Failed to delete certification'),
      }
    )
  }

  const resetExpForm  = () => { setEditingExpId(null);  setExpForm({ title: '', company: '', startMonth: '', startYear: '', endMonth: '', endYear: '', isCurrent: false, achievements: [] }) }
  const resetEduForm  = () => { setEditingEduId(null);  setEduForm({ school: '', degree: '', startMonth: '', startYear: '', endMonth: '', endYear: '', isCurrent: false }) }
  const resetCertForm = () => { setEditingCertId(null); setCertForm({ name: '', issuer: '', issueMonth: '', issueYear: '', credentialUrl: '' }) }

  const basicInfoFields: [string, keyof typeof displayValues][] = [
    [t('profile_full_name'), 'name'],
    [t('profile_email'),     'email'],
    [t('profile_phone'),     'phone'],
    [t('profile_address'),   'location'],
    [t('profile_job_title'), 'title'],
  ]

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">{lang === 'VI' ? 'Đang tải hồ sơ...' : 'Loading profile...'}</div>
  if (isError)   return <div className="p-8 text-center text-destructive">{lang === 'VI' ? 'Không thể tải hồ sơ.' : 'Failed to load profile.'}</div>

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

        {/* ─── Sidebar ─── */}
        <Card className="h-fit lg:sticky lg:top-20">
          <CardContent className="space-y-4 p-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary">{initials}</div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{fullName}</h1>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{address}</p>
            </div>
            <hr className="border-border" />
            <div className="space-y-2 text-sm">
              <p className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-muted-foreground"><Briefcase className="h-4 w-4" />{t('profile_applied')}</span><span className="font-semibold text-foreground">0</span></p>
              <p className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-muted-foreground">♡ {t('profile_saved')}</span><span className="font-semibold text-foreground">0</span></p>
              <p className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-muted-foreground"><Eye className="h-4 w-4" />{t('profile_views')}</span><span className="font-semibold text-foreground">34</span></p>
            </div>
            <hr className="border-border" />
            {!editMode ? (
              <Button variant="outline" className="w-full" onClick={handleEditClick}>{t('profile_edit')}</Button>
            ) : (
              <div className="flex gap-2">
                <Button className="w-full" disabled={updateCandidateMutation.isPending || updateUserMutation.isPending} onClick={handleSave}>{t('profile_save')}</Button>
                <Button variant="outline" className="w-full" onClick={() => setEditMode(false)}>{t('profile_cancel')}</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">

          {/* ─── Basic Info ─── */}
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 border-l-4 border-primary pl-3 text-lg font-semibold text-foreground">{t('profile_basic_info')}</h2>
              {basicInfoFields.map(([label, key]) => (
                <div key={key} className="flex items-start gap-3 border-b border-border py-2 text-sm last:border-0">
                  <span className="w-32 shrink-0 font-medium text-muted-foreground">{label}</span>
                  {editMode
                    ? <Input value={draft[key as keyof typeof draft] as string} onChange={(e) => setDraft((p) => ({ ...p, [key]: e.target.value }))} />
                    : <span className="text-foreground">{displayValues[key]}</span>
                  }
                </div>
              ))}
              <div className="mt-3">
                <p className="mb-2 text-sm font-medium text-muted-foreground">{t('profile_bio')}</p>
                {editMode
                  ? <textarea className="border-input bg-background min-h-24 w-full rounded-md border px-3 py-2 text-sm" value={draft.bio} onChange={(e) => setDraft((p) => ({ ...p, bio: e.target.value }))} />
                  : <p className="text-sm text-foreground">{bio}</p>
                }
              </div>
            </CardContent>
          </Card>

          {/* ─── Work Experience ─── */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="border-l-4 border-primary pl-3 text-lg font-semibold text-foreground">{t('profile_work_exp')}</h2>
              {experiences.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.company}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingExpId(String(idx))
                        setExpForm({ title: item.title ?? '', company: item.company ?? '', startMonth: '', startYear: '', endMonth: '', endYear: '', isCurrent: false, achievements: [] })
                      }}>{t('profile_edit_btn')}</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteExp(idx)}>{t('profile_delete_btn')}</Button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="grid gap-2 md:grid-cols-2">
                <Input value={expForm.title}   onChange={(e) => setExpForm((p) => ({ ...p, title:   e.target.value }))} placeholder={t('profile_job_position')} />
                <Input value={expForm.company} onChange={(e) => setExpForm((p) => ({ ...p, company: e.target.value }))} placeholder={t('profile_company')} />
              </div>
              <DateRangeRow
                startMonth={expForm.startMonth} startYear={expForm.startYear}
                endMonth={expForm.endMonth}     endYear={expForm.endYear}
                isCurrent={expForm.isCurrent}
                onStartMonth={(v) => setExpForm((p) => ({ ...p, startMonth: v }))}
                onStartYear={(v)  => setExpForm((p) => ({ ...p, startYear:  v }))}
                onEndMonth={(v)   => setExpForm((p) => ({ ...p, endMonth:   v }))}
                onEndYear={(v)    => setExpForm((p) => ({ ...p, endYear:    v }))}
                onCurrentChange={(v) => setExpForm((p) => ({ ...p, isCurrent: v, endMonth: '', endYear: '' }))}
                lang={lang}
                startLabel={t('profile_start')} endLabel={t('profile_end')} currentLabel={t('profile_current')}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={updateCandidateMutation.isPending} onClick={handleSaveExp}>
                  {editingExpId ? t('profile_save_exp') : t('profile_add_exp')}
                </Button>
                {editingExpId && <Button variant="ghost" size="sm" onClick={resetExpForm}>{t('profile_cancel')}</Button>}
              </div>
            </CardContent>
          </Card>

          {/* ─── Education ─── */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="border-l-4 border-primary pl-3 text-lg font-semibold text-foreground">{t('profile_education')}</h2>
              {educations.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
                  <div>
                    <p className="font-semibold text-foreground">{item.institution}</p>
                    <p className="text-sm text-muted-foreground">{item.degree}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setEditingEduId(String(idx))
                      setEduForm({ school: item.institution ?? '', degree: item.degree ?? '', startMonth: '', startYear: '', endMonth: '', endYear: '', isCurrent: false })
                    }}>{t('profile_edit_btn')}</Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteEdu(idx)}>{t('profile_delete_btn')}</Button>
                  </div>
                </div>
              ))}
              <div className="grid gap-2 md:grid-cols-2">
                <Input value={eduForm.school} onChange={(e) => setEduForm((p) => ({ ...p, school: e.target.value }))} placeholder={t('profile_school')} />
                <Input value={eduForm.degree} onChange={(e) => setEduForm((p) => ({ ...p, degree: e.target.value }))} placeholder={t('profile_degree')} />
              </div>
              <DateRangeRow
                startMonth={eduForm.startMonth} startYear={eduForm.startYear}
                endMonth={eduForm.endMonth}     endYear={eduForm.endYear}
                isCurrent={eduForm.isCurrent}
                onStartMonth={(v) => setEduForm((p) => ({ ...p, startMonth: v }))}
                onStartYear={(v)  => setEduForm((p) => ({ ...p, startYear:  v }))}
                onEndMonth={(v)   => setEduForm((p) => ({ ...p, endMonth:   v }))}
                onEndYear={(v)    => setEduForm((p) => ({ ...p, endYear:    v }))}
                onCurrentChange={(v) => setEduForm((p) => ({ ...p, isCurrent: v, endMonth: '', endYear: '' }))}
                lang={lang}
                startLabel={t('profile_start')} endLabel={t('profile_end')} currentLabel={t('profile_current')}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={updateCandidateMutation.isPending} onClick={handleSaveEdu}>
                  {editingEduId ? t('profile_save_edu') : t('profile_add_edu')}
                </Button>
                {editingEduId && <Button variant="ghost" size="sm" onClick={resetEduForm}>{t('profile_cancel')}</Button>}
              </div>
            </CardContent>
          </Card>

          {/* ─── Certifications ─── */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="border-l-4 border-primary pl-3 text-lg font-semibold text-foreground">{t('profile_certifications')}</h2>
              {certifications.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
                  <div>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.issuer}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setEditingCertId(String(idx))
                      setCertForm({ name: item.name ?? '', issuer: item.issuer ?? '', issueMonth: '', issueYear: '', credentialUrl: item.credentialUrl ?? '' })
                    }}>{t('profile_edit_btn')}</Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteCert(idx)}>{t('profile_delete_btn')}</Button>
                  </div>
                </div>
              ))}
              <div className="grid gap-2 md:grid-cols-2">
                <Input value={certForm.name}          onChange={(e) => setCertForm((p) => ({ ...p, name:          e.target.value }))} placeholder={t('profile_cert_name')} />
                <Input value={certForm.issuer}         onChange={(e) => setCertForm((p) => ({ ...p, issuer:        e.target.value }))} placeholder={t('profile_cert_issuer')} />
                <Input value={certForm.credentialUrl} onChange={(e) => setCertForm((p) => ({ ...p, credentialUrl: e.target.value }))} placeholder={t('profile_cert_url')} className="md:col-span-2" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{t('profile_cert_issue_date')}</p>
                <div className="grid grid-cols-2 gap-2 md:w-1/2">
                  <MonthSelect value={certForm.issueMonth} onChange={(v) => setCertForm((p) => ({ ...p, issueMonth: v }))} lang={lang} />
                  <YearSelect  value={certForm.issueYear}  onChange={(v) => setCertForm((p) => ({ ...p, issueYear:  v }))} lang={lang} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={updateCandidateMutation.isPending} onClick={handleSaveCert}>
                  {editingCertId ? t('profile_save_cert') : t('profile_add_cert')}
                </Button>
                {editingCertId && <Button variant="ghost" size="sm" onClick={resetCertForm}>{t('profile_cancel')}</Button>}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
