package email

import (
	"bytes"
	"embed"
	"fmt"
	"html/template"
)

//go:embed templates/*.html
var templateFS embed.FS

var otpTemplate = template.Must(template.ParseFS(templateFS, "templates/otp.html"))
var applicationResultTemplate = template.Must(template.ParseFS(templateFS, "templates/application_result.html"))

type otpTemplateData struct {
	Code       string
	TTLMinutes int
}

type applicationResultData struct {
	JobTitle        string
	Status          string
	RejectionReason string
}

func renderOTPEmail(code string, ttlMinutes int) (htmlBody, plain string) {
	plain = fmt.Sprintf(
		"Mã xác thực Smart CV\n\nMã xác thực của bạn là: %s\n\nMã có hiệu lực trong %d phút.\nNếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.",
		code, ttlMinutes,
	)

	var buf bytes.Buffer
	data := otpTemplateData{Code: code, TTLMinutes: ttlMinutes}
	if err := otpTemplate.Execute(&buf, data); err != nil {
		return plain, plain
	}

	return buf.String(), plain
}

func renderApplicationResultEmail(jobTitle, status, rejectionReason string) (htmlBody, plain string) {
	plain = fmt.Sprintf("Kết quả ứng tuyển %s: %s", jobTitle, status)
	if rejectionReason != "" {
		plain += "\nLý do: " + rejectionReason
	}

	var buf bytes.Buffer
	data := applicationResultData{JobTitle: jobTitle, Status: status, RejectionReason: rejectionReason}
	if err := applicationResultTemplate.Execute(&buf, data); err != nil {
		return plain, plain
	}
	return buf.String(), plain
}
