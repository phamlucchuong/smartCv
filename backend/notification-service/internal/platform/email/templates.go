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

// orderTemplate = template.Must(template.ParseFS(templateFS, "templates/order.html"))

// otpTemplateData holds data for the OTP email template.
type otpTemplateData struct {
	Code       string
	TTLMinutes int
}

// NewOrderEmailData holds data for the new order notification email.
// type NewOrderEmailData struct {
// 	OrderNumber     string
// 	Date            string
// 	CustomerName    string
// 	CustomerPhone   string
// 	CustomerAddress string
// 	Subtotal        string
// 	ShippingFee     string
// 	TotalAmount     string
// 	Notes           string
// 	OrderUrl        string
// 	Items           []OrderItemDetail
// }

// OrderItemDetail holds minimal item data for the email template.
// type OrderItemDetail struct {
// 	Name      string
// 	Quantity  int
// 	UnitPrice string
// 	Subtotal  string
// }

// renderOTPEmail returns HTML and plain text bodies for an OTP verification email.
func renderOTPEmail(code string, ttlMinutes int) (htmlBody, plain string) {
	plain = fmt.Sprintf(
		"Mã xác thực Smart CV\n\nMã xác thực của bạn là: %s\n\nMã có hiệu lực trong %d phút.\nNếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.",
		code, ttlMinutes,
	)

	var buf bytes.Buffer
	data := otpTemplateData{Code: code, TTLMinutes: ttlMinutes}
	if err := otpTemplate.Execute(&buf, data); err != nil {
		// Fallback to plain text if template fails.
		return plain, plain
	}

	return buf.String(), plain
}

// renderNewOrderEmail returns HTML and plain text bodies for new order notification email.
// func renderNewOrderEmail(data NewOrderEmailData) (htmlBody, plain string) {
// 	var itemsText bytes.Buffer
// 	for _, item := range data.Items {
// 		itemsText.WriteString(fmt.Sprintf("- %s (x%d): %s\n", item.Name, item.Quantity, item.Subtotal))
// 	}
//
// 	plain = fmt.Sprintf(
// 		"Bạn có đơn hàng mới #%s\n\nKhách hàng: %s\nSố điện thoại: %s\nĐịa chỉ: %s\nTổng tiền: %s\n\nChi tiết:\n%s\n\nVui lòng truy cập trang quản trị để xử lý đơn hàng.",
// 		data.OrderNumber, data.CustomerName, data.CustomerPhone, data.CustomerAddress, data.TotalAmount, itemsText.String(),
// 	)
//
// 	var buf bytes.Buffer
// 	if err := orderTemplate.Execute(&buf, data); err != nil {
// 		// Fallback to plain text if template fails.
// 		return plain, plain
// 	}
//
// 	return buf.String(), plain
// }
