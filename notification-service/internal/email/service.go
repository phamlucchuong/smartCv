package email

import "context"

type EmailProvider interface {
	SendOTP(ctx context.Context, to string, code string, ttlMinutes int) error
	SendApplicationResult(ctx context.Context, to, jobTitle, status, rejectionReason string) error
}

type Service interface {
	SendOTP(ctx context.Context, to string, code string, ttlMinutes int) error
	SendApplicationResult(ctx context.Context, to, jobTitle, status, rejectionReason string) error
}

type emailService struct {
	provider EmailProvider
}

func NewService(provider EmailProvider) Service {
	return &emailService{provider: provider}
}

func (s *emailService) SendOTP(ctx context.Context, to string, code string, ttlMinutes int) error {
	return s.provider.SendOTP(ctx, to, code, ttlMinutes)
}

func (s *emailService) SendApplicationResult(ctx context.Context, to, jobTitle, status, rejectionReason string) error {
	return s.provider.SendApplicationResult(ctx, to, jobTitle, status, rejectionReason)
}
