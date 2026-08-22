<template>
  <header class="hidden h-16 items-center justify-between border-b bg-card p-4 md:flex">
    <div class="flex items-center gap-3">
      <PaintbrushIcon class="w-5 h-5" />
      <h2 class="text-xl font-bold">스킨 관리</h2>
    </div>

    <div class="hidden gap-2 sm:flex">
      <InfoIcon class="w-4 h-4 text-muted-foreground" />
      <span class="text-xs text-muted-foreground"
        >설치된 스킨을 영역별로 선택하고 적용할 수 있습니다</span
      >
    </div>
  </header>
  <div>
    <div class="space-y-4 p-4 sm:p-6">
      <div v-if="manifestIssues.length" class="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
        <p class="font-semibold">사용할 수 없는 스킨 manifest가 있습니다</p>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-muted-foreground"><li v-for="issue in manifestIssues" :key="issue">{{ issue }}</li></ul>
      </div>
      <section class="overflow-hidden rounded-xl border bg-card" aria-labelledby="market-guide-title">
        <div class="grid gap-6 p-5 lg:grid-cols-[1fr_auto] lg:items-center sm:p-6">
          <div>
            <div class="flex items-center gap-2 text-sm font-semibold text-primary">
              <StoreIcon class="h-4 w-4" /> NUBO Market
            </div>
            <h2 id="market-guide-title" class="mt-2 text-2xl font-bold tracking-tight">
              커뮤니티에 어울리는 스킨을 찾아보세요
            </h2>
            <p class="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              공식 Market에서 스킨을 구경하고, <CommonVCode>nuboctl market</CommonVCode>으로
              내려받은 뒤 검증·빌드해 안전하게 적용할 수 있습니다. Market 설치는 실행 중인 사이트를
              바로 바꾸지 않습니다.
            </p>
          </div>
          <a
            href="https://nubohub.org/market/"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            스킨 둘러보기 <ExternalLinkIcon class="h-4 w-4" />
          </a>
        </div>
        <div class="grid border-t bg-muted/25 sm:grid-cols-2 xl:grid-cols-4">
          <div v-for="step in marketSteps" :key="step.command" class="border-b p-4 last:border-b-0 sm:border-r sm:[&:nth-child(2n)]:border-r-0 xl:border-b-0 xl:[&:nth-child(2n)]:border-r xl:last:border-r-0">
            <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{{ step.label }}</p>
            <CommonVCode class="mt-2 inline-block">{{ step.command }}</CommonVCode>
            <p class="mt-2 text-xs leading-5 text-muted-foreground">{{ step.description }}</p>
          </div>
        </div>
      </section>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          v-for="item in skinCategories"
          :key="item.id"
          :class="[
            'relative overflow-hidden group transition-all md:hover:ring-2 md:hover:ring-primary',
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

    <div class="m-4 rounded-xl border sm:m-6">
      <h2 class="text-xl flex items-center gap-3 font-bold border-b p-3">
        <InfoIcon class="w-5 h-5" /> 알아두기
      </h2>

      <CommonVCollapsible title="스킨은 어디서 받을 수 있나요?">
        <a class="font-semibold text-primary underline underline-offset-4" href="https://nubohub.org/market/" target="_blank" rel="noopener noreferrer">NUBO Market</a>에서
        공개된 스킨을 이름·key·기능으로 구경할 수 있습니다. 상세 페이지에서 제작자, 지원 NUBO 버전과
        설치 명령을 확인하세요. 터미널에서는 <CommonVCode>nuboctl market search</CommonVCode>로 찾고
        <CommonVCode>nuboctl market info &lt;스킨-key&gt;</CommonVCode>로 같은 정보를 확인할 수 있습니다.
        각 명령의 설명은 <CommonVCode>nuboctl market help</CommonVCode>에서 볼 수 있습니다.
      </CommonVCollapsible>
      <Separator />
      <CommonVCollapsible title="Market 스킨은 어떻게 설치하고 적용하나요?">
        아래에서는 <CommonVCode>nubo-awesome-board</CommonVCode>를 설치한다고 가정합니다. 명령은
        공식 릴리스 폴더가 아니라 업데이트에 사용하는 <strong>NUBO 소스 폴더(checkout)</strong>에서 실행하세요.

        <ul class="list-decimal py-4 pl-8 space-y-1.5 text-sm">
          <li>
            <CommonVCode>nuboctl market info nubo-awesome-board</CommonVCode>로 제작자, 버전, 요구 NUBO
            버전과 기능을 확인합니다.
          </li>
          <li>
            <CommonVCode>nuboctl market install nubo-awesome-board</CommonVCode>를 실행합니다. nuboctl이
            Registry checksum, 압축 경로, manifest와 호환 버전을 검증한 뒤
            <CommonVCode>app/skins/</CommonVCode>에 설치하며 기존 폴더는 덮어쓰지 않습니다.
          </li>
          <li>
            먼저 <CommonVCode>nuboctl customize --dry-run</CommonVCode>으로 typecheck와 production build를
            확인한 뒤 <CommonVCode>nuboctl customize</CommonVCode>로 Web을 적용합니다.
          </li>
          <li>
            게시판 스킨은 게시판 관리에서 게시판별로 선택합니다. 레이아웃·홈·관리자·로그인·프로필
            등의 스킨은 이 화면에서 선택한 뒤 <strong>적용하기</strong>를 누릅니다.
          </li>
          <li>
            더 이상 쓰지 않는 Market 스킨은 먼저 다른 스킨으로 전환한 뒤
            <CommonVCode>nuboctl market remove &lt;스킨-key&gt; --dry-run</CommonVCode>으로 영향을 확인하고
            <CommonVCode>nuboctl market remove &lt;스킨-key&gt;</CommonVCode>로 삭제합니다. 설치 뒤 수정되거나
            파일이 추가된 스킨은 자동 삭제하지 않습니다.
          </li>
        </ul>
        Market 설치와 삭제는 소스만 바꾸며 실행 중인 사이트에는 <CommonVCode>nuboctl customize</CommonVCode>를
        다시 실행해야 반영됩니다. 목록에 스킨이 나타나지 않으면 이 화면 상단의 manifest 오류 안내를
        확인하세요. 공식 릴리스 디렉터리를 직접 수정하면 checksum과 업데이트 검증이 깨집니다.
      </CommonVCollapsible>
      <Separator />
      <CommonVCollapsible title="설치됨, 적용됨, 삭제됨은 무엇이 다른가요?">
        <strong>설치됨</strong>은 스킨 파일이 소스의 <CommonVCode>app/skins/</CommonVCode>에 있다는 뜻이고,
        <strong>빌드됨</strong>은 <CommonVCode>nuboctl customize</CommonVCode>가 그 소스로 운영 Web을 만들었다는
        뜻입니다. <strong>적용됨</strong>은 게시판 관리나 이 화면에서 실제 사용할 스킨으로 선택한 상태입니다.
        따라서 설치만으로 화면이 바뀌지 않으며, 사용 중인 스킨을 삭제하기 전에는 기본 스킨 등 다른 스킨으로
        먼저 전환해야 합니다. 삭제 후에도 customize를 실행하기 전까지 현재 운영 Web은 그대로 유지됩니다.
      </CommonVCollapsible>
      <Separator />
      <CommonVCollapsible title="기존 스킨을 복사해서 수정하려면 어떻게 하나요?">
        기본 스킨을 직접 덮어쓰면 NUBO 업데이트 때 변경 내용이 사라질 수 있으므로, 별도 스킨으로
        복사해 작업하는 것을 권장합니다.

        <ul class="list-decimal py-4 pl-8 space-y-1.5 text-sm">
          <li>
            수정할 기본 스킨 폴더를 복사합니다. 예를 들어
            <CommonVCode>nubo-basic-board</CommonVCode>를
            <CommonVCode>my-awesome-board</CommonVCode>라는 새 폴더로 복사합니다.
          </li>
          <li>
            복사한 폴더의 <CommonVCode>skin.json</CommonVCode>에서 <CommonVCode>key</CommonVCode>를
            폴더 이름과 같은 <CommonVCode>my-awesome-board</CommonVCode>로 바꾸고, 이름·버전·제작자
            정보도 새 스킨에 맞게 수정합니다.
          </li>
          <li>
            로컬 개발 환경에서 Vue 컴포넌트와 스타일을 수정하고 필요한 화면을 확인합니다. 작업 전
            원본과 서버 설정을 백업해 두면 문제 발생 시 되돌리기 쉽습니다.
          </li>
          <li>
            완성한 폴더를 서버의 <CommonVCode>app/skins/</CommonVCode> 아래에 배치한 후
            <CommonVCode>nuboctl customize</CommonVCode>로 검증·빌드·적용합니다.
          </li>
          <li>
            manifest 검증 오류가 없는지 확인하고, 게시판 관리 또는 이 화면에서 새 스킨을 선택해
            적용합니다.
          </li>
        </ul>
      </CommonVCollapsible>
      <Separator />
      <CommonVCollapsible title="새 스킨을 만들 때 무엇을 참고하면 되나요?">
        NUBO 프론트엔드는 <CommonVCode>Nuxt 4</CommonVCode>와 <CommonVCode>Vue 3</CommonVCode>를
        사용하며, UI 구성에는 <CommonVCode>shadcn-vue</CommonVCode>와
        <CommonVCode>Tailwind CSS</CommonVCode>를 활용합니다. 먼저 만들려는 영역과 같은 기본 스킨
        폴더(<CommonVCode>app/skins/nubo-basic-*</CommonVCode>)를 복사해 구조와 컴포넌트 진입점을
        확인하는 방법이 가장 빠릅니다.<br />
        <br />
        특히 <CommonVCode>skin.json</CommonVCode>의 필수 항목과 폴더 이름 규칙을 지키고, 기존
        컴포넌트가 사용하는 provider 및 타입 계약을 유지하세요. <CommonVCode>preview</CommonVCode>에는
        패키지 안의 대표 PNG·JPEG·WebP 이미지 한 장을 지정합니다. 실제 사이트 화면을 더 보여주고 싶다면
        <CommonVCode>screenshots</CommonVCode> 배열에 이미지 경로를 최대 9개까지 추가할 수 있으며, 없으면
        항목 자체를 생략해도 됩니다. Market 상세 화면은 이 이미지를 3열 그리드와 확대 보기로 제공합니다.
        개발 중에는
        <CommonVCode>npm run typecheck</CommonVCode>와 <CommonVCode>npm run build</CommonVCode>로
        호환성을 확인할 수 있습니다. 추가 질문은 <CommonVCode>nubohub.org</CommonVCode> 커뮤니티에서
        도움을 받을 수 있습니다.
      </CommonVCollapsible>
      <Separator />
      <CommonVCollapsible title="제가 만든 스킨을 팔아도 되나요?">
        직접 만든 스킨은 배포하거나 판매할 수 있습니다. 다만 포함한 코드와 자산의 라이선스는 제작자가
        직접 확인해야 합니다.

        <ul class="list-decimal py-4 pl-8 space-y-1.5 text-sm">
          <li>다른 제작자의 스킨·이미지·아이콘·폰트를 사용했다면 각각의 수정 및 재배포 조건을 확인하세요.</li>
          <li>직접 만든 부분에는 별도의 이용 조건과 지원 범위를 정할 수 있습니다.</li>
          <li>NUBO 기본 스킨을 바탕으로 만들었다면 NUBO의 MIT 라이선스 고지 의무를 유지하세요.</li>
        </ul>
        이 안내는 일반적인 설명이며, 구체적인 라이선스 판단이 필요하면 전문가의 검토를 받으세요.
      </CommonVCollapsible>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AlertTriangle,
  Home,
  InfoIcon,
  Layout,
  LogIn,
  MonitorCog,
  PaintbrushIcon,
  ExternalLinkIcon,
  ShieldAlert,
  StoreIcon,
  User,
} from "lucide-vue-next"
import { toast } from "vue-sonner"
import CommonVCode from "~/components/common/CommonVCode.vue"
import type { AdminSkinCategory, AdminSkinType } from "~/types/admin"

defineOptions({ name: "NuboAdminSkin" })

const config = useRuntimeConfig()
const { installed, manifestIssues, settings } = useSkins()
const selected = reactive({ ...settings.value })
const marketSteps = [
  { label: "찾기", command: "nuboctl market search", description: "이름·key·설명으로 공개 스킨을 검색합니다." },
  { label: "확인", command: "nuboctl market info", description: "제작자, 버전, 기능과 호환성을 확인합니다." },
  { label: "설치", command: "nuboctl market install", description: "검증된 패키지를 소스에 안전하게 설치합니다." },
  { label: "관리", command: "nuboctl market remove", description: "수정되지 않은 Market 스킨만 안전하게 삭제합니다." },
]
const skinsFor = (type: AdminSkinType) => installed.value.filter((skin) => skin.type === type)
const applySkin = async (type: AdminSkinType) => {
  try {
    const response = await $fetch<{ success: boolean; error: string }>("/admin/skin/setting", {
      baseURL: config.public.apiBase, method: "PUT", body: { type, skinKey: selected[type] },
    })
    if (response.success) {
      settings.value[type] = selected[type]
      toast("✅ 스킨 설정을 저장했습니다")
    } else toast(`❌ 스킨 설정을 저장하지 못했습니다: ${response.error}`)
  } catch (error) {
    toast(`❌ 스킨 설정을 저장하지 못했습니다: ${error}`)
  }
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
