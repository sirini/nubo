export default defineNitroPlugin((nitroApp) => {
  const nubo = `<!--                                                                 

███╗░░██╗██╗░░░██╗██████╗░░█████╗░
████╗░██║██║░░░██║██╔══██╗██╔══██╗
██╔██╗██║██║░░░██║██████╦╝██║░░██║
██║╚████║██║░░░██║██╔══██╗██║░░██║
██║░╚███║╚██████╔╝██████╦╝╚█████╔╝
╚═╝░░╚══╝░╚═════╝░╚═════╝░░╚════╝░
                                                                               
a new unified board | https://nubohub.org
-->`
  nitroApp.hooks.hook("render:html", (html) => {
    html.head.unshift(nubo)
  })
})
