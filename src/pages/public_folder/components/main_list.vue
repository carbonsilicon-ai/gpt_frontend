<template>
  <div class="container mx-auto px-8 py-6">
    <!-- Header section -->
    <div class="flex flex-col mb-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold">公共文件夹</h1>
      </div>
      <div class="flex justify-between items-center mt-4">
        <div class="border-gray-200 flex space-x-2">
          <Button 
            variant="default" 
            @click="handleAddToKnowledgeBase()"
            :disabled="!selectedFiles.length"
          >
            批量添加到知识库
          </Button>
          <Button 
            variant="default"
            @click="chat_doc_batch()"
            :disabled="!selectedFiles.length"
          >
            批量添加至对话中
          </Button>
        </div>
        <div class="flex space-x-2">
          <!-- <Select defaultValue="title" v-model="search_type" class="w-24">
            <SelectTrigger size="sm" class="w-24">
              <SelectValue placeholder="搜索范围" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">标题</SelectItem>
              <SelectItem value="filename">文件名</SelectItem>
              <SelectItem value="journal">期刊名</SelectItem>
            </SelectContent>
          </Select> -->
          <div class="relative w-64">
            <Input
              type="text"
              placeholder="搜索..."
              class="pl-8"
              size="sm"
              v-model="search_input"
              @keydown.enter.prevent="(e: KeyboardEvent) => {
                if (!e.isComposing) {
                  search_doc()
                }
              }"
            />
            <Search class="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
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
                <TableHead class="w-full">文件标题 / 期刊</TableHead>
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
                    <Checkbox v-model:checked="file.selected" @update:checked="updateSelectedFiles()" />
                  </TableCell>
                  <TableCell class="py-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger class="text-left" style="max-width: calc(100vw - 500px)" >
                          <div class="flex flex-col" @click="download_pdf(file.docId)">
                            <span class="block truncate text-gray-900">{{ file.titles_parsed?.[0] || file.title }}</span>
                            <span class="block truncate text-xs text-gray-500 mt-0.5">{{ file.journal_name }}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent class="bg-white p-3 shadow-lg">
                          <p class="mb-1 font-medium">{{ file.titles_parsed?.[0] || file.title }}</p>
                          <p class="text-sm text-gray-500">{{ file.journal_name }}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell class="py-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge
                            class="text-sm"
                            :variant="file.parseStatus === 2 ? 'secondary' : file.parseStatus === 1 ? 'default' : 'destructive'"
                          >
                            {{ file.parseStatus === 2 ? 'success' : file.parseStatus === 1 ? 'running' : 'failed' }}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent class="bg-white p-3 shadow-lg">
                          <p class="text-sm text-gray-800 mb-2 font-medium">解析进度: {{ file.parse_progress }}%</p>
                          <div v-if="file.progress_texts && file.progress_texts.length">
                            <div v-for="(text, index) in file.progress_texts" :key="index" class="text-sm text-gray-500 mt-1">
                              {{ text }}
                            </div>
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
                            <Button variant="ghost" size="sm" class="hover:bg-gray-100" @click="move_doc(file.docId)">
                              <FolderInput class="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>移动</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" class="hover:bg-gray-100" @click="chat_doc(file.docId)">
                              <Copy class="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>拷贝</TooltipContent>
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

    <!-- Simplified pagination section -->
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

    <!-- Add this Dialog component before closing the template -->
    <Dialog :open="showAddToKBDialog" @update:open="showAddToKBDialog = $event">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加到知识库</DialogTitle>
          <DialogDescription>
            请选择要添加到的目标知识库文件夹
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div class="space-y-2">
            <Label>目标文件夹</Label>
            <Select v-model="targetKBFolder">
              <SelectTrigger>
                <SelectValue placeholder="选择目标文件夹" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem 
                    v-for="folder in store.knowledge_folders" 
                    :key="folder.id"
                    :value="folder.id"
                  >
                    {{ folder.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" @click="showAddToKBDialog = false">取消</Button>
            <Button 
              :disabled="!targetKBFolder || addToKBLoading" 
              @click="confirmAddToKB"
            >
              确定
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get_all_doc_api } from '@/api/common.js'
import { copy_doc_api, get_doc_api, get_doc_in_folder_api, open_knowledge_api } from '@/api/common.js'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, FileText, FolderInput, Filter, Copy } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { useRouter } from 'vue-router'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useStore } from '@/stores/index.js'

const router = useRouter()
const toast = useToast()
const loading = ref(false)
const doc_page = ref(1)
const doc_size = ref(50)
const doc_count = ref(0)
const search_input = ref('')
const show_my_kb = ref(false)
const search_type = ref('title')
const selectedFiles = ref<string[]>([])
const store = useStore()
const showAddToKBDialog = ref(false)
const targetKBFolder = ref('')
const addToKBLoading = ref(false)

interface FileListItem {
  timer: ReturnType<typeof setInterval> | null
  docId: string
  title: string
  titles_parsed: string[]
  journal_name: string
  createTime: string
  parseStatus: number
  parse_progress: number
  progress_texts: string[]
  selected?: boolean
}

const files_list = ref<FileListItem[]>([])

const updateSelectedFiles = () => {
  selectedFiles.value = files_list.value
    .filter(file => file.selected)
    .map(file => file.docId)
}

const clean_files_list = () => {
  files_list.value.forEach(file => {
    if (file.timer) {
      clearInterval(file.timer)
    }
  })
  files_list.value = []
}

const get_all_doc = async () => {
  loading.value = true
  try {
    const param = {
      page: doc_page.value,
      size: doc_size.value,
      search: search_input.value,
      show_my_kb: show_my_kb.value
    }
    
    const res = await get_all_doc_api(param)
    
    if (res.data.success) {
      clean_files_list()
      files_list.value = res.data.data.items.map(item => ({
        ...item,
        selected: false
      }))
      doc_count.value = res.data.data.total
    } else {
      toast.toast({
        variant: "destructive",
        title: "错误",
        description: res.data.message || "获取文档列表失败"
      })
    }
  } catch (err: unknown) {
    if (err.response?.status === 403 || err.response?.data?.message === 'Invalid session key') {
      router.push('/auth/sign-in')
      toast({
        title: "需要登录",
        description: "请先登录后再试",
        variant: "destructive"
      })
      return
    }
    const error = err as Error
    toast.toast({
      title: "错误",
      description: error.message || "获取文档列表失败"
    })
  } finally {
    loading.value = false
  }
}

const search_doc = () => {
  console.log('search_input', search_input.value)
  get_all_doc()
}

const handleAddToKnowledgeBase = () => {
  if (!selectedFiles.value.length) {
    toast.toast({
      title: "请选择文件",
      description: "请先选择要添加的文件",
      variant: "destructive"
    })
    return
  }
  showAddToKBDialog.value = true
}

const download_pdf = (docId: string) => {
  const url = window.location.origin + '/pdf_viewer?docId=' + docId
  window.open(url, '_blank');
}

const changePage = async (page: number) => {
  doc_page.value = page
  await get_all_doc()
}

const confirmAddToKB = async () => {
  if (!targetKBFolder.value) return
  
  addToKBLoading.value = true
  try {
    let res
    if (!current_docId.value) {
      res = await copy_doc_api({
        folder_id: targetKBFolder.value,
        docId: '',
        docIds: selectedFiles.value
      })
    } else {
      res = await copy_doc_api({
        folder_id: targetKBFolder.value,
        docId: current_docId.value,
        docIds: []
      })
    }
    
    if (res.data.success) {
      toast.toast({
        title: "添加成功",
        description: "文件已成功添加到知识库"
      })
      // 重置选择状态
      files_list.value.forEach(file => file.selected = false)
      selectedFiles.value = []
    } else {
      toast.toast({
        title: "添加失败",
        description: res.data.message,
        variant: "destructive"
      })
    }
  } catch (err) {
    toast.toast({
      title: "添加失败",
      description: "操作失败，请重试",
      variant: "destructive"
    })
    console.error(err)
  } finally {
    addToKBLoading.value = false
    showAddToKBDialog.value = false
    targetKBFolder.value = ''
    current_docId.value = ''
  }
}

const current_docId = ref('')
const move_doc = (id: string) => {
  current_docId.value = id
  showAddToKBDialog.value = true
}

const chat_doc = (id: string) => {
  const param = {
    folder_id: '',
    folder_name: 'folder_for_question_channel', 
    docId: id,
    docIds: []
  }
  copy_doc_api(param).then(res => {
    if (res.data.success == true) {
      toast.toast({
        title: "添加成功"
      })
      // 跳转到chat页面
      router.push('/?docIds=' + res.data.data?.docIds)
    }
  })
}

const chat_doc_batch = () => {
  const docIds = selectedFiles.value
  const param = {
    folder_id: '',
    folder_name: 'folder_for_question_channel',
    docId: '',
    docIds: docIds
  }
  copy_doc_api(param).then(res => {
    if (res.data.success == true) {
      toast.toast({
        title: "添加成功"
      })
      // 跳转到chat页面
      router.push('/?docIds=' + res.data.data?.docIds)
    }
  })
}

onMounted(() => {
  get_all_doc()
})
</script>