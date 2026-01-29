// 图片加载遮罩和动画效果脚本
function initImageLoading() {
  // 获取所有图片元素
  const images = document.querySelectorAll("img:not(.image-loading-initialized)")
  
  images.forEach(img => {
    // 标记为已初始化
    img.classList.add("image-loading-initialized")
    
    // 添加loading类
    img.classList.add("image-loading")
    
    // 检查图片是否已经加载
    // @ts-ignore
    if (img.complete) {
      // 如果图片已经加载，则直接添加loaded类
      // @ts-ignore
      addLoadedClass(img)
    } else {
      // 监听图片加载事件
      img.addEventListener("load", () => {
        // @ts-ignore
        addLoadedClass(img)
      })
      
      // 监听图片加载失败事件
      img.addEventListener("error", () => {
        // 加载失败时也移除加载效果，但可以添加错误指示
        const container = img.parentElement
        if (container?.classList.contains("image-container")) {
          container.classList.add("loaded")
        }
        img.classList.remove("image-loading")
        img.classList.add("loaded")
      })
    }
  })
  
  function addLoadedClass(img: HTMLImageElement) {
    // 添加loaded类以触发动画效果
    img.classList.remove("image-loading")
    img.classList.add("loaded")
    
    // 找到图片的容器并标记为已加载
    const container = img.parentElement
    if (container?.classList.contains("image-container")) {
      container.classList.add("loaded")
    }
  }
}

// 在DOM加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", initImageLoading)
} else {
  // 如果DOM已经加载完成，则直接运行
  initImageLoading()
}

// 特别处理动态加载的内容（例如通过SPA导航加载的内容）
document.addEventListener("nav", () => {
  // 延迟一点时间以确保新内容已添加到DOM中
  setTimeout(initImageLoading, 100)
})