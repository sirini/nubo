import type { BoardListItem, BoardListResult, BoardViewResult } from "./board"
import type { EditorLoadPostResult, EditorModifyParam, EditorWriteParam } from "./editor"

export type TradePriceType = 0 | 1 | 2
export type TradeProductCondition = 0 | 1 | 2 | 3 | 4
export type TradeShippingType = 0 | 1 | 2
export type TradeStatus = 0 | 1 | 2 | 3

export const TRADE_PRICE = { FIXED: 0, NEGOTIABLE: 1, FREE: 2 } as const
export const TRADE_CONDITION = { UNOPENED: 0, LIKE_NEW: 1, USED: 2, WORN: 3, DAMAGED: 4 } as const
export const TRADE_SHIPPING = { PARCEL: 0, MEETUP: 1, BOTH: 2 } as const
export const TRADE_STATUS = { AVAILABLE: 0, RESERVED: 1, SOLD: 2, WITHDRAWN: 3 } as const

export type TradeInfo = {
  uid: number
  brand: string
  price: number
  priceType: TradePriceType
  currency: string
  productCondition: TradeProductCondition
  location: string
  shippingType: TradeShippingType
  status: TradeStatus
  completed: number
}

export type TradeForm = Omit<TradeInfo, "uid" | "status" | "completed">
export type TradeListItem = { post: BoardListItem; trade: TradeInfo }
export type TradeListResult = Omit<BoardListResult, "notices" | "posts"> & {
  notices: TradeListItem[]
  posts: TradeListItem[]
}
export type TradeViewResult = BoardViewResult & { trade: TradeInfo }
export type TradeLoadResult = { board: EditorLoadPostResult; trade: TradeInfo }
export type TradeWriteParam = EditorWriteParam & TradeForm
export type TradeModifyParam = EditorModifyParam & TradeForm
