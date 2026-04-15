import { authStore } from '../store/auth'
import { reissueToken } from './auth'

async function refreshAccessToken(): Promise<string> {
  const refreshToken = authStore.getRefreshToken()
  if (!refreshToken) throw new Error('no refresh token')

  const tokens = await reissueToken(refreshToken)
  authStore.setTokens(tokens.accessToken, tokens.refreshToken)
  return tokens.accessToken
}

function handleSessionExpired() {
  authStore.clear()
  window.location.href = '/login'
}

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const accessToken = authStore.getAccessToken()

  const res = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
      ...(accessToken ? { 'x-auth-token': accessToken } : {}),
    },
  })

  if (res.status !== 401) return res

  // accessToken 만료 → 재발급 시도
  try {
    const newAccessToken = await refreshAccessToken()
    const retryRes = await fetch(input, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
        'x-auth-token': newAccessToken,
      },
    })
    return retryRes
  } catch {
    // refreshToken도 만료 → 로그아웃
    handleSessionExpired()
    throw new Error('session expired')
  }
}
