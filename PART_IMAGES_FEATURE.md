# 부품사진 업로드 기능 구현 완료

## 📋 개요
금형 신규 등록 시 부품사진을 업로드할 수 있는 기능이 추가되었습니다.

## ✅ 구현 내용

### 1. 데이터베이스
- **테이블**: `mold_specifications`
- **필드 추가**: `part_images` (JSONB)
- **구조**: 
```json
[
  {
    "url": "/uploads/filename.jpg",
    "filename": "original-name.jpg",
    "size": 1024000,
    "mimetype": "image/jpeg",
    "uploaded_at": "2025-11-27T10:00:00.000Z",
    "uploaded_by": 1
  }
]
```

### 2. 백엔드 API

#### 엔드포인트
1. **부품사진 업로드**
   - `POST /api/v1/mold-specifications/:id/part-images`
   - 최대 10개 이미지 업로드 가능
   - 지원 형식: JPG, PNG, GIF
   - 최대 파일 크기: 10MB

2. **부품사진 삭제**
   - `DELETE /api/v1/mold-specifications/:id/part-images/:imageIndex`
   - 특정 인덱스의 이미지 삭제

#### 파일 저장
- 로컬 저장소: `uploads/` 디렉토리
- 파일명 형식: `{원본파일명}-{타임스탬프}-{랜덤숫자}.{확장자}`
- 정적 파일 제공: `/uploads` 경로로 접근 가능

### 3. 프론트엔드

#### 기능
- **이미지 선택**: 파일 선택 버튼으로 다중 이미지 선택
- **미리보기**: 선택한 이미지 그리드 형태로 표시
- **삭제**: 각 이미지에 X 버튼으로 개별 삭제
- **파일 정보**: 파일명, 파일 크기 표시
- **업로드 상태**: 업로드 중 로딩 표시

#### UI 위치
- 금형 신규 등록 페이지 (`/molds/new`)
- "일정 및 예산" 섹션과 "비고" 섹션 사이

## 🚀 배포 방법

### 1. 마이그레이션 실행
```bash
# Railway 환경에서 실행
cd server
node run-part-images-migration.js
```

또는 Sequelize CLI 사용:
```bash
cd server
npx sequelize-cli db:migrate
```

### 2. 서버 재시작
```bash
# 로컬 환경
npm run dev

# 프로덕션 (Railway는 자동 배포)
npm start
```

### 3. 업로드 디렉토리 확인
- 로컬: `server/uploads/` 디렉토리가 자동 생성됨
- Railway: 환경변수 `UPLOAD_PATH` 설정 필요 (선택사항)

## 📝 사용 방법

### 금형 등록 시 부품사진 추가
1. `/molds/new` 페이지 접속
2. 기본 정보 입력
3. "부품 사진" 섹션에서 "사진 선택" 버튼 클릭
4. 이미지 파일 선택 (최대 10개)
5. 미리보기에서 확인
6. 불필요한 이미지는 X 버튼으로 삭제
7. "등록" 버튼 클릭

### 이미지 업로드 프로세스
1. 금형 정보 먼저 등록 (mold_specifications 생성)
2. 생성된 specification_id로 이미지 업로드
3. 업로드 실패 시에도 금형 등록은 유지 (에러 무시)

## 🔧 기술 스택

### 백엔드
- **파일 업로드**: Multer
- **저장소**: 로컬 파일 시스템
- **데이터베이스**: PostgreSQL JSONB

### 프론트엔드
- **UI 라이브러리**: React
- **아이콘**: Lucide React
- **파일 업로드**: FormData API
- **미리보기**: URL.createObjectURL()

## 📊 데이터 구조

### mold_specifications 테이블
```sql
ALTER TABLE mold_specifications 
ADD COLUMN part_images JSONB DEFAULT NULL;

COMMENT ON COLUMN mold_specifications.part_images 
IS '부품 사진 URL 배열 - [{"url": "...", "filename": "...", "uploaded_at": "..."}]';
```

## 🔒 보안 고려사항

1. **파일 타입 검증**: 이미지 파일만 허용 (MIME type 체크)
2. **파일 크기 제한**: 최대 10MB
3. **파일 개수 제한**: 최대 10개
4. **인증 필요**: JWT 토큰 인증 필수
5. **권한 확인**: 금형개발 담당자 또는 시스템 관리자만 업로드 가능

## 🐛 에러 처리

### 업로드 실패 시
- 업로드된 파일 자동 삭제
- 에러 메시지 반환
- 금형 등록은 유지 (부품사진은 선택사항)

### 삭제 실패 시
- 파일 시스템에서 삭제 시도
- DB에서 메타데이터 제거
- 에러 로그 기록

## 📁 파일 구조

```
server/
├── src/
│   ├── controllers/
│   │   └── moldSpecificationController.js  # 업로드/삭제 API
│   ├── routes/
│   │   └── moldSpecifications.js           # 라우트 정의
│   ├── middleware/
│   │   └── upload.js                       # Multer 설정
│   ├── models/
│   │   └── MoldSpecification.js            # 모델 업데이트
│   └── migrations/
│       └── 20251127000000-add-part-images-to-mold-specifications.js
├── uploads/                                 # 업로드 디렉토리
└── run-part-images-migration.js            # 마이그레이션 스크립트

client/
└── src/
    └── pages/
        └── MoldNew.jsx                      # UI 구현
```

## 🧪 테스트

### 수동 테스트 체크리스트
- [ ] 이미지 선택 및 미리보기
- [ ] 이미지 삭제
- [ ] 금형 등록 + 이미지 업로드
- [ ] 이미지 없이 금형 등록
- [ ] 10개 초과 이미지 선택 시도
- [ ] 10MB 초과 파일 업로드 시도
- [ ] 이미지 아닌 파일 업로드 시도
- [ ] 업로드된 이미지 URL 접근 확인

### API 테스트 (Postman)
```bash
# 이미지 업로드
POST /api/v1/mold-specifications/1/part-images
Authorization: Bearer {token}
Content-Type: multipart/form-data
Body: photos[] = [file1, file2, ...]

# 이미지 삭제
DELETE /api/v1/mold-specifications/1/part-images/0
Authorization: Bearer {token}
```

## 🎯 향후 개선 사항

1. **클라우드 스토리지**: AWS S3, Google Cloud Storage 연동
2. **이미지 최적화**: 자동 리사이징, 압축
3. **썸네일 생성**: 목록 표시용 썸네일
4. **이미지 편집**: 크롭, 회전 기능
5. **드래그 앤 드롭**: 파일 선택 UI 개선
6. **진행률 표시**: 업로드 진행률 바
7. **이미지 순서 변경**: 드래그로 순서 조정

## 📞 문의

문제 발생 시 개발팀에 문의하세요.
