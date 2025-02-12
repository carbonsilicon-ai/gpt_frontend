<template>
  <div class="flex items-center justify-center min-h-screen p-4 min-w-screen">
    <main class="flex flex-col gap-4">
      <AuthTitle />
      <Card class="w-full max-w-sm">
        <CardHeader>
          <CardTitle class="text-2xl">
            {{ show_message }}
          </CardTitle>
          <CardDescription class="">
            请稍后，验证完成后将自动跳转至登录页面
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref } from 'vue'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import AuthTitle from '@/components/AuthTitle.vue'

import { useToast } from '@/components/ui/toast'

const route = useRoute()
const router = useRouter()
const { toast } = useToast()
const show_message = ref("验证中")

const activate_api = ref(null)
const reset_password_get_api = ref(null)

const very = () => {
  activate_api.value(route.query.token)
    .then(() => {
      toast({
        title: '验证成功',
        description: '验证成功'
      })
      show_message.value = '验证成功'
      setTimeout(() => {
        router.push('/auth/sign-in')
      }, 1000)
    })
    .catch((res) => {
      if (res.response.status === 400) {
        toast({
          title: '验证失败',
          description: res.response.data.detail || '激活邮件已过期'
        })
        show_message.value = res.response.data.detail || '激活邮件已过期'
      } else {
        toast({
          title: '未知错误',
          description: '未知错误'
        })
        show_message.value = '未知错误'
      }
    })
  
}

const loadApi = async () => {
  if (import.meta.env.VITE_APP_ENV === 'private') {
    const { activate_api: api1, reset_password_get_api: code1} = await import('@/api/user.js')
    activate_api.value = api1
    reset_password_get_api.value = code1
  } else {
    const { activate_api: api2, reset_password_get_api: code2 } = await import('@/api/drugflow_user.js')
    activate_api.value = api2
    reset_password_get_api.value = code2
  }
  very()
}

loadApi()

</script>

<route lang="yaml">
  meta:
    layout: blank
</route>