<template>
  <div class="relative min-h-screen overflow-hidden bg-[#15151F] text-slate-100 antialiased">
    <div
      class="absolute inset-0 opacity-[0.025]"
      :style="{
        backgroundImage:
          'linear-gradient(to right, rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.7) 1px, transparent 1px)',
        backgroundSize: '72px 72px',
      }"
    />
    <HeroSection />
    <WhatsNew />
    <Comparison />
    <SkinSystem />
    <ClickToAction />
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue"
import ClickToAction from "./components/landing/ClickToAction.vue"
import Comparison from "./components/landing/Comparison.vue"
import Footer from "./components/landing/Footer.vue"
import HeroSection from "./components/landing/HeroSection.vue"
import SkinSystem from "./components/landing/SkinSystem.vue"
import WhatsNew from "./components/landing/WhatsNew.vue"

let observer: IntersectionObserver | null = null

onMounted(() => {
  if (typeof window === "undefined") return
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible")
          observer?.unobserve(entry.target)
        }
      })
    },
    { threshold: 0.12, rootMargin: "0px 0px -5% 0px" },
  )
  document.querySelectorAll("[data-reveal]").forEach((el) => observer?.observe(el))
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<style lang="css" scoped>
[data-reveal] {
  opacity: 0;
}
[data-reveal].is-visible {
  animation: reveal-up 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes reveal-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}
.animate-shimmer {
  animation: shimmer 8s linear infinite;
}

@keyframes aurora-1 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.55;
  }
  50% {
    transform: translate(60px, 40px) scale(1.1);
    opacity: 0.8;
  }
}
@keyframes aurora-2 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.45;
  }
  50% {
    transform: translate(-50px, 30px) scale(1.15);
    opacity: 0.7;
  }
}
@keyframes aurora-3 {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.35;
  }
  50% {
    transform: translate(40px, -40px) scale(1.05);
    opacity: 0.6;
  }
}
.animate-aurora-1 {
  animation: aurora-1 14s ease-in-out infinite;
}
.animate-aurora-2 {
  animation: aurora-2 18s ease-in-out infinite;
}
.animate-aurora-3 {
  animation: aurora-3 22s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  [data-reveal].is-visible {
    animation: none;
    opacity: 1;
    transform: none;
  }
  .animate-shimmer,
  .animate-aurora-1,
  .animate-aurora-2,
  .animate-aurora-3 {
    animation: none;
  }
}
</style>
