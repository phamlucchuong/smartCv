import { createFileRoute, redirect } from '@tanstack/react-router'
import * as React from 'react'
import { Button, Card, CardContent, Input } from '@smart-cv/ui'
import { Bell, Settings, Shield, TriangleAlert } from 'lucide-react'
import { mockUser } from '../store/useCandidateStore'

export const Route = createFileRoute('/settings')({
  beforeLoad: () => {
    if (localStorage.getItem('isAuthenticated') !== 'true') {
      throw redirect({ to: '/signin' })
    }
  },
  component: SettingsPage,
})

type SectionKey = 'account' | 'notifications' | 'privacy' | 'danger'

function SettingsPage() {
  const [activeSection, setActiveSection] = React.useState<SectionKey>('account')
  const [notifications, setNotifications] = React.useState({
    jobRecommendations: true,
    applicationUpdates: true,
    newMessages: true,
    promotionalEmails: false,
  })
  const [privacy, setPrivacy] = React.useState({
    publicProfile: true,
    showSalaryExpectation: false,
    activityStatus: true,
  })

  const menuItems: Array<{ key: SectionKey; label: string; icon: React.ReactNode }> = [
    { key: 'account', label: 'Account', icon: <Settings className="h-4 w-4" /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { key: 'privacy', label: 'Privacy', icon: <Shield className="h-4 w-4" /> },
    { key: 'danger', label: 'Danger Zone', icon: <TriangleAlert className="h-4 w-4" /> },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit lg:sticky lg:top-20">
          <CardContent className="p-4">
            <h1 className="text-lg font-semibold text-foreground mb-3">Settings</h1>
            <hr className="border-border mb-3" />
            <div className="flex lg:flex-col gap-2 overflow-x-auto">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm whitespace-nowrap ${activeSection === item.key ? 'bg-primary/10 text-primary font-medium rounded-lg' : 'text-foreground hover:bg-muted/60 rounded-lg'}`}
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
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Account Settings</h2>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Change Password</h3>
                <Input type="password" placeholder="Current Password" />
                <Input type="password" placeholder="New Password" />
                <Input type="password" placeholder="Confirm Password" />
                <Button className="mt-2">Update Password</Button>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Email Address</h3>
                <Input type="email" defaultValue={mockUser.email} />
                <Button variant="outline">Update Email</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === 'notifications' && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Notification Preferences</h2>
              <ToggleRow label="Job Recommendations" subLabel="Receive weekly curated job suggestions" checked={notifications.jobRecommendations} onToggle={() => setNotifications((prev) => ({ ...prev, jobRecommendations: !prev.jobRecommendations }))} />
              <ToggleRow label="Application Updates" subLabel="Get notified when employers view your profile" checked={notifications.applicationUpdates} onToggle={() => setNotifications((prev) => ({ ...prev, applicationUpdates: !prev.applicationUpdates }))} />
              <ToggleRow label="New Messages" subLabel="Notifications for recruiter messages" checked={notifications.newMessages} onToggle={() => setNotifications((prev) => ({ ...prev, newMessages: !prev.newMessages }))} />
              <ToggleRow label="Promotional Emails" subLabel="Tips, resources and SmartCV updates" checked={notifications.promotionalEmails} onToggle={() => setNotifications((prev) => ({ ...prev, promotionalEmails: !prev.promotionalEmails }))} />
            </CardContent>
          </Card>
        )}

        {activeSection === 'privacy' && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Privacy Settings</h2>
              <ToggleRow label="Public Profile" subLabel="Allow recruiters to find your profile" checked={privacy.publicProfile} onToggle={() => setPrivacy((prev) => ({ ...prev, publicProfile: !prev.publicProfile }))} />
              <ToggleRow label="Show Salary Expectation" subLabel="Display your salary expectation on profile" checked={privacy.showSalaryExpectation} onToggle={() => setPrivacy((prev) => ({ ...prev, showSalaryExpectation: !prev.showSalaryExpectation }))} />
              <ToggleRow label="Activity Status" subLabel="Show when you were last active" checked={privacy.activityStatus} onToggle={() => setPrivacy((prev) => ({ ...prev, activityStatus: !prev.activityStatus }))} />
            </CardContent>
          </Card>
        )}

        {activeSection === 'danger' && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
              <div className="border border-destructive/30 bg-destructive/5 rounded-xl p-4">
                <h3 className="font-semibold text-foreground">Delete Account</h3>
                <p className="text-sm text-muted-foreground mt-2">This action is permanent and cannot be undone. All your data, applications, and saved jobs will be deleted.</p>
                <Button variant="destructive" className="mt-3" onClick={() => window.confirm('Are you sure you want to delete your account?')}>Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function ToggleRow({ label, subLabel, checked, onToggle }: { label: string; subLabel: string; checked: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0 gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{subLabel}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative h-6 w-10 cursor-pointer rounded-full transition-colors shrink-0 ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${checked ? 'left-5' : 'left-1'}`} />
      </button>
    </div>
  )
}
