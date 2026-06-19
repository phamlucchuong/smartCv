import { createFileRoute } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import {
  getGetServicePackagesQueryKey,
  useCreateServicePackage,
  useDeleteServicePackage,
  useGetServicePackages,
  useUpdateServicePackage,
  type ServicePackageResponse,
  type ServicePackageUpsertRequest,
} from '@smart-cv/api'
import { toast } from 'sonner'
import { Briefcase, Check, Cpu, Edit3, FileText, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/admin/packages')({ component: PackagesPage })

type PackageFormState = {
  name: string
  price: string
  aiCredits: string
  jobLimit: string
  cvLimit: string
  features: string[]
  featured: boolean
  unlimitedJobs: boolean
  unlimitedCvs: boolean
}

const INITIAL_FORM: PackageFormState = {
  name: '',
  price: '0',
  aiCredits: '0',
  jobLimit: '0',
  cvLimit: '0',
  features: [],
  featured: false,
  unlimitedJobs: false,
  unlimitedCvs: false,
}

function PackagesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [editingPkg, setEditingPkg] = useState<ServicePackageResponse | null>(null)
  const [deletingPkg, setDeletingPkg] = useState<ServicePackageResponse | null>(null)
  const [form, setForm] = useState<PackageFormState>(INITIAL_FORM)
  const [newFeature, setNewFeature] = useState('')

  const packagesQuery = useGetServicePackages()
  const packages = packagesQuery.data?.data ?? []

  const invalidatePackages = () => queryClient.invalidateQueries({ queryKey: getGetServicePackagesQueryKey() })

  const createMutation = useCreateServicePackage({
    mutation: {
      mutationKey: ['service-packages', 'create'],
      onSuccess: (response) => {
        toast.success(response.message ?? 'Đã tạo gói dịch vụ')
        setEditingPkg(null)
        setForm(INITIAL_FORM)
        void invalidatePackages()
      },
      onError: () => toast.error('Không thể tạo gói dịch vụ'),
    },
  })

  const updateMutation = useUpdateServicePackage({
    mutation: {
      mutationKey: ['service-packages', 'update'],
      onSuccess: (response) => {
        toast.success(response.message ?? 'Đã cập nhật gói dịch vụ')
        setEditingPkg(null)
        setForm(INITIAL_FORM)
        void invalidatePackages()
      },
      onError: () => toast.error('Không thể cập nhật gói dịch vụ'),
    },
  })

  const deleteMutation = useDeleteServicePackage({
    mutation: {
      mutationKey: ['service-packages', 'delete'],
      onSuccess: (response) => {
        toast.success(response.message ?? 'Đã xóa gói dịch vụ')
        setEditingPkg(null)
        setDeletingPkg(null)
        setForm(INITIAL_FORM)
        void invalidatePackages()
      },
      onError: () => toast.error('Không thể xóa gói dịch vụ'),
    },
  })
  const isSaving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  const openCreateDialog = () => {
    setEditingPkg({
      id: undefined,
      name: '',
      price: 0,
      aiCredits: 0,
      jobLimit: 0,
      cvLimit: 0,
      featured: false,
      features: [],
    })
    setForm(INITIAL_FORM)
    setNewFeature('')
  }

  const openEditDialog = (pkg: ServicePackageResponse) => {
    setEditingPkg(pkg)
    setForm({
      name: pkg.name ?? '',
      price: String(pkg.price ?? 0),
      aiCredits: String(pkg.aiCredits ?? 0),
      jobLimit: pkg.jobLimit === -1 ? '' : String(pkg.jobLimit ?? 0),
      cvLimit: pkg.cvLimit === -1 ? '' : String(pkg.cvLimit ?? 0),
      features: pkg.features ?? [],
      featured: pkg.featured ?? false,
      unlimitedJobs: pkg.jobLimit === -1,
      unlimitedCvs: pkg.cvLimit === -1,
    })
    setNewFeature('')
  }

  const closeDialog = () => {
    setEditingPkg(null)
    setForm(INITIAL_FORM)
    setNewFeature('')
  }

  const updateForm = <K extends keyof PackageFormState>(key: K, value: PackageFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleAddFeature = () => {
    const trimmed = newFeature.trim()
    if (!trimmed) return
    if (form.features.includes(trimmed)) {
      toast.error('Tính năng này đã tồn tại')
      return
    }
    updateForm('features', [...form.features, trimmed])
    setNewFeature('')
  }

  const handleRemoveFeature = (index: number) => {
    updateForm('features', form.features.filter((_, i) => i !== index))
  }

  const buildPayload = (): ServicePackageUpsertRequest | null => {
    const name = form.name.trim()
    const price = Number(form.price)
    const aiCredits = Number(form.aiCredits)
    const jobLimit = form.unlimitedJobs ? -1 : Number(form.jobLimit)
    const cvLimit = form.unlimitedCvs ? -1 : Number(form.cvLimit)
    const features = form.features
      .map((item) => item.trim())
      .filter(Boolean)

    if (!name) {
      toast.error('Tên gói dịch vụ là bắt buộc')
      return null
    }

    if ([price, aiCredits, jobLimit, cvLimit].some((value) => Number.isNaN(value))) {
      toast.error('Vui lòng nhập đầy đủ cấu hình số')
      return null
    }

    if (price < 0 || aiCredits < 0 || jobLimit < -1 || cvLimit < -1) {
      toast.error('Giới hạn gói dịch vụ không hợp lệ')
      return null
    }

    return {
      name,
      price,
      aiCredits,
      jobLimit,
      cvLimit,
      featured: form.featured,
      features,
    }
  }

  const handleSave = () => {
    if (!editingPkg) return
    const payload = buildPayload()
    if (!payload) return

    if (editingPkg.id) {
      updateMutation.mutate({ packageId: editingPkg.id, data: payload })
      return
    }

    createMutation.mutate(payload)
  }

  const handleDelete = (pkg: ServicePackageResponse) => {
    setDeletingPkg(pkg)
  }

  const handleConfirmDelete = () => {
    if (!deletingPkg?.id) return
    deleteMutation.mutate(deletingPkg.id)
  }

  const formatPrice = (value: number) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('admin_packages_title')}</h1>
        <Button className="cursor-pointer" onClick={openCreateDialog}>
          <Plus className="mr-2 size-4" />
          Tạo gói mới
        </Button>
      </div>

      {packagesQuery.isLoading ? (
        <div className="card-surface flex min-h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : packagesQuery.isError ? (
        <div className="card-surface flex min-h-64 items-center justify-center text-sm text-muted-foreground">
          Không thể tải danh sách gói dịch vụ.
        </div>
      ) : packages.length === 0 ? (
        <div className="card-surface flex min-h-64 flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">Chưa có gói dịch vụ nào. Tạo gói đầu tiên để bắt đầu cấu hình.</p>
          <Button variant="outline" onClick={openCreateDialog}>Tạo gói</Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {packages.map((pkg) => {
            const visualKey = (pkg.id ?? pkg.name ?? '').toLowerCase()
            const isPlus = visualKey === 'plus'
            const isPro = visualKey === 'pro'

            return (
              <div
                key={pkg.id ?? pkg.name}
                className={cn(
                  'relative card-surface flex flex-col justify-between p-6 transition-all duration-300 hover:shadow-lg',
                  isPlus && 'border-primary/40 bg-gradient-to-b from-primary/5 to-card ring-2 ring-primary/10 shadow-md',
                  isPro && 'border-indigo-500/30 bg-gradient-to-b from-indigo-500/5 to-card',
                )}
              >
                {pkg.featured && (
                  <span className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground shadow-sm">
                    <Sparkles className="size-3" />
                    {t('admin_most_popular') || 'Phổ biến nhất'}
                  </span>
                )}

                <div>
                  <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
                    <h2 className={cn('text-xl font-bold', isPro && 'text-indigo-600 dark:text-indigo-400')}>
                      {pkg.name}
                    </h2>
                  </div>

                  <div className="mt-4 text-3xl font-extrabold text-foreground">
                    {formatPrice(pkg.price ?? 0)}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">/tháng</span>
                  </div>

                  <div className="mt-6 space-y-3.5 border-y border-border/55 py-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Briefcase className="size-4" />
                      </div>
                      <div>
                        <span className="block text-xs text-muted-foreground">Tin đăng giới hạn</span>
                        <span className="font-semibold text-foreground">
                          {pkg.jobLimit === -1 ? 'Không giới hạn' : `${pkg.jobLimit ?? 0} tin tuyển dụng`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Cpu className="size-4" />
                      </div>
                      <div>
                        <span className="block text-xs text-muted-foreground">AI Credits</span>
                        <span className="font-semibold text-foreground">
                          {(pkg.aiCredits ?? 0).toLocaleString('vi-VN')} credits / tháng
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="size-4" />
                      </div>
                      <div>
                        <span className="block text-xs text-muted-foreground">Lượt tải lên CV</span>
                        <span className="font-semibold text-foreground">
                          {pkg.cvLimit === -1 ? 'Không giới hạn' : `${(pkg.cvLimit ?? 0).toLocaleString('vi-VN')} CVs`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <ul className="mt-5 space-y-2.5">
                    {(pkg.features ?? []).map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2">
                  <Button
                    className="cursor-pointer"
                    variant="default"
                    onClick={() => openEditDialog(pkg)}
                  >
                    <Edit3 className="mr-2 size-3.5" />
                    {t('admin_edit_plan') || 'Chỉnh sửa gói'}
                  </Button>
                  <Button
                    className="cursor-pointer border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                    variant="outline"
                    onClick={() => handleDelete(pkg)}
                  >
                    <Trash2 className="mr-2 size-3.5" />
                    Xóa gói
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={!!editingPkg} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-6">
          <DialogHeader className="shrink-0 pb-2">
            <DialogTitle>
              {editingPkg?.id ? `Chỉnh sửa cấu hình gói ${editingPkg.name}` : 'Tạo gói dịch vụ mới'}
            </DialogTitle>
            <DialogDescription>
              Thay đổi định mức chi phí, số lượng tin đăng và giới hạn tài nguyên của gói.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 py-2 space-y-4 min-h-0">
            <div>
              <Label htmlFor="pkg-name">Tên gói dịch vụ</Label>
              <Input
                id="pkg-name"
                type="text"
                className="mt-1.5"
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                placeholder="Ví dụ: Enterprise, Basic..."
              />
            </div>

            <div>
              <Label htmlFor="pkg-price">Giá tiền (VND / tháng)</Label>
              <Input
                id="pkg-price"
                type="number"
                className="mt-1.5"
                value={form.price}
                onChange={(event) => updateForm('price', event.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="pkg-ai-credits">AI Credits (mỗi tháng)</Label>
              <Input
                id="pkg-ai-credits"
                type="number"
                className="mt-1.5"
                value={form.aiCredits}
                onChange={(event) => updateForm('aiCredits', event.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pkg-jobs">Số lượng tin đăng tuyển</Label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="unlimited-jobs"
                    checked={form.unlimitedJobs}
                    onChange={(event) => updateForm('unlimitedJobs', event.target.checked)}
                    className="size-3.5 cursor-pointer rounded border-input"
                  />
                  <Label htmlFor="unlimited-jobs" className="cursor-pointer select-none text-xs font-normal">
                    Không giới hạn
                  </Label>
                </div>
              </div>
              {!form.unlimitedJobs && (
                <Input
                  id="pkg-jobs"
                  type="number"
                  className="mt-1.5"
                  value={form.jobLimit}
                  onChange={(event) => updateForm('jobLimit', event.target.value)}
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pkg-cvs">Số lượng CV tối đa</Label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="unlimited-cvs"
                    checked={form.unlimitedCvs}
                    onChange={(event) => updateForm('unlimitedCvs', event.target.checked)}
                    className="size-3.5 cursor-pointer rounded border-input"
                  />
                  <Label htmlFor="unlimited-cvs" className="cursor-pointer select-none text-xs font-normal">
                    Không giới hạn
                  </Label>
                </div>
              </div>
              {!form.unlimitedCvs && (
                <Input
                  id="pkg-cvs"
                  type="number"
                  className="mt-1.5"
                  value={form.cvLimit}
                  onChange={(event) => updateForm('cvLimit', event.target.value)}
                />
              )}
            </div>

            <div>
              <Label>Tính năng bổ sung</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  id="new-feature-input"
                  placeholder="Ví dụ: Hỗ trợ ưu tiên"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddFeature()
                    }
                  }}
                />
                <Button type="button" onClick={handleAddFeature}>Thêm</Button>
              </div>
              <ul className="mt-2 max-h-36 overflow-y-auto space-y-1 rounded-md border border-input p-2 bg-muted/30">
                {form.features.length === 0 ? (
                  <span className="text-xs text-muted-foreground block text-center py-2">Chưa có tính năng nào</span>
                ) : (
                  form.features.map((feature, index) => (
                    <li key={index} className="flex items-center justify-between gap-2 rounded bg-background p-1.5 text-xs border border-border">
                      <span className="truncate flex-1">{feature}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="text-destructive hover:text-destructive/80 shrink-0 p-1"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="pkg-featured"
                checked={form.featured}
                onChange={(event) => updateForm('featured', event.target.checked)}
                className="size-4 cursor-pointer rounded border-input text-primary focus:ring-primary/20"
              />
              <Label htmlFor="pkg-featured" className="cursor-pointer select-none text-sm font-semibold">
                Đặt làm gói nổi bật (Phổ biến nhất)
              </Label>
            </div>
          </div>

          <DialogFooter className="shrink-0 pt-4 border-t border-border gap-2">
            <Button variant="outline" onClick={closeDialog}>Hủy</Button>
            <Button disabled={createMutation.isPending || updateMutation.isPending || isSaving} onClick={handleSave}>
              {(createMutation.isPending || updateMutation.isPending)
                ? <Loader2 className="mr-2 size-4 animate-spin" />
                : null}
              {editingPkg?.id ? 'Lưu thay đổi' : 'Tạo gói'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingPkg} onOpenChange={(open) => !open && setDeletingPkg(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa gói dịch vụ</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa gói dịch vụ <span className="font-bold text-foreground">"{deletingPkg?.name}"</span> không? Hành động này không thể hoàn tác và sẽ xóa gói vĩnh viễn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeletingPkg(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
              Xóa gói
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
