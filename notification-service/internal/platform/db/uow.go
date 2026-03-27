package db

import (
	"context"

	"gorm.io/gorm"
)

// UnitOfWork provides a single entrypoint for running multiple DB operations
// inside one PostgreSQL transaction. The callback receives a scoped *gorm.DB
// that commits on nil return and rolls back on error.
type UnitOfWork interface {
	Do(ctx context.Context, fn func(tx *gorm.DB) error) error
}

// gormUnitOfWork implements UnitOfWork using GORM's built-in Transaction helper.
type gormUnitOfWork struct {
	db *gorm.DB
}

// NewUnitOfWork constructs a UnitOfWork backed by the given GORM connection.
func NewUnitOfWork(db *gorm.DB) UnitOfWork {
	return &gormUnitOfWork{db: db}
}

// Do executes fn inside a database transaction.
// If fn returns nil the transaction is committed; otherwise it is rolled back.
func (u *gormUnitOfWork) Do(ctx context.Context, fn func(tx *gorm.DB) error) error {
	return u.db.WithContext(ctx).Transaction(fn)
}
