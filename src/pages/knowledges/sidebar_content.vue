<template>
  <div class="p-4">
    <div class="mb-6">
      <Button class="w-full" @click="newFolder">
        <Plus class="h-4 w-4 mr-2" />
        新建知识库
      </Button>
    </div>

    <div v-if="isLoading" class="space-y-4">
      <div v-for="n in 5" :key="n" class="space-y-3">
        <Skeleton class="h-[48px] w-full rounded-lg" />
      </div>
    </div>

    <div v-else class="space-y-4" v-infinite-scroll="folderLoadMore">
      <div v-for="(item, index) in folderList" :key="index"
        :class="[
          'relative px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground group',
          { 'bg-accent text-accent-foreground': item.id === store.folder_id }
        ]"
        @click="goFolderList(item)">
        <div class="min-w-0">
          <div class="flex flex-col space-y-2">
            <div class="flex items-center space-x-2">
              <span class="truncate text-sm font-medium leading-none">{{ item.name }}</span>
            </div>
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <div class="flex items-center space-x-1.5">
                <Calendar class="h-3.5 w-3.5" />
                <span>{{ new Date(item.createTime).toLocaleDateString() }}</span>
              </div>
              <div class="flex items-center space-x-1.5">
                <Files class="h-3.5 w-3.5" />
                <span>{{ item.docs.length }}/50</span>
              </div>
            </div>
          </div>
        </div>
        <div class="absolute right-0 top-0 opacity-0 transition-opacity group-hover:opacity-100">
          <Popover>
            <PopoverTrigger @click.stop>
              <Button variant="ghost" size="icon" class="h-8 w-8 hover:bg-accent">
                <MoreHorizontal class="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-48 p-0">
              <div class="flex flex-col">
                <Button 
                  variant="ghost" 
                  class="flex items-center justify-start px-3 py-2 transition-colors hover:bg-accent"
                  @click="editFolder(item, index)"
                >
                  <Edit class="mr-2 h-4 w-4" />
                  重命名
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger v-if="item.name !== '默认知识库'" asChild>
                    <Button 
                      variant="ghost"
                      class="flex items-center justify-start px-3 py-2 text-destructive transition-colors hover:bg-accent hover:text-destructive"
                    >
                      <Trash class="mr-2 h-4 w-4" />
                      删除
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除</AlertDialogTitle>
                      <AlertDialogDescription>
                        确定要删除该知识库吗？此操作不可恢复。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction @click="deleteFolder(item.id, index)">确定</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  </div>

  <Dialog :open="newFolderDialog" @update:open="newFolderDialog = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>新建知识库</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="space-y-2">
          <Label>知识库名称</Label>
          <Input 
            v-model="newFolderName"
            maxlength="20" 
            placeholder="请输入知识库名称" 
            @keyup.enter="submitDatabase"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" @click="newFolderDialog = false">取消</Button>
        <Button @click="submitDatabase" :loading="btnLoading">确定</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog :open="editFolderDialog" @update:open="editFolderDialog = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>重命名知识库</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="space-y-2">
          <Label>知识库名称</Label>
          <Input 
            v-model="editFolderName"
            maxlength="20" 
            placeholder="请输入知识库名称" 
            @keyup.enter="submitEdit"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" @click="editFolderDialog = false">取消</Button>
        <Button @click="submitEdit" :loading="btnLoading">确定</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { get_folder_api, create_folder_api, delete_folder_api, edit_folder_api } from '@/api/common.js'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Plus, Edit, Trash, MoreHorizontal, Calendar, Files } from 'lucide-vue-next'
import { useStore } from '@/stores/index.js'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useRouter } from 'vue-router'
import { Skeleton } from '@/components/ui/skeleton'

const router = useRouter()
const store = useStore()
const { toast } = useToast()
const folderPage = ref(1)
const folderSize = ref(100)
const folderCount = ref(0)
const folderList = ref([])
const btnLoading = ref(false)
const newFolderDialog = ref(false)
const editFolderDialog = ref(false)
const newFolderName = ref('')
const editFolderName = ref('')
const editFolderId = ref('')
const isLoading = ref(true)

const props = defineProps<{
  hasQuery: boolean
}>()

const folderLoadMore = () => {
  if(folderPage.value * folderSize.value < folderCount.value){
    folderSize.value += 5
    getFolderList()
  }
}

const getFolderList = async (activeOffset = 0) => {
  try {
    const param = {
      page: folderPage.value,
      size: folderSize.value
    }
    const res = await get_folder_api(param)
    if (res.data.data.items.length === 0) {
      await create_folder_api({ name: '默认知识库' })
      getFolderList(activeOffset)
    } else {
      folderCount.value = res.data.data.total
      folderList.value = res.data.data.items
      store.knowledge_folders = res.data.data.items
      setDefaultFolder()
    }
  } catch (err: any) {
    console.error(err)
    if (err.response?.status === 403 || err.response?.status === 401 || err.response?.data?.message === 'Invalid session key') {
      toast({
        variant: "destructive",
        title: "错误",
        description: "登录已过期，请重新登录"
      })
      router.push('/auth/sign-in')
    }
  } finally {
    isLoading.value = false
  }
}

const setDefaultFolder = () => {
  if(!props.hasQuery){
    const defaultFolder = folderList.value.find(item => item.name === '默认知识库')
    if(defaultFolder){
      store.folder_id = defaultFolder.id
      store.folder_name = defaultFolder.name
      store.folder_file_count = defaultFolder.docs.length
    }
  }
}

const newFolder = () => {
  newFolderDialog.value = true
  newFolderName.value = ''
}

const editFolder = (item: any, index: number) => {
  editFolderDialog.value = true
  editFolderName.value = item.name
  editFolderId.value = item.id
}

const submitDatabase = async () => {
  if (!newFolderName.value) {
    toast({
      variant: "destructive",
      title: "错误",
      description: "知识库名称不能为空"
    })
    return
  }

  try {
    btnLoading.value = true
    await create_folder_api({ 
      name: newFolderName.value
    })
    
    newFolderDialog.value = false
    newFolderName.value = ''
    getFolderList()
    toast({
      title: "成功",
      description: "知识库创建成功"
    })
  } catch (err) {
    toast({
      variant: "destructive", 
      title: "错误",
      description: "创建失败"
    })
  } finally {
    btnLoading.value = false
  }
}

const submitEdit = async () => {
  if (!editFolderName.value) {
    toast({
      variant: "destructive",
      title: "错误",
      description: "知识库名称不能为空"
    })
    return
  }

  try {
    btnLoading.value = true
    await edit_folder_api({ 
      name: editFolderName.value, 
      folder_id: editFolderId.value 
    })
    
    editFolderDialog.value = false
    editFolderName.value = ''
    getFolderList()
    toast({
      title: "成功",
      description: "重命名成功"
    })
  } catch (err) {
    toast({
      variant: "destructive",
      title: "错误", 
      description: "重命名失败"
    })
  } finally {
    btnLoading.value = false
  }
}

const deleteFolder = async (id: string, index: number) => {
  try {
    await delete_folder_api({ folder_id: id })
    getFolderList()
    toast({
      title: "成功",
      description: "删除成功"
    })
  } catch (err) {
    toast({
      variant: "destructive",
      title: "错误",
      description: "删除失败" 
    })
  }
}

const goFolderList = (item: any) => {
  store.folder_id = item.id
  store.folder_name = item.name
  store.folder_file_count = item.docs.length
  // TODO: 路由跳转
  // 改写route的query
  const path = `/knowledges?folder_id=${store.folder_id}&folder_name=${encodeURIComponent(store.folder_name)}`
  const url = `${window.location.origin}${path}`
  window.history.pushState({ path }, '', url)
}

// 初始化加载
getFolderList()

defineExpose({
  getFolderList
})
</script>