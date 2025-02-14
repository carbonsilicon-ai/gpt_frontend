<script lang="ts" setup>
import Sidebar01 from '@/components/AppSidebar/Sidebar01.vue'
import { CirclePlus, FolderGit2, BookOpenText } from 'lucide-vue-next'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Zap, LogOut, FileClock } from 'lucide-vue-next'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { Users2, History, TriangleAlert } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useToast } from '@/components/ui/toast'
import { ref } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useStore } from '@/stores/index.js'
import get_all_folder from '@/pages/ask/components/get_all_folder.vue'
import { get_webalert_api } from '@/api/common.js'

const router = useRouter()
const { toast } = useToast()
const store = useStore()

const if_ldap = ref(false)

if (import.meta.env.VITE_APP_ENV === 'ldap') {
  if_ldap.value = true
}

const props = defineProps<{
  isSidebarOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'update:isSidebarOpen', value: boolean): void
}>()

const handleNavigation = (path: string) => {
  if (path !== '/' && path === router.currentRoute.value.path) {
    emit('update:isSidebarOpen', !props.isSidebarOpen)
  } else {
    router.push(path)
  }
}

const get_users_role = ref<any>(null)
const signout_api = ref<any>(null)

const loadApi = async () => {
  if (import.meta.env.VITE_APP_ENV === 'private' || import.meta.env.VITE_APP_ENV === 'ldap') {
    const { get_users_role: api1, signout_api: code1} = await import('@/api/user.js')
    get_users_role.value = api1
    signout_api.value = code1
  } else {
    const { get_users_role: api2, signout_api: code2 } = await import('@/api/drugflow_user.js')
    get_users_role.value = api2
    signout_api.value = code2
  }
}

loadApi()

const signout = () => {
  signout_api.value().then((res: any) => {
    localStorage.removeItem('csrf_access_token')
    toast({
      title: "登出成功",
      variant: "default"
    })
    // router
    router.push('/auth/sign-in')
  }).catch((err: Error) => {
    toast({
      title: "登出失败",
      description: err.message,
      variant: "destructive"
    })
  })
}

const alert_info = ref({
  show: false,
  content: '',
  content_type: 'warning'
})

const get_webalert = () => {
  get_webalert_api().then((res: any) => {
    console.log('home_copy get_webalert_api', res)
    alert_info.value.show = res.data.data.is_show
    alert_info.value.content = res.data.data.content
    alert_info.value.content_type = res.data.data.content_type
  }).catch((err: Error) => {
    console.log('home_copy get_webalert_api err', err)
    alert_info.value.show = false
    alert_info.value.content = ''
    alert_info.value.content_type = 'warning'
  })
}

get_webalert()

const showChangelogDialog = ref(false)

const versions = ref([
  {
    'version': 'v0.3.0', 
    'date': '2025-02-10', 
    'content': ['前端页面更新', '支持deepseek r1模型', '搜索服务升级']
  },
  {
    'version': 'v0.2.0', 
    'date': '2025-01-01', 
    'content': ['更新PDF解析器', '增加PDF解析过程展示', '提升知识库检索能力', '主页更新，Router优化']
  },
  {
    'version': 'v0.1.3', 
    'date': '2024-11-29', 
    'content': ['增加公共文件夹', '修改大模型API为文心一言', '解决中文提问，英文回答情况']
  },
  {
    'version': 'v0.1.2', 
    'date': '2024-11-09', 
    'content': ['更改上传和文件选择的交互', '修复已知Bug', '增加队列控制', '修改pdf总结接口']
  },
  {
    'version': 'v0.1.1', 
    'date': '2024-10-28', 
    'content': ['新增版本记录功能', '默认知识库支持修改', '优化SciGPT策略']
  },
])

const closeAlert = () => {
  alert_info.value.show = false
}

</script>

<template>
  <div class="flex h-screen">
    <!-- 固定按钮区域 -->
    <aside class="fixed inset-y-0 left-0 z-20 w-14 flex-col border-r bg-background sm:flex">
      <nav class="flex flex-col items-center gap-4 px-2 sm:py-5">
        <a
          @click="handleNavigation('/')"
          class="group cursor-pointer flex h-9 w-9 mb-8 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base p-1"
        >
          <img v-if="if_ldap" src="@/assets/imgs/qilu_logo_white.png" alt="logo" class="w-full" />
          <img v-else src="@/assets/imgs/top_logo.png" alt="logo" class="w-full" />
        </a>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <a
                @click="handleNavigation('/')"
                class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-gray-900 hover:text-white md:h-8 md:w-8 hover:cursor-pointer"
              >
                <CirclePlus class="h-5 w-5" />
                <span class="sr-only">新会话</span>
              </a>
            </TooltipTrigger>
            <TooltipContent side="right">
              新会话
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <!-- 分隔符 -->
        <div class="w-8 h-px bg-gray-500 mb-4"></div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <a
                @click="handleNavigation('/channels')"
                :class="{ 'bg-gray-900 text-white': router.currentRoute.value.path === '/channels' }"
                class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-gray-900 hover:text-white md:h-8 md:w-8 hover:cursor-pointer"
              >
                <FileClock class="h-5 w-5" />
                <span class="sr-only">历史会话</span>
              </a>
            </TooltipTrigger>
            <TooltipContent side="right">
              历史会话
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <a
                @click="handleNavigation('/knowledges')"
                :class="{ 'bg-gray-900 text-white': router.currentRoute.value.path === '/knowledges' }"
                class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-gray-900 hover:text-white md:h-8 md:w-8 hover:cursor-pointer"
              >
                <BookOpenText class="h-5 w-5" />
                <span class="sr-only">知识库</span>
              </a>
            </TooltipTrigger>
            <TooltipContent side="right">
              知识库
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as-child>
              <a
                @click="handleNavigation('/public_folder')"
                :class="{ 'bg-gray-900 text-white': router.currentRoute.value.path === '/public_folder' }"
                class="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-gray-900 hover:text-white md:h-8 md:w-8 hover:cursor-pointer"
              >
                <FolderGit2 class="h-5 w-5" />
                <span class="sr-only">公共文件夹</span>
              </a>
            </TooltipTrigger>
            <TooltipContent side="right">
              公共文件夹
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
      <div class="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="ghost" 
              size="icon"
              class="h-9 w-9 rounded-full text-muted-foreground transition-colors hover:bg-gray-900 hover:text-white md:h-8 md:w-8"
            >
              <Users2 class="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="right" class="w-56">
            <div class="flex items-center gap-2 p-2">
              <div class="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Users2 class="h-5 w-5" />
              </div>
              <div class="flex flex-col">
                <p class="text-sm font-medium">{{ store.username }}</p>
              </div>
            </div>
            <Separator class="my-2" />
            <div class="flex flex-col gap-1">
              <Button variant="ghost" class="w-full justify-start gap-2" disabled v-if="!if_ldap">
                <Zap class="h-4 w-4 text-muted-foreground" />
                升级到Pro
              </Button>
              <Button variant="ghost" @click="showChangelogDialog = true" class="w-full justify-start gap-2">
                <History class="h-4 w-4" />
                版本记录
              </Button>
              <Button variant="ghost" @click="signout" class="w-full justify-start gap-2 text-destructive hover:text-red-500">
                <LogOut class="h-4 w-4" />
                登出
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </aside>

    <Sidebar01 :isOpen="props.isSidebarOpen" class="ml-14">
      <template #sider_header>
        <slot name="sider_header" />
      </template>

      <template #sider_content>
        <slot name="sider_content" />
      </template>

      <!-- 主要内容区域 -->
      <div class="flex-1 flex flex-col bg-muted/40">
        <slot />
      </div>
    </Sidebar01>

    <!-- Changelog Dialog -->
    <Dialog v-model:open="showChangelogDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>版本更新记录</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <div v-for="version in versions" :key="version.version" class="space-y-2">
            <h3 class="font-medium">{{ version.version }} ({{ version.date }})</h3>
            <ul class="list-disc pl-4 text-sm text-muted-foreground">
              <li v-for="item in version.content" :key="item">{{ item }}</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>

  </div>
  <get_all_folder />

    <Button 
      size="sm" 
      v-if="alert_info.show" 
      class="fixed top-0 left-1/2 -translate-x-1/2 z-50 py-1 flex items-center justify-center gap-2"
      style="background-color: #e88100;"
      @click="closeAlert"
    >
      <TriangleAlert class="w-4 h-4" />
      <span class="flex-1 text-center">{{ alert_info.content }}</span>
      <span class="ml-2">×</span>
    </Button>
  
</template>

<style scoped>
/* 可以添加需要的样式 */
</style>
