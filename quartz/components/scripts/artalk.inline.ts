// 保存Artalk实例的引用
let artalkInstance: any = null;

// 预加载Artalk资源
const preloadArtalkResources = () => {
  const artalkContainer: HTMLElement | null = document.getElementById("artalk-comments");
  if (!artalkContainer) {
    return;
  }
  
  const server: string = artalkContainer.getAttribute("data-server") || "";
  
  // 检查是否已经预加载过
  if (document.querySelector(`link[href*="${server}/dist/Artalk.css"][rel="preload"]`)) {
    return;
  }
  
  // 预加载 CSS
  const cssLink = document.createElement("link");
  cssLink.rel = "preload";
  cssLink.as = "style";
  cssLink.href = `${server}/dist/Artalk.css`;
  cssLink.crossOrigin = "anonymous";
  document.head.appendChild(cssLink);
  
  // 预加载 JS
  const jsLink = document.createElement("link");
  jsLink.rel = "preload";
  jsLink.as = "script";
  jsLink.href = `${server}/dist/Artalk.js`;
  jsLink.crossOrigin = "anonymous";
  document.head.appendChild(jsLink);
};

// 检查页面是否被加密
const isPageEncrypted = (): boolean => {
  const lockElement = document.getElementById("lock");
  return lockElement !== null && lockElement.classList.contains("hidden") === false;
};

// Artalk主题切换处理
const changeArtalkTheme = (e: any) => {
  const theme: string = e.detail.theme
  const isDarkMode: boolean = theme === "dark"
  
  if (artalkInstance && typeof artalkInstance.setDarkMode === 'function') {
    try {
      artalkInstance.setDarkMode(isDarkMode)
    } catch (error) {
      console.warn('Could not update Artalk theme:', error)
      localStorage.setItem('artalk-theme-preference', isDarkMode ? 'dark' : 'light')
    }
  } else {
    localStorage.setItem('artalk-theme-preference', isDarkMode ? 'dark' : 'light')
  }
}

// 处理ReaderMode变化
const changeArtalkReaderMode = (e: any) => {
  const mode: string = e.detail.mode
  const artalkContainer = document.getElementById("artalk-comments")
  if (artalkContainer) {
    if (mode === "on") {
      artalkContainer.classList.add("readermode-enabled")
    } else {
      artalkContainer.classList.remove("readermode-enabled")
    }
  }
}

// 尝试加载Artalk
const tryLoadArtalk = () => {
  const artalkContainer: HTMLElement | null = document.getElementById("artalk-comments")
  if (!artalkContainer) {
    return;
  }
  
  // 添加loading类以隐藏容器，避免FOUC
  artalkContainer.classList.add("artalk-loading");
  
  // 动态加载Artalk CSS
  const loadArtalkCSS = () => {
    return new Promise<void>((resolve) => {
      const server: string = artalkContainer.getAttribute("data-server") || ""
      const cssUrl: string = `${server}/dist/Artalk.css`
      
      // 检查是否已经加载了相同的CSS
      const existingLink = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .find((link: HTMLLinkElement) => link.href === cssUrl) as HTMLLinkElement;
        
      if (existingLink) {
        // 如果CSS已经加载，直接resolve
        resolve();
        return;
      }

      const link: HTMLLinkElement = document.createElement("link")
      link.rel = "stylesheet"
      link.type = "text/css"
      link.href = cssUrl
      link.crossOrigin = "anonymous";
      
      // 等待CSS加载完成后再resolve
      link.onload = () => {
        // 确保浏览器完成样式计算后再显示容器
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // 两次raf确保样式完全应用
            artalkContainer.classList.remove("artalk-loading");
          });
        });
        resolve();
      };
      
      link.onerror = () => {
        // 即使CSS加载失败也显示容器，避免组件完全不显示
        artalkContainer.classList.remove("artalk-loading");
        resolve(); // 即使出错也要resolve，不要阻塞后续流程
      };
      
      document.head.appendChild(link)
    });
  }

  // 动态加载Artalk脚本
  const loadArtalk = () => {
    if ((window as any).Artalk) {
      initArtalk()
      return
    }

    const artalkScript: HTMLScriptElement = document.createElement("script")
    const server: string = artalkContainer.getAttribute("data-server") || ""
    artalkScript.src = `${server}/dist/Artalk.js`
    artalkScript.crossOrigin = "anonymous";
    artalkScript.onload = () => {
      initArtalk()
      const savedTheme: string | null = localStorage.getItem('artalk-theme-preference')
      if (savedTheme) {
        setTimeout(() => {
          if (artalkInstance && typeof artalkInstance.setDarkMode === 'function') {
            const isDarkMode: boolean = savedTheme === 'dark'
            artalkInstance.setDarkMode(isDarkMode)
          }
        }, 100)
      }
    }
    artalkScript.onerror = () => {
      console.error("Failed to load Artalk script from server")
      const fallbackScript: HTMLScriptElement = document.createElement("script")
      fallbackScript.src = "https://cdn.jsdelivr.net/npm/artalk@2.9.1/dist/Artalk.js"
      fallbackScript.crossOrigin = "anonymous";
      fallbackScript.onload = () => {
        initArtalk()
        const savedTheme: string | null = localStorage.getItem('artalk-theme-preference')
        if (savedTheme) {
          setTimeout(() => {
            if (artalkInstance && typeof artalkInstance.setDarkMode === 'function') {
              const isDarkMode: boolean = savedTheme === 'dark'
              artalkInstance.setDarkMode(isDarkMode)
            }
          }, 100)
        }
      }
      fallbackScript.onerror = () => {
        console.error("Failed to load Artalk script from CDN fallback")
      }
      document.head.appendChild(fallbackScript)
    }
    document.head.appendChild(artalkScript)
  }

  // 初始化Artalk
  const initArtalk = () => {
    if (!(window as any).Artalk) {
      console.error("Artalk is not loaded")
      return
    }

    const server: string = artalkContainer.getAttribute("data-server") || ""
    const site: string = artalkContainer.getAttribute("data-site") || ""
    const theme: string = artalkContainer.getAttribute("data-theme") || "light"
    const lang: string = artalkContainer.getAttribute("data-lang") || "zh-CN"
    const useBackendConf: boolean = artalkContainer.getAttribute("data-use-backend-conf") === "true"
    const pageKey: string = artalkContainer.getAttribute("data-page-key") || ""
    const pageTitle: string = artalkContainer.getAttribute("data-page-title") || ""
    
    const currentTheme: string = document.documentElement.getAttribute('saved-theme') || document.documentElement.getAttribute('data-theme') || 'light'
    const isCurrentlyDark: boolean = currentTheme === 'dark'

      // @ts-ignore - Artalk API
      artalkInstance = (window as any).Artalk.init({
        el: "#artalk-comments",
        pageKey: pageKey,
        pageTitle: pageTitle,
        server: server,
        site: site,
        theme: theme,
        lang: lang,
        darkMode: isCurrentlyDark,
        useBackendConf: useBackendConf,
      })

      const storedTheme = localStorage.getItem('artalk-theme-preference')
      if (storedTheme) {
        setTimeout(() => {
          if (artalkInstance && typeof artalkInstance.setDarkMode === 'function') {
            // @ts-ignore - Artalk API
            artalkInstance.setDarkMode(storedTheme === 'dark')
          }
        }, 100)
      }
    }

    // 先加载CSS，等CSS加载完成后再加载JS
    loadArtalkCSS().then(() => {
      loadArtalk();
    });

  // 监听主题和ReaderMode变化
  document.addEventListener("themechange" as any, changeArtalkTheme)
  document.addEventListener("readermodechange" as any, changeArtalkReaderMode)
  
  if (window && (window as any).addCleanup) {
    (window as any).addCleanup(() => {
      document.removeEventListener("themechange" as any, changeArtalkTheme)
      document.removeEventListener("readermodechange" as any, changeArtalkReaderMode)
    })
  }
};

// 检查页面加密状态并在适当时候加载Artalk
const handleArtalkLoading = () => {
  // 预加载资源
  preloadArtalkResources();
  
  // 如果页面没有被加密，直接加载Artalk
  if (!isPageEncrypted()) {
    tryLoadArtalk();
    return;
  }

  // 如果页面被加密，等待解密完成事件
  document.addEventListener('decryptComplete', () => {
    // 延迟加载，确保内容已完全替换
    setTimeout(() => {
      tryLoadArtalk();
    }, 100);
  });
};

// 在导航事件中处理Artalk加载
document.addEventListener("nav", handleArtalkLoading);