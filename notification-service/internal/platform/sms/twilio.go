package sms

import (
	"context"
	"fmt"
	"strings"

	"github.com/twilio/twilio-go"
	twilioApi "github.com/twilio/twilio-go/rest/api/v2010"
)

type TwilioProvider struct {
	client     *twilio.RestClient
	fromNumber string
}

func NewTwilioProvider(accountSID, authToken, fromNumber string) *TwilioProvider {
	if accountSID == "" || authToken == "" {
		return nil
	}
	client := twilio.NewRestClientWithParams(twilio.ClientParams{
		Username: accountSID,
		Password: authToken,
	})
	return &TwilioProvider{
		client:     client,
		fromNumber: fromNumber,
	}
}

func formatPhoneNumber(phone string) string {
	phone = strings.TrimSpace(phone)

	if strings.HasPrefix(phone, "0") {
		return "+84" + phone[1:]
	}

	if !strings.HasPrefix(phone, "+") {
		return "+" + phone
	}

	return phone
}

func (p *TwilioProvider) SendOTP(ctx context.Context, to string, code string, ttlMinutes int) error {
	message := fmt.Sprintf("Ma xac thuc Smart CV cua ban la: %s. Ma co hieu luc trong %d phut.", code, ttlMinutes)

	params := &twilioApi.CreateMessageParams{}
	params.SetTo(formatPhoneNumber(to))
	params.SetFrom(p.fromNumber)
	params.SetBody(message)

	resp, err := p.client.Api.CreateMessage(params)
	if err != nil {
		return fmt.Errorf("twilio send sms: %w", err)
	}

	if resp.ErrorCode != nil {
		return fmt.Errorf("twilio send sms error: %s", *resp.ErrorMessage)
	}

	return nil
}
