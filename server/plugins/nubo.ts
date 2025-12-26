export default defineNitroPlugin((nitroApp) => {
  const nubo = `<!--                                                                 
                    $$\\                 
                    $$ |                
$$$$$$$\\  $$\\   $$\\ $$$$$$$\\   $$$$$$\\  
$$  __$$\\ $$ |  $$ |$$  __$$\\ $$  __$$\\ 
$$ |  $$ |$$ |  $$ |$$ |  $$ |$$ /  $$ |
$$ |  $$ |$$ |  $$ |$$ |  $$ |$$ |  $$ |
$$ |  $$ |\\$$$$$$  |$$$$$$$  |\\$$$$$$  |
\\__|  \\__| \\______/ \\_______/  \\______/ 
                                                                               
A New Unified Board | https://nubohub.org
-->`
  nitroApp.hooks.hook("render:html", (html) => {
    html.head.unshift(nubo)
  })
})
