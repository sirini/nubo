export const useResetPasswordTemplate = () => {
  const config = useRuntimeConfig()

  // 아래에서 비밀번호 초기화 안내 메일 발송용 메일 본문을 직접 수정할 수 있습니다
  // {{UserUid}} 는 초기화하는 회원의 고유 번호, {{Code}} 는 인증 코드로 치환될 부분입니다
  const template = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #ebf1f4; font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ebf1f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
          <tr>
            <td align="center" style="font-size: 24px; font-weight: bold; color: #1e2128; letter-spacing: -0.5px;">
              🐿️ ${config.public.title}
            </td>
          </tr>
        </table>

        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding: 50px 40px; text-align: center;">
              <h1 style="margin: 0 0 20px 0; font-size: 28px; font-weight: 700; color: #1e2128;">이메일 주소 인증</h1>
              <p style="margin: 0 0 40px 0; font-size: 16px; color: #4a4a4a; line-height: 1.6;">
                아래의 URL를 클릭하거나 브라우저 주소창에 입력하세요.
              </p>

              <div style="background-color: #1e2128; padding: 30px; border-radius: 8px; margin-bottom: 40px;">
                <a href="${config.public.url}/auth/change-password/{{UserUid}}/{{Code}}" target="_blank" style="text-decoration: none; font-family: 'Courier New', Courier, monospace; color: #ffffff; ">
                  ${config.public.url}/auth/change-password/{{UserUid}}/{{Code}}
                </a>
              </div>

              <p style="margin: 0; font-size: 14px; color: #888888;">
                본인이 요청한 것이 아니라면 메일을 무시하셔도 됩니다.
              </p>
            </td>
          </tr>
        </table>

        <table width="600" border="0" cellspacing="0" cellpadding="0" style="margin-top: 30px;">
          <tr>
            <td align="center" style="font-size: 13px; color: #888888; line-height: 1.5;">
              이 메일은 <a href="${config.public.url}" style="color: #4a90e2; text-decoration: none; font-weight: bold;">${config.public.title}</a> 에서 발송되었습니다.<br>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  return {
    template,
  }
}
