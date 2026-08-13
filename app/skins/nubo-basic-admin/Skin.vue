<template>
  <header class="p-4 border-b flex items-center justify-between bg-card h-16">
    <div class="flex items-center gap-3">
      <PaintbrushIcon class="w-5 h-5" />
      <h2 class="text-xl font-bold">스킨 관리</h2>
    </div>

    <div class="hidden gap-2 sm:flex">
      <InfoIcon class="w-4 h-4 text-muted-foreground" />
      <span class="text-xs text-muted-foreground"
        >스킨 관리 기능은 v1.2.0 이후 버전부터 제공됩니다</span
      >
    </div>
  </header>
  <ScrollArea class="max-h-[calc(100dvh-215px)]">
    <div class="p-6 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          v-for="item in skinCategories"
          :key="item.id"
          :class="[
            'relative overflow-hidden group transition-all hover:ring-2 hover:ring-primary',
            item.span,
          ]"
        >
          <CardHeader class="pb-2">
            <CardTitle class="text-lg mt-2">{{ item.name }}</CardTitle>
            <CardDescription class="text-xs line-clamp-1">{{ item.desc }}</CardDescription>
          </CardHeader>

          <CardContent>
            <Select v-model="selected[item.id]">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="skin in skinsFor(item.id)" :key="skin.key" :value="skin.key">{{ skin.name }}</SelectItem>
              </SelectContent>
            </Select>
            <Button class="mt-3 w-full" variant="outline" :disabled="selected[item.id] === settings[item.id]" @click="applySkin(item.id)">적용하기</Button>
          </CardContent>
        </Card>
      </div>
    </div>

    <div class="border rounded-xl m-6">
      <h2 class="text-xl flex items-center gap-3 font-bold border-b p-3">
        <InfoIcon class="w-5 h-5" /> 알아두기
      </h2>

      <CommonVCollapsible title="스킨은 어디서 받을 수 있나요?">
        NUBO의 모든 스킨들은
        <a href="https://nubohub.org" target="_blank"><CommonVCode>nubohub.org</CommonVCode></a>
        사이트에서 내려 받으실 수 있습니다. NUBO v1.2.0 버전 공개 시점부터 제공됩니다.
      </CommonVCollapsible>
      <Separator />
      <CommonVCollapsible title="마음에 드는 스킨을 찾았습니다. 어떻게 적용하나요?">
        받으신 스킨 이름을 게시판/갤러리 스킨인
        <CommonVCode>nubo-awesome-board</CommonVCode> 이름으로 가정하겠습니다.

        <ul class="list-decimal py-4 pl-8 space-y-1.5 text-sm">
          <li>
            SFTP 프로그램인 <CommonVCode>FileZilla</CommonVCode> 와 같은 도구를 사용하여 운영중이신
            서버에 <CommonVCode>(NUBO 설치경로)/app/skins/</CommonVCode> 아래 경로에
            <CommonVCode>nubo-awesome-board</CommonVCode> 를 업로드 합니다.
          </li>
          <li>
            새로 업로드한 스킨을 반영하기 위해 <CommonVCode>npm run build</CommonVCode> 명령을 nubo
            프로젝트 루트에서 실행합니다.
          </li>
          <li>
            기존에 띄워두신 프론트엔드(<CommonVCode>node .output/server/index.mjs</CommonVCode> 혹은
            <CommonVCode>pm2 start .output/server/index.mjs</CommonVCode> 로 실행하신 프로세스)를
            재시작하여 새로 빌드한 내용을 반영합니다.
          </li>
          <li>
            게시판 설정 화면에서 기존 게시판의 스킨을
            <CommonVCode>nubo-awesome-board</CommonVCode> 으로 변경하거나, 새 게시판 생성 시에
            스킨을 선택합니다. 게시판 스킨 이외에는 현재 페이지에서 수정하시면 됩니다.
          </li>
          <li>
            처음 해보시는 경우 빌드 과정을 생략하거나, 프론트엔드 서버를 재시작하지 않아 스킨이
            제대로 적용되지 않거나 오류가 날 수 있습니다. 위의 순서들을 잘 따라해 보시고, 잘
            안되시면 <CommonVCode>nubohub.org</CommonVCode> 사이트에서 다른 사용자에게 도움을
            구해보세요!
          </li>
        </ul>
      </CommonVCollapsible>
      <Separator />
      <CommonVCollapsible title="기존 스킨을 수정하고 싶어요!">
        기존 스킨을 수정해서 적용하는 것도 새 스킨을 받아서 적용하는 것과 거의 동일합니다.

        <ul class="list-decimal py-4 pl-8 space-y-1.5 text-sm">
          <li>
            먼저 기본으로 제공되는 스킨 중 수정하고자 하는 스킨을 다른 이름으로 저장합니다. 여기서는
            <CommonVCode>nubo-basic-board</CommonVCode> 게시판 스킨을 수정한다고 가정하겠습니다.
          </li>
          <li>
            복사해둔 게시판 스킨을 다른 이름으로 변경합니다(예:
            <CommonVCode>my-awesome-board</CommonVCode>). 그 후 필요한 내용들을 수정합니다. (스킨
            작업을 하기 위해서는 NUBO 프로젝트를 로컬에서 <CommonVCode>git clone</CommonVCode> 으로
            받으신 후 작업 하시는 걸 추천합니다)
          </li>
          <li>
            작업이 완료되면 (로컬에서 작업하신 경우) SFTP 프로그램으로 다시 서버에
            <CommonVCode>(NUBO 설치경로)/app/skins/</CommonVCode> 아래 경로에
            <CommonVCode>my-awesome-board</CommonVCode> 를 업로드 합니다.
          </li>
          <li>
            새로운 파일들이 서버에 업로드 되었으므로, 역시 NUBO 프로젝트 폴더에서
            <CommonVCode>npm run build</CommonVCode> 명령어를 실행하여 빌드 작업을 해줍니다. (혹은,
            서버 사양이 낮아 빌드가 어려우면 로컬에서 빌드를 실행한 후
            <CommonVCode>.output</CommonVCode> 폴더만 서버에 올리셔도 무방합니다)
          </li>
          <li>
            새로 빌드를 했으므로, 역시
            <CommonVCode>node .output/server/index.mjs</CommonVCode> (혹은
            <CommonVCode>pm2</CommonVCode> 권장) 으로 프론트엔드 서버를 재시작합니다. 이후에는
            게시판 설정에서 새로 추가한 <CommonVCode>my-awesome-board</CommonVCode> 스킨을 선택하여
            반영 하실 수 있습니다.
          </li>
        </ul>
      </CommonVCollapsible>
      <Separator />
      <CommonVCollapsible title="스킨을 새로 만들고 싶은데 참고할만한 문서가 있나요?">
        아쉽게도 NUBO 프로젝트를 진행하면서 문서화에 큰 노력을 기울이지 못했습니다. 그나마 다행인
        점은 요즘은 <CommonVCode>Claude code</CommonVCode> 혹은 <CommonVCode>Codex</CommonVCode> 와
        같이 내PC에서 직접 동작하는 AI 도구들이 많이 있다는 점이네요. 필요할 경우 NUBO 프로젝트에
        대하여 분석을 지시하시거나 기본으로 제공되는 스킨들에 대해서 분석을 지시하시면 크게 무리없이
        수정도 가능하고, 필요 시 프롬프트 만으로도 새로운 스킨 개발이 가능할 것 같습니다.<br />
        <br />
        스킨을 새로 만들고 싶으신 분들이라면 대부분 프론트엔드 개발을 어느 정도 하시는 분들로
        가정해도 크게 무리가 없을 것 같습니다. NUBO의 프론트엔드는
        <CommonVCode>Nuxt4</CommonVCode> 기반으로 구성되어 있으며, 디자인은
        <CommonVCode>shadcn-vue</CommonVCode> 에 의존하고 있습니다. 즉 수정을 위해서는
        <CommonVCode>Vue3</CommonVCode> 에 대한 기본적인 이해가 필요합니다. shadcn-vue 가
        <CommonVCode>tailwindcss</CommonVCode> 활용을 전제로 하므로 역시 이해가 필요합니다.<br />
        <br />
        참고할만한 문서는 아니지만, 기본으로 제공되는
        스킨들(<CommonVCode>nubo-basic-*</CommonVCode>)를 살펴보시면 어떤 식으로 스킨을 개발할 수
        있을지 파악이 쉽게 가능하실 것 같습니다. 혹시 분석해 보시다가 AI로도 이해가 안되는 부분들이
        있으시다면? <CommonVCode>nubohub.org</CommonVCode> 에서 다른 사용자분들에게 질문을
        남겨보세요!
      </CommonVCollapsible>
      <Separator />
      <CommonVCollapsible title="제가 만든 스킨을 팔아도 되나요?">
        물론입니다! 단, 아래의 사항을 반드시 지켜주세요.

        <ul class="list-decimal py-4 pl-8 space-y-1.5 text-sm">
          <li>다른 스킨 개발자가 공개/판매한 스킨을 재수정하여 판매하는 건 금지합니다.</li>
          <li>스킨 개발자는 자신이 만든 스킨에 대한 별도의 라이선스를 부여할 수 있습니다.</li>
          <li>NUBO에 기본으로 포함되는 스킨들은 NUBO 프로젝트의 라이선스를 따릅니다. (MIT)</li>
        </ul>
      </CommonVCollapsible>
    </div>
  </ScrollArea>
</template>

<script setup lang="ts">
/**
 * 스킨 변경은 NUBO v1.1.0 버전 공개 후에 후속 업데이트에서 제공됩니다.
 * ./goapi-linux update 와 같은 방식으로 DB 스키마 업데이트 등을 제공할 예정입니다.
 */
import {
  AlertTriangle,
  Home,
  InfoIcon,
  Layout,
  LogIn,
  MonitorCog,
  PaintbrushIcon,
  ShieldAlert,
  User,
} from "lucide-vue-next"
import { toast } from "vue-sonner"
import CommonVCode from "~/components/common/CommonVCode.vue"
import type { AdminSkinCategory, AdminSkinType } from "~/types/admin"
const config = useRuntimeConfig()
const { installed, settings } = useSkins()
const selected = reactive({ ...settings.value })
const skinsFor = (type: AdminSkinType) => installed.value.filter((skin) => skin.type === type)
const applySkin = async (type: AdminSkinType) => {
  const response = await $fetch<{ success: boolean; error: string }>("/admin/skin/setting", {
    baseURL: config.public.apiBase, method: "PUT", body: { type, skinKey: selected[type] },
  })
  if (response.success) {
    settings.value[type] = selected[type]
    toast("✅ 스킨 설정을 저장했습니다")
  } else toast(`❌ 스킨 설정을 저장하지 못했습니다: ${response.error}`)
}

// Bento 배치를 위한 카테고리 정의
const skinCategories = ref<AdminSkinCategory[]>([
  {
    id: "layout",
    name: "전체 레이아웃",
    desc: "사이트의 기본 뼈대와 네비게이션 스타일",
    icon: Layout,
    span: "md:col-span-2 md:row-span-1",
  },
  {
    id: "home",
    name: "메인 홈",
    desc: "첫 화면 구성 및 위젯 배치",
    icon: Home,
    span: "md:col-span-1 md:row-span-1",
  },
  {
    id: "admin",
    name: "관리자 패널",
    desc: "현재 보고 계신 관리 화면 스킨",
    icon: MonitorCog,
    span: "md:col-span-1 md:row-span-1",
  },
  {
    id: "login",
    name: "인증/로그인",
    desc: "로그인 및 회원가입 페이지",
    icon: LogIn,
    span: "md:col-span-1 md:row-span-1",
  },
  {
    id: "profile",
    name: "사용자 프로필",
    desc: "회원 정보 및 활동 내역",
    icon: User,
    span: "md:col-span-1 md:row-span-1",
  },
  {
    id: "privacy",
    name: "개인정보처리방침",
    desc: "법적 고지 및 약관 페이지",
    icon: ShieldAlert,
    span: "md:col-span-1 md:row-span-1",
  },
  {
    id: "error",
    name: "에러 페이지",
    desc: "404, 500 에러 화면",
    icon: AlertTriangle,
    span: "md:col-span-1 md:row-span-1",
  },
])
</script>
