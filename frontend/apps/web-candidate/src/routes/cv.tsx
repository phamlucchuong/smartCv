import { createFileRoute, redirect } from '@tanstack/react-router'
import * as React from 'react'
import { Button } from '@smart-cv/ui'
import { Upload, FileText, Star, Trash2, RefreshCw, Eye, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/cv')({
  beforeLoad: () => {
    if (localStorage.getItem('isAuthenticated') !== 'true') {
      throw redirect({ to: '/signin' })
    }
  },
  component: MyCVPage,
})

type CVStatus = 'Parsed' | 'Processing' | 'Active'

interface CV {
  id: string
  name: string
  type: string
  uploaded: string
  status: CVStatus
  isDefault: boolean
}

const CVS: CV[] = [
  { id: 'cv1', name: 'CV_NguyenMinhAnh_Backend.pdf', type: 'PDF', uploaded: '15/05/2026', status: 'Parsed', isDefault: true },
  { id: 'cv2', name: 'CV_NguyenMinhAnh_Fullstack.docx', type: 'DOC', uploaded: '01/04/2026', status: 'Parsed', isDefault: false },
  { id: 'cv3', name: 'CV_EN_2026.pdf', type: 'PDF', uploaded: '20/03/2026', status: 'Active', isDefault: false },
]

const cvStatusStyle: Record<CVStatus, string> = {
  Parsed: 'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/20',
  Processing: 'bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/20',
  Active: 'bg-muted text-muted-foreground border border-border',
}

const cvStatusLabel: Record<CVStatus, string> = {
  Parsed: 'Đã phân tích',
  Processing: 'Đang xử lý',
  Active: 'Hoạt động',
}

function MyCVPage() {
  const [selected, setSelected] = React.useState(CVS[0].id)
  const [cvList, setCvList] = React.useState(CVS)

  const cv = cvList.find((c) => c.id === selected) ?? cvList[0]

  const setDefault = (id: string) => {
    setCvList((list) => list.map((c) => ({ ...c, isDefault: c.id === id })))
  }

  const deleteCV = (id: string) => {
    const next = cvList.filter((c) => c.id !== id)
    setCvList(next)
    if (selected === id && next.length > 0) setSelected(next[0].id)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">CV của tôi</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tối đa 10 CV • Hỗ trợ PDF, DOCX</p>
      </header>

      {/* Upload area */}
      <div className="card-surface flex flex-col items-center justify-center gap-3 border-2 border-dashed border-primary/20 bg-primary/[0.02] px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Upload className="h-6 w-6" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Kéo thả CV vào đây hoặc bấm để chọn</p>
          <p className="mt-1 text-sm text-muted-foreground">PDF, DOCX • Tối đa 5MB • {cvList.length}/10 CV</p>
        </div>
        <Button variant="outline" className="mt-1">Chọn file</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* CV list */}
        <div className="card-surface h-fit p-3 space-y-1">
          <p className="px-2 py-1 text-sm font-semibold text-foreground">Danh sách CV ({cvList.length})</p>
          {cvList.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                selected === c.id ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--danger-soft)] text-[var(--danger)] text-xs font-bold">
                  {c.type}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.uploaded}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cvStatusStyle[c.status]}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                      {cvStatusLabel[c.status]}
                    </span>
                    {c.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--warning)]">
                        <Star className="h-3 w-3 fill-[var(--warning)]" /> Mặc định
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* CV detail */}
        {cv && (
          <div className="space-y-4">
            <div className="card-surface p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground truncate">{cv.name}</p>
                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="ghost" title="Xem trước"><Eye className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" title="Đặt làm mặc định" onClick={() => setDefault(cv.id)}>
                    <Star className={`h-4 w-4 ${cv.isDefault ? 'fill-[var(--warning)] text-[var(--warning)]' : ''}`} />
                  </Button>
                  <Button size="sm" variant="ghost" title="Phân tích lại"><RefreshCw className="h-4 w-4" /></Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Xóa"
                    disabled={cv.isDefault}
                    onClick={() => deleteCV(cv.id)}
                    className="text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex aspect-[3/4] max-h-72 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted text-muted-foreground">
                <div className="text-center">
                  <FileText className="mx-auto mb-2 h-10 w-10 opacity-30" />
                  <p className="text-sm">Xem trước CV</p>
                </div>
              </div>
            </div>

            <div className="card-surface p-5 space-y-3">
              <h3 className="font-semibold text-foreground">Thông tin trích xuất từ CV</h3>
              <ParsedField label="Họ tên" value="Nguyễn Minh Anh" />
              <ParsedField label="Email" value="minhanh@example.com" />
              <ParsedField label="Vị trí" value="Backend Developer (3 năm)" />
              <ParsedField label="Kỹ năng" value="Java, REST API, MySQL, Git, Spring" />
              <ParsedField label="Học vấn" value="ĐH Bách Khoa TP.HCM (2017–2021)" />
            </div>

            {/* AI insight box */}
            <div className="card-surface ai-gradient border-[var(--ai)]/20 p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ai)]">
                <Sparkles className="h-4 w-4" />
                AI đánh giá chất lượng CV
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Độ hoàn thiện</span>
                <span className="font-semibold text-foreground">82/100</span>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                <li>Thiếu phần <strong className="text-foreground">Certificates</strong> và link GitHub.</li>
                <li>Đề xuất: thêm dự án nổi bật có metric cụ thể.</li>
                <li>Format chuẩn ATS, dễ đọc.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ParsedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 border-b border-border pb-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}
