package config

import (
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Port           string   `mapstructure:"PORT"`
	DatabaseURL    string   `mapstructure:"DATABASE_URL"`
	RedisAddr      string   `mapstructure:"REDIS_ADDR"`
	AllowedOrigins []string `mapstructure:"ALLOWED_ORIGINS"`
	Environment    string   `mapstructure:"ENVIRONMENT"`

	// SMTP configuration for email delivery.
	SMTPHost     string `mapstructure:"SMTP_HOST"`
	SMTPPort     string `mapstructure:"SMTP_PORT"`
	SMTPUser     string `mapstructure:"SMTP_USER"`
	SMTPPassword string `mapstructure:"SMTP_PASSWORD"`
	SMTPFrom     string `mapstructure:"SMTP_FROM"`
}

func Load() (*Config, error) {
	viper.SetConfigFile(".env")
	viper.SetConfigType("env")
	viper.AutomaticEnv()

	viper.SetDefault("PORT", "8084")
	viper.SetDefault("DATABASE_URL", "postgres://gouser:gopass123@localhost:5432/hannah_go?sslmode=disable")
	viper.SetDefault("REDIS_ADDR", "localhost:6379")
	viper.SetDefault("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
	viper.SetDefault("SMTP_HOST", "smtp.gmail.com")
	viper.SetDefault("SMTP_PORT", "587")
	viper.SetDefault("SMTP_FROM", "Hannah Olala <noreply@hannaholala.com>")

	_ = viper.ReadInConfig()

	cfg := &Config{}
	if err := viper.Unmarshal(cfg); err != nil {
		return nil, err
	}

	if len(cfg.AllowedOrigins) == 1 {
		cfg.AllowedOrigins = strings.Split(cfg.AllowedOrigins[0], ",")
	}

	return cfg, nil
}
