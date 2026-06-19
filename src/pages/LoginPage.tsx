import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { appLogin } from "@apps-in-toss/web-framework";
import { FixedBottomCTA, useToast } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { tossLogin } from "../api/auth";
import { authStore } from "../store/auth";

const APP_ICON_URL =
  "https://static.toss.im/appsintoss/32779/2f94ba49-f1ee-4845-8bf5-1765be80f567.png";

const HERO_ICONS = [
  {
    src: "https://static.toss.im/2d-emojis/png/4x/uE100.png",
    background: "rgba(43,194,107,0.14)",
    size: 88,
    left: "6%",
    top: "4%",
    rotate: -8,
  },
  {
    src: "https://static.toss.im/2d-emojis/png/4x/u1F37A.png",
    background: "rgba(245,166,35,0.16)",
    size: 66,
    left: "60%",
    top: "0%",
    rotate: 10,
  },
  {
    src: "https://static.toss.im/2d-emojis/png/4x/u1F377.png",
    background: "rgba(224,86,86,0.12)",
    size: 76,
    left: "28%",
    top: "56%",
    rotate: -6,
  },
  {
    src: "https://static.toss.im/2d-emojis/png/4x/u1F376.png",
    background: "rgba(0,19,43,0.06)",
    size: 84,
    left: "62%",
    top: "48%",
    rotate: 6,
  },
];

const FEATURES = [
  {
    icon: "📍",
    caption: "내 주변 술집부터",
    title: "한눈에 비교하고 골라요",
  },
  {
    icon: "💰",
    caption: "소주ㆍ맥주 가격을",
    title: "미리 확인해요",
  },
  {
    icon: "🕐",
    caption: "영업 중인지 마감 직전인지",
    title: "실시간으로 한눈에 보여드려요",
  },
  {
    icon: "🧭",
    caption: "길찾기 한 번이면",
    title: "원하는 지도 앱으로 바로 이동해요",
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { openToast } = useToast();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { authorizationCode, referrer } = await appLogin();
      const tokens = await tossLogin(authorizationCode, referrer);
      authStore.setTokens(tokens.accessToken, tokens.refreshToken);
      navigate("/map");
    } catch {
      openToast("로그인에 실패했어요. 다시 시도해주세요.", { gap: 30 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto",
      }}
    >
      <div style={{ padding: "12px 24px 0" }}>
        <img
          src={APP_ICON_URL}
          alt=""
          aria-hidden
          style={{ width: 48, height: 48, borderRadius: 14 }}
        />
        <div
          style={{
            marginTop: 20,
            fontSize: 26,
            fontWeight: 800,
            color: adaptive.grey900,
            lineHeight: 1.4,
            whiteSpace: "pre-line",
          }}
        >
          {"오늘,\n한잔할까요?"}
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 15,
            color: adaptive.grey500,
            lineHeight: 1.5,
            whiteSpace: "pre-line",
          }}
        >
          {"내 주변 술집과 가격을 한 번에 확인해보세요"}
        </div>
      </div>

      <div style={{ position: "relative", height: 200, margin: "28px 0 36px" }}>
        {HERO_ICONS.map((icon) => (
          <div
            key={icon.src}
            style={{
              position: "absolute",
              left: icon.left,
              top: icon.top,
              width: icon.size,
              height: icon.size,
              borderRadius: icon.size * 0.28,
              background: icon.background,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `rotate(${icon.rotate}deg)`,
              boxShadow: "0 8px 20px rgba(0,19,43,0.08)",
            }}
          >
            <img
              src={icon.src}
              alt=""
              aria-hidden
              style={{ width: "58%", height: "58%", objectFit: "contain" }}
            />
          </div>
        ))}
      </div>

      <div
        style={{
          padding: "0 24px",
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            style={{ display: "flex", alignItems: "center", gap: 14 }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: adaptive.greyOpacity100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              {feature.icon}
            </div>
            <div>
              <div style={{ fontSize: 13, color: adaptive.grey500 }}>
                {feature.caption}
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: 15,
                  fontWeight: 700,
                  color: adaptive.grey900,
                }}
              >
                {feature.title}
              </div>
            </div>
          </div>
        ))}
      </div>

      <FixedBottomCTA
        loading={loading}
        disabled={loading}
        onTap={() => {
          void handleLogin();
        }}
      >
        시작하기
      </FixedBottomCTA>
    </div>
  );
}
