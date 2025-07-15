<template>
  <div class="min-h-screen">
    <div class="flex flex-col bg-background text-foreground">
      <topmenu-nav-menus />
    </div>

    <main class="container mx-auto flex-1 px-4 py-6 min-h-[90vh]">
      <slot />
    </main>

    <footer class="py-4 text-center text-sm text-muted-foreground font-mono">
      Powered by <a href="https://nubohub.org" target="_blank">Nubo</a>
    </footer>
  </div>
</template>
