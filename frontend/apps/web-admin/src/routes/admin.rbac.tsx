import { createFileRoute } from '@tanstack/react-router'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@smart-cv/i18n'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Switch } from '@smart-cv/ui'
import { toast } from 'sonner'

export const Route = createFileRoute('/admin/rbac')({ component: AdminRbacPage })

type PermAction = 'create' | 'read' | 'update' | 'delete' | 'upload' | 'download' | 'export' | 'approve' | 'verify' | 'refund'

interface ResourceDef {
  key: string
  labelKey: string
  actions: PermAction[]
}

interface Role {
  id: string
  name: string
  description: string
  system: boolean
  permissions: Record<string, PermAction[]>
}

const CRUD_ACTIONS: PermAction[] = ['create', 'read', 'update', 'delete']
const EXTRA_ACTIONS: PermAction[] = ['verify', 'approve', 'upload', 'download', 'export', 'refund']
const ALL_ACTIONS: PermAction[] = [...CRUD_ACTIONS, ...EXTRA_ACTIONS]

const RESOURCES: ResourceDef[] = [
  { key: 'users', labelKey: 'admin_res_users', actions: [...CRUD_ACTIONS] },
  { key: 'employer_verification', labelKey: 'admin_res_employer_verification', actions: [...CRUD_ACTIONS, 'verify'] },
  { key: 'jobs', labelKey: 'admin_res_jobs', actions: [...CRUD_ACTIONS, 'approve'] },
  { key: 'cvs', labelKey: 'admin_res_cvs', actions: [...CRUD_ACTIONS, 'upload', 'download', 'export'] },
  { key: 'packages', labelKey: 'admin_res_packages', actions: [...CRUD_ACTIONS] },
  { key: 'payments', labelKey: 'admin_res_payments', actions: [...CRUD_ACTIONS, 'refund', 'export'] },
  { key: 'ai_config', labelKey: 'admin_res_ai_config', actions: [...CRUD_ACTIONS] },
  { key: 'system_settings', labelKey: 'admin_res_system_settings', actions: [...CRUD_ACTIONS] },
  { key: 'audit_logs', labelKey: 'admin_res_audit_logs', actions: [...CRUD_ACTIONS, 'export'] },
]

function cloneRole(role: Role): Role {
  return {
    ...role,
    permissions: Object.fromEntries(Object.entries(role.permissions).map(([k, v]) => [k, [...v]])),
  }
}

function defaultPermissions(fillAll: boolean) {
  return Object.fromEntries(RESOURCES.map((resource) => [resource.key, fillAll ? [...resource.actions] : []])) as Role['permissions']
}

function initialRoles(t: (key: string) => string): Role[] {
  return [
    {
      id: 'admin',
      name: 'Admin',
      description: t('admin_rbac_role_admin_desc'),
      system: true,
      permissions: defaultPermissions(true),
    },
    {
      id: 'recruiter',
      name: 'Recruiter',
      description: t('admin_rbac_role_recruiter_desc'),
      system: true,
      permissions: {
        users: [],
        employer_verification: ['read'],
        jobs: ['create', 'read', 'update'],
        cvs: ['read', 'download'],
        packages: ['read'],
        payments: ['read'],
        ai_config: [],
        system_settings: [],
        audit_logs: [],
      },
    },
    {
      id: 'candidate',
      name: 'Candidate',
      description: t('admin_rbac_role_candidate_desc'),
      system: true,
      permissions: {
        users: ['read', 'update'],
        employer_verification: [],
        jobs: ['read'],
        cvs: ['create', 'read', 'update', 'upload', 'download'],
        packages: ['read'],
        payments: ['read'],
        ai_config: [],
        system_settings: [],
        audit_logs: [],
      },
    },
    {
      id: 'moderator',
      name: 'Moderator',
      description: t('admin_rbac_role_moderator_desc'),
      system: false,
      permissions: {
        users: ['read'],
        employer_verification: ['read', 'verify'],
        jobs: ['read', 'approve'],
        cvs: ['read'],
        packages: ['read'],
        payments: ['read'],
        ai_config: [],
        system_settings: [],
        audit_logs: ['read'],
      },
    },
  ]
}

function AdminRbacPage() {
  const { t } = useTranslation()
  const [roles, setRoles] = useState<Role[]>(() => initialRoles(t))
  const [selectedRoleId, setSelectedRoleId] = useState('admin')
  const [originalRole, setOriginalRole] = useState<Role>(() => cloneRole(initialRoles(t)[0]))
  const [draftRole, setDraftRole] = useState<Role>(() => cloneRole(initialRoles(t)[0]))
  const [createOpen, setCreateOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDescription, setNewRoleDescription] = useState('')

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  )

  const selectRole = (role: Role) => {
    setSelectedRoleId(role.id)
    setOriginalRole(cloneRole(role))
    setDraftRole(cloneRole(role))
  }

  const updatePerm = (resourceKey: string, action: PermAction, checked: boolean) => {
    setDraftRole((prev) => {
      if (prev.system && prev.id === 'admin') return prev
      const current = new Set(prev.permissions[resourceKey] ?? [])
      if (checked) current.add(action)
      else current.delete(action)
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [resourceKey]: Array.from(current),
        },
      }
    })
  }

  const saveRole = () => {
    setRoles((prev) => prev.map((role) => (role.id === draftRole.id ? cloneRole(draftRole) : role)))
    setOriginalRole(cloneRole(draftRole))
    toast.success(t('admin_rbac_saved_toast'))
  }

  const resetRole = () => {
    setDraftRole(cloneRole(originalRole))
  }

  const deleteRole = (roleId: string) => {
    const nextRoles = roles.filter((role) => role.id !== roleId)
    setRoles(nextRoles)
    const fallback = nextRoles[0]
    if (!fallback) return
    selectRole(fallback)
  }

  const createRole = () => {
    const trimmed = newRoleName.trim()
    if (!trimmed) return
    const id = `${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
    const role: Role = {
      id,
      name: trimmed,
      description: newRoleDescription.trim(),
      system: false,
      permissions: defaultPermissions(false),
    }
    const nextRoles = [...roles, role]
    setRoles(nextRoles)
    selectRole(role)
    setCreateOpen(false)
    setNewRoleName('')
    setNewRoleDescription('')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('admin_rbac_title')}</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          {t('admin_rbac_create_role')}
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="card-surface p-3">
          <div className="mb-2 px-2 text-sm font-semibold">{t('admin_rbac_roles')}</div>
          <div className="space-y-1">
            {roles.map((role) => {
              const active = role.id === selectedRoleId
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => selectRole(role)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left',
                    active
                      ? 'border-primary/20 bg-primary/10 text-primary'
                      : 'border-transparent hover:bg-accent',
                  )}
                >
                  <div>
                    <div className="font-medium">{role.name}</div>
                    {role.system && (
                      <span className="mt-1 inline-flex rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {t('admin_rbac_role_system_badge')}
                      </span>
                    )}
                  </div>
                  {!role.system && (
                    <span
                      role="button"
                      tabIndex={0}
                      className="text-muted-foreground hover:text-foreground"
                      onClick={(event) => {
                        event.stopPropagation()
                        deleteRole(role.id)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          event.stopPropagation()
                          deleteRole(role.id)
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {!selectedRole ? (
          <div className="card-surface p-6 text-sm text-muted-foreground">{t('admin_rbac_empty')}</div>
        ) : (
          <div className="space-y-4">
            <div className="card-surface p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="role-name">{t('admin_rbac_role_name')}</Label>
                  <Input
                    id="role-name"
                    className="mt-1.5"
                    value={draftRole.name}
                    disabled={draftRole.system}
                    onChange={(event) => setDraftRole({ ...draftRole, name: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="role-desc">{t('admin_rbac_role_desc')}</Label>
                  <Input
                    id="role-desc"
                    className="mt-1.5"
                    value={draftRole.description}
                    onChange={(event) => setDraftRole({ ...draftRole, description: event.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="card-surface overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="sticky left-0 z-10 bg-muted/50 p-3">{t('admin_rbac_col_resource')}</th>
                    {ALL_ACTIONS.map((action) => (
                      <th key={action} className="p-3">
                        {t(`admin_rbac_perm_${action}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RESOURCES.map((resource) => (
                    <tr key={resource.key} className="border-t border-border">
                      <td className="sticky left-0 z-10 bg-card p-3 font-medium">{t(resource.labelKey)}</td>
                      {ALL_ACTIONS.map((action) => {
                        const supported = resource.actions.includes(action)
                        if (!supported) {
                          return (
                            <td key={`${resource.key}-${action}`} className="p-3 text-center text-muted-foreground">
                              —
                            </td>
                          )
                        }
                        const checked = Boolean(draftRole.permissions[resource.key]?.includes(action))
                        const disabled = draftRole.system && draftRole.id === 'admin'
                        return (
                          <td key={`${resource.key}-${action}`} className="p-3 text-center">
                            <Switch
                              checked={checked}
                              disabled={disabled}
                              onCheckedChange={(nextChecked) => updatePerm(resource.key, action, nextChecked)}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveRole}>{t('admin_rbac_save')}</Button>
              <Button variant="outline" onClick={resetRole}>{t('admin_rbac_cancel')}</Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin_rbac_create_role')}</DialogTitle>
            <DialogDescription>{t('admin_rbac_create_role_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="new-role-name">{t('admin_rbac_role_name')}</Label>
              <Input
                id="new-role-name"
                className="mt-1.5"
                value={newRoleName}
                onChange={(event) => setNewRoleName(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="new-role-desc">{t('admin_rbac_role_desc')}</Label>
              <Input
                id="new-role-desc"
                className="mt-1.5"
                value={newRoleDescription}
                onChange={(event) => setNewRoleDescription(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t('admin_rbac_cancel')}
            </Button>
            <Button onClick={createRole} disabled={!newRoleName.trim()}>
              {t('admin_rbac_create_role')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
