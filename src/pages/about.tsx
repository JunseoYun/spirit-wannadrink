import { createRoute, Spacing } from '@granite-js/react-native';
import {
  Asset,
  BottomSheet,
  Button,
  FixedBottomCTA,
  FixedBottomCTAProvider,
  ListRow,
  Top,
  Txt,
} from '@toss/tds-react-native';
import { useAdaptive } from '@toss/tds-react-native/private';

export const Route = createRoute('/about', {
  component: Page,
});

function Page() {
  const adaptive = useAdaptive();
  const navigation = Route.useNavigation();

  const goToMapPage = () => {
    navigation.navigate('/map');
  };
  return (
    <>
      <Spacing size={10} />
      <>
        <Asset.Icon
          frameShape={Asset.frameShape.CleanW24}
          name="icon-arrow-back-ios-mono"
          color="#191F28ff"
        />
      </>
      <>
        <Asset.Image
          frameShape={{ width: 16 }}
          source={{
            uri: 'https://static.toss.im/appsintoss/32779/2f94ba49-f1ee-4845-8bf5-1765be80f567.png',
          }}
        />
      </>
      <Txt color="#191F28ff" typography="t6" fontWeight="semibold">
        한잔할까
      </Txt>
      <>
        <Asset.Icon
          frameShape={{ width: 20 }}
          name="icon-dots-mono"
          color="rgba(0, 19, 43, 0.58)"
        />
      </>
      <>
        <Asset.Icon
          frameShape={{ width: 20 }}
          name="icon-x-mono"
          color="rgba(0, 19, 43, 0.58)"
        />
      </>
      <Spacing size={272} />
      <Top
        title={
          <Top.TitleParagraph color={adaptive.grey900}>
            중고 맥북 에어 M2 99,900원부터
          </Top.TitleParagraph>
        }
        subtitle2={
          <Top.SubtitleParagraph>
            중고 컴퓨터 시세를 비교하고 합리적인 가격에 구매할 수 있어요
          </Top.SubtitleParagraph>
        }
      />
      <FixedBottomCTAProvider>
        <FixedBottomCTA.Double
          leftButton={
            <Button
              type="dark"
              style="weak"
              display="block"
              disabled={false}
              loading={false}
              onPress={goToMapPage}
            >
              로그인 없이 둘러보기
            </Button>
          }
          rightButton={
            <Button
              type="primary"
              style="fill"
              display="block"
              disabled={false}
              loading={false}
              onPress={goToMapPage}
            >
              토스로 로그인하기
            </Button>
          }
        />
      </FixedBottomCTAProvider>
      <BottomSheet.Root
        header={<BottomSheet.Header>가성비 술집</BottomSheet.Header>}
       
        wrapperProps={{
          bounces: true,
          showsVerticalScrollIndicator: false,
          contentContainerStyle: {
            paddingBottom: 24,
          },
        }}
        open={false}
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
            verticalPadding="large"
          />
        ))}
      </BottomSheet.Root>
    </>
  );
}


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