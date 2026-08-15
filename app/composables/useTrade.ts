import type { Resp } from "~/types/common"
import type {
  TradeLoadResult,
  TradeModifyParam,
  TradeStatus,
  TradeWriteParam,
} from "~/types/trade"

const toFormData = (param: TradeWriteParam | TradeModifyParam) => {
  const fd = new FormData()
  fd.append("boardUid", String(param.boardUid))
  fd.append("categoryUid", String(param.categoryUid))
  fd.append("content", param.content)
  fd.append("isNotice", param.isNotice ? "1" : "0")
  fd.append("isSecret", param.isSecret ? "1" : "0")
  fd.append("title", param.title)
  fd.append("tags", param.tags.join(","))
  fd.append("brand", param.brand)
  fd.append("price", String(param.price))
  fd.append("priceType", String(param.priceType))
  fd.append("currency", param.currency)
  fd.append("productCondition", String(param.productCondition))
  fd.append("location", param.location)
  fd.append("shippingType", String(param.shippingType))
  if ("postUid" in param) fd.append("postUid", String(param.postUid))
  for (const file of param.files) fd.append("attachments[]", file)
  return fd
}

export const useTrade = () => {
  const { reqGet, reqPost, reqPatch } = useApi()
  return {
    loadPost: (boardUid: number, postUid: number) =>
      reqGet<Resp<TradeLoadResult>>("/trade/load", { boardUid, postUid }),
    writePost: (param: TradeWriteParam) =>
      reqPost<Resp<{ postUid: number }>>("/trade/write", toFormData(param)),
    modifyPost: (param: TradeModifyParam) =>
      reqPatch<Resp<null>>("/trade/modify", toFormData(param)),
    updateStatus: (boardUid: number, postUid: number, status: TradeStatus) => {
      const fd = new FormData()
      fd.append("boardUid", String(boardUid))
      fd.append("postUid", String(postUid))
      fd.append("status", String(status))
      return reqPatch<Resp<null>>("/trade/status", fd)
    },
  }
}
