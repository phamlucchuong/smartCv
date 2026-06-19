import { createFileRoute, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import { Button, Card, CardContent, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import { Bell, Globe2, Moon, Settings, Shield, Sun, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import {
  useGetSettings, useUpdateNotifications, useUpdatePrivacy,
  useChangeMyPassword, useUpdateUser, useDeleteMyAccount,
  getGetSettingsQueryKey, getGetCurrentUserQueryKey,
  useGetMe2, getGetMe2QueryKey,
  useSendUpdateOtp, useVerifyUpdateOtp,
} from '@smart-cv/api'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/useAuthStore'
import { useCandidatePreferences } from '../store/candidatePreferences'

export const Route = createFileRoute('/_account/settings')({
  component: SettingsPage,
})

type SectionKey = 'account' | 'notifications' | 'privacy' | 'preferences' | 'danger'

function SettingsPage() {
  const { t } = useTranslation()
  const {
    language: lang,
    theme,
    setLanguage,
    setTheme,
    isLoading: preferencesLoading,
  } = useCandidatePreferences()
  const navigate = useNavigate()
  const { isAuthenticated, userId, signOut } = useAuthStore()
  const settingsQueryKey = React.useMemo(
    () => [...getGetSettingsQueryKey(), userId ?? 'anonymous', 'settings-page'] as const,
    [userId],
  )
  const { data: settingsData } = useGetSettings({ query: { enabled: isAuthenticated && !!userId, queryKey: settingsQueryKey } })
  const settingsPayload = settingsData?.data

  const { data: meData } = useGetMe2({ query: { enabled: isAuthenticated } })
  const me = meData?.data

  const queryClient = useQueryClient()
  const updateNotifMutation     = useUpdateNotifications()
  const updatePrivacyMutation   = useUpdatePrivacy()
  const changePasswordMutation  = useChangeMyPassword()
  const updateUserMutation      = useUpdateUser()
  const deleteAccountMutation   = useDeleteMyAccount()

  const [activeSection, setActiveSection] = React.useState<SectionKey>('account')
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false)

  // OTP Verification States
  const [otpDialog, setOtpDialog] = React.useState<{
    isOpen: boolean
    type: 'password' | 'email' | 'phone'
    contact: string
    verificationType: 'EMAIL' | 'PHONE'
    otpCode: string
    otpSent: boolean
  }>({
    isOpen: false,
    type: 'password',
    contact: '',
    verificationType: 'EMAIL',
    otpCode: '',
    otpSent: false,
  })

  const sendOtpMutation = useSendUpdateOtp()
  const verifyOtpMutation = useVerifyUpdateOtp()

  const triggerOtpVerification = (
    type: 'password' | 'email' | 'phone',
    contact: string,
    verificationType: 'EMAIL' | 'PHONE'
  ) => {
    setOtpDialog({
      isOpen: true,
      type,
      contact,
      verificationType,
      otpCode: '',
      otpSent: false,
    })
  }

  const handleSendOtp = () => {
    sendOtpMutation.mutate(
      {
        data: {
          contact: otpDialog.contact,
          preferredVerification: otpDialog.verificationType,
        },
      },
      {
        onSuccess: () => {
          toast.success(lang === 'VI' ? 'Đã gửi mã OTP thành công' : 'OTP sent successfully')
          setOtpDialog((prev) => ({ ...prev, otpSent: true }))
        },
        onError: () => {
          toast.error(lang === 'VI' ? 'Gửi OTP thất bại. Vui lòng thử lại.' : 'Failed to send OTP')
        },
      }
    )
  }

  const handleVerifyAndSubmit = () => {
    if (otpDialog.otpCode.length !== 6) {
      toast.error(lang === 'VI' ? 'Mã OTP phải có 6 chữ số' : 'OTP code must be 6 digits')
      return
    }

    verifyOtpMutation.mutate(
      {
        data: {
          contact: otpDialog.contact,
          verificationType: otpDialog.verificationType,
          code: otpDialog.otpCode,
        },
      },
      {
        onSuccess: () => {
          if (otpDialog.type === 'password') {
            changePasswordMutation.mutate(
              { data: { currentPassword, newPassword } },
              {
                onSuccess: () => {
                  toast.success(lang === 'VI' ? 'Mật khẩu đã được thay đổi' : 'Password updated successfully')
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                  setOtpDialog((prev) => ({ ...prev, isOpen: false }))
                },
                onError: () => toast.error(lang === 'VI' ? 'Mật khẩu hiện tại không đúng hoặc thay đổi thất bại' : 'Current password is incorrect or change failed'),
              }
            )
          } else if (otpDialog.type === 'email') {
            if (!userId) return
            updateUserMutation.mutate(
              { userId, data: { email } },
              {
                onSuccess: () => {
                  toast.success(lang === 'VI' ? 'Đã cập nhật email' : 'Email updated')
                  queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() })
                  queryClient.invalidateQueries({ queryKey: getGetMe2QueryKey() })
                  setOtpDialog((prev) => ({ ...prev, isOpen: false }))
                },
                onError: () => toast.error(lang === 'VI' ? 'Email đã tồn tại hoặc cập nhật thất bại' : 'Email already in use or update failed'),
              }
            )
          } else if (otpDialog.type === 'phone') {
            if (!userId) return
            updateUserMutation.mutate(
              { userId, data: { phone } },
              {
                onSuccess: () => {
                  toast.success(lang === 'VI' ? 'Đã cập nhật số điện thoại' : 'Phone number updated')
                  queryClient.invalidateQueries({ queryKey: getGetMe2QueryKey() })
                  setOtpDialog((prev) => ({ ...prev, isOpen: false }))
                },
                onError: () => toast.error(lang === 'VI' ? 'Số điện thoại đã tồn tại hoặc cập nhật thất bại' : 'Phone number already in use or update failed'),
              }
            )
          }
        },
        onError: () => {
          toast.error(lang === 'VI' ? 'Mã OTP không chính xác hoặc đã hết hạn' : 'Invalid or expired OTP')
        },
      }
    )
  }

  React.useEffect(() => {
    document.title = t('page_title_settings')
  }, [t])

  const [notifications, setNotifications] = React.useState({
    jobRecommendations: false,
    applicationUpdates: false,
    newMessages: false,
    promotionalEmails: false,
  })
  const [privacy, setPrivacy] = React.useState({
    publicProfile: false,
    showSalaryExpectation: false,
    activityStatus: false,
  })

  React.useEffect(() => {
    if (settingsPayload) {
      Promise.resolve().then(() => {
        setNotifications({
          jobRecommendations: settingsPayload.notifications?.emailJobSuggestions ?? false,
          applicationUpdates: settingsPayload.notifications?.emailApplicationUpdates ?? false,
          newMessages:        settingsPayload.notifications?.pushNotifications ?? false,
          promotionalEmails:  settingsPayload.notifications?.marketingEmails ?? false,
        })
        setPrivacy({
          publicProfile:        settingsPayload.privacy?.showCvToRecruiters ?? false,
          showSalaryExpectation: settingsPayload.privacy?.showContactInfo ?? false,
          activityStatus: false,
        })
      })
    }
  }, [settingsPayload])

  const handleNotifToggle = (key: keyof typeof notifications) => {
    const next = { ...notifications, [key]: !notifications[key] }
    setNotifications(next)
    updateNotifMutation.mutate(
      { data: { emailJobSuggestions: next.jobRecommendations, emailApplicationUpdates: next.applicationUpdates, pushNotifications: next.newMessages, marketingEmails: next.promotionalEmails } },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() }),
        onError: () => { setNotifications(notifications); toast.error('Failed to update notifications') },
      }
    )
  }

  const handlePrivacyToggle = (key: keyof Omit<typeof privacy, 'activityStatus'>) => {
    const next = { ...privacy, [key]: !privacy[key] }
    setPrivacy(next)
    updatePrivacyMutation.mutate(
      { data: { showCvToRecruiters: next.publicProfile, showContactInfo: next.showSalaryExpectation } },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() }),
        onError: () => { setPrivacy(privacy); toast.error('Failed to update privacy settings') },
      }
    )
  }

  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')

  React.useEffect(() => {
    if (me) {
      Promise.resolve().then(() => {
        setEmail(me.email ?? '')
        setPhone(me.phone ?? '')
      })
    }
  }, [me])

  const menuItems: Array<{ key: SectionKey; label: string; icon: React.ReactNode }> = [
    { key: 'account', label: 'Account', icon: <Settings className="h-4 w-4" /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { key: 'privacy', label: 'Privacy', icon: <Shield className="h-4 w-4" /> },
    { key: 'preferences', label: 'Preferences', icon: <Globe2 className="h-4 w-4" /> },
    { key: 'danger', label: 'Danger Zone', icon: <TriangleAlert className="h-4 w-4" /> },
  ]

  const handlePasswordUpdate = () => {
    if (newPassword.length < 8) { toast.error(t('account_password_too_short')); return }
    if (newPassword !== confirmPassword) { toast.error(t('account_password_mismatch')); return }
    const contactEmail = me?.email
    if (!contactEmail) {
      toast.error(lang === 'VI' ? 'Tài khoản chưa có email để gửi mã OTP' : 'Account email is required to send OTP')
      return
    }
    triggerOtpVerification('password', contactEmail, 'EMAIL')
  }

  const handleEmailUpdate = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast.error(t('account_email_invalid')); return }
    if (!userId) return
    triggerOtpVerification('email', email, 'EMAIL')
  }

  const handlePhoneUpdate = () => {
    if (!/^(0|\+84)(3|5|7|8|9)\d{8}$/.test(phone)) {
      toast.error(lang === 'VI' ? 'Số điện thoại không hợp lệ' : 'Invalid phone number')
      return
    }
    if (!userId) return
    triggerOtpVerification('phone', phone, 'PHONE')
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit lg:sticky lg:top-20">
          <CardContent className="p-4">
            <h1 className="mb-3 text-lg font-semibold text-foreground">Settings</h1>
            <hr className="mb-3 border-border" />
            <div className="flex gap-2 overflow-x-auto lg:flex-col">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap ${activeSection === item.key ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted/60'}`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {activeSection === 'account' && (
          <Card>
            <CardContent className="space-y-6 p-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Account Settings</h2>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Change Password</h3>
                <Input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="new-password" />
                <Input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
                <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                <Button className="mt-2" onClick={handlePasswordUpdate}>Update Password</Button>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Email Address</h3>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Button variant="outline" onClick={handleEmailUpdate}>Update Email</Button>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">{t('profile_phone')}</h3>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Button variant="outline" onClick={handlePhoneUpdate}>
                  {lang === 'VI' ? 'Cập nhật số điện thoại' : 'Update Phone'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === 'notifications' && (
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-foreground">Notification Preferences</h2>
              <ToggleRow label="Job Recommendations" subLabel="Receive weekly curated job suggestions" checked={notifications.jobRecommendations} onToggle={() => handleNotifToggle('jobRecommendations')} />
              <ToggleRow label="Application Updates" subLabel="Get notified when employers view your profile" checked={notifications.applicationUpdates} onToggle={() => handleNotifToggle('applicationUpdates')} />
              <ToggleRow label="New Messages" subLabel="Notifications for recruiter messages" checked={notifications.newMessages} onToggle={() => handleNotifToggle('newMessages')} />
              <ToggleRow label="Promotional Emails" subLabel="Tips, resources and SmartCV updates" checked={notifications.promotionalEmails} onToggle={() => handleNotifToggle('promotionalEmails')} />
            </CardContent>
          </Card>
        )}

        {activeSection === 'privacy' && (
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-foreground">Privacy Settings</h2>
              <ToggleRow label="Share CV with Recruiters" subLabel="Allow recruiters to view your CV" checked={privacy.publicProfile} onToggle={() => handlePrivacyToggle('publicProfile')} />
              <ToggleRow label="Show Contact Info" subLabel="Display your contact information on profile" checked={privacy.showSalaryExpectation} onToggle={() => handlePrivacyToggle('showSalaryExpectation')} />
              <ToggleRow label="Activity Status" subLabel="Show when you were last active" checked={privacy.activityStatus} onToggle={() => setPrivacy((p) => ({ ...p, activityStatus: !p.activityStatus }))} />
            </CardContent>
          </Card>
        )}

        {activeSection === 'preferences' && (
          <Card>
            <CardContent className="space-y-6 p-6">
              <h2 className="text-xl font-semibold text-foreground">Language & Appearance</h2>
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Language</h3>
                <div className="inline-flex rounded-lg border border-border bg-muted/50 p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={lang === 'EN' ? 'default' : 'ghost'}
                    disabled={preferencesLoading}
                    onClick={() => setLanguage('EN')}
                  >
                    EN
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={lang === 'VI' ? 'default' : 'ghost'}
                    disabled={preferencesLoading}
                    onClick={() => setLanguage('VI')}
                  >
                    VI
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Appearance</h3>
                <div className="inline-flex rounded-lg border border-border bg-muted/50 p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={theme === 'light' ? 'default' : 'ghost'}
                    disabled={preferencesLoading}
                    onClick={() => setTheme('light')}
                    className="gap-2"
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={theme === 'dark' ? 'default' : 'ghost'}
                    disabled={preferencesLoading}
                    onClick={() => setTheme('dark')}
                    className="gap-2"
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === 'danger' && (
          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <h3 className="font-semibold text-foreground">Delete Account</h3>
                <p className="mt-2 text-sm text-muted-foreground">This action is permanent and cannot be undone.</p>
                <Button variant="destructive" className="mt-3" onClick={() => setOpenDeleteDialog(true)}>Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa tài khoản</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Bạn chắc chắn muốn xóa tài khoản và đăng xuất?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>Hủy</Button>
            <Button
              variant="destructive"
              disabled={deleteAccountMutation.isPending}
              onClick={() => deleteAccountMutation.mutate(undefined, {
                onSuccess: () => { signOut(); toast.success(t('account_deleted_toast')); navigate({ to: '/signin' }) },
                onError: () => toast.error('Failed to delete account'),
              })}
            >Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={otpDialog.isOpen} onOpenChange={(open) => setOtpDialog((prev) => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {otpDialog.type === 'password' && (lang === 'VI' ? 'Xác nhận thay đổi mật khẩu' : 'Confirm Password Change')}
              {otpDialog.type === 'email' && (lang === 'VI' ? 'Xác nhận thay đổi Email' : 'Confirm Email Change')}
              {otpDialog.type === 'phone' && (lang === 'VI' ? 'Xác nhận thay đổi Số điện thoại' : 'Confirm Phone Change')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            {!otpDialog.otpSent ? (
              <>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {lang === 'VI' 
                    ? `Hệ thống sẽ gửi mã OTP xác thực đến thông tin liên hệ mới/hiện tại của bạn: `
                    : `We will send a verification OTP to the following address/phone: `}
                  <strong className="text-foreground">{otpDialog.contact}</strong>
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setOtpDialog((prev) => ({ ...prev, isOpen: false }))}>
                    {lang === 'VI' ? 'Hủy' : 'Cancel'}
                  </Button>
                  <Button 
                    onClick={handleSendOtp}
                    disabled={sendOtpMutation.isPending}
                  >
                    {sendOtpMutation.isPending 
                      ? (lang === 'VI' ? 'Đang gửi...' : 'Sending...') 
                      : (lang === 'VI' ? 'Gửi mã OTP' : 'Send OTP')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {lang === 'VI'
                    ? `Mã xác thực đã được gửi đến: `
                    : `Verification code has been sent to: `}
                  <strong className="text-foreground">{otpDialog.contact}</strong>
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {lang === 'VI' ? 'Nhập mã OTP (6 chữ số)' : 'Enter OTP Code (6 digits)'}
                  </label>
                  <Input 
                    type="text" 
                    maxLength={6} 
                    className="text-center tracking-[0.25em] font-mono text-lg" 
                    value={otpDialog.otpCode} 
                    onChange={(e) => setOtpDialog((prev) => ({ ...prev, otpCode: e.target.value.replace(/\D/g, '') }))} 
                  />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs" 
                    disabled={sendOtpMutation.isPending}
                    onClick={handleSendOtp}
                  >
                    {lang === 'VI' ? 'Gửi lại OTP' : 'Resend OTP'}
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setOtpDialog((prev) => ({ ...prev, isOpen: false }))}>
                      {lang === 'VI' ? 'Hủy' : 'Cancel'}
                    </Button>
                    <Button 
                      onClick={handleVerifyAndSubmit}
                      disabled={verifyOtpMutation.isPending || changePasswordMutation.isPending || updateUserMutation.isPending}
                    >
                      {verifyOtpMutation.isPending 
                        ? (lang === 'VI' ? 'Đang xác thực...' : 'Verifying...') 
                        : (lang === 'VI' ? 'Xác nhận & Lưu' : 'Verify & Save')}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ToggleRow({ label, subLabel, checked, onToggle }: { label: string; subLabel: string; checked: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{subLabel}</p>
      </div>
      <button type="button" onClick={onToggle} className={`relative h-6 w-10 cursor-pointer rounded-full transition-colors shrink-0 ${checked ? 'bg-primary' : 'bg-muted'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${checked ? 'left-5' : 'left-1'}`} />
      </button>
    </div>
  )
}
