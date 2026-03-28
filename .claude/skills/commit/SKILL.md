---
description: 프로젝트 컨벤션에 맞는 git commit 생성
disable-model-invocation: true
allowed-tools:
  [
    'Bash(git add:*)',
    'Bash(git status:*)',
    'Bash(git commit:*)',
    'Bash(git diff:*)',
    'Bash(git log:*)',
  ]
---

# Commit

프로젝트 Conventional Commits 컨벤션에 맞는 커밋을 생성합니다.

## Context

- git status: !`git status`
- staged + unstaged diff: !`git diff HEAD`
- 최근 커밋: !`git log --oneline -10`

## 프로세스

1. 스테이지된 파일 확인 — 스테이지된 파일이 있으면 해당 파일만 커밋
2. 여러 논리적 변경사항에 대한 diff 분석
3. 필요 시 분할 제안
4. 컨벤션에 맞는 커밋 생성

## 커밋 포맷

`<type>: <한국어 설명>`

**타입:**

| type | 의미 |
|------|------|
| feat | 새로운 기능 추가 |
| fix | 버그 수정 |
| docs | 문서만 변경 |
| style | 코드 의미에 영향 없는 변경 (포맷팅 등) |
| refactor | 기능 변경 없는 코드 구조 개선 |
| perf | 성능 개선 |
| test | 테스트 추가/수정 |
| chore | 빌드, 설정, 패키지 등 기타 변경 |
| ci | CI/CD 설정 변경 |

**규칙:**

- scope 사용 금지: `feat:` O, `feat(auth):` X
- 명령형 어조 ("추가" not "추가됨")
- 첫 줄 72자 미만
- 원자적 커밋 (단일 목적)
- 관련 없는 변경사항 분할
- .env, credentials 등 민감 파일 커밋 금지
- Co-Authored-By 서명 추가 금지

**BREAKING CHANGE:**

- type 뒤에 `!` 추가: `feat!: API 응답 형식 변경`
- 또는 푸터에 명시:
  ```
  refactor: dep/dest 타입을 객체로 변경

  BREAKING CHANGE: dep/dest가 string에서 AirportRef로 변경
  ```

## 분할 기준

다른 관심사 | 혼합된 타입 | 파일 패턴 | 큰 변경사항

## Task

위 변경사항을 분석하고 컨벤션에 맞는 커밋을 생성하라.
한 메시지에서 stage + commit을 모두 수행. 다른 도구나 텍스트 출력 없이 도구 호출만 수행.
