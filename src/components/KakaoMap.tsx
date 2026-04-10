import { useEffect, useRef } from "react";

export interface StoreForMap {
  id?: number | string;
  storeId?: number | string;
  storeName?: string;
  name?: string;
  locationDto?: { latitude: number; longitude: number; address?: string };
  latitude?: number;
  longitude?: number;
}

interface KakaoMapProps {
  lat: number;
  lng: number;
  stores?: StoreForMap[];
  myLocation?: { lat: number; lng: number } | null;
  onMarkerClick?: (storeId: number | string) => void;
  onMarkerGroupClick?: (
    storeId: number | string,
    ids: (number | string)[],
  ) => void;
  onMapMoved?: (lat: number, lng: number) => void;
}

const MARKER_HTML = (count: number) => {
  const badge =
    count > 1
      ? `<div style="position:absolute;top:-4px;right:-4px;background:#3182f6;color:#fff;font-size:10px;font-weight:700;border-radius:100px;min-width:16px;height:16px;display:flex;align-items:center;justify-content:center;padding:0 4px;">${count}</div>`
      : "";
  return `<div style="position:relative;width:40px;height:40px;cursor:pointer;">
    <div style="width:40px;height:40px;background-color:#3182F6;-webkit-mask-image:url(https://static.toss.im/icons/svg/icon-pin-location-mono.svg);mask-image:url(https://static.toss.im/icons/svg/icon-pin-location-mono.svg);-webkit-mask-size:contain;mask-size:contain;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center;"></div>
    ${badge}
  </div>`;
};

export default function KakaoMap({
  lat,
  lng,
  stores = [],
  myLocation,
  onMarkerClick,
  onMarkerGroupClick,
  onMapMoved,
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const overlaysRef = useRef<any[]>([]);
  const currentOverlayRef = useRef<any>(null);
  const myLocationOverlayRef = useRef<any>(null);

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    overlaysRef.current.forEach((o) => o.setMap(null));
    markersRef.current = [];
    overlaysRef.current = [];
  };

  const renderMarkers = (kakao: any, map: any, storeList: StoreForMap[]) => {
    clearMarkers();
    if (!storeList.length) return;

    // 같은 좌표끼리 그룹화
    const groups: Record<string, StoreForMap[]> = {};
    storeList.forEach((store) => {
      const lat = store.locationDto?.latitude ?? store.latitude;
      const lng = store.locationDto?.longitude ?? store.longitude;
      if (lat == null || lng == null) return;
      const key = `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(store);
    });

    Object.values(groups).forEach((group) => {
      const lat = group[0].locationDto?.latitude ?? group[0].latitude!;
      const lng = group[0].locationDto?.longitude ?? group[0].longitude!;
      const position = new kakao.maps.LatLng(lat, lng);
      const count = group.length;

      const container = document.createElement("div");
      container.innerHTML = MARKER_HTML(count);
      container.addEventListener("click", () => {
        if (currentOverlayRef.current) {
          currentOverlayRef.current.setMap(null);
          currentOverlayRef.current = null;
        }
        if (group.length > 1) {
          const id = group[0].storeId ?? group[0].id ?? "";
          const ids = group.map((s) => s.storeId ?? s.id ?? "");
          onMarkerGroupClick?.(id, ids);
        } else {
          const id = group[0].storeId ?? group[0].id ?? "";
          onMarkerClick?.(id);
        }
      });

      const marker = new kakao.maps.CustomOverlay({
        position,
        content: container,
        map,
        yAnchor: 1,
        zIndex: 1,
      });

      markersRef.current.push(marker);
    });
  };

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current) return;

    const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_APP_KEY;

    const initMap = () => {
      if (!mapRef.current) return;
      const kakao = window.kakao;

      mapInstance.current = new kakao.maps.Map(mapRef.current, {
        center: new kakao.maps.LatLng(lat, lng),
        level: 5,
      });

      kakao.maps.event.addListener(mapInstance.current, "idle", () => {
        const center = mapInstance.current.getCenter();
        onMapMoved?.(
          parseFloat(center.getLat().toFixed(5)),
          parseFloat(center.getLng().toFixed(5)),
        );
      });

      kakao.maps.event.addListener(mapInstance.current, "click", () => {
        if (currentOverlayRef.current) {
          currentOverlayRef.current.setMap(null);
          currentOverlayRef.current = null;
        }
      });

      renderMarkers(kakao, mapInstance.current, stores);
    };

    // 이미 로드된 경우 바로 초기화
    if (window.kakao?.maps?.Map) {
      initMap();
      return () => {
        clearMarkers();
        mapInstance.current = null;
      };
    }

    // 스크립트 동적 로드
    const existingScript = document.getElementById("kakao-maps-sdk");
    if (existingScript) {
      // 스크립트는 이미 있고 kakao 객체도 있으면 load() 호출
      if (window.kakao?.maps) {
        window.kakao.maps.load(initMap);
      }
      return () => {
        clearMarkers();
        mapInstance.current = null;
      };
    }

    const script = document.createElement("script");
    script.id = "kakao-maps-sdk";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false`;
    script.onload = () => window.kakao.maps.load(initMap);
    document.head.appendChild(script);

    return () => {
      clearMarkers();
      mapInstance.current = null;
      if (mapRef.current) mapRef.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // stores 변경 시 마커 재렌더
  useEffect(() => {
    if (!mapInstance.current || !window.kakao?.maps) return;
    renderMarkers(window.kakao, mapInstance.current, stores);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stores]);

  // 내 위치 변경 시 지도 이동 + 파란 점 마커
  useEffect(() => {
    if (!mapInstance.current || !window.kakao?.maps || !myLocation) return;
    const kakao = window.kakao;
    const position = new kakao.maps.LatLng(myLocation.lat, myLocation.lng);

    if (myLocationOverlayRef.current) {
      myLocationOverlayRef.current.setMap(null);
    }

    const dot = document.createElement("div");
    dot.innerHTML = `
      <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:24px;height:24px;background:rgba(49,130,246,0.25);border-radius:100%;animation:pulse 1.8s ease-out infinite;"></div>
        <div style="width:14px;height:14px;background:#3182f6;border-radius:100%;box-shadow:0 1px 6px rgba(49,130,246,0.5);flex-shrink:0;"></div>
      </div>
      <style>@keyframes pulse{0%{transform:scale(1);opacity:0.7}100%{transform:scale(2.4);opacity:0}}</style>
    `;

    myLocationOverlayRef.current = new kakao.maps.CustomOverlay({
      position,
      content: dot,
      map: mapInstance.current,
      yAnchor: 0.5,
      zIndex: 10,
    });

    mapInstance.current.panTo(position);
  }, [myLocation]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}
