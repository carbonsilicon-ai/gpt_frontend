<template>
  <div 
    class="prose max-w-none dark:prose-invert prose-pre:bg-gray-700 prose-pre:border prose-pre:border-border prose-pre:rounded-lg 
          prose-table:border prose-table:border-collapse prose-td:border prose-td:border-border prose-td:p-2
          prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-muted/50 max-w-none dark:prose-invert p-3"
    v-html="marked.render(content)"
  ></div>
</template>

<script setup lang="ts">
const props = defineProps({
  content: {
    type: String,
    default: '## 这里是Markdown解析器\n\n文档仍在解析中，请在解析完成后查看结果',
  },
})

import markdownit from 'markdown-it'
import markdownitExternalLink from 'markdown-it-external-link'
import hljs from 'highlight.js'
import mk from '@xtthaop/markdown-it-katex'

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
</script>

<style>
.katex-html {
  display: none;
}
</style>
