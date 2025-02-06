<script setup lang="ts">

const router = useRouter()  
</script>

<template>
  <h1 class="flex items-center gap-2 text-xl font-bold cursor-pointer" @click="router.push('/')">
    <!-- <Command /> -->
    <img src="@/assets/imgs/top_logo_color.png" alt="SciGPT" class="w-13 h-8" />
    <span>SciGPT</span>
  </h1>
</template>

<style scoped>
</style>
