<template>
  <section class="container mx-auto py-4">
    <div class="mx-auto" :style="`max-width: ${config.width}px`">
      <header class="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">{{ config.name }}</h1>
          <div class="text-muted-foreground mt-2 text-sm">{{ config.info }}</div>
        </div>

        <div class="flex items-center gap-2">
          <CommonVTooltip content="게시글 목록을 초기화합니다">
            <NuxtLink :to="`/board/${config.id}/page/1`" as-child class="gap-2">
              <Button variant="outline" class="cursor-pointer">
                <ListIcon class="w-4 h-4" />
                목록
              </Button>
            </NuxtLink>
          </CommonVTooltip>

          <Button v-if="isAdmin" variant="outline" size="icon">
            <SettingsIcon class="w-4 h-4" />
          </Button>

          <CommonVTooltip v-if="isLoggedIn" content="새로운 글을 남겨보세요!">
            <NuxtLink :to="`/board/${config.id}/write`" class="gap-2" as-child>
              <Button variant="default" class="cursor-pointer text-foreground">
                <PencilIcon class="w-4 h-4" />
                글쓰기
              </Button>
            </NuxtLink>
          </CommonVTooltip>

          <CommonVTooltip v-else content="로그인 하시면 게시글 작성 등을 하실 수 있습니다">
            <NuxtLink :to="`/auth/login?redirect=/board/${config.id}/page/${page}`" class="gap-2">
              <Button variant="outline" class="cursor-pointer">
                <LogInIcon class="w-4 h-4" />
                로그인
              </Button>
            </NuxtLink>
          </CommonVTooltip>
        </div>
      </header>

      <div class="rounded-md border bg-card">
        <Table>
          <TableHeader class="hidden md:table-header-group">
            <TableRow>
              <TableHead class="w-20 text-center">번호</TableHead>
              <TableHead class="text-center">제목</TableHead>
              <TableHead class="w-30 text-center">글쓴이</TableHead>
              <TableHead class="w-25 text-center">날짜</TableHead>
              <TableHead class="w-20 text-center">조회</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow v-for="notice in list.notices" :key="notice.uid">
              <TableCell class="hidden md:table-cell text-center text-muted-foreground">
                <PinIcon class="w-4 h-4 mx-auto" />
              </TableCell>

              <TableCell>
                <div class="flex flex-col gap-2">
                  <div class="flex items-center">
                    <NuxtLink :to="`/board/${config.id}/view/${notice.uid}`">
                      <span class="font-medium text-base leading-snug">{{
                        recoverChars(notice.title)
                      }}</span>
                      <span v-if="notice.comment > 0" class="text-primary text-xs font-bold ml-2"
                        >[{{ notice.comment }}]
                      </span>
                    </NuxtLink>
                  </div>

                  <div class="md:hidden flex items-center gap-2 text-xs text-muted-foreground">
                    <span class="flex items-center gap-2"
                      ><HeartIcon
                        class="w-3 h-3"
                        :class="notice.liked ? 'text-red-200 fill-current' : ''"
                      />
                      {{ num(notice.like) }}</span
                    >
                    <span>·</span>
                    <span>{{ recoverChars(notice.writer.name) }}</span>
                    <span>·</span>
                    <span>{{ date(notice.submitted) }}</span>
                  </div>
                </div>
              </TableCell>

              <TableCell class="hidden md:table-cell">
                <div class="flex items-center gap-2">
                  <Avatar class="w-6 h-6">
                    <AvatarImage :src="notice.writer.profile" />
                    <AvatarFallback>{{ notice.writer.name[0] }}</AvatarFallback>
                  </Avatar>
                  <span class="text-sm">{{ notice.writer.name }}</span>
                </div>
              </TableCell>

              <TableCell class="hidden md:table-cell text-center text-sm text-muted-foreground">
                {{ date(notice.submitted) }}
              </TableCell>

              <TableCell class="hidden md:table-cell text-center text-sm text-muted-foreground">
                {{ num(notice.hit) }}
              </TableCell>
            </TableRow>

            <TableRow v-for="post in list.posts" :key="post.uid">
              <TableCell class="hidden md:table-cell text-center">
                <div
                  class="flex items-center gap-2 justify-center text-muted"
                  v-if="post.like === 0"
                >
                  <HeartIcon class="w-3 h-3" />
                  {{ post.like }}
                </div>

                <div class="flex items-center gap-2 justify-center text-muted-foreground" v-else>
                  <HeartIcon
                    class="w-3 h-3"
                    :class="post.liked ? 'text-red-200 fill-current' : ''"
                  />
                  {{ post.like }}
                </div>
              </TableCell>

              <TableCell>
                <div class="flex flex-col gap-2">
                  <div class="flex items-center">
                    <NuxtLink :to="`/board/${config.id}/view/${post.uid}`">
                      <span class="font-medium text-base leading-snug">{{
                        recoverChars(post.title)
                      }}</span>
                      <span v-if="post.comment > 0" class="text-primary text-xs font-bold ml-2"
                        >[{{ post.comment }}]
                      </span>
                    </NuxtLink>
                  </div>

                  <div class="md:hidden flex items-center gap-2 text-xs text-muted-foreground">
                    <span class="flex items-center gap-2"
                      ><HeartIcon
                        class="w-3 h-3"
                        :class="post.liked ? 'text-red-200 fill-current' : ''"
                      />
                      {{ num(post.like) }}</span
                    >
                    <span>·</span>
                    <span>{{ recoverChars(post.writer.name) }}</span>
                    <span>·</span>
                    <span>{{ date(post.submitted) }}</span>
                  </div>
                </div>
              </TableCell>

              <TableCell class="hidden md:table-cell">
                <div class="flex items-center gap-2">
                  <Avatar class="w-6 h-6">
                    <AvatarImage :src="post.writer.profile" />
                    <AvatarFallback>{{ post.writer.name[0] }}</AvatarFallback>
                  </Avatar>
                  <span class="text-sm">{{ post.writer.name }}</span>
                </div>
              </TableCell>

              <TableCell class="hidden md:table-cell text-center text-sm text-muted-foreground">
                {{ date(post.submitted) }}
              </TableCell>

              <TableCell class="hidden md:table-cell text-center text-sm text-muted-foreground">
                {{ post.hit }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <footer class="mt-8 flex flex-col items-center gap-8">
        <Pagination
          :items-per-page="config.rowCount"
          :total="totalPostCount"
          :sibling-count="1"
          show-edges
          :page="page"
          :default-page="page"
          v-slot="{ page, pageCount }"
        >
          <PaginationContent v-slot="{ items }">
            <NuxtLink :to="setPagingUrl(1)" as-child v-show="page > 1">
              <CommonVTooltip content="첫 페이지로 이동합니다">
                <PaginationFirst class="cursor-pointer">
                  <ChevronFirstIcon class="w-10 h-10" />
                </PaginationFirst>
              </CommonVTooltip>
            </NuxtLink>

            <NuxtLink :to="setPagingUrl(page - 1)" as-child v-show="page > 1">
              <CommonVTooltip content="이전 페이지로 이동합니다">
                <PaginationPrevious class="cursor-pointer mr-2">
                  <ChevronLeftIcon class="w-10 h-10" />
                </PaginationPrevious>
              </CommonVTooltip>
            </NuxtLink>

            <template v-for="(item, index) in items">
              <PaginationListItem
                v-if="item.type === 'page'"
                :key="index"
                :value="item.value"
                as-child
              >
                <NuxtLink :to="setPagingUrl(item.value)" as-child>
                  <Button
                    class="w-10 h-10 text-foreground cursor-pointer"
                    :variant="item.value === page ? 'default' : 'outline'"
                  >
                    {{ item.value }}
                  </Button>
                </NuxtLink>
              </PaginationListItem>

              <PaginationEllipsis v-else :key="item.type" :index="index" />
            </template>

            <NuxtLink :to="setPagingUrl(page + 1)" as-child v-show="page < pageCount">
              <CommonVTooltip content="다음 페이지로 이동합니다">
                <PaginationNext class="cursor-pointer ml-2">
                  <ChevronRightIcon class="w-10 h-10" />
                </PaginationNext>
              </CommonVTooltip>
            </NuxtLink>

            <NuxtLink :to="setPagingUrl(pageCount)" as-child v-show="page < pageCount">
              <CommonVTooltip content="마지막 페이지로 이동합니다">
                <PaginationLast class="cursor-pointer">
                  <ChevronLastIcon class="w-10 h-10" />
                </PaginationLast>
              </CommonVTooltip>
            </NuxtLink>
          </PaginationContent>
        </Pagination>

        <div class="flex w-full max-w-sm items-center space-x-2">
          <Select v-model="option">
            <SelectTrigger class="w-25">
              <SelectValue placeholder="제목" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="SEARCH.TITLE">제목</SelectItem>
              <SelectItem :value="SEARCH.CONTENT">내용</SelectItem>
              <SelectItem :value="SEARCH.WRITER">작성자</SelectItem>
              <SelectItem :value="SEARCH.TAG">태그</SelectItem>
              <SelectItem :value="SEARCH.IMAGEDESC">이미지</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="text"
            placeholder="게시판 내 검색"
            v-model="keyword"
            @keyup.enter="searchPost"
          />
          <Button
            variant="outline"
            class="cursor-pointer"
            :disabled="keyword.length < 2"
            @click="searchPost"
            >검색</Button
          >
        </div>
      </footer>

      <div class="h-20"></div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  ListIcon,
  LogInIcon,
  PencilIcon,
  PinIcon,
  SettingsIcon,
} from "lucide-vue-next"
import { PaginationListItem } from "reka-ui"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { SEARCH } from "~/types/board"
import { useNuboListContext } from "~/types/nubo-skin-keys"

const {
  list,
  config,
  isAdmin,
  isLoggedIn,
  page,
  totalPostCount,
  option,
  keyword,
  searchPost,
  setPagingUrl,
} = useNuboListContext()
</script>
