/**
 * 모바일 도움말 페이지
 * - FAQ
 * - 기능 안내
 * - 문의하기
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HelpCircle, ChevronDown, ChevronUp, QrCode, ClipboardCheck,
  Wrench, Truck, Bell, MapPin, Camera, Smartphone, Mail, Phone,
  MessageCircle, ExternalLink
} from 'lucide-react';
import { MobileHeader } from '../../components/mobile/MobileLayout';

const FAQ_DATA = [
  {
    category: 'QR 스캔',
    icon: QrCode,
    color: 'text-blue-500',
    questions: [
      {
        q: 'QR 코드가 인식되지 않아요',
        a: '카메라 권한을 확인해주세요. 설정 > 앱 > CAMS > 권한에서 카메라를 허용해주세요. 또한 QR 코드가 깨끗하고 조명이 충분한지 확인해주세요.'
      },
      {
        q: 'QR 코드를 직접 입력할 수 있나요?',
        a: '네, QR 스캔 화면에서 "수동 입력" 버튼을 누르면 금형 코드를 직접 입력할 수 있습니다.'
      },
      {
        q: 'QR 세션이 만료되었다고 나와요',
        a: 'QR 세션은 8시간 동안 유효합니다. 세션이 만료되면 다시 QR 코드를 스캔해주세요.'
      }
    ]
  },
  {
    category: '점검',
    icon: ClipboardCheck,
    color: 'text-green-500',
    questions: [
      {
        q: '점검 중 앱이 종료되면 데이터가 사라지나요?',
        a: '아니요, 점검 데이터는 자동으로 임시 저장됩니다. 앱을 다시 열면 이어서 작성할 수 있습니다.'
      },
      {
        q: '점검 항목을 수정할 수 있나요?',
        a: '제출 전까지는 언제든 수정 가능합니다. 제출 후에는 관리자에게 문의해주세요.'
      },
      {
        q: '오프라인에서도 점검할 수 있나요?',
        a: '네, 오프라인에서도 점검을 진행할 수 있습니다. 인터넷 연결 시 자동으로 서버에 전송됩니다.'
      }
    ]
  },
  {
    category: '수리요청',
    icon: Wrench,
    color: 'text-orange-500',
    questions: [
      {
        q: '사진을 여러 장 첨부할 수 있나요?',
        a: '네, 최대 10장까지 첨부할 수 있습니다. 사진은 자동으로 압축되어 업로드됩니다.'
      },
      {
        q: '수리 진행 상황을 어떻게 확인하나요?',
        a: '알림 탭에서 수리 현황 알림을 받을 수 있고, 금형 상세 페이지에서도 확인 가능합니다.'
      }
    ]
  },
  {
    category: '이관',
    icon: Truck,
    color: 'text-cyan-500',
    questions: [
      {
        q: '이관 요청은 어떻게 하나요?',
        a: '금형 상세 페이지에서 "이관요청" 버튼을 누르고, 인수 업체와 이관 사유를 입력하면 됩니다.'
      },
      {
        q: 'GPS 위치가 정확하지 않아요',
        a: '실외에서 GPS 신호가 더 정확합니다. 건물 내부에서는 정확도가 떨어질 수 있습니다.'
      }
    ]
  },
  {
    category: '알림',
    icon: Bell,
    color: 'text-purple-500',
    questions: [
      {
        q: '푸시 알림이 오지 않아요',
        a: '설정 > 알림 설정에서 알림 권한을 허용해주세요. iOS의 경우 앱을 홈 화면에 추가해야 푸시 알림을 받을 수 있습니다.'
      },
      {
        q: '특정 알림만 받을 수 있나요?',
        a: '네, 알림 설정 페이지에서 알림 유형별로 켜고 끌 수 있습니다.'
      }
    ]
  }
];

const FEATURES = [
  { icon: QrCode, title: 'QR 스캔', desc: '금형 QR 코드를 스캔하여 빠르게 접근' },
  { icon: ClipboardCheck, title: '점검', desc: '일상/정기 점검 수행 및 기록' },
  { icon: Wrench, title: '수리요청', desc: 'NG 발생 시 수리 요청 등록' },
  { icon: Truck, title: '이관', desc: '금형 이관 요청 및 승인' },
  { icon: MapPin, title: '위치추적', desc: 'GPS 기반 금형 위치 기록' },
  { icon: Camera, title: '사진촬영', desc: '금형 상태 사진 촬영 및 첨부' }
];

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="font-medium text-gray-900 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function MobileHelp() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <MobileHeader title="도움말" />

      <div className="px-4 py-4 space-y-4">
        {/* 주요 기능 안내 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">주요 기능</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 p-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col items-center p-3 bg-gray-50 rounded-lg"
              >
                <feature.icon className="w-6 h-6 text-blue-500 mb-2" />
                <span className="text-xs font-medium text-gray-900">{feature.title}</span>
                <span className="text-xs text-gray-500 text-center mt-1">{feature.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">자주 묻는 질문</h3>
          </div>
          
          {FAQ_DATA.map((category) => (
            <div key={category.category}>
              <button
                onClick={() => setActiveCategory(
                  activeCategory === category.category ? null : category.category
                )}
                className="w-full flex items-center justify-between p-4 bg-gray-50 border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <category.icon className={`w-5 h-5 ${category.color}`} />
                  <span className="font-medium text-gray-900">{category.category}</span>
                  <span className="text-xs text-gray-500">({category.questions.length})</span>
                </div>
                {activeCategory === category.category ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {activeCategory === category.category && (
                <div>
                  {category.questions.map((item, idx) => (
                    <FAQItem key={idx} question={item.q} answer={item.a} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 문의하기 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">문의하기</h3>
            <p className="text-xs text-gray-500 mt-1">추가 도움이 필요하시면 연락해주세요</p>
          </div>
          
          <div className="divide-y divide-gray-100">
            <a
              href="mailto:support@cams.co.kr"
              className="flex items-center gap-3 p-4"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">이메일 문의</p>
                <p className="text-sm text-gray-500">support@cams.co.kr</p>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400" />
            </a>
            
            <a
              href="tel:02-1234-5678"
              className="flex items-center gap-3 p-4"
            >
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">전화 문의</p>
                <p className="text-sm text-gray-500">02-1234-5678 (평일 09:00-18:00)</p>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400" />
            </a>
          </div>
        </div>

        {/* 앱 정보 */}
        <div className="text-center text-xs text-gray-400 pt-4">
          <p>CAMS 금형관리 시스템 v1.0.1</p>
          <p className="mt-1">© 2025 CAMS. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
