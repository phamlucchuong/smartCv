package pkg

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v5"
)

// Standard error codes for API responses.
const (
	CodeBadRequest        = "BAD_REQUEST"
	CodeUnauthorized      = "UNAUTHORIZED"
	CodeForbidden         = "FORBIDDEN"
	CodeNotFound          = "NOT_FOUND"
	CodeConflict          = "CONFLICT"
	CodeValidationError   = "VALIDATION_ERROR"
	CodeInternalError     = "INTERNAL_ERROR"
	CodeInsufficientStock = "INSUFFICIENT_STOCK"
)

// APIResponse is the standard envelope for all JSON responses.
type APIResponse struct {
	Data      interface{}     `json:"data"`
	Error     *APIError       `json:"error"`
	Meta      *PaginationMeta `json:"meta"`
	Timestamp string          `json:"timestamp"`
}

// PaginationMeta describes the pagination details for list responses.
type PaginationMeta struct {
	Page       int `json:"page"`
	PageSize   int `json:"pageSize"`
	TotalItems int `json:"total"`
	TotalPages int `json:"totalPages"`
}

// APIError describes an error returned to the client.
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Status  int    `json:"status"`
}

func now() string {
	return time.Now().UTC().Format(time.RFC3339)
}

// JSONOK sends a 200 response with data.
func JSONOK(c *echo.Context, data interface{}) error {
	return c.JSON(http.StatusOK, APIResponse{Data: data, Timestamp: now()})
}

// JSONList sends a 200 response with data array and pagination meta at the top level.
func JSONList(c *echo.Context, data interface{}, meta PaginationMeta) error {
	return c.JSON(http.StatusOK, APIResponse{Data: data, Meta: &meta, Timestamp: now()})
}

// JSONCreated sends a 201 response with data.
func JSONCreated(c *echo.Context, data interface{}) error {
	return c.JSON(http.StatusCreated, APIResponse{Data: data, Timestamp: now()})
}

// JSONError sends an error response with the given status code.
func JSONError(c *echo.Context, status int, code, message string) error {
	return c.JSON(status, APIResponse{
		Error:     &APIError{Code: code, Message: message, Status: status},
		Timestamp: now(),
	})
}
