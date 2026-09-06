<template>
  <section class="container mx-auto max-w-3xl px-4 py-6 sm:px-6">
    <div class="mb-10 text-center">
      <h1 class="text-2xl font-bold tracking-tight">개인정보 처리방침</h1>
      <div class="mt-4 text-lg text-muted-foreground">
        {{ title }} 웹사이트와 SENSTA 모바일 앱(이하 "서비스")은 회원의 개인정보를 소중히 여기며,
        관련 법령을 준수하기 위해 노력합니다. 본 방침은 개인정보가 어떻게 수집, 이용되고 보호되는지
        설명합니다.
      </div>
      <p class="mt-2 text-xs text-muted-foreground">시행일: 2026년 9월 6일</p>
    </div>

    <Separator class="my-6" />

    <div class="space-y-10">
      <p class="text-sm text-muted-foreground">
        서비스 이용 및 게시물 운영 기준은
        <NuxtLink to="/terms" class="font-medium text-primary underline underline-offset-4">
          이용약관 및 커뮤니티 운영 원칙
        </NuxtLink>
        에서 확인할 수 있습니다.
      </p>
      <section>
        <h2 class="text-2xl font-semibold tracking-tight mt-2 mb-4">
          제1조 (수집하는 개인정보 항목)
        </h2>
        <div class="mb-4 leading-7">
          서비스는 회원가입과 커뮤니티 기능 제공을 위해 최소한의 범위에서 아래 정보를
          수집하고 있습니다.
        </div>

        <ul class="list-disc pl-6 mb-2 space-y-2 text-muted-foreground">
          <li>
            <strong class="mr-2">계정 정보</strong> 이메일 주소, 암호화된 비밀번호, 닉네임,
            Apple·Google 로그인 식별자
          </li>
          <li>
            <strong class="mr-2">프로필</strong> 프로필 이미지, 자기소개 등 회원이 직접 입력한 정보
          </li>
          <li>
            <strong class="mr-2">이용자 콘텐츠</strong> 사진, 제목·본문·해시태그, 댓글, 좋아요,
            1:1 메시지, 신고와 차단 정보
          </li>
          <li>
            <strong class="mr-2">기기·이용 정보</strong> 알림용 앱 설치 식별자, 알림 읽음 상태,
            서비스 이용 기록, 접속 로그와 웹 쿠키
          </li>
        </ul>
        <p class="mt-4 text-sm leading-6 text-muted-foreground">
          SENSTA iOS는 공개 사진을 전송하기 전에 GPS 위치 메타데이터를 제거하며 광고 추적 권한을
          요청하지 않습니다.
        </p>
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
            <strong class="mr-2">서비스 제공</strong> 사진 감상·업로드, 게시글·댓글·1:1 메시지,
            알림과 검색 등 커뮤니티 기능 제공
          </li>
          <li>
            <strong class="mr-2">안전과 개선</strong> 신고 처리, 부정 이용 방지, 오류 진단과
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
          회원이 탈퇴를 요청하면 계정과 연결된 프로필, 사진·게시글, 댓글·좋아요, 1:1 메시지, 알림과
          로그인 정보는 삭제됩니다. 관계 법령 준수, 보안 사고 대응 또는 분쟁 처리를 위해 보존해야 하는
          정보가 있다면 해당 목적과 기간에 한해 분리 보관한 뒤 파기합니다.
        </div>
      </section>

      <Separator class="my-6" />

      <section>
        <h2 class="text-2xl font-semibold tracking-tight mt-2 mb-4">
          제4조 (개인정보의 제3자 제공)
        </h2>
        <div class="leading-7">
          서비스는 개인정보를 판매하거나 맞춤형 광고 추적에 사용하지 않습니다. 기능 제공에 필요한
          범위에서 아래 처리업체 또는 플랫폼과 정보를 처리할 수 있습니다.
        </div>
        <ul class="list-disc pl-6 mb-2 mt-4 space-y-2 text-muted-foreground">
          <li>Apple·Google: 로그인과 계정 연결·승인 폐기</li>
          <li>Google Firebase: 푸시 알림 전달, 앱 설치 식별자와 제한적인 진단 정보 처리</li>
          <li>Resend: 회원가입 인증과 비밀번호 재설정 이메일 발송</li>
          <li>OpenAI: 운영자가 AI 사진 설명 기능을 활성화한 경우 업로드 사진의 설명 생성</li>
          <li>
            법령에 근거한 적법한 요구가 있거나 이용자가 별도로 동의한 경우
          </li>
        </ul>
      </section>

      <Separator class="my-6" />

      <section>
        <h2 class="text-2xl font-semibold tracking-tight mt-2 mb-4">
          제5조 (이용자의 권리와 행사 방법)
        </h2>
        <div class="leading-7">
          이용자는 언제든지 자신의 개인정보를 조회하거나 수정하고 가입 해지(회원 탈퇴)를 요청할 수
          있습니다. 서비스 내 프로필에서 정보를 열람·정정할 수 있고,
          <NuxtLink to="/delete-account" class="font-medium text-primary underline underline-offset-4">
            계정 및 데이터 삭제 페이지
          </NuxtLink>
          에서 직접 탈퇴할 수 있습니다.
        </div>
        <p class="mt-4 leading-7">
          그 밖의 열람·정정·삭제 문의는
          <NuxtLink to="/support" class="font-medium text-primary underline underline-offset-4">
            지원 페이지
          </NuxtLink>
          의 이메일로 접수할 수 있습니다.
        </p>
      </section>

      <Separator class="my-6" />

      <section>
        <h2 class="text-2xl font-semibold tracking-tight mt-2 mb-4">
          제6조 (개인정보 관련 문의처)
        </h2>
        <div class="mb-4 leading-7">
          서비스는 이용자의 개인정보를 보호하고 개인정보와 관련한 불만을 처리하기 위하여 아래와 같이
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
defineOptions({ name: "NuboPrivacyPage" })

const config = useRuntimeConfig()
const title = computed(() => config.public.title)
const admin = computed(() => config.public.adminId)
</script>
