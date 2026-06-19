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
var recruiterStatusTemplate = template.Must(template.ParseFS(templateFS, "templates/recruiter_status.html"))
var jobModerationTemplate = template.Must(template.ParseFS(templateFS, "templates/job_moderation.html"))

type otpTemplateData struct {
	Code       string
	TTLMinutes int
}

type applicationResultData struct {
	JobTitle        string
	Status          string
	RejectionReason string
}

type recruiterStatusData struct {
	CompanyName string
	Status      string
	Note        string
}

type jobModerationData struct {
	JobTitle string
	Company  string
	Status   string
	Note     string
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

func renderRecruiterStatusEmail(companyName, status, note string) (htmlBody, plain string) {
	if status == "APPROVED" {
		plain = fmt.Sprintf("Tài khoản nhà tuyển dụng của công ty %s đã được phê duyệt thành công.", companyName)
	} else {
		plain = fmt.Sprintf("Tài khoản nhà tuyển dụng của công ty %s chưa được phê duyệt.", companyName)
		if note != "" {
			plain += "\nLý do: " + note
		}
	}
	var buf bytes.Buffer
	data := recruiterStatusData{CompanyName: companyName, Status: status, Note: note}
	if err := recruiterStatusTemplate.Execute(&buf, data); err != nil {
		return plain, plain
	}
	return buf.String(), plain
}

func renderJobModerationEmail(jobTitle, company, status, note string) (htmlBody, plain string) {
	if status == "APPROVED" {
		plain = fmt.Sprintf("Tin tuyển dụng \"%s\" tại %s đã được phê duyệt và hiển thị công khai.", jobTitle, company)
	} else {
		plain = fmt.Sprintf("Tin tuyển dụng \"%s\" tại %s chưa được phê duyệt.", jobTitle, company)
		if note != "" {
			plain += "\nLý do: " + note
		}
	}
	var buf bytes.Buffer
	data := jobModerationData{JobTitle: jobTitle, Company: company, Status: status, Note: note}
	if err := jobModerationTemplate.Execute(&buf, data); err != nil {
		return plain, plain
	}
	return buf.String(), plain
}
