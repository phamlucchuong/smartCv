package notification

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strconv"
	"strings"
	"sync"
	"time"

	"smartCv/notification-service/internal/email"
	"smartCv/notification-service/internal/otp"
	"smartCv/notification-service/internal/sms"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"firebase.google.com/go/v4/messaging"
	"github.com/google/uuid"
	"google.golang.org/api/option"
	"gorm.io/datatypes"
)

type ServiceInterface interface {
	NotifyNewOrder(ctx context.Context, userID string, vendorID string, orderNo string, totalAmount int)
	NotifyOrderPlaced(ctx context.Context, userID string, orderID string, orderNo string, totalAmount int)
	NotifyOrderStatusUpdated(ctx context.Context, userID string, orderID string, subOrderID string, orderNo string, status string, trackingCode *string, shippingProvider *string)
	SubscribeFCMToken(ctx context.Context, userID string, token string, audience string) error
	UnsubscribeFCMToken(ctx context.Context, userID string, token string, audience string) error

	// Persistent notification methods
	CreateNotification(ctx context.Context, receiverID string, receiverType string, title string, body string, notifType string, data datatypes.JSON) error
	GetNotificationsHistory(ctx context.Context, userID string, receiverType string, page, pageSize int) ([]Notification, int64, error)
	MarkAsRead(ctx context.Context, notificationID string) error
	MarkAsReadForUser(ctx context.Context, notificationID string, userID string) error
	MarkAllAsRead(ctx context.Context, receiverID string, receiverType string) error
	GetUnreadCount(ctx context.Context, receiverID string, receiverType string) (int64, error)
	CleanupOldNotifications(ctx context.Context, olderThanDays int) (int64, error)
	GenerateFirebaseToken(ctx context.Context, userID string) (string, error)

	// OTP methods
	SendOTP(ctx context.Context, target string, targetType string, ttlMinutes int) error
	VerifyOTP(ctx context.Context, target string, targetType string, code string) (bool, error)
	SendApplicationResultEmail(ctx context.Context, msg ApplicationEventMessage) error

	// Recruiter & job approval notifications
	HandleRecruiterApproved(ctx context.Context, msg RecruiterStatusEventMessage) error
	HandleRecruiterRejected(ctx context.Context, msg RecruiterStatusEventMessage) error
	HandleJobApproved(ctx context.Context, msg JobModerationEventMessage) error
	HandleJobRejected(ctx context.Context, msg JobModerationEventMessage) error
}

// Service provides high-level notification methods.
type Service struct {
	repo               Repository
	logger             *slog.Logger
	fcmClient          *messaging.Client
	firestoreClient    *firestore.Client
	firebaseAuthClient *auth.Client
	wg                 sync.WaitGroup

	otpService   otp.Service
	emailService email.Service
	smsService   sms.Service
}

// NewService creates a new notification service.
func NewService(
	repo Repository,
	logger *slog.Logger,
	fcmProjectID string,
	fcmServiceAccountJSON string,
	otpService otp.Service,
	emailService email.Service,
	smsService sms.Service,
) *Service {
	s := &Service{
		repo:         repo,
		logger:       logger,
		otpService:   otpService,
		emailService: emailService,
		smsService:   smsService,
	}

	if strings.TrimSpace(fcmProjectID) == "" || strings.TrimSpace(fcmServiceAccountJSON) == "" {
		logger.Warn("FCM not configured; system notifications will be disabled", "fcmProjectIDSet", fcmProjectID != "")
		return s
	}

	ctx := context.Background()
	app, err := firebase.NewApp(ctx, &firebase.Config{ProjectID: fcmProjectID}, option.WithCredentialsJSON([]byte(fcmServiceAccountJSON)))
	if err != nil {
		logger.Error("failed to init firebase app", "err", err)
		return s
	}

	client, err := app.Messaging(ctx)
	if err != nil {
		logger.Error("failed to init firebase messaging client", "err", err)
		return s
	}
	s.fcmClient = client
	logger.Info("FCM service initialized successfully")

	// Initialize Firestore client for realtime notification signals
	fsClient, err := app.Firestore(ctx)
	if err != nil {
		logger.Error("failed to init firestore client", "err", err)
	} else {
		s.firestoreClient = fsClient
		logger.Info("Firestore client initialized successfully")
	}

	// Initialize Firebase Auth client for custom token generation
	authClient, err := app.Auth(ctx)
	if err != nil {
		logger.Error("failed to init firebase auth client", "err", err)
	} else {
		s.firebaseAuthClient = authClient
	}

	return s
}

// CreateNotification creates a persistent notification record.
func (s *Service) CreateNotification(ctx context.Context, receiverID string, receiverType string, title string, body string, notifType string, data datatypes.JSON) error {
	n := Notification{
		ID:            uuid.New(),
		UserID:        receiverID,
		RecipientRole: receiverType,
		Type:          notifType,
		Title:         title,
		Body:          body,
		Data:          data,
		IsRead:        false,
	}

	if err := s.repo.CreateNotification(ctx, n); err != nil {
		s.logger.ErrorContext(ctx, "failed to save notification", "err", err, "receiverID", receiverID)
		return err
	}

	return nil
}

// GetNotificationsHistory returns a paginated list of notifications for a receiver.
func (s *Service) GetNotificationsHistory(ctx context.Context, userID string, receiverType string, page, pageSize int) ([]Notification, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize

	return s.repo.GetNotifications(ctx, userID, receiverType, pageSize, offset)
}

// MarkAsRead marks a specific notification as read.
func (s *Service) MarkAsRead(ctx context.Context, notificationID string) error {
	nid, err := uuid.Parse(notificationID)
	if err != nil {
		return err
	}

	return s.repo.MarkAsRead(ctx, nid)
}

// MarkAsReadForUser marks a notification as read only if it belongs to the given user.
func (s *Service) MarkAsReadForUser(ctx context.Context, notificationID string, userID string) error {
	nid, err := uuid.Parse(notificationID)
	if err != nil {
		return err
	}
	if err := s.repo.MarkAsReadForUser(ctx, nid, userID); err != nil {
		return err
	}

	// Sync Firestore unread count — lookup notification to get RecipientRole
	notif, err := s.repo.GetNotificationByID(ctx, nid)
	if err == nil && notif != nil {
		s.syncFirestoreUnreadCount(userID, notif.RecipientRole)
	}

	return nil
}

// MarkAllAsRead marks all notifications for a receiver as read.
func (s *Service) MarkAllAsRead(ctx context.Context, receiverID string, receiverType string) error {
	if err := s.repo.MarkAllAsRead(ctx, receiverID, receiverType); err != nil {
		return err
	}

	s.syncFirestoreUnreadCount(receiverID, receiverType)
	return nil
}

// GetUnreadCount returns the current count of unread notifications for a receiver.
func (s *Service) GetUnreadCount(ctx context.Context, receiverID string, receiverType string) (int64, error) {
	return s.repo.GetUnreadCount(ctx, receiverID, receiverType)
}

func (s *Service) CleanupOldNotifications(ctx context.Context, olderThanDays int) (int64, error) {
	return s.repo.DeleteOlderThanDays(ctx, olderThanDays)
}

// SubscribeFCMToken saves a new FCM registration token for a user.
func (s *Service) SubscribeFCMToken(ctx context.Context, userID string, token string, audience string) error {
	if audience == "" {
		audience = "web-user"
	}
	tok := NewFCMToken(userID, token, audience)
	return s.repo.SaveFCMToken(ctx, &tok)
}

// UnsubscribeFCMToken removes a specific FCM token scoped to the calling user.
func (s *Service) UnsubscribeFCMToken(ctx context.Context, userID string, token string, audience string) error {
	if audience == "" {
		audience = "web-user"
	}
	return s.repo.DeleteFCMTokenByTokenAudienceAndUser(ctx, token, audience, userID)
}

func (s *Service) SendApplicationResultEmail(ctx context.Context, msg ApplicationEventMessage) error {
	return s.emailService.SendApplicationResult(ctx, msg.CandidateEmail, msg.JobTitle, msg.NewStatus, msg.RejectionReason)
}

func (s *Service) HandleRecruiterApproved(ctx context.Context, msg RecruiterStatusEventMessage) error {
	data, _ := json.Marshal(map[string]string{"recruiterId": msg.RecruiterID, "companyName": msg.CompanyName})
	body := fmt.Sprintf("Tài khoản nhà tuyển dụng của công ty %s đã được phê duyệt thành công. Bạn có thể bắt đầu đăng tin tuyển dụng.", msg.CompanyName)
	if err := s.CreateNotification(ctx, msg.RecruiterID, "RECRUITER", "Tài khoản đã được phê duyệt", body, "RECRUITER_APPROVED", data); err != nil {
		s.logger.ErrorContext(ctx, "failed to persist recruiter approved notification", "err", err)
	}
	to := msg.RecruiterEmail
	if to == "" {
		to = msg.ContactEmail
	}
	if to != "" && s.emailService != nil {
		if err := s.emailService.SendRecruiterStatus(ctx, to, msg.CompanyName, "APPROVED", ""); err != nil {
			s.logger.ErrorContext(ctx, "failed to send recruiter approved email", "to", to, "err", err)
		}
	}
	s.sendWebpushToUser(ctx, msg.RecruiterID, "/recruiter/profile", map[string]string{
		"title": "Tài khoản đã được phê duyệt",
		"body":  body,
		"url":   "/recruiter/profile",
		"type":  "RECRUITER_APPROVED",
	}, audienceForRecipientRole("RECRUITER"))
	s.syncFirestoreUnreadCount(msg.RecruiterID, "RECRUITER")
	return nil
}

func (s *Service) HandleRecruiterRejected(ctx context.Context, msg RecruiterStatusEventMessage) error {
	data, _ := json.Marshal(map[string]string{"recruiterId": msg.RecruiterID, "companyName": msg.CompanyName, "note": msg.RejectionNote})
	body := fmt.Sprintf("Tài khoản nhà tuyển dụng của công ty %s chưa được phê duyệt.", msg.CompanyName)
	if msg.RejectionNote != "" {
		body += " Lý do: " + msg.RejectionNote
	}
	if err := s.CreateNotification(ctx, msg.RecruiterID, "RECRUITER", "Tài khoản chưa được phê duyệt", body, "RECRUITER_REJECTED", data); err != nil {
		s.logger.ErrorContext(ctx, "failed to persist recruiter rejected notification", "err", err)
	}
	to := msg.RecruiterEmail
	if to == "" {
		to = msg.ContactEmail
	}
	if to != "" && s.emailService != nil {
		if err := s.emailService.SendRecruiterStatus(ctx, to, msg.CompanyName, "REJECTED", msg.RejectionNote); err != nil {
			s.logger.ErrorContext(ctx, "failed to send recruiter rejected email", "to", to, "err", err)
		}
	}
	s.sendWebpushToUser(ctx, msg.RecruiterID, "/recruiter/profile", map[string]string{
		"title": "Tài khoản chưa được phê duyệt",
		"body":  body,
		"url":   "/recruiter/profile",
		"type":  "RECRUITER_REJECTED",
	}, audienceForRecipientRole("RECRUITER"))
	s.syncFirestoreUnreadCount(msg.RecruiterID, "RECRUITER")
	return nil
}

func (s *Service) HandleJobApproved(ctx context.Context, msg JobModerationEventMessage) error {
	data, _ := json.Marshal(map[string]string{"jobId": msg.JobID, "title": msg.Title, "company": msg.Company})
	body := fmt.Sprintf("Tin tuyển dụng \"%s\" tại %s đã được phê duyệt và hiển thị công khai.", msg.Title, msg.Company)
	if err := s.CreateNotification(ctx, msg.RecruiterID, "RECRUITER", "Tin tuyển dụng đã được phê duyệt", body, "JOB_APPROVED", data); err != nil {
		s.logger.ErrorContext(ctx, "failed to persist job approved notification", "err", err)
	}
	if msg.RecruiterEmail != "" && s.emailService != nil {
		if err := s.emailService.SendJobModeration(ctx, msg.RecruiterEmail, msg.Title, msg.Company, "APPROVED", ""); err != nil {
			s.logger.ErrorContext(ctx, "failed to send job approved email", "to", msg.RecruiterEmail, "err", err)
		}
	}
	jobURL := fmt.Sprintf("/jobs/%s", msg.JobID)
	s.sendWebpushToUser(ctx, msg.RecruiterID, jobURL, map[string]string{
		"title": "Tin tuyển dụng đã được phê duyệt",
		"body":  body,
		"url":   jobURL,
		"type":  "JOB_APPROVED",
		"jobId": msg.JobID,
	}, audienceForRecipientRole("RECRUITER"))
	s.syncFirestoreUnreadCount(msg.RecruiterID, "RECRUITER")
	return nil
}

func (s *Service) HandleJobRejected(ctx context.Context, msg JobModerationEventMessage) error {
	data, _ := json.Marshal(map[string]string{"jobId": msg.JobID, "title": msg.Title, "company": msg.Company, "note": msg.ModerationNote})
	body := fmt.Sprintf("Tin tuyển dụng \"%s\" tại %s chưa được phê duyệt.", msg.Title, msg.Company)
	if msg.ModerationNote != "" {
		body += " Lý do: " + msg.ModerationNote
	}
	if err := s.CreateNotification(ctx, msg.RecruiterID, "RECRUITER", "Tin tuyển dụng chưa được phê duyệt", body, "JOB_REJECTED", data); err != nil {
		s.logger.ErrorContext(ctx, "failed to persist job rejected notification", "err", err)
	}
	if msg.RecruiterEmail != "" && s.emailService != nil {
		if err := s.emailService.SendJobModeration(ctx, msg.RecruiterEmail, msg.Title, msg.Company, "REJECTED", msg.ModerationNote); err != nil {
			s.logger.ErrorContext(ctx, "failed to send job rejected email", "to", msg.RecruiterEmail, "err", err)
		}
	}
	jobURL := fmt.Sprintf("/jobs/%s", msg.JobID)
	s.sendWebpushToUser(ctx, msg.RecruiterID, jobURL, map[string]string{
		"title": "Tin tuyển dụng chưa được phê duyệt",
		"body":  body,
		"url":   jobURL,
		"type":  "JOB_REJECTED",
		"jobId": msg.JobID,
	}, audienceForRecipientRole("RECRUITER"))
	s.syncFirestoreUnreadCount(msg.RecruiterID, "RECRUITER")
	return nil
}

func (s *Service) NotifyNewOrder(ctx context.Context, userID string, vendorID string, orderNo string, totalAmount int) {
	title := "Đơn hàng mới!"
	body := fmt.Sprintf("Mã đơn: %s - %dđ", orderNo, totalAmount)

	// 1. Persist notification to DB for history
	if userID != "" {
		data, err := json.Marshal(map[string]string{"orderNumber": orderNo, "vendorID": vendorID})
		if err != nil {
			s.logger.Error("failed to marshal new order notification data", "err", err)
		} else if err := s.CreateNotification(ctx, userID, "VENDOR", title, body, "ORDER_NEW", data); err != nil {
			s.logger.Error("failed to persist new order notification", "userID", userID, "err", err)
		}
	}

	// 2. Update Firestore signal doc (non-blocking goroutine)
	s.updateFirestoreSignal(userID, "NEW_ORDER", map[string]string{
		"audience":    audienceForRecipientRole("VENDOR"),
		"orderNumber": orderNo,
		"totalAmount": strconv.Itoa(totalAmount),
		"message":     fmt.Sprintf("Mã đơn: %s - %dđ", orderNo, totalAmount),
	})

	// 3. Send FCM push (requires valid userID + fcmClient)
	s.sendWebpushToUser(ctx, userID, "/orders", map[string]string{
		"title":       title,
		"body":        body,
		"url":         "/orders",
		"orderNumber": orderNo,
		"totalAmount": strconv.Itoa(totalAmount),
	}, audienceForRecipientRole("VENDOR"))
}

func (s *Service) NotifyOrderPlaced(ctx context.Context, userID string, orderID string, orderNo string, totalAmount int) {
	title := "Đặt hàng thành công"
	body := fmt.Sprintf("Đơn hàng %s đã được ghi nhận", orderNo)
	orderURL := fmt.Sprintf("/orders/%s", orderID)

	if userID != "" {
		data, err := json.Marshal(map[string]string{
			"orderID":     orderID,
			"orderNumber": orderNo,
		})
		if err != nil {
			s.logger.Error("failed to marshal order placed notification data", "err", err)
		} else if err := s.CreateNotification(ctx, userID, "USER", title, body, "ORDER_PLACED", data); err != nil {
			s.logger.Error("failed to persist order placed notification", "userID", userID, "orderID", orderID, "err", err)
		}
	}

	s.updateFirestoreSignal(userID, "ORDER_PLACED", map[string]string{
		"audience":    audienceForRecipientRole("USER"),
		"orderID":     orderID,
		"orderNumber": orderNo,
		"totalAmount": strconv.Itoa(totalAmount),
		"message":     body,
	})

	s.sendWebpushToUser(ctx, userID, orderURL, map[string]string{
		"title":       title,
		"body":        body,
		"url":         orderURL,
		"orderID":     orderID,
		"orderNumber": orderNo,
		"totalAmount": strconv.Itoa(totalAmount),
	}, audienceForRecipientRole("USER"))
}

func (s *Service) sendWebpushToUser(ctx context.Context, userID string, url string, data map[string]string, audience string) {
	if userID == "" || s.fcmClient == nil || !isSupportedAudience(audience) {
		return
	}

	tokens, err := s.repo.GetFCMTokensByUserIDAndAudience(ctx, userID, audience)
	if err != nil {
		s.logger.Error("failed to fetch fcm tokens", "userID", userID, "audience", audience, "err", err)
		return
	}

	if len(tokens) == 0 {
		return
	}

	// Bounded concurrency to prevent goroutine explosion under load
	sem := make(chan struct{}, 10)
	for _, t := range tokens {
		if strings.TrimSpace(t.Token) == "" {
			continue
		}

		s.wg.Add(1)
		sem <- struct{}{}
		go func(targetToken string, targetAudience string) {
			defer s.wg.Done()
			defer func() { <-sem }()

			bgCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()

			msg := &messaging.Message{
				Data:  data,
				Token: targetToken,
				Webpush: &messaging.WebpushConfig{
					Headers: map[string]string{
						"Urgency": "high",
						"TTL":     "120",
					},
					FCMOptions: &messaging.WebpushFCMOptions{
						Link: url,
					},
				},
			}

			_, err := s.fcmClient.Send(bgCtx, msg)
			if err != nil {
				s.logger.Warn("failed to send fcm message", "token", targetToken, "err", err)

				errText := strings.ToLower(err.Error())
				if strings.Contains(errText, "not-registered") ||
					strings.Contains(errText, "registration-token-not-registered") ||
					strings.Contains(errText, "invalid-registration-token") {
					_ = s.repo.DeleteFCMTokenByTokenAndAudience(bgCtx, targetToken, targetAudience)
					s.logger.Info("deleted invalid fcm token", "token", targetToken, "audience", targetAudience)
				}
				return
			}

			s.logger.Debug("FCM message sent successfully", "token", targetToken)
		}(t.Token, audience)
	}
}

func (s *Service) GenerateFirebaseToken(ctx context.Context, userID string) (string, error) {
	if s.firebaseAuthClient == nil {
		return "", fmt.Errorf("firebase auth client not initialized")
	}
	return s.firebaseAuthClient.CustomToken(ctx, userID)
}

func (s *Service) NotifyOrderStatusUpdated(ctx context.Context, userID string, orderID string, subOrderID string, orderNo string, status string, trackingCode *string, shippingProvider *string) {
	// Implementation placeholder
}

func (s *Service) SendOTP(ctx context.Context, target string, targetType string, ttlMinutes int) error {
	code, err := s.otpService.GenerateOTP(ctx, target, targetType, ttlMinutes)
	if err != nil {
		return err
	}

	switch strings.ToUpper(targetType) {
	case "EMAIL":
		return s.emailService.SendOTP(ctx, target, code, ttlMinutes)
	case "SMS":
		return s.smsService.SendOTP(ctx, target, code, ttlMinutes)
	default:
		return fmt.Errorf("unsupported target type: %s", targetType)
	}
}

func (s *Service) VerifyOTP(ctx context.Context, target string, targetType string, code string) (bool, error) {
	return s.otpService.VerifyOTP(ctx, target, targetType, code)
}

func (s *Service) syncFirestoreUnreadCount(userID string, role string) {
	if s.firestoreClient == nil {
		return
	}
	ctx := context.Background()
	unreadCount, err := s.GetUnreadCount(ctx, userID, role)
	if err != nil {
		s.logger.Error("failed to get unread count for sync", "userID", userID, "err", err)
		return
	}

	docRef := s.firestoreClient.Collection("notifications").Doc(userID)
	_, err = docRef.Set(ctx, map[string]interface{}{
		"unreadCount": unreadCount,
		"updatedAt":   time.Now(),
		"role":        role,
	}, firestore.MergeAll)
	if err != nil {
		s.logger.Error("failed to sync unread count to firestore", "userID", userID, "err", err)
	}
}

func (s *Service) updateFirestoreSignal(userID string, signalType string, data map[string]string) {
	if s.firestoreClient == nil {
		return
	}
	ctx := context.Background()
	docRef := s.firestoreClient.Collection("signals").Doc(userID)

	payload := map[string]interface{}{
		"type":      signalType,
		"data":      data,
		"timestamp": time.Now(),
	}

	_, err := docRef.Set(ctx, payload)
	if err != nil {
		s.logger.Error("failed to update firestore signal", "userID", userID, "err", err)
	}
}

func audienceForRecipientRole(role string) string {
	switch role {
	case "VENDOR":
		return "web-vendor"
	case "ADMIN":
		return "web-admin"
	case "RECRUITER":
		return "web-recruiter"
	default:
		return "web-user"
	}
}

func isSupportedAudience(audience string) bool {
	switch audience {
	case "web-user", "web-vendor", "web-admin", "web-recruiter":
		return true
	default:
		return false
	}
}
