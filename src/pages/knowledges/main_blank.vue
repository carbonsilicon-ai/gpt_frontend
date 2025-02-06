<template>
  <div class="h-full flex flex-col items-center justify-center relative group" 
    @dragenter.prevent="isDragging = true"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleFileDrop"
  >
    <!-- Drag overlay -->
    <div v-show="isDragging" 
      class="absolute inset-4 border-2 border-dashed border-primary/50 rounded-lg bg-primary/5 flex items-center justify-center"
    >
      <p class="text-lg text-primary/70">释放文件以上传</p>
    </div>

    <div class="max-w-lg text-center space-y-8">
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight text-gray-800">当前知识库为空</h1>
        <p class="text-muted-foreground text-sm">上传您的第一份研究资料，开启智能研究助手之旅</p>
      </div>

      <div class="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
        <div class="flex justify-center">
          <input
            type="file"
            ref="fileInput"
            multiple
            accept=".pdf"
            class="hidden"
            @change="handleFileUpload"
          />
          <Button size="lg" class="relative mb-8" @click="$refs.fileInput.click()">
            <Upload class="mr-2 h-4 w-4" />
            上传资料
          </Button>
        </div>

        <p class="text-sm text-muted-foreground mb-4">上传资料后即可享受以下功能：</p>
        
        <div class="flex flex-col md:flex-row w-full items-center justify-center gap-4">
          <Card class="w-full h-[170px]">
            <CardHeader>
              <Brain class="h-8 w-8 mb-2 text-purple-500" />
              <CardTitle class="text-gray-700 text-lg">智能学习</CardTitle>
              <CardDescription class="text-gray-500">
                通过学习您提供的资料来提升自己
              </CardDescription>
            </CardHeader>
          </Card>

          <Card class="w-full h-[170px]">
            <CardHeader>
              <MessagesSquare class="h-8 w-8 mb-2 text-emerald-500" />
              <CardTitle class="text-gray-700 text-lg">深度讨论</CardTitle>
              <CardDescription class="text-gray-500">
                针对专业资料进行深入对话交流
              </CardDescription>
            </CardHeader>
          </Card>

          <Card class="w-full h-[170px]">
            <CardHeader>
              <ShieldCheck class="h-8 w-8 mb-2 text-amber-500" />
              <CardTitle class="text-gray-700 text-lg">隐私保护</CardTitle>
              <CardDescription class="text-gray-500">
                所有资料均为个人专属，他人无权访问
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  </div>

  <Dialog :open="showUploadDialog" @update:open="showUploadDialog = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>上传文件</DialogTitle>
        <DialogDescription>
          正在上传您的文件，请稍候...
        </DialogDescription>
      </DialogHeader>
      <Progress v-model="uploadProgress" />
      <div class="space-y-2">
        <div v-for="file in uploadFiles" :key="file.title" class="flex items-center justify-between">
          <span class="text-sm truncate">{{ file.title }}</span>
          <span class="text-sm text-muted-foreground">
          </span>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Upload } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Brain, MessagesSquare, ShieldCheck } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/toast'
import { upload_knowledge_api } from '@/api/common.js'
import { useStore } from '@/stores/index.js'
interface UploadFile {
  raw: File
  title: string
  alias: string
  type: number
  size: number
  parseStatus: number
  parseProgress?: number
}

const store = useStore()
const emit = defineEmits(['updateFolder'])
const { toast } = useToast()
const fileInput = ref<HTMLInputElement | null>(null)
const showUploadDialog = ref(false)
const uploadProgress = ref(0)
const uploadFiles = ref<UploadFile[]>([])
const isDragging = ref(false)

const checkFileSize = (file: File) => {
  const maxSize = 50 * 1024 * 1024 // 50MB
  return file.size <= maxSize
}

const getUploadStatus = (status: number) => {
  switch (status) {
    case -3: return '文件已存在'
    case -2: return '上传失败'
    case -1: return '上传中'
    case 1: return '上传成功'
    default: return '未知状态'
  }
}

const handleFileDrop = (e: DragEvent) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (!files?.length) return

  // Check if all files are PDFs
  const hasInvalidFiles = Array.from(files).some(file => file.type !== 'application/pdf')
  if (hasInvalidFiles) {
    toast({
      title: "上传失败",
      description: "仅支持PDF文件格式",
      variant: "destructive"
    })
    return
  }

  processFiles(Array.from(files))
}

const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files?.length) return
  processFiles(Array.from(files))
  target.value = ''
}

const processFiles = async (files: File[]) => {
  // 检查文件数量上限
  if (files.length > 50) {
    toast({
      title: "上传失败",
      description: "单个知识库文件上限为50篇",
      variant: "destructive"
    })
    return
  }

  // 检查文件类型和大小
  for (const file of files) {
    if (file.type !== 'application/pdf') {
      toast({
        title: "上传失败",
        description: "仅支持PDF文件格式",
        variant: "destructive"
      })
      return
    }

    if (!checkFileSize(file)) {
      toast({
        title: "上传失败",
        description: "文件大小不能超过50MB",
        variant: "destructive"
      })
      return
    }
  }

  showUploadDialog.value = true
  uploadProgress.value = 0
  uploadFiles.value = []

  const formData = new FormData()
  for (const file of files) {
    uploadFiles.value.push({
      raw: file,
      title: file.name,
      alias: file.name,
      type: 1,
      size: file.size,
      parseStatus: -1,
      parseProgress: 0
    })
    formData.append('files', file)
  }

  formData.append('folder_id', store.folder_id)
  formData.append('parse_type', '1')

  try {
    const res = await upload_knowledge_api(formData, {
      onUploadProgress: (progressEvent: ProgressEvent) => {
        uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      }
    })

    if (res.data.success) {
      emit('updateFolder')
      
      // 处理已存在的文件
      for (const existFile of res.data.data.file_exists) {
        const file = uploadFiles.value.find(f => f.title === existFile.name)
        if (file) file.parseStatus = -3
      }

      if (res.data.data.file_exists.length > 0) {
        if (res.data.data.file_exists.length === files.length) {
          toast({
            title: "上传失败",
            description: "所有文件已存在",
            variant: "destructive"
          })
        } else {
          toast({
            title: "部分上传成功",
            description: "部分文件已存在",
            variant: "warning"
          })
        }
      } else {
        toast({
          title: "上传成功",
          description: "文件已成功上传"
        })
        showUploadDialog.value = false
      }
    } else {
      // 标记所有文件为失败
      uploadFiles.value.forEach(file => file.parseStatus = -2)
      toast({
        title: "上传失败",
        description: res.data.message,
        variant: "destructive"
      })
    }
  } catch (err) {
    uploadFiles.value.forEach(file => file.parseStatus = -2)
    toast({
      title: "上传失败",
      description: "网络错误，请重试",
      variant: "destructive"
    })
    console.error(err)
  }
}

const handleDragLeave = (e: DragEvent) => {
  // 确保只有当鼠标真正离开容器时才重置状态
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const x = e.clientX
  const y = e.clientY
  
  if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
    isDragging.value = false
  }
}
</script>
