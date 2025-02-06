<template>
  <GPT_Page>
    <ask_main :docIds="docIds" />
  </GPT_Page>
</template>
<script setup lang="ts">
import GPT_Page from '@/components/Layout/GPT_Page.vue'
import ask_main from '@/pages/ask/ask_main.vue'

// import Loading from '@/components/Loading/index.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const query = route.query

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
