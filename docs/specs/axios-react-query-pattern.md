# axios + React Query 연동 패턴

클라이언트 중심 데이터 페칭 패턴. 브라우저에서 직접 백엔드 API를 호출하고, React Query가 캐싱/상태 관리를 담당한다.

```
브라우저 → (axios) → 백엔드 API
         ← JSON ←
React Query: 캐싱, 리페치, 로딩/에러 상태
```

---

## 1. 설치 및 초기 설정

### 패키지 설치

```bash
pnpm add axios @tanstack/react-query @tanstack/react-query-devtools
```

### QueryClient 설정

`app/providers.tsx`에 `QueryClientProvider`를 추가한다.

```tsx
// app/providers.tsx
'use client'

import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,       // 1분간 fresh (SSR 시 클라이언트에서 즉시 리페치 방지)
        gcTime: 5 * 60 * 1000,      // 5분간 캐시 유지
        retry: 1,                    // 실패 시 1회 재시도
        refetchOnWindowFocus: false, // 탭 전환 시 리페치 안 함
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (isServer) {
    // 서버: 항상 새로운 QueryClient 생성 (요청 간 데이터 격리)
    return makeQueryClient()
  } else {
    // 브라우저: 기존 인스턴스가 있으면 재사용
    // React가 초기 렌더링 중 suspend하면 클라이언트를 버릴 수 있으므로 중요
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  // NOTE: useState를 사용하지 않는 이유 — Suspense boundary가 이 컴포넌트와
  // suspend할 수 있는 코드 사이에 없으면, React가 초기 렌더링에서 클라이언트를 버린다
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### axios 인스턴스 생성

```ts
// lib/api/client.ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  withCredentials: true, // 쿠키 세션 사용 시 필수
  headers: {
    'Content-Type': 'application/json',
  },
})

// --- Refresh Token Interceptor ---

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

function processQueue(error: AxiosError | null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve()
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // 401이고, 아직 재시도하지 않은 요청이며, refresh 엔드포인트 자체가 아닌 경우
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      // 이미 refresh 진행 중이면 큐에 대기
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await api.post('/auth/refresh') // 쿠키 기반이므로 body 불필요
        processQueue(null)
        return api(originalRequest) // 원래 요청 재시도
      } catch (refreshError) {
        processQueue(refreshError as AxiosError)
        // refresh도 실패 → 완전히 로그아웃
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)
```

**동작 흐름:**

```
요청 A → 401 → refresh 시작 (isRefreshing = true)
요청 B → 401 → 큐에 대기
요청 C → 401 → 큐에 대기
              ↓
         refresh 성공 → 큐의 B, C 재시도 + 요청 A 재시도
         refresh 실패 → 큐의 B, C 에러 + 로그인 페이지로 이동
```

- `isRefreshing` 플래그로 refresh 요청이 중복 발생하지 않도록 한다
- 동시에 여러 요청이 401을 받아도 refresh는 1번만 실행되고, 나머지는 큐에서 대기한다

> **axios는 클라이언트 전용**: 이 패턴에서 axios는 브라우저에서만 사용한다. Server Component에서 axios를 쓰면 **Next.js `fetch`의 캐싱/revalidation/deduplication 기능을 사용할 수 없다.** Server Component에서 데이터가 필요하면 `fetch`를 직접 사용한다 (섹션 6 참고).

---

## 2. Query (데이터 조회)

### queryKey 컨벤션

```ts
// 도메인별 key factory 패턴
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
}
```

- key는 배열. 계층 구조를 만들어 부분 무효화가 가능하다
- `queryClient.invalidateQueries({ queryKey: userKeys.all })` → 유저 관련 전체 캐시 무효화
- `queryClient.invalidateQueries({ queryKey: userKeys.detail(1) })` → 특정 유저만 무효화

### Service 레이어 (API 요청 함수)

`service/` 폴더에 순수 API 요청 함수를 모아둔다. React 훅과 무관하게 동작하며, axios 인스턴스를 사용하므로 **클라이언트 전용**이다. (Server Component에서는 Next.js `fetch`를 직접 사용한다 — 캐싱/revalidation 활용을 위해)

```ts
// service/user.service.ts
import { api } from '@/lib/api/client'

export interface User {
  id: number
  name: string
  email: string
}

export interface UserListParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface CreateUserDto {
  name: string
  email: string
}

export const userService = {
  getList: async (params: UserListParams) => {
    const { data } = await api.get<PaginatedResponse<User>>('/users', { params })
    return data
  },

  getById: async (id: number) => {
    const { data } = await api.get<User>(`/users/${id}`)
    return data
  },

  create: async (dto: CreateUserDto) => {
    const { data } = await api.post<User>('/users', dto)
    return data
  },

  update: async (id: number, dto: Partial<CreateUserDto>) => {
    const { data } = await api.patch<User>(`/users/${id}`, dto)
    return data
  },

  delete: async (id: number) => {
    await api.delete(`/users/${id}`)
  },
}
```

### useQuery 훅

query 훅은 service 함수를 호출만 한다. API 요청 로직은 service에 있으므로, 훅은 캐싱/상태 관리만 담당한다.

```ts
// lib/api/queries/users.ts
import { useQuery } from '@tanstack/react-query'
import { userService, type UserListParams } from '@/service/user.service'

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
}

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userService.getList(params),
  })
}

export function useUser(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getById(id),
    enabled: id > 0,
  })
}
```

### 컴포넌트에서 사용

```tsx
// components/user-list.tsx
'use client'

import { useUsers } from '@/lib/api/queries/users'

export function UserList() {
  const { data, isLoading, error } = useUsers({ page: 1, limit: 10 })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {data.data.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

---

## 3. Mutation (데이터 변경)

### 기본 mutation + 캐시 무효화

```ts
// lib/api/queries/users.ts (이어서)
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userService, type CreateUserDto } from '@/service/user.service'

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

export function useUpdateUser(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: Partial<CreateUserDto>) => userService.update(id, dto),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.setQueryData(userKeys.detail(id), updatedUser)
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}
```

### react-hook-form 연동

```tsx
// components/create-user-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateUser } from '@/lib/api/queries/users'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  email: z.string().email('유효한 이메일을 입력해주세요'),
})

type FormValues = z.infer<typeof schema>

export function CreateUserForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending } = useCreateUser()

  const onSubmit = (values: FormValues) => {
    mutate(values, {
      onSuccess: () => {
        toast.success('사용자가 생성되었습니다')
        reset()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="이름" />
      {errors.name && <p>{errors.name.message}</p>}

      <input {...register('email')} placeholder="이메일" />
      {errors.email && <p>{errors.email.message}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? '생성 중...' : '생성'}
      </button>
    </form>
  )
}
```

### Optimistic Update

목록에서 삭제 시, 서버 응답을 기다리지 않고 즉시 UI를 업데이트한다:

```ts
export function useDeleteUserOptimistic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: userService.delete,
    onMutate: async (id) => {
      // 진행 중인 리페치 취소 (optimistic 데이터 덮어쓰기 방지)
      await queryClient.cancelQueries({ queryKey: userKeys.lists() })

      // 이전 데이터 스냅샷
      const previous = queryClient.getQueryData(userKeys.lists())

      // 캐시에서 즉시 제거
      queryClient.setQueriesData(
        { queryKey: userKeys.lists() },
        (old: PaginatedResponse<User> | undefined) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.filter((user) => user.id !== id),
            total: old.total - 1,
          }
        },
      )

      return { previous }
    },
    onError: (_error, _id, context) => {
      // 실패 시 롤백
      if (context?.previous) {
        queryClient.setQueriesData({ queryKey: userKeys.lists() }, context.previous)
      }
    },
    onSettled: () => {
      // 성공/실패 무관하게 서버 데이터와 동기화
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}
```

---

## 4. 파일 구조

```
service/
  user.service.ts          # 유저 CRUD API 요청 함수
  post.service.ts          # 포스트 CRUD API 요청 함수
  auth.service.ts          # 로그인, 로그아웃, 내 정보 조회

lib/
  api/
    client.ts              # axios 인스턴스 (baseURL, interceptors)
    queries/
      users.ts             # userKeys + useUsers, useUser, useCreateUser, ...
      posts.ts             # postKeys + usePosts, usePost, useCreatePost, ...
      auth.ts              # useLogin, useLogout, useMe
```

### 레이어 역할 분리

| 레이어 | 위치 | 역할 | React 의존성 |
|--------|------|------|-------------|
| Service | `service/*.service.ts` | API 요청/응답 처리, 타입 정의 | 없음 |
| Query | `lib/api/queries/*.ts` | queryKey 관리, 캐싱/상태 관리 | useQuery, useMutation |
| Component | `components/*.tsx` | UI 렌더링, 이벤트 핸들링 | React |

- **Service** → axios를 호출하는 순수 함수. React 훅과 무관하지만 **클라이언트 전용** (axios interceptor + Next.js fetch 캐싱 이유로)
- **Query** → service를 감싸는 React Query 훅. 캐시 키, 무효화, optimistic update 등 관리
- **Component** → query 훅을 호출하여 데이터 소비

### 네이밍 컨벤션

| 파일 | 내용 |
|------|------|
| `service/{domain}.service.ts` | 도메인별 API 요청 함수 + 타입 정의 |
| `queries/{domain}.ts` | 도메인별 key factory + query/mutation 훅 |
| `useXxx` (query) | `useUsers`, `useUser`, `useUserPosts` |
| `useCreateXxx` | POST mutation |
| `useUpdateXxx` | PATCH/PUT mutation |
| `useDeleteXxx` | DELETE mutation |
| `xxxKeys` | queryKey factory |
| `xxxService` | API 함수 객체 (`userService.getList`, `userService.create`, ...) |

---

## 5. 인증 처리 (쿠키 세션)

### axios 설정

```ts
// lib/api/client.ts
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // 모든 요청에 쿠키 포함
})
```

`withCredentials: true`가 핵심. 이 설정이 없으면 cross-origin 요청 시 브라우저가 쿠키를 전송하지 않는다.

### 백엔드 CORS 설정 (NestJS)

브라우저가 백엔드에 직접 요청하므로 CORS가 필수:

```ts
// NestJS main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL, // 'http://localhost:3000'
  credentials: true,                // Access-Control-Allow-Credentials: true
})
```

### 백엔드 세션 쿠키 설정

```ts
// NestJS main.ts
app.use(
  session({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',        // 같은 사이트 + top-level navigation 허용
      // sameSite: 'none',     // cross-origin 시 (HTTPS 필수)
      // domain: '.example.com', // 서브도메인 공유 시
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
)
```

### 주의: cross-origin 쿠키 제약

| 조건 | `SameSite` | `Secure` | 작동 여부 |
|------|-----------|----------|----------|
| 같은 도메인 (`example.com` ↔ `example.com`) | `lax` | 불필요 | O |
| 서브도메인 (`app.example.com` ↔ `api.example.com`) | `lax` + `domain: '.example.com'` | 프로덕션에서 필요 | O |
| 완전히 다른 도메인 (`app.com` ↔ `api.io`) | `none` | 필수 (HTTPS) | 브라우저에 따라 차단될 수 있음 |

> **로컬 개발 시 문제**: `localhost:3000` → `localhost:8080`은 같은 도메인이므로 `SameSite=lax`로 작동한다. 포트가 달라도 `localhost`끼리는 same-site로 취급된다.

### Auth Service + 훅

```ts
// service/auth.service.ts
import { api } from '@/lib/api/client'

export interface LoginDto {
  email: string
  password: string
}

export interface AuthUser {
  id: number
  name: string
  email: string
}

export const authService = {
  me: async () => {
    const { data } = await api.get<AuthUser>('/auth/me')
    return data
  },

  login: async (dto: LoginDto) => {
    const { data } = await api.post<AuthUser>('/auth/login', dto)
    return data
  },

  logout: async () => {
    await api.post('/auth/logout')
  },
}
```

```ts
// lib/api/queries/auth.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/service/auth.service'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: authService.me,
    retry: false, // 401이면 재시도하지 않음 (interceptor가 refresh 처리)
  })
}

export function useLogin() {
  return useMutation({
    mutationFn: authService.login,
    onSuccess: () => {
      // 전체 페이지 새로고침 → 서버에서 새 쿠키로 렌더링
      // React Query 캐시를 수동으로 갱신할 필요 없음
      window.location.href = '/'
    },
  })
}

export function useLogout() {
  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // 전체 페이지 새로고침 → 쿠키 없는 상태로 서버 렌더링
      window.location.href = '/'
    },
  })
}
```

### useMe + Refresh Token 흐름

`useMe()`에 `retry: false`를 설정하는 이유: refresh는 axios interceptor가 처리한다. React Query의 retry와 역할이 겹치지 않도록 한다.

```
[페이지 로드 시 useMe() 호출 흐름]

1. useMe() → GET /auth/me
2a. access token 유효 → 200 → useMe() 성공 → data에 유저 정보
2b. access token 만료 → 401 → interceptor가 POST /auth/refresh
    3a. refresh 성공 → GET /auth/me 재시도 → 200 → useMe() 성공 (useMe는 에러를 본 적 없음)
    3b. refresh 실패 → interceptor가 /login으로 리다이렉트 (useMe까지 오지 않음)
```

### 로그인 상태 판단

```tsx
// components/auth-guard.tsx
'use client'

import { useMe } from '@/lib/api/queries/auth'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useMe()

  if (isLoading) return <div>Loading...</div>
  if (!user) return null // interceptor가 /login으로 리다이렉트 처리

  return <>{children}</>
}
```

---

## 6. Server Component에서 데이터 가져오기

### 6-1. 원칙: 서버와 클라이언트의 역할 분리

| 환경 | 데이터 | 페칭 방법 | 캐싱 |
|------|--------|----------|------|
| Server Component | **공개 데이터만** | `fetch` (Next.js extended) | Next.js 캐시 |
| Client Component | **인증 데이터 포함 전부** | axios + React Query | React Query |

핵심 규칙:
- **Server Component에서 인증된 요청을 하지 않는다**
  - access token 만료 시 자동 refresh 불가 (interceptor = 브라우저 전용)
  - Server Component 렌더링 중 새 토큰을 브라우저 쿠키에 쓸 수 없음
  - refresh token이 유효한데도 로그인으로 리다이렉트되는 나쁜 UX 발생
- **Server Component에서 React Query (`prefetchQuery`, `dehydrate`)를 쓰지 않는다**
  - Next.js 캐시 + React Query 캐시 = 이중 캐시 → 무효화 복잡

### 6-2. 왜 Server Component에서 axios가 아닌 fetch인가

| | `fetch` (Next.js extended) | `axios` |
|---|---|---|
| 응답 캐싱 (`next: { revalidate }`) | O | X |
| 태그 기반 무효화 (`next: { tags }`) | O | X |
| 요청 중복 제거 (deduplication) | O | X |
| 정적 생성 (빌드 시 데이터 포함) | O | X |

### 6-3. 예제: 공개 데이터 페이지 (블로그 목록)

```tsx
// app/blog/page.tsx — Server Component
export default async function BlogPage() {
  const res = await fetch(`${process.env.API_URL}/posts`, {
    next: { revalidate: 60, tags: ['posts'] },
  })
  const posts = await res.json()

  return (
    <ul>
      {posts.data.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### 6-4. 인증이 필요한 페이지는 Client Component

```tsx
// app/dashboard/page.tsx — 서버는 껍데기만
import { Dashboard } from '@/components/dashboard'

export default function DashboardPage() {
  return <Dashboard />
}
```

```tsx
// components/dashboard.tsx — Client Component
'use client'

import { useMe } from '@/lib/api/queries/auth'

export function Dashboard() {
  const { data: user, isLoading } = useMe()
  // axios interceptor가 자동으로 refresh token 처리

  if (isLoading) return <div>Loading...</div>
  if (!user) return null

  return <div>Welcome, {user.name}</div>
}
```

- 인증 데이터는 항상 클라이언트에서 → refresh token 자동 처리 ✓
- SEO가 필요 없는 인증 페이지에 적합 (대시보드, 마이페이지 등)

### 6-5. 서버 캐시 무효화: Server Action + revalidateTag

클라이언트에서 mutation 후, **공개 데이터**의 Next.js 서버 캐시도 갱신하려면:

```ts
// app/actions/revalidate.ts
'use server'
import { revalidateTag } from 'next/cache'

export async function revalidatePostsCache() {
  revalidateTag('posts')
}
```

```ts
// mutation onSuccess에서 호출
export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: postService.create,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
      await revalidatePostsCache() // 공개 데이터의 서버 캐시 갱신
    },
  })
}
```

### 6-6. 정리표

| 데이터 종류 | 렌더링 위치 | 페칭 | 캐싱 | 무효화 |
|-----------|-----------|------|------|--------|
| 공개 (블로그, 상품 등) | Server Component | `fetch` | Next.js (`revalidate` + `tags`) | `revalidateTag` |
| 인증 (유저 정보, 대시보드) | Client Component | axios | React Query | `invalidateQueries` |
| 공개 데이터 mutation 후 | 양쪽 | - | 양쪽 | `invalidateQueries` + `revalidateTag` |

### 6-7. 주의

> **Server Component에서는 axios를 쓰지 않는다.** axios interceptor(refresh token)는 브라우저 전용이고, Next.js 캐싱은 `fetch`에서만 동작한다. `process.env.API_URL`은 `NEXT_PUBLIC_` 없는 서버 전용 환경변수.

> **Server Component에서 인증된 요청을 하지 않는다.** access token 만료 시 서버에서는 자동 refresh가 불가능하다. 인증이 필요한 데이터는 항상 Client Component에서 axios + React Query로 가져온다.

---

## 7. Zustand와의 역할 분리

| 역할 | 담당 |
|------|------|
| 서버 상태 (API 데이터, 인증 포함) | React Query |
| 클라이언트 상태 (UI, 모달, 필터 등) | Zustand |

```tsx
// React Query: 서버에서 온 유저 목록
const { data: users } = useUsers({ page, limit })

// React Query: 로그인 상태 (서버 상태)
const { data: me } = useMe()

// Zustand: UI 상태 (어떤 유저를 선택했는지)
const selectedUserId = useUserStore((s) => s.selectedUserId)
```

React Query의 캐시를 Zustand에 복사하지 않는다. 서버 데이터는 항상 React Query를 통해 접근한다.

---

## 8. 주의사항

### SSR/SEO 한계

axios + React Query는 기본적으로 **CSR (Client-Side Rendering)**이다:
- 첫 페이지 로드 시 HTML에 데이터가 없음 → SEO에 불리
- SEO가 중요한 공개 페이지는 Server Component에서 `fetch`로 직접 가져온다 (섹션 6 참고)
- 인증이 필요한 페이지(대시보드, 마이페이지)는 SEO가 불필요하므로 CSR로 충분

### 환경변수 노출

| 환경변수 | 사용처 | 브라우저 노출 |
|---------|--------|-------------|
| `NEXT_PUBLIC_API_URL` | axios (클라이언트) | O — 브라우저 번들에 포함 |
| `API_URL` | Server Component (서버) | X — 서버에서만 사용 |

내부 API 서버의 URL을 숨기고 싶다면 BFF 패턴을 사용해야 한다.

### NestJS 백엔드 요구사항

이 패턴에서 NestJS가 처리해야 할 것:

| 항목 | 설정 |
|------|------|
| CORS | `enableCors({ origin: FRONTEND_URL, credentials: true })` |
| 쿠키 설정 | `httpOnly: true`, `sameSite: 'lax'` (또는 cross-origin이면 `'none'` + `secure: true`) |
| Refresh 엔드포인트 | `POST /auth/refresh` — refresh token 쿠키 검증 후 새 access token 쿠키 발급 |
| 토큰 쌍 | access token (짧은 만료, 예: 15분) + refresh token (긴 만료, 예: 7일) 모두 HttpOnly 쿠키 |
