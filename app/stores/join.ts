import { toast } from "vue-sonner"
import { useResetPasswordTemplate } from "~/skins/login/nubo-basic-login/resetPasswordTemplate"
import { useVerifyCodeTemplate } from "~/skins/login/nubo-basic-login/verifyCodeTemplate"

export const useJoinStore = defineStore("join", () => {
  const {
    checkUsedEmail,
    checkUsedName,
    submitJoinForm,
    verifyUser,
    updateUserPassword,
    resetUserPassword,
  } = useAuth()
  const config = useRuntimeConfig()
  const code = ref<string>("")
  const email = ref<string>("")
  const name = ref<string>("")
  const password = ref<string>("")
  const password2 = ref<string>("")
  const target = ref<number>(0)
  const isLoading = ref<boolean>(false)
  const isValidEmail = ref<boolean>(false)
  const isValidName = ref<boolean>(false)
  const isValidPassword = ref<boolean>(false)
  const isValidCode = ref<boolean>(false)
  const isRequestedReset = ref<boolean>(false)
  const resetCode = ref<string>("")
  const resetTarget = ref<number>(0)
  const resetPassword = ref<string>("")
  const resetPassword2 = ref<string>("")
  const EMAIL_REGEX =
    /^(?!.*\.\.)(?!\.)(?!.*\.$)[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+@(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,}$/
  const PW_REGET = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s])[^\s]{8,}$/

  // 이미 등록된 이메일 주소인지 확인 (true: 이미 사용중)
  const isUsedEmail = async () => {
    if (EMAIL_REGEX.test(email.value) === false) {
      toast(`⚠️ 이메일 형식이 올바르지 않습니다: ${email.value}`)
      return
    }
    try {
      isLoading.value = true
      const response = await checkUsedEmail(email.value)
      if (!response.success) {
        toast(`❌ 이메일 중복 확인을 하지 못했습니다: ${response.error}`)
        return
      }
      isValidEmail.value = !response.result
      if (!isValidEmail.value) {
        toast(`⚠️ 이미 사용중인 메일 주소입니다: ${email.value}`)
        email.value = ""
        return
      }
      toast(`✅ 사용 가능한 메일 주소입니다: ${email.value}`)
    } catch (e) {
      toast(`❌ 이메일 중복 확인을 하지 못했습니다: ${e}`)
    } finally {
      isLoading.value = false
    }
  }

  // 이미 등록된 이름인지 확인 (true: 이미 사용중)
  const isUsedName = async () => {
    if (name.value.length < 2) {
      toast(`⚠️ 이름은 최소 2글자 이상이어야 합니다: ${name.value}`)
      return
    }
    try {
      isLoading.value = true
      const response = await checkUsedName(name.value)
      if (!response.success) {
        toast(`❌ 이름 중복 확인을 하지 못했습니다: ${response.error}`)
        return
      }
      isValidName.value = !response.result
      if (!isValidName.value) {
        toast(`⚠️ 이미 사용중인 이름입니다: ${name.value}`)
        name.value = ""
        return
      }
      toast(`✅ 사용 가능한 이름입니다: ${name.value}`)
    } catch (e) {
      toast(`❌ 이름 중복 확인을 하지 못했습니다: ${e}`)
    } finally {
      isLoading.value = false
    }
  }

  // 입력한 비밀번호가 유효한지 확인
  const submit = async () => {
    if (!PW_REGET.test(password.value) || !PW_REGET.test(password2.value)) {
      toast(`⚠️ 비밀번호는 8글자 이상, 영문/숫자/특수기호 조합이 필요합니다`)
      password.value = ""
      password2.value = ""
      return
    }
    if (password.value !== password2.value) {
      toast(`⚠️ 입력한 비밀번호가 서로 다릅니다`)
      password.value = ""
      password2.value = ""
      return
    }
    try {
      isLoading.value = true
      const mailTemplate = useVerifyCodeTemplate()
      const response = await submitJoinForm({
        id: email.value,
        password: password.value,
        name: name.value,
        template: mailTemplate.template,
      })
      if (!response.success || !response.result) {
        toast(`❌ 인증 메일 발송을 하지 못했습니다: ${response.error}`)
        return
      }
      if (response.result.sendmail) {
        toast(
          `✅ 인증코드 6자리를 ${email.value}로 요청하였습니다. 받은 편지함/스팸함 등을 확인해보세요!`,
        )
        target.value = response.result.target
        isValidPassword.value = true
      } else {
        isValidCode.value = true
        toast(`✅ 가입이 정상적으로 처리되었습니다, 로그인 화면으로 곧 이동합니다`)
        setTimeout(() => {
          navigateTo(`/auth/login`)
        }, 3000)
      }
    } catch (e) {
      toast(`❌ 인증 메일 발송을 하지 못했습니다: ${e}`)
    } finally {
      isLoading.value = false
    }
  }

  // 인증 코드 입력 받아서 마지막으로 사용자 인증 완료하기
  const verify = async () => {
    if (code.value.length !== 6) {
      toast(`⚠️ 인증 코드는 6글자입니다`)
      return
    }
    try {
      isLoading.value = true
      const response = await verifyUser({
        id: email.value,
        password: password.value,
        name: name.value,
        target: target.value,
        code: code.value,
      })
      if (!response.success) {
        toast(`❌ 인증 코드를 확인하지 못했습니다: ${response.error}`)
        return
      }
      if (!response.result) {
        toast(`⚠️ 인증 코드가 다릅니다, 다시 확인해주세요`)
        code.value = ""
        return
      }
      isValidCode.value = true
      toast(`✅ 인증이 성공적으로 완료되었습니다`)
    } catch (e) {
      toast(`❌ 인증 코드를 확인하지 못했습니다: ${e}`)
    } finally {
      isLoading.value = false
    }
  }

  // 비밀번호 초기화 요청 보내기
  const requestResetPassword = async () => {
    if (!EMAIL_REGEX.test(email.value)) {
      toast(`⚠️ 이메일 형식이 올바르지 않습니다: ${email.value}`)
      return
    }
    try {
      isLoading.value = true
      const mailTemplate = useResetPasswordTemplate()
      const response = await resetUserPassword({
        email: email.value,
        template: mailTemplate.template,
      })
      if (!response.success) {
        toast(`❌ 비밀번호 초기화 요청을 보내지 못했습니다: ${response.error}`)
        return
      }
      if (!response.result) {
        toast(
          `❌ 비밀번호를 초기화하지 못했습니다: ${config.public.adminId} 으로 초기화 요청을 보내주세요!`,
        )
        return
      }
      toast(`✅ 요청을 보냈습니다: 이메일에서 받은편지함 혹은 스팸함을 확인해주세요`)
      isRequestedReset.value = true
    } catch (e) {
      toast(`❌ 비밀번호 초기화 요청을 보내지 못했습니다: ${e}`)
    } finally {
      isLoading.value = false
    }
  }

  // 새 비밀번호로 업데이트하기
  const updatePassword = async () => {
    if (!PW_REGET.test(resetPassword.value) || !PW_REGET.test(resetPassword2.value)) {
      toast(`⚠️ 비밀번호는 8글자 이상, 영문/숫자/특수기호 조합이 필요합니다`)
      resetPassword.value = ""
      resetPassword2.value = ""
      return
    }
    if (resetPassword.value !== resetPassword2.value) {
      toast(`⚠️ 입력한 비밀번호가 서로 다릅니다`)
      resetPassword.value = ""
      resetPassword2.value = ""
      return
    }
    try {
      isLoading.value = true
      const response = await updateUserPassword({
        code: resetCode.value,
        target: resetTarget.value,
        password: resetPassword.value,
      })
      if (!response.success) {
        toast(`❌ 비밀번호를 변경하지 못했습니다: ${response.error}`)
        return
      }
      if (!response.result) {
        toast(`❌ 인증 코드가 올바르지 않습니다, 다시 메일을 확인해보세요`)
        return
      }
      toast(`✅ 비밀번호를 성공적으로 변경하였습니다, 로그인 페이지로 곧 이동합니다`)
      setTimeout(() => {
        navigateTo(`/auth/login`)
      }, 3000)
    } catch (e) {
      toast(`❌ 비밀번호를 변경하지 못했습니다: ${e}`)
    } finally {
      isLoading.value = false
    }
  }

  // 입력값들 초기화하고 이메일 입력부터 다시 진행
  const clear = () => {
    email.value = ""
    name.value = ""
    password.value = ""
    target.value = 0
    code.value = ""
    isValidEmail.value = false
    isValidName.value = false
    isValidCode.value = false
  }

  return {
    code,
    email,
    name,
    password,
    password2,
    target,
    isLoading,
    isValidEmail,
    isValidName,
    isValidPassword,
    isValidCode,
    isRequestedReset,
    resetCode,
    resetTarget,
    resetPassword,
    resetPassword2,

    submit,
    isUsedEmail,
    isUsedName,
    clear,
    verify,
    requestResetPassword,
    updatePassword,
  }
})
