<template>
  <GPT_Page>
    <ask_main :docIds="docIds" />
  </GPT_Page>
</template>
<script setup lang="ts">
import GPT_Page from '@/components/Layout/GPT_Page.vue'
import ask_main from '@/pages/ask/ask_main.vue'

// import Loading from '@/components/Loading/index.vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const query = route.query
// 如果route包含'#/activate_transit'
if (route.fullPath?.includes('/#/activate_transit')) {
  // 获取url中的参数
  router.push('/auth/activate-transit?token=' + route.fullPath.split('token=')[1])
}

if (route.fullPath?.includes('/#/pswd_transit')) {
  // 获取url中的参数
  router.push('/auth/reset-password?token=' + route.fullPath.split('token=')[1])
}


const docIds = ref<string[]>([])

if (query.docIds) {
  if (query.docIds.includes(',')) { 
    docIds.value = query.docIds.split(',')
  } else {
    docIds.value = [query.docIds]
  }
}

// const router = useRouter()
// router.push({ name: 'dashboard' })
</script>

<route lang="yaml">
  meta:
    layout: blank
</route>
