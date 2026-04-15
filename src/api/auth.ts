const AUTH_URL = import.meta.env.VITE_AUTH_URL

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export async function tossLogin(authorizationCode: string, referrer: string): Promise<AuthTokens> {
  const res = await fetch(`${AUTH_URL}/api/auth/toss/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorizationCode, referrer: referrer === 'null' ? 'DEFAULT' : referrer }),
  })
  const data = await res.json()
  if (!res.ok) throw { status: res.status, data }
  return data.data
}

export async function tossRegister(authorizationCode: string, referrer: string): Promise<AuthTokens> {
  const res = await fetch(`${AUTH_URL}/api/auth/toss/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorizationCode, referrer: referrer === 'null' ? 'DEFAULT' : referrer }),
  })
  const data = await res.json()
  if (!res.ok) throw { status: res.status, data }
  return data.data
}

export async function reissueToken(refreshToken: string): Promise<AuthTokens> {
  const res = await fetch(`${AUTH_URL}/api/auth/reissue-token`, {
    headers: { 'x-auth-token': refreshToken },
  })
  const data = await res.json()
  if (!res.ok) throw { status: res.status, data }
  return data.data
}
