<template>
  <div class="px-3 py-1 bg-muted/30 border-b overflow-y-auto max-h-[130px] min-h-[65px]">
    <TabsContent value="files">
      <div class="grid grid-cols-3 gap-2">
        <div v-for="file in files" :key="file.title" 
          class="flex items-center gap-1.5 p-1.5 bg-background rounded-lg border shadow-sm"
        >
          <Checkbox 
            :id="file.title"
            :checked="selectedFiles.some(f => f.title === file.title)"
            @update:checked="(checked) => toggleFile(checked, file)"
          />
          <img src="@/assets/imgs/pdf_large.png" alt="file" class="w-5 h-6" />
          
          <div class="flex-1 min-w-0">
            <div class="truncate text-xs cursor-pointer" @click="open_file(file)">{{ file.title }}</div>
            <div class="flex items-center gap-0.5">
              <span v-if="file.parseStatus === 1" class="text-[10px] text-muted-foreground">
                解析中 {{ file.parseProgress }}%
              </span>
              <div v-else-if="file.parseStatus === 2" class="flex items-center gap-1">
                <span class="text-[10px] text-success">完成</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        class="size-4 p-0"
                        @click="add_to_kb(file)"
                      >
                        <Plus class="size-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>添加到知识库</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span v-else-if="file.parseStatus === 3" class="text-[10px] text-destructive">
                失败
              </span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            class="size-5 p-0 shrink-0"
            @click="$emit('update:files', files.filter(f => f.title !== file.title))"
          >
            <X class="size-3" />
          </Button>
        </div>
      </div>
    </TabsContent>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, X } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TabsContent } from '@/components/ui/tabs'
import { add_doctokb_api } from '@/api/common.js'
import { useToast } from '@/components/ui/toast'

const { toast }= useToast()

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

const props = defineProps<{
  files: FileItem[]
  selectedFiles: FileItem[]
  selectedKbs: KnowledgeBase[]
}>()

const emit = defineEmits<{
  'update:files': [files: FileItem[]]
}>()

const toggleFile = (checked: boolean, file: FileItem) => {
  const currentSelected = [...props.selectedFiles]
  if (props.selectedKbs.length > 0) {
    toast({
      title: '已经选择知识库，不能选择文件',
      variant: 'destructive',
    })
    return
  }
  if (checked) {
    currentSelected.push(file)
  } else {
    const index = currentSelected.findIndex(f => f.title === file.title)
    if (index > -1) {
      currentSelected.splice(index, 1)
    }
  }
  emit('update:selectedFiles', currentSelected)
}

const add_to_kb = async (file: FileItem) => {
  try {
    const res = await add_doctokb_api(file.docId)
    console.log(res)
    toast({
      title: '添加成功',
      description: '文件已添加到知识库',
    })
  } catch (error) {
    console.error(error)
    toast({
      title: '添加失败',
      description: '文件添加到知识库失败',
      variant: 'destructive',
    })
  }
}

const open_file = (file: FileItem) => {
  const url = window.location.origin + '/pdf_viewer?docId=' + file.docId
  window.open(url, '_blank');
}
</script> 
