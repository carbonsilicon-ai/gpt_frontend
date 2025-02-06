<template>
  <div class="relative w-full max-w-[320px] h-12 bg-secondary rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
    <!-- 背景文字 -->
    <div 
      class="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground transition-opacity duration-300"
      :class="{ 'opacity-0': isDragging }"
    >
      <span class="select-none">
        {{ verified ? '验证成功' : '向右拖动滑块完成验证' }}
      </span>
    </div>
    
    <!-- 已验证的背景 -->
    <div 
      class="absolute inset-0 bg-primary/10 transition-all duration-300 ease-out"
      :style="{ width: `${progress}%` }"
    />
    
    <!-- 可拖动的滑块 -->
    <div
      ref="sliderRef"
      class="absolute left-0 top-0 h-full w-12 bg-primary cursor-pointer rounded-lg flex items-center justify-center transition-all duration-300 ease-out shadow-md hover:shadow-lg"
      :class="{ 
        'bg-primary/80': isDragging,
        'bg-success hover:bg-success/90': verified,
        'hover:bg-primary/90': !verified && !isDragging
      }"
      @mousedown="startDrag"
      :style="{ left: `${progress}%` }"
    >
      <CheckIcon v-if="verified" class="text-white w-5 h-5 animate-appear" />
      <MoveHorizontalIcon v-else class="text-white w-5 h-5 animate-pulse" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { CheckIcon, MoveHorizontalIcon } from 'lucide-vue-next'

const props = defineProps({
  onSuccess: {
    type: Function,
    default: () => {}
  }
})

const sliderRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const progress = ref(0)
const verified = ref(false)

const startDrag = (e: MouseEvent) => {
  if (verified.value) return
  isDragging.value = true
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value || !sliderRef.value) return
  
  const container = sliderRef.value.parentElement as HTMLElement
  const containerRect = container.getBoundingClientRect()
  const sliderWidth = sliderRef.value.offsetWidth
  
  let newProgress = ((e.clientX - containerRect.left - sliderWidth / 2) / 
    (containerRect.width - sliderWidth)) * 100
  
  newProgress = Math.max(0, Math.min(100, newProgress))
  progress.value = newProgress
  
  if (newProgress >= 98) {
    verified.value = true
    isDragging.value = false
    props.onSuccess()
  }
}

const stopDrag = () => {
  if (!verified.value) {
    progress.value = 0
  }
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})
</script>
