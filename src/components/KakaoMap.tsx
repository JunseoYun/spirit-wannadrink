import { useEffect, useRef } from "react";

export interface StoreForMap {
  id?: number | string;
  storeId?: number | string;
  storeName?: string;
  name?: string;
  locationDto?: { latitude: number; longitude: number; address?: string };
  latitude?: number;
  longitude?: number;
  isCertified?: boolean;
  isAlwaysOpen?: boolean;
  operationInfoDtos?: { dayOfWeek: string; openTime?: string; closeTime?: string; isClosed?: boolean }[];
  postCount?: number;
}

interface KakaoMapProps {
  lat: number;
  lng: number;
  stores?: StoreForMap[];
  myLocation?: { lat: number; lng: number } | null;
  labelStore?: { name: string; lat: number; lng: number } | null;
  focusLocation?: { lat: number; lng: number; key?: number } | null;
  onMarkerClick?: (storeId: number | string) => void;
  onMarkerGroupClick?: (storeId: number | string, ids: (number | string)[]) => void;
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

function isOpenNow(store: StoreForMap): boolean {
  if (store.isAlwaysOpen) return true;
  const ops = store.operationInfoDtos ?? [];
  if (!ops.length) return false;
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const today = ops.find((o) => o.dayOfWeek === days[new Date().getDay()]);
  if (!today || today.isClosed) return false;
  const toSec = (t?: string) => {
    if (!t) return null;
    const p = t.split(":");
    return parseInt(p[0]) * 3600 + parseInt(p[1]) * 60;
  };
  const cur = new Date().getHours() * 3600 + new Date().getMinutes() * 60;
  const open = toSec(today.openTime);
  const close = toSec(today.closeTime);
  if (open != null && close != null && (cur < open || cur > close)) return false;
  return true;
}

export default function KakaoMap({
  lat,
  lng,
  stores = [],
  myLocation,
  labelStore = null,
  focusLocation = null,
  onMarkerClick,
  onMarkerGroupClick,
  onMapMoved,
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const currentOverlayRef = useRef<any>(null);
  const myLocationOverlayRef = useRef<any>(null);
  const labelOverlayRef = useRef<any>(null);

  // 항상 최신 콜백/데이터를 참조하기 위한 refs
  const onMapMovedRef = useRef(onMapMoved);
  const onMarkerClickRef = useRef(onMarkerClick);
  const onMarkerGroupClickRef = useRef(onMarkerGroupClick);
  const storesRef = useRef(stores);
  useEffect(() => { onMapMovedRef.current = onMapMoved; }, [onMapMoved]);
  useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);
  useEffect(() => { onMarkerGroupClickRef.current = onMarkerGroupClick; }, [onMarkerGroupClick]);
  useEffect(() => { storesRef.current = stores; }, [stores]);

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  };

  const renderMarkers = (kakao: any, map: any, storeList: StoreForMap[]) => {
    clearMarkers();
    if (!storeList.length) return;

    // 1. 좌표 기준으로 그룹화
    const coordGroups: Record<string, StoreForMap[]> = {};
    storeList.forEach((store) => {
      const slat = store.locationDto?.latitude ?? store.latitude;
      const slng = store.locationDto?.longitude ?? store.longitude;
      if (slat == null || slng == null) return;
      const key = `${Number(slat).toFixed(6)},${Number(slng).toFixed(6)}`;
      if (!coordGroups[key]) coordGroups[key] = [];
      coordGroups[key].push(store);
    });

    // 2. 줌 레벨에 따른 화면 공간 그리드 크기 결정
    // Kakao level: 낮을수록 줌인, 높을수록 줌아웃
    const level: number = map.getLevel();
    const gridSize =
      level >= 8 ? 160 :
      level >= 7 ? 120 :
      level >= 6 ? 90  :
      level >= 5 ? 60  :
      level >= 4 ? 40  :
      level >= 3 ? 20  : 0;

    let visibleGroups: Record<string, StoreForMap[]>;

    if (gridSize > 0) {
      // 3. 우선순위 정렬: 인증 > 영업중 > 중심과 가까운 순 > 게시물 수
      const proj = map.getProjection();
      const centerPt = proj.containerPointFromCoords(map.getCenter());

      const enriched = Object.keys(coordGroups).map((key) => {
        const group = coordGroups[key];
        const rep = group[0];
        const slat = rep.locationDto?.latitude ?? rep.latitude ?? 0;
        const slng = rep.locationDto?.longitude ?? rep.longitude ?? 0;
        const pt = proj.containerPointFromCoords(new kakao.maps.LatLng(slat, slng));
        const dx = pt.x - centerPt.x;
        const dy = pt.y - centerPt.y;
        return {
          key,
          group,
          isCertified: !!rep.isCertified,
          isOpen: isOpenNow(rep),
          dist2: dx * dx + dy * dy,
          postCount: rep.postCount ?? 0,
          pt,
        };
      });

      enriched.sort((a, b) => {
        if (a.isCertified !== b.isCertified) return a.isCertified ? -1 : 1;
        if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
        if (a.dist2 !== b.dist2) return a.dist2 - b.dist2;
        return b.postCount - a.postCount;
      });

      // 4. 화면 그리드 셀당 하나의 대표 마커만 표시
      const occupied: Record<string, boolean> = {};
      visibleGroups = {};
      for (const e of enriched) {
        const gx = Math.floor(e.pt.x / gridSize);
        const gy = Math.floor(e.pt.y / gridSize);
        const cellKey = `${gx},${gy}`;
        if (!occupied[cellKey]) {
          occupied[cellKey] = true;
          visibleGroups[e.key] = e.group;
        }
      }
    } else {
      // 줌인 시 클러스터링 없이 좌표 그룹 그대로 표시
      visibleGroups = coordGroups;
    }

    // 5. 마커 렌더링
    Object.values(visibleGroups).forEach((group) => {
      const slat = group[0].locationDto?.latitude ?? group[0].latitude!;
      const slng = group[0].locationDto?.longitude ?? group[0].longitude!;
      const position = new kakao.maps.LatLng(slat, slng);
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
          onMarkerGroupClickRef.current?.(id, ids);
        } else {
          const id = group[0].storeId ?? group[0].id ?? "";
          onMarkerClickRef.current?.(id);
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
        onMapMovedRef.current?.(
          parseFloat(center.getLat().toFixed(5)),
          parseFloat(center.getLng().toFixed(5)),
        );
      });

      // 줌 변경 시 현재 stores로 마커 재렌더 (클러스터링 재계산)
      kakao.maps.event.addListener(mapInstance.current, "zoom_changed", () => {
        renderMarkers(kakao, mapInstance.current, storesRef.current);
      });

      kakao.maps.event.addListener(mapInstance.current, "click", () => {
        if (currentOverlayRef.current) {
          currentOverlayRef.current.setMap(null);
          currentOverlayRef.current = null;
        }
      });

      renderMarkers(kakao, mapInstance.current, storesRef.current);
    };

    if (window.kakao?.maps?.Map) {
      initMap();
      return () => {
        clearMarkers();
        mapInstance.current = null;
      };
    }

    const existingScript = document.getElementById("kakao-maps-sdk");
    if (existingScript) {
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

  // labelStore 변경 시 가게 이름 말풍선 표시/숨김
  useEffect(() => {
    if (!mapInstance.current || !window.kakao?.maps) return;
    const kakao = window.kakao;

    if (labelOverlayRef.current) {
      labelOverlayRef.current.setMap(null);
      labelOverlayRef.current = null;
    }

    if (!labelStore) return;

    const el = document.createElement("div");
    el.style.cssText = [
      "position:relative",
      "padding:7px 13px",
      "border-radius:20px",
      "font-size:13px",
      "font-weight:700",
      "color:#fff",
      "background:#3182f6",
      "box-shadow:0 3px 8px rgba(49,130,246,0.35)",
      "white-space:nowrap",
      "pointer-events:none",
      "transform:translateY(-8px)",
    ].join(";");
    el.innerHTML =
      `${labelStore.name}` +
      `<div style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);` +
      `width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;` +
      `border-top:6px solid #3182f6;"></div>`;

    labelOverlayRef.current = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(labelStore.lat, labelStore.lng),
      content: el,
      yAnchor: 1,
      zIndex: 20,
      map: mapInstance.current,
    });
  }, [labelStore]);

  // focusLocation 변경 시 지도 중심 이동 (바텀시트 고려해 130px 위에 배치)
  useEffect(() => {
    if (!mapInstance.current || !window.kakao?.maps || !focusLocation) return;
    const kakao = window.kakao;
    const position = new kakao.maps.LatLng(focusLocation.lat, focusLocation.lng);
    try {
      const proj = mapInstance.current.getProjection();
      const screenPt = proj.containerPointFromCoords(position);
      const offsetPt = new kakao.maps.Point(screenPt.x, screenPt.y + 130);
      const offsetLatLng = proj.coordsFromContainerPoint(offsetPt);
      mapInstance.current.panTo(offsetLatLng);
    } catch {
      mapInstance.current.panTo(position);
    }
  }, [focusLocation]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}
