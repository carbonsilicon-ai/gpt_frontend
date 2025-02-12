<template>
  <div class="mt-4 w-fit text-sm text-muted-foreground font-medium">
  <!-- Search results frame -->
    <div v-if="process_item(props.item_data?.content).length > 0 || (props.item_data?.answerStatus > 4 && (props.item_data?.intends == 2 || props.item_data?.intends == 5))"
      class="border rounded-lg p-3 bg-muted/50"
    >
      <div class="flex items-center cursor-pointer" @click="show_citation = !show_citation">
        <!-- Loading state -->
        <div v-if="props.item_data?.answerStatus == 5" class="flex items-center">
          <Loader2 class="w-4 h-4 animate-spin" />
          <span class="ml-2">
            {{ props.item_data?.intends == 5 ? '正在检索文档…' : '正在搜索信息…' }}
          </span>
        </div>

        <!-- Processing state -->
        <div v-if="props.item_data?.answerStatus == 6" class="flex items-center">
          <Loader2 class="w-4 h-4 animate-spin" />
          <span class="ml-2">
            第 {{ process_item(props.item_data?.content).length }} 篇资料：{{ process_item(props.item_data?.content)[process_item(props.item_data?.content).length - 1]?.title }}
          </span>
          <ChevronDown v-if="!show_citation" class="w-4 h-4 ml-2" />
          <ChevronUp v-else class="w-4 h-4 ml-2" />
        </div>

        <!-- Results state -->
        <div v-if="props.item_data?.answerStatus == 2 || props.item_data?.answerStatus == 3 || (props.item_data?.answerStatus == 7 && (props.item_data?.intends == 2 || props.item_data?.intends == 5))" 
          class="flex items-center"
        >
          <FileText class="w-4 h-4" />
          <span class="ml-2">找到了 {{ process_item(props.item_data?.content).length }} 篇资料作为参考：</span>
          <ChevronDown v-if="!show_citation" class="w-4 h-4 ml-2" />
          <ChevronUp v-else class="w-4 h-4 ml-2" />
        </div>
      </div>

      <!-- Search results list -->
      <div v-if="process_item(props.item_data?.content).length > 0 && show_citation" class="mt-3 space-y-2">
        <div v-for="(item, index) in process_item(props.item_data?.content)" :key="index"
          class="flex items-center gap-2 text-sm"
        >
          <span class="text-muted-foreground">{{ index + 1 }}. </span>
          <div v-if="item.type && item.type == 1" 
            class="h-auto p-0 text-sm max-w-[480px] truncate text-left cursor-pointer hover:underline text-primary"
            @click="download_pdf(item)"
          >
            {{ item.title }}
          </div>
          <div v-else
            class="h-auto p-0 text-sm max-w-[480px] truncate text-left cursor-pointer hover:underline text-primary"
            @click="openUrl(item.url)"
          >
            {{ item.title }}
          </div>
          <Badge v-if="item.url" variant="secondary">{{ get_domain(item.url) }}</Badge>
          <span v-if="item.published_time" class="text-muted-foreground text-xs">{{ get_time(item.published_time) }}</span>
        </div>
      </div>
    </div>

    <!-- No results warning -->
    <div v-if="judge_search_over(props.item_data?.content) > 1 && process_item(props.item_data?.content).length == 0 && (props.item_data?.answerStatus >= 2) && (props.item_data?.kb_ids?.length > 0) && props.item_data?.content !== '<<<end>>>'"
      class="border rounded-lg p-3 bg-muted/50"
    >
      <div class="flex items-center text-sm text-warning">
        <AlertTriangle class="w-4 h-4" />
        <span class="ml-2">在您提供的知识库/文件中，未找到相关内容。以下回答是根据模型本身能力进行回答的，仅供参考</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, AlertTriangle, Loader2, FileText } from 'lucide-vue-next'

const show_citation = ref(false)

interface ItemData {
  content: string
  answerStatus: number
  intends: number
  kb_ids: string[]
}

const props = defineProps<{
  item_data?: ItemData
}>()

const process_item = (content: string | undefined) => {
  const split_var = '<======>'
  if (!content) {
    return []
  }
  if (content.split(split_var).length > 1) {
    if(content.split(split_var)[1] === '') {
      return []
    }
    const ret = JSON.parse(content.split(split_var)[1]).search_data
    return ret
  }
  return []
}

const download_pdf = (item: any) => {
  const url = window.location.origin + '/pdf_viewer?docId=' + item.docId
  window.open(url, '_blank');
}

const judge_search_over = (content: string | undefined) => {
  const split_var = '<======>'
  if (!content) {
    return 0
  }
  return content.split(split_var).length
}

const get_time = (time: string) => {
  return time.split('T')[0]
}

const get_domain = (url: string) => {
  const domain = url.split('/')[2]
  if (!domain) return ''
  return domain.replace('www.', '').replace('https://', '').replace('http://', '')
}

const openUrl = (url: string) => {
  if (!url) return
  const sanitizedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
  window.open(sanitizedUrl, '_blank', 'noopener,noreferrer')
}
</script>