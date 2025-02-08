<template>
  <GPT_Page v-model:isSidebarOpen="isSidebarOpen">
    <template #sider_header>
      <sidebar_header @search="onSearch" />
    </template>
    <template #sider_content>
      <sidebar_content :hasQuery="hasQuery" ref="sidebar_content_ref" />
    </template>
    <main_list class="bg-muted/40" @updateFolder="updateFolder"/>
  </GPT_Page>
</template>
<script setup lang="ts">
import GPT_Page from '@/components/Layout/GPT_Page.vue'
import sidebar_header from '@/pages/knowledges/sidebar_header.vue'
import sidebar_content from '@/pages/knowledges/sidebar_content.vue'
import main_list from '@/pages/knowledges/main_list.vue'

import { useStore } from '@/stores/index.js'
const store = useStore()

// import Loading from '@/components/Loading/index.vue'
import { useRouter, useRoute } from 'vue-router'
// 获取当前route
const route = useRoute()
const route_query = route.query
const hasQuery = ref(true)
const isSidebarOpen = ref(true)
const sidebar_content_ref = ref(null)
// 如果query有folder_id，则设置store.folder_id
if (route_query.folder_id) {
  store.folder_id = route_query.folder_id
} else {
  // 如果query没有folder_id
  if (store.folder_id) {
    hasQuery.value = true
    // 设置query
    const path = `/knowledges?folder_id=${store.folder_id}&folder_name=${encodeURIComponent(store.folder_name)}`
    const url = `${window.location.origin}${path}`
    window.history.pushState({ path }, '', url)
  } else {
    hasQuery.value = false
  }
}


if (route_query.folder_name) {
  store.folder_name = route_query.folder_name
}


const updateFolder = () => {
  if (sidebar_content_ref.value) {
    sidebar_content_ref.value.getFolderList()
  }
}

const onSearch = (value: string) => {
  if (sidebar_content_ref.value) {
    sidebar_content_ref.value.getFolderList(0, value)
  }
}

// const router = useRouter()
// router.push({ name: 'dashboard' })
</script>

<route lang="yaml">
  meta:
    layout: blank
</route>
