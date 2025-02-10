<template>
  <div 
    class="prose max-w-none dark:prose-invert prose-pre:bg-gray-700 prose-pre:border prose-pre:border-border prose-pre:rounded-lg 
          prose-table:border prose-table:border-collapse prose-td:border prose-td:border-border prose-td:p-2
          prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-muted/50 max-w-none dark:prose-invert p-3"
    v-html="marked.render(trans_content)"
  ></div>
  <!-- 显示按钮 翻译中或者翻译更多 -->
  <div class="flex justify-center">
    <Button size="sm" v-if="is_translating" @click="translate_content_continue">翻译中...</Button>
    <Button size="sm" v-else @click="translate_content_continue">{{ end_translating ? '翻译完成' : '翻译更多' }}</Button>
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
  }
}
const content_list = ref<Content.Content[]>([])
// 将content按照500个字分成多个字符串
const split_content = () => {
  const content = props.content
  // Split content by newlines
  const lines = content.split('\n')
  
  let currentChunk = ''
  let currentWordCount = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const wordCount = line.trim().split(/\s+/).length
    
    if (currentWordCount + wordCount > 700) {
      // Current chunk would exceed max, push it and start new chunk
      if (currentChunk) {
        content_list.value.push({
          content: currentChunk.trim(),
          translate_content: ''
        })
      }
      currentChunk = line
      currentWordCount = wordCount
    } else if (currentWordCount + wordCount < 400 || currentChunk === '') {
      // Add to current chunk if under min or empty
      currentChunk += (currentChunk ? '\n' : '') + line
      currentWordCount += wordCount
    } else {
      // Between 400-700 words, push chunk and start new
      content_list.value.push({
        content: currentChunk.trim(),
        translate_content: ''
      })
      currentChunk = line
      currentWordCount = wordCount
    }
  }

  // Push final chunk if not empty
  if (currentChunk) {
    content_list.value.push({
      content: currentChunk.trim(), 
      translate_content: ''
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
      const res = await translate_content_api({ content: item.content })
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