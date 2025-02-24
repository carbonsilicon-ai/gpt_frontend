<template>
  <div 
    class="prose max-w-none dark:prose-invert prose-pre:bg-gray-700 prose-pre:border prose-pre:border-border prose-pre:rounded-lg 
          prose-table:border prose-table:border-collapse prose-td:border prose-td:border-border prose-td:p-2
          prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-muted/50 max-w-none dark:prose-invert p-3"
    v-html="marked.render(trans_content)"
  ></div>
  <!-- 显示按钮 翻译中或者翻译更多 -->
  <div class="flex justify-center mb-2">
    <Button size="sm" v-if="!is_translating && !end_translating" @click="translate_content_continue">翻译更多</Button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { translate_content_api } from '@/api/common.js'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import markdownit from 'markdown-it'
import markdownitExternalLink from 'markdown-it-external-link'
import hljs from 'highlight.js'
import mk from '@xtthaop/markdown-it-katex'

const { toast } = useToast()
const is_translating = ref(true)
const end_translating = computed(() => {
  return content_list.value.every(item => item.translate_content)
})

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
    return '';
  }
})

marked.use(markdownitExternalLink, {
  'hosts': [
    'https://ai.drugflow.com',
    'https://aidev.drugflow.com', 
    'https://dev.drugflow.com',
    'http://dev.drugflow.com',
  ]
});

marked.use(mk);

const props = defineProps({
  content: {
    type: String,
    required: true
  }
})

// 将translate_content拼接起来
const trans_content = computed(() => {
  return content_list.value.map(item => item.translate_content).join('')
})

namespace Content {
  export interface Content {
    content: string
    translate_content: string
    context: string
    index: number
  }
}
const content_list = ref<Content.Content[]>([])
// 将content按照500个字分成多个字符串
const split_content = () => {
  const content = props.content
  const lines = content.split('\n')
  
  let currentChunk = ''
  let currentWordCount = 0
  let previousContext = ''
  let inTable = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Check if we're entering or leaving a table
    if (line.trim().startsWith('|')) {
      inTable = true
    } else if (inTable && !line.trim().startsWith('|')) {
      inTable = false
    }
    
    const wordCount = line.trim().split(/\s+/).length
    
    // If in table, keep adding lines until table ends
    if (inTable) {
      currentChunk += (currentChunk ? '\n' : '') + line
      currentWordCount += wordCount
      continue
    }

    // Check if line ends with sentence-ending punctuation
    const isCompleteSentence = /[.!?。！？]$/.test(line.trim())
    
    if (currentWordCount + wordCount > 700 && isCompleteSentence) {
      // Only split at complete sentences
      if (currentChunk) {
        content_list.value.push({
          content: currentChunk.trim(),
          translate_content: '',
          context: previousContext.slice(-128),
          index: content_list.value.length
        })
      }
      previousContext = currentChunk
      currentChunk = line
      currentWordCount = wordCount
    } else {
      // Keep building current chunk
      currentChunk += (currentChunk ? '\n' : '') + line
      currentWordCount += wordCount
      
      // If we're over 400 words and hit a sentence end, consider splitting
      if (currentWordCount > 400 && isCompleteSentence && !inTable) {
        content_list.value.push({
          content: currentChunk.trim(),
          translate_content: '',
          context: previousContext.slice(-128),
          index: content_list.value.length
        })
        previousContext = currentChunk
        currentChunk = ''
        currentWordCount = 0
      }
    }
  }

  // Push final chunk if not empty
  if (currentChunk) {
    content_list.value.push({
      content: currentChunk.trim(), 
      translate_content: '',
      context: previousContext.slice(-128),
      index: content_list.value.length
    })
  }
}

// 持续翻译内容 使用promise all请求三个没翻译过的内容
const translate_content_continue = async () => {
  is_translating.value = true
  // 找到所有未翻译的内容
  const untranslated = content_list.value.filter(item => !item.translate_content)
  
  // 如果没有未翻译的内容，返回
  if (untranslated.length === 0) {
    return
  }

  // 每次取前3个未翻译的内容
  const batch = untranslated.slice(0, 3)
  
  try {
    // 并行翻译这3个内容
    await Promise.all(batch.map(async (item) => {
      // TODO: 调用翻译API
      item.translate_content = '\n\n第' + (item.index + 1) + '部分内容正在翻译中...\n\n\n\n'
      const res = await translate_content_api({ content: item.content, context: item.context })
      item.translate_content = process_translate_content(res.data.translate_content)

    }))
  } catch (error) {
    console.error('Translation failed:', error)
    toast({
        title: "Error",
        description: "Markdown 翻译失败",
        variant: "destructive"
      })
  } finally {
    is_translating.value = false
  }
}

// 处理翻译内容
const process_translate_content = (content: string) => {
  // 如果存在```，则只取```包裹的内容
  if (content.includes('```')) {
    return content.split('```')[1]
  }
  return content
}

defineExpose({
  split_content,
  translate_content_continue
})
</script>