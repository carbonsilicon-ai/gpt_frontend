import request from '@/utils/request.js'
export function signup_api(params) {
  return get_csrf_token().then(res => {
    localStorage.setItem('csrf_access_token', res.data.csrf_token)
    return request.post('/trans/signup_for_gpt', params)
  })
}

export function signin_api(params) {
  return get_csrf_token().then(res => {
    localStorage.setItem('csrf_access_token', res.data.csrf_token)
    return request.post('/trans/signin', params)
  })
}

export function re_activate_api(params) {
  return get_csrf_token().then(res => {
    localStorage.setItem('csrf_access_token', res.data.csrf_token)
    return request.post('/trans/re_activate', params)
  })
}

export function signout_api(params) {
  return get_csrf_token().then(res => {
    localStorage.setItem('csrf_access_token', res.data.csrf_token)
    return request.post('/trans/signout', params)
  })
}

export function forgot_password_api(params) {
  return get_csrf_token().then(res => {
    localStorage.setItem('csrf_access_token', res.data.csrf_token)
    return request.post('/trans/forgot_password', params)
  })
}

export function reset_password_get_api(params) {
  const url = '/trans/reset_password?token=' + params
  return request.get(url)
}

export function reset_password_post_api(token, params) {
  const url = '/trans/reset_password?token=' + token
  return get_csrf_token().then(res => {
    localStorage.setItem('csrf_access_token', res.data.csrf_token)
    return request.post(url, params)
  })
}

export function activate_api(params) {
  const url = '/trans/activate?token=' + params
  return request.get(url)
}

export function get_csrf_token() {
  return request.get('/trans/get_csrf_token')
}

export function get_users_role() {
  return request.get('/trans/api/users/this')
}

export function send_code(form) {
  return get_csrf_token().then(res => {
    localStorage.setItem('csrf_access_token', res.data.csrf_token)
    return request.post('/trans/api/send_phone_verification_code', form)
  })
}

export function verification_api(form) {
  return get_csrf_token().then(res => {
    localStorage.setItem('csrf_access_token', res.data.csrf_token)
    return request.post('/trans/api/verification_code', form)
  })
}
