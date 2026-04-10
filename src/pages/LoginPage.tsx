import { useNavigate } from 'react-router-dom'
import { Asset, AgreementV3, BottomSheet, TextButton, Top } from '@toss/tds-mobile'
import { adaptive } from '@toss/tds-colors'

const AGREEMENTS = [
  { id: '0', label: '[한잔할까] 동의항목', arrowType: 'none' as const },
  { id: '1', label: '동의항목은 콘솔에서 수정할 수 있어요', arrowType: 'link' as const },
  { id: '2', label: '이 화면은 확인용으로만 사용해주세요', arrowType: 'link' as const },
  { id: '3', label: '', arrowType: 'link' as const },
  { id: '4', label: '토스 동의항목', arrowType: 'link' as const },
  { id: '5', label: '[필수] 개인정보 제3자 정보 제공', arrowType: 'link' as const },
  { id: '6', label: '[선택] 선택 제공 항목', arrowType: 'link' as const },
]

export default function LoginPage() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Top
        title={
          <Top.TitleParagraph size={28} color={adaptive.grey900}>
            [한잔할까]에서 토스로{'\n'}로그인할까요?
          </Top.TitleParagraph>
        }
        upper={
          <Top.UpperAssetContent
            content={
              <Asset.Image
                frameShape={Asset.frameShape.CleanW60}
                src="https://static.toss.im/appsintoss/32779/2f94ba49-f1ee-4845-8bf5-1765be80f567.png"
                aria-hidden={true}
              />
            }
          />
        }
      />

      <BottomSheet
        header={
          <BottomSheet.Header>[한잔할까] 로그인을 위해 꼭 필요한 동의만 추렸어요</BottomSheet.Header>
        }
        open={true}
        onClose={() => {}}
        cta={
          <div onClick={() => navigate('/map')}>
            <BottomSheet.CTA
              bottomAccessory={
                <TextButton size="xsmall" variant="underline">
                  다음에
                </TextButton>
              }
              color="primary"
              variant="fill"
              disabled={false}
            >
              동의하고 시작하기
            </BottomSheet.CTA>
          </div>
        }
      >
        {AGREEMENTS.map((item) => (
          <AgreementV3.SingleField
            key={item.id}
            type="medium"
            arrowType={item.arrowType}
          >
            {item.label}
          </AgreementV3.SingleField>
        ))}
      </BottomSheet>
    </div>
  )
}
