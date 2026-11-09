<template>
  <section id="privacy-operations" class="my-8 rounded-lg border border-border p-5 text-sm leading-7">
    <h2 class="mb-4 text-lg font-semibold">현재 서비스의 외부 처리 및 로그 운영 현황</h2>
    <p v-if="!status?.available" role="status" class="text-muted-foreground">현재 운영 설정을 확인하지 못했습니다. 외부 처리 없음으로 판단하지 않으며, 담당자에게 확인해 주세요.</p>
    <template v-else>
      <h3 class="mt-4 font-semibold">외부 위탁·연동</h3>
      <p v-if="status.providers.length === 0">NUBO 기본 기능에서 설정된 외부 위탁·연동은 없습니다.</p>
      <p v-else>설정된 외부 처리 서비스: {{ status.providers.join(", ") }}. 실제 위탁·제공의 구분과 처리 조건은 아래 운영처별 상세를 확인해 주세요.</p>
      <p class="mt-2 text-muted-foreground">별도로 계약한 서버 호스팅·저장소·추가 기능은 운영자가 공개하는 처리 상세에 따릅니다.</p>
      <h3 class="mt-4 font-semibold">OpenAI 사진 검색 보조</h3>
      <p v-if="!status.imageDescriptionEnabled">현재 사용하지 않습니다. API 키가 없거나 운영자가 기능을 켜지 않으면 OpenAI로 사진을 전송하지 않습니다.</p>
      <p v-else>현재 사용 중입니다. 사진 검색을 돕기 위해 작은 썸네일과 설명 요청을 OpenAI API로 전송하고, 반환된 설명 텍스트를 사이트에 저장하여 텍스트 검색에 활용합니다. 원본 파일·계정 이메일·비밀번호를 이 설명 요청에 첨부하지 않습니다.</p>
      <p class="mt-2 text-muted-foreground">기본값은 비활성입니다. API 키 설정과 명시적인 기능 활성화가 모두 필요합니다. 썸네일에도 얼굴이나 글자가 남을 수 있으므로 익명화된 자료라고 보장하지 않습니다. 활성화 시 외부 전송·국외 이전에 필요한 안내와 적법한 근거를 갖춰야 합니다.</p>
      <h3 class="mt-4 font-semibold">보안·운영 로그</h3>
      <template v-if="status.securityLogEnabled">
        <p>변경 요청, 관리자 조회 및 HTTP 오류의 시각(UTC), 요청 방식, 경로 유형, HTTP 처리 결과·소요시간, 인증된 요청의 내부 회원 번호를 보안·장애 대응 목적으로 기록합니다. 일반 게시물 열람 전체를 추적하는 방문 이력은 아닙니다.</p>
        <p>UTC 날짜 기준 최근 {{ status.securityLogRetentionDays }}일을 보관하고 만료 기록을 자동 삭제합니다. 하루 저장 한도는 10MiB입니다. 관리자 전용 화면에서 조회·CSV 제출이 가능하며 조회·다운로드 행위도 기록합니다.</p>
        <p v-if="status.securityLogMaskedIP">네트워크 연결 주소는 IPv4 /24·IPv6 /48 단위로 마스킹해 보관합니다. 명시적으로 신뢰한 프록시가 있으면 검증한 접속지를 사용하고, 설정이 없으면 직접 연결한 프록시 주소일 수 있습니다. 임의의 전달 헤더는 신뢰하지 않습니다.</p>
        <p v-else>이 보안 로그에 IP 주소를 저장하지 않습니다.</p>
        <p>비밀번호·인증 토큰·쿠키·이메일·요청 본문·검색어·실제 게시물 주소의 변수 값은 이 보안 로그에 저장하지 않습니다. 회원 탈퇴 시에도 사고 대응을 위한 기존 보안 기록은 위 짧은 보관기간까지 접근을 제한해 유지한 뒤 만료 삭제합니다.</p>
      </template>
      <p v-else>해당 백엔드에서 보안·운영 로그 기능이 활성화되어 있지 않습니다. 별도의 웹서버·시스템 기록은 운영처의 설정을 확인해야 합니다.</p>
      <template v-if="status.auditLogRetentionDays">
        <h3 class="mt-4 font-semibold">관리자 개인정보 처리 감사 기록</h3>
        <p>단기 운영 로그와 별도로 관리자 요청의 실행 전·후, 관리자 번호, 확인 가능한 대상 회원 번호, 접속지 주소 원문과 처리 결과를 최근 {{ status.auditLogRetentionDays }}일 보관합니다. 개인정보 오·남용 점검과 법적 보호 의무 이행을 위해 접근을 제한하며, 계정 탈퇴 이후에도 해당 보관기간까지 유지한 뒤 만료 삭제합니다.</p>
        <p>관리자 감사 파일은 HMAC 연결·일별 봉인으로 무결성을 확인합니다. 관리자만 조회·CSV 제출·월별 점검 확인을 기록할 수 있습니다. 신뢰 프록시가 설정된 경우에만 검증된 전달 주소를 사용하며 그렇지 않으면 직접 연결한 네트워크 주소를 기록합니다.</p>
      </template>
      <p class="mt-3 text-muted-foreground">별도로 기존 방문 통계에는 회원 번호와 방문 시각이 저장됩니다. 사용자 IP는 포함하지 않으며 계정 탈퇴 시 연결 기록이 삭제됩니다. Nginx·호스팅·시스템의 접근·오류 로그와 백업은 이 보안 로그와 별개이며 실제 보관기간은 운영처별 상세에 공개합니다.</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import type { PrivacyOperationalStatus } from "~/types/legal"
const config = useRuntimeConfig()
const { data: status } = await useFetch<PrivacyOperationalStatus>("/legal/status", { baseURL: config.public.apiBase, key: "legal-operational-status" })
</script>
