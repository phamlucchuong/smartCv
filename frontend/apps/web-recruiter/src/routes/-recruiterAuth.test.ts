import { describe, expect, it } from 'vitest'
import {
  buildRecruiterRegistrationPayload,
  hasRecruiterRole,
  ensureRecruiterRole,
  extractAuthTokens,
} from '../lib/recruiterAuth'

function createJwt(payload: Record<string, unknown>) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.signature`
}

describe('recruiterAuth', () => {
  it('extracts access and refresh tokens from the API envelope', () => {
    const tokens = extractAuthTokens({
      data: {
        token: 'access-token',
        refreshToken: 'refresh-token',
      },
    })

    expect(tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    })
  })

  it('throws when the login or verification response does not include tokens', () => {
    expect(() => extractAuthTokens({ data: { token: 'access-token' } })).toThrow(
      'Invalid token response',
    )
  })

  it('rejects tokens that are not for recruiters', () => {
    const candidateToken = createJwt({
      sub: 'u1',
      email: 'candidate@company.com',
      scope: 'ROLE_CANDIDATE',
    })

    expect(() => ensureRecruiterRole(candidateToken)).toThrow(
      'This account does not have recruiter access.',
    )
  })

  it('accepts recruiter tokens', () => {
    const recruiterToken = createJwt({
      sub: 'u1',
      email: 'hr@company.com',
      scope: 'ROLE_RECRUITER recruiter:write',
    })

    expect(() => ensureRecruiterRole(recruiterToken)).not.toThrow()
    expect(hasRecruiterRole(recruiterToken)).toBe(true)
  })

  it('treats malformed or non-recruiter tokens as invalid recruiter sessions', () => {
    const candidateToken = createJwt({
      sub: 'u1',
      email: 'candidate@company.com',
      scope: 'ROLE_CANDIDATE',
    })

    expect(hasRecruiterRole(candidateToken)).toBe(false)
    expect(hasRecruiterRole('not-a-jwt')).toBe(false)
  })

  it('includes companyName in the registration payload', () => {
    expect(
      buildRecruiterRegistrationPayload({
        companyName: 'ACME',
        fullname: 'Recruiter User',
        email: 'hr@company.com',
        phone: '0901234567',
        password: 'password123',
      }),
    ).toEqual({
      companyName: 'ACME',
      fullname: 'Recruiter User',
      email: 'hr@company.com',
      phone: '0901234567',
      password: 'password123',
      preferredVerification: 'EMAIL',
      role: 'RECRUITER',
    })
  })
})
