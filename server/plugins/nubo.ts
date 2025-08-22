export default defineNitroPlugin((nitroApp) => {
  const nubo = `<!--                                                                 
.:::     .::.::     .::.:: .::       .::::     
.: .::   .::.::     .::.:    .::   .::    .::  
.:: .::  .::.::     .::.:     .::.::        .::
.::  .:: .::.::     .::.::: .:   .::        .::
.::   .: .::.::     .::.:     .::.::        .::
.::    .: ::.::     .::.:      .:  .::     .:: 
.::      .::  .:::::   .:::: .::     .::::     
                                                                               
Networked Utilities & Builtin Options | https://nubohub.org
-->`
  nitroApp.hooks.hook("render:html", (html) => {
    html.head.unshift(nubo)
  })
})
