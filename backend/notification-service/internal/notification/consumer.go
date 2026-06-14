package notification

import (
	"context"
	"encoding/json"
	"log/slog"

	amqp "github.com/rabbitmq/amqp091-go"
)

type Consumer struct {
	conn    *amqp.Connection
	notiSvc ServiceInterface
	logger  *slog.Logger
}

func NewConsumer(conn *amqp.Connection, notiSvc ServiceInterface, logger *slog.Logger) *Consumer {
	return &Consumer{
		conn:    conn,
		notiSvc: notiSvc,
		logger:  logger,
	}
}

type OTPMessage struct {
	Target     string `json:"target"`
	TargetType string `json:"targetType"`
}

type ApplicationEventMessage struct {
	ApplicationID   string `json:"applicationId"`
	CandidateID     string `json:"candidateId"`
	CandidateEmail  string `json:"candidateEmail"`
	RecruiterID     string `json:"recruiterId"`
	JobID           string `json:"jobId"`
	JobTitle        string `json:"jobTitle"`
	NewStatus       string `json:"newStatus"`
	RejectionReason string `json:"rejectionReason,omitempty"`
	OccurredAt      string `json:"occurredAt"`
}

func (c *Consumer) Listen() error {
	ch, err := c.conn.Channel()
	if err != nil {
		return err
	}

	err = ch.ExchangeDeclare(
		"notification.exchange",
		"direct",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return err
	}

	q, err := ch.QueueDeclare(
		"otp.queue",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return err
	}

	err = ch.QueueBind(
		q.Name,
		"otp.routing.key",
		"notification.exchange",
		false,
		nil,
	)
	if err != nil {
		return err
	}

	msgs, err := ch.Consume(
		q.Name,
		"",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		return err
	}

	go func() {
		for d := range msgs {
			var msg OTPMessage
			if err := json.Unmarshal(d.Body, &msg); err != nil {
				c.logger.Error("failed to unmarshal otp message", "error", err)
				continue
			}

			c.logger.Info("received otp message from rabbitmq", "target", msg.Target, "type", msg.TargetType)

			err := c.notiSvc.SendOTP(context.Background(), msg.Target, msg.TargetType, 1)
			if err != nil {
				c.logger.Error("failed to send otp from consumer", "error", err)
			}
		}
	}()

	c.logger.Info("RabbitMQ consumer is listening on otp.queue")
	return nil
}

func (c *Consumer) ListenApplicationEvents() error {
	ch, err := c.conn.Channel()
	if err != nil {
		return err
	}

	err = ch.ExchangeDeclare("application.exchange", "direct", true, false, false, false, nil)
	if err != nil {
		return err
	}

	queues := []struct {
		name       string
		routingKey string
	}{
		{"application.accepted.queue", "application.accepted"},
		{"application.rejected.queue", "application.rejected"},
		{"application.withdrawn.queue", "application.withdrawn"},
	}

	var allMsgs []<-chan amqp.Delivery
	for _, q := range queues {
		queue, err := ch.QueueDeclare(q.name, true, false, false, false, nil)
		if err != nil {
			return err
		}
		if err = ch.QueueBind(queue.Name, q.routingKey, "application.exchange", false, nil); err != nil {
			return err
		}
		msgs, err := ch.Consume(queue.Name, "", true, false, false, false, nil)
		if err != nil {
			return err
		}
		allMsgs = append(allMsgs, msgs)
	}

	for _, msgs := range allMsgs {
		go func(deliveries <-chan amqp.Delivery) {
			for d := range deliveries {
				var msg ApplicationEventMessage
				if err := json.Unmarshal(d.Body, &msg); err != nil {
					c.logger.Error("failed to unmarshal application event", "error", err)
					continue
				}
				c.handleApplicationEvent(msg)
			}
		}(msgs)
	}

	c.logger.Info("RabbitMQ consumer listening on application event queues")
	return nil
}

func (c *Consumer) handleApplicationEvent(msg ApplicationEventMessage) {
	if msg.CandidateEmail == "" {
		c.logger.Warn("application event missing candidateEmail, skipping", "applicationId", msg.ApplicationID)
		return
	}

	c.logger.Info("processing application event", "applicationId", msg.ApplicationID, "status", msg.NewStatus)

	ctx := context.Background()
	if err := c.notiSvc.SendApplicationResultEmail(ctx, msg); err != nil {
		c.logger.Error("failed to send application result email", "applicationId", msg.ApplicationID, "error", err)
	}
}
