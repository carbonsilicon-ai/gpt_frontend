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

    <div class="shadow relative overflow-hidden rounded-xl border bg-background focus-within:ring-1 focus-within:ring-ring">
      <!-- File uploader component -->
      <FileUploader
        v-if="show_files"
        v-model:files="files"
        v-model:selectedFiles="selectedFiles"
        @update:showUploadDialog="showUploadDialog = $event"
        @update:uploadingFiles="uploadingFiles = $event"
      />

      <!-- Knowledge selector component -->
      <KnowledgeSelector
        v-if="show_knowledge"
        v-model:selectedKbs="selectedKbs"
        :knowledgeFolders="store.knowledge_folders"
      />
      
      <!-- Message input component -->
      <MessageInput
        v-model:messageText="messageText"
        :isLoading="isLoading"
        :isOnline="isOnline"
        v-model:searchType="searchType"
        @submit="handleSubmit"
        @stop="handleStop"
        @toggle-network="toggleNetwork"
        @file-upload="handleFileUpload"
      />

      <!-- Hidden file input -->
      <input 
        type="file"
        ref="fileInput"
        class="hidden"
        accept=".pdf"
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
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { useStore } from '@/stores/index.js'
import { upload_knowledge_api, create_channel_api, create_gpt_question_api, get_doc_api } from '@/api/common.js'

import FileUploader from './components/FileUploader.vue'
import KnowledgeSelector from './components/KnowledgeSelector.vue'
import MessageInput from './components/MessageInput.vue'
import UploadDialog from './components/UploadDialog.vue'
import SelectedItems from './components/SelectedItems.vue'
import get_channel_docs from './components/get_channel_docs.vue'
interface FileItem {
  title: string
  size: number
  parseStatus: number
  parseProgress: number
  raw?: File
  docId?: string
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

const totalProgress = computed(() => {
  if (uploadingFiles.value.length === 0) return 0
  const total = uploadingFiles.value.reduce((sum, file) => sum + file.parseProgress, 0)
  return Math.round(total / uploadingFiles.value.length)
})

const toggleNetwork = () => {
  isOnline.value = !isOnline.value
}

const props = defineProps({
  docIds: {
    type: Array as PropType<string[]>,
    default: () => []
  }
})

watch(props.docIds, (newVal) => {
  // 获取文件列表
  update_docs(newVal)
})

const update_docs = (docIds: string[]) => {
  Promise.all(docIds.map(async (item) => {
    const res = await get_doc_api(item)
    return res.data.data
  })).then(res => {
    files.value = res
    selectedFiles.value = files.value.filter(item => docIds.includes(item.docId))
  })
}

if (props.docIds.length > 0) {
  update_docs(props.docIds)
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
    if (file.type !== 'application/pdf') {
      toast({
        title: "上传失败",
        description: "仅支持PDF文件格式",
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
      raw: file
    }
    uploadingFiles.value.push(fileItem)
    files.value.push(fileItem)
  }

  if (validFiles.length === 0) {
    showUploadDialog.value = false
    return
  }

  // Upload all valid files together
  formData.append('folder_id', 'folder_for_question_channel')

  try {
    const res = await upload_knowledge_api(formData)
    
    if (res.data.success) {
      const name_id = res.data.data.name_id
      // Update status for all files
      for (const file of validFiles) {
        const docId = name_id.find((item: any) => item.name === file.name)?.docId
        const fileItem = files.value.find(f => f.title === file.name)
        const uploadingFileItem = uploadingFiles.value.find(f => f.title === file.name)
        if (fileItem) {
          fileItem.parseStatus = 2
          fileItem.parseProgress = 100
          fileItem.docId = docId
        }
        if (uploadingFileItem) {
          uploadingFileItem.parseStatus = 2
          uploadingFileItem.parseProgress = 100
          uploadingFileItem.docId = docId
        }
      }
    } else {

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
        description: res.data.message,
        variant: "destructive"
      })
    }
  } catch (error) {
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
      search_type: searchType.value // 'all'：全网搜索，'academic'：学术搜索
    }

    // Send question API request
    const res = await create_gpt_question_api(questionParams)

    if (res.data.success) {
      // Store channel info in global store
      store.docIdList = docIdList.value
      store.question = messageText.value

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

const handleSubmit = async () => {
  if (!messageText.value.trim()) return
  
  isLoading.value = true
  
  try {
    // Check file upload status
    const filesReady = checkFilesStatus()
    if (!filesReady) {
      isLoading.value = false
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
    // 判断当前route是否是/channels
    if (router.currentRoute.value.path !== '/channels') {
      router.push('/channels?channel_id=' + channel_id.value + '&closeSider=true')
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
  const failed = files.value.some(f => f.parseStatus === 3)
  
  if (uploading) {
    toast({
      title: "无法发送",
      description: "文件正在上传中，请等待上传完成",
      variant: "destructive"
    })
    return false
  }
  
  if (failed) {
    toast({
      title: "无法发送", 
      description: "部分文件上传失败，请重新上传",
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

const close_isLoading = () => {
  isLoading.value = false
}

defineExpose({
  open_isLoading,
  close_isLoading
})

</script>

<style lang="scss">
.drag-over {
  @apply border-2 border-dashed border-primary bg-primary/5;
}
</style>
