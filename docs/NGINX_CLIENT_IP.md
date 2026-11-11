# Nginx를 통한 실제 접속 IP 기록

## 같은 서버의 Nginx → NUBO 웹/GOAPI 구성

공식 기본 포트는 웹 3000, GOAPI 3006이며 경로는 `/goapi/`다. 기존 HTTPS `server` 블록에서
**웹으로 프록시하는 location과 GOAPI로 프록시하는 location 모두** 헤더를 설정한다.
TLS 인증서·업로드 alias·웹소켓 등 기존 설정은 유지하고 아래 예시의 해당 부분을 병합한다.
이미 location이 있다면 중복 블록을 추가하지 않는다. `/api/`를 별도 location으로 웹에 전달한다면
그 블록에도 같은 헤더가 필요하다.

```nginx
# 기존 HTTPS server { ... } 내부
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /goapi/ {
    # 끝에 /를 붙이지 않아 /goapi/ 경로를 그대로 전달한다.
    proxy_pass http://127.0.0.1:3006;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

핵심은 `X-Real-IP $remote_addr`로 **덮어쓰기**다. 외부 요청의 `$http_x_real_ip`를 그대로 전달하지 않는다.
위 설정은 저장소의 `deploy/nginx/nubo.conf.in`에도 들어 있다.
Nginx의 헤더 설정·location별 상속 규칙은 [공식 proxy_set_header 문서](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_set_header)를 따른다.

## 웹과 GOAPI 양쪽의 실행 환경

각 프로세스가 실제로 읽는 `.env`에 다음을 적용한다. 같은 파일을 공유하면 한 번 설정하면 된다.

```dotenv
NUBO_TRUSTED_PROXY_CIDRS=127.0.0.1/32,::1/128
GOAPI_HOST=127.0.0.1
NITRO_HOST=127.0.0.1
```

이 값은 브라우저에 공개하는 `NUXT_PUBLIC_` 변수가 아니다. 웹은 연결 상대가 등록된 프록시일 때만
Nginx의 `X-Real-IP`를 받아 검증 후 GOAPI로 전달한다. GOAPI도 직접 연결한 Nginx/Nuxt가 신뢰 대상일
때만 이 헤더를 받아들인다. 한쪽만 설정하면 원 IP 전달이 끊길 수 있다.

systemd unit/drop-in을 변경했다면 재시작 전에 `sudo systemctl daemon-reload`도 실행한다.
프로세스 환경 변수(systemd drop-in 등)가 `.env`보다 우선한다. 이미 같은 변수가 실행 환경에 지정되어
있다면 그곳도 갱신한다. 웹은 production 실행 시 `.env`를 읽도록 기존 `--env-file` 실행 방식을 유지한다.
Docker·다른 서버 구성에서는 loopback 대신 실제 Nginx/Nuxt 접속지의 정확한 주소·CIDR을 지정한다.
`0.0.0.0/0`, `::/0` 또는 관계없는 광범위한 네트워크를 신뢰하지 않는다.

3000·3006 포트를 외부에서 직접 접근하도록 열지 않는다. 로컬 바인딩을 유지하거나 컨테이너/다중 서버의
네트워크 접근을 Nginx/Nuxt로 제한한다. 기록의 주소는 회사 NAT·VPN을 거친 공인 출구 주소일 수 있다.

## 적용·확인

공식 systemd 설치 기준(서비스명이 다르거나 tmux/pm2 실행이면 그 방식에 맞춰 두 프로세스를 재시작):

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo systemctl restart nubo-goapi.service nubo-web.service
```

1. 외부 브라우저에서 사이트에 접속한다.
2. 관리자 콘솔의 방문자 기록을 오늘 **KST** 날짜로 조회한다. 주소가 loopback 대신 실제 접속지인지 확인한다.
3. 외부 환경에서 아래 요청을 한 뒤 같은 시각의 기록을 확인한다. 임의의 전달 헤더 값이 기록되면 안 된다.

```bash
curl -H 'X-Real-IP: 203.0.113.123' https://YOUR_DOMAIN/privacy
```

정상이라면 `203.0.113.123` 대신 실제 외부 연결 주소가 기록된다. 기존에 잘못 기록된 주소를 소급해서
복구하지는 못한다. 기록이 여전히 loopback이면 요청을 처리한 실제 location의 헤더와 양쪽 프로세스의
환경 파일·재시작 여부부터 확인한다. 전달 경로·저장 방식은 [운영 로그 문서](SECURITY_LOGS.md)를 참조한다.

## Nginx 앞에 CDN·로드밸런서가 있는 경우

이 경우 `$remote_addr` 자체가 CDN/LB 주소일 수 있다. Nginx의 `real_ip` 모듈에서
`set_real_ip_from`으로 **해당 장비/업체의 실제 CIDR만** 신뢰하고, 업체가 제공하는 실제 IP 헤더를
`real_ip_header`로 지정한다. X-Forwarded-For 체인을 쓰는 신뢰된 LB에서는 `real_ip_recursive on`도 검토한다.
구체적인 주소 범위·헤더는 해당 인프라의 공식 문서를 따른다. 일반 인터넷 요청 전체를 신뢰하면 안 된다.

Nginx에서 원 접속지를 복원한 뒤에는 위의 `proxy_set_header X-Real-IP $remote_addr`를 그대로 사용한다.
[Nginx realip 공식 문서](https://nginx.org/en/docs/http/ngx_http_realip_module.html)의 모듈 제공 여부와
신뢰 주소·헤더 설정을 확인한다. CDN/LB가 없는 직접 접속 구성에서는 이 추가 설정이 필요하지 않다.
