package rabbitmq

import (
	"fmt"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

// NewRabbitMQConnection creates a new connection to RabbitMQ.
func NewRabbitMQConnection(user, password, host, port string) (*amqp.Connection, error) {
	url := fmt.Sprintf("amqp://%s:%s@%s:%s/", user, password, host, port)
	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	log.Println("Connected to RabbitMQ")
	return conn, nil
}

// CloseConnection closes the RabbitMQ connection.
func CloseConnection(conn *amqp.Connection) {
	if conn != nil {
		conn.Close()
	}
}
