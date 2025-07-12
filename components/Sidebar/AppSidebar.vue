<script setup lang="ts">
import type { SidebarProps } from "@/components/ui/sidebar"

import { RssIcon, SquarePen } from "lucide-vue-next"
import NavBlogs from "~/components/Sidebar/NavBlogs.vue"
import NavBoards from "~/components/Sidebar/NavBoards.vue"
import NavUser from "~/components/Sidebar/NavUser.vue"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import NavLogo from "./NavLogo.vue"

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: "icon",
})

// This is sample data.
const data = {
  user: {
    name: "sirini",
    email: "sirini@gmail.com",
    avatar: "/avatars/sample.avif",
  },
  navBoards: [
    {
      title: "default",
      url: "#",
      icon: SquarePen,
      isActive: true,
      items: [
        {
          title: "자유 게시판",
          url: "#",
        },
        {
          title: "모두의 사진첩",
          url: "#",
        },
        {
          title: "중고거래",
          url: "#",
        },
      ],
    },
  ],
  blogs: [
    {
      name: "SIRINI`s Blog",
      url: "#",
      icon: RssIcon,
    },
  ],
}
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <NavLogo />
    </SidebarHeader>
    <SidebarContent>
      <NavBoards :items="data.navBoards" />
      <NavBlogs :blogs="data.blogs" />
    </SidebarContent>
    <SidebarFooter>
      <NavUser :user="data.user" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
