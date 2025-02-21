<template>
  <div class="flex flex-col h-screen">
    <div class="flex-grow bg-muted/40 overflow-auto" ref="scrollContainerRef">
      <div class="flex flex-col space-y-8 p-8 max-w-4xl mx-auto">
        <div v-for="(item, index) in questionList" :key="index" class="flex flex-col space-y-6">
          <!-- User question -->
          <div class="flex justify-end">
            <Card class="max-w-[calc(100%-43px)] bg-primary/10 border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent class="p-5">
                <p class="text-sm text-foreground leading-relaxed font-medium">{{ item.question }}</p>
              </CardContent>
            </Card>
          </div>
          <ask_append :item_data="item" style="margin-top: 6px;"/>

          <!-- GPT response -->
          <div class="flex justify-start items-start gap-3">
            <a
              class="group flex h-9 w-9 mb-8 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base p-1"
            >
              <img v-if="if_ldap" src="@/assets/imgs/qilu_logo_white.png" alt="logo" class="w-full" />
              <img v-else src="@/assets/imgs/top_logo.png" alt="logo" class="w-full" />
            </a>
            <Card class="max-w-[calc(100%-3rem)] shadow-sm hover:shadow-md transition-shadow">
              <CardContent class="px-5 py-0">
                <answer_ref :item_data="item" />
                <thinking_card :item_data="item" />
                <div class="prose max-w-none dark:prose-invert prose-pre:bg-gray-700 prose-pre:border prose-pre:border-border prose-pre:rounded-lg 
                            prose-table:border prose-table:border-collapse prose-td:border prose-td:border-border prose-td:p-2
                            prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-muted/50
                            prose-a:bg-primary/10 prose-a:px-1 prose-a:rounded-md prose-a:text-primary prose-a:cursor-pointer
                            prose-hr:mt-8 prose-hr:mb-8">
                  <div v-if="item.content" 
                    :id="'question_' + index"
                    class="text-sm text-foreground leading-[2]"
                    v-html="marked.render(process_content(item.content))"
                  ></div>
                  <div v-if="item.answerStatus == 1" class="flex items-center gap-3 py-2">
                    <Loader2 class="h-5 w-5 animate-spin text-primary" />
                    <p class="text-sm text-muted-foreground font-medium">请稍等...</p>
                  </div>
                </div>
                <!-- Action buttons -->
                <div class="flex justify-between items-center gap-2 py-2 border-t">
                  <div v-if="item.answerStatus === 3" class="text-sm text-destructive">
                    回答已停止
                  </div>
                  <div v-else class="flex-1"></div>
                  <div class="flex gap-2">
                    <button class="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors" @click="copyContent('question_'+ index)">
                      <Copy class="h-4 w-4" />
                    </button>
                    <button class="p-2 hover:bg-muted rounded-md transition-colors" 
                      :class="item.effect === '1' ? 'text-yellow-500' : 'text-muted-foreground hover:text-foreground'"
                      @click="likeAnswer(item)">
                      <ThumbsUp class="h-4 w-4" :fill="item.effect === '1' ? 'currentColor' : 'none'" />
                    </button>
                    <button class="p-2 hover:bg-muted rounded-md transition-colors"
                      :class="item.effect === '2' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
                      @click="dislikeDialog(item)">
                      <ThumbsDown class="h-4 w-4" :fill="item.effect === '2' ? 'currentColor' : 'none'" />
                    </button>
                    <button class="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors" @click="showDeleteDialog(item)">
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-shrink-0 max-w-4xl mx-auto w-full px-8 bg-muted/40">
      <ask_button 
        @get_questionlist="get_questionlist" 
        @closeSider="closeSider" 
        @stop="stop_question(undefined, true)" ref="askButtonRef" 
      />
    </div>

    <!-- Delete confirmation dialog -->
    <Dialog :open="showDialog" @update:open="showDialog = $event">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription>
            您确定要删除这条对话吗？此操作无法撤销。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDialog = false">取消</Button>
          <Button variant="destructive" @click="handleDelete">删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Dislike feedback dialog -->
    <Dialog :open="showDislikeDialog" @update:open="showDislikeDialog = $event">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>反馈意见</DialogTitle>
          <DialogDescription>
            请输入您的反馈意见，帮助我们改进服务。
          </DialogDescription>
        </DialogHeader>
        <div class="py-4">
          <textarea 
            v-model="dislikeFeedback"
            class="w-full min-h-[100px] p-3 rounded-md border border-input bg-transparent"
            placeholder="请输入您的反馈..."
          ></textarea>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showDislikeDialog = false">取消</Button>
          <Button variant="default" @click="handleDislike">提交</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import {
  get_questionlist_api, add_effect_api, delete_question_api, get_recommend_api, stop_question_api
} from '@/api/common.js'
import { useStore } from '@/stores/index.js'
import markdownit from 'markdown-it'
import markdownitExternalLink from 'markdown-it-external-link'
import hljs from 'highlight.js'
import mk from '@xtthaop/markdown-it-katex'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import ask_button from '@/pages/ask/ask_button.vue'
import { Loader2, Copy, ThumbsUp, ThumbsDown, Trash2 } from 'lucide-vue-next'
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { getCookie } from '@/utils/request.js'
import ask_append from './ask_append.vue'
import answer_ref from './answer_ref.vue'
import thinking_card from './thinking_card.vue'
import markdownitCodeCopy from 'markdown-it-code-copy'

const if_ldap = ref(false)

if (import.meta.env.VITE_APP_ENV === 'ldap') {
  if_ldap.value = true
}

const { toast } = useToast()

const marked = markdownit({
  html: true,
  linkify: true,
  typographer: true,
  langPrefix: 'language-',
  highlight: function (str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
    }
    return ''; // use external default escaping
  }
})

marked.use(markdownitExternalLink, {
  'hosts': [
    'https://ai.drugflow.com',
    'https://inplat.drugflow.com', 
  ]
});

marked.use(mk);
marked.use(markdownitCodeCopy, {
  element: '<svg fill="currentColor" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M878.272 981.312H375.36a104.64 104.64 0 0 1-104.64-104.64V375.36c0-57.792 46.848-104.64 104.64-104.64h502.912c57.792 0 104.64 46.848 104.64 104.64v502.912c-1.6 56.192-48.448 103.04-104.64 103.04z m-502.912-616.96a10.688 10.688 0 0 0-10.944 11.008v502.912c0 6.208 4.672 10.88 10.88 10.88h502.976c6.208 0 10.88-4.672 10.88-10.88V375.36a10.688 10.688 0 0 0-10.88-10.944H375.36z"></path><path d="M192.64 753.28h-45.312a104.64 104.64 0 0 1-104.64-104.64V147.328c0-57.792 46.848-104.64 104.64-104.64h502.912c57.792 0 104.64 46.848 104.64 104.64v49.92a46.016 46.016 0 0 1-46.848 46.912 46.08 46.08 0 0 1-46.848-46.848v-49.984a10.688 10.688 0 0 0-10.944-10.944H147.328a10.688 10.688 0 0 0-10.944 10.88v502.976c0 6.208 4.672 10.88 10.88 10.88h45.312a46.08 46.08 0 0 1 46.848 46.912c0 26.496-21.824 45.248-46.848 45.248z"></path></svg>',
  // onSuccess toast
  onSuccess: () => {
    toast({
      title: '复制成功',
      description: '已复制到剪贴板',
    })
  }
});

const store = useStore()

interface questionListType {
  questionId: string,
  answerStatus: number,
  channel_id: string,
  client: number,
  content: string,
  createTime: string,
  docIdList: string[],
  docIdListKnowledge: string[],
  effect: null | string,
  intends: number,
  kb_ids: string[],
  question: string,
  search_type: string,
  if_search_online: boolean,
  if_thinking: boolean
}

defineProps<{
  isSidebarOpen: boolean
}>()

const questionList = ref<questionListType[]>([])
const showDialog = ref(false)
const showDislikeDialog = ref(false)
const itemToDelete = ref<questionListType | null>(null)
const itemToDislike = ref<questionListType | null>(null)
const dislikeFeedback = ref('')

const scrollContainerRef = ref<HTMLElement | null>(null)

const isGenerating = ref(false)

// 添加节流函数
const throttle = (fn: Function, delay: number) => {
  let lastTime = 0
  return (...args: any[]) => {
    const now = Date.now()
    if (now - lastTime >= delay) {
      fn.apply(null, args)
      lastTime = now
    }
  }
}

// 修改后的 scrollToBottom 函数
const scrollToBottom = throttle((force: boolean = false) => {
  nextTick(() => {
    if (!scrollContainerRef.value) return
    const max_height = 150
    if (force || (scrollContainerRef.value.scrollHeight - (scrollContainerRef.value.scrollTop + scrollContainerRef.value.clientHeight) < max_height)) {
      scrollContainerRef.value.scrollTo({
        top: scrollContainerRef.value.scrollHeight,
        behavior: 'smooth'
      })
    }
  })
}, 2000) // 100ms 的节流延迟

const controller = ref<AbortController | null>(null)
const eventSource = ref<EventSource | null>(null)
const askButtonRef = ref<InstanceType<typeof ask_button> | null>(null)
const get_questionlist = () => {
  const ques_params = {
    channel_id: store.channel_id,
    page: 1,
    size: 100
  }
  if (!store.channel_id) {
    return
  }
  get_questionlist_api(ques_params)
    .then((res: any) => {
      if (res.data.success == true) {
        questionList.value = res.data.data.items
        
        const flag = questionList.value.every((item) => { return item.answerStatus != 1 })

        if (!flag) {
          // 设置回答相关的store

          let params = {}
          questionList.value.map(item => {
            if(item.answerStatus == 1){
              params = {
                questionId: item.questionId,
                question: item.question,
                docIdList: item.docIdList || [],
                docIdListKnowledge: item.docIdListKnowledge || [],
                channel_id: store.channel_id,
                user_id: store.user_id,
                knowledgeCSAIDefault: store.knowledgeCSAIDefault,
                client: store.llm_select,
                kb_ids: item?.kb_ids,
                search_type: item?.search_type,
                if_search_online: item?.if_search_online,
                if_thinking: item?.if_thinking
              }
            }
          })

          askButtonRef.value?.open_isLoading()

          let fetchUrl = '/api/v1/channel/questions2'
          
          let first_mess = true
          let first_status = true
          let first_thinking = true
          let search_dict = {"search_data": []}

          controller.value = new AbortController()
          let csrfAccessToken = getCookie('csrf_access_token')
          scrollToBottom(true)

          eventSource.value = fetchEventSource(fetchUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': csrfAccessToken || ''
            },
            credentials: 'include',
            body: JSON.stringify(params),
            signal: controller.value.signal,
            openWhenHidden: true,
            onmessage(event: any) {
              if (questionList.value[questionList.value.length - 1].content == null){
                questionList.value[questionList.value.length - 1].content = ''
              }
              if (event.event == 'message') {
                if (first_mess) {
                  isGenerating.value = true
                  if (questionList.value[questionList.value.length - 1].content.split('<======>').length === 2) {
                    questionList.value[questionList.value.length - 1].content += '<======>';
                  }

                  if (!first_thinking) {
                    questionList.value[questionList.value.length - 1].content += '</thinking>'
                  }
                  first_mess = false
                }
                questionList.value[questionList.value.length - 1].answerStatus = 7
                let tmp_data
                if (event.data[0] == '{') {
                  tmp_data = JSON.parse(event.data).data
                } else {
                  tmp_data = event.data
                }
                questionList.value[questionList.value.length - 1].content += tmp_data =='<<<end>>>' ? '' : tmp_data
              } else if (event.event == 'status') {
                if (first_status) {
                  first_status = false
                }
                questionList.value[questionList.value.length - 1].answerStatus = 6
                search_dict.search_data.push(JSON.parse(event.data))
                questionList.value[questionList.value.length - 1].content = '<======>' + JSON.stringify(search_dict)
              } else if (event.event == 'intends') {
                if (event.data == '2') {
                  questionList.value[questionList.value.length - 1].intends = 2
                  questionList.value[questionList.value.length - 1].answerStatus = 5
                } else if (event.data == '5') {
                  questionList.value[questionList.value.length - 1].intends = 5
                  questionList.value[questionList.value.length - 1].answerStatus = 5
                } else {
                  questionList.value[questionList.value.length - 1].intends = 1
                }
              } else if (event.event == 'error') {
                stop_question(undefined, true)
              } else if (event.event == 'thinking') {
                questionList.value[questionList.value.length - 1].answerStatus = 7
                let tmp_data
                if (event.data[0] == '{') {
                  tmp_data = JSON.parse(event.data).data
                } else {
                  tmp_data = event.data
                }
                if (first_thinking) {
                  if (questionList.value[questionList.value.length - 1].content.split('<======>').length === 2) {
                    questionList.value[questionList.value.length - 1].content += '<======>';
                  }
                  questionList.value[questionList.value.length - 1].content += '<thinking>' + tmp_data
                  first_thinking = false
                } else {
                  questionList.value[questionList.value.length - 1].content += tmp_data
                }
              }
              
              if (event.data == '<<<end>>>') {
                isGenerating.value = false
                stop_question(undefined, true)
                askButtonRef.value?.close_isLoading()
              }
              scrollToBottom()
            },
            onclose() {
              scrollToBottom()
              stop_question(undefined, true)
              askButtonRef.value?.close_isLoading()
            },
            onerror(error) {
              scrollToBottom()
              stop_question(undefined, true)
              askButtonRef.value?.close_isLoading()
            }
          })
        }
      } else {
        askButtonRef.value?.close_isLoading()
        toast({
          title: "Error",
          description: res.data.message,
          variant: "destructive"
        })
      }
    })
    .catch((err: any) => {
      console.log(err)
    })
}

const stop_question = (channel_id: string | undefined, need_update: boolean = true) => {
  if (controller.value != null) {
    controller.value.abort()
    controller.value = null
  }
  if (eventSource.value != null) {
    eventSource.value = null
  }

  let stop_channel_id = store.channel_id
  if (channel_id) {
    stop_channel_id = channel_id
  }

  stop_question_api(stop_channel_id)
    .then((res: any) => {
      askButtonRef.value?.close_isLoading()
      if (need_update) {
        setTimeout(() => {
          get_questionlist()
        }, 300)
      }
      try {
        console.log('stop_question_api ask_button_ref')
      } catch (err) {
        console.log('stop_question_api ask_button_ref error', err)
      }
    })
    .catch((err: any) => {
      console.log('stop_question_api error', err)
      if (err.response?.status !== 422) {
        toast({
          title: "Error",
          description: err.response?.data,
          variant: "destructive"
        })
      }
    })
}

const process_content = (content: string) => {
  const split_var = '<======>'
  const end_var = '<<<end>>>'
  if (content == null) {
    return ''
  } 
  // 去掉<not_show>和</not_show>之间的内容
  content = content.replace(/<not_show>.*?<\/not_show>/g, '')
  if (content.split(split_var).length > 2) {
    const tmp = transfer_citation(content.split(split_var)[1], content.split(split_var)[2])
    if (tmp.split('</thinking>').length == 2) {
      return tmp.split('</thinking>')[1].split(end_var)[0]
    }
    if (tmp.includes('<thinking>')) {
      return ''
    } else {
      return tmp.split(end_var)[0]
    }
  } else if (content.split(split_var).length == 1) {
    if (content.split('</thinking>').length >= 2) {
      return content.split('</thinking>')[content.split('</thinking>').length - 1].split(end_var)[0]
    } else {
      if (content.includes('<thinking>')) {
        return ''
      } else {
        return content.split(end_var)[0]
      }
    }
  } else {
    return ''
  }
}

declare global {
  interface Window {
    download_pdf: (docId: string) => void;
  }
}

window.download_pdf = (docId: string) => {
  const url = window.location.origin + '/pdf_viewer?docId=' + docId
  window.open(url, '_blank');
}

const transfer_citation = (dict_string: string, originalString: string) => {
  if (dict_string == '') {
    return originalString
  }
  const search_list = JSON.parse(dict_string).search_data
  let regex = /\[citation\s?:\s?(\d+)\]/g;

  originalString = originalString.replace(regex, (match: string, number: number) => {
    const citation = search_list[number - 1];
    if (citation && citation.type == '1') {
      return `<a class="citation" onclick="download_pdf('${citation.docId}')">${number}</a>`;
    }
    return `<a class='citation' href="${citation?.url}" target="_blank">${number}</a>`;
  });

  return originalString
}

const copyContent = (elementid: string) => {
  const element = document.getElementById(elementid)
  if (!element) {
    toast({
      title: "复制失败",
      description: "未找到要复制的内容",
      variant: "destructive"
    })
    return
  }

  // Create a range to select the content
  const range = document.createRange()
  range.selectNodeContents(element)

  // Create a selection to hold the range
  const selection = window.getSelection()
  if (!selection) {
    toast({
      title: "复制失败", 
      description: "浏览器不支持复制功能",
      variant: "destructive"
    })
    return
  }

  selection.removeAllRanges()
  selection.addRange(range)

  try {
    // Execute the copy command
    document.execCommand('copy')
    toast({
      title: "复制成功",
      description: "文本已复制到剪贴板"
    })
  } catch (error) {
    toast({
      title: "复制失败",
      description: "复制过程中发生错误",
      variant: "destructive" 
    })
  }

  // Clear the selection
  selection.removeAllRanges()
}

const likeAnswer = async (item: questionListType) => {
  try {
    await add_effect_api({
      questionId: item.questionId,
      answerId: item.answerId,
      effect: '1'
    })
    item.effect = '1'
    toast({
      title: "点赞成功",
      description: "感谢您的反馈",
    })
  } catch (err) {
    toast({
      title: "点赞失败", 
      description: "操作过程中发生错误",
      variant: "destructive"
    })
  }
}

const dislikeDialog = (item: questionListType) => {
  itemToDislike.value = item
  dislikeFeedback.value = ''
  showDislikeDialog.value = true
}

const handleDislike = async () => {
  if (itemToDislike.value && dislikeFeedback.value) {
    try {
      await add_effect_api({
        questionId: itemToDislike.value.questionId,
        answerId: itemToDislike.value.answerId,
        effect: '2',
        effectContent: dislikeFeedback.value
      })
      itemToDislike.value.effect = '2'
      toast({
        title: "反馈成功",
        description: "感谢您的反馈",
      })
      showDislikeDialog.value = false
      itemToDislike.value = null
    } catch (err) {
      toast({
        title: "反馈失败",
        description: "操作过程中发生错误", 
        variant: "destructive"
      })
    }
  }
}

const showDeleteDialog = (item: questionListType) => {
  itemToDelete.value = item
  showDialog.value = true
}

const handleDelete = () => {
  if (itemToDelete.value) {
    delete_question_api({
      question_id: itemToDelete.value.questionId
    }).then(() => {
      get_questionlist()
      showDialog.value = false
      itemToDelete.value = null
    })
  }
}

const recover_params = (params: any) => {
  askButtonRef.value?.recover_params(params)
}

const emits = defineEmits<{
  'update:isSidebarOpen': [payload: boolean]
}>()
const closeSider = () => {
  // 关闭侧边栏
  emits('update:isSidebarOpen', false)
}

onMounted(() => {
  get_questionlist()
})

watch(() => store.channel_id, () => {
  get_questionlist()
  setTimeout(() => {
    scrollToBottom(true)
  }, 600)
})

defineExpose({
  recover_params
})

</script>

<style>
.katex-html {
  display: none;
}

/* Add styles for code copy button */
.markdown-it-code-copy {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.875rem;
  color: white;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  background-color: #374151;
  opacity: 0;
  transition: opacity 0.2s;
}

.markdown-it-code-copy span {
  opacity: 0.75!important;
}

/* Show button on hover */
.prose div:hover > .markdown-it-code-copy {
  opacity: 1;
}

.markdown-it-code-copy:hover {
  /* 鼠标悬停时，按钮背景色为浅黑色*/
  background-color: #222;
}

/* Style for copied state */
.markdown-it-code-copy.success {
  color: #059669;
  background-color: #ecfdf5;
  border-color: #a7f3d0;
}

/* Ensure code blocks have relative positioning */
.prose pre {
  position: relative;
}
</style>