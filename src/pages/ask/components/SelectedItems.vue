<template>
  <div class="flex flex-wrap gap-2 p-2 absolute top-0 left-32">
    <div v-for="file in selectedFiles" :key="file.title" 
      class="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-md text-xs"
    >
      <span class="truncate max-w-[70px]">{{ file.title }}</span>
      <Button
        variant="ghost"
        size="icon"
        class="size-4 p-0"
        @click="$emit('remove-file', file)"
      >
        <X class="size-3" />
      </Button>
    </div>

    <div v-for="knowledge in selectedKbs" :key="knowledge.id"
      class="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-md text-xs"
    >
      <span class="truncate max-w-[200px]">{{ knowledge.name }}</span>
      <Button
        variant="ghost" 
        size="icon"
        class="size-4 p-0"
        @click="$emit('remove-knowledge', knowledge)"
      >
        <X class="size-3" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { X } from 'lucide-vue-next'

interface FileItem {
  title: string
  size: number
  parseStatus: number
  parse_progress: number
  progress_texts: string[]
  raw?: File
  docId?: string
  timer?: any
}

interface KnowledgeBase {
  id: string
  name: string
}

const props = defineProps<{
  selectedFiles: FileItem[]
  selectedKbs: KnowledgeBase[]
}>()

defineEmits<{
  'remove-file': [file: FileItem]
  'remove-knowledge': [knowledge: KnowledgeBase]
}>()

</script> 