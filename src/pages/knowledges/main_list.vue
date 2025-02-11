<template>
  <main_blank v-if="(!store.folder_id) || doc_count == 0" @updateFolder="get_doc_in_folder" />
  <div 
    v-else 
    class="container mx-auto px-8 py-6 min-h-[calc(100vh-120px)]"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
    :class="{'border-2 border-dashed border-gray-300 bg-gray-50': isDragging}"
  >
    <!-- Header section -->
    <div class="flex flex-col mb-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold">{{ store.folder_name || '知识库' }}</h1>
      </div>
      <div class="flex justify-between items-center mt-4">
        <p class="text-sm text-gray-600">共{{ store.folder_file_count }}个文件</p>
        <div class="flex space-x-2">
          <Button variant="outline" size="sm" disabled>
            <Filter class="h-4 w-4" />
          </Button>
          <input
            type="file"
            ref="fileInput"
            multiple
            accept=".pdf"
            class="hidden"
            @change="handleFileUpload"
          />
          <Button size="sm" variant="default" @click="$refs.fileInput.click()">
            <Upload class="mr-2 h-4 w-4" />
            上传文件
          </Button>
        </div>
      </div>
    </div>

    <!-- Table section -->
    <Card class="shadow">
      <CardContent class="p-0">
        <div class="min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow class="bg-accent border-b border-gray-200">
                <TableHead class="w-12 shrink-0"></TableHead>
                <TableHead class="w-full">文件名称 / 期刊</TableHead>
                <TableHead class="w-24 shrink-0">状态</TableHead>
                <TableHead class="w-32 shrink-0">时间</TableHead>
                <TableHead class="w-24 shrink-0"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="loading">
                <TableRow v-for="i in 3" :key="i">
                  <TableCell colspan="5" class="p-4">
                    <div class="space-y-3">
                      <Skeleton class="h-4 w-full" />
                      <Skeleton class="h-4 w-[80%]" />
                    </div>
                  </TableCell>
                </TableRow>
              </template>
              <template v-else>
                <TableRow 
                  v-for="file in files_list" 
                  :key="file.docId"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <TableCell class="py-3">
                    <FileText class="h-5 w-5 text-gray-400" />
                  </TableCell>
                  <TableCell class="py-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger class="text-left" style="max-width: calc(100vw - 800px)" >
                          <div class="flex flex-col" @click="download_pdf(file.docId)">
                            <span class="block truncate text-gray-900">{{ file.title }}</span>
                            <span class="block truncate text-xs text-gray-500 mt-0.5">{{ file.journal_name }}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent class="bg-white p-3 shadow-lg">
                          <p class="mb-1 font-medium">{{ file.title }}</p>
                          <p class="text-sm text-gray-500">{{ file.journal_name }}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell class="py-3 min-w-24">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div v-if="file.parseStatus === 1" class="flex items-center">
                            <span class="text-xs text-gray-500">进度: {{ file.parse_progress }}%</span>
                          </div>
                          <Badge
                            v-else
                            class="text-sm"
                            :variant="file.parseStatus === 2 ? 'secondary' : 'destructive'"
                          >
                            {{ file.parseStatus === 2 ? 'success' : 'failed' }}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent class="bg-white p-3 shadow-lg" v-if="file.progress_texts && file.progress_texts.length">
                          <div v-for="(text, index) in file.progress_texts" :key="index" class="text-sm text-gray-500 mt-1">
                            {{ text }}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell class="py-3 text-gray-500">{{ new Date(file.createTime).toLocaleDateString() }}</TableCell>
                  <TableCell class="py-3">
                    <div class="flex space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              class="hover:bg-gray-100"
                              @click="openMoveDialog(file.docId)"
                            >
                              <FolderInput class="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>移动</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              class="text-destructive hover:bg-red-50"
                              @click="openDeleteDialog(file.docId)"
                            >
                              <Trash2 class="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>删除</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              </template>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <!-- Add pagination -->
    <div v-if="Math.ceil(doc_count / doc_size) > 1" class="flex justify-center mt-6">
      <div class="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          :disabled="doc_page === 1"
          @click="changePage(doc_page - 1)"
        >
          上一页
        </Button>
        <span class="text-sm text-gray-600">
          第 {{ doc_page }} 页 / 共 {{ Math.ceil(doc_count / doc_size) }} 页
        </span>
        <Button 
          variant="outline" 
          size="sm"
          :disabled="doc_page >= Math.ceil(doc_count / doc_size)"
          @click="changePage(doc_page + 1)"
        >
          下一页
        </Button>
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
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <Dialog :open="showMoveDialog" @update:open="showMoveDialog = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>移动文档</DialogTitle>
        <DialogDescription>
          请选择要移动到的目标文件夹
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        <div class="space-y-2">
          <Label>目标文件夹</Label>
          <Select v-model="moveTargetFolder">
            <SelectTrigger>
              <SelectValue placeholder="选择目标文件夹" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem 
                  v-for="folder in store.knowledge_folders" 
                  :key="folder.id"
                  :value="folder.id"
                  :disabled="folder.id === folder_id"
                >
                  {{ folder.name }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showMoveDialog = false">取消</Button>
          <Button 
            :disabled="!moveTargetFolder || moveLoading" 
            @click="confirmMove"
          >
            确定
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>

  <AlertDialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>确认删除</AlertDialogTitle>
        <AlertDialogDescription>
          您确定要删除此文档吗？此操作无法撤销。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="showDeleteDialog = false">取消</AlertDialogCancel>
        <AlertDialogAction @click="confirmDelete">确定</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { get_doc_in_folder_api, upload_knowledge_api, delete_knowledge_api, move_doc_api } from '@/api/common.js'
import { useStore } from '@/stores/index.js'
import { storeToRefs } from 'pinia'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, FolderInput, Trash2, Filter } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast'
import main_blank from '@/pages/knowledges/main_blank.vue'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const store = useStore()
const { folder_id } = storeToRefs(store)
const { toast } = useToast()

const loading = ref(false)
const doc_page = ref(1)
const doc_size = ref(10)
const doc_count = ref(0)
const isDragging = ref(false)
const emits = defineEmits(['updateFolder'])

interface FileListItem {
  timer: ReturnType<typeof setInterval> | null
  docId: string
  title: string
  journal_name: string
  createTime: string
  parseStatus: number  // 0: 未开始, 1: 解析中, 2: 解析完成, 3: 解析失败
  parse_progress: number
  progress_texts: string[]  
}

interface UploadFile {
  raw: File
  title: string
  alias: string
  type: number
  size: number
  parseStatus: number
  parseProgress?: number
}

const files_list = ref<FileListItem[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const showUploadDialog = ref(false)
const uploadProgress = ref(0)
const uploadFiles = ref<UploadFile[]>([])
const showDeleteDialog = ref(false)
const docToDelete = ref<string>('')
const showMoveDialog = ref(false)
const moveTargetFolder = ref('')
const moveLoading = ref(false)
const docToMove = ref('')

const openMoveDialog = (docId: string) => {
  docToMove.value = docId
  showMoveDialog.value = true
}

const download_pdf = (docId: string) => {
  const url = window.location.origin + '/pdf_viewer?docId=' + docId
  window.open(url, '_blank');
}

const confirmMove = async () => {
  if (!moveTargetFolder.value) return
  
  moveLoading.value = true
  try {
    const res = await move_doc_api({
      folder_id: moveTargetFolder.value,
      docId: docToMove.value
    })
    
    if (res.data.success) {
      toast({
        title: "移动成功",
        description: "文档已成功移动"
      })
      get_doc_in_folder()
    } else {
      toast({
        title: "移动失败",
        description: res.data.message,
        variant: "destructive"
      })
    }
  } catch (err) {
    toast({
      title: "移动失败",
      description: "操作失败，请重试",
      variant: "destructive"
    })
    console.error(err)
  } finally {
    moveLoading.value = false
    showMoveDialog.value = false
    docToMove.value = ''
    moveTargetFolder.value = ''
  }
}

const openDeleteDialog = (docId: string) => {
  docToDelete.value = docId
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  try {
    const res = await delete_knowledge_api({ doc_id: docToDelete.value })
    if (res.data.success) {
      toast({
        title: "删除成功",
        description: "文档已成功删除"
      })
      get_doc_in_folder()
    } else {
      toast({
        title: "删除失败",
        description: res.data.message,
        variant: "destructive"
      })
    }
  } catch (err) {
    toast({
      title: "删除失败", 
      description: "操作失败，请重试",
      variant: "destructive"
    })
    console.error(err)
  } finally {
    showDeleteDialog.value = false
    docToDelete.value = ''
  }
}

const clean_files_list = () => {
  doc_size.value = 10
  doc_count.value = 0

  files_list.value.forEach(file => {
    if (file.timer) {
      clearInterval(file.timer)
    }
  })
  files_list.value = []
}

const checkFileSize = (file: File) => {
  const maxSize = 50 * 1024 * 1024 // 50MB
  return file.size <= maxSize
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
      get_doc_in_folder()
      emits('updateFolder')
      
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

interface ApiResponse {
  data: {
    success: boolean
    message?: string
    data?: {
      items: FileListItem[]
      total: number
    }
  }
}

const get_doc_in_folder = async () => {
  loading.value = true
  try {
    const param = {
      page: doc_page.value,
      size: doc_size.value,
      folder_id: folder_id.value
    }
    
    const res = await get_doc_in_folder_api(param) as ApiResponse
    
    if (res.data.success && res.data.data) {
      files_list.value = res.data.data.items
      doc_count.value = res.data.data.total
      store.folder_file_count = doc_count.value
      emits('updateFolder')

      // 检查是否有正在解析的文件
      const hasParsingFiles = files_list.value.some(file => file.parseStatus === 1)
      if (hasParsingFiles) {
        // 启动轮询
        const pollTimer = setInterval(async () => {
          const pollRes = await get_doc_in_folder_api(param) as ApiResponse
          if (pollRes.data.success && pollRes.data.data) {
            files_list.value = pollRes.data.data.items
            // 检查是否还有正在解析的文件
            const stillParsing = pollRes.data.data.items.some(file => file.parseStatus === 1)
            if (!stillParsing) {
              // 如果没有正在解析的文件，停止轮询
              clearInterval(pollTimer)
            }
          }
        }, 2000) // 每2秒轮询一次
      }
    } else {
      toast({
        variant: "destructive",
        title: "错误",
        description: res.data.message || "获取文档列表失败"
      })
    }
  } catch (err: unknown) {
    const error = err as Error
    toast({
      variant: "destructive", 
      title: "错误",
      description: error.message || "获取文档列表失败"
    })
  } finally {
    loading.value = false
  }
}

// watch store.folder_id
watch(folder_id, (newVal) => {
  console.log('newVal', newVal)
  doc_page.value = 1
  get_doc_in_folder()
})

onMounted(() => {
  get_doc_in_folder()
})

const handleDragOver = (e: DragEvent) => {
  isDragging.value = true
  // Only allow file drops
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  if (!e.dataTransfer?.files.length) return
  
  // Process dropped files
  processFiles(Array.from(e.dataTransfer.files))
}

const changePage = async (page: number) => {
  doc_page.value = page
  await get_doc_in_folder()
}
</script>
