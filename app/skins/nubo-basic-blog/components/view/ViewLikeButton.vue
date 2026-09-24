<template>
  <div class="relative inline-flex items-center">
    <ReactionPicker :state="{ reactions: view.post.reactions, myReaction: view.post.myReaction }" :disabled="!isLoggedIn" @select="setPostReaction" />
  </div>
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/providers/contexts/view"

const { view, isLoggedIn, setPostReaction } = useNuboViewContext()</script>
