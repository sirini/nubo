<script setup lang="ts">
import { MessagesSquareIcon } from "lucide-vue-next"
import { navigationMenuTriggerStyle } from "../ui/navigation-menu"
import NavigationMenu from "../ui/navigation-menu/NavigationMenu.vue"
import NavigationMenuContent from "../ui/navigation-menu/NavigationMenuContent.vue"
import NavigationMenuItem from "../ui/navigation-menu/NavigationMenuItem.vue"
import NavigationMenuLink from "../ui/navigation-menu/NavigationMenuLink.vue"
import NavigationMenuList from "../ui/navigation-menu/NavigationMenuList.vue"
import NavigationMenuTrigger from "../ui/navigation-menu/NavigationMenuTrigger.vue"

// 샘플 데이터
const groups = ref([
  {
    id: "default",
    boards: [
      { id: "free", name: "자유게시판", info: "아무거나 자유롭게 써봅시다" },
      { id: "photo", name: "모두의 사진첩", info: "정성껏 담아낸 사진에 인스타그램 감성 한스푼" },
      { id: "market", name: "중고거래", info: "안쓰는 건 저렴하게 팔아보세요" },
    ],
  },
])
</script>

<template>
  <div class="sticky top-0 z-50 bg-background shadow-md px-4 py-3 border-b">
    <div class="container mx-auto">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink :class="navigationMenuTriggerStyle()">
              <component :is="MessagesSquareIcon" />
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem v-for="(group, index) in groups" :key="index">
            <NavigationMenuTrigger>{{ group.id }}</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul
                class="grid w-[400px] gap-2 p-2 md:w-[500px] md:grid-cols-2 lg:w-[700px] lg:grid-cols-3"
              >
                <li v-for="(board, idx) in group.boards" :key="idx">
                  <NavigationMenuLink as-child>
                    <a
                      :href="'#'"
                      class="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <div class="text-sm font-semibold leading-none">{{ board.name }}</div>
                      <p class="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {{ board.info }}
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  </div>
</template>
