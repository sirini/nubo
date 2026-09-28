import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// for Tailwindcss
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

// 서버와 브라우저가 같은 날짜를 렌더링하도록 표시 시간대를 고정합니다.
const displayDateTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
})

const dateParts = (timestamp: number) =>
  Object.fromEntries(displayDateTime.formatToParts(timestamp).map(({ type, value }) => [type, value])) as
    Record<"year" | "month" | "day" | "hour" | "minute" | "second", string>

// 날짜만 출력하기
export const date = (timestamp: number, div: string = "-") => {
  const { year, month, day } = dateParts(timestamp)
  return `${year}${div}${month}${div}${day}`
}

// 날짜와 시간까지 모두 출력하기
export const dateFull = (timestamp: number, d1: string = "/", d2: string = ":") => {
  const { year, month, day, hour, minute, second } = dateParts(timestamp)
  return `${year.slice(2)}${d1}${month}${d1}${day} ${hour}${d2}${minute}${d2}${second}`
}

// 큰 숫자는 K, M 단위를 뒤에 붙여서 표현
export const num = (big: number) => {
  if (big > 999999) {
    return (big / 1000000).toFixed(1) + "M"
  } else if (big > 999) {
    return (big / 1000).toFixed(1) + "K"
  } else {
    return big.toString()
  }
}

// HTML 태그 제거하기
export const stripTags = (html: string) => {
  return html.replace(/<[^>]*>?/gm, "")
}

// HTML 특수문자들을 일반 문자로 변환해주기 (&amp;lt; --> <)
export const recoverChars = (text: string) => {
  return text.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">")
}

// SSR 요청에서 실패 응답을 감안한 값 리턴
export const resp = <T>(data: T | undefined) => {
  return data || { success: false, error: "failed operation", result: null }
}

// 게시글 본문의 길이를 바탕으로 예상 읽기 시간을 분 단위로 반환
export const getReadingTime = (content: string, charPerMin: number = 500): number => {
  const plainText = stripTags(content)
  const charCount = plainText.trim().length
  const readingTime = Math.ceil(charCount / charPerMin)
  return readingTime > 0 ? readingTime : 1
}

// 목록용 t*.webp 썸네일 경로를 본문용 f*.webp 미리보기 경로로 변환
export const getPreviewImage = (path: string): string => {
  return path.replace(/(\/upload\/thumbnails\/(?:[^/]+\/)*)t([^/?]+)(?=$|[?#])/, "$1f$2")
}

// 주어진 스킨 경로에서 스킨 폴더명들을 맵 형태로 반환
export const getSkin = (
  modules: Record<string, () => Promise<unknown>>,
  selSkinName: MaybeRefOrGetter<string>,
  defSkinName: string,
) => {
  const skinMap = Object.fromEntries(
    Object.entries(modules).map(([path, loader]) => {
      const name = path.split("/").slice(-2)[0]
      return [name, loader]
    }),
  )

  return computed(() => {
    const loader = skinMap[toValue(selSkinName)] ?? skinMap[defSkinName]
    return loader ? defineAsyncComponent(loader) : null
  })
}
