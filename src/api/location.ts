import { authFetch } from './client'

const BASE_URL = import.meta.env.VITE_BASE_URL

export async function getAddressFromCoords(lat: number, lng: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({ latitude: String(lat), longitude: String(lng) })
    const res = await authFetch(`${BASE_URL}/api/location/get-address?${params}`)
    const data = await res.json()
    return data.data?.address ?? null
  } catch {
    return null
  }
}
