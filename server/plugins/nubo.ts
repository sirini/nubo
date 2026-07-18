export default defineNitroPlugin((nitroApp) => {
  const nubo = `<!--                                                                 

███╗░░██╗██╗░░░██╗██████╗░░█████╗░
████╗░██║██║░░░██║██╔══██╗██╔══██╗
██╔██╗██║██║░░░██║██████╦╝██║░░██║
██║╚████║██║░░░██║██╔══██╗██║░░██║
██║░╚███║╚██████╔╝██████╦╝╚█████╔╝
╚═╝░░╚══╝░╚═════╝░╚═════╝░░╚════╝░
                                                                               
v${process.env.NUXT_PUBLIC_VERSION} | https://nubohub.org


-->`
  nitroApp.hooks.hook("render:html", (html) => {
    html.head.unshift(nubo)
  })
})
