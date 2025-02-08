<template>
  <div class="p-2 space-y-2">
    <div class="text-lg font-semibold px-2">历史会话</div>
    <div class="px-2">
      <div class="relative">
        <Search class="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          class="pl-8"
          placeholder="搜索会话..."
          v-model="search_value"
          @keyup.enter="onSearch"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'

const emit = defineEmits(['search'])

const search_value = ref('')

const onSearch = () => {
  emit('search', search_value.value)
}


</script>
