<template>
  <div class="relative inline-flex items-center">
    <ReactionPicker :state="view.post.reactions" :disabled="!isLoggedIn" @select="setPostReaction" />
  </div>
</template>

<script setup lang="ts">
import { useNuboViewContext } from "~/providers/contexts/view"

const { view, isLoggedIn, setPostReaction } = useNuboViewContext()</script>
