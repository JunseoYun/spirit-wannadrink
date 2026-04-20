import { authFetch } from "./client";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export interface LocationDto {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface MainDrinkDto {
  type: string;
  price?: number;
}

export interface OperationInfoDto {
  dayOfWeek: string;
  openTime?: string;
  closeTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  isClosed?: boolean;
}

export interface StoreItem {
  id?: number;
  storeId?: number;
  name?: string;
  storeName?: string;
  locationDto?: LocationDto;
  mainDrinkDtos?: MainDrinkDto[];
  drinkType?: string;
  drinkPrice?: number;
  categories?: string[];
  mainImgUrl?: string | null;
  operationInfoDtos?: OperationInfoDto[];
  isAlwaysOpen?: boolean;
  isCertified?: boolean;
  storeRate?: number;
  postCount?: number;
  phoneNumber?: string;
}

function normalizeStoreItem(store: StoreItem): StoreItem {
  if (store.mainDrinkDtos?.length) {
    return store;
  }

  if (!store.drinkType) {
    return store;
  }

  return {
    ...store,
    mainDrinkDtos: [
      {
        type: store.drinkType,
        price: store.drinkPrice,
      },
    ],
  };
}

export async function getStoreMarkers(
  lat: number,
  lng: number,
  radius = 2,
  drinkType?: string,
  drinkPrice?: number | null,
): Promise<StoreItem[]> {
  const drinkTypes = drinkType ? [drinkType] : [];
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    radius: String(radius),
  });
  drinkTypes.forEach((value) => params.append("drinkTypes", value));
  if (drinkPrice != null) params.set("drinkPrice", String(drinkPrice));
  const url = `${BASE_URL}/api/store/get-by/drink-type-price/marker?${params}`;
  const res = await authFetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`getStoreMarkers failed: ${res.status}`);
  }

  return (data.data ?? []).map(normalizeStoreItem);
}

export async function getStoreList(
  lat: number,
  lng: number,
  radius = 2,
  page = 0,
  drinkType?: string,
  drinkPrice?: number | null,
): Promise<StoreItem[]> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    radius: String(radius),
    page: String(page),
  });
  if (drinkType) params.set("drinkType", drinkType);
  if (drinkPrice != null) params.set("drinkPrice", String(drinkPrice));
  const url = `${BASE_URL}/api/store/get-by/drink-type-price?${params}`;
  const res = await authFetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`getStoreList failed: ${res.status}`);
  }

  return (data.data?.content ?? []).map(normalizeStoreItem);
}

export async function getStorePreview(
  storeId: number | string,
): Promise<StoreItem> {
  const url = `${BASE_URL}/api/store/get-by/preview/${storeId}`;
  const res = await authFetch(url);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`getStorePreview failed: ${res.status}`);
  }

  return normalizeStoreItem(data.data);
}
