// 保存Artalk实例的引用
let artalkInstance: any = null;

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

document.addEventListener("nav", () => {
  const artalkContainer: HTMLElement | null = document.getElementById("artalk-comments")
  if (artalkContainer) {
    // 动态加载Artalk CSS
    const loadArtalkCSS = () => {
      if (document.querySelector(`link[href*='Artalk.css']`)) {
        return
      }

      const server: string = artalkContainer.getAttribute("data-server") || ""
      const cssUrl: string = `${server}/dist/Artalk.css`
      
      const link: HTMLLinkElement = document.createElement("link")
      link.rel = "stylesheet"
      link.type = "text/css"
      link.href = cssUrl
      document.head.appendChild(link)
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

    loadArtalkCSS()
    loadArtalk()

    // 监听主题和ReaderMode变化
    document.addEventListener("themechange" as any, changeArtalkTheme)
    document.addEventListener("readermodechange" as any, changeArtalkReaderMode)
    
    if (window && (window as any).addCleanup) {
      (window as any).addCleanup(() => {
        document.removeEventListener("themechange" as any, changeArtalkTheme)
        document.removeEventListener("readermodechange" as any, changeArtalkReaderMode)
      })
    }
  }
})