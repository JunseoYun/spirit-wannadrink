import { useState, useRef } from "react";
import {
  Badge,
  BottomSheet,
  Button,
  FixedBottomCTA,
  ListRow,
  Paragraph,
  Spacing,
  Tooltip,
  useToast,
} from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import KakaoMap from "../components/KakaoMap";

declare global {
  interface Window {
    kakao: any;
  }
}

const STORES = [
  {
    id: "1",
    name: "한잔할까 신논현점",
    price: "소주 5,000원",
    category: "한식 구이·찜",
    status: "영업 중",
    address: "서울특별시 강남구 논현동 1길 1",
    closingTime: "22:30",
    distance: "353m",
    drinks: [
      {
        name: "소주",
        price: "5,000원",
        emoji: "https://static.toss.im/2d-emojis/png/4x/uE100.png",
      },
      {
        name: "맥주",
        price: "5,000원",
        emoji: "https://static.toss.im/2d-emojis/png/4x/u1F37A.png",
      },
    ],
    badgeColor: "blue" as const,
    badgeVariant: "fill" as const,
    latitude: 37.5044,
    longitude: 127.0225,
  },
  {
    id: "2",
    name: "한잔할까 선정릉점",
    price: "소주 5,000원",
    category: "이자카야",
    status: "곧 영업 마감",
    address: "서울특별시 강남구 선릉로 2길 5",
    closingTime: "23:00",
    distance: "1.2km",
    drinks: [
      {
        name: "소주",
        price: "5,000원",
        emoji: "https://static.toss.im/2d-emojis/png/4x/uE100.png",
      },
      {
        name: "맥주",
        price: "6,000원",
        emoji: "https://static.toss.im/2d-emojis/png/4x/u1F37A.png",
      },
    ],
    badgeColor: "blue" as const,
    badgeVariant: "weak" as const,
    latitude: 37.5087,
    longitude: 127.0472,
  },
  {
    id: "3",
    name: "한잔할까 역삼점",
    price: "소주 6,000원",
    category: "한식 포차",
    status: "영업 종료",
    address: "서울특별시 강남구 역삼동 3길 8",
    closingTime: "21:00",
    distance: "800m",
    drinks: [
      {
        name: "소주",
        price: "6,000원",
        emoji: "https://static.toss.im/2d-emojis/png/4x/uE100.png",
      },
      {
        name: "맥주",
        price: "6,000원",
        emoji: "https://static.toss.im/2d-emojis/png/4x/u1F37A.png",
      },
    ],
    badgeColor: "elephant" as const,
    badgeVariant: "weak" as const,
    latitude: 37.4996,
    longitude: 127.0367,
  },
  {
    id: "4",
    name: "을지로 포차골목",
    price: "소주 4,500원",
    category: "한식 포차",
    status: "영업 중",
    address: "서울특별시 중구 을지로 4길 12",
    closingTime: "01:00",
    distance: "2.1km",
    drinks: [
      {
        name: "소주",
        price: "4,500원",
        emoji: "https://static.toss.im/2d-emojis/png/4x/uE100.png",
      },
      {
        name: "맥주",
        price: "5,000원",
        emoji: "https://static.toss.im/2d-emojis/png/4x/u1F37A.png",
      },
    ],
    badgeColor: "blue" as const,
    badgeVariant: "fill" as const,
    latitude: 37.5665,
    longitude: 126.9974,
  },
  {
    id: "5",
    name: "홍대 이자카야 사케",
    price: "소주 5,500원",
    category: "이자카야",
    status: "곧 영업 마감",
    address: "서울특별시 마포구 와우산로 5",
    closingTime: "23:30",
    distance: "3.4km",
    drinks: [
      {
        name: "소주",
        price: "5,500원",
        emoji: "https://static.toss.im/2d-emojis/png/4x/uE100.png",
      },
      {
        name: "맥주",
        price: "6,500원",
        emoji: "https://static.toss.im/2d-emojis/png/4x/u1F37A.png",
      },
    ],
    badgeColor: "blue" as const,
    badgeVariant: "weak" as const,
    latitude: 37.5574,
    longitude: 126.9245,
  },
  {
    id: "6",
    name: "강남 고기집 쏘맥",
    price: "소주 6,000원",
    category: "한식 구이·찜",
    status: "영업 중",
    address: "서울특별시 강남구 강남대로 6길 3",
    closingTime: "00:00",
    distance: "500m",
    drinks: [
      {
        name: "소주",
        price: "6,000원",
        emoji: "https://static.toss.im/2d-emojis/png/4x/uE100.png",
      },
      {
        name: "맥주",
        price: "7,000원",
        emoji: "https://static.toss.im/2d-emojis/png/4x/u1F37A.png",
      },
    ],
    badgeColor: "blue" as const,
    badgeVariant: "fill" as const,
    latitude: 37.4979,
    longitude: 127.0276,
  },
];

const CHIP_ITEMS = ["소주", "맥주"];

export default function MapPage() {
  const [showList, setShowList] = useState(true);
  const [dragY, setDragY] = useState(0);
  const [selectedChip, setSelectedChip] = useState(0);
  const [myLocation, setMyLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedStore, setSelectedStore] = useState<(typeof STORES)[0] | null>(
    null,
  );
  const { openToast } = useToast();
  const touchStartY = useRef(0);
  const dragging = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 인디케이터 drag — 항상 시트 이동
  const onHandleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    dragging.current = true;
  };

  // 리스트 drag — scrollTop이 0이고 아래로 당길 때만 시트 이동
  const onListTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    dragging.current = false; // 일단 false, move에서 판단
  };

  const onListTouchMove = (e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - touchStartY.current;
    const atTop = (scrollRef.current?.scrollTop ?? 0) === 0;
    if (atTop && dy > 0) {
      dragging.current = true;
      e.preventDefault(); // 위로 스크롤 막기
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

  const translateY = !showList
    ? "calc(100% + 8px + min(env(safe-area-inset-bottom), 34px))"
    : `${dragY}px`;
  const transition = dragging.current
    ? "none"
    : "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <KakaoMap
        lat={37.5044}
        lng={127.027}
        stores={STORES}
        myLocation={myLocation}
      />

      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 10, pointerEvents: "none" }}>
        <Tooltip message="한잔할까 신논현점" messageAlign="left" placement="top" size="small" clipToEnd="none" motionVariant="weak">
          <Spacing size={26} />
        </Tooltip>
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

      {/* 칩 + 패널 wrapper — 같이 translateY */}
      <div
        style={{
          position: "absolute",
          bottom: "calc(8px + min(env(safe-area-inset-bottom), 34px))",
          left: 8,
          right: 8,
          transform: `translateY(${translateY})`,
          transition,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 8px 8px",
          }}
        >
          <button
            onClick={() =>
              navigator.geolocation.getCurrentPosition(
                (pos) =>
                  setMyLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                  }),
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
          <div style={{ display: "flex", gap: 6 }}>
            {CHIP_ITEMS.map((label, i) => (
              <button
                key={label}
                onClick={() => setSelectedChip(i)}
                style={{
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 100,
                  outline: "none",
                  border: "none",
                  background: selectedChip === i ? "#3182f6" : "rgba(255,255,255,0.92)",
                  color: selectedChip === i ? "#fff" : adaptive.grey700,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  boxShadow: "0 1px 4px rgba(0,19,43,0.12)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div
          style={{
            background: "var(--adaptiveBackground, #fff)",
            borderRadius: 20,
            boxShadow:
              "0 2px 16px rgba(0,19,43,0.12), 0 0 0 1px rgba(0,19,43,0.04)",
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
            ref={scrollRef}
            onTouchStart={onListTouchStart}
            onTouchMove={onListTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              overflowY: "auto",
              maxHeight: "45vh",
              overscrollBehavior: "none",
            }}
          >
            {STORES.map((store) => (
              <ListRow
                key={store.id}
                onClick={() => setSelectedStore(store)}
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
                    top={store.name}
                    topProps={{ color: adaptive.grey800, fontWeight: "bold" }}
                    middle={
                      <Paragraph.Text>
                        <b style={{ color: adaptive.blue500 }}>{store.price}</b>
                      </Paragraph.Text>
                    }
                    middleProps={{ color: adaptive.grey800 }}
                    bottom={store.category}
                    bottomProps={{ color: adaptive.grey600 }}
                  />
                }
                right={
                  <Badge
                    size="small"
                    color={store.badgeColor}
                    variant={store.badgeVariant}
                  >
                    {store.status}
                  </Badge>
                }
                verticalPadding="large"
              />
            ))}
            <Spacing size={24} />
          </div>
        </div>
      </div>

      <BottomSheet
        open={selectedStore != null}
        onClose={() => setSelectedStore(null)}
        header={<BottomSheet.Header>{selectedStore?.name}</BottomSheet.Header>}
        headerDescription={
          <BottomSheet.HeaderDescription>
            {selectedStore &&
              `${selectedStore.address} · ${selectedStore.distance}\n${selectedStore.status} ${selectedStore.closingTime}`}
          </BottomSheet.HeaderDescription>
        }
        cta={
          <BottomSheet.DoubleCTA
            leftButton={<Button variant="weak">길찾기</Button>}
            rightButton={<Button>전화하기</Button>}
          />
        }
      >
        {selectedStore?.drinks.map((drink) => (
          <ListRow
            key={drink.name}
            left={
              <ListRow.AssetImage
                src={drink.emoji}
                shape="squircle"
                scale={0.66}
                backgroundColor={adaptive.greyOpacity100}
                size="medium"
              />
            }
            contents={
              <ListRow.Texts
                type="2RowTypeD"
                top={drink.name}
                topProps={{ color: adaptive.grey600 }}
                bottom={drink.price}
                bottomProps={{ color: adaptive.grey800, fontWeight: "bold" }}
              />
            }
            verticalPadding="large"
          />
        ))}
      </BottomSheet>
    </div>
  );
}
