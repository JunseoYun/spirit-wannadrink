import { useEffect, useRef } from 'react'

export interface StoreForMap {
  id?: number | string
  storeId?: number | string
  storeName?: string
  name?: string
  locationDto?: { latitude: number; longitude: number; address?: string }
  latitude?: number
  longitude?: number
}

interface KakaoMapProps {
  lat: number
  lng: number
  stores?: StoreForMap[]
  onMarkerClick?: (storeId: number | string) => void
  onMarkerGroupClick?: (storeId: number | string, ids: (number | string)[]) => void
  onMapMoved?: (lat: number, lng: number) => void
}

const MARKER_SVG = (count: number) => {
  const numberText =
    count > 1
      ? `<text x="16" y="13.5" font-size="10" font-weight="700" font-family="Pretendard, Arial" fill="#3CBBFF" text-anchor="middle" dominant-baseline="central">${count}</text>`
      : ''
  const circleRadius = count > 1 ? 7 : 6
  return (
    `data:image/svg+xml;charset=UTF-8,` +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="36" viewBox="0 0 32 36">` +
        `<path d="M16 1 C9 1 4 6 4 12 C4 17 8 22 11 25 L16 30 L21 25 C24 22 28 17 28 12 C28 6 23 1 16 1 Z" fill="#3CBBFF"/>` +
        `<circle cx="16" cy="13" r="${circleRadius}" fill="white"/>` +
        numberText +
        `</svg>`,
    )
  )
}

export default function KakaoMap({
  lat,
  lng,
  stores = [],
  onMarkerClick,
  onMarkerGroupClick,
  onMapMoved,
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const overlaysRef = useRef<any[]>([])
  const currentOverlayRef = useRef<any>(null)

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null))
    overlaysRef.current.forEach((o) => o.setMap(null))
    markersRef.current = []
    overlaysRef.current = []
  }

  const renderMarkers = (kakao: any, map: any, storeList: StoreForMap[]) => {
    clearMarkers()
    if (!storeList.length) return

    // 같은 좌표끼리 그룹화
    const groups: Record<string, StoreForMap[]> = {}
    storeList.forEach((store) => {
      const lat = store.locationDto?.latitude ?? store.latitude
      const lng = store.locationDto?.longitude ?? store.longitude
      if (lat == null || lng == null) return
      const key = `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`
      if (!groups[key]) groups[key] = []
      groups[key].push(store)
    })

    Object.values(groups).forEach((group) => {
      const lat = group[0].locationDto?.latitude ?? group[0].latitude!
      const lng = group[0].locationDto?.longitude ?? group[0].longitude!
      const position = new kakao.maps.LatLng(lat, lng)
      const count = group.length

      const marker = new kakao.maps.Marker({
        position,
        map,
        zIndex: 1,
        image: new kakao.maps.MarkerImage(
          MARKER_SVG(count),
          new kakao.maps.Size(34, 36),
          { offset: new kakao.maps.Point(17, 36) },
        ),
      })

      kakao.maps.event.addListener(marker, 'click', () => {
        if (currentOverlayRef.current) {
          currentOverlayRef.current.setMap(null)
          currentOverlayRef.current = null
        }
        if (group.length > 1) {
          const id = group[0].storeId ?? group[0].id ?? ''
          const ids = group.map((s) => s.storeId ?? s.id ?? '')
          onMarkerGroupClick?.(id, ids)
        } else {
          const id = group[0].storeId ?? group[0].id ?? ''
          onMarkerClick?.(id)
        }
      })

      markersRef.current.push(marker)
    })
  }

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current) return

    const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_APP_KEY

    const initMap = () => {
      if (!mapRef.current) return
      const kakao = window.kakao

      mapInstance.current = new kakao.maps.Map(mapRef.current, {
        center: new kakao.maps.LatLng(lat, lng),
        level: 5,
      })

      kakao.maps.event.addListener(mapInstance.current, 'idle', () => {
        const center = mapInstance.current.getCenter()
        onMapMoved?.(
          parseFloat(center.getLat().toFixed(5)),
          parseFloat(center.getLng().toFixed(5)),
        )
      })

      kakao.maps.event.addListener(mapInstance.current, 'click', () => {
        if (currentOverlayRef.current) {
          currentOverlayRef.current.setMap(null)
          currentOverlayRef.current = null
        }
      })

      renderMarkers(kakao, mapInstance.current, stores)
    }

    // 이미 로드된 경우 바로 초기화
    if (window.kakao?.maps?.Map) {
      initMap()
      return () => { clearMarkers(); mapInstance.current = null }
    }

    // 스크립트 동적 로드
    const existingScript = document.getElementById('kakao-maps-sdk')
    if (existingScript) {
      // 스크립트는 이미 있고 kakao 객체도 있으면 load() 호출
      if (window.kakao?.maps) {
        window.kakao.maps.load(initMap)
      }
      return () => { clearMarkers(); mapInstance.current = null }
    }

    const script = document.createElement('script')
    script.id = 'kakao-maps-sdk'
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false`
    script.onload = () => window.kakao.maps.load(initMap)
    document.head.appendChild(script)

    return () => {
      clearMarkers()
      mapInstance.current = null
      if (mapRef.current) mapRef.current.innerHTML = ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // stores 변경 시 마커 재렌더
  useEffect(() => {
    if (!mapInstance.current || !window.kakao?.maps) return
    renderMarkers(window.kakao, mapInstance.current, stores)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stores])

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
}
