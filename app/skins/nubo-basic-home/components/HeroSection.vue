<template>
  <section class="mb-4">
    <div class="relative overflow-hidden border rounded-lg bg-background/50 backdrop-blur-md">
      <div
        class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-none"
      />
      <div
        class="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-none"
      />

      <section
        class="container relative z-10 py-16 md:py-24 flex flex-col items-center text-center"
      >
        <div
          class="inline-flex items-center rounded-full border px-3 py-1 font-medium mb-6 bg-secondary/50"
        >
          <span class="mr-2">🐿️</span>
          <span>Nuxt 4 기반의 차세대 커뮤니티 빌더</span>
        </div>

        <h1
          class="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 bg-clip-text text-transparent bg-linear-to-r from-emerald-400 to-blue-600 leading-tight"
        >
          The Next Evolution <br />
          of Community
        </h1>

        <p class="text-xl text-muted-foreground max-w-170 mb-10 leading-relaxed px-6">
          NUBO는 TSBOARD의 빠른 속도를 계승하면서도 <br class="hidden md:block" />
          스킨 시스템과 SEO 최적화를 갖춘 고성능 커뮤니티 빌더입니다
        </p>

        <div class="flex flex-wrap justify-center gap-4">
          <CommonVTooltip
            content="NUBO는 Nuxt4와 shadcn-vue 기반의 스킨 시스템을 갖춘 고성능 프론트엔드 엔진입니다"
          >
            <NuxtLink to="https://github.com/sirini/nubo" as-child>
              <Button
                size="lg"
                variant="outline"
                class="h-12 px-8 text-lg rounded-full border-primary/20 hover:bg-primary/5 cursor-pointer"
              >
                <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <title>Nuxt</title>
                  <path
                    fill="#FFFFFF"
                    d="M13.4642 19.8295h8.9218c.2834 0 .5618-.0723.8072-.2098a1.5899 1.5899 0 0 0 .5908-.5732 1.5293 1.5293 0 0 0 .216-.783 1.529 1.529 0 0 0-.2167-.7828L17.7916 7.4142a1.5904 1.5904 0 0 0-.5907-.573 1.6524 1.6524 0 0 0-.807-.2099c-.2833 0-.5616.0724-.807.2098a1.5904 1.5904 0 0 0-.5907.5731L13.4642 9.99l-2.9954-5.0366a1.5913 1.5913 0 0 0-.591-.573 1.6533 1.6533 0 0 0-.8071-.2098c-.2834 0-.5617.0723-.8072.2097a1.5913 1.5913 0 0 0-.591.573L.2168 17.4808A1.5292 1.5292 0 0 0 0 18.2635c-.0001.2749.0744.545.216.783a1.59 1.59 0 0 0 .5908.5732c.2454.1375.5238.2098.8072.2098h5.6003c2.219 0 3.8554-.9454 4.9813-2.7899l2.7337-4.5922L16.3935 9.99l4.3944 7.382h-5.8586ZM7.123 17.3694l-3.9083-.0009 5.8586-9.8421 2.9232 4.921-1.9572 3.2892c-.7478 1.1967-1.5972 1.6328-2.9163 1.6328z"
                  />
                </svg>
                NUBO
              </Button>
            </NuxtLink>
          </CommonVTooltip>

          <CommonVTooltip content="GOAPI는 NUBO의 빠른 속도를 뒷받침하는 고성능 백엔드 엔진입니다">
            <NuxtLink to="https://github.com/sirini/goapi" as-child>
              <Button
                size="lg"
                variant="outline"
                class="h-12 px-8 text-lg rounded-full border-primary/20 hover:bg-primary/5 cursor-pointer"
              >
                <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <title>Go</title>
                  <path
                    fill="#FFFFFF"
                    d="M1.811 10.231c-.047 0-.058-.023-.035-.059l.246-.315c.023-.035.081-.058.128-.058h4.172c.046 0 .058.035.035.07l-.199.303c-.023.036-.082.07-.117.07zM.047 11.306c-.047 0-.059-.023-.035-.058l.245-.316c.023-.035.082-.058.129-.058h5.328c.047 0 .07.035.058.07l-.093.28c-.012.047-.058.07-.105.07zm2.828 1.075c-.047 0-.059-.035-.035-.07l.163-.292c.023-.035.07-.07.117-.07h2.337c.047 0 .07.035.07.082l-.023.28c0 .047-.047.082-.082.082zm12.129-2.36c-.736.187-1.239.327-1.963.514-.176.046-.187.058-.34-.117-.174-.199-.303-.327-.548-.444-.737-.362-1.45-.257-2.115.175-.795.514-1.204 1.274-1.192 2.22.011.935.654 1.706 1.577 1.835.795.105 1.46-.175 1.987-.77.105-.13.198-.27.315-.434H10.47c-.245 0-.304-.152-.222-.35.152-.362.432-.97.596-1.274a.315.315 0 01.292-.187h4.253c-.023.316-.023.631-.07.947a4.983 4.983 0 01-.958 2.29c-.841 1.11-1.94 1.8-3.33 1.986-1.145.152-2.209-.07-3.143-.77-.865-.655-1.356-1.52-1.484-2.595-.152-1.274.222-2.419.993-3.424.83-1.086 1.928-1.776 3.272-2.02 1.098-.2 2.15-.07 3.096.571.62.41 1.063.97 1.356 1.648.07.105.023.164-.117.2m3.868 6.461c-1.064-.024-2.034-.328-2.852-1.029a3.665 3.665 0 01-1.262-2.255c-.21-1.32.152-2.489.947-3.529.853-1.122 1.881-1.706 3.272-1.95 1.192-.21 2.314-.095 3.33.595.923.63 1.496 1.484 1.648 2.605.198 1.578-.257 2.863-1.344 3.962-.771.783-1.718 1.273-2.805 1.495-.315.06-.63.07-.934.106zm2.78-4.72c-.011-.153-.011-.27-.034-.387-.21-1.157-1.274-1.81-2.384-1.554-1.087.245-1.788.935-2.045 2.033-.21.912.234 1.835 1.075 2.21.643.28 1.285.244 1.905-.07.923-.48 1.425-1.228 1.484-2.233z"
                  />
                </svg>
                GOAPI
              </Button>
            </NuxtLink>
          </CommonVTooltip>
        </div>
      </section>
    </div>
  </section>
</template>
