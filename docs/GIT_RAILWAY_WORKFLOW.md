# Git + Railway 개발 워크플로우

## 1. 기술 스택 요약
- **Frontend**: React 18 + Vite + TypeScript(선택 가능) + Tailwind CSS + Apple Design System. 모듈 단위 컴포넌트로 구성해 Vite 개발 서버와 상시 Hot Reload.
- **Backend**: Node.js 18 + Express + Sequelize (PostgreSQL). JWT 인증, Multer 파일 업로드, `API_SPEC.md` 기반 REST/GraphQL. `ts-node-dev` 또는 `node --loader ts-node/esm`로 빠른 리로드.
- **Infra**: Railway에 Git 연동 배포. Frontend는 Vite build → Serve, Backend는 Express start.

## 2. Git 브랜치 정책
1. `main`: 배포 가능한 코드만 존재. Railway main branch 자동 배포.
2. `feature/<short-desc>`: 새로운 체크리스트/기능 작업. PR 전에 lint/test 통과 필요.
3. `hotfix/<issue>`: 운영 중 긴급 수정.
4. 커밋 메시지는 `feat:`, `fix:`, `docs:`, `chore:` 등 Conventional Commits 스타일을 유지.

## 3. 개발 흐름 (로컬)
```
# 상세 브랜치 생성
git checkout -b feature/mold-transfer-checklist

# 변경 후
npm run lint
npm run test
npm run build

git add .
git commit -m "feat: add transfer checklist table"
git push origin feature/mold-transfer-checklist
```
- Frontend: `/client` 디렉터리에서 `npm run dev` (Vite).
- Backend: `/server`에서 `npm run dev` (nodemon/ts-node). 두 서버는 `proxy` 설정으로 API 연결.

## 4. Railway 자동 배포
1. GitHub → Railway 연동 설정: `railway.json` 또는 `railway.toml`에서 프로젝트 지정.
2. `main` 브랜치 머지 시 Railway가 자동 빌드.
3. Backend 환경 변수
   ```env
   DATABASE_URL=
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=
   CORS_ORIGIN=https://frontend.railway.app
   ```
4. Frontend (client) 환경 변수
   ```env
   VITE_API_URL=https://backend.railway.app
   VITE_APP_NAME=CAMS
   ```
5. 빌드 명령
   - Backend: `npm install && npm start`
   - Frontend: `npm install --legacy-peer-deps && npm run build`

## 5. 테스트 및 릴리스
- Railway 배포 후 `curl https://{backend}/health` 확인.
- DB 마이그레이션은 `npm run db:migrate` 후 `railway run`.
- `API_SPEC.md` 기반으로 Postman 컬렉션/Swagger 갱신.

## 6. 문서 연동
- 체크리스트 변경 시 `checklist_template_history`에 기록되고, 관리자 UI에서 새 버전 스케줄링.
- `Report_Templates.md`에 기반한 PDF/Excel 자동화는 Git 커밋으로 템플릿 버전 유지.
- `README.md`, `RAILWAY_DEPLOYMENT_GUIDE.md`, `API_SPEC.md` 등 문서 참조 필수.
