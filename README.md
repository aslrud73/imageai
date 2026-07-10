# 마음결 — 관계 조율 노트

부부 갈등 패턴 기록 웹앱 (개발 기획서 v0.2 · 개인계정 분리형 기반).
"함께 쓰는 싸움 기록장"이 아니라 **각자 쓰고, 필요한 만큼만 공유하는 관계 조율 노트**.

## 현재 단계: 로컬 프로토타입 (v0.1)

- 모바일 전용 웹앱 (PWA) — 모든 데이터는 기기(localStorage)에만 저장, 서버 전송 없음
- 커플 연결(연결코드)·계정은 다음 버전에서 백엔드(Firebase/Supabase) 연동 예정

## 핵심 흐름 (기획서 5장)

내 기록(비공개) → 하루 뒤 회고 → 공유 선택(미리보기) → 우리 패턴 → 우리 약속(실천 체크)

## 설계 원칙 반영

- **기본 비공개**: 자유 메모·반응 기록은 공유 대상에서 아예 제외
- **선택 공유**: 주제·감정 강도·실제 욕구·요청 문장만 항목별 토글 + 공유 전 미리보기 + 철회
- **비판정 구조**: 잘잘못·점수화 없음, 패턴 확인 중심 리포트 + 고정 면책 문구
- **안전 우선**: 기록 폼과 설정에 안전 안내 문구
- **이모지 미사용**: 전부 인라인 SVG 아이콘

## 디자인

- 색상: 따뜻한 아이보리(#FAF6F0) + 테라코타(#9C5B43) + 세이지 보조색
- 폰트: **고운바탕(Gowun Batang)** — @fontsource로 앱에 내장 (외부 CDN 불필요)

## 개발

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드 (dist/)
```

## 구조

```
src/
  App.jsx               탭 네비게이션 + 화면 전환
  store.js              localStorage 저장소 + 프리셋/유틸
  components/Icons.jsx  SVG 아이콘 세트
  screens/
    Home.jsx            홈 (기록 CTA, 회고 대기, 이번 주 약속)
    RecordForm.jsx      30초 빠른 기록 (비공개 저장)
    Logs.jsx            내 기록 목록 + 회고 작성 + 공유 선택/철회
    Patterns.jsx        우리 패턴 (공유 동의 데이터만 집계)
    Agreements.jsx      우리 약속 (주간 실천 체크, 이행률)
    Settings.jsx        안내·안전 문구·데이터 삭제
```

## Google Drive 자동 백업 활성화 (선택)

사용자가 자기 구글 계정을 연결해 **본인 드라이브에 자동 백업**하는 기능.
`VITE_GOOGLE_CLIENT_ID` 환경 변수가 있어야 활성화된다 (없으면 설정 화면에 "준비 중" 표시).

1. [Google Cloud Console](https://console.cloud.google.com)에서 새 프로젝트 생성
2. "API 및 서비스 → 라이브러리"에서 **Google Drive API** 사용 설정
3. "OAuth 동의 화면" 구성 — 게시 상태 **테스트**, 테스트 사용자에 사용할 이메일 추가
4. "사용자 인증 정보 → OAuth 클라이언트 ID" 생성
   - 유형: **웹 애플리케이션**
   - 승인된 JavaScript 원본: 배포 주소 (예: `https://imageai-xxx.vercel.app`) + `http://localhost:5173`
5. 발급된 클라이언트 ID를 Vercel → Settings → Environment Variables에
   `VITE_GOOGLE_CLIENT_ID` 로 등록 후 재배포

- 권한 범위는 `drive.file` (이 앱이 만든 파일만 접근) — 사용자의 다른 드라이브 파일은 볼 수 없음
- 개발자 비용 0원: 저장 용량은 각 사용자 본인의 드라이브(무료 15GB)를 사용

## 다음 단계 (기획서 로드맵)

- 커플 연결코드 + 개인계정 (Firebase Auth/Firestore 또는 Supabase)
- 상대 공유 패킷 열람, 공동 리포트 실데이터화
- AI 문장 순화(비난 → 요청문) — 서버리스 프록시 경유
- PWA 오프라인/푸시 알림 (회고·약속 리마인드)
