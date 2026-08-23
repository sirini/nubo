// 원본 이미지는 JSON 프록시를 거치면 Node 메모리에 통째로 버퍼링된다.
// 권한 확인 후 발급된 짧은 수명의 토큰만 GOAPI의 byte-range 스트림으로 전달한다.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const searchString = getRequestURL(event).search

  return proxyRequest(event, `${config.apiBaseInternal}/board/original/transfer${searchString}`)
})
