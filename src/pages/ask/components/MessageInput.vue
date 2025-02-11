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
      <Button
        variant="ghost"
        size="sm"
        :class="{'bg-blue-100': isOnline, 'bg-gray-100': !isOnline}"
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
        <TooltipProvider>
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
            <TooltipContent side="top">
              支持拖拽上传PDF文件
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
import { Paperclip, CornerDownLeft, Wifi, WifiOff, X } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const props = defineProps<{
  messageText: string
  isLoading: boolean
  isOnline: boolean
  searchType: string
  height: string
}>()

const emit = defineEmits<{
  'update:messageText': [value: string]
  'update:searchType': [value: string]
  'toggle-network': []
  'file-upload': []
  'submit': []
  'stop': []
}>()

const messageInput = ref('')
const isComposing = ref(false)
const searchTypeOwn = ref('all')

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey && !isComposing.value && !e.ctrlKey) {
    e.preventDefault()
    emit('update:searchType', searchTypeOwn.value)
    emit('update:messageText', messageInput.value)
    messageInput.value = ''
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
    messageInput.value = ''
    emit('submit')
  }
}

const handlePaste = (e: ClipboardEvent) => {
  const text = e.clipboardData?.getData('text/plain') || ''
  const cleanedText = text.replace(/<[^>]*>?/gm, '')
  const target = e.target as HTMLTextAreaElement
  const start = target.selectionStart
  const end = target.selectionEnd
  const newValue = props.messageText.substring(0, start) + cleanedText + props.messageText.substring(end)
  emit('update:messageText', newValue)
}

defineExpose({
  searchTypeOwn
})
</script> 
