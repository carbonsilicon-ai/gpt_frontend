import request from '@/utils/request.js'

// const targetUlr = 'http://82.157.60.204:8008'
// const targetUlr = 'https://ai-api.drugflow.com'


export function get_users_role() {
  return request.get('/api/v1/this')
}

// 注册
export function signup_api(params) {
  return request.post('/api/v1/signup_for_gpt', params)
}
// 登录
export function signin_api(params) {
  return request.post('/api/v1/login', params)
}
// 登录
export function get_csrf_token(params) {
  // return request.post('/api/v1/get_csrf_token', params)
  // mock 接口
  return Promise.resolve({
    data: {
      csrf_token: '1234567890'
    }
  })
}

// 验证码
export function send_code(params) {
  return request.post('api/v1/send_verification_code', params)
}
export function verification_api(form) {
  return request.post('/api/v1/verification_code', form)
}
//忘记密码
export function forgot_password_api(params) {
  return request.post(`/api/v1/password-recovery/${params.email}`, params)
}
//重置密码
export function reset_password_api(params) {
  return request.post(`/api/v1/reset-password`, params)
}

//邮箱验证token
export function activate_api(params) {
  const url = '/api/v1/activate?token=' + params
  return request.get(url)
}

export function reset_password_get_api() {
  const url = '/api/v1/reset_password?token=' + params
  return request.get(url)
}

export function reset_password_post_api(token, params) {
  const url = '/api/v1/reset_password_post?token=' + token
  return request.post(url, params)
}

//登出
export function signout_api(params) {
  return request.post('/api/v1/logout', params)
}
// 获取用户信息
export function get_user() {
  return request.get('/api/v1/users/me')
}
//邮箱重新激活
export function re_activate_api(params) {
  return request.post('/api/v1/send_active_email', params)
}

