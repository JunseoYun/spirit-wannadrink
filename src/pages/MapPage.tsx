import { useState, useRef, useEffect, useCallback } from "react";
import {
  Badge,
  BottomSheet,
  Button,
  FixedBottomCTA,
  ListRow,
  Paragraph,
  Skeleton,
  Spacing,
  Tooltip,
  useToast,
} from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import KakaoMap from "../components/KakaoMap";
import { getStoreMarkers, getStoreList, getStorePreview } from "../api/store";
import type { StoreItem } from "../api/store";
import { getAddressFromCoords } from "../api/location";

declare global {
  interface Window {
    kakao: any;
  }
}

const CHIP_ITEMS = ["소주", "맥주"];

const DRINK_LABELS: Record<string, string> = {
  SOJU: "소주",
  BEER: "맥주",
  MAKGEOLLI: "막걸리",
  WINE: "와인",
  COCKTAIL: "칵테일",
  SAKE: "사케",
  KAOLIANG: "고량주",
  WHISKEY: "위스키",
  VODKA: "보드카",
  TRADITIONAL: "전통주",
  HIGHBALL: "하이볼",
  TEQUILA: "데킬라",
};

const DRINK_EMOJIS: Record<string, string> = {
  SOJU: "https://static.toss.im/2d-emojis/png/4x/uE100.png",
  BEER: "https://static.toss.im/2d-emojis/png/4x/u1F37A.png",
  WINE: "https://static.toss.im/2d-emojis/png/4x/u1F377.png",
  COCKTAIL: "https://static.toss.im/2d-emojis/png/4x/u1F378.png",
  MAKGEOLLI: "https://static.toss.im/2d-emojis/png/4x/u1F376.png",
  SAKE: "https://static.toss.im/2d-emojis/png/4x/u1F376.png",
  WHISKEY: "https://static.toss.im/2d-emojis/png/4x/u1F943.png",
  HIGHBALL: "https://static.toss.im/2d-emojis/png/4x/u1F943.png",
};

const CATEGORY_LABELS: Record<string, string> = {
  IZAKAYA: "이자카야",
  KOREAN: "한식",
  WESTERN: "양식",
  CHINESE: "중식",
  POCHA: "포장마차",
  GAMSEONG: "감성주점",
  GRILLED_STEW: "구이·찜",
  CHICKEN_HOF: "치킨·호프",
  RAW_SEAFOOD: "회·해산물",
  PUB_BAR: "펍·바",
};

function getStoreName(store: StoreItem) {
  return store.name || store.storeName || "";
}

function getMainPriceText(store: StoreItem, drinkType?: string) {
  const drink = drinkType
    ? (store.mainDrinkDtos?.find((d) => d.type === drinkType) ??
      store.mainDrinkDtos?.[0])
    : store.mainDrinkDtos?.[0];
  if (!drink) return "";
  const label = DRINK_LABELS[drink.type] || drink.type;
  const price = drink.price != null ? ` ${drink.price.toLocaleString()}원` : "";
  return label + price;
}

function getCategoryText(store: StoreItem) {
  const cat = store.categories?.[0];
  return cat ? CATEGORY_LABELS[cat] || cat : "";
}

function getStoreStatus(store: StoreItem): {
  status: string;
  color: "blue" | "elephant";
  variant: "fill" | "weak";
} {
  console.log(store);
  if (store.isAlwaysOpen)
    return { status: "24시간 영업", color: "blue", variant: "fill" };

  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const today = days[new Date().getDay()];
  const info = store.operationInfoDtos?.find((d) => d.dayOfWeek === today);

  if (!info || info.isClosed)
    return { status: "영업 종료", color: "elephant", variant: "weak" };

  const toSec = (t?: string) => {
    if (!t) return null;
    const p = t.split(":");
    return parseInt(p[0]) * 3600 + parseInt(p[1]) * 60;
  };
  const now = new Date();
  const cur = now.getHours() * 3600 + now.getMinutes() * 60;
  const open = toSec(info.openTime);
  const close = toSec(info.closeTime);

  if (open != null && close != null && (cur < open || cur > close)) {
    return { status: "영업 종료", color: "elephant", variant: "weak" };
  }
  if (close != null && close - cur <= 1800 && close - cur > 0) {
    return { status: "곧 영업 마감", color: "blue", variant: "weak" };
  }
  return { status: "영업 중", color: "blue", variant: "fill" };
}

function getClosingTime(store: StoreItem) {
  if (store.isAlwaysOpen) return "24시간";
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const today = days[new Date().getDay()];
  const info = store.operationInfoDtos?.find((d) => d.dayOfWeek === today);
  if (!info?.closeTime) return "";
  const parts = info.closeTime.split(":");
  return `${parts[0]}:${parts[1]}`;
}

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const d = 2 * R * Math.asin(Math.sqrt(a));
  return d < 1000 ? `${Math.round(d)}m` : `${(d / 1000).toFixed(1)}km`;
}

const DEFAULT_LAT = 37.5044;
const DEFAULT_LNG = 127.027;

export default function MapPage() {
  const [showList, setShowList] = useState(true);
  const [dragY, setDragY] = useState(0);
  const [selectedChip, setSelectedChip] = useState(0);
  const [myLocation, setMyLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapCenter, setMapCenter] = useState({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
  });
  const [markerStores, setMarkerStores] = useState<StoreItem[]>([]);
  const [listStores, setListStores] = useState<StoreItem[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreItem | null>(null);
  const [loadingStores, setLoadingStores] = useState(true);
  const [showSearchHere, setShowSearchHere] = useState(false);
  const [labelStore, setLabelStore] = useState<{
    name: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [focusLocation, setFocusLocation] = useState<{
    lat: number;
    lng: number;
    key: number;
  } | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(4000);
  const [showPricePicker, setShowPricePicker] = useState(false);
  const programmaticPanRef = useRef(false);
  const focusFirstOnNextFetchRef = useRef(false);
  const scrollThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleListScroll = useCallback(() => {
    if (scrollThrottleRef.current) return;
    scrollThrottleRef.current = setTimeout(() => {
      scrollThrottleRef.current = null;
      const container = scrollRef.current;
      if (!container || !listStores.length) return;
      const containerTop = container.getBoundingClientRect().top;
      const items = container.querySelectorAll("[data-store-index]");
      for (const item of items) {
        const rect = item.getBoundingClientRect();
        if (rect.bottom > containerTop) {
          const idx = parseInt(item.getAttribute("data-store-index") ?? "0");
          const store = listStores[idx];
          const lat = store?.locationDto?.latitude;
          const lng = store?.locationDto?.longitude;
          if (lat != null && lng != null) {
            programmaticPanRef.current = true;
            setFocusLocation({ lat, lng, key: Date.now() });
          }
          break;
        }
      }
    }, 150);
  }, [listStores]);
  const { openToast } = useToast();
  const touchStartY = useRef(0);
  const dragging = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const DRINK_TYPES = ["SOJU", "BEER"];

  const fetchStores = useCallback(
    async (lat: number, lng: number) => {
      setLoadingStores(true);
      setShowSearchHere(false);
      const drinkType = DRINK_TYPES[selectedChip];
      try {
        const [markers, list, address] = await Promise.all([
          getStoreMarkers(lat, lng, 2, drinkType),
          getStoreList(lat, lng, 2, 0, drinkType),
          getAddressFromCoords(lat, lng),
        ]);
        const matchesMaxPrice = (store: StoreItem) => {
          if (maxPrice == null) return true;
          const drink = store.mainDrinkDtos?.find((d) => d.type === drinkType);
          return drink?.price != null && drink.price <= maxPrice;
        };
        const getStoreKey = (store: StoreItem) =>
          String(store.storeId ?? store.id ?? "");
        const filteredList = list.filter(matchesMaxPrice);
        const allowedKeys = new Set(
          filteredList.map(getStoreKey).filter((k) => k !== ""),
        );
        const filteredMarkers =
          maxPrice == null
            ? markers
            : markers.filter((m) => allowedKeys.has(getStoreKey(m)));
        const listMapByKey = new Map(
          filteredList.map((s) => [getStoreKey(s), s]),
        );
        const mergedMarkers = filteredMarkers.map((marker) => {
          const listStore = listMapByKey.get(getStoreKey(marker));
          return listStore
            ? { ...marker, mainDrinkDtos: listStore.mainDrinkDtos }
            : marker;
        });

        setListStores(filteredList);
        setMarkerStores(mergedMarkers);
        if (focusFirstOnNextFetchRef.current) {
          focusFirstOnNextFetchRef.current = false;
          const firstStore = filteredList[0];
          const lat = firstStore?.locationDto?.latitude;
          const lng = firstStore?.locationDto?.longitude;
          if (lat != null && lng != null) {
            programmaticPanRef.current = true;
            setFocusLocation({ lat, lng, key: Date.now() });
            setLabelStore(null);
          }
        }
      } catch (e) {
        console.error("매장 조회 실패", e);
      } finally {
        setLoadingStores(false);
      }
    },
    [selectedChip, maxPrice],
  );

  // 칩(drinkType) 또는 maxPrice 변경 시 현재 위치로 재조회
  useEffect(() => {
    fetchStores(mapCenter.lat, mapCenter.lng);
  }, [selectedChip, maxPrice]); // eslint-disable-line react-hooks/exhaustive-deps

  const updatePriceFromCoords = useCallback(
    async (lat: number, lng: number) => {
      const address = await getAddressFromCoords(lat, lng);
      setMaxPrice(address?.includes("서울") ? 5000 : 4000);
    },
    [],
  );

  // 최초 마운트: GPS 시도 후 fetchStores
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyLocation(loc);
        setMapCenter(loc);
        updatePriceFromCoords(loc.lat, loc.lng);
        fetchStores(loc.lat, loc.lng);
      },
      () => {
        fetchStores(DEFAULT_LAT, DEFAULT_LNG);
      },
    );
  }, [fetchStores, updatePriceFromCoords]);

  // 지도 이동 시 검색 버튼만 표시 + 목록 숨김 (programmatic pan은 제외)
  const handleMapMoved = useCallback((lat: number, lng: number) => {
    if (programmaticPanRef.current) {
      programmaticPanRef.current = false;
      return;
    }
    setMapCenter({ lat, lng });
    setShowSearchHere(true);
    setShowList(false);
  }, []);

  // 마커 클릭 시 listStores에서 찾고, 없으면 preview 조회 + 이름 라벨 표시
  const handleMarkerClick = useCallback(
    async (storeId: number | string) => {
      const found = listStores.find(
        (s) => String(s.storeId ?? s.id) === String(storeId),
      );
      const store =
        found ??
        (await (async () => {
          try {
            return await getStorePreview(storeId);
          } catch (e) {
            console.error("매장 상세 조회 실패", e);
            return null;
          }
        })());
      if (!store) return;
      setSelectedStore(store);
      const lat = store.locationDto?.latitude;
      const lng = store.locationDto?.longitude;
      if (lat != null && lng != null) {
        setLabelStore({ name: getStoreName(store), lat, lng });
      }
    },
    [listStores],
  );

  // 인디케이터 drag
  const onHandleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    dragging.current = true;
  };

  const onListTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    dragging.current = false;
  };

  const onListTouchMove = (e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - touchStartY.current;
    const atTop = (scrollRef.current?.scrollTop ?? 0) === 0;
    if (atTop && dy > 0) {
      dragging.current = true;
      e.preventDefault();
    }
    if (!dragging.current) return;
    setDragY(Math.max(0, dy));
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const dy = Math.max(0, e.touches[0].clientY - touchStartY.current);
    setDragY(dy);
  };

  const onTouchEnd = () => {
    dragging.current = false;
    if (dragY > 80) setShowList(false);
    setDragY(0);
  };

  const translateY = !showList ? "100%" : `${dragY}px`;
  const transition = dragging.current
    ? "none"
    : "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)";
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <KakaoMap
        lat={mapCenter.lat}
        lng={mapCenter.lng}
        stores={markerStores}
        selectedDrinkType={DRINK_TYPES[selectedChip]}
        myLocation={myLocation}
        labelStore={labelStore}
        focusLocation={focusLocation}
        onMarkerClick={handleMarkerClick}
        onMapMoved={handleMapMoved}
      />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <Tooltip
          message="한잔할까 신논현점"
          messageAlign="left"
          placement="top"
          size="small"
          clipToEnd="none"
          motionVariant="weak"
        >
          <Spacing size={26} />
        </Tooltip>
      </div>

      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          height: 36,
          zIndex: 200,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        {showSearchHere && (
          <button
            onClick={() => {
              setShowSearchHere(false);
              updatePriceFromCoords(mapCenter.lat, mapCenter.lng);
              fetchStores(mapCenter.lat, mapCenter.lng);
            }}
            style={{
              height: 36,
              padding: "0 16px",
              borderRadius: 100,
              border: "none",
              background: "#3182f6",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(49,130,246,0.4)",
              whiteSpace: "nowrap",
              pointerEvents: "auto",
            }}
          >
            이 지역에서 검색
          </button>
        )}
        <button
          onClick={() => setShowPricePicker(true)}
          style={{
            position: "absolute",
            right: 0,
            height: 36,
            padding: "0 14px",
            borderRadius: 100,
            border:
              maxPrice != null ? "none" : `1.5px solid rgba(0,19,43,0.12)`,
            background:
              maxPrice != null
                ? "rgba(49,130,246,0.12)"
                : "rgba(255,255,255,0.92)",
            color: maxPrice != null ? "#3182f6" : adaptive.grey600,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow: "0 1px 4px rgba(0,19,43,0.12)",
            display: "flex",
            alignItems: "center",
            gap: 4,
            whiteSpace: "nowrap",
            pointerEvents: "auto",
          }}
        >
          {maxPrice != null ? `~${maxPrice.toLocaleString()}원` : "가격"}
          {maxPrice != null ? (
            <span style={{ fontSize: 14, lineHeight: 1 }}>×</span>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 2.5v7M2.5 6h7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>

      {!showList && (
        <div onClick={() => setShowList(true)}>
          <FixedBottomCTA
            loading={false}
            showAfterDelay={{ animation: "slide", delay: 0 }}
            hideOnScroll={false}
          >
            목록으로 보기
          </FixedBottomCTA>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          transform: `translateY(${translateY})`,
          transition,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: "0 8px 8px",
          }}
        >
          <button
            onClick={() =>
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const loc = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                  };
                  setMyLocation(loc);
                  updatePriceFromCoords(loc.lat, loc.lng);
                  fetchStores(loc.lat, loc.lng);
                },
                () => openToast("위치 권한을 허용해주세요.", { gap: 30 }),
              )
            }
            style={{
              width: 36,
              height: 36,
              borderRadius: 100,
              border: "none",
              outline: "none",
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 4px rgba(0,19,43,0.12)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4" fill={adaptive.blue500} />
              <path
                d="M12 2v3M12 19v3M2 12h3M19 12h3"
                stroke={adaptive.blue500}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div
          style={{
            background: "var(--adaptiveBackground, #fff)",
            borderRadius: "20px 20px 0 0",
            overflow: "hidden",
            boxShadow: "0 2px 16px rgba(0,19,43,0.12)",
          }}
        >
          <div
            onTouchStart={onHandleTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              display: "flex",
              justifyContent: "center",
              paddingTop: 12,
              paddingBottom: 4,
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: "rgba(0,19,43,0.12)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 24px 10px",
            }}
          >
            <div
              style={{
                color: adaptive.grey800,
                fontSize: 16,
                fontWeight: 700,
                lineHeight: 1.4,
              }}
            >
              {!loadingStores && (
                <>
                  {"주변 "}
                  <span style={{ color: adaptive.blue500 }}>
                    {markerStores.length}
                  </span>
                  개 술집
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              {CHIP_ITEMS.map((label, i) => (
                <button
                  key={label}
                  onClick={() => {
                    if (selectedChip !== i)
                      focusFirstOnNextFetchRef.current = true;
                    setSelectedChip(i);
                  }}
                  style={{
                    padding: "0 6px",
                    margin: "0 6px",
                    outline: "none",
                    border: "none",
                    borderBottom:
                      selectedChip === i
                        ? `2px solid ${adaptive.blue500}`
                        : "none",
                    background: "#fff",
                    color:
                      selectedChip === i ? adaptive.blue500 : adaptive.grey600,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div
            ref={scrollRef}
            onScroll={handleListScroll}
            onTouchStart={onListTouchStart}
            onTouchMove={onListTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              overflowY: "auto",
              maxHeight: "45vh",
              overscrollBehavior: "none",
            }}
          >
            {loadingStores ? (
              <Skeleton pattern="subtitleListWithIcon" />
            ) : listStores.length === 0 ? (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  color: adaptive.grey500,
                  fontSize: 14,
                }}
              >
                주변에 매장이 없어요
              </div>
            ) : (
              listStores.map((store, index) => {
                const storeId = store.storeId ?? store.id ?? "";
                const name = getStoreName(store);
                const price = getMainPriceText(
                  store,
                  DRINK_TYPES[selectedChip],
                );
                const category = getCategoryText(store);
                const { status, color, variant } = getStoreStatus(store);
                return (
                  <div key={storeId} data-store-index={index}>
                    <ListRow
                      onClick={() => {
                        setSelectedStore(store);
                        const lat = store.locationDto?.latitude;
                        const lng = store.locationDto?.longitude;
                        if (lat != null && lng != null) {
                          setLabelStore({
                            name: getStoreName(store),
                            lat,
                            lng,
                          });
                          programmaticPanRef.current = true;
                          setFocusLocation({ lat, lng, key: Date.now() });
                        }
                      }}
                      left={
                        <ListRow.AssetIcon
                          size="medium"
                          name="icon-store-mono"
                          backgroundColor={adaptive.greyOpacity100}
                        />
                      }
                      contents={
                        <ListRow.Texts
                          type="3RowTypeA"
                          top={name}
                          topProps={{
                            color: adaptive.grey800,
                            fontWeight: "bold",
                          }}
                          middle={
                            <Paragraph.Text>
                              <b style={{ color: adaptive.blue500 }}>{price}</b>
                            </Paragraph.Text>
                          }
                          middleProps={{ color: adaptive.grey800 }}
                          bottom={category}
                          bottomProps={{ color: adaptive.grey600 }}
                        />
                      }
                      right={
                        <Badge size="small" color={color} variant={variant}>
                          {status}
                        </Badge>
                      }
                      verticalPadding="large"
                    />
                  </div>
                );
              })
            )}
            <Spacing size={24} />
          </div>
        </div>
      </div>

      <BottomSheet
        open={selectedStore != null}
        onClose={() => {
          setSelectedStore(null);
          setLabelStore(null);
        }}
        header={
          <BottomSheet.Header>
            {selectedStore ? getStoreName(selectedStore) : ""}
          </BottomSheet.Header>
        }
        headerDescription={
          <BottomSheet.HeaderDescription>
            {selectedStore &&
              (() => {
                const { status } = getStoreStatus(selectedStore);
                const closing = getClosingTime(selectedStore);
                const address = selectedStore.locationDto?.address ?? "";
                const distance =
                  myLocation && selectedStore.locationDto
                    ? calcDistance(
                        myLocation.lat,
                        myLocation.lng,
                        selectedStore.locationDto.latitude,
                        selectedStore.locationDto.longitude,
                      )
                    : "";
                return `${address}${distance ? ` · ${distance}` : ""}\n${status}${closing ? ` ${closing}` : ""}`;
              })()}
          </BottomSheet.HeaderDescription>
        }
        cta={
          <BottomSheet.DoubleCTA
            leftButton={<Button variant="weak">길찾기</Button>}
            rightButton={<Button>전화하기</Button>}
          />
        }
      >
        {["SOJU", "BEER"]
          .flatMap(
            (type) =>
              selectedStore?.mainDrinkDtos?.filter((d) => d.type === type) ??
              [],
          )
          .map((drink) => (
            <ListRow
              key={drink.type}
              left={
                <ListRow.AssetImage
                  src={
                    DRINK_EMOJIS[drink.type] ??
                    "https://static.toss.im/2d-emojis/png/4x/uE100.png"
                  }
                  shape="squircle"
                  scale={0.66}
                  backgroundColor={adaptive.greyOpacity100}
                  size="medium"
                />
              }
              contents={
                <ListRow.Texts
                  type="2RowTypeD"
                  top={DRINK_LABELS[drink.type] ?? drink.type}
                  topProps={{ color: adaptive.grey600 }}
                  bottom={
                    drink.price != null
                      ? `${drink.price.toLocaleString()}원`
                      : ""
                  }
                  bottomProps={{ color: adaptive.grey800, fontWeight: "bold" }}
                />
              }
              verticalPadding="large"
            />
          ))}
      </BottomSheet>

      <BottomSheet
        open={showPricePicker}
        onClose={() => setShowPricePicker(false)}
        header={
          <BottomSheet.Header>
            {CHIP_ITEMS[selectedChip]} 최대 가격 설정
          </BottomSheet.Header>
        }
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            padding: "8px 16px 24px",
          }}
        >
          {[3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000].map((price) => (
            <button
              key={price}
              onClick={() => {
                setMaxPrice((prev) => (prev === price ? null : price));
                setShowPricePicker(false);
              }}
              style={{
                height: 40,
                padding: "0 16px",
                borderRadius: 100,
                border:
                  maxPrice === price
                    ? "none"
                    : `1.5px solid ${adaptive.grey200}`,
                background: maxPrice === price ? "#3182f6" : "#fff",
                color: maxPrice === price ? "#fff" : adaptive.grey700,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ~{price.toLocaleString()}원
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
