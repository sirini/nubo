import { mountSuspended } from "@nuxt/test-utils/runtime"
import { describe, expect, it } from "vitest"
import BasicHome from "../../app/skins/nubo-basic-home/Home.vue"
import AdvanceRail from "../../app/skins/nubo-advance-home/components/AdvanceHomeRail.vue"

describe("home policy links", () => {
  it("keeps legal links in the basic home's rail and footer", async () => {
    const wrapper = await mountSuspended(BasicHome, { global: { stubs: { LatestPosts: true } } })
    for (const path of ["/terms", "/privacy", "/disclaimer"]) {
      expect(wrapper.find(`aside a[href="${path}"]`).exists()).toBe(true)
      expect(wrapper.find(`footer a[href="${path}"]`).exists()).toBe(true)
    }
    wrapper.unmount()
  })
  it("offers policy links in the advanced home's sticky side rail", async () => {
    const wrapper = await mountSuspended(AdvanceRail, { props: { menus: [], posts: [], firstBoardId: "", isLoggedIn: false } })
    expect(wrapper.findAll('nav[aria-label="법적 고지"] a').map((link) => link.attributes("href"))).toEqual(["/terms", "/privacy", "/disclaimer"])
    wrapper.unmount()
  })
})
