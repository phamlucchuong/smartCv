import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle } from '@smart-cv/ui';
import { toast } from 'sonner';

import { Clock, ClipboardCheck, ChevronDown, ChevronLeft, History, Plus, Sparkles, Trash2, Upload, Download, HelpCircle } from 'lucide-react'
import { useTranslation } from '@smart-cv/i18n'
import {
  useGetMyAssessments,
  useGetAssessment,
  useGetAttemptState,
  useSaveAnswers,
  useStartAttempt,
  useSubmitAttempt,
  useGetResult,
  ApplicationModels,
  useSubmitAttemptWithFlag,
  useCreateSelfAssessment,
  useGetMySelfAssessments,
  useDeleteAssessment,
  useDeleteAttempt,
  parseAssessmentFile,
  downloadAssessmentTemplate,
} from '@smart-cv/api'
import { useAuthStore } from '../../store/useAuthStore'

type AssessmentsSearch = {
  take?: string
}

export const Route = createFileRoute('/_account/assessments')({
  validateSearch: (search: Record<string, unknown>): AssessmentsSearch => ({
    take: typeof search.take === 'string' ? search.take : undefined,
  }),
  component: AssessmentsPage,
})

type AttemptStateResponse = ApplicationModels.AttemptStateResponse
type AssessmentResponse = ApplicationModels.AssessmentResponse
type AttemptAnswer = ApplicationModels.AttemptAnswer
type Question = ApplicationModels.Question
type LocalAnswer = { selectedOptionIndex?: number; textAnswer?: string }

const MCQ = 'MCQ' as const

function formatDate(dateInput?: string | Date): string {
  if (!dateInput) return ''
  if (typeof dateInput === 'string') {
    const cleanStr = dateInput.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      const [year, month, day] = cleanStr.split('-')
      return `${day}/${month}/${year}`
    }
    if (cleanStr.includes('T')) {
      const datePart = cleanStr.split('T')[0]
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        const [year, month, day] = datePart.split('-')
        return `${day}/${month}/${year}`
      }
    }
  }
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

type AssessmentStatusFilter = 'all' | 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED'

const statusStyle: Record<string, string> = {
  NOT_STARTED: 'bg-muted text-muted-foreground border border-border',
  IN_PROGRESS: 'bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/20',
  SUBMITTED: 'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/20',
  EXPIRED: 'bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/20',
}

function getStatusLabel(t: (k: string) => string, key: string) {
  switch (key) {
    case 'NOT_STARTED': return t('assessments_status_not_started')
    case 'IN_PROGRESS': return t('assessments_status_in_progress')
    case 'SUBMITTED': return t('assessments_status_submitted')
    case 'EXPIRED': return t('assessments_status_expired')
    default: return key
  }
}

function getFilterLabel(t: (k: string) => string, key: AssessmentStatusFilter) {
  switch (key) {
    case 'all': return t('assessments_filter_all')
    case 'NOT_STARTED': return t('assessments_filter_not_started')
    case 'IN_PROGRESS': return t('assessments_status_in_progress')
    case 'SUBMITTED': return t('assessments_filter_submitted')
    case 'EXPIRED': return t('assessments_filter_expired')
  }
}

const generateMockQuestions = (jobName: string, _difficulty: string, _level: string, num: number) => {
  const name = jobName.toLowerCase()
  let bank: Array<{ text: string; options: string[]; correctOptionIndex: number }> = []

  if (name.includes('java')) {
    bank = [
      {
        text: 'Sự khác biệt chính giữa interface và abstract class trong Java là gì?',
        options: [
          'Interface chỉ chứa method không có body, abstract class có thể có cả hai',
          'Interface hỗ trợ đa kế thừa, abstract class thì không',
          'Cả hai câu trên đều đúng',
          'Cả hai câu trên đều sai',
        ],
        correctOptionIndex: 2,
      },
      {
        text: 'Sự khác biệt giữa HashMap và ConcurrentHashMap trong Java là gì?',
        options: [
          'ConcurrentHashMap thread-safe tốt hơn HashMap nhờ chia nhóm lock (segment lock)',
          'HashMap nhanh hơn nhưng không an toàn trong môi trường đa luồng',
          'ConcurrentHashMap không cho phép khóa null làm key hoặc value',
          'Tất cả các phương án trên đều đúng',
        ],
        correctOptionIndex: 3,
      },
      {
        text: 'Lớp String trong Java là Immutable (không thể thay đổi). Lợi ích chính của việc này là gì?',
        options: [
          'Tối ưu hóa bộ nhớ thông qua String Pool',
          'An toàn luồng (Thread-safety) mà không cần đồng bộ hóa',
          'Tăng tính bảo mật khi dùng String làm tham số kết nối DB hoặc Network',
          'Tất cả các phương án trên đều đúng',
        ],
        correctOptionIndex: 3,
      },
      {
        text: 'Từ khóa transient trong Java dùng để làm gì?',
        options: [
          'Ngăn chặn một trường (field) không bị tuần tự hóa (serialized)',
          'Đánh dấu một phương thức chạy bất đồng bộ',
          'Đảm bảo biến được đọc trực tiếp từ bộ nhớ RAM thay vì cache của Thread',
          'Không có câu nào đúng',
        ],
        correctOptionIndex: 0,
      },
      {
        text: 'Phương thức finalize() trong Java được gọi khi nào?',
        options: [
          'Ngay trước khi đối tượng bị thu hồi bởi Garbage Collector',
          'Khi chương trình kết thúc thực thi',
          'Khi kết thúc khối lệnh try-catch-finally',
          'Không còn được khuyến nghị sử dụng từ Java 9 trở đi',
        ],
        correctOptionIndex: 0,
      },
      {
        text: 'Sự khác biệt giữa Exception và Error trong Java là gì?',
        options: [
          'Exception có thể bắt và xử lý được, Error biểu thị lỗi nghiêm trọng của hệ thống không nên bắt',
          'Exception là RuntimeException, Error là CompileException',
          'Cả hai đều kế thừa trực tiếp từ Object',
          'Không có sự khác biệt',
        ],
        correctOptionIndex: 0,
      }
    ]
  } else if (name.includes('react') || name.includes('frontend') || name.includes('javascript') || name.includes('js')) {
    bank = [
      {
        text: 'React Virtual DOM hoạt động theo nguyên lý nào để tăng hiệu năng?',
        options: [
          'So sánh sự khác biệt (diffing) giữa Virtual DOM mới và cũ, sau đó chỉ cập nhật những thay đổi thực tế lên Real DOM',
          'Xóa toàn bộ Real DOM và render lại từ đầu',
          'Chuyển đổi code React thành WebAssembly để chạy nhanh hơn',
          'Không cập nhật DOM trực tiếp mà chạy qua một luồng background worker',
        ],
        correctOptionIndex: 0,
      },
      {
        text: 'Hook useEffect và useLayoutEffect trong React khác nhau ở điểm nào?',
        options: [
          'useLayoutEffect chạy đồng bộ ngay sau khi DOM đột biến nhưng trước khi trình duyệt vẽ (paint) lên màn hình',
          'useEffect chạy bất đồng bộ sau khi màn hình đã được vẽ',
          'Cả hai câu trên đều đúng',
          'Cả hai Hook hoàn toàn giống nhau',
        ],
        correctOptionIndex: 2,
      },
      {
        text: 'Trong Javascript, sự khác biệt giữa "==" và "===" là gì?',
        options: [
          '"==" so sánh giá trị sau khi ép kiểu, "===" so sánh cả giá trị và kiểu dữ liệu không ép kiểu',
          '"==" so sánh địa chỉ bộ nhớ, "===" so sánh nội dung đối tượng',
          '"===" chỉ dùng cho kiểu dữ liệu String',
          'Không có câu nào đúng',
        ],
        correctOptionIndex: 0,
      },
      {
        text: 'React.memo và useMemo khác nhau như thế nào?',
        options: [
          'React.memo là HOC để memoize component tránh re-render, useMemo là Hook để memoize giá trị tính toán bên trong component',
          'React.memo là Hook, useMemo là HOC',
          'Cả hai đều dùng để lưu trữ cache dữ liệu API',
          'Không có sự khác biệt',
        ],
        correctOptionIndex: 0,
      },
      {
        text: 'Closure trong Javascript là gì?',
        options: [
          'Một hàm có khả năng ghi nhớ và truy cập các biến từ phạm vi bên ngoài của nó, ngay cả sau khi hàm bên ngoài đã thực thi xong',
          'Một phương thức để đóng kết nối database',
          'Một tính năng bảo mật ngăn chặn truy cập mã nguồn',
          'Không có câu nào đúng',
        ],
        correctOptionIndex: 0,
      },
      {
        text: 'Lợi ích chính của SSR (Server-Side Rendering) trong Next.js là gì?',
        options: [
          'Tối ưu hóa SEO tốt hơn và thời gian tải trang đầu tiên (FCP) nhanh hơn',
          'Giảm tải hoàn toàn việc tính toán cho phía server',
          'Không cần viết API backend',
          'Chạy offline không cần kết nối mạng',
        ],
        correctOptionIndex: 0,
      }
    ]
  } else if (name.includes('python')) {
    bank = [
      {
        text: 'Trong Python, sự khác biệt chính giữa List và Tuple là gì?',
        options: [
          'List có thể thay đổi (mutable), Tuple không thể thay đổi (immutable)',
          'List nhanh hơn Tuple',
          'Tuple sử dụng nhiều bộ nhớ hơn List',
          'Không có câu nào đúng',
        ],
        correctOptionIndex: 0,
      },
      {
        text: 'GIL (Global Interpreter Lock) trong CPython hoạt động như thế nào?',
        options: [
          'Chỉ cho phép một luồng (thread) thực thi mã Python tại một thời điểm, làm hạn chế hiệu năng đa luồng trên CPU nhiều nhân',
          'Đồng bộ hóa tất cả các truy vấn Database',
          'Khóa bộ nhớ RAM để tăng tốc độ chạy vòng lặp',
          'Không có câu nào đúng',
        ],
        correctOptionIndex: 0,
      },
      {
        text: 'Decorator trong Python dùng để làm gì?',
        options: [
          'Thay đổi hoặc mở rộng hành vi của một hàm hoặc lớp mà không cần sửa đổi trực tiếp mã nguồn của nó',
          'Trang trí giao diện đồ họa cho ứng dụng',
          'Tự động định dạng code theo chuẩn PEP 8',
          'Tất cả các phương án trên',
        ],
        correctOptionIndex: 0,
      },
      {
        text: 'Sự khác biệt giữa method __init__ và __new__ trong Python là gì?',
        options: [
          '__new__ chịu trách nhiệm tạo ra thực thể (instance) mới, __init__ chịu trách nhiệm khởi tạo các thuộc tính cho thực thể đó',
          '__init__ chạy trước __new__',
          '__new__ chỉ dùng cho các class kế thừa từ dict',
          'Không có sự khác biệt',
        ],
        correctOptionIndex: 0,
      }
    ]
  } else {
    // General tech / Database / DevOps
    bank = [
      {
        text: 'Sự khác biệt cơ bản nhất giữa hệ quản trị cơ sở dữ liệu SQL và NoSQL là gì?',
        options: [
          'SQL lưu dưới dạng bảng có cấu trúc chặt chẽ, NoSQL lưu trữ phi cấu trúc (key-value, document, graph)',
          'SQL luôn nhanh hơn NoSQL trong mọi trường hợp',
          'NoSQL không hỗ trợ giao dịch (transactions)',
          'Không có câu nào đúng',
        ],
        correctOptionIndex: 0,
      },
      {
        text: 'Docker Container và Docker Image khác nhau như thế nào?',
        options: [
          'Docker Image là một bản đóng gói tĩnh (chỉ đọc), Docker Container là một thực thể chạy động được tạo ra từ Image',
          'Docker Image chạy nhanh hơn Docker Container',
          'Docker Container là file cấu hình, Docker Image là file thực thi',
          'Cả hai hoàn toàn giống nhau',
        ],
        correctOptionIndex: 0,
      },
      {
        text: 'Nguyên lý thiết kế RESTful API là gì?',
        options: [
          'Sử dụng các phương thức HTTP (GET, POST, PUT, DELETE) rõ ràng tương ứng với các thao tác dữ liệu',
          'Không trạng thái (Stateless)',
          'Giao tiếp dựa trên tài nguyên (Resources) qua URI',
          'Tất cả các phương án trên đều đúng',
        ],
        correctOptionIndex: 3,
      },
      {
        text: 'CI/CD (Continuous Integration / Continuous Deployment) mang lại giá trị cốt lõi nào?',
        options: [
          'Tự động hóa quy trình kiểm thử, build và triển khai phần mềm liên tục, giảm thiểu lỗi thủ công',
          'Tăng tốc độ xử lý của server chạy production',
          'Thay thế lập trình viên viết code',
          'Tự động sinh tài liệu thiết kế hệ thống',
        ],
        correctOptionIndex: 0,
      },
      {
        text: 'Trong Database, việc tạo Index (chỉ mục) mang lại tác dụng và đánh đổi gì?',
        options: [
          'Tăng tốc độ đọc dữ liệu (SELECT) nhưng làm chậm tốc độ ghi/sửa (INSERT, UPDATE, DELETE) và tốn không gian bộ nhớ',
          'Tăng tốc độ ghi dữ liệu và giảm dung lượng database',
          'Chỉ có tác dụng với các bảng chứa khóa ngoại',
          'Không có sự đánh đổi nào',
        ],
        correctOptionIndex: 0,
      }
    ]
  }

  const shuffled = [...bank].sort(() => 0.5 - Math.random())
  const selected = shuffled.slice(0, Math.min(num, shuffled.length))

  return selected.map((q, idx) => ({
    id: `q_ai_${idx}_${Date.now()}`,
    text: q.text,
    type: MCQ,
    options: q.options,
    correctOptionIndex: q.correctOptionIndex,
  }))
}

function isAnswered(q: Question, answers: Record<string, LocalAnswer>): boolean {
  const ans = answers[q.id ?? '']
  if (!ans) return false
  return q.type === MCQ ? ans.selectedOptionIndex !== undefined : !!(ans.textAnswer?.trim())
}

// Fetches assessment title for a single attempt card
function AssessmentCard({
  assessmentId,
  attempts,
  latestAttempt,
  onTake,
  onTitleLoaded,
  onRetake,
  isRetaking,
  onViewHistory,
  isSelfCreated,
  onDelete,
  onUnsave,
}: {
  assessmentId: string
  attempts: AttemptStateResponse[]
  latestAttempt: AttemptStateResponse
  onTake: (assessmentId: string, attemptId: string) => void
  onTitleLoaded: (assessmentId: string, title: string) => void
  onRetake?: (assessmentId: string) => void
  isRetaking?: boolean
  onViewHistory: (assessmentId: string, title: string) => void
  isSelfCreated?: boolean
  onDelete?: (assessmentId: string) => void
  onUnsave?: (attempts: AttemptStateResponse[]) => void
}) {
  const { t } = useTranslation()
  const { data: assessmentData } = useGetAssessment(assessmentId, {
    query: { enabled: !!assessmentId },
  })
  const title = assessmentData?.data?.title ?? assessmentId
  const itemStatus = String(latestAttempt.status ?? 'NOT_STARTED')

  // Report the loaded title to the parent for search filtering
  React.useEffect(() => {
    if (assessmentData?.data?.title && assessmentId) {
      onTitleLoaded(assessmentId, assessmentData.data.title)
    }
  }, [assessmentData?.data?.title, assessmentId, onTitleLoaded])

  // Determine active attempt (IN_PROGRESS) or NOT_STARTED
  const notStartedAttempt = attempts.find((att) => (att.status as string) === 'NOT_STARTED')

  const isCancelled = React.useMemo(() => {
    if (!latestAttempt.attemptId) return false
    try {
      const cancelled = JSON.parse(localStorage.getItem('cancelledAttempts') || '[]')
      return Array.isArray(cancelled) && cancelled.includes(latestAttempt.attemptId)
    } catch {
      return false
    }
  }, [latestAttempt.attemptId])

  return (
    <div className="card-surface p-5 flex flex-col h-full gap-4">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--ai-soft)] text-[var(--ai)]">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewHistory(assessmentId, title)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer mr-1"
            title="Lịch sử làm bài"
          >
            <History className="h-4 w-4" />
            <span className="font-medium">{attempts.length}</span>
          </button>
          {isCancelled ? (
            <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-red-500/10 text-red-600 border border-red-500/20">
              Hủy giữa chừng
            </span>
          ) : (
            <>
              {itemStatus === 'SUBMITTED' && (
                <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
                  latestAttempt.result === 'PENDING'
                    ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                    : latestAttempt.result === 'PASS'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-600 border border-red-500/20'
                }`}>
                  {latestAttempt.result === 'PENDING' ? 'Chờ chấm' : latestAttempt.score != null ? `${latestAttempt.score.toFixed(0)}%` : '—'}
                </span>
              )}
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[itemStatus] ?? statusStyle['NOT_STARTED']}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                {getStatusLabel(t, itemStatus)}
              </span>
            </>
          )}
        </div>
      </div>

      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Lần làm cuối: {latestAttempt.startedAt ? formatDate(latestAttempt.startedAt) : '—'}
        </p>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {latestAttempt.startedAt ? new Date(latestAttempt.startedAt).toLocaleTimeString() : '—'}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-auto pt-2">
        {attempts.length === 0 || notStartedAttempt ? (
          <Button
            className="flex-1 cursor-pointer"
            onClick={() => onTake(assessmentId, notStartedAttempt?.attemptId ?? '')}
          >
            Bắt đầu làm bài
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRetake?.(assessmentId)}
            disabled={isRetaking}
            className="flex-1 cursor-pointer"
          >
            Làm lại
          </Button>
        )}

        {isSelfCreated ? (
          <button
            type="button"
            onClick={() => onDelete?.(assessmentId)}
            className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer p-2 border border-border rounded-md shrink-0 flex items-center justify-center h-9 w-9"
            title="Xóa bài test"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onUnsave?.(attempts)}
            className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer p-2 border border-border rounded-md shrink-0 flex items-center justify-center h-9 w-9"
            title="Hủy lưu bài test"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

function AssessmentsPage() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuthStore()
  const { take: takeAssessmentId } = Route.useSearch()
  const { data, isLoading, isError } = useGetMyAssessments({ query: { enabled: isAuthenticated } })
  const assessments = data?.data ?? []

  const { data: selfData, isLoading: isSelfLoading, isError: isSelfError } = useGetMySelfAssessments({ query: { enabled: isAuthenticated } })
  const selfAssessments = selfData?.data ?? []

  const combinedLoading = isLoading || isSelfLoading
  const combinedError = isError || isSelfError

  const queryClient = useQueryClient()
  const [taking, setTaking] = React.useState<{ assessmentId: string; attemptId: string } | null>(null)
  const [historyAssessment, setHistoryAssessment] = React.useState<{ assessmentId: string; title: string } | null>(null)

  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [timeLimitMinutes, setTimeLimitMinutes] = React.useState(30)
  const [questions, setQuestions] = React.useState<Question[]>([])

  const [isAiDialogOpen, setIsAiDialogOpen] = React.useState(false)
  const [aiJobName, setAiJobName] = React.useState('')
  const [aiDifficulty, setAiDifficulty] = React.useState('Medium')
  const [aiLevel, setAiLevel] = React.useState('Junior')
  const [aiNumQuestions, setAiNumQuestions] = React.useState(5)
  const [isAiGenerating, setIsAiGenerating] = React.useState(false)

  const importInputRef = React.useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = React.useState(false)

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setIsImporting(true)
    try {
      const result = await parseAssessmentFile(file)
      if (result.questions.length === 0) {
        const reasons = result.skippedRows.map(r => `Dòng ${r.rowNumber}: ${r.reason}`).join(' | ')
        toast.error(`Không tìm thấy câu hỏi hợp lệ.${reasons ? ' ' + reasons : ''}`)
        return
      }
      toast.success(`Đã import ${result.questions.length} câu hỏi`)
      if (result.skippedRows.length > 0) {
        const detail = result.skippedRows.map(r => `Dòng ${r.rowNumber}: ${r.reason}`).join(' | ')
        toast.warning(`Bỏ qua ${result.skippedRows.length} dòng không hợp lệ: ${detail}`)
      }
      setQuestions(result.questions)
      setTitle('')
      setDescription('')
      setTimeLimitMinutes(30)
      setIsFormOpen(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'File không đọc được. Vui lòng dùng file .xlsx hoặc .csv hợp lệ.')
    } finally {
      setIsImporting(false)
    }
  }

  const handleAiConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiJobName.trim()) {
      toast.error('Vui lòng nhập tên công việc')
      return
    }
    setIsAiGenerating(true)
    setTimeout(() => {
      const generated = generateMockQuestions(aiJobName, aiDifficulty, aiLevel, aiNumQuestions)
      setQuestions(generated)
      setTitle(`Bài test ${aiJobName} - Trình độ ${aiLevel}`)
      setDescription(`Bài test tự động tạo bằng AI cho vị trí ${aiJobName} (${aiLevel}) với độ khó ${aiDifficulty}.`)
      setIsAiGenerating(false)
      setIsAiDialogOpen(false)
      toast.success('Đã tạo câu hỏi bằng AI thành công!')
    }, 1200)
  }

  const createMutation = useCreateSelfAssessment({
    mutation: {
      onSuccess: () => {
        toast.success("Tạo bài kiểm tra thành công!")
        queryClient.invalidateQueries({ queryKey: ['/api/assessments/my'] })
        queryClient.invalidateQueries({ queryKey: ['/api/assessments/self'] })
        setIsFormOpen(false)
        setTitle('')
        setDescription('')
        setTimeLimitMinutes(30)
        setQuestions([])
      },
      onError: (err: any) => {
        toast.error(err?.message || "Tạo bài kiểm tra thất bại.")
      },
    },
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên bài test")
      return
    }
    createMutation.mutate({
      data: {
        title,
        description,
        timeLimitMinutes,
        questions,
      }
    })
  }

  const startAttemptMutation = useStartAttempt()
  const submitMutation = useSubmitAttempt()
  const hasAutoStarted = React.useRef(false)

  const handleRetake = (assessmentId: string) => {
    // Find if there is any active IN_PROGRESS attempt for this assessment
    const group = grouped.find((g) => g.assessmentId === assessmentId)
    const activeAttempt = group?.attempts.find((a) => a.status === 'IN_PROGRESS')

    const proceedToStart = () => {
      startAttemptMutation.mutate(
        { id: assessmentId },
        {
          onSuccess: (res: { data?: { attemptId?: string } }) => {
            const attemptId = res?.data?.attemptId ?? ''
            if (attemptId) {
              setTaking({ assessmentId, attemptId })
              queryClient.invalidateQueries({ queryKey: ['/api/assessments/my'] })
            }
          },
        },
      )
    }

    if (activeAttempt?.attemptId) {
      // Submit the active attempt first to finalize it
      submitMutation.mutate(
        { attemptId: activeAttempt.attemptId },
        {
          onSuccess: () => {
            proceedToStart()
          },
          onError: () => {
            // Even if submit fails (e.g. already submitted), try starting
            proceedToStart()
          }
        }
      )
    } else {
      proceedToStart()
    }
  }

  const handleTake = (assessmentId: string, attemptId: string) => {
    if (attemptId) {
      setTaking({ assessmentId, attemptId })
    } else {
      startAttemptMutation.mutate(
        { id: assessmentId },
        {
          onSuccess: (res: { data?: { attemptId?: string } }) => {
            const newAttemptId = res?.data?.attemptId ?? ''
            if (newAttemptId) {
              setTaking({ assessmentId, attemptId: newAttemptId })
              queryClient.invalidateQueries({ queryKey: ['/api/assessments/my'] })
              queryClient.invalidateQueries({ queryKey: ['/api/assessments/self'] })
            }
          },
          onError: (err: any) => {
            toast.error(err?.message || "Không thể bắt đầu làm bài.")
          }
        }
      )
    }
  }

  const deleteMutation = useDeleteAssessment({
    mutation: {
      onSuccess: () => {
        toast.success("Xoá bài kiểm tra thành công!")
        queryClient.invalidateQueries({ queryKey: ['/api/assessments/my'] })
        queryClient.invalidateQueries({ queryKey: ['/api/assessments/self'] })
      },
      onError: (err: any) => {
        toast.error(err?.message || "Xoá bài kiểm tra thất bại.")
      }
    }
  })

  const handleDelete = (assessmentId: string) => {
    if (confirm("Bạn có chắc chắn muốn xoá bài kiểm tra này?")) {
      deleteMutation.mutate({ id: assessmentId })
    }
  }

  const deleteAttemptMutation = useDeleteAttempt({
    mutation: {
      onSuccess: () => {
        toast.success("Hủy lưu bài kiểm tra thành công!")
        queryClient.invalidateQueries({ queryKey: ['/api/assessments/my'] })
        queryClient.invalidateQueries({ queryKey: ['/api/assessments/self'] })
      },
      onError: (err: any) => {
        toast.error(err?.message || "Hủy lưu bài kiểm tra thất bại.")
      }
    }
  })

  const handleUnsave = (attempts: AttemptStateResponse[]) => {
    if (confirm("Bạn có chắc chắn muốn hủy lưu bài kiểm tra này?")) {
      attempts.forEach((att) => {
        if (att.attemptId) {
          deleteAttemptMutation.mutate({ attemptId: att.attemptId })
        }
      })
    }
  }

  React.useEffect(() => {
    if (!takeAssessmentId || hasAutoStarted.current || combinedLoading) return
    const existing = assessments.find(
      (a) => a.assessmentId === takeAssessmentId && a.status === 'IN_PROGRESS',
    )
    if (existing) {
      hasAutoStarted.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTaking({ assessmentId: existing.assessmentId ?? '', attemptId: existing.attemptId ?? '' })
      return
    }
    hasAutoStarted.current = true
    startAttemptMutation.mutate(
      { id: takeAssessmentId },
      {
        onSuccess: (res: { data?: { attemptId?: string } }) => {
          const attemptId = res?.data?.attemptId ?? ''
          if (attemptId) setTaking({ assessmentId: takeAssessmentId, attemptId })
        },
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [takeAssessmentId, assessments, combinedLoading])
  const [query, setQuery] = React.useState('')
  const [status, setStatus] = React.useState<AssessmentStatusFilter>('all')
  const [statusMenuOpen, setStatusMenuOpen] = React.useState(false)
  // Populated by AssessmentCard children once their title queries resolve
  const [titleMap, setTitleMap] = React.useState<Record<string, string>>({})
  const statusMenuRef = React.useRef<HTMLDivElement>(null)

  const registerTitle = React.useCallback((assessmentId: string, title: string) => {
    setTitleMap(prev => (prev[assessmentId] === title ? prev : { ...prev, [assessmentId]: title }))
  }, [])

  React.useEffect(() => {
    document.title = t('page_title_assessments')
  }, [t])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (statusMenuRef.current && !statusMenuRef.current.contains(target)) {
        setStatusMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const grouped = React.useMemo(() => {
    const groups: Record<string, AttemptStateResponse[]> = {}
    assessments.forEach((a) => {
      if (!a.assessmentId) return
      if (!groups[a.assessmentId]) {
        groups[a.assessmentId] = []
      }
      groups[a.assessmentId].push(a)
    })

    selfAssessments.forEach((sa) => {
      if (!sa.id) return
      if (!groups[sa.id]) {
        groups[sa.id] = []
      }
    })

    return Object.entries(groups).map(([assessmentId, groupAttempts]) => {
      // Sort attempts: latest first
      const sorted = [...groupAttempts].sort((x, y) => {
        const dx = x.startedAt ? new Date(x.startedAt).getTime() : 0
        const dy = y.startedAt ? new Date(y.startedAt).getTime() : 0
        return dy - dx
      })
      const latestAttempt = sorted.length > 0 ? sorted[0] : {
        assessmentId,
        status: 'NOT_STARTED' as any,
      }
      return {
        assessmentId,
        attempts: sorted,
        latestAttempt,
      }
    })
  }, [assessments, selfAssessments])

  if (taking) {
    return (
      <TakeAssessment
        assessmentId={taking.assessmentId}
        attemptId={taking.attemptId}
        onClose={() => setTaking(null)}
      />
    )
  }

  if (combinedLoading) return <div className="p-8 text-center text-muted-foreground">Loading assessments...</div>
  if (combinedError) return <div className="p-8 text-center text-destructive">Failed to load assessments.</div>

  const filterOptions: Array<{ key: AssessmentStatusFilter }> = [
    { key: 'all' },
    { key: 'NOT_STARTED' },
    { key: 'IN_PROGRESS' },
    { key: 'SUBMITTED' },
    { key: 'EXPIRED' },
  ]

  const filteredGroups = grouped.filter((group) => {
    const itemStatus = String(group.latestAttempt.status ?? 'NOT_STARTED')
    const byStatus = status === 'all' ? true : itemStatus === status
    const q = query.trim().toLowerCase()
    // Search by loaded title; fall back to assessmentId while title is still loading
    const resolvedTitle = titleMap[group.assessmentId] ?? group.assessmentId
    const byQuery = q === '' ? true : resolvedTitle.toLowerCase().includes(q)
    return byStatus && byQuery
  })

  return (
    <div className="space-y-6">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('assessments_page_title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('assessments_page_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button
            variant="outline"
            onClick={() => importInputRef.current?.click()}
            disabled={isImporting}
            className="gap-2 cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            {isImporting ? 'Đang đọc...' : 'Import Excel'}
          </Button>
          <div className="relative group">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            <div className="absolute right-0 top-10 z-50 hidden group-hover:block w-72 rounded-lg border border-border bg-card p-3 shadow-lg text-xs">
              <p className="font-semibold text-foreground mb-2">Format mỗi dòng Excel/CSV:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong className="text-foreground">Question</strong> — nội dung câu hỏi (bắt buộc)</li>
                <li>• <strong className="text-foreground">Option A, Option B</strong> — bắt buộc với MCQ</li>
                <li>• <strong className="text-foreground">Option C, Option D</strong> — tuỳ chọn</li>
                <li>• <strong className="text-foreground">Correct</strong> — A, B, C hoặc D</li>
                <li>• <strong className="text-foreground">Type</strong> — MCQ (mặc định) hoặc TEXT</li>
              </ul>
            </div>
          </div>
          <button
            type="button"
            onClick={() => downloadAssessmentTemplate()}
            title="Tải file mẫu"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
          </button>
          <Button
            onClick={() => { setTitle(''); setDescription(''); setTimeLimitMinutes(30); setQuestions([]); setIsFormOpen(true) }}
            className="gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Tạo bài test
          </Button>
        </div>
      </header>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('assessments_search_placeholder')}
          className="h-10 max-w-sm"
        />
        <div className="relative" ref={statusMenuRef}>
          <button
            type="button"
            onClick={() => setStatusMenuOpen((v) => !v)}
            className="border-border bg-card/80 text-foreground flex h-10 min-w-44 items-center justify-between rounded-lg border px-3 text-sm shadow-sm"
          >
            {getFilterLabel(t, status)}
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${statusMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {statusMenuOpen && (
            <div className="border-border bg-card absolute left-0 top-11 z-20 w-full rounded-lg border p-1 shadow-lg">
              {filterOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => { setStatus(option.key); setStatusMenuOpen(false) }}
                  className={`w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm ${status === option.key ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'}`}
                >
                  {getFilterLabel(t, option.key)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="card-surface p-8 text-center text-sm text-muted-foreground">{t('account_no_results')}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group) => {
            return (
              <AssessmentCard
                key={group.assessmentId}
                assessmentId={group.assessmentId}
                attempts={group.attempts}
                latestAttempt={group.latestAttempt}
                onTake={handleTake}
                onTitleLoaded={registerTitle}
                onRetake={handleRetake}
                isRetaking={startAttemptMutation.isPending || submitMutation.isPending}
                onViewHistory={(assessmentId, title) => setHistoryAssessment({ assessmentId, title })}
                isSelfCreated={selfAssessments.some((sa) => sa.id === group.assessmentId)}
                onDelete={handleDelete}
                onUnsave={handleUnsave}
              />
            )
          })}
        </div>
      )}

      {historyAssessment && (
        <Dialog open={!!historyAssessment} onOpenChange={(open) => !open && setHistoryAssessment(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                Lịch sử làm bài: {historyAssessment.title}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              {(grouped.find(g => g.assessmentId === historyAssessment.assessmentId)?.attempts ?? []).map((attempt, index, arr) => {
                const itemStatus = String(attempt.status ?? 'NOT_STARTED')
                const isAttemptCancelled = (() => {
                  if (!attempt.attemptId) return false
                  try {
                    const cancelled = JSON.parse(localStorage.getItem('cancelledAttempts') || '[]')
                    return Array.isArray(cancelled) && cancelled.includes(attempt.attemptId)
                  } catch {
                    return false
                  }
                })()
                return (
                  <div key={attempt.attemptId} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span>Lần làm {arr.length - index}</span>
                        {isAttemptCancelled ? (
                          <span className="inline-flex items-center rounded px-1.5 py-0.2 text-[10px] font-semibold bg-red-500/10 text-red-600 border border-red-500/20">
                            Hủy giữa chừng
                          </span>
                        ) : (
                          itemStatus === 'SUBMITTED' && (
                            <span className={`inline-flex items-center rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                              attempt.result === 'PENDING'
                                ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                                : attempt.result === 'PASS'
                                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-600 border border-red-500/20'
                            }`}>
                              {attempt.result === 'PENDING' ? 'Chờ chấm' : attempt.score != null ? `${attempt.score.toFixed(0)}%` : '—'}
                            </span>
                          )
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3">
                        <span>Ngày: {attempt.startedAt ? formatDate(attempt.startedAt) : '—'}</span>
                        <span>Giờ: {attempt.startedAt ? new Date(attempt.startedAt).toLocaleTimeString() : '—'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        isAttemptCancelled
                          ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                          : statusStyle[itemStatus] ?? statusStyle['NOT_STARTED']
                      }`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        {isAttemptCancelled ? 'Hủy giữa chừng' : getStatusLabel(t, itemStatus)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isFormOpen && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto flex flex-col p-6 rounded-lg border border-border shadow-lg">
            <DialogHeader className="flex flex-row justify-between items-center pr-6">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Tạo bài kiểm tra mới
                </DialogTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAiDialogOpen(true)}
                className="gap-1.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" /> Tạo bằng AI
              </Button>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit} className="space-y-4 my-2 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-semibold text-foreground">Tên bài kiểm tra *</label>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Kiểm tra kiến thức Java Core"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-semibold text-foreground">Thời gian (phút) *</label>
                  <Input
                    type="number"
                    required
                    min={1}
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 30)}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-semibold text-foreground">Mô tả ngắn</label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả mục đích bài kiểm tra..."
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold">Danh sách câu hỏi ({questions.length})</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuestions([...questions, {
                      id: `q_${Date.now()}`,
                      text: '',
                      type: 'MCQ',
                      options: ['Lựa chọn 1', 'Lựa chọn 2'],
                      correctOptionIndex: 0
                    }])}
                    className="h-8 text-xs cursor-pointer"
                  >
                    + Thêm câu hỏi
                  </Button>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {questions.map((q, qIndex) => (
                    <div key={q.id || qIndex} className="p-3 border border-border rounded-lg bg-muted/20 space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => setQuestions(questions.filter((_, idx) => idx !== qIndex))}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 cursor-pointer text-xs"
                      >
                        Xóa
                      </button>
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-primary">Câu {qIndex + 1}</span>
                        <Input
                          required
                          value={q.text || ''}
                          onChange={(e) => {
                            const updated = [...questions]
                            updated[qIndex] = { ...q, text: e.target.value }
                            setQuestions(updated)
                          }}
                          placeholder="Nội dung câu hỏi..."
                        />
                      </div>
                      <div className="space-y-2 pl-3 border-l-2 border-primary/20">
                        <span className="text-[11px] font-semibold text-muted-foreground">Đáp án trắc nghiệm</span>
                        <div className="grid gap-2">
                          {q.options?.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`q-${qIndex}-correct`}
                                checked={q.correctOptionIndex === oIdx}
                                onChange={() => {
                                  const updated = [...questions]
                                  updated[qIndex] = { ...q, correctOptionIndex: oIdx }
                                  setQuestions(updated)
                                }}
                                className="cursor-pointer"
                              />
                              <Input
                                required
                                value={opt}
                                onChange={(e) => {
                                  const updated = [...questions]
                                  const opts = [...(q.options || [])]
                                  opts[oIdx] = e.target.value
                                  updated[qIndex] = { ...q, options: opts }
                                  setQuestions(updated)
                                }}
                                className="h-8 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Đang tạo...' : 'Tạo bài test'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {isAiDialogOpen && (
        <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Tạo bài kiểm tra tự động bằng AI
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleAiConfirm} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Tên công việc / Chủ đề *</label>
                <Input
                  required
                  value={aiJobName}
                  onChange={(e) => setAiJobName(e.target.value)}
                  placeholder="Ví dụ: React Developer, Java core..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Trình độ</label>
                  <select
                    value={aiLevel}
                    onChange={(e) => setAiLevel(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none"
                  >
                    <option value="Intern">Intern</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Độ khó</label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none"
                  >
                    <option value="Dễ">Dễ</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Khó">Khó</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Số câu hỏi</label>
                <Input
                  type="number"
                  required
                  min={1}
                  max={20}
                  value={aiNumQuestions}
                  onChange={(e) => setAiNumQuestions(parseInt(e.target.value) || 5)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-4">
                <Button type="button" variant="outline" onClick={() => setIsAiDialogOpen(false)} disabled={isAiGenerating}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isAiGenerating}>
                  {isAiGenerating ? 'Đang tạo bằng AI...' : 'Xác nhận tạo'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Outer shell: waits for assessment + attempt data before mounting TakeAssessmentContent.
// This lets the inner component initialize all state from props without useEffect.
function TakeAssessment({
  assessmentId,
  attemptId,
  onClose,
}: {
  assessmentId: string
  attemptId: string
  onClose: () => void
}) {
  const { data: assessmentData, isLoading: loadingAssessment } = useGetAssessment(assessmentId)
  const { data: attemptData, isLoading: loadingAttempt } = useGetAttemptState(attemptId)

  if (loadingAssessment || loadingAttempt || !assessmentData?.data) {
    return <div className="p-8 text-center text-muted-foreground">Loading assessment...</div>
  }

  return (
    <TakeAssessmentContent
      assessment={assessmentData.data}
      attemptId={attemptId}
      savedAnswers={attemptData?.data?.answers ?? []}
      onClose={onClose}
    />
  )
}

// Inner content: all data available at mount — state is initialized from props.
function TakeAssessmentContent({
  assessment,
  attemptId,
  savedAnswers,
  onClose,
}: {
  assessment: AssessmentResponse
  attemptId: string
  savedAnswers: AttemptAnswer[]
  onClose: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const questions: Question[] = assessment.questions ?? []

  const saveAnswersMutation = useSaveAnswers()
  const submitMutation = useSubmitAttempt()
  const submitWithFlagMutation = useSubmitAttemptWithFlag()
  const { data: resultData, refetch: fetchResult } = useGetResult(attemptId, {
    query: { enabled: false },
  })

  // Initialize from saved answers using lazy useState
  const [answers, setAnswers] = React.useState<Record<string, LocalAnswer>>(() => {
    const init: Record<string, LocalAnswer> = {}
    savedAnswers.forEach((a) => {
      if (a.questionId) {
        init[a.questionId] = {
          selectedOptionIndex: a.selectedOptionIndex,
          textAnswer: a.textAnswer,
        }
      }
    })
    return init
  })

  const [currentQIndex, setCurrentQIndex] = React.useState(0)
  const [showResult, setShowResult] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [confirmExitOpen, setConfirmExitOpen] = React.useState(false)
  const [isCancellingMidway, setIsCancellingMidway] = React.useState(false)

  const handleCancelMidway = () => {
    setIsCancellingMidway(true)
    try {
      const cancelled = JSON.parse(localStorage.getItem('cancelledAttempts') || '[]')
      if (Array.isArray(cancelled) && !cancelled.includes(attemptId)) {
        cancelled.push(attemptId)
        localStorage.setItem('cancelledAttempts', JSON.stringify(cancelled))
      }
    } catch {
      // ignore storage errors
    }
    submitMutation.mutate(
      { attemptId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/assessments/my'] })
          queryClient.invalidateQueries({ queryKey: ['/api/assessments/self'] })
          setIsCancellingMidway(false)
          setConfirmExitOpen(false)
          onClose()
        },
        onError: () => {
          setIsCancellingMidway(false)
          setConfirmExitOpen(false)
          onClose()
        },
      }
    )
  }

  // Initialize timer from assessment data directly (no useEffect needed)
  const [timeLeft, setTimeLeft] = React.useState((assessment.timeLimitMinutes ?? 30) * 60)

  // Update ref in useLayoutEffect so the timer callback always reads current state
  const handleSubmitRef = React.useRef<(overtime?: boolean) => void>(() => {})
  React.useLayoutEffect(() => {
    handleSubmitRef.current = (overtime = false) => {
      if (isSubmitting) return
      setIsSubmitting(true)
      const callbacks = {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/assessments/my'] })
          queryClient.invalidateQueries({ queryKey: ['/api/assessments/self'] })
          setShowResult(true)
          fetchResult()
        },
        onError: () => setIsSubmitting(false),
      }
      if (overtime) {
        submitWithFlagMutation.mutate({ attemptId, overtime: true }, callbacks)
      } else {
        submitMutation.mutate({ attemptId }, callbacks)
      }
    }
  })

  // Countdown — only depends on timeLeft and showResult (no stale-closure issue via ref)
  React.useEffect(() => {
    if (showResult) return
    if (timeLeft <= 0) { handleSubmitRef.current(true); return }
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [timeLeft, showResult])

  const handleAnswerChange = (questionId: string, value: LocalAnswer) => {
    const newAnswers = { ...answers, [questionId]: value }
    setAnswers(newAnswers)
    saveAnswersMutation.mutate({
      attemptId,
      data: {
        answers: Object.entries(newAnswers).map(([qId, ans]) => ({ questionId: qId, ...ans })),
      },
    })
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="card-surface p-10 space-y-4">
          <h2 className="text-xl font-bold">Bài kiểm tra không có câu hỏi</h2>
          <Button onClick={onClose}>{t('btn_back_to_list')}</Button>
        </div>
      </div>
    )
  }

  if (showResult) {
    const result = resultData?.data
    const isPending = result?.result === 'PENDING'
    const isPassed = result?.result === 'PASS'

    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="card-surface p-10 space-y-4">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            isPending
              ? 'bg-yellow-100 text-yellow-600'
              : isPassed
                ? 'bg-[var(--success-soft)] text-[var(--success)]'
                : 'bg-[var(--danger-soft)] text-[var(--danger)]'
          }`}>
            <ClipboardCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold">{t('assessment_completed')}</h2>
          {isPending ? (
            <>
              <p className="text-lg font-semibold text-yellow-600">Đang chờ chấm điểm</p>
              <p className="text-sm text-muted-foreground">{t('assessment_result_pending_desc')}</p>
            </>
          ) : (
            <>
              <p className={`text-5xl font-bold ${isPassed ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                {result?.score ?? '—'}/100
              </p>
              <p className="text-sm text-muted-foreground">
                {isPassed ? t('assessment_passed_desc') : t('assessment_failed_desc')}
              </p>
            </>
          )}
          <Button onClick={onClose}>{t('btn_back_to_list')}</Button>
        </div>
      </div>
    )
  }

  const totalQuestions = questions.length
  const currentQuestion = questions[currentQIndex]
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6">
      {/* Header */}
      <div className="card-surface flex items-center justify-between p-4">
        <button
          onClick={() => setConfirmExitOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('btn_exit')}
        </button>
        <div className="text-sm font-medium text-foreground">{assessment.title}</div>
        <div className={`inline-flex items-center gap-2 font-mono text-lg font-bold px-4 py-1.5 rounded-full border ${
          timeLeft < 120
            ? 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger)]/20 animate-pulse'
            : 'bg-primary/10 text-primary border-primary/20'
        }`}>
          <Clock className="h-4 w-4" />
          {mm}:{ss}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Question map */}
        <div className="card-surface p-5 space-y-4 lg:col-span-1 h-fit">
          <h3 className="font-bold text-sm text-foreground">Bản đồ câu hỏi</h3>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, idx) => {
              const answered = isAnswered(q, answers)
              const active = currentQIndex === idx
              let btnClass = 'border-border text-foreground hover:bg-muted/60'
              if (active) {
                btnClass = 'bg-primary text-white border-primary shadow-sm shadow-primary/25'
              } else if (answered) {
                btnClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold'
              }
              return (
                <button
                  key={q.id ?? idx}
                  onClick={() => setCurrentQIndex(idx)}
                  className={`h-10 rounded-lg border flex items-center justify-center text-sm transition-all font-medium ${btnClass}`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>
          <div className="pt-2 border-t border-border space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-primary border border-primary" />
              <span>Đang chọn</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500/10 border border-emerald-500/20" />
              <span>Đã trả lời</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-transparent border border-border" />
              <span>Chưa trả lời</span>
            </div>
          </div>
          <Button
            className="w-full"
            disabled={isSubmitting}
            onClick={() => handleSubmitRef.current()}
          >
            {isSubmitting ? 'Đang nộp...' : t('btn_submit_assessment')}
          </Button>
        </div>

        {/* Main question panel */}
        <div className="lg:col-span-3 card-surface p-6 space-y-5 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
            <span>{t('assessment_question_count', { current: currentQIndex + 1, total: totalQuestions })}</span>
            <span className="bg-secondary px-2.5 py-0.5 rounded-md border border-border">
              {currentQuestion.type === MCQ ? 'Trắc nghiệm' : 'Tự luận'}
            </span>
          </div>

          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentQIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>

          <h2 className="text-base font-semibold leading-relaxed">{currentQuestion.text}</h2>

          {currentQuestion.type === MCQ && currentQuestion.options && (
            <div className="space-y-2 flex-1">
              {currentQuestion.options.map((opt, i) => (
                <label
                  key={i}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    answers[currentQuestion.id ?? '']?.selectedOptionIndex === i
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    checked={answers[currentQuestion.id ?? '']?.selectedOptionIndex === i}
                    onChange={() => handleAnswerChange(currentQuestion.id ?? '', { selectedOptionIndex: i })}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type !== MCQ && (
            <textarea
              className="w-full flex-1 min-h-[180px] rounded-lg border border-border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Nhập câu trả lời của bạn..."
              value={answers[currentQuestion.id ?? '']?.textAnswer ?? ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id ?? '', { textAnswer: e.target.value })}
            />
          )}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button
              variant="outline"
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex((c) => c - 1)}
            >
              {t('btn_prev_question')}
            </Button>
            <Button
              variant="outline"
              disabled={currentQIndex === totalQuestions - 1}
              onClick={() => setCurrentQIndex((c) => c + 1)}
            >
              {t('btn_next_question')}
            </Button>
          </div>
        </div>
      </div>
      {confirmExitOpen && (
        <Dialog open={confirmExitOpen} onOpenChange={setConfirmExitOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Xác nhận thoát bài làm</DialogTitle>
            </DialogHeader>
            <div className="mt-2 text-sm text-muted-foreground">
              Bạn có chắc chắn muốn thoát? Bài làm của bạn sẽ được nộp tự động và tính là **Hủy giữa chừng**.
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmExitOpen(false)} disabled={isCancellingMidway}>
                Hủy
              </Button>
              <Button variant="destructive" onClick={handleCancelMidway} disabled={isCancellingMidway}>
                {isCancellingMidway ? 'Đang thoát...' : 'Thoát & Hủy'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
