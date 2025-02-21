<!-- 分子卡片 -->
<template>
  <div v-if="mol_data?.smiles" class="pt-4">
    <div class="mol-card flex gap-4 p-4 border rounded-lg">
      <!-- 左边显示分子svg -->
      <div class="mol-svg w-[250px] h-[200px] flex-shrink-0">
        <svg_box v-if="mol_data?.smiles" :smiles="mol_data.smiles" :width="250" :height="200" />
      </div>

      <!-- 右边显示分子信息 -->
      <div class="mol-info flex-1">
        <!-- 右边上部分显示标题和信息来源和下载按钮 -->
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-lg font-medium">{{ mol_data?.smiles || 'Unknown Molecule' }}</h3>
            <p class="text-sm text-primary font-semibold">由DrugFlow提供</p>
          </div>
          <TooltipProvider :delay-duration="100">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" asChild @click="downloadMolecule(mol_data.mol_id)" class="p-2 cursor-pointer">
                  <Download class="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>下载分子全部数据</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <!-- 右边下部分显示分子信息 -->
        <div class="flex flex-wrap gap-2">
          <div v-if="mol_data?.name" class="text-sm w-full">
            <span class="font-semibold text-primary">Name: </span>
            <span class="break-all">{{ mol_data.name }}</span>
          </div>
          <div 
            v-for="item in properties" 
            :key="item.value" 
            class="text-sm w-[calc(50%-8px)] hover:bg-muted/50 transition-colors"
          >
            <span class="font-semibold text-primary">{{ item.label }}: </span>
            <span>{{ typeof mol_data[item.value] === 'number' ? Number(mol_data[item.value]).toFixed(3) : mol_data[item.value] }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">

import { computed } from 'vue'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-vue-next"
import svg_box from '@/components/molecule/svg_box.vue'
import { useRouter } from 'vue-router'
interface ItemData {
  content: string
  answerStatus: number
  intends: number
  kb_ids: string[]
}

const props = defineProps<{
  item_data?: ItemData
}>()

const properties = computed(() => {
  // {"MW": 126.104465068, "Volume": 144.52164979460716, "Density": 0.8725645275100201, "nHA": 1, "nHD": 0, "nRot": 1, "nRing": 1, "MaxRing": 6, "nHet": 1, "fChar": 0, "nRig": 7, "Flexibility": 0.14285714285714285, "Stereo Centers": 2, "TPSA": 17.07, "smi": "C1CC(C=O)CC(C)C1", "Ames": 4.1557118493074086e-06, "BBB": 0.9937463998794556, "Carcinogenicity": 9.532742842566222e-05, "CYP1A2-inh": 0.0005506488960236311, "CYP1A2-sub": 0.0010684910230338573, "CYP2C19-inh": 1.1058299378419179e-06, "CYP2C19-sub": 0.00014212497626431286, "CYP2C9-inh": 6.79612014664599e-07, "CYP2C9-sub": 0.018285486847162247, "CYP2D6-inh": 2.2828824512544088e-05, "CYP2D6-sub": 0.9820231795310974, "CYP3A4-inh": 7.719182576693129e-06, "CYP3A4-sub": 1.7517100786790252e-05, "DILI": 0.001768262474797666, "EC": 0.9990179538726807, "EI": 0.9999985694885254, "F(20%)": 0.9988754391670227, "F(50%)": 0.8786325454711914, "FDAMDD": 9.184759255731478e-05, "hERG": 8.69316681928467e-06, "H-HT": 9.921098535414785e-05, "HIA": 0.9996607303619385, "MLM": 0.9483779668807983, "NR-AhR": 3.5291867206410643e-09, "NR-AR": 5.544145142977186e-10, "NR-AR-LBD": 1.683697092857983e-08, "NR-Aromatase": 6.4693779222579906e-09, "NR-ER": 1.8244933016831055e-05, "NR-ER-LBD": 1.9952366425712853e-09, "NR-PPAR-gamma": 5.86293218418632e-08, "Pgp-inh": 0.0007785677444189787, "Pgp-sub": 0.030367495492100716, "Respiratory": 0.7626177668571472, "ROA": 4.10974765330252e-09, "SkinSen": 0.994675874710083, "SR-ARE": 7.132142654242557e-10, "SR-ATAD5": 2.4597692771521906e-09, "SR-HSE": 2.783996933430899e-06, "SR-MMP": 2.404686672008438e-09, "SR-p53": 1.0917646875441278e-07, "T12": 0.9710361957550049, "BCF": 0.5689605474472046, "Caco-2": -4.456677436828613, "CL": 9.215085983276367, "Fu": 0.5226426720619202, "IGC50": 2.9857215881347656, "LC50": 3.8661136627197266, "LC50DM": 4.316943645477295, "LogD": 1.9872549772262573, "LogP": 2.2281570434570312, "LogS": -2.0860347747802734, "MDCK": -4.509794235229492, "PPB": 0.6044835448265076, "VDss": 1.043135643005371, "QED": 0.4910681698496968, "SAscore": 3.3497472829912427, "Fsp3": 0.875, "MCE-18": 14.0, "NPscore": 0.8872144210987556, "smiles": "C1CC(C=O)CC(C)C1", "name": "3-methylcyclohexane-1-carbaldehyde", "cas": "13076-16-9", "if_patent": "{'C1CC(C=O)CC(C)C1': 'Patented'}", "inchi_key": "VKKKNBBQMSBFCV-UHFFFAOYSA-N", "inchi": "InChI=1S/C8H14O/c1-7-3-2-4-8(5-7)6-9/h6-8H,2-5H2,1H3"}

  return [
    { label: 'Weight', value: 'MW' },
    { label: 'LogD', value: 'LogD' },
    { label: 'LogP', value: 'LogP' },
    { label: 'LogS', value: 'LogS' },
    { label: 'QED', value: 'QED' },
    { label: 'SAscore', value: 'SAscore' },
    { label: 'MCE-18', value: 'MCE-18' },
    { label: 'NPscore', value: 'NPscore' },
  ]
})

const mol_data = computed(() => {
  // 获取<not_show>和</not_show>之间的内容
  const content = props.item_data?.content
  if (!content) {
    return {}
  }
  const start = content.indexOf('<not_show>')
  const end = content.indexOf('</not_show>')
  if (start === -1 || end === -1) {
    return {}
  }
  try {
    const mol_str = content.substring(start + 10, end)
    const mol_data = JSON.parse(mol_str)
    return mol_data
  } catch (error) {
    return {}
  }
})

const router = useRouter()
const downloadMolecule = (mol_id: string) => {
  const base_url = router.currentRoute.value.path
  const url = `${base_url}/api/v1/mol/download_mol_info?mol_id=${mol_id}`
  console.log(url)
  // 创建a标签
  const a = document.createElement('a')
  a.href = url
  a.download = `${mol_id}.csv`
  a.click()
  // 删除a标签
  document.body.removeChild(a)
}

</script>

<style scoped>
.mol-card {
  background-color: white;
}

.mol-svg {
  background-color: #f8f9fa;
  border-radius: 0.5rem;
}
</style>