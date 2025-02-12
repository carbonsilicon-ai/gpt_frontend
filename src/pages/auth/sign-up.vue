<script setup lang="ts">
import AuthTitle from '@/components/AuthTitle.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PrivacyPolicyButton from './components/PrivacyPolicyButton.vue'
import TermsOfServiceButton from './components/TermsOfServiceButton.vue'
import dragVerify from './components/dragVerify.vue'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useToast, ToastProvider } from '@/components/ui/toast'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { isEmail, isMobile } from '@/utils/validate.js'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useRouter } from 'vue-router'

const signup_api = ref(null)
const send_code = ref(null)

const router = useRouter()

const loadApi = async () => {
  if (import.meta.env.VITE_APP_ENV === 'private') {
    const { signup_api: api1, send_code: code1 } = await import('@/api/user.js')
    signup_api.value = api1
    send_code.value = code1
  } else {
    const { signup_api: api2, send_code: code2 } = await import('@/api/drugflow_user.js')
    signup_api.value = api2
    send_code.value = code2
  }
}
loadApi()

const showVerifyDialog = ref(false)

const { toast } = useToast()

const activeTab = ref('phone')

const handleSendVerifyCode = async () => {
  const phoneRegex = /^1[3-9]\d{9}$/
  const formValues = form.values // Get current form values
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
const count = ref(60)
const codeShow = ref(true)
const timer = ref<any>(null)

const onVerifySuccess = async () => {
  showVerifyDialog.value = false
  
  // Start countdown after verification success
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
  send_code.value(formData)
    .then(res => {
      if(res.data.status == true || res.data.success == true){
        console.log(res);
      }else{
        toast({
          variant: "destructive",
          title: "错误",
          description: res.data.message
        })
      }
    })
    .catch(err => {
    })
}

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
    }),
  password: z.string()
    .min(6, { message: '密码长度至少6位' }),
  confirmPassword: z.string()
    .min(1, { message: '请确认密码' })
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
  
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "两次输入的密码不一致",
      path: ["confirmPassword"]
    })
  }
}))

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    telephone: '',
    code: '',
    email: '',
    password: '',
    confirmPassword: ''
  }
})

const { handleSubmit, isFieldDirty, resetForm } = form

const handleTabChange = (tab: string) => {
  resetForm()
}

const loading = ref(false)

const onSubmit = handleSubmit(async (values) => {
  console.log(values);
  loading.value = true
  try {
    let formData
    if (activeTab.value === 'phone') {
      if (import.meta.env.VITE_APP_ENV === 'private') {
        formData = {
          'phone': values.telephone,
          'email': 'drugflow@none.com',
          'password1': values.password,
          'password2': values.confirmPassword,
          'verification_code': values.code
        }
      } else {
        formData = new FormData()
        formData.append('telephone', values.telephone)
        formData.append('email', 'drugflow@none.com')
        formData.append('password1', values.password)
        formData.append('password2', values.confirmPassword)
        formData.append('verification_code', values.code)
        if (process.env.NODE_ENV === 'production') {
          formData.append('url', 'https://ai.drugflow.com')
        }
      }
    } else {
      if (import.meta.env.VITE_APP_ENV === 'private') {
        formData = {
          'email': values.email,
          'password1': values.password,
          'password2': values.confirmPassword
        }
      } else {
        formData = new FormData()
        formData.append('email', values.email)
        formData.append('password1', values.password)
        formData.append('password2', values.confirmPassword)
        if (process.env.NODE_ENV === 'production') {
          formData.append('url', 'https://ai.drugflow.com')
        }
      }
    }

    const response = await signup_api.value(formData)
    if (response.data.detail === 'ok' || response.data.success === true) {
      toast({
        title: "注册成功",
        description: "邮箱注册用户请先登录邮箱激活账号，手机注册用户可直接登录",
      })
      setTimeout(() => {
        router.push('/auth/sign-in')
      }, 1000)
    } else {
      toast({
        variant: "destructive",
        title: "错误",
        description: "注册失败请重试"
      })
    }
  } catch (err) {
    const errorMessage = (() => {
      if (err.response?.data?.code === 193) return '已存在该账号，请直接登录'
      if (err.response?.data?.code === 903) return '验证码错误'
      if (err.response?.data?.code === 904) return '验证码已超时请重新获取'
      if (err.response?.data?.code === 400) return err.response.data.message
      return err.response?.data?.detail || '注册失败'
    })()

    toast({
      variant: "destructive",
      title: "错误",
      description: errorMessage
    })
  } finally {
    loading.value = false
  }
})

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
        <Card class="max-w-sm mx-auto">
          <CardHeader>
            <CardTitle class="text-xl">
              注册
            </CardTitle>
            <CardDescription>
              输入您的手机号或邮箱以创建账号。
              已有账号？
              <Button
                variant="link" class="px-0 font-medium text-primary"
                @click="$router.push('/auth/sign-in')"
              >
                登录
              </Button>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs v-model="activeTab" class="w-full" @update:value="handleTabChange">
              <TabsList class="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="phone">手机号</TabsTrigger>
                <TabsTrigger value="email">邮箱</TabsTrigger>
              </TabsList>
              <form @submit="onSubmit" class="grid gap-4">
                <TabsContent value="phone">
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
                </TabsContent>

                <TabsContent value="email">
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
                </TabsContent>

                <!-- Common password fields for both tabs -->
                <FormField 
                  v-slot="{ componentField }" 
                  :name="'password'"
                  :validate-on-blur="!isFieldDirty('password')"
                >
                  <FormItem>
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <Input 
                        v-bind="componentField"
                        type="password" 
                        placeholder="******" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField 
                  v-slot="{ componentField }" 
                  :name="'confirmPassword'"
                  :validate-on-blur="!isFieldDirty('confirmPassword')"
                >
                  <FormItem>
                    <FormLabel>确认密码</FormLabel>
                    <FormControl>
                      <Input 
                        v-bind="componentField"
                        type="password" 
                        placeholder="******" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <Button type="submit" class="w-full" :disabled="loading">
                  {{ loading ? '注册中...' : '创建账号' }}
                </Button>
              </form>
            </Tabs>

            <CardDescription class="mt-4">
              创建账号即表示您同意我们的
              <TermsOfServiceButton />
              和
              <PrivacyPolicyButton />
            </CardDescription>
          </CardContent>
        </Card>
      </main>
    </div>

    <Dialog v-model:open="showVerifyDialog">
      <DialogContent class="flex items-center justify-center p-6">
        <dragVerify :onSuccess="onVerifySuccess" />
      </DialogContent>
    </Dialog>

    <Toast />
  </ToastProvider>
</template>

<route lang="yaml">
  meta:
    layout: blank
</route>
