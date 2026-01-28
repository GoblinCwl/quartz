// 处理标题链接点击事件，复制当前页面URL
document.addEventListener("click", function(event) {
  const target = event.target as HTMLElement;
  if (target.classList.contains("title-link-button") || target.closest(".title-link-button")) {
    event.preventDefault();
    
    const button = (target.classList.contains("title-link-button") ? 
      target : target.closest(".title-link-button")) as HTMLElement;
    
    // 检查是否为纯净模式
    const isPureMode = new URLSearchParams(window.location.search).get('pure') === 'true';
    
    // 构建URL，使用decodeURIComponent来解码路径
    let origin = window.location.origin;
    let pathname = decodeURIComponent(window.location.pathname); // 解码路径部分
    let url = origin + pathname;
    const params = new URLSearchParams(window.location.search);
    
    if (isPureMode) {
      params.set('pure', 'true');
    } else {
      params.delete('pure'); // 确保非纯净模式下不包含pure参数
    }
    
    if (params.toString()) {
      url += '?' + params.toString();
    }
    
    // 复制URL到剪贴板
    navigator.clipboard.writeText(url).then(() => {
      console.log('Link copied to clipboard:', url);
      
      // 实现向上弹起动画
      button.style.transition = 'transform 0.2s ease';
      button.style.transform = 'translateY(-5px)'; // 向上移动5px
      
      // 恢复原位置
      setTimeout(() => {
        button.style.transform = 'translateY(0)';
        // 移除过渡效果，以便下次点击时重新应用
        setTimeout(() => {
          button.style.transition = '';
        }, 200);
      }, 200);
      
    }).catch(err => {
      console.error('Failed to copy link: ', err);
    });
  }
});