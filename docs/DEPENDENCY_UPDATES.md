# 의존성 검토 — 2026-11-09

## 적용 범위

- Nuxt 4.5.2 → 4.6.4 (Nitro 2.13.6), Vue 3.5.45, Router 5.4.0.
- Tiptap의 모든 직접 확장을 3.33.0으로 통일. 문단 정렬의 이전 고정도 해제.
- Nuxt Scripts 1.3.12와 Unhead 3.4.3을 함께 적용해 Nuxt 4.6의 peer 계약을 맞춤.
- Tailwind 4.3.5, Shiki 4.6.0, Reka UI 2.11.0, shadcn-nuxt 2.9.0,
  tailwind-merge 3.7.0, Sass 1.108.1, Vue 테스트 도구 2.5.1, Vitest 4.1.12,
  vue-tsc 3.3.14, ESLint 10.14.0, Happy DOM 21.0.4, isomorphic-dompurify 4.7.0.
- Node 요구 조건을 Nuxt에 맞춰 `^22.22.3 || ^24.15.0 || >=26.0.0`으로 올리고,
  설치 도구·manifest·README에도 반영. 버전 경계 회귀 테스트 추가.
- 서버가 직접 사용하는 H3 1.15.11을 명시해 테스트 도구의 다른 H3 major가 유입되지 않게 함.
- GOAPI 저장소의 계약을 확인했으며 API 요청·응답·DB·바이너리 변경 없음.

## 유지한 버전

| 항목 | 결정과 근거 |
| --- | --- |
| Vite | 기존 `npm:rolldown-vite@7.3.1` override 유지. 8.3.7은 아래 제한 환경에서 transform 단계 정지 재현. Nuxt 기본 요구(`^8.3.5`)를 덮어쓰는 기존 우회이므로 후속 Nuxt 업데이트에도 검증 필요. |
| @nuxt/test-utils | 4.1.0 고정. 4.4.0의 H3 2 기반 테스트 서버와 현재 Nitro 2/H3 1 코드의 프록시·채팅 테스트 충돌. |
| @unovis/ts, @unovis/vue | 1.6.7 고정. 1.8.0은 Vue 패키지의 디렉터리 import로 관리자 대시보드 SSR 로딩 실패 (`components/annotations`). |
| eslint-plugin-vue | 10.10.0 override 유지. 새 버전은 기존 빈 slot 179개를 새 형식 위반으로 판정. 스타일 일괄 변경은 이번 범위에서 제외. |
| @types/node | 24.13.3 고정. 후속 타입에 추가된 IncomingMessage.signal과 node-mock-http 1.0.5의 계약 불일치. |
| 기타 major | Pinia 4/연동 모듈, VueUse 15, TanStack Table 9, Zod 4, TypeScript 7, Vitest 5, Nuxt Icon/Fonts/Color Mode는 별도 이행 범위로 유지. |

## Vite 8 조사와 재현

- [Nuxt 4.6.4 릴리스](https://github.com/nuxt/nuxt/releases/tag/v4.6.4).
- [Rolldown 공식 troubleshooting](https://github.com/rolldown/rolldown/blob/main/docs/guide/troubleshooting.md)은
  컨테이너 CPU 할당과 스레드 수를 설명하고, QEMU 정지 진단에
  `ROLLDOWN_WORKER_THREADS=2 RAYON_NUM_THREADS=2`를 안내한다.
- [Rolldown #11278](https://github.com/rolldown/rolldown/issues/11278)의 ARM64/QEMU 정지는
  이번 환경과 다르다. 사용자 보고와 같은 원인이라고 단정하지 않는다.
- 재현: Linux x64 Docker, `node:26-bookworm` (Node 26.7.0),
  `--cpus=2 --memory=2g --memory-swap=2g` (스왑 없음).
- Vite 8.3.7 / Rolldown 1.2.18: 기본 설정에서 client transform이 진전 없이 정지.
  위 두 스레드 변수를 각각 2로 지정해도 80초 이상 정지, CPU 거의 0%,
  메모리 약 304MiB. OOM으로 확인된 현상은 아니며 원인은 미확정.
- 기존 빌더는 같은 환경에서 client/server 번들 단계를 정상 통과.
  최종 전체 빌드는 25.7초, cgroup memory.peak 1,966,473,216 bytes (약 1.83GiB),
  OOM 0회, exit 0. 실서버의 OS·동시 서비스·사용 가능한 메모리는 다르므로 운영 보장은 아니다.

## 검증

- Node 26.7.0: lint (기존 경고 49개), typecheck, 전체 154개 테스트 통과.
- nuboctl `go test ./...`, NUBO/GOAPI release contract v1 검사 통과.
- 위 2 CPU/2GB production build 통과. 빌드 산출물을 production 모드로 실행해 `/privacy` HTTP 200 확인
  (GOAPI 미연결 환경으로 메뉴 초기 조회는 실패하므로 실제 로그인·글쓰기 화면 QA는 별도).
- npm audit: 36건 (low 8, moderate 23, high 2, critical 3). 기존 Unovis가 의존하는
  MapLibre 2.x의 XSS advisory가 critical 3건으로 전파된다. 현재 NUBO는 지도 기능을 쓰지 않지만
  의존성 자체의 취약점은 남아 있다. Unovis 후속 이행에서 해결해야 한다.
- Zod 3의 대형 컬렉션 검증 메모리 advisory와 이에 의존하는 @vee-validate/zod가 high 2건.
  @vee-validate/zod 4.15.1은 Zod 4를 지원하지 않으므로 폼 검증 이행과 함께 처리한다.
- 이번 작업은 전체 보안 advisory 해소를 의미하지 않는다.
