package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"smartCv/notification-service/internal/config"
	"smartCv/notification-service/internal/logger"
	"smartCv/notification-service/internal/platform/cache"
	"smartCv/notification-service/internal/platform/db"
	"smartCv/notification-service/internal/server"
	"syscall"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", slog.Any("error", err))
		os.Exit(1)
	}

	log := logger.New(cfg.Environment)
	slog.SetDefault(log)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	gormDB, err := db.NewGormDB(cfg.PSQL_DSN)
	if err != nil {
		log.Error("failed to connect to database", slog.Any("error", err))
		os.Exit(1)
	}

	rdb := cache.NewRedisClient(cfg.RedisHost + ":" + cfg.RedisPort)
	defer rdb.Close()

	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Error("failed to connect to redis", slog.Any("error", err))
		os.Exit(1)
	}

	// srv := server.New(cfg, log, gormDB, rdb)
	srv := server.New(cfg, log, gormDB, rdb)

	log.Info("shutting down server...")
	if err := srv.Start(ctx); err != nil {
		log.Error("server error", slog.Any("error", err))
		os.Exit(1)
	}
}
