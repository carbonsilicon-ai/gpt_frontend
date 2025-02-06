import SlideVerify from 'vue-monoplasty-slide-verify'
import { createVNode, render, nextTick } from 'vue'

export function useVerify() {
  const showSlideVerify = () => {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const container = document.createElement('div')
        container.style.position = 'fixed'
        container.style.top = '50%'
        container.style.left = '50%'
        container.style.transform = 'translate(-50%, -50%)'
        container.style.zIndex = '9999'
        container.style.backgroundColor = 'white'
        container.style.padding = '20px'
        container.style.borderRadius = '8px'
        container.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.15)'
        
        console.log('创建验证容器')

        const vnode = createVNode(SlideVerify, {
          onSuccess: () => {
            console.log('验证成功')
            resolve(true)
            // 延迟移除，让用户看到成功动画
            setTimeout(() => {
              render(null, container)
              container.remove()
            }, 500)
          },
          onFail: () => {
            console.log('验证失败')
            resolve(false)
          },
          onClose: () => {
            console.log('验证关闭')
            resolve(false)
            render(null, container)
            container.remove()
          },
          // 可选配置
          w: 350,
          h: 175,
          sliderText: '向右滑动',
          text: '请完成人机验证'
        })
        
        render(vnode, container)
        document.body.appendChild(container)

        // 确保组件已经挂载
        nextTick(() => {
          const slideVerifyElement = container.querySelector('.slide-verify')
          if (!slideVerifyElement) {
            reject(new Error('验证组件加载失败'))
            container.remove()
          }
        })
      } catch (error) {
        console.error('验证组件初始化失败:', error)
        reject(error)
      }
    })
  }

  return {
    showSlideVerify
  }
}