<script setup lang="ts">
import AuthTitle from '@/components/AuthTitle.vue'
import { ref, reactive } from 'vue'
import { useStore } from '@/stores/index.js'
import { storeToRefs } from 'pinia'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import PrivacyPolicyButton from './components/PrivacyPolicyButton.vue'
import TermsOfServiceButton from './components/TermsOfServiceButton.vue'
import ToForgotPasswordLink from './components/ToForgotPasswordLink.vue'
import { isEmail, isMobile } from '@/utils/validate.js'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { toTypedSchema } from '@vee-validate/zod'

const formSchema = toTypedSchema(z.object({
  email: z.string()
    .min(1, { message: '请输入邮箱或手机号' })
    .refine((val) => isEmail(val) || isMobile(val), {
      message: '请输入正确的邮箱或手机号'
    }),
  password: z.string()
    .min(1, { message: '请输入密码' })
}))

interface FormData {
  phone?: string;
  email?: string;
  password?: string;
  machine_id?: string;
}

const { toast } = useToast()
const signin_api = ref<any>(null)
const get_csrf_token = ref<any>(null)
const if_ldap = ref(false)
const router = useRouter()

const loadApi = async () => {
  if (import.meta.env.VITE_APP_ENV === 'private' || import.meta.env.VITE_APP_ENV === 'ldap') {
    const { signin_api: api1, get_csrf_token: code2 } = await import('@/api/user.js')
    signin_api.value = api1
    get_csrf_token.value = code2
    if (import.meta.env.VITE_APP_ENV === 'ldap') {
      if_ldap.value = true
    }
  } else {
    const { signin_api: api2, get_csrf_token: code2 } = await import('@/api/drugflow_user.js')
    signin_api.value = api2
    get_csrf_token.value = code2
  }
}

loadApi()

const store = useStore()
const btn_loading = ref(false)

const { handleSubmit, isFieldDirty } = useForm({
  validationSchema: formSchema,
  initialValues: {
    email: '',
    password: ''
  }
})

const getCanvasFingerprint = async () => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  
  const txt = 'i9asdm..$#po((^@KbXrww!'
  ctx.textBaseline = 'top'
  ctx.font = "14px 'Arial'"
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#f60'
  ctx.fillRect(125, 1, 62, 20)
  ctx.fillStyle = '#069'
  ctx.fillText(txt, 2, 15)
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
  ctx.fillText(txt, 4, 17)
  const dataURL = canvas.toDataURL()
  canvas.remove()

  let hash = 0
  for (let i = 0; i < dataURL.length; i++) {
    const char = dataURL.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return hash.toString(16)
}

const parse_err = (detail: any) => {
  let ret = ''
  for (let i = 0; i < detail.email?.length; i++) {
    if (detail.email[i] == 'Email or Telephone does not exist') {
      ret = '账号或者密码错误'
    }
    if (detail.email[i] == 'User is not active') {
      ret = '账号未激活，请先前往邮箱激活账号'
    }
  }
  for (let i = 0; i < detail.password?.length; i++) {
    if (detail.password[i] == 'Password is not match') {
      ret = '账号或者密码错误'
    }
  }
  return ret
}

// const onSubmit = handleSubmit((values) => {
//   toast({
//     title: 'You submitted the following values:',
//     description: h('pre', { class: 'mt-2 w-[340px] rounded-md bg-slate-950 p-4' }, h('code', { class: 'text-white' }, JSON.stringify(values, null, 2))),
//   })
// })

const onSubmit = handleSubmit(async (values) => {
  console.log('Form Submitted:', values)
  btn_loading.value = true
  
  let formData: FormData | Record<string, string>
  if (import.meta.env.VITE_APP_ENV === 'private' || import.meta.env.VITE_APP_ENV === 'ldap') {
    formData = {
      phone: isMobile(values.email) ? values.email : '12345678901',
      email: isMobile(values.email) ? 'drugflow@none.com' : values.email,
      password: values.password,
      machine_id: await getCanvasFingerprint()
    }
  } else {
    formData = new FormData()
    if (isMobile(values.email)) {
      formData.append('phone', values.email)
      formData.append('email', 'drugflow@none.com')
    } else {
      formData.append('email', values.email)
      formData.append('phone', '123456789')
    }
    formData.append('password', values.password)
  }

  try {
    if (!signin_api.value) throw new Error('API not loaded')
    const res = await signin_api.value(formData)
    
    if (res.data?.detail == 'ok' || res.data?.success == true) {
      if (!get_csrf_token.value) throw new Error('CSRF token API not loaded')
      const csrfRes = await get_csrf_token.value()
      btn_loading.value = false
      localStorage.setItem('csrf_access_token', csrfRes.data.csrf_token)

      router.push('/')
    } else {
      btn_loading.value = false
      toast({
        title: "错误",
        description: res.data.detail,
        variant: "destructive"
      })
    }
  } catch (err: any) {
    btn_loading.value = false
    toast({
      title: "错误", 
      description: err.response?.data?.detail ? parse_err(err.response.data.detail) : (err.response?.data?.message || err.message),
      variant: "destructive"
    })
  }
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen p-4 min-w-screen">
    <main class="flex flex-col gap-4">
      <AuthTitle />
      <Card class="w-full max-w-sm">
        <CardHeader>
          <CardTitle class="text-2xl">
            登录
          </CardTitle>
          <CardDescription>
            Drugflow账户可直接登录。还没有账号？
            <Button
              variant="link" class="px-0 font-medium text-primary"
              @click="$router.push('/auth/sign-up')"
            >
              立即注册
            </Button>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit="onSubmit" class="grid gap-4">
            <FormField 
              v-slot="{ componentField }" 
              name="email" 
              :validate-on-blur="!isFieldDirty"
            >
              <FormItem>
                <FormLabel>邮箱/手机号</FormLabel>
                <FormControl>
                  <Input 
                    v-bind="componentField"
                    type="text" 
                    placeholder="m@example.com/137****2121" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField 
              v-slot="{ componentField }" 
              name="password"
              :validate-on-blur="!isFieldDirty"
            >
              <FormItem>
                <div class="flex items-center justify-between">
                  <FormLabel>密码</FormLabel>
                  <ToForgotPasswordLink />
                </div>
                <FormControl>
                  <Input 
                    v-bind="componentField"
                    type="password" 
                    placeholder="*********" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <Button type="submit" class="w-full" :loading="btn_loading">
              提交
            </Button>

            <CardDescription>
              点击登录即表示您同意我们的
              <TermsOfServiceButton />
              和
              <PrivacyPolicyButton />
            </CardDescription>
          </form>
        </CardContent>
      </Card>
    </main>
  </div>
</template>

<style scoped>
</style>

<route lang="yaml">
  meta:
    layout: blank
</route>
