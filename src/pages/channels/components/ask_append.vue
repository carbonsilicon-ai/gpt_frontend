<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap gap-2 justify-end -ml-[3px] -mr-[3px]">
      <div 
        v-for="item in files_list.slice(0, doc_num)" 
        :key="item"
        class="w-[32%] px-1 cursor-pointer"
        @click="item.data.type == 4 ? open_url(item) : download_pdf(item)"
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger class="w-full">
              <div class="border rounded-md flex items-center gap-2 p-2 rounded-md bg-background hover:bg-accent">
                
                <img v-if="item.data.type === 1 || item.data.title.split('.').pop() === 'pdf'" src="@/assets/imgs/pdf_large.png" alt="file" class="w-5 h-6" />
                <Image v-else-if="item.data.type === 3 || item.data.title.split('.').pop() === 'jpg' || item.data.title.split('.').pop() === 'jpeg' || item.data.title.split('.').pop() === 'png'" alt="file" class="w-5 h-6 text-blue-500" />
                
                <div class="flex flex-col overflow-hidden">
                  <span class="text-sm truncate">{{ item.data.alias || item.data.title }}</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{{ item.data.title }}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div
        v-for="item in kb_list"
        :key="item"
        class="w-[32%] px-1 "
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger class="w-full">
              <div class="border rounded-md flex items-center gap-2 p-2 rounded-md bg-background hover:bg-accent">
                <Folder class="w-4 h-5 text-blue-500" />
                <div class="flex flex-col overflow-hidden">
                  <span class="text-sm truncate">{{ item.data.name }}</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{{ item.data.name }}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>

    <div v-if="files_list.length > 6" class="flex justify-end">
      <Button 
        variant="ghost" 
        size="sm" 
        class="h-6 px-0" 
        @click="change_doc_status"
      >
        <span class="text-sm">{{ doc_status ? '显示全部' : '显示部分' }}</span>
        <ChevronDown v-if="doc_status" class="h-3 w-3" />
        <ChevronUp v-else class="h-3 w-3" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronDown, ChevronUp, Image } from 'lucide-vue-next'
import { get_doc_api, get_kb_api } from '@/api/common.js'
import { FileText, Globe, Folder } from 'lucide-vue-next'
const props = defineProps<{
  item_data: {
    docIdList: string[]
    kb_ids: string[]
  }
}>()

const doc_status = ref(true)
const doc_num = ref(6)
const files_list = ref([])
const kb_list = ref([])

const open_url = (item: any) => {
  window.open(item.data.title, '_blank')
}

const download_pdf = (item: any) => {
  let url = window.location.origin + '/pdf_viewer?docId=' + item.data.docId
  if (item.data.type === 3 || item.data.title.split('.').pop() === 'jpg' || item.data.title.split('.').pop() === 'jpeg' || item.data.title.split('.').pop() === 'png') {
    url += '&if_img=true'
  }
  window.open(url, '_blank')
}

const change_doc_status = () => {
  if (doc_status.value) {
    doc_num.value = props.item_data.docIdList.length
    doc_status.value = false
  } else {
    doc_num.value = 6
    doc_status.value = true
  }
}

const get_data = () => {
  Promise.all(props.item_data.docIdList.map(async (item) => {
    const res = await get_doc_api(item)
    return res.data
  })).then(res => {
    files_list.value = res
  })

  Promise.all(props.item_data.kb_ids.map(async (item) => {
    try {
      const res = await get_kb_api(item)
      return res.data
    } catch (err) {
      console.error(`Error fetching data for item ${item}:`, err)
      return { data: { name: '知识库已删除' } }
    }
  })).then(res => {
    kb_list.value = res
  })
}

watch(() => props.item_data, () => {
  get_data()
})

get_data()
</script>
