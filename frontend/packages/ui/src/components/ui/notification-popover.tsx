import * as React from "react"
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"

export type NotificationFilter = "all" | "unread" | "read"
export type NotificationTone = "default" | "success" | "warning" | "danger" | "info"

export interface NotificationItem {
  id: string
  title: string
  message: string
  createdAt: string
  read: boolean
  tone?: NotificationTone
}

interface NotificationLabels {
  title: string
  all: string
  unread: string
  read: string
  markRead: string
  delete: string
  markAllRead: string
  clearAll: string
  empty: string
  noUnread: string
  unreadCount: string
  openNotifications: string
}

interface NotificationPopoverProps {
  notifications: NotificationItem[]
  unreadCount: number
  filter: NotificationFilter
  onFilterChange: (filter: NotificationFilter) => void
  onMarkRead: (id: string) => void
  onDelete: (id: string) => void
  onMarkAllRead: () => void
  onClearAll: () => void
  labels: NotificationLabels
  locale?: string
  triggerClassName?: string
  panelClassName?: string
}

const toneClasses: Record<NotificationTone, string> = {
  default: "bg-slate-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-sky-500",
}

function formatTimestamp(value: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value))
  } catch {
    return value
  }
}

export function NotificationPopover({
  notifications,
  unreadCount,
  filter,
  onFilterChange,
  onMarkRead,
  onDelete,
  onMarkAllRead,
  onClearAll,
  labels,
  locale = "en-US",
  triggerClassName,
  panelClassName,
}: NotificationPopoverProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.read
    if (filter === "read") return notification.read
    return true
  })

  const summaryText = unreadCount > 0 ? labels.unreadCount : labels.noUnread

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={labels.openNotifications}
        onClick={() => setOpen((current) => !current)}
        className={cn("relative rounded-lg p-2 transition-colors hover:bg-accent", triggerClassName)}
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={labels.title}
          className={cn(
            "absolute right-0 top-full z-50 mt-3 w-[min(92vw,24rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_48px_rgba(15,23,42,0.18)]",
            panelClassName,
          )}
        >
          <div className="border-b border-border bg-muted/30 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{labels.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{summaryText}</p>
              </div>
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bell className="size-4" />
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {(["all", "unread", "read"] as NotificationFilter[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onFilterChange(value)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    filter === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {value === "all" && labels.all}
                  {value === "unread" && labels.unread}
                  {value === "read" && labels.read}
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onMarkAllRead}
                disabled={unreadCount === 0}
                className="h-8 text-xs"
              >
                <CheckCheck className="mr-1.5 size-3.5" />
                {labels.markAllRead}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onClearAll}
                disabled={notifications.length === 0}
                className="h-8 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-1.5 size-3.5" />
                {labels.clearAll}
              </Button>
            </div>
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="rounded-full bg-muted p-3 text-muted-foreground">
                  <Bell className="size-5" />
                </div>
                <p className="mt-4 text-sm font-medium text-foreground">{labels.empty}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => {
                      if (!notification.read) onMarkRead(notification.id)
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40",
                      !notification.read && "bg-primary/[0.04]",
                    )}
                  >
                    <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", toneClasses[notification.tone ?? "default"])} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={cn("truncate text-sm text-foreground", !notification.read && "font-semibold")}>
                            {notification.title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {notification.message}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatTimestamp(notification.createdAt, locale)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {!notification.read && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation()
                              onMarkRead(notification.id)
                            }}
                            className="h-7 px-2.5 text-[11px]"
                          >
                            <Check className="mr-1 size-3" />
                            {labels.markRead}
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={(event) => {
                            event.stopPropagation()
                            onDelete(notification.id)
                          }}
                          className="h-7 px-2.5 text-[11px] text-destructive hover:text-destructive"
                        >
                          <Trash2 className="mr-1 size-3" />
                          {labels.delete}
                        </Button>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
