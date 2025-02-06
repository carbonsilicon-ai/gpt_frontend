<template>
  <Dialog :open="show" @update:open="$emit('update:show', $event)">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>文件上传进度</DialogTitle>
      </DialogHeader>
      <div class="w-full h-2 bg-gray-200 rounded-full mb-4">
        <div 
          class="h-full bg-primary rounded-full transition-all duration-300"
          :style="{width: `${totalProgress}%`}"
        ></div>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div v-for="file in uploadingFiles" :key="file.title" 
          class="p-3 bg-muted rounded-lg"
        >
          <div class="truncate text-sm mb-1">{{ file.title }}</div>
          <div class="text-xs" :class="{
            'text-muted-foreground': file.parseStatus === 1,
            'text-success': file.parseStatus === 2,
            'text-destructive': file.parseStatus === 3
          }">
            {{ file.parseStatus === 1 ? `${file.parseProgress}%` : 
               file.parseStatus === 2 ? '完成' : '失败' }}
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface FileItem {
  title: string
  size: number
  parseStatus: number
  parseProgress: number
  raw?: File
  docId?: string
}

defineProps<{
  show: boolean
  uploadingFiles: FileItem[]
  totalProgress: number
}>()

defineEmits<{
  'update:show': [value: boolean]
}>()
</script> 