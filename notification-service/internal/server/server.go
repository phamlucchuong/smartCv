package server

import (
	"context"
	"log/slog"
	"smartCv/notification-service/internal/config"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type Server struct {
	echo *echo.Echo
	cfg  *config.Config
	log  *slog.Logger
	db   *gorm.DB
	rdb  *redis.Client
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

	//uow := db.NewUnitOfWork(gormDB)
	//emailSvc := email.NewService(cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUser, cfg.SMTPPassword, cfg.SMTPFrom)

	s.echo.Validator = NewValidator()
	s.setupMiddleware()
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
