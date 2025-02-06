<template>

</template>

<script setup lang="ts">
import { get_doc_in_channel_api, get_doc_api } from '@/api/common.js'
import { useStore } from '@/stores/index.js'
import { watch } from 'vue'

const store = useStore()
interface FileItem {
  title: string
  size: number
  parseStatus: number
  parseProgress: number
  raw?: File
  docId?: string
}

defineProps<{
  files: FileItem[]
}>()
const emit = defineEmits(['update:files'])

const get_channel_docs = async () => {
  try {
    emit('update:files', [])
    console.log(store.channel_id, 'sssss')
    if (store.channel_id) {
      const res = await get_doc_in_channel_api(store.channel_id)
      // emit('update:files', res.data.data.items)
      update_docs(res.data.data)
    }
  } catch (error) {
    console.error(error)
  }
}

const update_docs = (docIdList: string[]) => {
  Promise.all(docIdList.map(async (item) => {
    const res = await get_doc_api(item)
    return res.data.data
  })).then(res => {
    console.log(res, 'res')
    emit('update:files', res)
  })
}

get_channel_docs()

watch(() => store.channel_id, () => {
  get_channel_docs()
})
</script>
