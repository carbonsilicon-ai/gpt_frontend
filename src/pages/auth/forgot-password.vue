<script setup lang="ts">
import AuthTitle from '@/components/AuthTitle.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast, ToastProvider } from '@/components/ui/toast'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { isEmail, isMobile } from '@/utils/validate.js'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import dragVerify from './components/dragVerify.vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/stores/index.js'

const router = useRouter()
const store = useStore()
const { toast } = useToast()
const activeTab = ref('phone')
const showVerifyDialog = ref(false)
const loading = ref(false)

// Countdown logic
const count = ref(60)
const codeShow = ref(true)
const timer = ref<any>(null)

const forgot_password_api = ref(null)
const send_code = ref(null)
const verification_api = ref(null)

const loadApi = async () => {
  if (import.meta.env.VITE_APP_ENV === 'private') {
    const { forgot_password_api: api1, send_code: code1, verification_api: sp1} = await import('@/api/user.js')
    forgot_password_api.value = api1
    send_code.value = code1
    verification_api.value = sp1
  } else {
    const { forgot_password_api: api2, send_code: code2, verification_api: sp2 } = await import('@/api/drugflow_user.js')
    forgot_password_api.value = api2
    send_code.value = code2
    verification_api.value = sp2
  }
}
loadApi()

const formSchema = toTypedSchema(z.object({
  telephone: z.string()
    .optional()
    .refine((val) => !val || isMobile(val), {
      message: '请输入正确的手机号'
    }),
  code: z.string().optional(),
  email: z.string()
    .optional()
    .refine((val) => !val || isEmail(val), {
      message: '请输入正确的邮箱'
    })
}).superRefine((data, ctx) => {
  if (activeTab.value === 'phone') {
    if (!data.telephone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '请输入手机号',
        path: ['telephone']
      })
    }
    if (!data.code) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '请输入验证码',
        path: ['code']
      })
    }
  } else if (activeTab.value === 'email') {
    if (!data.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '请输入邮箱',
        path: ['email']
      })
    }
  }
}))

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    telephone: '',
    code: '',
    email: ''
  }
})

const { handleSubmit, isFieldDirty, resetForm } = form

const handleTabChange = (tab: string) => {
  resetForm()
  activeTab.value = tab
}

const handleSendVerifyCode = async () => {
  const phoneRegex = /^1[3-9]\d{9}$/
  const formValues = form.values
  if (!formValues.telephone || !phoneRegex.test(formValues.telephone)) {
    toast({
      variant: "destructive",
      title: "错误",
      description: "请输入正确的手机号"
    })
    return
  }
  showVerifyDialog.value = true
}

const onVerifySuccess = async () => {
  showVerifyDialog.value = false
  
  const TIME_COUNT = 60
  count.value = TIME_COUNT
  codeShow.value = false
  timer.value = setInterval(() => {
    if (count.value > 0 && count.value <= TIME_COUNT) {
      count.value--
    } else {
      codeShow.value = true
      clearInterval(timer.value)
      timer.value = null
    }
  }, 1000)

  let formData
  const formValues = form.values
  if (import.meta.env.VITE_APP_ENV === 'private') {
    formData = {
      'phone': formValues.telephone,
      'country_intl': '86'
    }
  } else {
    formData = new FormData()
    formData.append('phone', formValues.telephone)
    formData.append('country_intl', '86')
  }
  
  try {
    const res = await send_code.value(formData)
    if(res.data.status == true || res.data.success == true){
      console.log(res)
    } else {
      toast({
        variant: "destructive",
        title: "错误",
        description: res.data.message
      })
    }
  } catch (err) {
    toast({
      variant: "destructive",
      title: "错误",
      description: "发送验证码失败"
    })
  }
}

const onSubmit = handleSubmit(async (values) => {
  loading.value = true
  try {
    let formData
    if (activeTab.value === 'phone') {
      if (import.meta.env.VITE_APP_ENV === 'private') {
        formData = {
          'phone': values.telephone,
          'verification_code': values.code
        }
      } else {
        formData = new FormData()
        formData.append('telephone', values.telephone)
        formData.append('verification_code', values.code)
      }
      const res = await verification_api.value(formData)

      if (res.data.detail == 'ok' || res.data.success == true){
        let token = ''
        if (res.data.data) {
          token = res.data.data.token
        } else {
          token = res.data.token
        }
        toast({
          title: "验证成功",
          description: "请重置密码",
        })
        router.push('/auth/reset-password?token=' + token)
      } else {
        toast({
          variant: "destructive",
          title: "验证错误",
          description: res.data.message
        })
      }

    } else {
      if (import.meta.env.VITE_APP_ENV === 'private') {
        formData = {
          'email': values.email
        }
      } else {
        formData = new FormData()
        formData.append('email', values.email)
        if (process.env.NODE_ENV === 'production') {
          formData.append('url', 'https://ai.drugflow.com')
        }
      }
      const response = await forgot_password_api.value(formData)
      if (response.data.detail === 'ok' || response.data.success === true) {
        form.resetForm()
        send_email.value = true
        return toast({
          title: "发送成功",
          description: "重置密码链接已发送到您的邮箱，请查收并按照提示完成密码重置。",
        })
      } 
    }
  } catch (err) {
    const errorMessage = err.response?.data?.message || "操作失败"
    toast({
      variant: "destructive",
      title: "错误",
      description: errorMessage
    })
  } finally {
    loading.value = false
  }
})

const send_email = ref(false)

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
})
</script>

<template>
  <ToastProvider>
    <div class="flex items-center justify-center min-h-screen p-4 min-w-screen">
      <main class="flex flex-col gap-4">
        <AuthTitle />
        <Card v-if="!send_email">
          <CardHeader>
            <CardTitle class="text-2xl">
              忘记密码
            </CardTitle>
            <CardDescription>
              选择您的找回方式，我们将帮助您重置密码。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs v-model="activeTab" class="w-full">
              <TabsList class="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="phone">手机找回</TabsTrigger>
                <TabsTrigger value="email">邮箱找回</TabsTrigger>
              </TabsList>
              <TabsContent value="phone">
                <form @submit="onSubmit" class="grid gap-4">
                  <FormField 
                    v-slot="{ componentField }" 
                    name="telephone"
                    :validate-on-blur="!isFieldDirty('telephone')"
                  >
                    <FormItem>
                      <FormLabel>手机号</FormLabel>
                      <div class="flex gap-2">
                        <FormControl>
                          <Input
                            v-bind="componentField"
                            type="tel"
                            placeholder="请输入手机号"
                            class="flex-1"
                          />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline"
                          @click="handleSendVerifyCode"
                          :disabled="!codeShow"
                        >
                          {{ codeShow ? '发送验证码' : `${count}秒后重试` }}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  </FormField>

                  <FormField 
                    v-slot="{ componentField }" 
                    name="code"
                    :validate-on-blur="!isFieldDirty('code')"
                  >
                    <FormItem>
                      <FormLabel>验证码</FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          type="text"
                          placeholder="请输入验证码"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  
                  <Button type="submit" class="w-full" :disabled="loading">
                    {{ loading ? '验证中...' : '验证' }}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="email">
                <form @submit="onSubmit" class="grid gap-4">
                  <FormField 
                    v-slot="{ componentField }" 
                    name="email"
                    :validate-on-blur="!isFieldDirty('email')"
                  >
                    <FormItem>
                      <FormLabel>邮箱</FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          type="email"
                          placeholder="example@example.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  
                  <Button type="submit" class="w-full" :disabled="loading">
                    {{ loading ? '发送中...' : '发送重置链接' }}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter class="flex flex-col gap-2">
            <div class="text-center text-sm text-muted-foreground">
              还没有账号？
              <Button
                variant="link"
                class="px-0 font-medium text-primary hover:text-primary/80"
                @click="$router.push('/auth/sign-up')"
              >
                立即注册
              </Button>
            </div>
          </CardFooter>
        </Card>
        <Card v-else>
          <CardHeader>
            <CardTitle>
              邮件发送成功
            </CardTitle>
            <CardDescription>
              重置密码链接已发送到您的邮箱，请查收并按照提示完成密码重置。
            </CardDescription>
          </CardHeader>
        </Card>
      </main>

      <Dialog v-model:open="showVerifyDialog">
        <DialogContent class="flex items-center justify-center p-6">
          <dragVerify :onSuccess="onVerifySuccess" />
        </DialogContent>
      </Dialog>

      <Toast />
    </div>
  </ToastProvider>
</template>

<style scoped>
</style>

<route lang="yaml">
  meta:
    layout: blank
</route>
