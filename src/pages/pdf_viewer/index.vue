<template>
   <GPT_Page>
   <div class="h-[100vh] w-[calc(100vw-3.5rem)] flex">
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
         <VuePdfEmbed v-else :source="onw_doc" v-if="onw_doc" />
      </div>
      <div class="w-1 h-full bg-gray-200 cursor-col-resize" @mousedown="startResize"></div>
      <div class="w-1/2 h-full overflow-auto">
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
import { get_doc_markdown_api, open_knowledge_api } from '@/api/common.js'
import { Loader2, AlertCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const route = useRoute()
const docId = route.query.docId

const markdown_content = ref('## 这里是Markdown解析器\n\n文档仍在解析中，请在解析完成后查看结果')
const { toast } = useToast()

const pdfLoading = ref(true)
const pdfError = ref(false)
const markdownLoading = ref(true)
const markdownError = ref(false)

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
const onw_doc = ref(null)

const download_pdf = () => {
  pdfLoading.value = true
  pdfError.value = false

  open_knowledge_api(docId as string)
    .then(res => {
      const blob = new Blob([res.data], { type: "application/pdf" })
      const file = new File([blob], 'pdf.pdf', { type: blob.type })
      const base64 = window.URL.createObjectURL(file)
      const { doc } = useVuePdfEmbed({ source: base64 })
      onw_doc.value = doc
    })
    .catch(() => {
      pdfError.value = true
      toast({
        title: "Error",
        description: "PDF 下载失败",
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