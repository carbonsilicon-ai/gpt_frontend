<template>
  <div class="px-4 py-2">
    <div class="space-y-4" v-infinite-scroll="channel_load_more">
      <div class="space-y-1.5">
        <div v-for="(item, index) in ask_list" 
            :key="index" 
            :class="[
              'flex flex-col px-3 py-3 rounded-lg cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground group',
              { 'bg-accent text-accent-foreground': item.id === store.channel_id }
            ]"
            @click="goQuestionList(item.id, index)">
          <div class="min-w-0 relative flex items-center justify-between">
            <div class="truncate text-sm" style="text-overflow: inherit">
              {{ item.name }}
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
                    <Dialog :open="edit_channel_dialog">
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          class="flex items-center justify-start px-3 py-2 transition-colors hover:bg-accent"
                          @click="edit_ask(item, index, $event)"
                        >
                          <Edit class="mr-2 h-4 w-4" />
                          重命名
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>重命名会话</DialogTitle>
                        </DialogHeader>
                        <div class="py-4">
                          <input 
                            type="text"
                            class="w-full px-3 py-2 border rounded-md"
                            v-model="editFormChannel.channel_name"
                            placeholder="请输入新名称"
                            @keyup.enter="submit_edit_channel"
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="ghost" @click="edit_channel_dialog = false">取消</Button>
                          <Button @click="submit_edit_channel">确认</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost"
                          class="flex items-center justify-start px-3 py-2 text-destructive transition-colors hover:bg-accent hover:text-destructive"
                          @click.stop
                        >
                          <Trash class="mr-2 h-4 w-4" />
                          删除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除</AlertDialogTitle>
                          <AlertDialogDescription>
                            您确定删除此会话记录吗？
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction @click="delete_ask(item.id, index, $event)">
                            确认
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <div class="flex items-center space-x-1.5">
              <Calendar class="h-3.5 w-3.5" />
              <span>{{ new Date(item.createTime).toLocaleDateString() }}</span>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  </div>

  
</template>

<script setup lang="ts">
import { MoreHorizontal, Edit, Trash } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  get_channellist_api, edit_channel_api, delete_channel_api, get_folder_api, create_folder_api, delete_folder_api, edit_folder_api
} from '@/api/common.js'

const props = defineProps({
  hasQuery: {
    type: Boolean,
    default: false
  }
})

const channel_size = ref(50)
const channel_page = ref(1)

const ask_list = ref([])
const ask_count = ref(0)

const store = useStore()
const ask_active = ref(-1)

const editFormChannel = ref({
  channel_name: ''
})
const old_channel_name = ref('')
const current_channel_id = ref('')
const edit_channel_dialog = ref(false)

const router = useRouter()
const get_channellist = () => {
  const param = {
    page: channel_page.value,
    size: channel_size.value
  }
  get_channellist_api(param).then((res: any) => {
    if (res.data.success == true) {
      ask_list.value = res.data.data.items
      ask_count.value = res.data.data.total
      setDefaultChannel()
    } else {
      useToast().toast({
        variant: "destructive",
        title: "Error",
        description: res.data.message
      })
    }
  }).catch((err: any) => {
    if (err.response?.status === 403 || err.response?.data?.message === 'Invalid session key') {
      router.push('/auth/sign-in')
      toast({
        title: "需要登录",
        description: "请先登录后再试",
        variant: "destructive"
      })
      return
    }
    useToast().toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to load channel list"
    })
    console.error(err)
  })
}

const setDefaultChannel = () => {
  if(!props.hasQuery){
    const defaultChannel = ask_list.value[0]
    if(defaultChannel){
      store.channel_id = defaultChannel.id
    }
  }
}

const edit_ask = (item: { name: string; id: string }, index: number, e: Event): void => {
  e.stopPropagation()
  editFormChannel.value.channel_name = item.name
  old_channel_name.value = item.name
  current_channel_id.value = item.id
  edit_channel_dialog.value = true
}

const submit_edit_channel = async () => {
  const { toast } = useToast()
  try {
    const res = await edit_channel_api({
      channel_id: current_channel_id.value,
      name: editFormChannel.value.channel_name
    })
    if (res.data.success) {
      toast({
        title: "Success",
        description: "重命名成功"
      })
      get_channellist()
      // 关闭dialog
      edit_channel_dialog.value = false
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: res.data.message
      })
    }
  } catch (err) {
    console.error(err)
    toast({
      variant: "destructive",
      title: "Error",
      description: "重命名失败"
    })
  }
}

const goQuestionList = (val: string, index: number) => {
  store.main_status = 2  // 跳转到指定问答页
  store.channel_id = val
  // 只改变url
  const path = `/channels?channel_id=${store.channel_id}`
  const url = `${window.location.origin}${path}`
  window.history.pushState({ path }, '', url)
}

const channel_load_more = () => {
  if(channel_page.value * channel_size.value < ask_count.value){
    channel_size.value += 5;
    get_channellist();
  }
}

const delete_ask = (id: string, index: number, e: Event) => {
  e.stopPropagation()
  
  const { toast } = useToast()
  try {
    delete_channel_api({ channel_id: id }).then((res) => {
      if (res.data.success === true) {
        toast({
          title: "Success",
          description: "会话记录删除成功",
        })
        get_channellist()
        if (id === store.channel_id) {
          ask_active.value = -1
          store.channel_id = ''
          store.main_status = 1
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: res.data.message
        })
      }
    })
  } catch (err) {
    console.error(err)
    toast({
      variant: "destructive",
      title: "Error",
      description: "删除失败"
    })
  }
}

get_channellist()
</script>