<template>
  <Tabs v-model="currentTab" class="relative">
    <TabsList class="grid w-full grid-cols-2 w-[120px]">
      <TabsTrigger 
        value="files" 
        class="text-xs px-2"
        @click.stop="show_files = !show_files; show_knowledge = false;"
      >
        <span class="text-xs">文件</span>
      </TabsTrigger>

      <TabsTrigger 
        value="knowledge" 
        class="text-xs px-2"
        @click.stop="show_knowledge = !show_knowledge; show_files = false;"
      >
        <span class="text-xs">知识库</span>
      </TabsTrigger>
    </TabsList>
    
    <!-- Selected items tags -->
    <SelectedItems 
      :selectedFiles="selectedFiles"
      :selectedKbs="selectedKbs"
      @remove-file="removeFile"
      @remove-knowledge="removeKnowledge"
    />

    <div 
      class="relative overflow-hidden rounded-xl border bg-background focus-within:ring-1 focus-within:ring-ring"
      style="box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave" 
      @drop.prevent="handleDrop"
      :class="{ 'drag-over': isDragging }"
    >
      <!-- File uploader component -->
      <FileUploader
        v-if="show_files"
        v-model:files="files"
        v-model:selectedFiles="selectedFiles"
        :selectedKbs="selectedKbs"
        @update:showUploadDialog="showUploadDialog = $event"
        @update:uploadingFiles="uploadingFiles = $event"
      />

      <!-- Knowledge selector component -->
      <KnowledgeSelector
        v-if="show_knowledge"
        v-model:selectedKbs="selectedKbs"
        :selectedFiles="selectedFiles"
        :knowledgeFolders="store.knowledge_folders"
      />
      
      <!-- Message input component -->
      <MessageInput
        ref="message_input_ref"
        v-model:messageText="messageText"
        :isLoading="isLoading"
        :isOnline="isOnline"
        v-model:searchType="searchType"
        v-model:isThinking="isThinking"
        :height="props.height"
        @submit="handleSubmit"
        @stop="handleStop"
        @toggle-network="toggleNetwork"
        @toggle-thinking="toggleThinking"
        @file-upload="handleFileUpload"
        @file-pasted="handlePastedFile"
        @chemical-editor="showChemicalEditor = true"
      />

      <!-- Hidden file input -->
      <input 
        type="file"
        ref="fileInput"
        class="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple
        @change="onFileSelected"
      />

      <!-- Upload progress dialog -->
      <UploadDialog
        v-model:show="showUploadDialog"
        :uploadingFiles="uploadingFiles"
        :totalProgress="totalProgress"
      />
    </div>
  </Tabs>
  <get_channel_docs v-model:files="files" />

  <!-- 化学编辑器 -->
  <Dialog v-model:open="showChemicalEditor">
    <DialogContent class="max-w-[860px]">
      <DialogHeader>
        <DialogTitle>化学编辑器</DialogTitle>
        <DialogDescription>请在化学编辑器中绘制化学结构，点击确定后SMILES将自动填充到输入框中</DialogDescription>
      </DialogHeader>
      <div class="relative">
        <div v-if="isIframeLoading" class="absolute inset-0 flex items-center justify-center bg-background">
          <div class="flex flex-col items-center gap-2">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p class="text-sm text-muted-foreground">加载中...</p>
          </div>
        </div>
        <iframe 
          class="frame" 
          id="idKetcher" 
          src="./static/file/standalone/index.html" 
          width="800" 
          height="500" 
          @load="isIframeLoading = false"
        />
      </div>
      <div class="flex justify-end gap-4 mt-4">
        <button 
          class="px-4 py-2 text-sm rounded-md border hover:bg-gray-100"
          @click="showChemicalEditor = false"
        >
          取消
        </button>
        <button 
          class="px-4 py-2 text-sm text-white bg-primary rounded-md hover:bg-primary/90"
          @click="getsmiles()"
        >
          确定
        </button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { useStore } from '@/stores/index.js'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog'
import { upload_knowledge_api, getimgbase64_api, check_folder_api, create_channel_api, create_gpt_question_api, get_doc_api } from '@/api/common.js'

import FileUploader from './components/FileUploader.vue'
import KnowledgeSelector from './components/KnowledgeSelector.vue'
import MessageInput from './components/MessageInput.vue'
import UploadDialog from './components/UploadDialog.vue'
import SelectedItems from './components/SelectedItems.vue'
import get_channel_docs from './components/get_channel_docs.vue'
import { getCookie } from '@/utils/request.js'
import { init_ketcher_module } from './components/utils.js'

interface FileItem {
  title: string
  size: number
  parseStatus: number
  parse_progress: number
  progress: number
  progress_texts: string[]
  raw?: File
  docId?: string
  timer?: any
  img_base64?: string
  img_id?: string
}

interface KnowledgeBase {
  id: string
  name: string
}

const router = useRouter()
const store = useStore()
const { toast } = useToast()
const emit = defineEmits(['get_questionlist', 'closeSider', 'stop'])
const show_files = ref(false)
const show_knowledge = ref(false)
// State
const files = ref<FileItem[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const messageText = ref('')
const isLoading = ref(false)
const channel_id = ref('')
const docIdList = ref<string[]>([])
const isOnline = ref(true)
const searchType = ref('all')
const selectedKbs = ref<KnowledgeBase[]>([])
const selectedFiles = ref<FileItem[]>([])
const showUploadDialog = ref(false)
const uploadingFiles = ref<FileItem[]>([])
const currentTab = ref('files')
const isThinking = ref(true)
const isDragging = ref(false)
const showChemicalEditor = ref(false)
const isIframeLoading = ref(true)

const totalProgress = computed(() => {
  if (uploadingFiles.value.length === 0) return 0
  const total = uploadingFiles.value.reduce((sum, file) => sum + file.progress, 0)
  return Math.round(total / uploadingFiles.value.length)
})

const toggleNetwork = () => {
  isOnline.value = !isOnline.value
}

const toggleThinking = () => {
  isThinking.value = !isThinking.value
}

const props = defineProps({
  docIds: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  height: {
    type: String,
    default: 'normal'
  }
})

watch(props.docIds, (newVal) => {
  // 获取文件列表
  update_docs(newVal)
})

const update_docs = (docIds: string[], show_files_window: boolean = false) => {
  Promise.all(docIds.map(async (item) => {
    const res = await get_doc_api(item)
    return res.data.data
  })).then(res => {
    files.value = res
    selectedFiles.value = files.value.filter(item => docIds.includes(item.docId))
    if (show_files_window) {
      show_files.value = true
    }
  })
}

if (props.docIds.length > 0) {
  update_docs(props.docIds, true)
}

// 监听标签变化
watch(currentTab, (newValue) => {
  if (newValue === 'files') {
    show_files.value = true
    show_knowledge.value = false
  } else if (newValue === 'knowledge') {
    show_knowledge.value = true
    show_files.value = false
  }
})

// File upload handlers
const handleFileUpload = () => {
  fileInput.value?.click()
}

const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files) return
  
  const newFiles = Array.from(target.files)
  handleFiles(newFiles)
  target.value = '' // Reset input
}

const handleFiles = async (newFiles: File[]) => {
  // Validate files
  if (newFiles.length > 6) {
    toast({
      title: "上传失败",
      description: "多文档问答的上限是6篇，如需处理更多文档，请创建知识库后再提问",
      variant: "destructive"
    })
    return
  }

  // Show upload dialog
  showUploadDialog.value = true
  uploadingFiles.value = []

  const validFiles: File[] = []
  const formData = new FormData()

  // Validate all files first
  for (const file of newFiles) {
    // Check file type
    if (!['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast({
        title: "上传失败",
        description: "仅支持PDF、JPEG、JPG、PNG文件格式",
        variant: "destructive"
      })
      continue
    }

    // Check file size (150MB limit)
    if (file.size > 150 * 1024 * 1024) {
      toast({
        title: "上传失败", 
        description: "文件大小不能超过150MB",
        variant: "destructive"
      })
      continue
    }

    // Check duplicate filename
    if (files.value.some(f => f.title === file.name)) {
      toast({
        title: "上传失败",
        description: "文件名重复，请重新上传",
        variant: "destructive"
      })
      continue
    }

    validFiles.push(file)
    formData.append('files', file)

    // Add file to uploadingFiles list
    const fileItem = {
      title: file.name,
      size: file.size,
      parseStatus: 1,
      parseProgress: 0,
      progress: 0,
      progress_texts: [],
      raw: file
    }
    uploadingFiles.value.push(fileItem)
    files.value.unshift(fileItem)
  }

  if (validFiles.length === 0) {
    showUploadDialog.value = false
    return
  }

  // Upload all valid files together
  formData.append('folder_id', 'folder_for_question_channel')

  try {
    const response = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      // 监听上传进度
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          // 更新所有正在上传文件的进度
          validFiles.forEach(file => {
            const fileItem = uploadingFiles.value.find(f => f.title === file.name)
            if (fileItem) {
              fileItem.progress = Math.round(progress)
            }
          })
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } else {
          reject(new Error('Upload failed'))
        }
      }

      xhr.onerror = () => reject(new Error('Upload failed'))

      xhr.open('POST', '/api/v1/knowledge_base/upload?folder_id=folder_for_question_channel')  // 请替换为实际的上传 API 地址
      // xhr.setRequestHeader('Authorization', `Bearer ${store.token}`)  // 如果需要认证
      xhr.setRequestHeader('X-CSRF-TOKEN', getCookie('csrf_access_token'))
      xhr.send(formData)
    })

    show_files.value = true
    show_knowledge.value = false
    const name_id = response.data.name_id
    // Update status for all files
    for (const file of validFiles) {
      const docId = name_id.find((item: any) => item.name === file.name)?.docId
      const fileItem = files.value.find(f => f.title === file.name)
      const uploadingFileItem = uploadingFiles.value.find(f => f.title === file.name)
      if (fileItem) {
        fileItem.parseStatus = 1
        fileItem.parse_progress = 0
        fileItem.progress_texts = []
        fileItem.docId = docId
      }
      if (uploadingFileItem) {
        uploadingFileItem.parseStatus = 1
        uploadingFileItem.parse_progress = 0
        uploadingFileItem.progress_texts = []
        uploadingFileItem.docId = docId
      }
    }
    watch_status(name_id)
    showUploadDialog.value = false
    // 自动勾选上
    if (selectedKbs.value.length === 0) {
      // selectedFiles.value = 当前上传的files
      selectedFiles.value = uploadingFiles.value
    }
  } catch (error:any) {
    console.log(error)
    if (error.response?.status === 403 || error.response?.data?.message === 'Invalid session key') {
      router.push('/auth/sign-in')
      toast({
        title: "需要登录",
        description: "请先登录后再试",
        variant: "destructive"
      })
      return
    }
    // Mark all files as failed
    for (const file of validFiles) {
      const fileItem = files.value.find(f => f.title === file.name)
      const uploadingFileItem = uploadingFiles.value.find(f => f.title === file.name)
      if (fileItem) {
        fileItem.parseStatus = 3
      }
      if (uploadingFileItem) {
        uploadingFileItem.parseStatus = 3
      }
    }
    toast({
      title: "上传失败",
      description: "文件上传过程中发生错误",
      variant: "destructive"
    })
  }

  // Auto close dialog if all files uploaded successfully
  if (uploadingFiles.value.every(f => f.parseStatus === 2)) {
    setTimeout(() => {
      showUploadDialog.value = false
    }, 1000)
  }
}

const watch_status = (datalist:any) => {
  for (let i = 0; i < datalist.length; i++ ) {
    const docId = datalist[i].docId
    const name = datalist[i].name
    const item = files.value.find(item => item.title === name)
    item.docId = docId
    // 启动状态查询 setinterval
    item.timer = setInterval(() => {
      get_doc_api(docId).then((doc_res:any) => {
        const it = files.value.find(item => item.docId === docId)
        it.parseStatus = doc_res.data.data.parseStatus
        it.progress_texts = doc_res.data.data.progress_texts
        it.parse_progress = doc_res.data.data.parse_progress
        if (doc_res.data.data?.img_id) {
          it.img_id = doc_res.data.data.img_id
        }
        if (doc_res.data.data.parseStatus != 1) {
          clearInterval(it.timer)
          it.timer =null
        }
      })
    }, 1000)
  }
}

const removeFile = (file: FileItem) => {
  const index = selectedFiles.value.findIndex(f => f.title === file.title)
  if (index > -1) {
    selectedFiles.value.splice(index, 1)
  }
}

const handleStop = () => {
  emit('stop')
}

const createChannelIfNeeded = async () => {
  const param = {
    name: messageText.value.slice(0, 50)
  }

  try {
    const res = await create_channel_api(param)
    if (res.data.success) {
      channel_id.value = res.data.data.id
      return true
    } else {
      toast({
        title: "创建频道失败",
        description: res.data.message,
        variant: "destructive"
      })
      return false
    }
  } catch (err: any) {
    if (err.response?.status === 403 || err.response?.data?.message === 'Invalid session key') {
      router.push('/auth/sign-in')
      toast({
        title: "需要登录",
        description: "请先登录后再试",
        variant: "destructive" 
      })
    } else {
      toast({
        title: "创建频道失败",
        description: "请稍后重试",
        variant: "destructive"
      })
    }
    return false
  }
}

const sendQuestion = async () => {
  if (!messageText.value.trim()) return

  // Check if login needed
  if (store.need_login) {
    router.push('/auth/sign-in')
    return
  }

  // Get selected doc IDs
  docIdList.value = selectedFiles.value
        .filter(file => file.parseStatus === 2)
        .map(file => file.docId)
        .filter((id): id is string => id !== undefined)

  try {
    // Create question params
    const questionParams = {
      question: messageText.value,
      channel_id: channel_id.value || store.channel_id,
      docIdList: docIdList.value || store.docIdList,
      user_id: store.user_id,
      docIdListKnowledge: [], // TODO: Add knowledge doc IDs if needed
      knowledgeCSAIDefault: false,
      client: 0, // TODO: Add LLM selection if needed
      kb_ids: selectedKbs.value.map(kb => kb.id),
      if_search_online: isOnline.value,
      search_type: searchType.value, // 'all'：全网搜索，'academic'：学术搜索
      if_thinking: isThinking.value
    }

    // Send question API request
    const res = await create_gpt_question_api(questionParams)

    if (res.data.success) {
      // Store channel info in global store
      store.docIdList = docIdList.value
      store.selectedKbs = selectedKbs.value
      store.isOnline = isOnline.value
      store.searchType = searchType.value
      store.question = messageText.value
      store.isThinking = isThinking.value

      // Clear state
      messageText.value = ''
      docIdList.value = []
    } else {
      toast({
        title: "发送失败",
        description: res.data.message,
        variant: "destructive"
      })
    }

  } catch (err: any) {
    if (err.response?.status === 403 || err.response?.data?.message === 'Invalid session key') {
      router.push('/auth/sign-in')
      toast({
        title: "需要登录",
        description: "请先登录后再试",
        variant: "destructive" 
      })
    } else {
      toast({
        title: "发送失败", 
        description: "请稍后重试",
        variant: "destructive"
      })
    }
    throw err
  }
}

const check_knowledge = async () => {
  const params = {'folder_ids': []}
  for (let i = 0; i < selectedKbs.value.length; i++) {
    params.folder_ids.push(selectedKbs.value[i].id)
  }
  try {
    const res = await check_folder_api(params)
    if (res.data.success) {
      return true
    } else {
      return false
    }
  } catch (err) {
    return false
  }
}

const handleSubmit = async () => {
  if (!messageText.value.trim()) return
  
  isLoading.value = true
  
  try {
    // Check file upload status
    // 如果parseStatus为1，则不发送
    if (selectedFiles.value.some(file => file.parseStatus === 1)) {
      toast({
        title: "无法发送",
        description: "文件正在解析中，请等待上传完成",
        variant: "destructive"
      })
      return
    }

    // 检查知识库是否都解析完成
    const knowledge_parsed = await check_knowledge()
    if (!knowledge_parsed) {
      toast({
        title: "无法发送",
        description: "知识库解析中，请等待解析完成",
        variant: "destructive"
      })
      return
    }

    // Create channel if needed
    if (router.currentRoute.value.path !== '/channels') {
      const channelCreated = await createChannelIfNeeded()
      if (!channelCreated) {
        isLoading.value = false
        return
      }
    }
    // 关闭file和knowledge
    show_files.value = false
    show_knowledge.value = false

    // Send question
    await sendQuestion()
    
    // Clear input
    messageText.value = ''
    message_input_ref.value.messageInput = ''
    // 判断当前route是否是/channels
    if (router.currentRoute.value.path !== '/channels') {
      router.push(
        '/channels?channel_id=' + channel_id.value + 
        '&closeSider=true'
      )
    } else {
      // 关闭侧边栏
      emit('closeSider')
    }
    
  } catch (error) {
    console.error('handleSubmit error', error)
    toast({
      title: "发送失败",
      description: "请稍后重试",
      variant: "destructive"
    })
  } finally {
    isLoading.value = false
    // 发送事件，通知父组件获取问题列表
    emit('get_questionlist')
  }
}

const checkFilesStatus = () => {
  const uploading = files.value.some(f => f.parseStatus === 1)

  if (uploading) {
    toast({
      title: "无法发送",
      description: "文件正在解析，请等待解析完成",
      variant: "destructive"
    })
    return false
  }
  
  return true
}

const removeKnowledge = (knowledge: KnowledgeBase) => {
  const index = selectedKbs.value.findIndex(kb => kb.id === knowledge.id)
  if (index > -1) {
    selectedKbs.value.splice(index, 1)
  }
}

const open_isLoading = () => {
  isLoading.value = true
}

const message_input_ref = ref(null)

const recover_params = (params: any) => {
  update_docs(store.docIdList)
  selectedKbs.value = store.selectedKbs
  searchType.value = store.searchType
  isThinking.value = store.isThinking
  message_input_ref.value.searchTypeOwn = store.searchType
  isOnline.value = store.isOnline
}

const ask_question = (question: string) => {
  messageText.value = question
  handleSubmit()
}

const show_question = (question: string) => {
  messageText.value = question
  message_input_ref.value.messageInput = question
}

const close_isLoading = () => {
  isLoading.value = false
}

const clear_state = () => {
  files.value = []
  selectedFiles.value = []
  selectedKbs.value = []
  docIdList.value = []
  messageText.value = ''
  isLoading.value = false
  isOnline.value = true
  isThinking.value = true
  searchType.value = 'all'
  store.docIdList = []
  store.selectedKbs = []
  store.searchType = 'all'
  store.isOnline = true
  store.isThinking = true
  store.question = ''
}

const getsmiles = async() => {
  await init_ketcher_module('idKetcher')
  console.log('ketcher', window.ketcher)
  window.ketcher.getSmiles()
    .then((res:String) => {
      console.log('ketcher', res)
      messageText.value = res
      message_input_ref.value.messageInput = res
      showChemicalEditor.value = false
    })
    .catch(e => {
      console.log('ketcher error', e)
      toast({
        title: "获取SMILES失败",
        description: "获取SMILES失败" + e,
        variant: "destructive"
      })
    })
}

defineExpose({
  open_isLoading,
  close_isLoading,
  recover_params,
  clear_state,
  ask_question,
  show_question
})

// Add drag event handlers
const handleDragOver = (e: DragEvent) => {
  isDragging.value = true
  e.dataTransfer!.dropEffect = 'copy'
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const droppedFiles = Array.from(e.dataTransfer?.files || [])
  handleFiles(droppedFiles)
}

// Add this function before component is unmounted
onBeforeUnmount(() => {
  // Clear all active timers
  files.value.forEach(file => {
    if (file.timer) {
      clearInterval(file.timer)
      file.timer = null
    }
  })
})

const handlePastedFile = (file: File) => {
  handleFiles([file])
}

</script>

<style lang="scss">
.drag-over {
  @apply border-2 border-dashed border-primary bg-primary/5;
}
</style>
