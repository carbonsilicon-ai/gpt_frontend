<template>
</template>

<script setup lang="ts">
import { get_folder_api } from '@/api/common.js'
import { useStore } from '@/stores/index.js'

const store = useStore()
const param = {
      page: 1,
      size: 100
    }

const get_all_folder = async () => {
  const res = await get_folder_api(param)
  console.log(res)
  store.knowledge_folders = res.data.data.items
}

get_all_folder()
</script>
