import axios from 'axios'
import router from '../router'
// import { useRouter } from 'vue-router'
import { useToast } from '@/components/ui/toast'

let baseURL = ''
// const router = useRouter()
// const router = Vrouter

export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

const instance = axios.create({
  baseURL,
  headers: {
    'content-type': 'application/json'
  },
  withCredentials: true
})

// 请求拦截器
// 设置axios请求头加入token
instance.interceptors.request.use(
  config => {
    // config.headers.token = localStorage.getItem('csrf_access_token')
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    // config.headers['X-CSRF-TOKEN'] = localStorage.getItem('csrf_access_token') || ''
    const csrfAccessToken = getCookie('csrf_access_token');
    config.headers['X-CSRF-TOKEN'] = csrfAccessToken
    if (config.url.indexOf('knowledge_base/download') !== -1) {
      config.responseType = 'blob'
      config.headers['content-type'] = 'application/octet-stream'
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  response => {
    return response
  },
  error => {
   if (error.response.status === 401) {
      if (error.response.data.message === 'Signature verification failed' || error.response.data.message === 'Signature has expired') {
        useToast().toast({
          variant: "destructive",
          title: "Error",
          description: "您的登录已失效，请先登录"
        })
      } else {
        // console.log('您未登录，请先登录')
      }
      router.push('/auth/sign-in')
    //   router.push({ name: 'signin' })
    }else if ([502, 404, 500, 401].includes(error.response.status)) {
      useToast().toast({
        variant: "destructive",
        title: "Error", 
        description: error?.response?.config?.url + ' error!\n ' + error.message
      })
    }
    return Promise.reject(error)
  }
)

export default instance
