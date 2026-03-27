# Zustand 사용 패턴

## 개요

프로젝트에서 사용하는 Zustand 아키텍처의 3가지 패턴과 컴포넌트 소비 규칙.

---

## 미들웨어 스택 순서

```
create(
  persist(         // 중간: immer가 만든 immutable state를 storage에 저장
    immer(         // 최내곽: mutable 코드 → immutable state 변환
      (set, get) => ({ ... })
    ),
    { name: '...' }
  )
)
```

- **immer가 가장 안쪽**: `set()` 콜백의 mutation을 먼저 immutable로 변환
- **persist가 바깥쪽**: immer가 만든 최종 state를 저장 (mutation 중간 상태가 아닌)

---

## 패턴 A: 기본 (미들웨어 없음)

단순 state + action store. nested object/배열 조작 없고, 영속화 불필요.

**적합**: ui-store 같은 일시적 state

```ts
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

interface UiState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))

// shallow hook — 컴포넌트 기본 사용 패턴
export const useUi = <T>(selector: (state: UiState) => T) =>
  useUiStore(useShallow(selector))
```

---

## 패턴 B: Immer

nested object/array 업데이트가 있는 store. spread 수동 관리를 Immer의 direct mutation으로 대체.

**적합**: 배열 조작 중심 store

**적용 기준**: "nested object 또는 배열을 조작하는 action이 있는가?"

```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useShallow } from 'zustand/react/shallow'

interface CartItem {
  id: string
  name: string
  quantity: number
}

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
}

export const useCartStore = create<CartState>()(
  immer((set) => ({
    items: [],

    // Immer: 직접 수정처럼 쓰지만 내부적으로 immutable
    addItem: (item) => {
      set((state) => {
        state.items.push(item)
      })
    },

    removeItem: (id) => {
      set((state) => {
        const index = state.items.findIndex((item) => item.id === id)
        if (index !== -1) state.items.splice(index, 1)
      })
    },

    updateQuantity: (id, quantity) => {
      set((state) => {
        const item = state.items.find((item) => item.id === id)
        if (item) item.quantity = quantity
      })
    },
  })),
)

export const useCart = <T>(selector: (state: CartState) => T) =>
  useCartStore(useShallow(selector))
```

### Immer 변환 예시

```ts
// Before: 매번 복사 → splice → set
removeItem: (id) => {
  const items = [...get().items]
  const index = items.findIndex((item) => item.id === id)
  if (index !== -1) items.splice(index, 1)
  set({ items })
}

// After: 원본을 직접 수정하는 것처럼 (Immer가 immutable 처리)
removeItem: (id) => set((state) => {
  const index = state.items.findIndex((item) => item.id === id)
  if (index !== -1) state.items.splice(index, 1)
})
```

---

## 패턴 C: Persist + Immer

페이지 새로고침 후 복원 필요 + nested 업데이트.

**적합**: settings-store, auth-store 같은 영속 state

**적용 기준**: "새로고침 후에도 유지되어야 하는 state가 있는가?"

```ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { useShallow } from 'zustand/react/shallow'

interface User {
  id: string
  name: string
  email: string
}

interface AuthState {
  user: User | null
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set) => ({
      user: null,
      token: null,

      login: (user, token) => {
        set({ user, token })
      },

      logout: () => {
        set({ user: null, token: null })
      },
    })),
    {
      name: 'auth',
      storage: createJSONStorage(() => localStorage),
      // action 함수와 일시적 state 제외
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
)

export const useAuth = <T>(selector: (state: AuthState) => T) =>
  useAuthStore(useShallow(selector))
```

### Persist 핵심 옵션

| 옵션 | 역할 |
|------|------|
| `name` | localStorage key |
| `storage` | `createJSONStorage(() => localStorage)` — Next.js 기본 |
| `partialize` | 저장할 필드 선택 (action, 일시적 state 제외) |
| `onRehydrateStorage` | 복원 완료 후 side-effect |

### SSR 주의사항

Next.js는 서버에서 먼저 렌더링하므로, persist store의 hydration mismatch에 주의한다.

```tsx
'use client'

import { useEffect, useState } from 'react'

// hydration mismatch 방지 패턴
function UserGreeting() {
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth((s) => ({ user: s.user }))

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  return <p>Hello, {user?.name}</p>
}
```

---

## 컴포넌트 소비 패턴: useShallow

### 문제

```ts
// 매번 새 객체 반환 → Object.is === false → 불필요한 리렌더링
const { a, b } = useStore((s) => ({ a: s.a, b: s.b }))
```

### 해결: shallow hook

각 스토어 파일에서 `useShallow` 래핑 hook을 export. 소비 측에서 `useShallow`를 직접 import할 필요 없음.

```ts
// 컴포넌트에서 — state + action을 한 블록으로 가져옴
const { items, addItem, removeItem } = useCart((s) => ({
  items: s.items,
  addItem: s.addItem,
  removeItem: s.removeItem,
}))
```

**리렌더링 동작**: selector가 반환하는 객체의 각 값을 shallow equal 비교. `items`가 변경될 때만 리렌더. action 함수들은 참조 불변이므로 비교에서 항상 같음.

### 네이밍 규칙

| Store 파일 | 원본 hook | shallow hook |
|-----------|-----------|-------------|
| `ui-store.ts` | `useUiStore` | `useUi` |
| `cart-store.ts` | `useCartStore` | `useCart` |
| `auth-store.ts` | `useAuthStore` | `useAuth` |

- **`useXxxStore`** — 원본. `getState()` 접근이나 스토어 외부 사용
- **`useXxx`** — shallow 래핑. 컴포넌트 내 **기본 사용 패턴**

### 파생 값 selector

`useShallow`로 감싸도 되지만, 단일 파생값은 원본 hook이 더 간결:

```ts
// 단일 파생값 — 원본 hook 사용
const hasItems = useCartStore((s) => s.items.length > 0)
```

---

## Store 파일 위치

```
store/
  ui-store.ts         # 패턴 A — UI 일시적 state
  cart-store.ts       # 패턴 B — 배열 조작
  auth-store.ts       # 패턴 C — 영속 + nested
```

`'use client'` 선언 없이 store 파일 자체는 순수 로직만 포함. `useShallow` hook을 사용하는 컴포넌트에서 `'use client'`를 선언한다.
