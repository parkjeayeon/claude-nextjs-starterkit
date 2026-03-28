# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 개발 명령어

```bash
npm run dev           # 개발 서버 (localhost:3000)
npm run build         # 프로덕션 빌드
npm run lint          # ESLint 검사
npm run format        # Prettier 포맷팅
npm run format:check  # 포맷팅 검사 (수정 없음)
npm run test          # Playwright E2E 테스트
npm run test:ui       # Playwright UI 모드
npx playwright test e2e/home.spec.ts              # 단일 테스트 파일 실행
npx playwright test -g "테스트 이름"               # 이름으로 필터
npx playwright test --project=chromium             # 특정 브라우저만
```

## 기술 스택

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5** (strict mode)
- **Tailwind CSS 4** — `tailwind.config.ts` 없음, `app/globals.css`의 `@theme inline`에서 직접 설정
- **shadcn/ui** (radix-vega 스타일) — `npx shadcn@latest add <name>`으로 컴포넌트 추가
- **zustand** + **immer** (상태 관리)
- **react-hook-form** + **zod** (폼 검증)
- **next-themes** (다크/라이트 모드)
- **sonner** (토스트), **lucide-react** (아이콘), **date-fns** (날짜)

## 아키텍처

```
app/                    # App Router 페이지 (기본 RSC)
  layout.tsx            # 루트 레이아웃 (폰트, 프로바이더, Toaster)
  providers.tsx         # 클라이언트 프로바이더 (ThemeProvider, TooltipProvider)
  globals.css           # Tailwind 4 + CSS 변수 테마 (oklch)
  examples/             # 컴포넌트 쇼케이스 페이지
  (demo)/               # 데모 라우트 그룹 (blog/[slug] 등)
components/
  ui/                   # shadcn/ui 프리미티브 (직접 수정 가능)
  layout/               # Header, Footer, Container, MobileNav
  common/               # Logo, ThemeToggle
lib/
  utils.ts              # cn() — clsx + tailwind-merge
  metadata.ts           # getMetadata() — 경로 기반 SEO 메타데이터 헬퍼
hooks/                  # 커스텀 훅 (useMediaQuery 등)
e2e/                    # Playwright E2E 테스트
docs/specs/             # 기술 패턴 문서
```

## 주요 패턴

### RSC / 클라이언트 경계
- `app/` 내 컴포넌트는 기본 Server Component
- 상호작용이 필요하면 `'use client'` 선언 (폼, 토글, 모바일 네비 등)
- `providers.tsx`가 클라이언트 경계 — ThemeProvider, TooltipProvider 래핑

### Next.js 16 주의사항
- **동적 라우트 params가 Promise**: `const { slug } = await params` 형태로 사용
- `next.config.ts`에서 `experimental.typedEnv` 활성화됨
- 코드 작성 전 `node_modules/next/dist/docs/`의 관련 가이드를 확인할 것

### 클래스 병합
- 조건부 클래스는 반드시 `cn()` 사용: `cn('base', condition && 'extra')`
- shadcn/ui 컴포넌트는 CVA(class-variance-authority)로 variants 정의

### SEO 메타데이터
- `lib/metadata.ts`의 `getMetadata(path, override?)`로 일관된 메타데이터 생성
- 환경변수: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`
- OG 이미지, robots.ts, sitemap.ts 설정 완료

### 테마
- CSS 변수 (oklch 색상 공간) 기반, `.dark` 클래스로 다크모드 전환
- Tailwind CSS 4: `@theme inline` 블록에서 CSS 변수를 Tailwind 색상으로 매핑
- `@custom-variant dark (&:is(.dark *))` 사용

### 폼
- react-hook-form + zod 스키마 + `@hookform/resolvers`
- `z.infer<typeof schema>`로 타입 추출
- sonner 토스트로 제출 결과 알림

### 경로 alias
- `@/*`로 프로젝트 루트 참조 (예: `@/components/ui/button`)

## 코드 스타일

- Prettier: 세미콜론 없음, 작은따옴표, 2칸 들여쓰기, trailing comma
- `prettier-plugin-tailwindcss`로 클래스 자동 정렬
- 컴포넌트는 named export 사용
