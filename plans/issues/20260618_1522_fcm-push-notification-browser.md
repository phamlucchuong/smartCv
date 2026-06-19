# FCM Browser Push Notifications for Candidate / Recruiter / Admin

## Overview

Implement end-to-end Firebase Cloud Messaging (FCM) push notifications so that users on all three web apps (candidate, recruiter, admin) can opt in to browser push alerts. The backend infrastructure is mostly scaffolded but not wired; the frontend has no Firebase SDK, no service worker, and no permission flow at all.

The feature has four parts:

1. **Backend: wire FCM credentials from env** — `notification-service` initializes Firebase with empty strings; no push is ever sent.
2. **Backend: fix auth and audience for subscribe endpoints** — auth middleware is commented out and `SubscribeFCMToken` hardcodes audience to `"web-user"`.
3. **Frontend: install Firebase SDK + service worker** — no Firebase package in any frontend app.
4. **Frontend: push permission request + subscribe/unsubscribe flow** — the "Push Notifications" toggle in Settings is a pure DB preference with no browser permission request.

---

## Current behavior

| Layer | What exists | What is broken |
|---|---|---|
| `notification-service` config | `config.Config` has no FCM fields | `server.go:72-73` passes `""` for both `fcmProjectID` and `fcmServiceAccountJSON` → `s.fcmClient` is always nil → every `sendWebpushToUser` call returns immediately without sending anything |
| `notification-service` auth | `// s.setupMiddleware()` commented out at `server.go:88` | No middleware reads the gateway-forwarded `X-User-Id` header → `c.Get("user_id")` is always `""` → handlers always return 401 in the best case, save wrong data in the worst |
| `notification-service` audience — subscribe | `SubscribeFCMToken` hardcodes `audience = "web-user"` in service + handler | Recruiter/admin tokens saved under `"web-user"` → `sendWebpushToUser("web-vendor")` finds zero tokens → push never reaches recruiters or admins |
| `notification-service` audience — unsubscribe (stub) | `UnsubscribeFCMToken` handler (`handler.go:158-174`) validates input and returns 200 immediately | The service layer is **never called** — no token is ever deleted from the database; calling `DELETE /fcm/unsubscribe` silently does nothing |
| `notification-service` unsubscribe BOLA | Service `UnsubscribeFCMToken` deletes by token string alone | No `user_id` constraint → any authenticated user who knows another user's FCM token string can delete it; fix requires `WHERE token = ? AND audience = ? AND user_id = ?` |
| Gateway audience header | Gateway `AuthenticationFilter` sets `X-User-Id`, `X-Role`, `X-Email` | `X-Audience` is never forwarded → notification middleware cannot derive audience from a header that doesn't exist; must be derived from `X-Role` in notification service middleware |
| DB migration | `V001-create-notifications-table.up.sql` is 0 bytes | `notification_fcm_tokens` table only exists if GORM auto-migrate runs; no explicit migration |
| Application events | `consumer.handleApplicationEvent` calls `SendApplicationResultEmail` only | No FCM push is sent when a candidate's application is accepted or rejected |
| Frontend SDK | Firebase not in any `package.json` | Cannot call `messaging.getToken()` or register a service worker |
| Frontend SW | No `firebase-messaging-sw.js` in any `public/` directory | Background push messages cannot be received |
| Frontend permission (candidate) | Settings toggle `pushNotifications` calls `PUT /user/api/candidates/settings` only | Browser `Notification.permission` is never requested; no FCM token is generated or registered |
| Frontend permission (recruiter) | `employer.settings.tsx` has no notification toggle at all | No push preferences or permission flow exists in the recruiter app |
| Frontend notifications (candidate) | `_account.notifications.tsx` is a static placeholder | No API call, no unread count, no list |
| Frontend notifications (recruiter) | `employer.notifications.tsx` renders hardcoded fake items | Three hardcoded i18n entries with static timestamps are displayed as if they were real notifications |
| Frontend notifications (admin) | No notifications route exists in `web-admin` | Must be created from scratch |

---

## Reproduction steps

1. Enable "New Messages" toggle in Settings (web-candidate).
2. Trigger an application accepted event from the recruiter side.
3. Observe: no browser notification appears; no FCM push is sent; `notification-service` log shows FCM client is nil.

---

## Expected behavior

1. After the user turns on "Push Notifications" in Settings, the browser permission dialog appears.
2. If granted: Firebase SDK obtains an FCM registration token and `POST /notification/api/notifications/fcm/subscribe` is called with the token and the correct audience.
3. When a significant event occurs (application accepted/rejected, new job suggestion, CV analysis complete), the user receives a browser push notification even if the tab is closed.
4. If the user revokes permission or toggles the switch off, the token is deleted via `DELETE /notification/api/notifications/fcm/unsubscribe`.
5. The `/notifications` page shows the persisted notification history fetched from `GET /notification/api/notifications`.

---

## Impact scope

Backend:
- [x] api-gateway
- [ ] user-service
- [ ] job_service
- [ ] application_service
- [ ] ai_engine_service
- [x] notification-service

Frontend:
- [x] web-candidate
- [x] web-recruiter
- [x] web-admin
- [ ] packages/ui
- [x] packages/api
- [ ] packages/i18n

---

## Related code

| Location | Relevance |
|---|---|
| `backend/notification-service/internal/server/server.go:88` | `// s.setupMiddleware()` — auth middleware commented out |
| `backend/notification-service/internal/server/server.go:72-73` | FCM credentials passed as `""` inside `NewService` call |
| `backend/notification-service/internal/config/config.go` | No `FCM_PROJECT_ID` or `FCM_SERVICE_ACCOUNT_JSON` fields |
| `backend/notification-service/internal/notification/service.go:SubscribeFCMToken` | Hardcodes `audience = "web-user"` |
| `backend/notification-service/internal/notification/service.go:UnsubscribeFCMToken` | Hardcodes `audience = "web-user"` in `DeleteFCMTokenByTokenAndAudience` call; also missing `user_id` scope (security gap) |
| `backend/notification-service/internal/notification/service.go:ServiceInterface` | `SubscribeFCMToken` and `UnsubscribeFCMToken` signatures must be updated when adding audience param |
| `backend/notification-service/internal/notification/model.go:FCMToken` | `audience` field and `NewFCMToken` helper exist and are correct |
| `backend/notification-service/internal/notification/consumer.go:handleApplicationEvent` | Calls `SendApplicationResultEmail` only; no FCM push |
| `backend/notification-service/internal/server/routes.go` | Subscribe/unsubscribe and firebase-token endpoints exist |
| `backend/notification-service/migrations/V001-create-notifications-table.up.sql` | Empty file (0 bytes) |
| `backend/api-gateway/src/main/resources/application.yaml` | FCM subscribe IS behind gateway JWT (correct); gateway forwards `X-User-Id`, `X-Role`, `X-Email` but NOT `X-Audience` |
| `frontend/apps/web-candidate/src/routes/_account.settings.tsx:106` | `pushNotifications` toggle calls `updateNotifMutation` only |
| `frontend/apps/web-candidate/src/routes/_account.notifications.tsx` | Empty placeholder — no API call |
| `frontend/apps/web-recruiter/src/routes/employer.notifications.tsx` | Shows hardcoded fake notifications (i18n keys with static timestamps) — no API call |
| `frontend/apps/web-recruiter/src/routes/employer.settings.tsx` | Settings stub — no notification toggle at all (different from candidate) |
| `frontend/packages/api/src/generated/...` | No `subscribeFcmToken` or `unsubscribeFcmToken` hooks generated yet |

---

## Fix spec

### 1. Backend — wire FCM credentials

**`config/config.go`** — add fields:
```go
FCMProjectID         string `mapstructure:"FCM_PROJECT_ID"`
FCMServiceAccountJSON string `mapstructure:"FCM_SERVICE_ACCOUNT_JSON"`
```

**`server/server.go`** — replace hardcoded empty strings:
```go
s.notiSvc = notification.NewService(
    repo, log,
    cfg.FCMProjectID,
    cfg.FCMServiceAccountJSON,
    otpSvc, emailSvc, smsSvc,
)
```

**`.env.example`** — add:
```
FCM_PROJECT_ID=your-firebase-project-id
FCM_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### 2. Backend — re-enable authentication middleware

`// s.setupMiddleware()` is commented out at `server.go:88`. The API gateway's `AuthenticationFilter` forwards `X-User-Id`, `X-Role`, and `X-Email` headers on authenticated requests; there is NO `X-Audience` header.

Implement `setupMiddleware()` and uncomment it. The middleware must:
1. Read `X-User-Id` from the request header and set it on the echo context as `"user_id"`.
2. Derive audience from `X-Role` and set it on the context as `"audience"`.

```go
func authMiddleware() echo.MiddlewareFunc {
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            userID := c.Request().Header.Get("X-User-Id")
            role := c.Request().Header.Get("X-Role")
            if userID == "" {
                return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
            }
            c.Set("user_id", userID)
            c.Set("audience", audienceFromRole(role)) // "web-user" / "web-vendor" / "web-admin"
            return next(c)
        }
    }
}

func audienceFromRole(role string) string {
    switch strings.ToUpper(role) {
    case "RECRUITER": return "web-vendor"
    case "ADMIN":     return "web-admin"
    default:          return "web-user"
    }
}
```

Apply this middleware only to `/notification/api/notifications/**` routes (not to `/notification/api/otp/**` which are public).

### 3. Backend — fix `SubscribeFCMToken` and `UnsubscribeFCMToken`

**3a. Update `ServiceInterface` and both method signatures to include `audience`:**

```go
// ServiceInterface
SubscribeFCMToken(ctx context.Context, userID string, token string, audience string) error
UnsubscribeFCMToken(ctx context.Context, userID string, token string, audience string) error
```

**3b. Fix `SubscribeFCMToken` implementation:**
```go
func (s *Service) SubscribeFCMToken(ctx context.Context, userID string, token string, audience string) error {
    tok := NewFCMToken(userID, token, audience)
    return s.repo.SaveFCMToken(ctx, &tok)
}
```

**3c. Fix `UnsubscribeFCMToken` — the handler is currently a stub that never calls the service.** Implement the full call chain:

In `handler.go` — replace the early `return pkg.JSONOK(c, nil)` with the actual service call:
```go
func (h *Handler) UnsubscribeFCMToken(c echo.Context) error {
    userID, _ := c.Get("user_id").(string)
    if userID == "" { return pkg.JSONError(c, 401, ...) }
    audience, _ := c.Get("audience").(string)
    if audience == "" { audience = "web-user" }
    var req FCMSubscribeRequest
    if err := c.Bind(&req); err != nil || req.Token == "" { return pkg.JSONError(c, 400, ...) }
    if err := h.notifSvc.UnsubscribeFCMToken(c.Request().Context(), userID, req.Token, audience); err != nil {
        return pkg.JSONError(c, 500, ...)
    }
    return pkg.JSONOK(c, nil)
}
```

In `service.go`:
```go
func (s *Service) UnsubscribeFCMToken(ctx context.Context, userID string, token string, audience string) error {
    return s.repo.DeleteFCMTokenByTokenAudienceAndUser(ctx, token, audience, userID)
}
```

**3d. Fix the BOLA vulnerability — scope delete to `user_id`:**

Add a new repository method and update the interface:
```go
// Repository interface — add:
DeleteFCMTokenByTokenAudienceAndUser(ctx context.Context, token string, audience string, userID string) error

// Implementation:
func (r *repository) DeleteFCMTokenByTokenAudienceAndUser(ctx context.Context, token, audience, userID string) error {
    return r.db.WithContext(ctx).
        Where("token = ? AND audience = ? AND user_id = ?", token, audience, userID).
        Delete(&FCMToken{}).Error
}
```

The old `DeleteFCMTokenByTokenAndAudience` can remain for the auto-cleanup path (invalid token removal in `sendWebpushToUser` does NOT need user scoping because it is an internal operation on an already-known token).

Audience mapping (consistent with existing `audienceForRecipientRole`):
- `web-candidate` calls → `audience = "web-user"`
- `web-recruiter` calls → `audience = "web-vendor"`
- `web-admin` calls → `audience = "web-admin"`

### 4. Backend — add DB migration

Write `V001-create-notifications-table.up.sql` with both tables:

```sql
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    recipient_role VARCHAR(20) NOT NULL,
    type VARCHAR(50) DEFAULT 'SYSTEM',
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_role ON notifications(user_id, recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;

CREATE TABLE IF NOT EXISTS notification_fcm_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    audience VARCHAR(20) NOT NULL DEFAULT 'web-user',
    token TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (token, audience)
);
CREATE INDEX IF NOT EXISTS idx_notification_fcm_tokens_user_id_audience
    ON notification_fcm_tokens(user_id, audience);
```

Also write `V001-create-notifications-table.down.sql`:
```sql
DROP TABLE IF EXISTS notification_fcm_tokens;
DROP TABLE IF EXISTS notifications;
```

### 5. Backend — send FCM push for application events

In `consumer.handleApplicationEvent`, after sending the email, also call the notification service to persist and push:

```go
func (c *Consumer) handleApplicationEvent(msg ApplicationEventMessage) {
    // existing: send email
    if err := c.notiSvc.SendApplicationResultEmail(ctx, msg); err != nil { ... }

    // new: persist notification + send FCM push to candidate
    title, body := buildApplicationNotificationContent(msg.NewStatus, msg.JobTitle, msg.RejectionReason)
    data, _ := json.Marshal(map[string]string{
        "applicationId": msg.ApplicationID,
        "jobId":         msg.JobID,
        "jobTitle":      msg.JobTitle,
        "status":        msg.NewStatus,
    })
    _ = c.notiSvc.CreateNotification(ctx, msg.CandidateID, "USER", title, body, "APPLICATION_STATUS", data)
    c.notiSvc.NotifyApplicationStatusChanged(ctx, msg.CandidateID, msg.ApplicationID, msg.JobTitle, msg.NewStatus)
}
```

Add `NotifyApplicationStatusChanged(ctx, candidateID, applicationID, jobTitle, status string)` to `ServiceInterface` and `Service`, following the same pattern as `NotifyNewOrder`.

### 6. Frontend — install Firebase and add service worker (all 3 apps)

**Install SDK** (pnpm workspace root):
```bash
pnpm add firebase
```
Or per-app if preferred.

**Add service worker** to each app's `public/firebase-messaging-sw.js`:
```js
importScripts('https://www.gstatic.com/firebasejs/10.x.x/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.x.x/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY,
  projectId: self.FIREBASE_PROJECT_ID,
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID,
  appId: self.FIREBASE_APP_ID,
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, url } = payload.data ?? {};
  self.registration.showNotification(title ?? 'SmartCV', {
    body: body ?? '',
    icon: '/icon-192.png',
    data: { url },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url;
  if (url) event.waitUntil(clients.openWindow(url));
});
```

Add env vars to each app's `.env.example`:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

### 7. Frontend — `usePushNotifications` hook

Create `frontend/apps/web-candidate/src/hooks/usePushNotifications.ts` (duplicate for recruiter with `AUDIENCE = 'web-vendor'` and admin with `AUDIENCE = 'web-admin'`):

```ts
import { getMessaging, getToken, deleteToken } from 'firebase/messaging'
import { AXIOS_INSTANCE } from '@smart-cv/api'

const FCM_TOKEN_KEY = 'smartcv_fcm_token'

export function usePushNotifications() {
  const subscribe = async (): Promise<string> => {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') throw new Error('Permission denied')

    const messaging = getMessaging()
    const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY })
    await AXIOS_INSTANCE.post('/notification/api/notifications/fcm/subscribe', { token })
    localStorage.setItem(FCM_TOKEN_KEY, token) // persist for unsubscribe
    return token
  }

  const unsubscribe = async (): Promise<void> => {
    const token = localStorage.getItem(FCM_TOKEN_KEY)
    if (!token) return
    const messaging = getMessaging()
    await deleteToken(messaging)
    await AXIOS_INSTANCE.delete('/notification/api/notifications/fcm/unsubscribe', { data: { token } })
    localStorage.removeItem(FCM_TOKEN_KEY)
  }

  return { subscribe, unsubscribe }
}
```

### 8. Frontend — wire Settings push toggle to permission flow

**web-candidate** (`_account.settings.tsx`): intercept the "New Messages" toggle only — the other three toggles (`jobRecommendations`, `applicationUpdates`, `promotionalEmails`) continue to use the existing `handleNotifToggle` unchanged.

```tsx
const { subscribe, unsubscribe } = usePushNotifications()

const handlePushToggle = async () => {
  if (!notifications.newMessages) {
    // turning ON
    if (Notification.permission === 'denied') {
      toast.error('Browser notifications are blocked. Please allow them in your browser settings.')
      return
    }
    try {
      await subscribe()
      handleNotifToggle('newMessages') // persist DB preference
    } catch {
      toast.error('Could not enable push notifications')
    }
  } else {
    // turning OFF
    await unsubscribe()
    handleNotifToggle('newMessages')
  }
}
```

Show a sub-label showing current browser permission state: `"Allowed"` / `"Blocked"` / `"Not set"`.

**web-recruiter** (`employer.settings.tsx`): The recruiter settings page has no notification toggle at all. Add the "Push Notifications" section alongside the existing settings, wired to the same `usePushNotifications` hook but with `AUDIENCE = 'web-vendor'` and calling the recruiter's settings update endpoint.

### 9. Frontend — implement notifications pages (all 3 apps)

All three apps need a real notifications page. The implementation is the same pattern; differences are only in audience and route path.

**web-candidate** (`_account.notifications.tsx`): replace static placeholder.
**web-recruiter** (`employer.notifications.tsx`): replace fake hardcoded items with real data.
**web-admin**: create a new notifications route from scratch.

Common implementation:
```tsx
const { data } = useQuery({
  queryKey: ['notifications', page],
  queryFn: () => AXIOS_INSTANCE.get('/notification/api/notifications', { params: { page, pageSize: 20 } }),
})
```

Show: unread count badge in the header, notification cards with title/body/date, "Mark all as read" button, empty state when list is empty.

### 10. Frontend — Firestore real-time unread count (optional, enhances UX)

Subscribe to Firestore `notifications/{userId}` doc using the firebase-token from `GET /notification/api/notifications/firebase-token`. Update the bell icon badge in the dashboard header when `unreadCount` changes. Without this, the badge only updates on page refresh. This requires Firestore to be enabled in the Firebase project.

---

## Implementation order

1. Backend: FCM credentials in config → FCM client initializes
2. Backend: re-enable auth middleware (reads `X-User-Id` + derives audience from `X-Role`)
3. Backend: fix `SubscribeFCMToken` and `UnsubscribeFCMToken` — audience param, stub fix, BOLA fix, ServiceInterface + Repository updates
4. Backend: DB migration file
5. Frontend: Firebase SDK + service worker + env vars (all 3 apps)
6. Frontend: `usePushNotifications` hook per app
7. Frontend: wire Settings push toggle + permission UI (candidate + recruiter)
8. Backend: push for application events
9. Frontend: notifications pages (candidate update, recruiter replace fake data, admin create route)
10. Frontend: Firestore real-time unread count (optional)

## Notes

- Firebase credentials (project ID, service account JSON, VAPID key) require a Firebase project to be set up. Create one at `console.firebase.google.com`, enable Cloud Messaging, and download the service account key.
- The VAPID key is a separate web push certificate key generated in Firebase Console → Project Settings → Cloud Messaging → Web configuration.
- `web-recruiter` uses audience `"web-vendor"` (matching `audienceForRecipientRole("VENDOR")` in the service). If this should be `"web-recruiter"` for clarity, update `audienceForRecipientRole` accordingly.
- Background push (service worker) requires the site to be served over HTTPS in production; localhost works in development.
- Firestore real-time feature (step 10) requires Firestore to be enabled in the Firebase project and `firebaseAuthClient` to be functional.
