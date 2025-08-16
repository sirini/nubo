<template>
  <NavigationMenu>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg mr-4">
          <Squirrel class="w-5 h-5" /> Nubo
        </NuxtLink>
      </NavigationMenuItem>

      <template v-if="menus">
        <NavigationMenuItem v-for="(menu, index) in menus.result" :key="index">
          <NavigationMenuTrigger class="font-bold text-md">{{ menu.group }}</NavigationMenuTrigger>
          <NavigationMenuContent
            class="grid gap-2 p-2 w-80 sm:w-100 md:w-140 md:grid-cols-2 lg:w-180 lg:grid-cols-3 xl:w-240 xl:grid-cols-4"
          >
            <NavigationMenuLink as-child v-for="(board, idx) in menu.boards" :key="idx">
              <a
                :href="`/board/${board.id}`"
                class="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              >
                <div class="text-sm font-semibold leading-none">{{ board.name }}</div>
                <p class="line-clamp-2 text-sm leading-snug text-muted-foreground">
                  {{ board.info }}
                </p>
              </a>
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </template>
    </NavigationMenuList>
  </NavigationMenu>
</template>

<script setup lang="ts">
import { Squirrel } from "lucide-vue-next"
import { useHomeMenus } from "~/composables/useHomeMenus"

const { menus, pending, error, refresh } = await useHomeMenus()
</script>
