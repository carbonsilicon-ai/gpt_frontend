export async function init_ketcher_module(domId) {
    try {
      for (let i = 0; i < 3000; i++) {
        const ketcherFrame = document.getElementById(domId)
  
        if ('contentDocument' in ketcherFrame) {
          window.ketcher = ketcherFrame.contentWindow.ketcher
        } else {
          window.ketcher = document.frames[domId].window.ketcher
        }
        if (window.ketcher) {
          return true
        } else {
          console.log('ketcher wait!')
          await sleep(100)
        }
      }
      return false
    } catch {
      console.log('wait ketcher')
    }
  }
  
  export const sleep = (delaytime = 1000) => {
    return new Promise(resolve => setTimeout(resolve, delaytime))
  }