---
name: StarterKit 프로젝트 패턴 및 컨벤션
description: claude-nextjs-starterkit2 프로젝트의 주요 아키텍처 결정, 컴포넌트 패턴, 알려진 이슈
type: project
---

## 프로젝트 구조 결정

- shadcn/ui를 radix-ui 직접 임포트 방식으로 사용 (`radix-ui` 패키지, `Slot.Root` 패턴)
- Tailwind CSS 4: `tailwind.config.ts` 없음, `app/globals.css`의 `@theme inline` 블록에서 CSS 변수 매핑
- `usehooks-ts` 패키지가 dependencies에 있으나 실제로 사용되지 않음 (불필요 의존성)
- `date-fns`도 dependencies에 있으나 실제 코드에서 미사용

## 알려진 코드 이슈

1. **form-showcase.tsx L53**: `zodResolver(contactSchema as any)` — eslint-disable 주석과 함께 any 타입 캐스팅. zod v4와 @hookform/resolvers 호환성 문제로 발생. 실제 버그 가능성 있음.
2. **app/layout.tsx**: `suppressHydrationWarning`이 `<html>`과 `<body>` 양쪽에 중복 적용됨. body에는 불필요.
3. **layout.tsx**: `APP_URL`, `APP_NAME` 상수가 `lib/metadata.ts`와 중복 정의됨.
4. **app/page.tsx**: 홈 링크 `href="#features"`에 Next.js `<Link>` 대신 `<a>` 태그 사용.
5. **header.tsx**: nav 링크에 Next.js `<Link>` 대신 `<a>` 태그 사용 (외부 링크 제외).
6. **error.tsx**: `error` prop이 함수 시그니처에는 없지만 Next.js가 전달함 — 타입은 있으나 실제 사용 안 함.
7. **metadata.ts**: `override` 스프레드가 마지막에 와서 `openGraph`, `twitter` 필드를 덮어씀.
8. **sitemap.ts**: `/blog/hello-world` 하드코딩된 더미 라우트 포함.

## 문서/MD 파일 포맷팅 이슈

- `npm run format:check` 실행 시 `.claude/agents/code-reviewer.md`, `CLAUDE.md`, `docs/` 하위 모든 md 파일에서 Prettier 경고 발생
- 코드 소스 파일(.ts/.tsx)은 모두 Prettier 통과

## Zustand 패턴

- 실제 store 파일은 없음 (docs/specs/zustand-usage-pattern.md에 패턴만 문서화)
- `useShallow` 래핑 hook을 각 store 파일에서 export하는 컨벤션 채택
- store 파일은 `'use client'` 선언 없이 순수 로직만 포함

**Why:** 스타터킷이므로 실제 store 구현은 없고, 패턴 가이드만 제공하는 것이 의도적 설계

**How to apply:** 리뷰 시 store 파일 부재를 이슈로 제기할 필요 없음. 패턴 문서의 정확성을 중점적으로 확인.
