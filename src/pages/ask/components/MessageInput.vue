<template>
  <div>
    <Label for="message" class="sr-only">Message</Label>
    <Textarea
      id="message"
      v-model="messageInput"
      @compositionstart="isComposing = true"
      @compositionend="isComposing = false"
      placeholder="输入您的问题..."
      class="resize-none border-0 p-3 shadow-none focus-visible:ring-0"
      :class="{'min-h-[100px]': props.height === 'high', 'min-h-12': props.height === 'normal'}"
      @keydown="handleKeyDown"
      @paste="handlePaste"
      :disabled="isLoading"
    />
    <div class="flex items-center p-3 pt-0">
      <TooltipProvider :delay-duration="300">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="sm"
              class="mr-2 gap-1.5"
              :class="{'bg-blue-100': isThinking, 'hover:bg-blue-100': isThinking, 'bg-gray-100': !isThinking, 'hover:bg-gray-100': !isThinking}"
              @click="$emit('toggle-thinking')"
            >
              <Brain class="size-4" />
              深度思考
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            打开深度思考功能会调用DeepSeek R1模型推理解决问题
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button
        variant="ghost"
        size="sm"
        :class="{'bg-blue-100': isOnline, 'hover:bg-blue-100': isOnline, 'bg-gray-100': !isOnline, 'hover:bg-gray-100': !isOnline}"
        @click="$emit('toggle-network')"
        class="mr-2 gap-1.5"
      >
        <Wifi v-if="isOnline" class="size-4" />
        <WifiOff v-else class="size-4" />
        {{ isOnline ? '自动联网' : '断网' }}
      </Button>

      <Select v-if="isOnline" v-model="searchTypeOwn">
        <SelectTrigger class="w-18 h-8">
          <SelectValue placeholder="搜索范围" class="text-xs" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem class="text-xs" value="all">全网</SelectItem>
          <SelectItem class="text-xs" value="academic">学术</SelectItem>
        </SelectContent>
      </Select>

      <div class="flex items-center gap-2 ml-auto">
        <!-- 增加化学编辑器的按钮，点击后打开化学编辑器 -->
        <TooltipProvider :delay-duration="100" v-if="!if_ldap">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button 
                variant="outline" 
                size="sm" 
                @click="$emit('chemical-editor')" 
                class="gap-1.5"
              >
                <Atom class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              化学编辑器
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider :delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button 
                variant="outline" 
                size="sm" 
                @click="$emit('file-upload')" 
                class="gap-1.5"
                :disabled="isLoading"
              >
                <Paperclip class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              支持拖拽上传PDF,图片文件
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button 
          type="submit" 
          size="sm" 
          class="gap-1.5"
          :variant="isLoading ? 'destructive' : 'default'"
          @click="handleButtonClick"
        >
          <span v-if="isLoading">停止</span>
          <span v-else>发送</span>
          <CornerDownLeft v-if="!isLoading" class="size-3.5" />
          <X v-else class="size-3.5" />
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Paperclip, CornerDownLeft, Wifi, WifiOff, X, Brain, Atom } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const props = defineProps<{
  messageText: string
  isLoading: boolean
  isOnline: boolean
  isThinking: boolean
  searchType: string
  height: string
}>()

const emit = defineEmits<{
  'update:messageText': [value: string]
  'update:searchType': [value: string]
  'toggle-network': []
  'toggle-thinking': []
  'file-upload': []
  'submit': []
  'stop': []
  'chemical-editor': []
  'file-pasted': [file: File]
}>()

const if_ldap = ref(false)
if (import.meta.env.VITE_APP_ENV === 'ldap') {
  if_ldap.value = true
}

const messageInput = ref('')
const isComposing = ref(false)
const searchTypeOwn = ref('all')

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey && !isComposing.value && !e.ctrlKey) {
    e.preventDefault()
    emit('update:searchType', searchTypeOwn.value)
    emit('update:messageText', messageInput.value)
    // messageInput.value = ''
    emit('submit')
  } else if (e.key === 'Enter' && e.ctrlKey) {
    e.preventDefault()
    messageInput.value += '\n\n'
  }
}

const handleButtonClick = () => {
  if (props.isLoading) {
    emit('stop')
  } else {
    emit('update:searchType', searchTypeOwn.value)
    emit('update:messageText', messageInput.value)
    // messageInput.value = ''
    emit('submit')
  }
}

const handlePaste = (e: ClipboardEvent) => {
  // Check if clipboard has images
  if (e.clipboardData?.items) {
    for (const item of Array.from(e.clipboardData.items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          // Emit event to parent component to handle the image
          emit('file-pasted', file)
          return
        }
      }
    }
  }

  // Handle text paste as before
  const text = e.clipboardData?.getData('text/plain') || ''
  const cleanedText = text.replace(/<[^>]*>?/gm, '')
  const target = e.target as HTMLTextAreaElement
  const start = target.selectionStart
  const end = target.selectionEnd
  const newValue = props.messageText.substring(0, start) + cleanedText + props.messageText.substring(end)
  emit('update:messageText', newValue)
}

defineExpose({
  searchTypeOwn,
  messageInput
})
</script> 
