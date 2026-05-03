package server

import (
	"context"
	"log/slog"
	"smartCv/notification-service/internal/config"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"smartCv/notification-service/internal/email"
	"smartCv/notification-service/internal/notification"
	"smartCv/notification-service/internal/otp"
	platformEmail "smartCv/notification-service/internal/platform/email"
	platformSms "smartCv/notification-service/internal/platform/sms"
	"smartCv/notification-service/internal/sms"
)

type Server struct {
	echo *echo.Echo
	cfg  *config.Config
	log  *slog.Logger
	db   *gorm.DB
	rdb  *redis.Client

	notiSvc notification.ServiceInterface

	notiHandler *notification.Handler
	otpHandler  *otp.Handler
}

func New(cfg *config.Config, log *slog.Logger, gormDB *gorm.DB, rdb *redis.Client) *Server {
	e := echo.New()

	s := &Server{
		echo: e,
		cfg:  cfg,
		log:  log,
		db:   gormDB,
		rdb:  rdb,
	}

	// 1. Initialize Platforms/Adapters
	emailProvider := platformEmail.NewService(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPassword, cfg.SMTPFrom, cfg.SMTPName)
	smsProvider := platformSms.NewTwilioProvider(cfg.TwilioAccountSID, cfg.TwilioAuthToken, cfg.TwilioFromNumber)

	// 2. Initialize Domain Services
	emailSvc := email.NewService(emailProvider)
	smsSvc := sms.NewService(smsProvider)
	otpSvc := otp.NewService(rdb)

	// 3. Initialize Orchestrator
	repo := notification.NewRepository(gormDB)
	s.notiSvc = notification.NewService(
		repo,
		log,
		"", // FCM Project ID
		"", // FCM Service Account JSON
		otpSvc,
		emailSvc,
		smsSvc,
	)

	s.notiHandler = notification.NewHandler(s.notiSvc, log)
	s.otpHandler = otp.NewHandler(s.notiSvc, log)

	s.echo.Validator = NewValidator()
	// s.setupMiddleware()
	s.setupRoutes()

	return s
}

// Start runs the HTTP server and blocks until ctx is cancelled, then shuts down gracefully.
func (s *Server) Start(ctx context.Context) error {
	s.log.Info("server starting", slog.String("port", s.cfg.Port))

	go func() {
		<-ctx.Done()
	}()

	sc := echo.StartConfig{
		Address:         ":" + s.cfg.Port,
		GracefulTimeout: 10 * time.Second,
		HideBanner:      true,
	}

	return sc.Start(ctx, s.echo)
}
