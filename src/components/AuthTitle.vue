<script setup lang="ts">

const router = useRouter()  
const if_ldap = ref(false)

if (import.meta.env.VITE_APP_ENV === 'ldap') {
  if_ldap.value = true
}

</script>

<template>
  <h1 class="flex items-center gap-2 text-xl font-bold cursor-pointer" @click="router.push('/')">
    <!-- <Command /> -->
    
    <img v-if="if_ldap" src="@/assets/imgs/qilu_logo.png" alt="齐鲁大脑" class="w-8 h-6" />
    <img v-else src="@/assets/imgs/top_logo_color.png" alt="SciGPT" class="w-13 h-8" />
    
    <span v-if="if_ldap">齐鲁大脑</span>
    <span v-else>SciGPT</span>
    
  </h1>
</template>

<style scoped>
</style>
