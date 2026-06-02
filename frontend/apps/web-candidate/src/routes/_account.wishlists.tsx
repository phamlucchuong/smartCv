import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'
import { Badge, Button, Input } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import { Clock3, DollarSign, Heart, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { useCandidateStore } from '../store/useCandidateStore'

export const Route = createFileRoute('/_account/wishlists')({
  component: WishlistsPage,
})

const chips = ['Tất cả', 'Công nghệ', 'Thiết kế', 'Marketing']

function WishlistsPage() {
  const { t } = useTranslation()
  const [selectedChip, setSelectedChip] = React.useState(chips[0])
  const [query, setQuery] = React.useState('')
  const jobs = useCandidateStore((s) => s.wishlistJobs)
  const removeFromWishlist = useCandidateStore((s) => s.removeFromWishlist)

  const filtered = jobs.filter((job) => {
    const q = query.trim().toLowerCase()
    const matchText = q === '' || job.title.toLowerCase().includes(q) || job.company.toLowerCase().includes(q)
    const matchChip = selectedChip === 'Tất cả' || job.category === selectedChip
    return matchText && matchChip
  })

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Danh sách yêu thích</h1>
        <p className="mt-1 text-sm text-muted-foreground">{filtered.length} việc làm đã lưu</p>
      </header>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm trong danh sách..." className="h-10 max-w-sm border-input bg-background" />
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

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-muted-foreground">
          <Heart className="h-12 w-12" />
          <p>{t('account_no_results')}</p>
          <Link to="/"><Button variant="outline">Browse Jobs</Button></Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((job) => (
            <article key={job.id} className="elevate-card card-surface rounded-2xl p-5">
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
                  onClick={() => {
                    removeFromWishlist(job.id)
                    toast.success(t('account_removed_from_wishlist'))
                  }}
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
