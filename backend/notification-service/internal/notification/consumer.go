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

func (c *Consumer) Listen() error {
	ch, err := c.conn.Channel()
	if err != nil {
		return err
	}

	// Declare exchange (optional if already created by producer, but good practice)
	err = ch.ExchangeDeclare(
		"notification.exchange", // name
		"direct",                // type
		true,                    // durable
		false,                   // auto-deleted
		false,                   // internal
		false,                   // no-wait
		nil,                     // arguments
	)
	if err != nil {
		return err
	}

	q, err := ch.QueueDeclare(
		"otp.queue", // name
		true,        // durable
		false,       // delete when unused
		false,       // exclusive
		false,       // no-wait
		nil,         // arguments
	)
	if err != nil {
		return err
	}

	err = ch.QueueBind(
		q.Name,                  // queue name
		"otp.routing.key",       // routing key
		"notification.exchange", // exchange
		false,
		nil,
	)
	if err != nil {
		return err
	}

	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
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

			// Send OTP using the existing service
			err := c.notiSvc.SendOTP(context.Background(), msg.Target, msg.TargetType, 5)
			if err != nil {
				c.logger.Error("failed to send otp from consumer", "error", err)
			}
		}
	}()

	c.logger.Info("RabbitMQ consumer is listening on otp.queue")
	return nil
}
