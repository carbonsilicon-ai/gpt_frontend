<template>
  <div class="p-2 space-y-2">
    <div class="flex items-center px-2">
      <div class="text-lg font-semibold mr-8">知识库</div>
      <div class="flex-1 relative">
        <Search class="h-4 w-4 absolute left-2 top-2 text-muted-foreground" />
        <Input placeholder="搜索知识库..." class="h-8 text-sm pl-8" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-vue-next'
</script>
