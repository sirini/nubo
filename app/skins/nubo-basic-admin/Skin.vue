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
        NUBO용 스킨은
        <a href="https://nubohub.org" target="_blank"><CommonVCode>nubohub.org</CommonVCode></a>
        에서 내려받을 수 있습니다. 설치한 스킨 가운데 <CommonVCode>skin.json</CommonVCode>의 형식,
        폴더 이름, 지원 NUBO 버전 검사를 통과한 스킨만 위 선택 목록에 표시됩니다.
      </CommonVCollapsible>
      <Separator />
      <CommonVCollapsible title="다운로드한 스킨은 어떻게 설치하고 적용하나요?">
        이 절차는 NUBO 소스를 직접 빌드해 운영하는 사이트에만 적용됩니다. 공식 prebuilt 설치는
        <CommonVCode>/opt/nubo/current</CommonVCode>의 검증된 빌드를 실행하므로 서버의 소스 clone에
        스킨을 추가해도 반영되지 않습니다.

        아래에서는 게시판 스킨 <CommonVCode>nubo-awesome-board</CommonVCode>를 설치한다고
        가정합니다.

        <ul class="list-decimal py-4 pl-8 space-y-1.5 text-sm">
          <li>
            압축을 푼 스킨 폴더를 서버의
            <CommonVCode>(NUBO 설치 경로)/app/skins/</CommonVCode> 아래에 업로드합니다. 최종 경로는
            <CommonVCode>app/skins/nubo-awesome-board/skin.json</CommonVCode> 형태여야 합니다.
          </li>
          <li>
            스킨 폴더 이름과 <CommonVCode>skin.json</CommonVCode>의 <CommonVCode>key</CommonVCode>가
            같은지, 안내된 최소 NUBO 버전을 충족하는지 확인합니다.
          </li>
          <li>
            새 clone이라면 NUBO 프로젝트 루트에서 먼저 <CommonVCode>npm ci</CommonVCode>를 실행한 뒤
            <CommonVCode>npm run build</CommonVCode>를 실행합니다. 새 스킨 파일은 빌드할 때 등록되므로
            빌드 단계는 생략할 수 없습니다.
          </li>
          <li>
            실행 중인 프론트엔드 프로세스를 재시작해 새 빌드를 반영합니다. 직접 실행 중이면
            <CommonVCode>node .output/server/index.mjs</CommonVCode>를, PM2를 사용 중이면 기존 PM2
            프로세스의 재시작 명령을 사용합니다.
          </li>
          <li>
            게시판 스킨은 게시판 관리에서 게시판별로 선택합니다. 레이아웃·홈·관리자·로그인·프로필
            등의 스킨은 이 화면에서 선택한 뒤 <strong>적용하기</strong>를 누릅니다.
          </li>
        </ul>
        목록에 스킨이 나타나지 않으면 이 화면 상단의 manifest 오류 안내를 먼저 확인하세요.
        공식 prebuilt에 커스텀 스킨을 포함하는 custom artifact 흐름은 아직 지원하지 않으며, 공식 릴리스
        디렉터리에 파일을 직접 복사하면 checksum과 업데이트 검증이 깨집니다.
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
            <CommonVCode>npm run build</CommonVCode>를 실행하고 프론트엔드 프로세스를 재시작합니다.
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
        컴포넌트가 사용하는 provider 및 타입 계약을 유지하세요. 개발 중에는
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
  ShieldAlert,
  User,
} from "lucide-vue-next"
import { toast } from "vue-sonner"
import CommonVCode from "~/components/common/CommonVCode.vue"
import type { AdminSkinCategory, AdminSkinType } from "~/types/admin"

defineOptions({ name: "NuboAdminSkin" })

const config = useRuntimeConfig()
const { installed, manifestIssues, settings } = useSkins()
const selected = reactive({ ...settings.value })
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
