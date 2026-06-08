import { createFileRoute, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import { Button, Card, CardContent, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input } from '@smart-cv/ui'
import { useTranslation } from '@smart-cv/i18n'
import { Bell, Settings, Shield, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { useCandidateStore } from '../store/useCandidateStore'

export const Route = createFileRoute('/_account/settings')({
  component: SettingsPage,
})

type SectionKey = 'account' | 'notifications' | 'privacy' | 'danger'

function SettingsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = React.useState<SectionKey>('account')
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false)

  React.useEffect(() => {
    document.title = t('page_title_settings')
  }, [t])

  const settings = useCandidateStore((s) => s.settings)
  const setSettingsEmail = useCandidateStore((s) => s.setSettingsEmail)
  const setNotificationSetting = useCandidateStore((s) => s.setNotificationSetting)
  const setPrivacySetting = useCandidateStore((s) => s.setPrivacySetting)
  const signOut = useCandidateStore((s) => s.signOut)
  const clearAccountState = useCandidateStore((s) => s.clearAccountState)

  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [email, setEmail] = React.useState(settings.email)

  const menuItems: Array<{ key: SectionKey; label: string; icon: React.ReactNode }> = [
    { key: 'account', label: 'Account', icon: <Settings className="h-4 w-4" /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { key: 'privacy', label: 'Privacy', icon: <Shield className="h-4 w-4" /> },
    { key: 'danger', label: 'Danger Zone', icon: <TriangleAlert className="h-4 w-4" /> },
  ]

  const handlePasswordUpdate = () => {
    if (newPassword.length < 8) {
      toast.error(t('account_password_too_short'))
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('account_password_mismatch'))
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    toast.success(t('account_password_updated'))
  }

  const handleEmailUpdate = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error(t('account_email_invalid'))
      return
    }

    setSettingsEmail(email)
    toast.success(t('account_email_updated'))
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
                <Input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                <Input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                <Button className="mt-2" onClick={handlePasswordUpdate}>Update Password</Button>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Email Address</h3>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Button variant="outline" onClick={handleEmailUpdate}>Update Email</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === 'notifications' && (
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-foreground">Notification Preferences</h2>
              <ToggleRow label="Job Recommendations" subLabel="Receive weekly curated job suggestions" checked={settings.notifications.jobRecommendations} onToggle={() => setNotificationSetting('jobRecommendations', !settings.notifications.jobRecommendations)} />
              <ToggleRow label="Application Updates" subLabel="Get notified when employers view your profile" checked={settings.notifications.applicationUpdates} onToggle={() => setNotificationSetting('applicationUpdates', !settings.notifications.applicationUpdates)} />
              <ToggleRow label="New Messages" subLabel="Notifications for recruiter messages" checked={settings.notifications.newMessages} onToggle={() => setNotificationSetting('newMessages', !settings.notifications.newMessages)} />
              <ToggleRow label="Promotional Emails" subLabel="Tips, resources and SmartCV updates" checked={settings.notifications.promotionalEmails} onToggle={() => setNotificationSetting('promotionalEmails', !settings.notifications.promotionalEmails)} />
            </CardContent>
          </Card>
        )}

        {activeSection === 'privacy' && (
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-foreground">Privacy Settings</h2>
              <ToggleRow label="Public Profile" subLabel="Allow recruiters to find your profile" checked={settings.privacy.publicProfile} onToggle={() => setPrivacySetting('publicProfile', !settings.privacy.publicProfile)} />
              <ToggleRow label="Show Salary Expectation" subLabel="Display your salary expectation on profile" checked={settings.privacy.showSalaryExpectation} onToggle={() => setPrivacySetting('showSalaryExpectation', !settings.privacy.showSalaryExpectation)} />
              <ToggleRow label="Activity Status" subLabel="Show when you were last active" checked={settings.privacy.activityStatus} onToggle={() => setPrivacySetting('activityStatus', !settings.privacy.activityStatus)} />
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
            <Button variant="destructive" onClick={() => {
              clearAccountState()
              signOut()
              toast.success(t('account_deleted_toast'))
              navigate({ to: '/signin' })
            }}>Xác nhận</Button>
          </DialogFooter>
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
