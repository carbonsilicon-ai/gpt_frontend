<template>
  <div class="px-3 py-1 bg-muted/30 border-b overflow-y-auto max-h-[130px] min-h-[100px]">
    <TabsContent value="knowledge" class="flex flex-wrap gap-1">
      <div v-for="knowledge in knowledgeFolders" :key="knowledge.id"
        class="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-lg text-xs mb-2 w-[24%]"
      >
        <Checkbox 
          :id="knowledge.id"
          :checked="selectedKbs.some(kb => kb.id === knowledge.id)"
          @update:checked="(checked) => toggleKnowledge(checked, knowledge)"
        />
        <label :for="knowledge.id" class="truncate max-w-[100px]">{{ knowledge.name }}</label>
      </div>
    </TabsContent>
  </div>
</template>

<script setup lang="ts">
import { TabsContent } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast'

interface KnowledgeBase {
  id: string
  name: string
}

const { toast } = useToast()

const props = defineProps<{
  knowledgeFolders: KnowledgeBase[]
  selectedKbs: KnowledgeBase[]
}>()

const emit = defineEmits<{
  'update:selectedKbs': [kbs: KnowledgeBase[]]
}>()

const toggleKnowledge = (checked: boolean, knowledge: KnowledgeBase) => {
  const currentSelected = [...props.selectedKbs]
  if (checked) {
    if (currentSelected.length < 2) {
      currentSelected.push(knowledge)
    } else {
      toast({
        title: "选择限制",
        description: "最多只能选择2个知识库",
        variant: "destructive"
      })
      return
    }
  } else {
    const index = currentSelected.findIndex(kb => kb.id === knowledge.id)
    if (index > -1) {
      currentSelected.splice(index, 1)
    }
  }
  emit('update:selectedKbs', currentSelected)
}
</script> 