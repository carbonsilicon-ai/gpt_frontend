<template>
   <GPT_Page>
      <!-- 显示图片 -->
      <div v-if="own_img" class="h-[100vh] w-[calc(100vw-3.5rem)] flex">
         <img :src="own_img" class="w-full h-full object-contain" />
      </div>

      <!-- 显示pdf -->
      <div v-else class="h-[100vh] w-[calc(100vw-3.5rem)] flex">
         <div class="w-1/2 h-full overflow-auto">
            <div v-if="pdfLoading" class="h-full flex items-center justify-center">
               <div class="flex flex-col items-center gap-2">
                  <Loader2 class="h-8 w-8 animate-spin" />
                  <p class="text-sm text-muted-foreground">Loading PDF...</p>
               </div>
            </div>
            <div v-else-if="pdfError" class="h-full flex items-center justify-center">
               <div class="flex flex-col items-center gap-2">
                  <AlertCircle class="h-8 w-8 text-destructive" />
                  <p class="text-sm text-destructive">Failed to load PDF</p>
                  <Button variant="outline" size="sm" @click="download_pdf">
                     Retry
                  </Button>
               </div>
            </div>
            <VuePdfEmbed v-else :source="own_doc" v-if="own_doc" />
         </div>
         <div class="w-1 h-full bg-gray-200 cursor-col-resize"></div>
         <div class="w-1/2 h-full overflow-auto">
            <div class="flex justify-between items-center p-2 border-b">
               <h2 class="text-lg font-semibold">解析结果</h2>
               <Button variant="default" size="sm" @click="translate_markdown">
                  {{ show_ori_markdown ? '点击翻译' : '返回原文' }}
               </Button>
            </div>
            <Separator />
            <div v-show="show_ori_markdown">
               <div v-if="markdownLoading" class="h-full flex items-center justify-center">
                  <div class="flex flex-col items-center gap-2">
                     <Loader2 class="h-8 w-8 animate-spin" />
                     <p class="text-sm text-muted-foreground">Loading content...</p>
                  </div>
               </div>
               <div v-else-if="markdownError" class="h-full flex items-center justify-center">
                  <div class="flex flex-col items-center gap-2">
                     <AlertCircle class="h-8 w-8 text-destructive" />
                     <p class="text-sm text-destructive">Failed to load content</p>
                     <Button variant="outline" size="sm" @click="get_markdown">
                        Retry
                     </Button>
                  </div>
               </div>
               <markdown-viewer v-else :content="markdown_content" />
            </div>
            <div v-show="!show_ori_markdown">
               <markdown-translate-viewer :content="markdown_content" ref="trans_ref"/>
            </div>
         </div>
      </div>


   </GPT_Page>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import GPT_Page from '@/components/Layout/GPT_Page.vue'
import { ref } from 'vue'
import { useToast } from '@/components/ui/toast'
import VuePdfEmbed, { useVuePdfEmbed } from 'vue-pdf-embed'
// import PdfViewer from './components/pdf_viewer.vue'
import MarkdownViewer from './components/markdown_viewer.vue'
import MarkdownTranslateViewer from './components/markdown_translate_viewer.vue'
import { get_doc_markdown_api, open_knowledge_api } from '@/api/common.js'
import { Loader2, AlertCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const route = useRoute()
const docId = route.query.docId
const if_img = route.query?.if_img
const own_img = ref(null)

const markdown_content = ref('## 这里是Markdown解析器\n\n文档仍在解析中，请在解析完成后查看结果')
const { toast } = useToast()

const pdfLoading = ref(true)
const pdfError = ref(false)
const markdownLoading = ref(true)
const markdownError = ref(false)
const show_ori_markdown = ref(true)
const first_translate = ref(true)
const trans_ref = ref(null)

const translate_markdown = () => {
  show_ori_markdown.value = !show_ori_markdown.value
  if (first_translate.value) {
    first_translate.value = false
    trans_ref.value.split_content()
    trans_ref.value.translate_content_continue()
  }
}

const get_markdown = () => {
  markdownLoading.value = true
  markdownError.value = false
  
  get_doc_markdown_api(docId as string)
    .then(res => {
      if (res.data?.data?.markdown) {
        markdown_content.value = res.data.data.markdown
      }
    })
    .catch(() => {
      markdownError.value = true
      toast({
        title: "Error",
        description: "Markdown 获取失败",
        variant: "destructive"
      })
    })
    .finally(() => {
      markdownLoading.value = false
    })
}
const own_doc = ref(null)

const download_pdf = () => {
  pdfLoading.value = true
  pdfError.value = false

  open_knowledge_api(docId as string)
    .then(res => {
      if (if_img) {
        // Handle image file
        const blob = new Blob([res.data], { type: "image/jpeg" }) // or appropriate image type
        own_img.value = window.URL.createObjectURL(blob)
        return
      }
      // Handle PDF file
      const blob = new Blob([res.data], { type: "application/pdf" })
      const file = new File([blob], 'pdf.pdf', { type: blob.type })
      
      const base64 = window.URL.createObjectURL(file)
      const { doc } = useVuePdfEmbed({ source: base64 })
      own_doc.value = doc
    })
    .catch(() => {
      pdfError.value = true
      toast({
        title: "Error",
        description: "下载失败",
      })
    })
    .finally(() => {
      pdfLoading.value = false
    })
}

get_markdown()
download_pdf()
</script>

<route lang="yaml">
   meta:
     layout: blank
 </route>