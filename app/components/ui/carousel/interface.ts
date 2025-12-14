import type useEmblaCarousel from "embla-carousel-vue"
import type { EmblaCarouselVueType } from "embla-carousel-vue"
import type { HTMLAttributes, UnwrapRef } from "vue"

type CarouselApi = EmblaCarouselVueType[1]
type UseCarouselParams = Params<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParams[0]
type CarouselPlugin = UseCarouselParams[1]

export type UnwrapRefCarouselApi = UnwrapRef<CarouselApi>

export interface CarouselProps {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
}

export interface CarouselEmits {
  (e: "init-api", payload: UnwrapRefCarouselApi): void
}

export interface WithClassAsProps {
  class?: HTMLAttributes["class"]
}
