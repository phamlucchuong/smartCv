import { jwtDecode } from 'jwt-decode'

interface JwtPayload {
  scope?: string
}

interface AuthEnvelope {
  data?: {
    token?: string
    refreshToken?: string
  }
}

interface RecruiterSignupValues {
  companyName: string
  fullname: string
  email: string
  phone: string
  password?: string
}

export function extractAuthTokens(result: AuthEnvelope) {
  const accessToken = result.data?.token
  const refreshToken = result.data?.refreshToken

  if (!accessToken || !refreshToken) {
    throw new Error('Invalid token response')
  }

  return { accessToken, refreshToken }
}

export function hasRecruiterRole(accessToken: string) {
  try {
    const payload = jwtDecode<JwtPayload>(accessToken)
    const scopes = payload.scope?.split(' ') ?? []
    return scopes.includes('ROLE_RECRUITER')
  } catch {
    return false
  }
}

export function ensureRecruiterRole(accessToken: string) {
  if (!hasRecruiterRole(accessToken)) {
    throw new Error('This account does not have recruiter access.')
  }
}

export function buildRecruiterRegistrationPayload(values: RecruiterSignupValues) {
  return {
    companyName: values.companyName.trim(),
    fullname: values.fullname.trim(),
    email: values.email.trim(),
    password: values.password ?? '',
    phone: values.phone.trim(),
    preferredVerification: 'EMAIL' as const,
    role: 'RECRUITER',
  }
}
