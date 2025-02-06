<template>
  <div class="mt-2 w-fit text-sm text-muted-foreground font-medium">
    <div v-if="formattedContent.length > 0"
      class="border rounded-lg p-3 bg-muted/50"
    >
      <div class="flex items-center cursor-pointer" @click="isExpanded = !isExpanded">
        <div class="flex items-center">
          <Brain class="w-4 h-4" />
          <span class="ml-2">{{ thinking_status }}</span>
          <ChevronDown v-if="!isExpanded" class="w-4 h-4 ml-2" />
          <ChevronUp v-else class="w-4 h-4 ml-2" />
        </div>
      </div>

      <div v-show="isExpanded" class="mt-3">
        <div class="text-sm leading-relaxed font-normal">
          {{ formattedContent }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Brain } from 'lucide-vue-next'

interface ItemData {
  content: string
  answerStatus: number
  intends: number
  kb_ids: string[]
}

const props = defineProps<{
  item_data?: ItemData
}>()

const isExpanded = ref(true)

const formattedContent = computed(() => {
  if (props.item_data?.content == null) {
    return ''
  }
  if (props.item_data?.content.indexOf('<thinking>') == -1) {
    return ''
  }
  if (props.item_data?.content.indexOf('<thinking>') !== -1 && props.item_data?.content.indexOf('</thinking>') == -1) {
    return props.item_data?.content.split('<thinking>')[1]
  }
  const ret: string[] = props.item_data?.content.split('</thinking>')[0].split('<thinking>') || []
  if (ret.length === 2) {
    return ret[1]
  }
  return ret[0]
})

const thinking_status = computed(() => {
  return props.item_data?.content.includes('</thinking>') ? '深度思考已完成' : '深度思考中...'
})


</script>
