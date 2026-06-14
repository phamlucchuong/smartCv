import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Button } from '@smart-cv/ui'
import { useVerifyCandidateRegistration, useResendRegistrationOtp } from '@smart-cv/api'
import type { VerifyRegistrationRequestVerificationType } from '@smart-cv/api'

interface Props {
  open: boolean
  contact: string
  verificationType: VerifyRegistrationRequestVerificationType
  onSuccess: () => void
  onClose: () => void
}

function maskContact(contact: string): string {
  if (contact.includes('@')) {
    const [local, domain] = contact.split('@')
    return `${local.charAt(0)}***@${domain}`
  }
  return `${contact.slice(0, 3)}***${contact.slice(-2)}`
}

export function OtpVerifyModal({ open, contact, verificationType, onSuccess, onClose }: Props) {
  const [digits, setDigits] = React.useState<string[]>(Array(6).fill(''))
  const [countdown, setCountdown] = React.useState(60)
  const [error, setError] = React.useState('')
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

  const verify = useVerifyCandidateRegistration()
  const resend = useResendRegistrationOtp()

  React.useEffect(() => {
    if (!open) return
    setDigits(Array(6).fill(''))
    setError('')
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [open])

  function handleChange(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = char
    setDigits(next)
    if (char && index < 5) inputRefs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = digits.join('')
    if (code.length < 6) return
    setError('')
    try {
      await verify.mutateAsync({ data: { contact, verificationType, code } })
      onSuccess()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Invalid OTP. Please try again.')
    }
  }

  async function handleResend() {
    if (countdown > 0) return
    setError('')
    try {
      await resend.mutateAsync({ data: { contact, preferredVerification: verificationType } })
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(timer); return 0 }
          return c - 1
        })
      }, 1000)
    } catch {
      setError('Failed to resend OTP. Please try again.')
    }
  }

  const code = digits.join('')

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Verify your account</DialogTitle>
          <DialogDescription>
            Enter the 6-digit code sent to <strong>{maskContact(contact)}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-12 w-10 rounded-md border border-input bg-background text-center text-lg font-semibold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ))}
          </div>

          {error && <p className="text-center text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className="h-11 w-full"
            disabled={code.length < 6 || verify.isPending}
          >
            {verify.isPending ? 'Verifying...' : 'Verify'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          {countdown > 0 ? (
            <span>Resend in {countdown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resend.isPending}
              className="text-primary hover:underline disabled:opacity-50"
            >
              {resend.isPending ? 'Sending...' : 'Resend OTP'}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
