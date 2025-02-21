<template>
  <div class="relative flex items-center justify-center text-muted-foreground text-sm rounded-lg overflow-hidden"
    :style="{ width: width, height: height }"
  >
    <div v-if="!request_cpld" class="w-full h-full flex items-center justify-center">
      <Skeleton class="h-4 w-full" />
    </div>
    <div v-else>
      <div 
        v-if="if_svg && !if_broken_smiles"
        class="w-full h-full flex items-center justify-center"
        :style="{ width: width, height: height }" 
        v-html="svg"
      />
      <p 
        v-else
        class="text-center w-20 m-2.5 text-muted-foreground/80 font-medium"
      >
        {{ placeholder }}
      </p>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { draw_svg_api } from '@/api/common.js'
import { Skeleton } from '@/components/ui/skeleton'

// Props definition
const props = defineProps({
  smiles: {
    type: String,
    default: 'C1=CCC(c2cccc(-c3ccccc3)c2)=C1'
  },
  width: {
    type: String,
    default: 'auto'
  },
  height: {
    type: String,
    default: 'auto'
  },
  smarts: {
    type: String,
    default: ''
  },
  if_wait: {
    type: Boolean,
    default: false
  },
  if_atom_index: {
    type: Boolean,
    default: false
  },
  bond_width: {
    type: Number,
    default: 2
  },
  if_smarts: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: 'draw svg failed'
  }
})

// Reactive references
const svg = ref('')
const if_svg = ref(false)
const request_cpld = ref(false)
const if_broken_smiles = ref(false)
const placeholder = ref('Waiting...')

const check_smiles = (smiles) => {
  if (smiles.includes('v2000') || smiles.includes('v3000') || smiles.includes('V2000') || smiles.includes('V3000')) {
    return true
  }
  // 如果存在三个及以上'.'，则认为smiles不合法
  if (smiles.split('.').length > 3) {
    return false
  }
  return true
}

const draw_by_rdkit_end = () => {
  if (!check_smiles(props.smiles)) {
    if_broken_smiles.value = true
    placeholder.value = '蛋白配体键预测失败，无法2D展示'
    return
  }
  const formdata = {
    smiles: props.smiles
  }
  // const config = {
  //   smarts: props.smarts,
  //   bond_width: props.bond_width,
  //   show_index: props.if_atom_index
  // }
  // formdata.append('config', JSON.stringify(config))
  draw_svg_api(formdata)
    .then(res => {
      let s = res.data.data
      // s = s.replace(/250px/g, props.width)
      // s = s.replace(/200px/g, props.height)
      s = s.replace(/opacity:1.0/g, 'opacity:0')
      svg.value = s
      if_svg.value = true
    })
    .catch(err => {
      console.error(err)
      if_svg.value = false
      placeholder.value = props.error
    })
    .finally(() => {
      request_cpld.value = true
    })
}

// Watch for changes
watch([() => props.smiles, () => props.smarts, () => props.width, () => props.error], () => {
  draw_by_rdkit_end()
})

// Mounted hook equivalent
draw_by_rdkit_end()
</script>

<style lang="css" scoped></style>
