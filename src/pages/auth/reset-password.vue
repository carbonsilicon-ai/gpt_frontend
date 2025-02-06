<script setup lang="ts">
import AuthTitle from '@/components/AuthTitle.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast, ToastProvider } from '@/components/ui/toast'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useRouter } from 'vue-router'
import { useStore } from '@/stores/index.js'

const router = useRouter()
const route = useRoute()
const { token } = route.query
const { toast } = useToast()
const loading = ref(false)

const reset_password_post_api = ref(null)

const loadApi = async () => {
  if (import.meta.env.VITE_APP_ENV === 'private') {
    const { reset_password_post_api: api1 } = await import('@/api/user.js')
    reset_password_post_api.value = api1
  } else {
    const { reset_password_post_api: api2 } = await import('@/api/drugflow_user.js')
    reset_password_post_api.value = api2
  }
}
loadApi()

const formSchema = toTypedSchema(z.object({
  password: z.string()
    .min(8, '密码至少需要8位')
    .regex(/(?=.*[0-9])(?=.*[a-zA-Z])/, '密码必须包含数字和字母'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "确认密码不一致",
  path: ["confirmPassword"],
}))

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    password: '',
    confirmPassword: ''
  }
})

const { handleSubmit } = form

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  try {
    let formData
    if (import.meta.env.VITE_APP_ENV === 'private') {
      formData = {
        new_password1: values.password,
        new_password2: values.confirmPassword,
        token: token
      }
    } else {
      formData = new FormData()
      formData.append('new_password1', values.password)
      formData.append('new_password2', values.confirmPassword)
    }

    const response = await reset_password_post_api.value(token, formData)
    if (response.data.success === true) {
      toast({
        title: "成功",
        description: "密码设置成功",
      })
      setTimeout(() => {
        router.push('/auth/sign-in')
      }, 1000)
    } else {
      toast({
        variant: "destructive",
        title: "错误",
        description: response.data.message
      })
    }
  } catch (err) {
    toast({
      variant: "destructive",
      title: "错误",
      description: "重置密码失败"
    })
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <ToastProvider>
    <div class="flex items-center justify-center min-h-screen p-4 min-w-screen">
      <main class="w-96 flex flex-col gap-4">
        <AuthTitle />
        <Card>
          <CardHeader>
            <CardTitle class="text-2xl">
              重置密码
            </CardTitle>
            <CardDescription>
              请设置您的新密码。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form @submit="onSubmit" class="grid gap-4">
              <FormField 
                v-slot="{ componentField }" 
                name="password"
              >
                <FormItem>
                  <FormLabel>新密码</FormLabel>
                  <FormControl>
                    <Input
                      v-bind="componentField"
                      type="password"
                      placeholder="密码至少8位，数字加字母"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField 
                v-slot="{ componentField }" 
                name="confirmPassword"
              >
                <FormItem>
                  <FormLabel>确认密码</FormLabel>
                  <FormControl>
                    <Input
                      v-bind="componentField"
                      type="password"
                      placeholder="请再次输入密码"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <Button type="submit" class="w-full" :disabled="loading">
                {{ loading ? '提交中...' : '确认' }}
              </Button>
            </form>
          </CardContent>
          <CardFooter class="flex flex-col gap-2">
            <div class="text-center text-sm text-muted-foreground">
              返回
              <Button
                variant="link"
                class="px-0 font-medium text-primary hover:text-primary/80"
                @click="$router.push('/auth/sign-in')"
              >
                登录
              </Button>
            </div>
          </CardFooter>
        </Card>
      </main>
      <Toast />
    </div>
  </ToastProvider>
</template>

<route lang="yaml">
meta:
  layout: blank
</route>
