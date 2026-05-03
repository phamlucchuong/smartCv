package notification

import (
	"smartCv/notification-service/internal/pkg"

	"gorm.io/datatypes"
)

type NotificationResponse struct {
	ID            string         `json:"id"`
	ReceiverID    string         `json:"receiverId"`
	RecipientRole string         `json:"receiverType"`
	Type          string         `json:"type"`
	Title         string         `json:"title"`
	Body          string         `json:"body"`
	Data          datatypes.JSON `json:"data,omitempty"`
	IsRead        bool           `json:"isRead"`
	ReadAt        *string        `json:"readAt,omitempty"`
	CreatedAt     string         `json:"createdAt"`
}

type ListNotificationsResponse struct {
	Data        []NotificationResponse `json:"items"`
	UnreadCount int64                  `json:"unreadCount"`
	Meta        pkg.PaginationMeta     `json:"meta"`
}
