<template>
  <div class="flex flex-col h-screen bg-muted/40">
    <!-- Main content area with flex-grow to push button to bottom -->
    <div class="flex-grow w-full px-4 md:px-8 py-6 flex items-center">
      <div class="max-w-4xl mx-auto">
        <div class="text-[#162448]">
          <div class="flex flex-col items-center">
            <div class="text-lg">👋 Hi, {{ store.username }}</div>
            <div v-if="store.if_ldap" class="mt-2 text-2xl font-medium">
              您好！我是齐鲁大脑，有什么问题我们随时交流
            </div>
            <div v-else class="mt-2 text-2xl font-medium">
              我是SciGPT，您的科研助理。有什么问题我们随时交流
            </div>
            <div class="text-sm text-muted-foreground mt-2">
              我可以帮助您解读文献、回答问题、提供科研建议等。
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mt-6 w-full max-w-4xl">
              <Card class="rounded-2xl hover:shadow-md transition-shadow">
                <CardContent class="pt-6">
                  <div class="w-[64px] h-[64px] bg-accent rounded-xl p-2">
                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#e0620d" d="M881.777778 765.155556c-76.8-5.688889-150.755556-34.133333-210.488889-85.333334-116.622222 25.6-227.555556 62.577778-338.488889 108.088889-88.177778 156.444444-170.666667 236.088889-241.777778 236.088889-14.222222 0-31.288889-2.844444-42.666666-11.377778C17.066667 998.4 0 967.111111 0 935.822222c0-25.6 5.688889-96.711111 275.911111-213.333333 62.577778-113.777778 110.933333-230.4 150.755556-352.711111-34.133333-68.266667-108.088889-236.088889-56.888889-321.422222C386.844444 17.066667 420.977778 0 457.955556 2.844444c28.444444 0 56.888889 14.222222 73.955555 36.977778 36.977778 51.2 34.133333 159.288889-14.222222 318.577778 45.511111 85.333333 105.244444 162.133333 176.355555 227.555556 59.733333-11.377778 119.466667-19.911111 179.2-19.911112 133.688889 2.844444 153.6 65.422222 150.755556 102.4 0 96.711111-93.866667 96.711111-142.222222 96.711112zM85.333333 941.511111l8.533334-2.844444c39.822222-14.222222 71.111111-42.666667 93.866666-79.644445-42.666667 17.066667-76.8 45.511111-102.4 82.488889z m378.311111-853.333333H455.111111c-2.844444 0-8.533333 0-11.377778 2.844444-11.377778 48.355556-2.844444 99.555556 17.066667 145.066667 17.066667-48.355556 17.066667-99.555556 2.844444-147.911111z m19.911112 412.444444l-2.844445 5.688889-2.844444-2.844444c-25.6 65.422222-54.044444 130.844444-85.333334 193.422222l5.688889-2.844445v5.688889c62.577778-22.755556 130.844444-42.666667 193.422222-56.888889l-2.844444-2.844444h8.533333c-42.666667-42.666667-82.488889-91.022222-113.777777-139.377778z m386.844444 150.755556c-25.6 0-48.355556 0-73.955556 5.688889 28.444444 14.222222 56.888889 19.911111 85.333334 22.755555 19.911111 2.844444 39.822222 0 56.888889-5.688889 0-8.533333-11.377778-22.755556-68.266667-22.755555z"/>
                    </svg>
                  </div>
                  <h3 class="font-medium mt-4">精准PDF解析</h3>
                  <p class="text-sm text-muted-foreground mt-2">采用多个模型高精度还原PDF</p>
                </CardContent>
              </Card>

              <Card class="rounded-2xl hover:shadow-md transition-shadow">
                <CardContent class="pt-6">
                  <div class="w-[64px] h-[64px] bg-accent rounded-xl p-2">
                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#1296db" d="M563.2 819.2a102.4 102.4 0 1 1 0 204.8 102.4 102.4 0 0 1 0-204.8z m-320.4608-153.6a128 128 0 1 1 0 256 128 128 0 0 1 0-256z m592.7936 25.6a102.4 102.4 0 1 1 0 204.8 102.4 102.4 0 0 1 0-204.8zM947.2 477.1328a76.8 76.8 0 1 1 0 153.6 76.8 76.8 0 0 1 0-153.6zM128 307.2a128 128 0 1 1 0 256 128 128 0 0 1 0-256z m782.6432-40.6016a51.2 51.2 0 1 1 0 102.4 51.2 51.2 0 0 1 0-102.4zM409.6 0a153.6 153.6 0 1 1 0 307.2 153.6 153.6 0 0 1 0-307.2z m384 153.6a25.6 25.6 0 1 1 0 51.2 25.6 25.6 0 0 1 0-51.2z"/>
                    </svg>
                  </div>
                  <h3 class="font-medium mt-4">智能联网搜索</h3>
                  <p class="text-sm text-muted-foreground mt-2">智能联网，快速响应</p>
                </CardContent>
              </Card>

              <Card class="rounded-2xl hover:shadow-md transition-shadow">
                <CardContent class="pt-6">
                  <div class="w-[64px] h-[64px] bg-accent rounded-xl p-2">
                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#7f18f3" d="M120.32 532.48v-7.68c133.12-5.12 220.16-43.52 256-110.08C432.64 307.2 332.8 151.04 332.8 148.48l5.12-2.56c0 2.56 102.4 161.28 43.52 273.92-38.4 69.12-125.44 107.52-261.12 112.64z"/>
                      <path fill="#7f18f3" d="M366.08 883.2l-5.12-2.56c53.76-128 58.88-220.16 12.8-279.04-71.68-94.72-250.88-64-253.44-64v-5.12c2.56 0 184.32-30.72 261.12 66.56 46.08 58.88 40.96 153.6-15.36 284.16z"/>
                      <path fill="#7f18f3" d="M373.76 883.2l-5.12-2.56c0-2.56 51.2-179.2 176.64-215.04 81.92-23.04 176.64 15.36 281.6 117.76l-5.12 5.12c-102.4-97.28-194.56-138.24-273.92-115.2-125.44 33.28-174.08 207.36-174.08 209.92z"/>
                    </svg>
                  </div>
                  <h3 class="font-medium mt-4">专属知识助手</h3>
                  <p class="text-sm text-muted-foreground mt-2">多路召回，精确回答</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fixed bottom button -->
    <div class="w-full px-4 md:px-8 py-4">
      <div class="max-w-4xl mx-auto">
        <ask_button :docIds="props.docIds" />
      </div>
    </div>
  </div>
  <avatar />
</template>

<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import ask_button from '@/pages/ask/ask_button.vue'
import { useStore } from '@/stores/index.js'
import avatar from '@/pages/ask/components/avatar.vue'

const store = useStore()

const props = defineProps({
  docIds: {
    type: Array as PropType<string[]>,
    default: () => []
  }
})

</script>