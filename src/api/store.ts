import { authFetch } from './client'

const BASE_URL = import.meta.env.VITE_BASE_URL

export interface LocationDto {
  latitude: number
  longitude: number
  address?: string
}

export interface MainDrinkDto {
  type: string
  price?: number
}

export interface OperationInfoDto {
  dayOfWeek: string
  openTime?: string
  closeTime?: string
  breakStartTime?: string
  breakEndTime?: string
  isClosed?: boolean
}

export interface StoreItem {
  id?: number
  storeId?: number
  name?: string
  storeName?: string
  locationDto?: LocationDto
  mainDrinkDtos?: MainDrinkDto[]
  categories?: string[]
  mainImgUrl?: string
  operationInfoDtos?: OperationInfoDto[]
  isAlwaysOpen?: boolean
  isCertified?: boolean
  storeRate?: number
  postCount?: number
  phoneNumber?: string
}

export async function getStoreMarkers(lat: number, lng: number, radius = 2, drinkType?: string): Promise<StoreItem[]> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    radius: String(radius),
  })
  if (drinkType) params.set('drinkType', drinkType)
  const res = await authFetch(`${BASE_URL}/api/store/get-by/condition-search/markers?${params}`)
  const data = await res.json()
  return data.data ?? []
}

export async function getStoreList(lat: number, lng: number, radius = 2, page = 0, drinkType?: string): Promise<StoreItem[]> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    radius: String(radius),
    page: String(page),
  })
  if (drinkType) params.set('drinkType', drinkType)
  const res = await authFetch(`${BASE_URL}/api/store/get-by/condition-search?${params}`)
  const data = await res.json()
  return data.data?.content ?? []
}

export async function getStorePreview(storeId: number | string): Promise<StoreItem> {
  const res = await authFetch(`${BASE_URL}/api/store/get-by/preview/${storeId}`)
  const data = await res.json()
  return data.data
}
