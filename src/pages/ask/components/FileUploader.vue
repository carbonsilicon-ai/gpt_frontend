<template>
  <div class="px-3 py-1 bg-muted/30 border-b overflow-y-auto max-h-[130px] min-h-[65px]">
    <TabsContent value="files">
      <div v-if="!files.length" class="text-xs text-muted-foreground text-center py-2 mt-4">
        当前没有附件，点击右下角按钮或者拖拽上传
      </div>
      <div v-else class="grid grid-cols-3 gap-2">
        <div v-for="file in files" :key="file.title" 
          class="flex items-center gap-1.5 p-1.5 bg-background rounded-lg border shadow-sm"
        >
          <Checkbox 
            :id="file.title"
            :checked="selectedFiles.some(f => f.title === file.title)"
            @update:checked="(checked) => toggleFile(checked, file)"
          />
          <img v-if="file.type === 1 || file.title.split('.').pop() === 'pdf'" src="@/assets/imgs/pdf_large.png" alt="file" class="w-5 h-6" />
          <Image v-else-if="!file.img_id && (file.type === 3 || file.title.split('.').pop() === 'jpg' || file.title.split('.').pop() === 'jpeg' || file.title.split('.').pop() === 'png')" alt="file" class="w-5 h-6 text-blue-500" />
          <div v-else-if="file.img_id && !imageBase64Map[file.img_id]" class="w-12 h-12 flex items-center justify-center">
            <div class="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
          <img v-else-if="file.img_id" :src="imageBase64Map[file.img_id]" alt="wait" class="w-12" />
          
          <div class="flex-1 min-w-0">
            <div class="truncate text-xs cursor-pointer" @click="open_file(file)">{{ file.title }}</div>
            <div class="flex items-center gap-0.5">
              <span v-if="file.parseStatus === 1" class="text-[10px] text-muted-foreground">
                解析中 {{ file.parse_progress }}%
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

  <Dialog :open="showDialog" @update:open="showDialog = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>添加到知识库</DialogTitle>
        <DialogDescription>
          请选择要添加到的知识库
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        <div class="space-y-2">
          <Label>目标知识库</Label>
          <Select v-model="moveTargetFolder">
            <SelectTrigger>
              <SelectValue placeholder="选择目标知识库" />
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
          <Button variant="outline" @click="showDialog = false">取消</Button>
          <Button 
            :disabled="!moveTargetFolder || !current_move_id" 
            @click="confirmMove"
          >
            确定
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, X, Image } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TabsContent } from '@/components/ui/tabs'
import { add_doctokb_api, getimgbase64_api } from '@/api/common.js'
import { useToast } from '@/components/ui/toast'
import { useStore } from '@/stores/index.js'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const { toast }= useToast()
const store = useStore()
interface FileItem {
  title: string
  size: number
  parseStatus: number
  parse_progress: number
  progress_texts: string[]
  raw?: File
  docId?: string
  timer?: any
  type?: number
  img_id?: string
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

const showDialog = ref(false)
const moveTargetFolder = ref('')

const imageBase64Map = ref<Record<string, string>>({})

const toggleFile = (checked: boolean, file: FileItem) => {
  const currentSelected = [...props.selectedFiles]
  if (props.selectedKbs.length > 0) {
    toast({
      title: '已经选择知识库，不能选择文件',
      variant: 'destructive',
    })
    return
  }
  // 不能大于六个
  if (currentSelected.length >= 6) {
    toast({
      title: '最多只能选择6个文件',
      variant: 'destructive',
    })
    // 删除大于6个的文件
    currentSelected.splice(6, currentSelected.length - 6)
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

const confirmMove = async () => {
  const param = {
    folder_id: moveTargetFolder.value,
    docId: current_move_id.value
  }
  try {
    const res = await add_doctokb_api(param)
    toast({
      title: '添加成功',
      description: '文件已添加到知识库',
    })
    showDialog.value = false
    current_move_id.value = ''

  } catch (error) {
    console.error(error)
    toast({
      title: '添加失败',
      description: error.response?.data?.message || '文件添加到知识库失败',
      variant: 'destructive',
    })
  }
}

const current_move_id = ref('')
const add_to_kb = async (file: FileItem) => {
  // 打开对话框
  showDialog.value = true
  current_move_id.value = file.docId || ''
}

const open_file = (file: FileItem) => {
  let url = window.location.origin + '/pdf_viewer?docId=' + file.docId
  if (file.type === 3 || file.title.split('.').pop() === 'jpg' || file.title.split('.').pop() === 'jpeg' || file.title.split('.').pop() === 'png') {
    url += '&if_img=true'
  }
  window.open(url, '_blank');
}

const get_img_base64 = async (img_id: string) => {
  if (!imageBase64Map.value[img_id]) {
    try {
      const res = await getimgbase64_api(img_id)
      imageBase64Map.value[img_id] = 'data:image/png;base64,' + res.data.data.img_base64
    } catch (error) {
      console.error('Failed to load image:', error)
    }
  }
  return imageBase64Map.value[img_id]
}

// Add a watcher to load images when files change
watch(() => props.files, (newFiles) => {
  newFiles.forEach(file => {
    if (file.img_id) {
      get_img_base64(file.img_id)
    }
  })
}, { immediate: true, deep: true })
</script> 
