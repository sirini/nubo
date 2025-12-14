<template>
  <section class="container mx-auto py-4">
    <div class="mb-10 text-center">
      <h1 class="text-2xl font-bold tracking-tight">개인정보 처리방침</h1>
      <div class="mt-4 text-lg text-muted-foreground">
        {{ title }}(이하 "사이트")는 회원의 개인정보를 소중히 여기며, 관련 법령을 준수하기 위해
        노력합니다. 본 방침은 귀하의 개인정보가 어떻게 수집, 이용되며 보호받는지에 대해 설명합니다.
      </div>
    </div>

    <Separator class="my-6" />

    <div class="space-y-10">
      <section>
        <h2 class="text-2xl font-semibold tracking-tight mt-2 mb-4">
          제1조 (수집하는 개인정보 항목)
        </h2>
        <div class="mb-4 leading-7">
          사이트는 회원가입, 원활한 서비스 제공을 위해 최소한의 범위 내에서 아래와 같은 개인정보를
          수집하고 있습니다.
        </div>

        <ul class="list-disc pl-6 mb-2 space-y-2 text-muted-foreground">
          <li><strong class="mr-2">필수</strong> 아이디, 비밀번호, 닉네임 (회원 식별을 위함)</li>
          <li>
            <strong class="mr-2">선택</strong> 프로필 이미지, 자기소개 등 회원이 직접 입력한 정보
          </li>
          <li><strong class="mr-2">자동수집</strong> 서비스 이용 기록, 접속 로그, 쿠키</li>
        </ul>
      </section>

      <Separator class="my-6" />

      <section>
        <h2 class="text-2xl font-semibold tracking-tight mt-2 mb-4">
          제2조 (개인정보의 수집 및 이용 목적)
        </h2>
        <div class="mb-4 leading-7">
          수집한 개인정보를 다음의 목적을 위해 활용합니다. 이용자가 제공한 모든 정보는 하기 목적에
          필요한 용도 이외로는 사용되지 않으며 이용 목적이 변경될 시에는 사전 동의를 구할 것입니다.
        </div>

        <ul class="list-disc pl-6 mb-2 space-y-2 text-muted-foreground">
          <li>
            <strong class="mr-2">회원 관리</strong> 회원제 서비스 이용에 따른 본인확인, 개인 식별,
            불량 회원의 부정 이용 방지, 가입 의사 확인
          </li>
          <li>
            <strong class="mr-2">서비스 제공</strong> 게시글 작성, 댓글 작성 등 커뮤니티 기능 제공
          </li>
          <li>
            <strong class="mr-2">사이트 개선</strong> 접속 빈도 파악 또는 회원의 서비스 이용에 대한
            통계 분석을 통한 서비스 개선 및 신규 서비스 개발
          </li>
        </ul>
      </section>

      <Separator class="my-6" />

      <section>
        <h2 class="text-2xl font-semibold tracking-tight mt-2 mb-4">
          제3조 (개인정보의 보유 및 이용 기간)
        </h2>

        <div class="leading-7">
          회원이 탈퇴를 요청하거나 개인정보 수집 및 이용에 대한 동의를 철회하는 경우, 수집된
          개인정보는 즉시 파기됩니다. 관계 법령의 규정에 의하여 보존할 필요가 있는 경우, 법령에서
          정한 일정한 기간 동안 정보를 보관합니다.
        </div>
      </section>

      <Separator class="my-6" />

      <section>
        <h2 class="text-2xl font-semibold tracking-tight mt-2 mb-4">
          제4조 (개인정보의 제3자 제공)
        </h2>
        <div class="leading-7">
          사이트는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는
          예외로 합니다.
        </div>
        <ul class="list-disc pl-6 mb-2 mt-4 space-y-2 text-muted-foreground">
          <li>이용자들이 사전에 동의한 경우</li>
          <li>
            법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의
            요구가 있는 경우
          </li>
        </ul>
      </section>

      <Separator class="my-6" />

      <section>
        <h2 class="text-2xl font-semibold tracking-tight mt-2 mb-4">
          제5조 (이용자의 권리와 행사 방법)
        </h2>
        <div class="leading-7">
          이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며, 가입
          해지(회원 탈퇴)를 요청할 수 있습니다. 사이트 내 '마이페이지' 또는 '설정' 메뉴를 통해 직접
          열람, 정정 또는 탈퇴가 가능합니다.
        </div>
      </section>

      <Separator class="my-6" />

      <section>
        <h2 class="text-2xl font-semibold tracking-tight mt-2 mb-4">
          제6조 (개인정보 관련 문의처)
        </h2>
        <div class="mb-4 leading-7">
          사이트는 이용자의 개인정보를 보호하고 개인정보와 관련한 불만을 처리하기 위하여 아래와 같이
          관리자를 지정하고 있습니다.
        </div>

        <div class="bg-muted/50 p-4 mt-8 rounded-lg">
          <div><strong class="mr-2">메일</strong> {{ admin }}</div>
          <div class="text-sm text-muted-foreground mt-2">
            개인정보와 관련된 문의사항이 있으시면 언제든지 연락 주시기 바랍니다.
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const title = computed(() => config.public.title)
const admin = computed(() => config.public.adminId)
</script>
