package server

import (
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v5"
)

// CustomValidator wraps go-playground/validator for Echo v5.
type CustomValidator struct {
	validator *validator.Validate
}

func NewValidator() *CustomValidator {
	return &CustomValidator{validator: validator.New()}
}

func (cv *CustomValidator) Validate(i interface{}) error {
	if err := cv.validator.Struct(i); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return nil
}
