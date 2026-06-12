import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "spirit-wannadrink",
  brand: {
    displayName: "한잔할까", // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: "#3182F6", // 앱의 기본 색상으로 바꿔주세요.
    icon: "https://static.toss.im/appsintoss/32779/2f94ba49-f1ee-4845-8bf5-1765be80f567.png", // 콘솔에서 등록한 아이콘 이미지 주소로 바꿔주세요.
  },
  web: {
    host: "192.168.45.134",
    port: 5173,
    commands: {
      dev: "vite --host",
      build: "vite build",
    },
  },
  permissions: [],
});
