// prebuilt 실행 시 주입한 커뮤니티 이름을 SSR과 브라우저 문서 제목에 반영합니다.
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  useHead({ title: () => config.public.title })
})
