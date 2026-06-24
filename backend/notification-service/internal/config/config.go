package config

import (
	"github.com/spf13/viper"
)

type Config struct {
	Port      string `mapstructure:"NOTI_SERVICE_PORT"`
	PSQL_DSN  string `mapstructure:"PSQL_DSN"`
	RedisHost string `mapstructure:"REDIS_HOST"`
	RedisPort string `mapstructure:"REDIS_PORT"`
	// AllowedOrigins []string `mapstructure:"ALLOWED_ORIGINS"`
	Environment string `mapstructure:"ENVIRONMENT"`

	// SMTP configuration for email delivery.
	SMTPHost     string `mapstructure:"SMTP_HOST"`
	SMTPPort     string `mapstructure:"SMTP_PORT"`
	SMTPUser     string `mapstructure:"SMTP_USER"`
	SMTPPassword string `mapstructure:"SMTP_PASSWORD"`
	SMTPFrom     string `mapstructure:"SMTP_FROM"`
	SMTPName     string `mapstructure:"SMTP_NAME"`

	// Twilio configuration for SMS delivery.
	TwilioAccountSID string `mapstructure:"TWILIO_ACCOUNT_SID"`
	TwilioAuthToken  string `mapstructure:"TWILIO_AUTH_TOKEN"`
	TwilioFromNumber string `mapstructure:"TWILIO_FROM_NUMBER"`

	// RabbitMQ configuration
	RabbitMQHost     string `mapstructure:"RABBITMQ_HOST"`
	RabbitMQPort     string `mapstructure:"RABBITMQ_PORT"`
	RabbitMQUser     string `mapstructure:"RABBITMQ_USER"`
	RabbitMQPassword string `mapstructure:"RABBITMQ_PASSWORD"`

	// Firebase Cloud Messaging configuration for browser push notifications.
	FCMProjectID          string `mapstructure:"FCM_PROJECT_ID"`
	FCMServiceAccountJSON string `mapstructure:"FCM_SERVICE_ACCOUNT_JSON"`
}

func Load() (*Config, error) {
	viper.SetConfigFile("../.env")
	viper.SetConfigType("env")
	viper.AutomaticEnv()

	viper.SetDefault("NOTI_SERVICE_PORT", "8084")
	viper.SetDefault("PSQL_DSN", "")
	viper.SetDefault("REDIS_HOST", "localhost")
	viper.SetDefault("REDIS_PORT", "6379")
	viper.SetDefault("SMTP_HOST", "smtp.gmail.com")
	viper.SetDefault("SMTP_PORT", "587")
	viper.SetDefault("SMTP_FROM", "Smart CV <noreply@smartcv.com>")
	viper.SetDefault("SMTP_NAME", "Smart CV")
	viper.SetDefault("TWILIO_ACCOUNT_SID", "")
	viper.SetDefault("TWILIO_AUTH_TOKEN", "")
	viper.SetDefault("TWILIO_FROM_NUMBER", "")
	viper.SetDefault("RABBITMQ_HOST", "localhost")
	viper.SetDefault("RABBITMQ_PORT", "5672")
	viper.SetDefault("RABBITMQ_USER", "admin")
	viper.SetDefault("RABBITMQ_PASSWORD", "admin123")

	_ = viper.ReadInConfig()

	cfg := &Config{}
	if err := viper.Unmarshal(cfg); err != nil {
		return nil, err
	}

	return cfg, nil
}
