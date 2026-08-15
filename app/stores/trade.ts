import { defineStore } from "pinia"
import { toast } from "vue-sonner"
import {
  TRADE_CONDITION,
  TRADE_PRICE,
  TRADE_SHIPPING,
  TRADE_STATUS,
  type TradeForm,
  type TradeInfo,
  type TradeListItem,
  type TradeStatus,
} from "~/types/trade"

const emptyTrade = (): TradeInfo => ({
  uid: 0, brand: "", price: 0, priceType: TRADE_PRICE.FIXED, currency: "KRW",
  productCondition: TRADE_CONDITION.USED, location: "", shippingType: TRADE_SHIPPING.PARCEL,
  status: TRADE_STATUS.AVAILABLE, completed: 0,
})

export const useTradeStore = defineStore("trade", () => {
  const { loadPost, writePost, modifyPost, updateStatus } = useTrade()
  const current = ref<TradeInfo>(emptyTrade())
  const items = ref<Record<number, TradeInfo>>({})
  const form = reactive<TradeForm>({ ...emptyTrade() })

  const setList = (list: TradeListItem[]) => {
    items.value = Object.fromEntries(list.map((item) => [item.post.uid, item.trade]))
  }
  const resetForm = () => Object.assign(form, emptyTrade())
  const validate = () => {
    if (form.priceType !== TRADE_PRICE.FREE && form.price < 1) return "판매 가격을 입력해주세요"
    if (form.shippingType !== TRADE_SHIPPING.PARCEL && form.location.trim().length < 2) return "직거래 지역을 입력해주세요"
    return ""
  }
  const changeStatus = async (boardUid: number, postUid: number, status: TradeStatus) => {
    const response = await updateStatus(boardUid, postUid, status)
    if (!response.success) return toast(`❌ 거래 상태를 변경하지 못했습니다: ${response.error}`)
    current.value.status = status
    toast("✅ 거래 상태를 변경했습니다")
  }
  return { current, items, form, setList, resetForm, validate, loadPost, writePost, modifyPost, changeStatus }
})
