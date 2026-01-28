(function checkPureMode() {
  function applyPureMode() {
    const urlParams = new URLSearchParams(window.location.search)
    const isPureMode = urlParams.get('pure') === 'true'
    
    if (isPureMode) {
      // 添加纯净模式类
      document.documentElement.classList.add('pure-mode')
      document.body.classList.add('pure-mode')
      
      // 更新页脚内容
      updateFooterForPureMode()
    } else {
      // 如果不是纯净模式，移除相关类
      document.documentElement.classList.remove('pure-mode')
      document.body.classList.remove('pure-mode')
    }
  }
  
  function updateFooterForPureMode() {
    // 获取当前URL但移除pure参数
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.delete('pure')
    
    // 获取页面标题或路径作为显示文本
    const pageTitle = document.title || currentUrl.pathname.split('/').pop() || 'Page'
    
    // 找到所有footer元素并替换其内容
    const footers = document.querySelectorAll('footer')
    footers.forEach(footer => {
      // 创建新的纯净模式页脚内容
      const footerDiv = document.createElement('div')
      footerDiv.className = 'pure-mode-footer'
      footerDiv.innerHTML = `pure mode from <a href="${currentUrl.href}">${pageTitle}</a>`
      
      // 替换页脚内容
      footer.innerHTML = ''
      footer.appendChild(footerDiv)
    })
  }
  
  // 初始执行
  applyPureMode()
  
  // 监听浏览器前进/后退事件
  window.addEventListener('popstate', applyPureMode)
  
  // 监听Quartz SPA自定义事件（如果存在）
  if (typeof document !== 'undefined') {
    document.addEventListener('nav', applyPureMode)
  }
})();