import { createRoute } from '@granite-js/react-native';
import WebView from '@granite-js/native/react-native-webview';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ListRow } from '@toss/tds-react-native';
import type { WebViewMessageEvent } from '@granite-js/native/react-native-webview';
import { useAdaptive } from '@toss/tds-react-native/private';
import KakaoMapHTML from '../kakaomap/KakaoMapHTML';
import generateMapScript from '../kakaomap/generateMapScript';

const KAKAO_MAP_APP_KEY = 'f5e6db800b171aa75ab189e0c334c74a';
const INITIAL_LATITUDE = 37.5665;
const INITIAL_LONGITUDE = 126.978;
const SHEET_HEIGHT = 400;
const SHEET_HIDDEN_POSITION = SHEET_HEIGHT + 40;
const SHEET_CLOSE_THRESHOLD = 110;

const sampleMarkers = [
  {
    storeId: 1,
    storeName: '시청 포차',
    locationDto: {
      latitude: 37.5665,
      longitude: 126.978,
    },
    postCount: 12,
    isCertified: true,
    isAlwaysOpen: false,
    operationInfoDtos: [],
  },
  {
    storeId: 2,
    storeName: '을지 한잔집',
    locationDto: {
      latitude: 37.5661,
      longitude: 126.9822,
    },
    postCount: 8,
    isCertified: false,
    isAlwaysOpen: false,
    operationInfoDtos: [],
  },
  {
    storeId: 3,
    storeName: '광화문 소맥',
    locationDto: {
      latitude: 37.5713,
      longitude: 126.9768,
    },
    postCount: 5,
    isCertified: true,
    isAlwaysOpen: true,
    operationInfoDtos: [],
  },
] as const;

const bottomSheetItems = [
  {
    id: 'seongsu',
    area: '성수',
    name: '만원수산',
    menu: '소주 3,000원 · 맥주 3,000원',
    note: '성수역 5분 · 포장 가능',
  },
  {
    id: 'konkuk',
    area: '건대',
    name: '삼천포포차',
    menu: '하이볼 4,500원 · 모둠꼬치 9,900원',
    note: '밤 12시까지 · 2차 가기 좋음',
  },
  {
    id: 'euljiro',
    area: '을지',
    name: '골목잔집',
    menu: '생맥주 3,500원 · 김치전 7,000원',
    note: '을지로입구역 도보 3분',
  },
  {
    id: 'hapjeong',
    area: '합정',
    name: '한잔포차',
    menu: '소주 4,000원 · 닭껍질튀김 8,500원',
    note: '창가석 있음 · 웨이팅 적음',
  },
  {
    id: 'mangwon',
    area: '망원',
    name: '망원술상',
    menu: '막걸리 5,000원 · 두부김치 10,000원',
    note: '망리단길 안쪽 · 혼술 가능',
  },
  {
    id: 'sinchon',
    area: '신촌',
    name: '청춘호프',
    menu: '500cc 2,900원 · 감자튀김 6,900원',
    note: '학생 손님 많음 · 시끌벅적',
  },
  {
    id: 'yeonnam',
    area: '연남',
    name: '연남소맥',
    menu: '소맥 세트 9,900원 · 오뎅탕 8,000원',
    note: '연트럴파크 근처 · 테라스석',
  },
  {
    id: 'munrae',
    area: '문래',
    name: '철공소펍',
    menu: '수제맥주 4,900원 · 나초 7,500원',
    note: '문래창작촌 입구 · 단체 가능',
  },
  {
    id: 'jamsil',
    area: '잠실',
    name: '석촌한잔',
    menu: '와인 1잔 5,500원 · 치즈플레이트 11,000원',
    note: '석촌호수 도보권 · 조용한 분위기',
  },
  {
    id: 'seochon',
    area: '서촌',
    name: '서촌주막',
    menu: '전통주 4,000원 · 육전 12,000원',
    note: '경복궁역 근처 · 데이트용',
  },
  {
    id: 'sungshin',
    area: '성신',
    name: '별빛포차',
    menu: '소주 3,500원 · 제육볶음 9,000원',
    note: '가성비 좋음 · 새벽 2시 마감',
  },
  {
    id: 'wangsimni',
    area: '왕십리',
    name: '회포장마차',
    menu: '참이슬 3,500원 · 광어회 15,000원',
    note: '왕십리역 2번 출구 · 저녁 피크 붐빔',
  },
] as const;

export const Route = createRoute('/map', {
  component: Page,
});

function Page() {
  const adaptive = useAdaptive();
  const webViewRef = useRef<{
    injectJavaScript: (script: string) => void;
  } | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const translateY = useRef(new Animated.Value(SHEET_HIDDEN_POSITION)).current;
  const translateYValueRef = useRef(SHEET_HIDDEN_POSITION);
  const dragStartYRef = useRef(SHEET_HIDDEN_POSITION);
  const scrollOffsetYRef = useRef(0);
  const isSheetVisibleRef = useRef(false);

  useEffect(() => {
    isSheetVisibleRef.current = isSheetVisible;
  }, [isSheetVisible]);

  useEffect(() => {
    const listenerId = translateY.addListener(({ value }) => {
      translateYValueRef.current = value;
    });

    return () => {
      translateY.removeListener(listenerId);
    };
  }, [translateY]);

  const animateTo = (toValue: number, onFinished?: () => void) => {
    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      tension: 90,
      friction: 16,
    }).start(({ finished }) => {
      if (finished) {
        onFinished?.();
      }
    });
  };

  const openSheet = () => {
    setIsSheetVisible(true);
    scrollOffsetYRef.current = 0;
    animateTo(0);
  };

  const closeSheet = () => {
    animateTo(SHEET_HIDDEN_POSITION, () => {
      scrollOffsetYRef.current = 0;
      setIsSheetVisible(false);
    });
  };

  const beginDrag = () => {
    translateY.stopAnimation(value => {
      dragStartYRef.current = value;
      translateYValueRef.current = value;
    });
  };

  const updateDrag = (dy: number) => {
    const nextValue = Math.min(
      SHEET_HIDDEN_POSITION,
      Math.max(0, dragStartYRef.current + Math.max(0, dy))
    );

    translateY.setValue(nextValue);
  };

  const finishDrag = (dy: number, vy: number) => {
    const shouldClose =
      translateYValueRef.current > SHEET_CLOSE_THRESHOLD || dy > 120 || vy > 1.1;

    if (shouldClose) {
      closeSheet();
      return;
    }

    animateTo(0);
  };

  const handlePanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          isSheetVisibleRef.current &&
          Math.abs(gestureState.dy) > 2 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderGrant: () => {
          beginDrag();
        },
        onPanResponderMove: (_, gestureState) => {
          updateDrag(gestureState.dy);
        },
        onPanResponderRelease: (_, gestureState) => {
          finishDrag(gestureState.dy, gestureState.vy);
        },
        onPanResponderTerminate: (_, gestureState) => {
          finishDrag(gestureState.dy, gestureState.vy);
        },
      }),
    []
  );

  const contentPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          isSheetVisibleRef.current &&
          scrollOffsetYRef.current <= 0 &&
          gestureState.dy > 6 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderGrant: () => {
          beginDrag();
        },
        onPanResponderMove: (_, gestureState) => {
          updateDrag(gestureState.dy);
        },
        onPanResponderRelease: (_, gestureState) => {
          finishDrag(gestureState.dy, gestureState.vy);
        },
        onPanResponderTerminate: (_, gestureState) => {
          finishDrag(gestureState.dy, gestureState.vy);
        },
      }),
    []
  );

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);

      if (payload.action === 'mapReady') {
        webViewRef.current?.injectJavaScript(
          generateMapScript(INITIAL_LATITUDE, INITIAL_LONGITUDE, sampleMarkers)
        );
      }
    } catch {
      return;
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: KakaoMapHTML(KAKAO_MAP_APP_KEY) }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        onMessage={handleMessage}
      />

      {!isSheetVisible ? (
        <View pointerEvents="box-none" style={styles.overlay}>
          <Pressable style={styles.listButton} onPress={openSheet}>
            <Text style={styles.listButtonText}>목록으로 보기</Text>
          </Pressable>
        </View>
      ) : null}

      {isSheetVisible ? (
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.sheet}>
            <View {...handlePanResponder.panHandlers} style={styles.handleTouchArea}>
              <View style={styles.handleIndicator} />
            </View>

            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: adaptive.grey900 }]}>
                가성비 술집
              </Text>
              <Text style={[styles.headerDescription, { color: adaptive.grey600 }]}>
                핸들을 내리거나 리스트 최상단에서 아래로 끌면 닫혀요.
              </Text>
            </View>

            <View style={styles.listContainer} {...contentPanResponder.panHandlers}>
              <ScrollView
                bounces={true}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={event => {
                  scrollOffsetYRef.current = event.nativeEvent.contentOffset.y;
                }}
                contentContainerStyle={styles.listContent}
              >
                {bottomSheetItems.map(item => (
                  <ListRow
                    key={item.id}
                    left={
                      <ListRow.LeftText color={adaptive.grey500}>
                        {item.area}
                      </ListRow.LeftText>
                    }
                    contents={
                      <ListRow.Texts
                        type="3RowTypeA"
                        top={item.name}
                        topProps={{ color: adaptive.grey800, fontWeight: 'bold' }}
                        middle={item.menu}
                        middleProps={{ color: adaptive.grey700 }}
                        bottom={item.note}
                        bottomProps={{ color: adaptive.grey600 }}
                      />
                    }
                    verticalPadding="medium"
                  />
                ))}
              </ScrollView>
            </View>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  overlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 28,
    zIndex: 10,
  },
  listButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#3cbbff',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  listButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 12,
  },
  handleTouchArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  handleIndicator: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D1D6DB',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 18,
  },
});
