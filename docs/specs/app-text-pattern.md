# Text Typography 패턴

통합 Typography 컴포넌트. 시맨틱 텍스트 렌더링에 `<Text>`를 사용한다.

## 설계 원칙

- **cva + cn 패턴**: shadcn/ui와 동일한 variant 시스템 (`class-variance-authority` + `tailwind-merge`)
- **시맨틱 넘버링**: variant 이름에 px 수치 대신 의미 기반 번호 사용
- **최소 API**: `variant`, `color`, `as`, `className` prop으로 전체 커버
- **기본값**: variant=`body3`, color=`default`
- **다형성**: `as` prop으로 렌더링 HTML 요소 변경 (기본 `<p>`)

## Variant 목록

### Header (font-semibold)

| Variant | fontSize | Tailwind | 용도 |
|---------|----------|----------|------|
| `h1` | 30px | `text-[30px] font-semibold` | 페이지 타이틀 |
| `h2` | 24px | `text-2xl font-semibold` | 섹션 타이틀 |
| `h3` | 20px | `text-xl font-semibold` | 서브 섹션 |
| `h4` | 18px | `text-lg font-semibold` | 라벨 / 강조 |
| `h5` | 14px | `text-sm font-semibold` | 소형 강조 |
| `h6` | 12px | `text-xs font-semibold` | 최소 강조 |

### Body (font-normal)

| Variant | fontSize | Tailwind | 용도 |
|---------|----------|----------|------|
| `body1` | 20px | `text-xl` | 대형 본문 |
| `body2` | 18px | `text-lg` | 큰 본문 |
| `body3` | 16px | `text-base` | 기본 본문 (default) |
| `body4` | 15px | `text-[15px]` | 보조 본문 |
| `body5` | 14px | `text-sm` | 캡션 |
| `body6` | 13px | `text-[13px]` | 소형 캡션 |
| `body7` | 12px | `text-xs` | 최소 텍스트 |
| `body8` | 10px | `text-[10px]` | 극소 텍스트 |

공통 스타일: `leading-normal`, `letter-spacing: -0.2px`

## Color 목록

| Color | Tailwind 클래스 | 용도 |
|-------|----------------|------|
| `default` | `text-foreground` | 기본 텍스트 |
| `muted` | `text-muted-foreground` | 보조 텍스트 |
| `destructive` | `text-destructive` | 에러 / 경고 |
| `accent` | `text-accent-foreground` | 강조 |

CSS 변수 기반이므로 다크/라이트 모드에서 자동으로 색상이 전환된다.

## as prop (다형성)

기본 `<p>` 태그 대신 다른 HTML 요소로 렌더링할 때 사용한다.

```tsx
// 시맨틱 heading 태그로 렌더링
<Text variant="h1" as="h1">Page Title</Text>
<Text variant="h2" as="h2">Section Title</Text>

// span으로 인라인 텍스트
<Text variant="body5" as="span" color="muted">inline caption</Text>

// label 요소
<Text variant="body5" as="label" htmlFor="email">Email</Text>
```

지원 요소: `p`, `span`, `h1`~`h6`, `label`, `div`

## 사용 예시

```tsx
import { Text } from '@/components/ui/text'

// 기본 (body3, default)
<Text>Default text</Text>

// variant + color
<Text variant="h1" as="h1">Page Title</Text>
<Text variant="body5" color="muted">Caption text</Text>

// className으로 추가 스타일
<Text variant="body4" color="muted" className="mt-2">
  Additional spacing
</Text>

// textVariants를 직접 사용 (Text 컴포넌트 없이 클래스만 필요할 때)
import { textVariants } from '@/components/ui/text'
<div className={textVariants({ variant: 'h3', color: 'muted' })}>...</div>
```
