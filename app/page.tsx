import { Code, Layers, Moon, Paintbrush, Shield, Zap } from 'lucide-react'

import { Container } from '@/components/layout/container'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const features = [
  {
    icon: Layers,
    title: 'Next.js 16',
    description: 'App Router, Server Components, 최신 React 19 지원',
  },
  {
    icon: Paintbrush,
    title: 'shadcn/ui',
    description: '아름답고 접근성 높은 UI 컴포넌트 라이브러리',
  },
  {
    icon: Moon,
    title: 'Dark Mode',
    description: 'next-themes 기반 다크/라이트/시스템 테마 전환',
  },
  {
    icon: Shield,
    title: 'TypeScript',
    description: '타입 안전성과 개발 생산성을 동시에 확보',
  },
  {
    icon: Zap,
    title: 'Tailwind CSS 4',
    description: '유틸리티 퍼스트 CSS로 빠른 스타일링',
  },
  {
    icon: Code,
    title: 'Form & Validation',
    description: 'React Hook Form + Zod로 타입 안전한 폼 관리',
  },
]

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="flex flex-col items-center justify-center py-24 md:py-32">
        <Container className="flex flex-col items-center text-center">
          <Badge variant="secondary" className="mb-4">
            Next.js 16 + shadcn/ui
          </Badge>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            빠르게 시작하는
            <br />
            <span className="text-muted-foreground">모던 웹 프로젝트</span>
          </h1>
          <p className="text-muted-foreground mt-6 max-w-lg text-lg">
            검증된 기술 스택과 체계적인 컴포넌트 구조로 프로젝트를 시작하세요.
            모든 보일러플레이트가 준비되어 있습니다.
          </p>
          <div className="mt-8 flex gap-3">
            <Button size="lg" asChild>
              <a href="#features">시작하기</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </Button>
          </div>
        </Container>
      </section>

      {/* Features */}
      <section id="features" className="border-t py-24">
        <Container>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">기술 스택</h2>
            <p className="text-muted-foreground mt-2">
              프로덕션에 검증된 도구들로 구성했습니다
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="text-muted-foreground mb-2 size-5" />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
